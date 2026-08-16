// app.js
// v0.39：中文 / 日本語 / English。

function t(key) {
  return uiText(key);
}

const modeInputs = [...document.querySelectorAll('input[name="mode"]')];
const cvOptions = document.getElementById("cv-options");
const rentanOptions = document.getElementById("rentan-options");
const vcvOptions = document.getElementById("vcv-options");
const vcvCustomPanel = document.getElementById("vcv-custom-panel");
const previewSection = document.getElementById("preview-section");
const rentanSetPanel = document.getElementById("rentan-set-panel");
const rentanSetTitle = document.getElementById("rentan-set-title");
const rentanOptionsTitle = document.getElementById("rentan-options-title");
const rentanNumberingExample = document.getElementById("rentan-numbering-example");
const displayPanel = document.getElementById("display-panel");
const preview = document.getElementById("group-preview");
const output = document.getElementById("output");
const resultMeta = document.getElementById("result-meta");
const statusEl = document.getElementById("status");
const dirtyStatusEl = document.getElementById("dirty-status");
const foreignSectionTitle = document.getElementById("foreign-section-title");
const displaySectionTitle = document.getElementById("display-section-title");
const previewTitle = document.getElementById("preview-title");
const resultTitle = document.getElementById("result-title");
const tsCheckbox = document.querySelector('.foreign-toggle[value="TS"]');
const tsCard = document.getElementById("card-ts");
const tsNote = document.getElementById("ts-note");
const templateExample = document.getElementById("vcv-template-example");
const templateRule = document.getElementById("vcv-template-rule");
const moraSettingsTitle = document.getElementById("mora-settings-title");
const moraMinus = document.getElementById("mora-minus");
const moraPlus = document.getElementById("mora-plus");
const moraValueEl = document.getElementById("mora-value");
const moraRangeHint = document.getElementById("mora-range-hint");
const helperNote = document.getElementById("helper-note");
const helperDefaultText = document.getElementById("helper-default-text");
const helperRecommendedBadge = document.getElementById("helper-recommended-badge");
const cvvcNumberingRow = document.getElementById("cvvc-numbering-row");
const cvvcStartModeRow = document.getElementById("cvvc-start-mode-row");
const cvvc7MoraWarning = document.getElementById("cvvc-7mora-warning");
const coverageStartRow = document.getElementById("coverage-start-row");
const cvvcNumbering = document.getElementById("cvvc-numbering");
const coverageSummary = document.getElementById("coverage-summary");
const coverageVcvValue = document.getElementById("coverage-vcv-value");
const coverageStartValue = document.getElementById("coverage-start-value");
const coverageMissingValue = document.getElementById("coverage-missing-value");
const coverageMissingList = document.getElementById("coverage-missing-list");
const coverageMainLabel = document.getElementById("coverage-main-label");
const coverageStartLabel = document.getElementById("coverage-start-label");
const customInputs = {
  a: document.getElementById("vcv-custom-a"),
  i: document.getElementById("vcv-custom-i"),
  u: document.getElementById("vcv-custom-u"),
  e: document.getElementById("vcv-custom-e"),
  o: document.getElementById("vcv-custom-o")
};
const customStatus = document.getElementById("vcv-custom-status");
const languageInputs = [...document.querySelectorAll('input[name="language"]')];
const exportEncodingInputs = [...document.querySelectorAll('input[name="export-encoding"]')];

let lastVcvBuild = null;
let lastCvvcBuild = null;
let previousMode = null;
let outputDirty = false;
const moraByMode = { vcv: 8, cvvc: 8 };

function getMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

function getSettings() {
  return {
    mode: getMode(),
    foreign: new Set(
      [...document.querySelectorAll(".foreign-toggle:checked")].map(el => el.value)
    ),
    cvExtras: new Set(
      [...document.querySelectorAll(".cv-extra-toggle:checked")].map(el => el.value)
    ),
    shortU: document.getElementById("short-u-toggle").checked,
    yiMarked: document.querySelector('input[name="yi"]:checked').value === "marked",
    wuMarked: document.querySelector('input[name="wu"]:checked').value === "marked",
    fuMarked: document.querySelector('input[name="fu"]:checked').value === "marked",
    cvUnderscore: document.getElementById("cv-underscore").checked,
    rentanSet: document.querySelector('input[name="rentan-set"]:checked')?.value ?? "itsuki",
    rentanNumbering: document.getElementById("rentan-numbering").checked,
    vcvNPosition: document.querySelector('input[name="vcv-n-position"]:checked')?.value ?? "2",
    vcvMora: moraByMode[getMode()] ?? 8,
    vcvHelper: document.querySelector('input[name="vcv-helper"]:checked')?.value ?? "compact",
    cvvcNumbering: cvvcNumbering.checked,
    cvvcStartMode: document.querySelector('input[name="cvvc-start-mode"]:checked')?.value ?? "group",
    vcvCustom: {
      a: customInputs.a.value.trim(),
      i: customInputs.i.value.trim(),
      u: customInputs.u.value.trim(),
      e: customInputs.e.value.trim(),
      o: customInputs.o.value.trim()
    }
  };
}

function getRequiredGroups(settings) {
  if (settings.mode === "cv") return new Set(REQUIRED_GROUPS.cv ?? []);
  if (settings.mode === "vcv") return new Set(REQUIRED_GROUPS.vcv ?? []);
  if (settings.mode === "cvvc") return new Set(REQUIRED_GROUPS.cvvc ?? []);
  return new Set(REQUIRED_GROUPS.rentan?.[settings.rentanSet] ?? []);
}

function syncRequiredGroups() {
  const settings = getSettings();
  const required = getRequiredGroups(settings);

  const tsRequired = required.has("TS");
  if (tsRequired) {
    tsCheckbox.checked = true;
    tsCheckbox.disabled = true;
    tsCard.classList.add("required-card");
    tsNote.textContent = t("ts_required_note");
  } else {
    tsCheckbox.disabled = false;
    tsCard.classList.remove("required-card");
    tsNote.textContent = t("ts_normal_note");
  }
}

function isEnabledGroup(id, settings) {
  if (BASE_GROUP_IDS.has(id)) return true;

  // 树月式VCV / CVVC内置TS，不再交给用户选择。
  if ((settings.mode === "vcv" || settings.mode === "cvvc") && id === "TS") return true;

  if (getRequiredGroups(settings).has(id)) return true;
  return settings.foreign.has(id);
}

function rawSequenceForGroup(id, settings) {
  const group = GROUPS[id];
  if (!group) return [];

  if (
    (settings.mode === "rentan" || settings.mode === "rentanfu") &&
    settings.rentanSet === "standard" &&
    RENTAN_STANDARD_OVERRIDES[id]
  ) {
    return [...RENTAN_STANDARD_OVERRIDES[id]];
  }

  return [...(group.sequence ?? group.cv)];
}

function displaySound(sound, groupId, settings, isSequenceHelper = false, forVcv = false) {
  if (forVcv) {
    if (sound === "い" && groupId === "Y" && settings.yiMarked) return "いぃ";
    if (sound === "う" && groupId === "W" && settings.wuMarked) return "うぅ";
    if (sound === "ふ" && groupId === "F" && settings.fuMarked) return "ふぅ";
    return sound;
  }

  if (sound === "い" && settings.yiMarked && isSequenceHelper) return "いぃ";
  if (sound === "う" && settings.wuMarked && isSequenceHelper) return "うぅ";
  if (sound === "ふ" && groupId === "F" && settings.fuMarked) return "ふぅ";
  return sound;
}

function getDisplaySequence(id, settings) {
  const group = GROUPS[id];
  const seq = rawSequenceForGroup(id, settings);
  const cvSet = new Set(group?.cv ?? []);

  return seq.map(sound => {
    const helper = !cvSet.has(sound);
    return {
      raw: sound,
      helper,
      display: displaySound(sound, id, settings, helper)
    };
  });
}

// -------------------------
// CV
// -------------------------

function getCvSoundsForGroup(id, settings) {
  const standardCv = {
    S: ["さ", "し", "す", "せ", "そ"],
    T: ["た", "ち", "つ", "て", "と"],
    Z: ["ざ", "じ", "ず", "ぜ", "ぞ"],
    D: settings.cvExtras.has("DI_DU")
      ? ["だ", "でぃ", "どぅ", "で", "ど"]
      : ["だ", "で", "ど"]
  };

  if (standardCv[id]) return [...standardCv[id]];
  return [...GROUPS[id].cv];
}

function getCvGroups(settings) {
  const result = [];
  const used = new Set();

  for (const id of CV_ORDER) {
    if (id === "__SHORT_U__") {
      if (settings.cvExtras.has("SI_ZI")) {
        const sounds = ["すぃ", "ずぃ"].filter(x => !used.has(x));
        sounds.forEach(x => used.add(x));
        if (sounds.length) result.push({ id: "SI_ZI", sounds });
      }

      if (settings.cvExtras.has("TI_TU")) {
        const sounds = ["てぃ", "とぅ"].filter(x => !used.has(x));
        sounds.forEach(x => used.add(x));
        if (sounds.length) result.push({ id: "TI_TU", sounds });
      }

      if (!settings.shortU) continue;
      const sounds = SHORT_U_SOUNDS.filter(x => !used.has(x));
      sounds.forEach(x => used.add(x));
      if (sounds.length) result.push({ id: "SHORT_U", sounds });
      continue;
    }

    if (!isEnabledGroup(id, settings)) continue;
    const unique = [];

    for (const sound of getCvSoundsForGroup(id, settings)) {
      if (used.has(sound)) continue;
      used.add(sound);
      unique.push(sound);
    }

    if (unique.length) result.push({ id, sounds: unique });
  }

  if (!used.has("ん")) {
    const vowelIndex = result.findIndex(x => x.id === "VOWEL");
    if (vowelIndex >= 0) {
      result.splice(vowelIndex + 1, 0, { id: "MORAIC_N", sounds: ["ん"] });
    } else {
      result.unshift({ id: "MORAIC_N", sounds: ["ん"] });
    }
  }

  return result;
}

