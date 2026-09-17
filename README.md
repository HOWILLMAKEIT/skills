# skills

个人维护的 Agent Skills 合集，适用于 Claude Code、Codex 等 46+ 编码 agent（遵循 [Agent Skills 规范](https://agentskills.io)）。

这个合集把日常技术工作里「值得沉淀成可复用流程」的事情，做成了带 `SKILL.md` 入口的技能包：

- **better-decision**：分清“值得做”和“现在最该做”，识别生产性逃避，把取舍落到可验证的下一步；
- **better-notes**：让 llm 写笔记前先核对官方文档、论文与文章，避免使用过时 API 或无依据内容，同时遵循个人比较认可的笔记风格；
- **video-summary**：给 agent 一个视频链接，快速产出 BibiGPT 风格的结构化总结；
- **undress**：帮你看穿论文、项目、简历里的包装话术；
- **learn-by-running-code**：先分清学知识还是做项目；学习模式生成渐进课程，项目模式经过需求澄清与规划，在真实代码库中边做边学直到验收。

每个 skill 都有明确的使用边界、工作流和可验证的完成标准。

## 包含的 Skill

| Skill | 说明 |
| --- | --- |
| [better-decision](./better-decision/) | 在多个合理任务中确定当前优先级，区分逃避、必要准备、阻塞与休息，给出最小行动和复查条件 |
| [better-notes](./better-notes/) | 让 llm 生成有事实依据的技术与知识笔记：写作前先检索一手资料，核对版本、弃用和替代 API，再用简洁、无比喻、输入输出明确的方式成文 |
| [video-summary](./video-summary/) | BibiGPT 风格视频总结：输入 Bilibili / YouTube 链接，抓取字幕/转写并生成 TL;DR、核心要点、章节时间线、金句（支持中英文） |
| [undress](./undress/) | 技术工作去包装：去掉论文、开源项目、简历等材料中的包装性语言，说清作者实际复用了什么、修改了什么、实现了什么、验证了什么 |
| [learn-by-running-code](./learn-by-running-code/) | 知识学习与项目实作双模式：先明确意图，学习按独立章节推进，项目经多轮澄清、本地材料检查或主动调研后，按里程碑实现与验收 |

### learn-by-running-code：学知识，也做项目

- **学知识**：“用可运行章节教我 asyncio。”先确认课程大纲，再生成独立运行的 Python/uv 章节。
- **做项目**：“带我完成领域 SFT，我有本地数据和代码。”先交流领域、数据、预算、分工与验收；读取已有材料，需求模糊则主动调研推荐；确认计划后从最小闭环逐步完成真实交付，不强制改用课程目录或 Python/uv。

详见[使用说明](./learn-by-running-code/README.md)和[项目规划流程](./learn-by-running-code/references/project-planning.md)。

知识学习采用：**最小知识讲解 → worked example → 代码映射 → 预测与运行 → 引导实践 → 独立实践 → 检索与自我解释**；项目模式按里程碑补所需知识，按确认分工实现，不把整套课程练习强加给项目。教学设计参考：

- [Rosenshine 的教学原则](https://www.aft.org/sites/default/files/Rosenshine.pdf)：小步讲授、教师示范、引导练习、检查理解，再独立练习；
- [Roediger 与 Karpicke（2006）](https://pubmed.ncbi.nlm.nih.gov/16507066/)：检索练习有助于长期保持；
- [Chi 等（1989）](https://asu.elsevierpure.com/en/publications/self-explanations-how-students-study-and-use-examples-in-learning/)：自我解释促使学习者把示例步骤连接到原理；
- [Sweller 的认知负荷研究回顾](https://link.springer.com/article/10.1007/s10648-023-09817-2)：对新手先提供 worked example 和适当指导，减少无效搜索占用的工作记忆。

两种模式都生成或增量维护根目录 `AGENTS.md` 与 `PROGRESS.md`。项目模式另用 `PROJECT.md` 保存确认范围、资源边界和验收计划；后续 Agent 可从未完成里程碑续作，不把脚手架、mock 或结构校验当成项目完成。

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
mkdir -p ~/.claude/skills && cp -R better-decision better-notes video-summary undress learn-by-running-code ~/.claude/skills/
# Codex
mkdir -p ~/.codex/skills && cp -R better-decision better-notes video-summary undress learn-by-running-code ~/.codex/skills/
# DSH（已查证：dsh 自动读取 ~/.agents/skills，源码 dsh-skill-filesystem 默认 roots）
mkdir -p ~/.agents/skills && cp -R better-decision better-notes video-summary undress learn-by-running-code ~/.agents/skills/

# 不想复制多份？用软链（后续升级 = git pull 即生效）
ln -s "$(pwd)/better-notes" ~/.agents/skills/better-notes
```

### 目录对照与生效方式

| Agent | 全局技能目录 | 项目级技能目录 | 生效方式 |
| --- | --- | --- | --- |
| Claude Code | `~/.claude/skills/` | `<项目>/.claude/skills/` | 新开会话 |
| Codex | `~/.codex/skills/` | `<项目>/.agents/skills/` | 新开会话 |
| DSH | `~/.agents/skills/` | `<项目>/.agents/skills/` | 新开会话后自动触发，无需任何插件/配置 |

注：Codex 与 DSH 的项目级目录相同（`.agents/skills`），装一份两边都能用。

## better-decision：先做当前最重要的事

输入目标、候选任务、期限和可用时间，输出“当前先做什么 → 最小行动与完成标准 → 暂缓什么 → 何时复查”。例如：“我一直研究求职方法却没投简历，帮我决定今天先做什么。”

它不把忙碌直接判为逃避，也不把休息判为懒惰；方法参考拖延的情绪调节解释、if–then 行动计划与进度监测研究。见[使用说明](./better-decision/README.md)与[依据及局限](./better-decision/references/evidence.md)。

## better-notes：先查资料，再写笔记

**作用**：当用户要求编写、整理或重写技术与知识笔记时，先检索并阅读官方文档、发布说明、论文、官方仓库或高质量文章，再开始写作。涉及 API、命令或依赖时，会专门核对目标版本、弃用状态、替代方案和迁移方式。

默认输出使用简洁 Markdown：标题后列实际使用的资料，正文直接给出定义，按主题说明前置条件、输入、处理、输出、最小示例、限制与常见错误。不会用比喻代替定义，也不会在无法取得必要来源时退回到纯记忆写作。

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
