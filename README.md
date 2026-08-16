# UTAU Reclist Generator

UTAU 日语音源录音表生成工具。  
可以根据录音形式、音素和部分排列设置生成 reclist。

界面支持 **中文 / 日本語 / English**。

> 本工具仍在开发中，正式录音前建议先确认生成结果。

## 支持的录音形式

- **CV**：每个音单独录制，结构简单、原音设定直观，但录音时需要自己注意音长和发声状态的一致性。
- **RenTanFu（连单风 / れんたん風）**：一条音频录制多个彼此分开的单独音。例如 `_か_き_く_け_こ`。外观看起来接近连续录音，但每个音仍然分开录制。
- **RenTanJutsu（连单术 / れんたんじゅつ）**：连续录制单独音，更容易保持音长和发声状态稳定，也方便切出部分 VC。推荐第一次录制 UTAU 音源的人使用。不包含全部 VC 音素，如需完整 VC，请使用 CVVC。
- **VCV**：录制母音到下一个音的连续连接，衔接自然，但需要录制较多的音，原音设定量也很大。
- **CVVC**：录制完整的 CV 和 VC 音素，原音设定相对复杂，比较适合有一定 UTAU 音源制作经验的人。

RenTanFu 与 RenTanJutsu 提供两种日语音素配置。

连续音支持 **6～8 mora**，CVVC 支持 **4～8 mora**，并提供相应的排列设置。

## 使用方法

1. 选择录音形式
2. 调整需要的音素、mora 和其他设置
3. 点击「刷新生成」
4. 确认生成结果后复制，或选择编码保存 `.txt`

使用 OREMO 时请选择 **ANSI**；其他支持 UTF-8 的工具可以选择 **UTF-8**。

## 设计目标

本工具希望生成有规律、容易记、相同子音集中，并且可以轻松连续录制的录音表。

相比单纯压缩录音量，更重视实际录音时的顺畅程度和发音规律。

部分排列和音素设计基于 itsukiMNE 使用的录音表和实际原音设定经验。

## 自定义

连续音和 CVVC 支持追加自定义的 a / i / u / e / o 音节组，目前一次只能添加一组。

部分外来语音素和录音表记也可以根据需要调整。

## 导出

文件编码：

- **ANSI**：用于 OREMO
- **UTF-8**：用于其他支持 UTF-8 的工具

文件名格式：

`reclist_[TYPE]_[ENCODING]_[YYMM].txt`

例如：

- `reclist_CV_ANSI_2608.txt`
- `reclist_RTF_ANSI_2608.txt`
- `reclist_RTJ_ANSI_2608.txt`
- `reclist_VCV_UTF8_2608.txt`
- `reclist_CVVC_UTF8_2608.txt`

## 署名 / Credit

一般使用本工具生成的录音表进行录音或制作音源时，**不强制署名**。

如果公开配布本工具生成的录音表，或以生成结果为基础修改后再配布，请在 README 等说明文件中注明：

- UTAU Reclist Generator
- https://itsukimne.github.io/utau-reclist-generator/
- itsukiMNE

示例：

```text
Reclist generated with UTAU Reclist Generator
https://itsukimne.github.io/utau-reclist-generator/
by itsukiMNE
```

## Author

**itsukiMNE**
