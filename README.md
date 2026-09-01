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

已查证：**DeepSeek Harness（dsh）会自动读取 `.agents` 目录**——用户级 `~/.agents/skills/` 与项目级 `<项目>/.agents/skills/`（源码 `dsh-skill-filesystem` 的默认 roots），无需任何插件或配置。所以安装就是「把 skill 目录放进 `.agents/skills/`」：

```bash
git clone https://github.com/HOWILLMAKEIT/skills.git
mkdir -p ~/.agents/skills
cp -R skills/video-summary skills/undress skills/learn-by-running-code ~/.agents/skills/
```

- **DSH**：放入后新开会话即可在 skill 列表中看到并自动触发；
- **项目级安装**：把 skill 目录放进 `<项目>/.agents/skills/`，只对该项目生效；
- **Claude Code** 等读取各自目录（如 `~/.claude/skills`）的 agent，做个软链即可：

```bash
ln -s ~/.agents/skills/video-summary ~/.claude/skills/video-summary
```

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