function buildCvText(settings) {
  const groups = getCvGroups(settings);
  const prefix = settings.cvUnderscore ? "_" : "";
  return groups
    .map(group => group.sounds.map(sound => prefix + sound).join(" "))
    .join("\n");
}

function countCvSounds(settings) {
  return getCvGroups(settings)
    .reduce((sum, group) => sum + group.sounds.length, 0);
}

// -------------------------
// Rentan
// -------------------------

function getRentanGroups(settings) {
  const result = [];

  result.push({
    id: "VOWEL",
    lines: ["_あ", "_い", "_う", "_え", "_お", "_ん"],
    previewSounds: ["あ","い","う","え","お","ん"]
  });

  for (const id of RENTAN_ORDER) {
    if (id === "__SHORT_U__") {
      if (!settings.shortU) continue;
      const enabled = [...SHORT_U_SOUNDS];
      result.push({
        id: "SHORT_U",
        lines: ["_" + enabled.join("")],
        previewSounds: enabled
      });
      continue;
    }

    if (!isEnabledGroup(id, settings)) continue;

    const seq = getDisplaySequence(id, settings);
    if (!seq.length) continue;

    const text = seq.map(x => x.display).join("");
    const first = seq[0].display;

    result.push({
      id,
      lines: ["_" + text + first],
      previewSounds: seq.map(x => x.display),
      helperFlags: seq.map(x => x.helper)
    });
  }

  return result;
}

function buildRentanText(settings) {
  const groups = getRentanGroups(settings);
  let lines = [];

  for (let i = 0; i < groups.length; i++) {
    lines.push(...groups[i].lines);
    if (i < groups.length - 1) lines.push("");
  }

  if (!settings.rentanNumbering) return lines.join("\n");

  const nonEmpty = lines.filter(Boolean);
  const digits = Math.max(2, String(nonEmpty.length).length);
  let n = 0;

  return lines.map(line => {
    if (!line) return "";
    n += 1;
    return `${String(n).padStart(digits, "0")}${line}`;
  }).join("\n");
}

function getRentanFuGroups(settings) {
  const rentanGroups = getRentanGroups(settings);

  return rentanGroups.map(group => {
    // 母音和ん沿用れんたんじゅつ原本的单独行。
    if (group.id === "VOWEL") {
      return {
        ...group,
        lines: [...group.lines]
      };
    }

    // 其他组一条音频录多个彼此分开的单独音。
    // 不保留れんたんじゅつ句尾重复的第一个音。
    return {
      ...group,
      lines: ["_" + group.previewSounds.join("_")]
    };
  });
}

function buildRentanFuText(settings) {
  const groups = getRentanFuGroups(settings);
  let lines = [];

  for (let i = 0; i < groups.length; i++) {
    lines.push(...groups[i].lines);
    if (i < groups.length - 1) lines.push("");
  }

  if (!settings.rentanNumbering) return lines.join("\n");

  const nonEmpty = lines.filter(Boolean);
  const digits = Math.max(2, String(nonEmpty.length).length);
  let n = 0;

  return lines.map(line => {
    if (!line) return "";
    n += 1;
    return `${String(n).padStart(digits, "0")}${line}`;
  }).join("\n");
}




function getExistingVcvSounds(settings) {
  const sounds = new Set(["ん"]);

  for (const id of VCV_ORDER) {
    if (id === "__SHORT_U__") continue;
    if (!isEnabledGroup(id, settings)) continue;

    for (const sound of getVcvSequence(id)) {
      sounds.add(sound);
    }
  }

  if (settings.shortU) {
    SHORT_U_SOUNDS.forEach(sound => sounds.add(sound));
  }

  return sounds;
}

function getCustomVcvGroup(settings) {
  const values = ["a", "i", "u", "e", "o"].map(v => settings.vcvCustom[v]);
  const filled = values.filter(Boolean).length;

  if (filled === 0) return null;
  if (filled !== 5) return { incomplete: true, values };

  // 部分重复允许；五个都已经存在时不再添加。
  const existing = getExistingVcvSounds(settings);
  const allDuplicate = values.every(sound => existing.has(sound));

  if (allDuplicate) {
    return { duplicate: true, values };
  }

  return {
    id: "CUSTOM_VCV",
    sequence: values,
    vowelMap: {
      [values[0]]: "a",
      [values[1]]: "i",
      [values[2]]: "u",
      [values[3]]: "e",
      [values[4]]: "o"
    }
  };
}

function getVowel(sound, customGroup = null) {
  if (customGroup?.vowelMap?.[sound]) return customGroup.vowelMap[sound];
  return SOUNDS[sound]?.vowel ?? null;
}


function getMoraRange(mode) {
  return mode === "cvvc" ? { min: 4, max: 8 } : { min: 6, max: 8 };
}

function getLegalNPositions(mode, mora) {
  if (mode === "vcv") {
    const map = {
      6: [2, 3, 4, 5],
      7: [2, 3, 4, 5, 6],
      8: [2, 3, 4, 5, 6, 7]
    };
    return map[mora] ?? map[8];
  }

  const map = {
    4: [2, 3],
    5: [2, 3, 4],
    6: [2, 3, 4, 5],
    7: [2, 3, 4, 5, 6],
    8: [2, 3, 4, 5, 6, 7]
  };
  return map[mora] ?? map[8];
}

function syncMoraAndNControls() {
  const mode = getMode();
  if (mode !== "vcv" && mode !== "cvvc") return;

  const range = getMoraRange(mode);
  let mora = moraByMode[mode] ?? 8;
  mora = Math.max(range.min, Math.min(range.max, mora));
  moraByMode[mode] = mora;

  moraValueEl.textContent = `${mora} mora`;
  moraMinus.disabled = mora <= range.min;
  moraPlus.disabled = mora >= range.max;
  moraRangeHint.textContent = mode === "cvvc" ? t("mora_range_cvvc") : t("mora_range_vcv");

  const legal = getLegalNPositions(mode, mora);
  const radios = [...document.querySelectorAll('input[name="vcv-n-position"]')];
  const current = Number(document.querySelector('input[name="vcv-n-position"]:checked')?.value ?? legal[0]);

  radios.forEach(radio => {
    radio.disabled = !legal.includes(Number(radio.value));
  });

  if (!legal.includes(current)) {
    const fallback = Math.max(...legal);
    const radio = document.querySelector(`input[name="vcv-n-position"][value="${fallback}"]`);
    if (radio) radio.checked = true;
  }

  cvvc7MoraWarning.classList.toggle(
    "hidden",
    !(mode === "cvvc" && mora === 7)
  );
}

function setMora(delta) {
  const mode = getMode();
  if (mode !== "vcv" && mode !== "cvvc") return;

  const range = getMoraRange(mode);
  const current = moraByMode[mode] ?? 8;
  const next = Math.max(range.min, Math.min(range.max, current + delta));
  if (next === current) return;

  moraByMode[mode] = next;
  syncMoraAndNControls();
  markOutputDirty();
  updateVcvTemplateExample();
  refreshUiText();
}

// -------------------------
// VCV
// -------------------------

function targetKey(groupId, sound) {
  return `${groupId}::${sound}`;
}

function nTargetKey() {
  return "MORAIC_N::ん";
}

function makeToken(sound, groupId = null, target = false) {
  return {
    sound,
    groupId,
    targetKey: target ? (sound === "ん" ? nTargetKey() : targetKey(groupId, sound)) : null
  };
}

function getVcvSequence(id) {
  const group = GROUPS[id];
  return [...(group.sequence ?? group.cv)];
}

function getVcvTargetIndices(id, settings) {
  const group = GROUPS[id];
  const seq = getVcvSequence(id);

  if (VCV_FULL_SEQUENCE_GROUPS.has(id)) {
    return seq.map((_, i) => i);
  }

  if (VCV_HELPER_GROUPS.has(id)) {
    if (settings.vcvHelper === "full") {
      return seq.map((_, i) => i);
    }
    const cv = new Set(group.cv);
    return seq
      .map((sound, i) => cv.has(sound) ? i : -1)
      .filter(i => i >= 0);
  }

  return seq.map((_, i) => i);
}

function buildVcvRequiredTargets(settings) {
  const targets = [];

  for (const id of VCV_ORDER) {
    if (id === "__SHORT_U__") continue;
    if (!isEnabledGroup(id, settings)) continue;

    const seq = getVcvSequence(id);
    if (seq.length !== 5) continue;

    for (const idx of getVcvTargetIndices(id, settings)) {
      const raw = seq[idx];
      targets.push({
        key: targetKey(id, raw),
        groupId: id,
        raw,
        display: displaySound(raw, id, settings, false, true)
      });
    }
  }

  const customGroup = getCustomVcvGroup(settings);
  if (customGroup && !customGroup.incomplete && !customGroup.duplicate) {
    for (const raw of customGroup.sequence) {
      targets.push({
        key: targetKey(customGroup.id, raw),
        groupId: customGroup.id,
        raw,
        display: raw
      });
    }
  }

  if (settings.shortU) {
    for (const raw of SHORT_U_SOUNDS) {
      targets.push({
        key: targetKey("SHORT_U", raw),
        groupId: "SHORT_U",
        raw,
        display: raw
      });
    }
  }

  targets.push({
    key: nTargetKey(),
    groupId: "MORAIC_N",
    raw: "ん",
    display: "ん"
  });

  return targets;
}

