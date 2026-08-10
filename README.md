# UTAU Reclist Generator

UTAU 日语音源录音表生成工具。  
可以根据录音形式、音素和部分排列设置生成 reclist。

界面支持 **中文 / 日本語 / English**。

支持：

- 单独音（CV）
- 连单术（RenTanJutsu / RTJ）
- 连续音（VCV）
- CVVC

Created by **itsukiMNE**

## 录音形式简介

- **CV**：每个音单独录制，结构简单、原音设定直观，但录音时需要自己注意音长和发声状态的一致性。
- **RenTanJutsu / RTJ**：连续录制单独音，更容易保持音长和发声状态稳定，也方便切出部分 VC。推荐第一次录制 UTAU 音源的人使用。RTJ 不包含全部 VC 音素，如需完整 VC，请使用 CVVC。
- **VCV**：录制母音到下一个音的连续连接，衔接自然，但需要录制较多的音，原音设定量也很大。
- **CVVC**：录制完整的 CV 和 VC 音素，原音设定相对复杂，比较适合有一定 UTAU 音源制作经验的人。

## 设计目标

本工具希望生成有规律、容易记、相同子音集中，并且可以轻松连续录制的录音表。

相比单纯压缩录音量，更重视实际录音时的顺畅程度和发音规律。

部分排列和音素设计基于 itsukiMNE 使用的录音表和实际原音设定经验。

## 自定义

连续音和 CVVC 支持追加自定义的 a / i / u / e / o 音节组。目前一次只能添加一组。

部分外来语音素和录音表记也可以根据需要调整。

## 导出

生成结果可以直接复制，或保存为 `.txt` 文件。

文件编码可以选择：

- **ANSI**：OREMO 使用。OREMO 读取其他编码时会出现乱码。
- **UTF-8**：用于其他支持 UTF-8 的工具。

文件名格式：

`reclist_[TYPE]_[ENCODING]_[YYMM].txt`

例如：

- `reclist_CV_ANSI_2608.txt`
- `reclist_RTJ_ANSI_2608.txt`
- `reclist_VCV_UTF8_2608.txt`
- `reclist_CVVC_UTF8_2608.txt`

其中 `YYMM` 为生成时设备的本地年月。

## Author

**itsukiMNE**
