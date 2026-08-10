// sounds.js
// v0.1：先只保留之后 VCV 会需要的母音属性。
// 单独音 / 连单术生成本身不依赖这些属性。

const SOUNDS = {
  "あ": { vowel: "a" }, "い": { vowel: "i" }, "う": { vowel: "u" }, "え": { vowel: "e" }, "お": { vowel: "o" }, "ん": { vowel: "N" },

  "か": { vowel: "a" }, "き": { vowel: "i" }, "く": { vowel: "u" }, "け": { vowel: "e" }, "こ": { vowel: "o" },
  "さ": { vowel: "a" }, "し": { vowel: "i" }, "すぃ": { vowel: "i" }, "す": { vowel: "u" }, "せ": { vowel: "e" }, "そ": { vowel: "o" },
  "た": { vowel: "a" }, "ち": { vowel: "i" }, "てぃ": { vowel: "i" }, "つ": { vowel: "u" }, "とぅ": { vowel: "u" }, "て": { vowel: "e" }, "と": { vowel: "o" },
  "な": { vowel: "a" }, "に": { vowel: "i" }, "ぬ": { vowel: "u" }, "ね": { vowel: "e" }, "の": { vowel: "o" },
  "は": { vowel: "a" }, "ひ": { vowel: "i" }, "ふ": { vowel: "u" }, "へ": { vowel: "e" }, "ほ": { vowel: "o" },
  "ま": { vowel: "a" }, "み": { vowel: "i" }, "む": { vowel: "u" }, "め": { vowel: "e" }, "も": { vowel: "o" },
  "や": { vowel: "a" }, "ゆ": { vowel: "u" }, "いぇ": { vowel: "e" }, "よ": { vowel: "o" },
  "ら": { vowel: "a" }, "り": { vowel: "i" }, "る": { vowel: "u" }, "れ": { vowel: "e" }, "ろ": { vowel: "o" },
  "わ": { vowel: "a" }, "うぃ": { vowel: "i" }, "うぇ": { vowel: "e" }, "うぉ": { vowel: "o" }, "を": { vowel: "o" },

  "が": { vowel: "a" }, "ぎ": { vowel: "i" }, "ぐ": { vowel: "u" }, "げ": { vowel: "e" }, "ご": { vowel: "o" },
  "ざ": { vowel: "a" }, "じ": { vowel: "i" }, "ずぃ": { vowel: "i" }, "ず": { vowel: "u" }, "ぜ": { vowel: "e" }, "ぞ": { vowel: "o" },
  "だ": { vowel: "a" }, "ぢ": { vowel: "i" }, "でぃ": { vowel: "i" }, "づ": { vowel: "u" }, "どぅ": { vowel: "u" }, "で": { vowel: "e" }, "ど": { vowel: "o" },
  "ば": { vowel: "a" }, "び": { vowel: "i" }, "ぶ": { vowel: "u" }, "べ": { vowel: "e" }, "ぼ": { vowel: "o" },
  "ぱ": { vowel: "a" }, "ぴ": { vowel: "i" }, "ぷ": { vowel: "u" }, "ぺ": { vowel: "e" }, "ぽ": { vowel: "o" },

  "きゃ": { vowel: "a" }, "きゅ": { vowel: "u" }, "きぇ": { vowel: "e" }, "きょ": { vowel: "o" },
  "しゃ": { vowel: "a" }, "しゅ": { vowel: "u" }, "しぇ": { vowel: "e" }, "しょ": { vowel: "o" },
  "ちゃ": { vowel: "a" }, "ちゅ": { vowel: "u" }, "ちぇ": { vowel: "e" }, "ちょ": { vowel: "o" },
  "にゃ": { vowel: "a" }, "にゅ": { vowel: "u" }, "にぇ": { vowel: "e" }, "にょ": { vowel: "o" },
  "ひゃ": { vowel: "a" }, "ひゅ": { vowel: "u" }, "ひぇ": { vowel: "e" }, "ひょ": { vowel: "o" },
  "みゃ": { vowel: "a" }, "みゅ": { vowel: "u" }, "みぇ": { vowel: "e" }, "みょ": { vowel: "o" },
  "りゃ": { vowel: "a" }, "りゅ": { vowel: "u" }, "りぇ": { vowel: "e" }, "りょ": { vowel: "o" },
  "ぎゃ": { vowel: "a" }, "ぎゅ": { vowel: "u" }, "ぎぇ": { vowel: "e" }, "ぎょ": { vowel: "o" },
  "じゃ": { vowel: "a" }, "じゅ": { vowel: "u" }, "じぇ": { vowel: "e" }, "じょ": { vowel: "o" },
  "びゃ": { vowel: "a" }, "びゅ": { vowel: "u" }, "びぇ": { vowel: "e" }, "びょ": { vowel: "o" },
  "ぴゃ": { vowel: "a" }, "ぴゅ": { vowel: "u" }, "ぴぇ": { vowel: "e" }, "ぴょ": { vowel: "o" },

  "つぁ": { vowel: "a" }, "つぃ": { vowel: "i" }, "つぇ": { vowel: "e" }, "つぉ": { vowel: "o" },
  "ふぁ": { vowel: "a" }, "ふぃ": { vowel: "i" }, "ふぇ": { vowel: "e" }, "ふぉ": { vowel: "o" },
  "ヴぁ": { vowel: "a" }, "ヴぃ": { vowel: "i" }, "ヴ": { vowel: "u" }, "ヴぇ": { vowel: "e" }, "ヴぉ": { vowel: "o" },
  "てゅ": { vowel: "u" }, "でゅ": { vowel: "u" }, "ふゅ": { vowel: "u" }
};