function buildVcvFullMainLinesForGroup(id, settings) {
  const seq = getVcvSequence(id);
  const targetIndices = new Set(getVcvTargetIndices(id, settings));
  const template = VCV_8MORA_TEMPLATES[settings.vcvNPosition];
  const lines = [];

  for (const rowIndex of targetIndices) {
    const tokens = template.map(step => {
      if (step === "N") {
        return makeToken("ん", "MORAIC_N", true);
      }

      const idx = (rowIndex + step) % 5;
      const sound = seq[idx];
      return makeToken(sound, id, targetIndices.has(idx));
    });

    lines.push({
      groupId: id,
      kind: "main",
      rowIndex,
      tokens,
      text: "_" + tokens.map(t => displaySound(t.sound, id, settings, false, true)).join("")
    });
  }

  return lines;
}

function vcvCoverageEdgeKey(prevToken, curToken, customGroup = null) {
  if (!curToken?.targetKey) return null;
  const context = getVowel(prevToken.sound, customGroup);
  if (!context) return null;
  return `${curToken.targetKey}::${context}`;
}

function collectVcvEdgeCandidates(lines, customGroup = null) {
  const map = new Map();

  for (const line of lines) {
    const tokens = line.tokens ?? [];
    for (let i = 1; i < tokens.length; i++) {
      const key = vcvCoverageEdgeKey(tokens[i - 1], tokens[i], customGroup);
      if (!key || map.has(key)) continue;

      map.set(key, {
        key,
        from: tokens[i - 1].sound,
        to: tokens[i].sound
      });
    }
  }

  return map;
}

function getMissingVcvEdges(fullLines, shortenedLines, customGroup = null) {
  const full = collectVcvEdgeCandidates(fullLines, customGroup);
  const shortened = collectVcvEdgeCandidates(shortenedLines, customGroup);

  return [...full.values()].filter(edge => !shortened.has(edge.key));
}

function makeVcvSupplementToken(sound, id, settings, customGroup = null) {
  if (sound === "ん") {
    return makeToken("ん", "MORAIC_N", true);
  }

  if (customGroup) {
    return makeToken(sound, customGroup.id, true);
  }

  const seq = getVcvSequence(id);
  const idx = seq.indexOf(sound);
  const targetIndices = new Set(getVcvTargetIndices(id, settings));
  return makeToken(sound, id, idx >= 0 && targetIndices.has(idx));
}

function enumerateExactVcvTrails(edges, maxMora) {
  const n = edges.length;
  if (!n) return [];

  const trailsByMask = new Map();

  function addTrail(mask, nodes, edgeIndices) {
    const old = trailsByMask.get(mask);
    if (!old || nodes.length < old.nodes.length) {
      trailsByMask.set(mask, { mask, nodes: [...nodes], edgeIndices: [...edgeIndices] });
    }
  }

  function dfs(mask, nodes, edgeIndices) {
    addTrail(mask, nodes, edgeIndices);
    if (nodes.length >= maxMora) return;

    const last = nodes[nodes.length - 1];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) continue;
      const edge = edges[i];
      if (edge.from !== last) continue;

      dfs(
        mask | (1 << i),
        [...nodes, edge.to],
        [...edgeIndices, i]
      );
    }
  }

  for (let i = 0; i < n; i++) {
    dfs(1 << i, [edges[i].from, edges[i].to], [i]);
  }

  return [...trailsByMask.values()];
}

function findMinimumExactTrailCover(edges, maxMora) {
  const n = edges.length;
  if (!n) return [];
  if (n > 20) {
    // Short-mora VCV groups are small; this is only a safety fallback.
    return edges.map((edge, i) => ({
      mask: 1 << i,
      nodes: [edge.from, edge.to],
      edgeIndices: [i]
    }));
  }

  const allMask = (1 << n) - 1;
  const trails = enumerateExactVcvTrails(edges, maxMora);
  const trailsByEdge = Array.from({ length: n }, () => []);

  for (const trail of trails) {
    for (let i = 0; i < n; i++) {
      if (trail.mask & (1 << i)) trailsByEdge[i].push(trail);
    }
  }

  const memo = new Map();

  function solve(mask) {
    if (mask === allMask) return [];
    if (memo.has(mask)) return memo.get(mask);

    let first = 0;
    while (mask & (1 << first)) first++;

    let best = null;

    for (const trail of trailsByEdge[first]) {
      if (trail.mask & mask) continue;
      const rest = solve(mask | trail.mask);
      if (!rest) continue;

      const candidate = [trail, ...rest];
      if (
        !best ||
        candidate.length < best.length ||
        (
          candidate.length === best.length &&
          candidate.reduce((s, x) => s + x.nodes.length, 0) <
          best.reduce((s, x) => s + x.nodes.length, 0)
        )
      ) {
        best = candidate;
      }
    }

    memo.set(mask, best);
    return best;
  }

  return solve(0) ?? [];
}

function bridgePackVcvTrails(trails, maxMora) {
  const work = trails.map(trail => ({
    nodes: [...trail.nodes],
    extraBridges: 0
  }));

  // Exact trail construction is preferred. Only after that, join otherwise
  // disconnected trails when they fit on one recording line.
  while (true) {
    let best = null;

    for (let i = 0; i < work.length; i++) {
      for (let j = 0; j < work.length; j++) {
        if (i === j) continue;

        const a = work[i];
        const b = work[j];
        const combinedLength = a.nodes.length + b.nodes.length;
        if (combinedLength > maxMora) continue;

        const score = {
          fill: combinedLength,
          bridgeSame: a.nodes[a.nodes.length - 1] === b.nodes[0] ? 1 : 0
        };

        if (
          !best ||
          score.bridgeSame > best.score.bridgeSame ||
          (score.bridgeSame === best.score.bridgeSame && score.fill > best.score.fill)
        ) {
          best = { i, j, score };
        }
      }
    }

    if (!best) break;

    const a = work[best.i];
    const b = work[best.j];
    const merged = {
      nodes: [...a.nodes, ...b.nodes],
      extraBridges: a.extraBridges + b.extraBridges + 1
    };

    const hi = Math.max(best.i, best.j);
    const lo = Math.min(best.i, best.j);
    work.splice(hi, 1);
    work.splice(lo, 1);
    work.push(merged);
  }

  // Stable output: longer merged lines first.
  work.sort((a, b) => b.nodes.length - a.nodes.length);
  return work;
}

function buildMergedVcvSupplements(id, settings, fullLines, mainLines, customGroup = null) {
  if (settings.vcvMora >= 8) return [];

  const edges = getMissingVcvEdges(fullLines, mainLines, customGroup);
  if (!edges.length) return [];

  const exactTrails = findMinimumExactTrailCover(edges, settings.vcvMora);
  const packed = bridgePackVcvTrails(exactTrails, settings.vcvMora);

  return packed.map(path => {
    const tokens = path.nodes.map(sound =>
      makeVcvSupplementToken(sound, id, settings, customGroup)
    );

    return {
      groupId: id,
      kind: "mora-supplement",
      tokens,
      text: "_" + tokens
        .map(token =>
          customGroup
            ? token.sound
            : displaySound(token.sound, id, settings, false, true)
        )
        .join("")
    };
  });
}

function shortenVcvMainLines(id, settings, fullLines, seq, customGroup = null) {
  const mora = settings.vcvMora;
  if (mora === 8) return { main: fullLines, moraSupplements: [] };

  const main = fullLines.map(line => {
    const tokens = line.tokens.slice(0, mora);
    return {
      ...line,
      tokens,
      text: "_" + tokens
        .map(t => customGroup ? t.sound : displaySound(t.sound, id, settings, false, true))
        .join("")
    };
  });

  const moraSupplements = buildMergedVcvSupplements(
    id,
    settings,
    fullLines,
    main,
    customGroup
  );

  return { main, moraSupplements };
}

function buildVcvMainLinesForGroup(id, settings) {
  const seq = getVcvSequence(id);
  const full = buildVcvFullMainLinesForGroup(id, settings);
  return shortenVcvMainLines(id, settings, full, seq);
}

function coverageFromLines(lines, requiredTargets, customGroup = null) {
  const requiredKeys = new Set(requiredTargets.map(t => t.key));
  const targetInfo = new Map(requiredTargets.map(t => [t.key, t]));
  const covered = new Map();

  for (const key of requiredKeys) covered.set(key, new Set());

  for (const line of lines) {
    const tokens = line.tokens;
    if (!tokens.length) continue;

    const first = tokens[0];
    if (first.targetKey && covered.has(first.targetKey)) {
      covered.get(first.targetKey).add("-");
    }

    for (let i = 1; i < tokens.length; i++) {
      const prev = tokens[i - 1];
      const cur = tokens[i];
      if (!cur.targetKey || !covered.has(cur.targetKey)) continue;
      const vowel = getVowel(prev.sound, customGroup);
      if (vowel) covered.get(cur.targetKey).add(vowel);
    }
  }

  const contexts = ["-", "a", "i", "u", "e", "o", "N"];
  const missing = [];

  for (const [key, info] of targetInfo.entries()) {
    const have = covered.get(key) ?? new Set();
    for (const ctx of contexts) {
      if (!have.has(ctx)) {
        missing.push({ key, context: ctx, ...info });
      }
    }
  }

  return { covered, missing };
}

