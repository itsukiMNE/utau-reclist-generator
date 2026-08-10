// app.js
// v0.28：中文 / 日本語 / English。

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
const helperNote = document.getElementById("helper-note");
const helperDefaultText = document.getElementById("helper-default-text");
const helperRecommendedBadge = document.getElementById("helper-recommended-badge");
const cvvcNumberingRow = document.getElementById("cvvc-numbering-row");
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
    vcvHelper: document.querySelector('input[name="vcv-helper"]:checked')?.value ?? "compact",
    cvvcNumbering: cvvcNumbering.checked,
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
    settings.mode === "rentan" &&
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

function buildVcvMainLinesForGroup(id, settings) {
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
      tokens,
      text: "_" + tokens.map(t => displaySound(t.sound, id, settings, false, true)).join("")
    });
  }

  return lines;
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

    lines.push({
      groupId: "SHORT_U",
      kind: "special",
      tokens: tokens1,
      text: "_" + raw1.join("")
    });
    lines.push({
      groupId: "SHORT_U",
      kind: "special",
      tokens: tokens2,
      text: "_" + raw2.join("")
    });
  }

  return lines;
}


function buildCustomVcvLines(settings, customGroup) {
  if (!customGroup || customGroup.incomplete || customGroup.duplicate) return [];

  const template = VCV_8MORA_TEMPLATES[settings.vcvNPosition];
  const seq = customGroup.sequence;
  const lines = [];

  for (let rowIndex = 0; rowIndex < 5; rowIndex++) {
    const tokens = template.map(step => {
      if (step === "N") return makeToken("ん", "MORAIC_N", true);
      const idx = (rowIndex + step) % 5;
      return makeToken(seq[idx], customGroup.id, true);
    });

    lines.push({
      groupId: customGroup.id,
      kind: "main",
      tokens,
      text: "_" + tokens.map(t => t.sound).join("")
    });
  }

  return lines;
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

    const main = buildVcvMainLinesForGroup(id, settings);
    const supplement = buildSupplementForGroup(id, settings, main, requiredTargets);
    const lines = [...main, ...supplement];

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
    const customLines = buildCustomVcvLines(settings, customGroup);
    groups.push({ id: customGroup.id, lines: customLines });
    allLines.push(...customLines);
  }

  // ふゅ・てゅ・でゅは必ず最後。
  if (settings.shortU) {
    const shortLines = buildShortULines(settings);
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

  moraSettingsTitle.textContent = mode === "cvvc" ? t("cvvc_settings") : t("vcv_settings");
  templateRule.textContent = preset.rule;
  templateExample.textContent = preset.example;

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

function buildCvvcMainLine(id, settings, customGroup = null) {
  const seq = customGroup ? customGroup.sequence : getVcvSequence(id);
  const template = CVVC_8MORA_TEMPLATES[settings.vcvNPosition];
  const tokens = template.map(step => {
    if (step === "N") return "ん";
    return seq[step];
  });

  return {
    groupId: id,
    kind: "vc-main",
    text: "_" + tokens
      .map(sound => customGroup ? sound : displaySound(sound, id, settings, false, true))
      .join(""),
    tokens
  };
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

function buildCvvcStartLine(id, settings, customGroup = null) {
  const seq = customGroup ? customGroup.sequence : getVcvSequence(id);
  const formalIndices = customGroup
    ? [0, 1, 2, 3, 4]
    : getCvvcStartIndices(id, settings);

  // 主行第一拍已经承担 -A，只补其余正式CV。
  const remaining = formalIndices.filter(idx => idx !== 0);
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

  // 母音句首行。
  for (const sound of ["あ","い","う","え","お","ん"]) {
    coveredStart.add(`start::VOWEL::${sound}`);
  }

  for (const group of build.groups) {
    const id = group.id;

    if (id === "VOWEL") continue;

    if (id === "SHORT_U") {
      for (const sound of SHORT_U_SOUNDS) {
        coveredStart.add(`start::SHORT_U::${sound}`);
      }
      continue;
    }

    const cg = id === "CUSTOM_VCV" ? customGroup : null;
    const seq = cg ? cg.sequence : getVcvSequence(id);
    const formalIndices = cg ? [0,1,2,3,4] : getCvvcStartIndices(id, settings);

    // 主行第一拍。
    if (formalIndices.includes(0)) {
      coveredStart.add(`start::${id}::${seq[0]}`);
    }

    // 句首补充行。
    for (const idx of formalIndices) {
      coveredStart.add(`start::${id}::${seq[idx]}`);
    }

    // 完整五音主行按模板设计，必定覆盖 a/i/u/e/o/N C。
    for (const ctx of ["a","i","u","e","o","N"]) {
      coveredVc.add(`vc::${id}::${ctx}`);
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

  // 句首母音/ん。
  groups.push({
    id: "VOWEL",
    lines: buildCvvcVowelLines()
  });

  for (const id of CVVC_ORDER) {
    if (id === "VOWEL" || id === "__CUSTOM__" || id === "__SHORT_U__") continue;
    if (!isEnabledGroup(id, settings)) continue;

    const seq = getVcvSequence(id);
    if (seq.length !== 5) continue;

    const main = buildCvvcMainLine(id, settings);
    const start = buildCvvcStartLine(id, settings);

    const lines = [main];
    if (start) lines.push(start);

    groups.push({ id, lines });
  }

  // 自定义完整五音组：普通完整组规则，放在短特殊组之前。
  if (customGroup && !customGroup.incomplete && !customGroup.duplicate) {
    const main = buildCvvcMainLine(customGroup.id, settings, customGroup);
    const start = buildCvvcStartLine(customGroup.id, settings, customGroup);
    groups.push({
      id: customGroup.id,
      lines: start ? [main, start] : [main]
    });
  }

  // ふゅ・てゅ・でゅ永远最后，只录句首CV。
  if (settings.shortU) {
    groups.push({
      id: "SHORT_U",
      lines: buildCvvcShortULines(settings)
    });
  }

  const required = buildCvvcRequired(settings, customGroup);
  const allLines = groups.flatMap(group => group.lines);

  const rawText = groups
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
  } else {
    foreignSectionTitle.textContent = t("section_foreign_rentan");
    displaySectionTitle.textContent = t("section_display_rentan");
    resultTitle.textContent = t("section_result_rentan");
  }

  syncRequiredGroups();

  if (output.value) {
    const settings = getSettings();

    if (settings.mode === "cv") {
      resultMeta.textContent = t("meta_cv")(countCvSounds(settings));
    } else if (settings.mode === "vcv") {
      const count = lastVcvBuild?.allLines.length ?? output.value.split("\n").filter(Boolean).length;
      resultMeta.textContent = t("meta_vcv")(count);
    } else if (settings.mode === "cvvc") {
      const count = output.value.split("\n").filter(Boolean).length;
      resultMeta.textContent = t("meta_cvvc")(count);
    } else {
      const count = output.value.split("\n").filter(Boolean).length;
      resultMeta.textContent = t("meta_rentan")(count, settings.rentanSet);
    }
  }
}

function syncUi() {
  const mode = getMode();
  const isCv = mode === "cv";
  const isRentan = mode === "rentan";
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
  rentanSetPanel.classList.toggle("hidden", !isRentan);
  cvOptions.classList.toggle("hidden", !isCv);
  rentanOptions.classList.toggle("hidden", !isRentan);

  // VCV/CVVC共用：8 mora / ん位置 / helper。
  vcvOptions.classList.toggle("hidden", !isContinuous8);
  vcvCustomPanel.classList.toggle("hidden", !isContinuous8);
  cvvcNumberingRow.classList.toggle("hidden", !isCvvc);

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

  if (isRentan) {
    renderPreview();
  }

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

  } else if (settings.mode === "vcv") {
    lastCvvcBuild = null;
    lastVcvBuild = buildVcv(settings);
    output.value = lastVcvBuild.text;
    resultMeta.textContent = t("meta_vcv")(lastVcvBuild.allLines.length);
    coverageMainLabel.textContent = t("vcv_check");
    coverageStartLabel.textContent = t("starting_sounds_check");
    renderCoverage(lastVcvBuild);

  } else if (settings.mode === "cvvc") {
    lastVcvBuild = null;
    const build = buildCvvc(settings);
    lastCvvcBuild = build;
    output.value = build.text;
    resultMeta.textContent = t("meta_cvvc")(build.allLines.length);
    renderCvvcCoverage(build);

  } else {
    lastVcvBuild = null;
    lastCvvcBuild = null;
    output.value = buildRentanText(settings);
    const count = output.value.split("\n").filter(Boolean).length;
    resultMeta.textContent = t("meta_rentan")(count, settings.rentanSet);
    coverageSummary.classList.add("hidden");
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
  '.foreign-toggle, .cv-extra-toggle, #short-u-toggle, #cvvc-numbering, input[name="yi"], input[name="wu"], input[name="fu"], input[name="rentan-set"], input[name="vcv-n-position"], input[name="vcv-helper"]'
).forEach(el => el.addEventListener("change", () => {
  markOutputDirty();
  syncRequiredGroups();
  updateVcvTemplateExample();
  if (getMode() === "rentan") renderPreview();
  refreshUiText();
  updateCustomVcvStatus();
}));

Object.values(customInputs).forEach(input => {
  input.addEventListener("input", () => {
    markOutputDirty();
    updateCustomVcvStatus();
  });
});

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
