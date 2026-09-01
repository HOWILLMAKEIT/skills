---
name: video-summary
description: |
  BibiGPT 风格视频总结：输入 Bilibili / YouTube 视频链接，快速抓取字幕/转写文本，并生成结构化总结（TL;DR、核心要点、章节时间线、金句，支持中英文）。Use when the user shares a video link (bilibili.com, b23.tv, youtube.com, youtu.be) and asks to summarize it, extract key points, get subtitles/transcript, 总结视频, 提炼要点, 视频笔记.
allowed-tools: Bash(python3 *), Bash(curl *), Bash(uvx *), Bash(yt-dlp *), Bash(brew *), Bash(pipx *)
---

# video summary

参考 BibiGPT-v1 的视频总结管线：URL 解析 → 字幕/转写获取 → 结构化总结。
两步完成：① 用本 skill 的脚本抓字幕（输出统一 JSON）；② 由你自己（agent 的 LLM 能力）按模板生成四段式总结。

## Before running any command

**1. yt-dlp（YouTube 必需；B 站主路径零依赖，可不需要）**

脚本会自动探测：优先 PATH 中的 `yt-dlp`，否则用 `uvx yt-dlp` 零安装运行。若两者都不可用且你需要处理 YouTube：

```bash
brew install yt-dlp        # 或 pipx install yt-dlp；有 uv 时：uv tool install yt-dlp
```

**2. BILIBILI_SESSDATA（B 站字幕必需）**

实测（2026-08）：B 站字幕（CC 与 AI 字幕）自 2023 年起需要登录态，无 cookie 时字幕接口恒返回空列表（元数据与弹幕不受影响）。所以总结 B 站视频前先确认登录态：

```bash
# 获取：浏览器登录 bilibili.com → DevTools → Application → Cookies → 复制 SESSDATA 值
export BILIBILI_SESSDATA="粘贴你的SESSDATA"
```

无 SESSDATA 时脚本**不会自动降级**：B 站视频若因此拿不到字幕，脚本返回 `source=login-required`（exit 5）+ `login_guide`——此时你必须**先停下向用户说明并引导登录**（见下方「登录引导流程」），仅在用户明确表示无法登录或同意降级后，才加 `--allow-desc-fallback` 降级为「标题+简介」粗略总结，并在输出中声明该结论基于简介而非字幕。

## When to use

- 用户给出视频链接（bilibili.com / b23.tv / youtube.com / youtu.be）并要求总结、提炼要点、做笔记
- 用户要求获取视频字幕/转写文本
- 长视频快速了解内容（先给 TL;DR 再决定是否细看）

## Workflow

### Step 1：抓取字幕/转写

```bash
# <skill_dir> = 本 SKILL.md 所在目录（如 ~/.agents/skills/video-summary 或 ~/.claude/skills/video-summary）
python3 "<skill_dir>/scripts/fetch_transcript.py" "<视频URL>"
```

脚本输出统一 JSON：

| 字段 | 说明 |
|---|---|
| `service` / `video_id` | 平台与视频 id（BV 号 / av 号 / YouTube 11 位 id） |
| `title` / `desc` / `owner` / `duration` | 视频元数据 |
| `transcript` | `[{"text": "...", "index": 0, "s": 12.4}, ...]`，每 7 条字幕合并为一段，`s` 为段首真实秒数 |
| `source` | `bilibili-cc-subtitle` → `bilibili-ai-subtitle` → `youtube-subs` → `youtube-auto-subs` → `login-required`（B 站无登录态，先引导登录）→ `desc-fallback`（用户同意后的简介兜底） |
| `warnings` | 降级原因与风险提示，**必须读** |
| `login_required` / `login_guide` | 仅 `source=login-required` 时出现：登录状态标记 + 具体登录引导步骤 |

降级链（BibiGPT 同款）：**CC 字幕 → AI 字幕 → auto-subs → desc+dynamic 简介兜底**。
`source=desc-fallback` 时 `transcript` 为空数组——只能基于标题与简介总结，并明确声明。
B 站无登录态拿不到字幕时会先停在 `login-required`（exit 5），走下面的登录引导流程。

### Step 1.5：`source=login-required`（exit 5）→ 先引导用户登录

**不要直接降级。** 此时先向用户说明并给出选择：

> 该视频需要 B 站登录态才能抓取字幕（B 站 2023 年起限制）。请选择：
> 1. **提供登录态后我重试**（可生成基于完整字幕的高质量总结）：浏览器登录 bilibili.com → F12 DevTools → Application → Cookies 复制 `SESSDATA`，然后 `export BILIBILI_SESSDATA="<值>"`；或告诉我你用的浏览器，我直接设 `BILIBILI_COOKIES_FROM_BROWSER=chrome|edge` 读取登录态
> 2. **无法登录 / 不想登录**：我基于标题+简介生成粗略总结（信息量有限，无时间线与金句）

- 用户配置好登录态后，**重跑 Step 1 同一条命令**；
- 用户明确选择降级后，加 `--allow-desc-fallback` 重跑，此时才会产出 `desc-fallback` 结果。

常用变体：