function buildSupplementForGroup(id, settings, mainLines, requiredTargets) {
  // 完整helper模式不需要补充行。
  if (!VCV_HELPER_GROUPS.has(id) || settings.vcvHelper !== "compact") {
    return [];
  }

  const seq = getVcvSequence(id);
  const group = GROUPS[id];
  const cvSet = new Set(group.cv);

  // 找出唯一helper：sequence中存在、但cv中不存在的音。
  const helperIndex = seq.findIndex(sound => !cvSet.has(sound));
  if (helperIndex < 0) return [];

  const helperSound = seq[helperIndex];
  const helperVowel = SOUNDS[helperSound]?.vowel;
  if (!helperVowel) return [];

  // A/B都是完整五音模板。
  // compact模式删除helper主行后，只会缺 helperVowel -> 两个target。
  // 对i-helper：缺 u/e target
  // 对u-helper：缺 e/o target
  const targetIndices = new Set(getVcvTargetIndices(id, settings));

  const groupTargets = requiredTargets.filter(t => t.groupId === id);
  const check = coverageFromLines(mainLines, groupTargets);
  const missingForHelper = check.missing.filter(
    miss => miss.context === helperVowel
  );

  if (!missingForHelper.length) return [];

  // 按sequence顺序排列缺失target，使补充行规律固定。
  const missingKeys = new Set(missingForHelper.map(m => m.key));
  const targetSounds = seq.filter((sound, idx) =>
    targetIndices.has(idx) &&
    missingKeys.has(targetKey(id, sound))
  );

  if (!targetSounds.length) return [];

  const tokens = [];
  for (const targetSound of targetSounds) {
    tokens.push(makeToken(helperSound, id, false));
    tokens.push(makeToken(targetSound, id, true));
  }

  return [{
    groupId: id,
    kind: "supplement",
    tokens,
    text: "_" + tokens
      .map(t => displaySound(t.sound, id, settings, true, true))
      .join("")
  }];
}

function splitTokenLineWithOverlap(line, maxMora, displayFn = t => t.sound) {
  if (line.tokens.length <= maxMora) return [line];

  const result = [];
  let start = 0;

  while (start < line.tokens.length - 1) {
    const tokens = line.tokens.slice(start, start + maxMora);
    result.push({
      ...line,
      tokens,
      text: "_" + tokens.map(displayFn).join("")
    });

    if (start + maxMora >= line.tokens.length) break;
    start += maxMora - 1;
  }

  return result;
}

function buildShortULines(settings) {
  if (!settings.shortU) return [];

  const lines = [];

  for (const x of SHORT_U_SOUNDS) {
    const xKeyGroup = "SHORT_U";

    const raw1 = [x, x, "あ", x, "い", x, "え", x];
    const tokens1 = raw1.map(sound =>
      sound === x
        ? makeToken(sound, xKeyGroup, true)
        : makeToken(sound, null, false)
    );

    const raw2 = ["ん", x, "お", x];
    const tokens2 = raw2.map(sound => {
      if (sound === "ん") return makeToken("ん", "MORAIC_N", true);
      if (sound === x) return makeToken(sound, xKeyGroup, true);
      return makeToken(sound, null, false);
    });

    const longLine = {
      groupId: "SHORT_U",
      kind: "special",
      tokens: tokens1,
      text: "_" + raw1.join("")
    };
    const shortLine = {
      groupId: "SHORT_U",
      kind: "special",
      tokens: tokens2,
      text: "_" + raw2.join("")
    };

    lines.push(...splitTokenLineWithOverlap(longLine, settings.vcvMora));
    lines.push(shortLine);
  }

  return lines;
}


function buildCustomVcvLines(settings, customGroup) {
  if (!customGroup || customGroup.incomplete || customGroup.duplicate) return {
    main: [],
    moraSupplements: []
  };

  const template = VCV_8MORA_TEMPLATES[settings.vcvNPosition];
  const seq = customGroup.sequence;
  const fullLines = [];

  for (let rowIndex = 0; rowIndex < 5; rowIndex++) {
    const tokens = template.map(step => {
      if (step === "N") return makeToken("ん", "MORAIC_N", true);
      const idx = (rowIndex + step) % 5;
      return makeToken(seq[idx], customGroup.id, true);
    });

    fullLines.push({
      groupId: customGroup.id,
      kind: "main",
      rowIndex,
      tokens,
      text: "_" + tokens.map(t => t.sound).join("")
    });
  }

  return shortenVcvMainLines(customGroup.id, settings, fullLines, seq, customGroup);
}


function collectRequiredVcvEdgesFromCandidates(baseLines, candidateLines, groupTargets, customGroup = null) {
  const check = coverageFromLines(baseLines, groupTargets, customGroup);
  const missingKeys = new Set(
    check.missing
      .filter(item => item.context !== "-")
      .map(item => `${item.key}::${item.context}`)
  );

  if (!missingKeys.size) return [];

  const found = new Map();

  for (const line of candidateLines) {
    const tokens = line.tokens ?? [];
    for (let i = 1; i < tokens.length; i++) {
      const prev = tokens[i - 1];
      const cur = tokens[i];
      if (!cur.targetKey) continue;

      const context = getVowel(prev.sound, customGroup);
      if (!context) continue;

      const key = `${cur.targetKey}::${context}`;
      if (!missingKeys.has(key) || found.has(key)) continue;

      found.set(key, {
        key,
        from: prev.sound,
        to: cur.sound
      });
    }
  }

  return [...found.values()];
}

function mergeAllVcvSupplements(id, settings, baseLines, candidateLines, groupTargets, customGroup = null) {
  if (!candidateLines.length) return [];

  const edges = collectRequiredVcvEdgesFromCandidates(
    baseLines,
    candidateLines,
    groupTargets,
    customGroup
  );

  if (!edges.length) return [];

  const exactTrails = findMinimumExactTrailCover(edges, settings.vcvMora);
  const packed = bridgePackVcvTrails(exactTrails, settings.vcvMora);

  return packed.map(path => {
    const tokens = path.nodes.map(sound =>
      makeVcvSupplementToken(sound, id, settings, customGroup)
    );

    return {
      groupId: id,
      kind: "supplement",
      tokens,
      text: "_" + tokens
        .map(token =>
          customGroup
            ? token.sound
            : displaySound(token.sound, id, settings, false, true)
        )
        .join("")
    };
  });
}

function buildOptimizedShortULines(settings) {
  if (!settings.shortU) return [];

  const lines = [];

  for (const x of SHORT_U_SOUNDS) {
    const id = "SHORT_U";

    const raw1 = [x, x, "あ", x, "い", x, "え", x];
    const tokens1 = raw1.map(sound =>
      sound === x
        ? makeToken(sound, id, true)
        : makeToken(sound, null, false)
    );

    const raw2 = ["ん", x, "お", x];
    const tokens2 = raw2.map(sound => {
      if (sound === "ん") return makeToken("ん", "MORAIC_N", true);
      if (sound === x) return makeToken(sound, id, true);
      return makeToken(sound, null, false);
    });

    const longLine = {
      groupId: id,
      kind: "special",
      tokens: tokens1,
      text: "_" + raw1.join("")
    };

    const splitLong = splitTokenLineWithOverlap(longLine, settings.vcvMora);
    const firstLine = splitLong[0];
    lines.push(firstLine);

    if (settings.vcvMora === 8) {
      lines.push({
        groupId: id,
        kind: "special",
        tokens: tokens2,
        text: "_" + raw2.join("")
      });
      continue;
    }

    // After the first line, only e/N/o -> x remain necessary.
    // Keep N first, then e, then o for a fixed, easy-to-read pattern.
    const missingContexts = [];
    const singleTarget = [{
      key: targetKey(id, x),
      groupId: id,
      raw: x,
      display: x
    }];
    const check = coverageFromLines([firstLine], singleTarget);

    for (const context of ["N", "e", "o"]) {
      if (check.missing.some(item => item.context === context)) {
        missingContexts.push(context);
      }
    }

    if (missingContexts.length) {
      const contextSound = {
        N: "ん",
        e: "え",
        o: "お"
      };

      const tokens = [];
      for (const context of missingContexts) {
        const prev = contextSound[context];
        tokens.push(
          prev === "ん"
            ? makeToken("ん", "MORAIC_N", true)
            : makeToken(prev, null, false)
        );
        tokens.push(makeToken(x, id, true));
      }

      lines.push({
        groupId: id,
        kind: "special-supplement",
        tokens,
        text: "_" + tokens.map(token => token.sound).join("")
      });
    }
  }

  return lines;
}


function mergeMoraWithProtectedHelper(moraSupplements, helperSupplement, settings) {
  const moraLines = moraSupplements.map(line => ({ ...line, tokens: [...(line.tokens ?? [])] }));
  const helperLines = helperSupplement.map(line => ({ ...line, tokens: [...(line.tokens ?? [])] }));

  if (!helperLines.length || !moraLines.length) {
    return [...moraLines, ...helperLines];
  }

  const used = new Set();
  const mergedHelpers = [];

  for (const helper of helperLines) {
    let bestIndex = -1;
    let bestLength = -1;

    for (let i = 0; i < moraLines.length; i++) {
      if (used.has(i)) continue;
      const moraLine = moraLines[i];
      const combinedLength = moraLine.tokens.length + helper.tokens.length;
      if (combinedLength > settings.vcvMora) continue;

      if (combinedLength > bestLength) {
        bestLength = combinedLength;
        bestIndex = i;
      }
    }

    if (bestIndex < 0) {
      mergedHelpers.push(helper);
      continue;
    }

    used.add(bestIndex);
    const moraLine = moraLines[bestIndex];
    const tokens = [...moraLine.tokens, ...helper.tokens];

    mergedHelpers.push({
      groupId: helper.groupId,
      kind: "supplement",
      tokens,
      text: "_" + tokens
        .map(token => displaySound(token.sound, helper.groupId, settings, false, true))
        .join("")
    });
  }

  const remainingMora = moraLines.filter((_, i) => !used.has(i));
  return [...remainingMora, ...mergedHelpers];
}

