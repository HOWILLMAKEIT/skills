# skills

个人维护的 Agent Skills 合集，适用于 Claude Code、Codex 等 46+ 编码 agent（遵循 [Agent Skills 规范](https://agentskills.io)）。

这个合集把日常技术工作里「值得沉淀成可复用流程」的事情，做成了带 `SKILL.md` 入口的技能包：

- **video-summary**：给 agent 一个视频链接，快速产出 BibiGPT 风格的结构化总结；
- **undress**：帮你看穿论文、项目、简历里的包装话术；
- **learn-by-running-code**：把一个学习主题变成「边读代码边运行边问 agent」的渐进式学习仓库。

每个 skill 都有明确的使用边界、工作流和可验证的完成标准。

## 包含的 Skill

| Skill | 说明 |
| --- | --- |
| [video-summary](./video-summary/) | BibiGPT 风格视频总结：输入 Bilibili / YouTube 链接，抓取字幕/转写并生成 TL;DR、核心要点、章节时间线、金句（支持中英文） |
| [undress](./undress/) | 技术工作去包装：去掉论文、开源项目、简历等材料中的包装性语言，说清作者实际复用了什么、修改了什么、实现了什么、验证了什么 |
| [learn-by-running-code](./learn-by-running-code/) | 把一个学习主题做成按章节编号、每章只新增一个概念、可独立运行的代码仓库，通过学习代码掌握知识 |

## 仓库结构

```text
.
├── README.md
├── LICENSE
├── scripts/
│   └── validate-skills.mjs            # 合集结构校验（可本地运行）
└── <skill>/
    ├── SKILL.md                       # 技能入口（含 name + description frontmatter）
    ├── references/                    # 按需加载的参考文档
    ├── scripts/                       # skill 自带脚本
    └── assets/ evals/                 # 模板与评估（可选）
```

## 安装

三种方式等价（本质都是把 skill 目录放进 agent 的技能目录），任选其一。

### 方式一：npx 一键安装（推荐，Claude Code / Codex）

标准 [skills](https://www.npmjs.com/package/skills) 安装器，默认以软链方式装到各 agent 目录：

```bash
# Claude Code：全局安装全部 skill
npx -y skills@latest add HOWILLMAKEIT/skills --skill '*' -g -a claude-code -y
# Codex or deepseek harness：全局安装全部 skill
npx -y skills@latest add HOWILLMAKEIT/skills --skill '*' -g -a codex -y
# 只装一个 skill、装到当前项目：--skill video-summary，并去掉 -g
# 升级：npx -y skills@latest update video-summary -g
```

### 方式二：手动复制 / 软链（通用，含 DSH）

```bash
git clone https://github.com/HOWILLMAKEIT/skills.git && cd skills

# Claude Code
mkdir -p ~/.claude/skills && cp -R video-summary undress learn-by-running-code ~/.claude/skills/
# Codex
mkdir -p ~/.codex/skills && cp -R video-summary undress learn-by-running-code ~/.codex/skills/
# DSH（已查证：dsh 自动读取 ~/.agents/skills，源码 dsh-skill-filesystem 默认 roots）
mkdir -p ~/.agents/skills && cp -R video-summary undress learn-by-running-code ~/.agents/skills/

# 不想复制多份？用软链（后续升级 = git pull 即生效）
ln -s "$(pwd)/video-summary" ~/.agents/skills/video-summary
```

### 目录对照与生效方式

| Agent | 全局技能目录 | 项目级技能目录 | 生效方式 |
| --- | --- | --- | --- |
| Claude Code | `~/.claude/skills/` | `<项目>/.claude/skills/` | 新开会话 |
| Codex | `~/.codex/skills/` | `<项目>/.agents/skills/` | 新开会话 |
| DSH | `~/.agents/skills/` | `<项目>/.agents/skills/` | 新开会话后自动触发，无需任何插件/配置 |

注：Codex 与 DSH 的项目级目录相同（`.agents/skills`），装一份两边都能用。

## video-summary：视频总结

**作用**：参考 [BibiGPT-v1](https://github.com/JimmyLv/BibiGPT-v1) 的总结管线，让 agent 收到视频链接后自动完成「URL 解析 → 字幕/转写抓取 → 结构化总结」两步流程，输出：

- **TL;DR**：一句话概括整支视频；
- **核心要点**：带真实时间戳的要点列表；
- **章节时间线**：按内容节奏切分，时间戳可点击跳转（B 站 `?t=秒` / YouTube `&t=秒`）；
- **金句**：原文引用 + 秒数。

**使用方式**：装好后直接在对话里发链接并说「总结这个视频 / 提炼要点 / 做视频笔记」即可，支持：

| 平台 | 链接形式 | 说明 |
| --- | --- | --- |
| Bilibili | `bilibili.com/video/BVxxx`、`b23.tv` 短链、`?p=N` 多 P | 零依赖纯 API 抓取；字幕（CC/AI）需 B 站登录态 |
| YouTube | `youtube.com/watch`、`youtu.be`、`shorts` | 走 yt-dlp（无 PATH 时自动 `uvx` 零安装运行） |

**B 站登录态**（决定能否拿到完整字幕）：

```bash
# 方式一：浏览器登录 bilibili.com → F12 → Application → Cookies → 复制 SESSDATA
export BILIBILI_SESSDATA="<你的SESSDATA>"
# 方式二：直接读浏览器登录态
export BILIBILI_COOKIES_FROM_BROWSER=chrome   # 或 edge；safari 受 macOS 隐私保护可能失败
```

无登录态时 skill 不会悄悄降级：会返回 `login-required` 引导你先登录；你确认无法登录后才加 `--allow-desc-fallback` 降级为「标题+简介」粗略总结。无字幕视频可进阶走本地 ASR（见 [video-summary/references](./video-summary/references/)）。

## 新增 skill

顶层新建同名目录，写入带 `name` + `description` frontmatter 的 `SKILL.md`，并在上方表格加一行；`node scripts/validate-skills.mjs` 可本地校验合集结构。

## 发布

打 tag 并创建 GitHub Release（GitHub 会自动附上该 tag 的 Source code (zip/tar.gz) 压缩包，Release 说明写清本次修改内容即可）：

```bash
git tag vX.Y.Z && git push origin main vX.Y.Z
gh release create vX.Y.Z --title "vX.Y.Z" --notes "- 本次修改内容…"
```

## License

[MIT](./LICENSE)