```bash
# B 站多 P 视频
python3 .../fetch_transcript.py "https://www.bilibili.com/video/BVxxx?p=3"
# b23.tv 短链（脚本自动跟随 302）
python3 .../fetch_transcript.py "https://b23.tv/xxxxxxx"
# 保存到文件；--max-bytes 0 关闭 6200 字节随机减半压缩
python3 .../fetch_transcript.py "<URL>" --out /tmp/vt.json --max-bytes 0
# B 站强制走 yt-dlp（默认 auto：纯 API 优先、yt-dlp 兜底）
python3 .../fetch_transcript.py "<URL>" --engine ytdlp
```

### Step 2：生成 BibiGPT 风格结构化总结（由你完成）

把 `title` + `transcript`（格式化为 `- {s} - {text}` 行）作为输入，按下面模板输出中文（用户用英文提问则输出英文）：

```markdown
## TL;DR
（一句话，≤50 字，概括整支视频）

## 核心要点
- 83 - 要点文字（每条至少 15 词，时间戳取自 transcript 的真实秒数）
- ...

## 章节时间线
- 0 - 开场：一句话说明
- 126 - 章节名：一句话说明
- ...

## 金句
> "原文金句"（83）
> ...
```

**时间戳防幻觉规则（强制）**：
- 所有秒数必须来自 transcript 中真实存在的 `s` 值，禁止编造；
- 展示时格式化为 `m:ss`（超过 1 小时用 `h:mm:ss`）；
- 章节时间线：若字幕无明确章节边界，按内容节奏切 3-8 段，时间戳仍必须对齐真实 `s`；
- 金句必须是原文引用（可修正错别字），后附真实秒数。

时间戳深链（可直接拼在输出里方便用户跳转）：
- B 站：`https://www.bilibili.com/video/{BV号}/?t={整数秒}`
- YouTube：`https://www.youtube.com/watch?v={id}&t={整数秒}`

### `source=desc-fallback` 时的输出要求

在总结最前面加一行声明，例如：

> ⚠️ 该视频未获取到字幕，以下总结基于视频标题与 UP 主简介生成（B 站字幕需登录态）。配置 `BILIBILI_SESSDATA` 后可获得基于完整字幕的总结。

## Options

| Option | Description |
|--------|-------------|
| `--page N` | B 站分 P（默认取 URL `?p=` 参数或 1） |
| `--group N` | 每段合并字幕条数（默认 7，BibiGPT 同款） |
| `--max-bytes N` | transcript 字节上限，超限随机减半压缩（默认 6200，BibiGPT 同款；0 关闭） |
| `--out FILE` | 结果写入 JSON 文件（默认 stdout） |
| `--engine auto/api/ytdlp` | B 站抓取引擎：`auto`=纯 API 优先 + yt-dlp 兜底（默认）；`api`=零依赖纯 API；`ytdlp`=直接 yt-dlp |
| `--allow-desc-fallback` | B 站无登录态拿不到字幕时，允许直接降级为「标题+简介」总结（默认先返回 `login-required` 引导用户登录，exit 5；**仅在用户同意降级后使用**） |
| 环境变量 | `BILIBILI_SESSDATA`（B 站字幕必需；yt-dlp 路径自动转成 cookie jar）、`BILIBILI_COOKIES`（现成 Netscape cookie jar 路径，优先级最高）、`BILIBILI_COOKIES_FROM_BROWSER`（浏览器名如 `chrome`，直接读浏览器登录态）、`YOUTUBE_COOKIES`（YouTube cookies.txt 路径，风控时使用）、`VIDEO_SUMMARY_ENGINE`（同 `--engine`） |

## Troubleshooting

| 现象 | 原因与处理 |
|---|---|
| B 站 `source` 是 `login-required`（exit 5） | 未配置登录态导致拿不到字幕（实测无 cookie 时字幕列表恒为空）。按「登录引导流程」先引导用户登录再重试；**不要未经用户同意直接 `--allow-desc-fallback`** |
| 配了 SESSDATA 仍无字幕（`desc-fallback`） | 该视频确实没有 CC/AI 字幕（登录态已带上）；可用简介兜底，或进阶走本地 ASR（见 references/advanced-transcription.md） |
| `BILIBILI_COOKIES_FROM_BROWSER=safari` 报 Operation not permitted | macOS 隐私保护拦截终端读取 Safari cookie 库；改用 `chrome`/`edge`（首次读 Chrome 需在钥匙串弹窗允许），或给终端开「完全磁盘访问」权限 |
| YouTube 报网络错误 | 本机需可达 youtube.com（实测依赖本地代理 127.0.0.1:7897 一类）；提示用户检查代理 |
| YouTube 报 JS runtime 警告 | 脚本已自动加 `--js-runtimes node`（需本机有 node）；仅警告不影响字幕抓取 |
| yt-dlp 报 412/风控（B 站） | 脚本已自动带浏览器 UA + Referer；仍失败时确认 SESSDATA 未过期 |
| 退出码 2 / 3 / 4 / 5 | 2=不支持的链接；3=抓取失败（看 stderr 的 error 字段）；4=缺少 yt-dlp（按安装引导安装）；5=B 站需要登录态（走登录引导流程，用户同意后才 `--allow-desc-fallback`） |

## See also

- [references/prompt-templates.md](references/prompt-templates.md) — BibiGPT 原版 prompt 模板（Summary/Highlights 两段式、带时间戳版、system prompt）与本 skill 四段式的对应关系
- [references/advanced-transcription.md](references/advanced-transcription.md) — 无字幕视频的本地 ASR 转写进阶方案（whisper 系）与 danmaku 辅助参考