function buildVcv(settings) {
  const customGroup = getCustomVcvGroup(settings);
  const requiredTargets = buildVcvRequiredTargets(settings);
  const groups = [];
  const allLines = [];

  for (const id of VCV_ORDER) {
    if (id === "__SHORT_U__") continue;
    if (!isEnabledGroup(id, settings)) continue;

    const seq = getVcvSequence(id);
    if (seq.length !== 5) continue;

    const builtMain = buildVcvMainLinesForGroup(id, settings);

    const groupTargets = requiredTargets.filter(target => target.groupId === id);

    // Mora shortening supplements may be merged freely.
    const mergedMoraSupplements = settings.vcvMora < 8
      ? mergeAllVcvSupplements(
          id,
          settings,
          builtMain.main,
          builtMain.moraSupplements,
          groupTargets
        )
      : builtMain.moraSupplements;

    // Helper supplements keep the same fixed structure as the 8-mora version.
    // They are intentionally NOT included in the final minimum-coverage merge.
    const helperBase = [...builtMain.main, ...mergedMoraSupplements];
    const helperSupplement = buildSupplementForGroup(
      id,
      settings,
      helperBase,
      requiredTargets
    );

    const finalSupplements = mergeMoraWithProtectedHelper(
      mergedMoraSupplements,
      helperSupplement,
      settings
    );

    const lines = [
      ...builtMain.main,
      ...finalSupplements
    ];

    if (id === "VOWEL") {
      const nn = {
        groupId: "VOWEL",
        kind: "special",
        tokens: [
          makeToken("ん", "MORAIC_N", true),
          makeToken("ん", "MORAIC_N", true)
        ],
        text: "_んん"
      };
      lines.push(nn);
    }

    groups.push({ id, lines });
    allLines.push(...lines);
  }

  if (customGroup && !customGroup.incomplete && !customGroup.duplicate) {
    const customBuilt = buildCustomVcvLines(settings, customGroup);
    const customTargets = requiredTargets.filter(target => target.groupId === customGroup.id);
    const customSupplements = settings.vcvMora < 8
      ? mergeAllVcvSupplements(
          customGroup.id,
          settings,
          customBuilt.main,
          customBuilt.moraSupplements,
          customTargets,
          customGroup
        )
      : customBuilt.moraSupplements;

    const customLines = [...customBuilt.main, ...customSupplements];
    groups.push({ id: customGroup.id, lines: customLines });
    allLines.push(...customLines);
  }

  // ふゅ・てゅ・でゅは必ず最後。
  if (settings.shortU) {
    const shortLines = buildOptimizedShortULines(settings);
    groups.push({ id: "SHORT_U", lines: shortLines });
    allLines.push(...shortLines);
  }

  const coverage = coverageFromLines(allLines, requiredTargets, customGroup);

  return {
    groups,
    allLines,
    requiredTargets,
    coverage,
    text: groups
      .map(group => group.lines.map(line => line.text).join("\n"))
      .join("\n\n")
  };
}

function renderCoverage(build) {
  coverageSummary.classList.remove("hidden");
  coverageStartRow.classList.remove("hidden");

  const required = build.requiredTargets;
  const missing = build.coverage.missing;

  const startRequired = required.length;
  const startMissing = missing.filter(x => x.context === "-").length;
  const vcvRequired = required.length * 6;
  const vcvMissing = missing.filter(x => x.context !== "-").length;

  const startCovered = startRequired - startMissing;
  const vcvCovered = vcvRequired - vcvMissing;

  const startPct = startRequired ? Math.round(startCovered / startRequired * 100) : 100;
  const vcvPct = vcvRequired ? Math.round(vcvCovered / vcvRequired * 100) : 100;

  coverageStartValue.textContent = `${startPct}% (${startCovered}/${startRequired})`;
  coverageVcvValue.textContent = `${vcvPct}% (${vcvCovered}/${vcvRequired})`;
  coverageMissingValue.textContent = String(missing.length);

  coverageMissingList.innerHTML = "";

  if (!missing.length) {
    coverageMissingList.classList.add("hidden");
    return;
  }

  coverageMissingList.classList.remove("hidden");

  const grouped = new Map();
  for (const item of missing) {
    if (!grouped.has(item.groupId)) grouped.set(item.groupId, []);
    grouped.get(item.groupId).push(item);
  }

  for (const [groupId, items] of grouped.entries()) {
    const details = document.createElement("details");
    details.className = "missing-group";

    const summary = document.createElement("summary");
    const displayGroupName = groupId === "CUSTOM_VCV" ? t("custom_group_display") : groupId;
    summary.innerHTML = `<span>${displayGroupName}</span><strong>${items.length}</strong>`;
    details.appendChild(summary);

    const list = document.createElement("div");
    list.className = "missing-group-list";

    for (const item of items) {
      const row = document.createElement("div");
      row.textContent = `${item.context} ${item.display}`;
      list.appendChild(row);
    }

    details.appendChild(list);
    coverageMissingList.appendChild(details);
  }
}

function updateVcvTemplateExample() {
  const settings = getSettings();
  const mode = settings.mode;

  const vcvPresets = {
    "2": { rule: "A N A A I A U A", example: "_あんああいあうあ" },
    "3": { rule: "A A N A I A U A", example: "_ああんあいあうあ" },
    "4": { rule: "A I A N A A U A", example: "_あいあんああうあ" },
    "5": { rule: "A A I A N A U A", example: "_ああいあんあうあ" },
    "6": { rule: "A I A U A N A A", example: "_あいあうあんああ" },
    "7": { rule: "A A I A U A N A", example: "_ああいあうあんあ" }
  };

  const cvvcPresets = {
    "2": { rule: "A N A I U E O A", example: "_かんかきくけこか" },
    "3": { rule: "A A N I U E O A", example: "_かかんきくけこか" },
    "4": { rule: "A I A N U E O A", example: "_かきかんくけこか" },
    "5": { rule: "A I U A N E O A", example: "_かきくかんけこか" },
    "6": { rule: "A I U E A N O A", example: "_かきくけかんこか" },
    "7": { rule: "A I U E O A N A", example: "_かきくけこかんか" }
  };

  const table = mode === "cvvc" ? cvvcPresets : vcvPresets;
  const preset = table[settings.vcvNPosition] ?? table["2"];

  const ruleParts = preset.rule.split(" ");
  const exampleChars = [...preset.example.slice(1)];
  const currentRule = ruleParts.slice(0, settings.vcvMora).join(" ");
  const currentExample = "_" + exampleChars.slice(0, settings.vcvMora).join("");

  moraSettingsTitle.textContent = mode === "cvvc" ? t("cvvc_settings") : t("vcv_settings");
  templateRule.textContent = currentRule;
  templateExample.textContent = currentExample;

  const yi = settings.yiMarked ? "いぃ" : "い";
  const wu = settings.wuMarked ? "うぅ" : "う";

  if (mode === "cvvc") {
    helperDefaultText.textContent = t("helper_default_cvvc");
    helperRecommendedBadge.textContent = t("helper_recommended");
    helperNote.innerHTML = `
      <div><strong>${t("helper_example_title")}</strong></div>
      <div>KY：<span class="helper-example">_き_きゅ_きぇ_きょ</span></div>
      <div>Y：<span class="helper-example">_${yi}_ゆ_いぇ_よ</span></div>
      <div>W：<span class="helper-example">_うぃ_${wu}_うぇ_うぉ</span></div>
    `;
  } else {
    helperDefaultText.textContent = t("helper_default_vcv");
    helperRecommendedBadge.textContent = t("helper_recommended");
    helperNote.innerHTML = `
      <div><strong>${t("helper_example_title")}</strong></div>
      <div>KY：<span class="helper-example">_きんきききゅききぇき</span></div>
      <div>Y：<span class="helper-example">_${yi}ん${yi}${yi}ゆ${yi}いぇ${yi}</span></div>
      <div>W：<span class="helper-example">_${wu}ん${wu}${wu}うぇ${wu}うぉ${wu}</span></div>
    `;
  }
}


// -------------------------
// CVVC
// -------------------------

const CVVC_CONSONANT_LABELS = {
  K: "k", G: "g",
  S: "s", Z: "z", SH: "sh",
  T: "t", CH: "ch", TS: "ts",
  N_ROW: "n", H: "h", M: "m", R: "r",
  Y: "y", W: "w",
  J: "j", D: "d", B: "b", P: "p",
  KY: "ky", HY: "hy", NY: "ny", MY: "my", RY: "ry",
  GY: "gy", BY: "by", PY: "py",
  F: "f", V_CONS: "v",
  CUSTOM_VCV: "CUSTOM"
};

function getCvvcConsonantLabel(groupId) {
  return CVVC_CONSONANT_LABELS[groupId] ?? groupId;
}

