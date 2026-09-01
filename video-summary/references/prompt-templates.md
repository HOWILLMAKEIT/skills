# Prompt 模板：BibiGPT 原版 ↔ video-summary 四段式

> 来源：BibiGPT-v1 `lib/openai/prompt.ts`（变量语法已展开）。本 skill 的 Step 2 默认用四段式；
> 若用户明确要 BibiGPT 原版样式（Summary + Highlights），用 §1 原版模板。

## 1. BibiGPT 原版：无时间戳（getUserSubtitlePrompt）

```
Your output should use the following template:
## Summary
## Highlights
- [Emoji] Bulletpoint

Your task is to summarise the text I have given you in up to {sentenceCount} concise bullet points,
starting with a short highlight, each bullet point is at least {wordsCount} words.
Use the text above: {Title} {Transcript}.

Reply in {languageName} Language.
```

最终 user message 拼接：`Title: "{title}"\nTranscript: "{transcript}"\n\nInstructions: {模板}`

## 2. BibiGPT 原版：带时间戳（getUserSubtitleWithTimestampPrompt）

transcript 先 JSON.stringify，模板：

```
Act as the author and provide exactly {sentenceCount} bullet points for the text transcript
given in the format [seconds] - [text]
Make sure that:
    - Please start by summarizing the whole video in one short sentence
    - Then, please summarize with each bullet_point is at least {wordsCount} words
    - each bullet_point start with "- " or a number or a bullet point symbol
    - each bullet_point should has the start timestamp, use this template: - seconds - [Emoji][bullet_point]
    - there may be typos in the subtitles, please correct them
    - Reply all in {languageName} Language.
```

默认参数：`sentenceCount=7`，`wordsCount=15`（= detailLevel/100*2），`languageName`：zh-CN → Simplified Chinese。

## 3. BibiGPT 原版 system prompt（getSystemPrompt，现役请求未发送，可作为 system 使用）

```
I would like you to act as a professional video content editor. You will help students summarize
the essence of the video in {language}. Please start by summarizing the whole video in one short
sentence (there may be typos in the subtitles, please correct them). Then, please summarize the
video subtitles, each subtitle should has the start timestamp (e.g. 12.4 -) so that students can
select the video part. Please return in an unordered list format, make sure not to exceed
{sentenceCount} items and all sentences are concise, clear, and complete. Good luck!
```

## 4. video-summary 四段式（本 skill 默认，BibiGPT Summary/Highlights 的扩展）

用户消息结构：

```
Title: "{title}"
Transcript:
- 12.4 - 第一段字幕文本
- 83 - 第二段字幕文本
...

Instructions:
按以下模板总结（用户英文提问则全部输出英文）：
## TL;DR
（一句话，≤50 字）
## 核心要点
- {秒} - 要点（3-7 条，每条至少 15 词，修正字幕错别字）
## 章节时间线
- {秒} - 章节名：一句话说明（3-8 段）
## 金句
> "原文金句"（{秒}）（2-4 条，必须是原文引用）

硬性规则：
- 所有 {秒} 必须取自 Transcript 中真实出现的时间戳，禁止编造或插值；
- 金句必须能在 Transcript 中逐字找到（仅允许修正错别字）。
```

### 四段式 ↔ 原版对应关系

| 四段式 | 来源 |
|---|---|
| TL;DR | 原版 "start by summarizing the whole video in one short sentence" |
| 核心要点 | 原版 `## Highlights`（带时间戳 bullet points） |
| 章节时间线 | 新增：结构化拆解（对应用户需求"章节时间线"） |
| 金句 | 新增：原文引用（对应用户需求"金句"） |

## 5. 时间戳渲染与深链（SKILL.md Step 2 规则的实现细节）

- 秒 → `m:ss`：`83 → 1:23`；秒 → `h:mm:ss`：`3725 → 1:02:05`
- B 站深链：`https://www.bilibili.com/video/{BV号}/?t={整数秒}`
- YouTube 深链：`https://www.youtube.com/watch?v={id}&t={整数秒}`
- 整数秒 = `math.floor(s)`，不要四舍五入（避免跳过目标句）