function getCvvcFormalIndices(id, settings) {
  // 与VCV共用helper定义。
  return getVcvTargetIndices(id, settings);
}

function splitCvvcTokens(tokens, maxMora) {
  if (tokens.length <= maxMora) return [tokens];

  const chunks = [];
  let start = 0;

  while (start < tokens.length - 1) {
    const chunk = tokens.slice(start, start + maxMora);
    chunks.push(chunk);

    if (start + maxMora >= tokens.length) break;
    start += maxMora - 1;
  }

  return chunks;
}

function buildCvvcMainLines(id, settings, customGroup = null) {
  const seq = customGroup ? customGroup.sequence : getVcvSequence(id);
  const template = CVVC_8MORA_TEMPLATES[settings.vcvNPosition];
  const fullTokens = template.map(step => step === "N" ? "ん" : seq[step]);

  return splitCvvcTokens(fullTokens, settings.vcvMora).map((tokens, index) => ({
    groupId: id,
    kind: index === 0 ? "vc-main" : "vc-tail",
    text: "_" + tokens
      .map(sound => customGroup ? sound : displaySound(sound, id, settings, false, true))
      .join(""),
    tokens
  }));
}


function getCvvcGloballyCoveredStartSounds(settings, excludeGroupId = null) {
  const covered = new Set(["あ","い","う","え","お","ん"]);

  for (const gid of CVVC_ORDER) {
    if (gid === "VOWEL" || gid === "__CUSTOM__" || gid === "__SHORT_U__") continue;
    if (gid === excludeGroupId) continue;
    if (!isEnabledGroup(gid, settings)) continue;

    const seq = getVcvSequence(gid);
    if (seq.length !== 5) continue;

    // 统计该组在当前helper模式下本来就是正式 -CV 的音。
    for (const idx of getCvvcFormalIndices(gid, settings)) {
      covered.add(seq[idx]);
    }
  }

  return covered;
}

function getCvvcStartIndices(id, settings) {
  const seq = getVcvSequence(id);
  const indices = new Set(getCvvcFormalIndices(id, settings));

  // compact 模式下，如果 helper 在其他正式组中完全没有 -CV，
  // 则自动在本组补录，避免像 し / ち / じ 这样的缺口。
  if (settings.vcvHelper === "compact" && VCV_HELPER_GROUPS.has(id)) {
    const group = GROUPS[id];
    const cvSet = new Set(group.cv);
    const helperIndex = seq.findIndex(sound => !cvSet.has(sound));

    if (helperIndex >= 0) {
      const helperSound = seq[helperIndex];
      const coveredElsewhere = getCvvcGloballyCoveredStartSounds(settings, id);

      if (!coveredElsewhere.has(helperSound)) {
        indices.add(helperIndex);
      }
    }
  }

  return [...indices].sort((a, b) => a - b);
}

function buildCvvcStartLine(id, settings, generatedLines, customGroup = null) {
  const seq = customGroup ? customGroup.sequence : getVcvSequence(id);
  const formalIndices = customGroup
    ? [0, 1, 2, 3, 4]
    : getCvvcStartIndices(id, settings);

  const formalSounds = new Set(formalIndices.map(idx => seq[idx]));
  const alreadyStarts = new Set();

  for (const line of generatedLines) {
    const first = line.tokens?.[0];
    if (first && formalSounds.has(first)) {
      alreadyStarts.add(first);
    }
  }

  const remaining = formalIndices.filter(idx => !alreadyStarts.has(seq[idx]));
  if (!remaining.length) return null;

  const sounds = remaining.map(idx => {
    const sound = seq[idx];
    return customGroup ? sound : displaySound(sound, id, settings, false, true);
  });

  return {
    groupId: id,
    kind: "start-cv",
    text: "_" + sounds.join("_"),
    starts: remaining.map(idx => seq[idx])
  };
}

function buildCvvcVowelLines() {
  // 与连单术相同：母音和ん各自单独一行。
  return ["あ","い","う","え","お","ん"].map(sound => ({
    groupId: "VOWEL",
    kind: "vowel-start",
    text: "_" + sound,
    starts: [sound]
  }));
}

function buildCvvcShortULines(settings) {
  if (!settings.shortU) return [];
  return [{
    groupId: "SHORT_U",
    kind: "short-start",
    text: "_ふゅ_てゅ_でゅ",
    starts: [...SHORT_U_SOUNDS]
  }];
}

function buildCvvcRequired(settings, customGroup) {
  const startItems = [];
  const vcItems = [];

  // 母音和ん只检查句首。
  for (const sound of ["あ","い","う","え","お","ん"]) {
    startItems.push({
      key: `start::VOWEL::${sound}`,
      groupId: "VOWEL",
      display: `- ${sound}`
    });
  }

  for (const id of CVVC_ORDER) {
    if (id === "VOWEL" || id === "__CUSTOM__" || id === "__SHORT_U__") continue;
    if (!isEnabledGroup(id, settings)) continue;

    const seq = getVcvSequence(id);
    if (seq.length !== 5) continue;

    for (const idx of getCvvcStartIndices(id, settings)) {
      const sound = displaySound(seq[idx], id, settings, false, true);
      startItems.push({
        key: `start::${id}::${seq[idx]}`,
        groupId: id,
        display: `- ${sound}`
      });
    }

    const c = getCvvcConsonantLabel(id);
    for (const ctx of ["a","i","u","e","o","N"]) {
      vcItems.push({
        key: `vc::${id}::${ctx}`,
        groupId: id,
        display: `${ctx} ${c}`
      });
    }
  }

  if (customGroup && !customGroup.incomplete && !customGroup.duplicate) {
    for (const sound of customGroup.sequence) {
      startItems.push({
        key: `start::${customGroup.id}::${sound}`,
        groupId: customGroup.id,
        display: `- ${sound}`
      });
    }
    for (const ctx of ["a","i","u","e","o","N"]) {
      vcItems.push({
        key: `vc::${customGroup.id}::${ctx}`,
        groupId: customGroup.id,
        display: `${ctx} CUSTOM`
      });
    }
  }

  if (settings.shortU) {
    for (const sound of SHORT_U_SOUNDS) {
      startItems.push({
        key: `start::SHORT_U::${sound}`,
        groupId: "SHORT_U",
        display: `- ${sound}`
      });
    }
    // 按已确认规则，不为 fy/ty/dy 建立VC要求。
  }

  return { startItems, vcItems };
}

function computeCvvcCoverage(build, settings, customGroup) {
  const coveredStart = new Set();
  const coveredVc = new Set();

  for (const line of build.allLines) {
    const id = line.groupId;

    if (id === "VOWEL") {
      for (const sound of line.starts ?? []) {
        coveredStart.add(`start::VOWEL::${sound}`);
      }
      continue;
    }

    if (id === "SHORT_U") {
      for (const sound of line.starts ?? []) {
        coveredStart.add(`start::SHORT_U::${sound}`);
      }
      continue;
    }

    const cg = id === "CUSTOM_VCV" ? customGroup : null;
    const group = GROUPS[id];
    const seq = cg ? cg.sequence : (group ? getVcvSequence(id) : []);
    if (!seq.length) continue;

    const formalIndices = cg ? [0,1,2,3,4] : getCvvcStartIndices(id, settings);
    const formalSounds = new Set(formalIndices.map(idx => seq[idx]));
    const seqSounds = new Set(seq);

    for (const sound of line.starts ?? []) {
      if (formalSounds.has(sound)) {
        coveredStart.add(`start::${id}::${sound}`);
      }
    }

    const tokens = line.tokens ?? [];
    if (!tokens.length) continue;

    if (formalSounds.has(tokens[0])) {
      coveredStart.add(`start::${id}::${tokens[0]}`);
    }

    for (let i = 1; i < tokens.length; i++) {
      const prev = tokens[i - 1];
      const cur = tokens[i];

      if (!seqSounds.has(cur)) continue;

      const ctx = prev === "ん" ? "N" : getVowel(prev, cg);
      if (["a","i","u","e","o","N"].includes(ctx)) {
        coveredVc.add(`vc::${id}::${ctx}`);
      }
    }
  }

  const missing = [];

  for (const item of build.required.startItems) {
    if (!coveredStart.has(item.key)) {
      missing.push({ type: "start", ...item });
    }
  }

  for (const item of build.required.vcItems) {
    if (!coveredVc.has(item.key)) {
      missing.push({ type: "vc", ...item });
    }
  }

  return { coveredStart, coveredVc, missing };
}


function applyLineNumbering(text) {
  const lines = text.split("\n");
  const nonEmptyCount = lines.filter(line => line.trim()).length;
  const digits = Math.max(2, String(nonEmptyCount).length);
  let n = 0;

  return lines.map(line => {
    if (!line.trim()) return "";
    n += 1;
    return `${String(n).padStart(digits, "0")}${line}`;
  }).join("\n");
}

function buildCvvc(settings) {
  const customGroup = getCustomVcvGroup(settings);
  const groups = [];
  const endStartLines = [];

  // 母音和ん始终保留，并保持在开头。
  groups.push({
    id: "VOWEL",
    lines: buildCvvcVowelLines()
  });

  function appendCvvcGroup(id, mainLines, startLine = null) {
    const lines = [...mainLines];

    if (settings.cvvcStartMode === "group") {
      if (startLine) lines.push(startLine);
    } else if (settings.cvvcStartMode === "end") {
      if (startLine) endStartLines.push(startLine);
    }

    groups.push({ id, lines });
  }

  for (const id of CVVC_ORDER) {
    if (id === "VOWEL" || id === "__CUSTOM__" || id === "__SHORT_U__") continue;
    if (!isEnabledGroup(id, settings)) continue;

    const seq = getVcvSequence(id);
    if (seq.length !== 5) continue;

    const mainLines = buildCvvcMainLines(id, settings);
    const start = buildCvvcStartLine(id, settings, mainLines);

    appendCvvcGroup(id, mainLines, start);
  }

  if (customGroup && !customGroup.incomplete && !customGroup.duplicate) {
    const mainLines = buildCvvcMainLines(customGroup.id, settings, customGroup);
    const start = buildCvvcStartLine(customGroup.id, settings, mainLines, customGroup);

    appendCvvcGroup(customGroup.id, mainLines, start);
  }

  // ふゅ・てゅ・でゅ属于特殊句首补充：
  // group模式仍保持最后；end模式与其他句首CV一起集中到最后；
    const shortStartLines = settings.shortU
    ? buildCvvcShortULines(settings)
    : [];

  if (settings.cvvcStartMode === "end") {
    const START_CV_SECTIONS = [
      {
        id: "START_CV_SEION",
        groups: new Set(["K", "S", "T", "TS", "N_ROW", "H", "M", "R", "Y", "W", "F"])
      },
      {
        id: "START_CV_DAKUON",
        groups: new Set(["G", "Z", "D", "B", "P", "V_CONS"])
      },
      {
        id: "START_CV_YOON_SEION",
        groups: new Set(["SH", "CH", "KY", "HY", "NY", "MY", "RY", "PY"])
      },
      {
        id: "START_CV_YOON_DAKUON",
        groups: new Set(["J", "GY", "BY"])
      }
    ];

    const placed = new Set();

    for (const section of START_CV_SECTIONS) {
      const lines = endStartLines.filter(line => section.groups.has(line.groupId));
      if (!lines.length) continue;

      lines.forEach(line => placed.add(line));
      groups.push({
        id: section.id,
        lines
      });
    }

    // 自定义音节组等不属于固定四类的句首补充单独成段。
    const remaining = endStartLines.filter(line => !placed.has(line));
    if (remaining.length) {
      groups.push({
        id: "START_CV_OTHER",
        lines: remaining
      });
    }

    // ふゅ・てゅ・でゅ仍然永远最后，并与前面的句首补充留出空行。
    if (shortStartLines.length) {
      groups.push({
        id: "SHORT_U",
        lines: shortStartLines
      });
    }
  } else if (settings.cvvcStartMode === "group" && shortStartLines.length) {
    groups.push({
      id: "SHORT_U",
      lines: shortStartLines
    });
  }

  const required = buildCvvcRequired(settings, customGroup);
  const allLines = groups.flatMap(group => group.lines);

  const rawText = groups
    .filter(group => group.lines.length)
    .map(group => group.lines.map(line => line.text).join("\n"))
    .join("\n\n");

  const build = {
    groups,
    allLines,
    required,
    text: settings.cvvcNumbering ? applyLineNumbering(rawText) : rawText
  };

  build.coverage = computeCvvcCoverage(build, settings, customGroup);
  return build;
}

function renderCvvcCoverage(build) {
  coverageSummary.classList.remove("hidden");
  coverageMainLabel.textContent = t("vc_check");
  coverageStartLabel.textContent = t("starting_sounds_check");

  coverageStartRow.classList.remove("hidden");

  const startTotal = build.required.startItems.length;
  const vcTotal = build.required.vcItems.length;

  const startMissing = build.coverage.missing.filter(x => x.type === "start").length;
  const vcMissing = build.coverage.missing.filter(x => x.type === "vc").length;

  const startCovered = startTotal - startMissing;
  const vcCovered = vcTotal - vcMissing;

  const startPct = startTotal ? Math.round(startCovered / startTotal * 100) : 100;
  const vcPct = vcTotal ? Math.round(vcCovered / vcTotal * 100) : 100;

  coverageStartValue.textContent = `${startPct}% (${startCovered}/${startTotal})`;
  coverageVcvValue.textContent = `${vcPct}% (${vcCovered}/${vcTotal})`;
  coverageMissingValue.textContent = String(build.coverage.missing.length);

  coverageMissingList.innerHTML = "";

  if (!build.coverage.missing.length) {
    coverageMissingList.classList.add("hidden");
    return;
  }

  coverageMissingList.classList.remove("hidden");

  const grouped = new Map();
  for (const item of build.coverage.missing) {
    if (!grouped.has(item.groupId)) grouped.set(item.groupId, []);
    grouped.get(item.groupId).push(item);
  }

  for (const [groupId, items] of grouped.entries()) {
    const details = document.createElement("details");
    details.className = "missing-group";

    const summary = document.createElement("summary");
    const displayGroupName = groupId === "CUSTOM_VCV" ? t("custom_group_display") : groupId;
    summary.innerHTML = `<span>${displayGroupName}</span><strong>${items.length}</strong>`;
    details.appendChild(summary);

    const list = document.createElement("div");
    list.className = "missing-group-list";

    for (const item of items) {
      const row = document.createElement("div");
      row.textContent = item.display;
      list.appendChild(row);
    }

    details.appendChild(list);
    coverageMissingList.appendChild(details);
  }
}


// -------------------------
// Preview
// -------------------------

function renderPreview() {
  const settings = getSettings();
  preview.innerHTML = "";

  if (settings.mode === "cv") {
    const groups = getCvGroups(settings);
    for (const group of groups) {
      const card = document.createElement("div");
      card.className = "group-card";
      card.innerHTML = `
        <div class="id">${group.id}</div>
        <div class="sounds">${group.sounds.join("　")}</div>
      `;
      preview.appendChild(card);
    }
    return;
  }

  if (settings.mode === "vcv") {
    for (const id of VCV_ORDER) {
      if (id === "__SHORT_U__") {
        if (!settings.shortU) continue;
        const card = document.createElement("div");
        card.className = "group-card";
        card.innerHTML = `
          <div class="id">SHORT_U</div>
          <div class="sounds">${SHORT_U_SOUNDS.join("　")}</div>
        `;
        preview.appendChild(card);
        continue;
      }

      if (!isEnabledGroup(id, settings)) continue;
      const seq = getVcvSequence(id);
      if (seq.length !== 5) continue;
      const targetIndices = new Set(getVcvTargetIndices(id, settings));

      const sounds = seq.map((sound, idx) => {
        const display = displaySound(sound, id, settings, false, true);
        return targetIndices.has(idx)
          ? `<span>${display}</span>`
          : `<span class="helper">${display}</span>`;
      }).join("　");

      const card = document.createElement("div");
      card.className = "group-card";
      card.innerHTML = `
        <div class="id">${id}</div>
        <div class="sounds">${sounds}</div>
      `;
      preview.appendChild(card);
    }
    return;
  }

  const groups = getRentanGroups(settings);
  for (const group of groups) {
    const card = document.createElement("div");
    card.className = "group-card";

    let htmlSounds = "";
    if (group.helperFlags) {
      htmlSounds = group.previewSounds.map((sound, i) =>
        group.helperFlags[i]
          ? `<span class="helper">${sound}</span>`
          : `<span>${sound}</span>`
      ).join("　");
    } else {
      htmlSounds = group.previewSounds.join("　");
    }

    card.innerHTML = `
      <div class="id">${group.id}</div>
      <div class="sounds">${htmlSounds}</div>
    `;
    preview.appendChild(card);
  }
}


function updateCustomVcvStatus() {
  const settings = getSettings();
  const group = getCustomVcvGroup(settings);

  if (!group) {
    customStatus.textContent = "";
    return;
  }

  if (group.incomplete) {
    customStatus.textContent = t("vcv_custom_incomplete");
  } else if (group.duplicate) {
    customStatus.textContent = t("vcv_custom_duplicate");
  } else {
    customStatus.textContent = t("vcv_custom_ready");
  }
}


function markOutputDirty() {
  outputDirty = true;
  dirtyStatusEl.classList.remove("hidden");
  statusEl.textContent = "";
}

function markOutputFresh() {
  outputDirty = false;
  dirtyStatusEl.classList.add("hidden");
}

// -------------------------
// UI / Generate
// -------------------------

function refreshUiText() {
  const mode = getMode();

  if (mode === "cvvc") {
    foreignSectionTitle.textContent = t("section_foreign_cvvc");
    displaySectionTitle.textContent = t("section_display_cvvc");
    resultTitle.textContent = t("section_result_cvvc");
  } else if (mode === "vcv") {
    foreignSectionTitle.textContent = t("section_foreign_vcv");
    displaySectionTitle.textContent = t("section_display_vcv");
    resultTitle.textContent = t("section_result_vcv");
  } else if (mode === "cv") {
    foreignSectionTitle.textContent = t("section_foreign_cv");
    resultTitle.textContent = t("section_result_cv");
  } else if (mode === "rentanfu") {
    foreignSectionTitle.textContent = t("section_foreign_rentan");
    displaySectionTitle.textContent = t("section_display_rentan");
    resultTitle.textContent = t("section_result_rentanf");
  } else {
    foreignSectionTitle.textContent = t("section_foreign_rentan");
    displaySectionTitle.textContent = t("section_display_rentan");
    resultTitle.textContent = t("section_result_rentan");
  }

  if (mode === "rentanfu") {
    rentanSetTitle.textContent = t("rtf_phoneme_set_title");
    rentanOptionsTitle.textContent = t("rtf_settings");
    rentanNumberingExample.textContent = t("example_rtf_numbered");
  } else {
    rentanSetTitle.textContent = t("rtj_phoneme_set_title");
    rentanOptionsTitle.textContent = t("rtj_settings");
    rentanNumberingExample.textContent = t("example_numbered");
  }

  syncRequiredGroups();

  if (output.value) {
    const settings = getSettings();

    if (settings.mode === "cv") {
      resultMeta.textContent = t("meta_cv")(countCvSounds(settings));
    } else if (settings.mode === "rentanfu") {
      const count = output.value.split("\n").filter(Boolean).length;
      resultMeta.textContent = t("meta_rentanf")(count, settings.rentanSet);
    } else if (settings.mode === "vcv") {
      const count = output.value.split("\n").filter(Boolean).length;
      resultMeta.textContent = t("meta_vcv")(count, settings.vcvMora);
    } else if (settings.mode === "cvvc") {
      const count = output.value.split("\n").filter(Boolean).length;
      resultMeta.textContent = t("meta_cvvc")(count, settings.vcvMora);
    } else {
      const count = output.value.split("\n").filter(Boolean).length;
      resultMeta.textContent = t("meta_rentan")(count, settings.rentanSet);
    }
  }
}

function syncUi() {
  const mode = getMode();
  const isCv = mode === "cv";
  const isRentanFu = mode === "rentanfu";
  const isRentan = mode === "rentan";
  const isRentanLike = isRentanFu || isRentan;
  const isVcv = mode === "vcv";
  const isCvvc = mode === "cvvc";
  const isContinuous8 = isVcv || isCvvc;

  // VCV / CVVC 都默认精简。
  // 只在进入这两种模式时设一次，之后用户仍可在高级设置中手动切换。
  if (mode !== previousMode) {
    if (isVcv || isCvvc) {
      const compact = document.querySelector('input[name="vcv-helper"][value="compact"]');
      if (compact) compact.checked = true;
    }
    previousMode = mode;
  }

  // 模式专用模块。
  rentanSetPanel.classList.toggle("hidden", !isRentanLike);
  cvOptions.classList.toggle("hidden", !isCv);
  rentanOptions.classList.toggle("hidden", !isRentanLike);

  // VCV/CVVC共用：mora / ん位置 / helper。
  vcvOptions.classList.toggle("hidden", !isContinuous8);
  vcvCustomPanel.classList.toggle("hidden", !isContinuous8);
  syncMoraAndNControls();
  cvvcNumberingRow.classList.toggle("hidden", !isCvvc);
  cvvcStartModeRow.classList.toggle("hidden", !isCvvc);
  cvvc7MoraWarning.classList.toggle(
    "hidden",
    !(isCvvc && moraByMode.cvvc === 7)
  );

  // 录音表记：单独音不需要；其他模式保留。
  displayPanel.classList.toggle("hidden", isCv);

  // VCV/CVVC都不显示Group预览。
  previewSection.classList.toggle("hidden", isContinuous8 || isCv);

  // Coverage属于VCV/CVVC。
  coverageSummary.classList.toggle("hidden", !isContinuous8);

  // 单独音专用外来语补助。
  document.querySelectorAll(".cv-only-foreign").forEach(el => {
    el.classList.toggle("hidden", !isCv);
  });

  // TS在树月式VCV/CVVC中内置。
  tsCard.classList.toggle("hidden", isContinuous8);

  syncRequiredGroups();
  refreshUiText();

  if (isRentanLike) {
    renderPreview();
  }

  syncMoraAndNControls();
  updateVcvTemplateExample();
  updateCustomVcvStatus();
}

function generate() {
  syncRequiredGroups();
  const settings = getSettings();

  if (settings.mode === "cv") {
    lastVcvBuild = null;
    lastCvvcBuild = null;
    output.value = buildCvText(settings);
    resultMeta.textContent = t("meta_cv")(countCvSounds(settings));
    coverageSummary.classList.add("hidden");

  } else if (settings.mode === "rentanfu") {
    lastVcvBuild = null;
    lastCvvcBuild = null;
    output.value = buildRentanFuText(settings);
    const count = output.value.split("\n").filter(Boolean).length;
    resultMeta.textContent = t("meta_rentanf")(count, settings.rentanSet);
    coverageSummary.classList.add("hidden");

  } else if (settings.mode === "rentan") {
    lastVcvBuild = null;
    lastCvvcBuild = null;
    output.value = buildRentanText(settings);
    const count = output.value.split("\n").filter(Boolean).length;
    resultMeta.textContent = t("meta_rentan")(count, settings.rentanSet);
    coverageSummary.classList.add("hidden");

  } else if (settings.mode === "vcv") {
    lastCvvcBuild = null;
    lastVcvBuild = buildVcv(settings);
    output.value = lastVcvBuild.text;
    resultMeta.textContent = t("meta_vcv")(
      output.value.split("\n").filter(Boolean).length,
      settings.vcvMora
    );
    coverageMainLabel.textContent = t("vcv_check");
    coverageStartLabel.textContent = t("starting_sounds_check");
    renderCoverage(lastVcvBuild);

  } else if (settings.mode === "cvvc") {
    lastVcvBuild = null;
    const build = buildCvvc(settings);
    lastCvvcBuild = build;
    output.value = build.text;
    resultMeta.textContent = t("meta_cvvc")(
      output.value.split("\n").filter(Boolean).length,
      settings.vcvMora
    );
    renderCvvcCoverage(build);
  }

  markOutputFresh();
  statusEl.textContent = t("status_generated");
}

async function copyOutput() {
  if (!output.value || outputDirty) generate();

  try {
    await navigator.clipboard.writeText(output.value);
    statusEl.textContent = t("status_copied");
  } catch {
    output.select();
    document.execCommand("copy");
    statusEl.textContent = t("status_copied");
  }
}

function getExportEncoding() {
  return document.querySelector('input[name="export-encoding"]:checked')?.value ?? "ansi";
}

function getExportTypeCode(mode) {
  return {
    cv: "CV",
    rentanfu: "RTF",
    rentan: "RTJ",
    vcv: "VCV",
    cvvc: "CVVC"
  }[mode] ?? "RECLIST";
}

function getExportYYMM() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return yy + mm;
}

function getExportFilename() {
  const type = getExportTypeCode(getMode());
  const encoding = getExportEncoding() === "ansi" ? "ANSI" : "UTF8";
  return `reclist_${type}_${encoding}_${getExportYYMM()}.txt`;
}

function downloadOutput() {
  if (!output.value || outputDirty) generate();

  // Windows/OREMO-oriented text files use CRLF.
  const text = output.value.replace(/\r?\n/g, "\r\n");
  const encoding = getExportEncoding();
  let blob;

  if (encoding === "ansi") {
    const encoded = encodeCp932(text);
    if (!encoded.bytes) {
      statusEl.textContent = t("status_ansi_error");
      return;
    }
    blob = new Blob([encoded.bytes], { type: "text/plain" });
  } else {
    const bytes = new TextEncoder().encode(text);
    blob = new Blob([bytes], { type: "text/plain;charset=utf-8" });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = getExportFilename();
  a.click();
  URL.revokeObjectURL(url);
  statusEl.textContent = t("status_saved");
}


function refreshLanguageUi() {
  applyStaticTranslations();
  syncRequiredGroups();
  refreshUiText();
  updateVcvTemplateExample();
  updateCustomVcvStatus();

  const mode = getMode();
  if (mode === "vcv" && lastVcvBuild) {
    coverageMainLabel.textContent = t("vcv_check");
    coverageStartLabel.textContent = t("starting_sounds_check");
    renderCoverage(lastVcvBuild);
  } else if (mode === "cvvc" && lastCvvcBuild) {
    renderCvvcCoverage(lastCvvcBuild);
  }

  // Do not turn a language change into a generation action.
  statusEl.textContent = "";
}

languageInputs.forEach(el => el.addEventListener("change", () => {
  setLanguage(el.value);
  refreshLanguageUi();
}));

modeInputs.forEach(el => el.addEventListener("change", () => {
  markOutputDirty();
  syncUi();
}));

document.querySelectorAll(
  '.foreign-toggle, .cv-extra-toggle, #short-u-toggle, #cvvc-numbering, input[name="cvvc-start-mode"], input[name="yi"], input[name="wu"], input[name="fu"], input[name="rentan-set"], input[name="vcv-n-position"], input[name="vcv-helper"]'
).forEach(el => el.addEventListener("change", () => {
  markOutputDirty();
  syncRequiredGroups();
  updateVcvTemplateExample();
  if (getMode() === "rentan" || getMode() === "rentanfu") renderPreview();
  refreshUiText();
  updateCustomVcvStatus();
}));

Object.values(customInputs).forEach(input => {
  input.addEventListener("input", () => {
    markOutputDirty();
    updateCustomVcvStatus();
  });
});

moraMinus.addEventListener("click", () => setMora(-1));
moraPlus.addEventListener("click", () => setMora(1));

document.getElementById("generate-btn").addEventListener("click", generate);
document.getElementById("copy-btn").addEventListener("click", copyOutput);
document.getElementById("download-btn").addEventListener("click", downloadOutput);

applyStaticTranslations();
syncUi();
generate();

// 浏览器可能在返回页面/刷新时恢复上次的radio状态。
// pageshow后再同步一次，避免模式与UI状态不一致。
window.addEventListener("pageshow", () => {
  syncUi();
});

// 再等一帧，确保浏览器的表单状态恢复完成。
requestAnimationFrame(() => {
  syncUi();
});
