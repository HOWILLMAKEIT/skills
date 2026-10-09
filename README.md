<a id="top"></a>

<div align="center">
  <h1>skills</h1>
</div>

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-HOWILLMAKEIT%2Fskills-000000?logo=github&logoColor=white)](https://github.com/HOWILLMAKEIT/skills)&#160;
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)&#160;
[![Skills](https://img.shields.io/badge/skills-6-blue.svg)](#skills)&#160;
[![Agent Skills](https://img.shields.io/badge/spec-Agent%20Skills-6b46c1.svg)](https://agentskills.io)&#160;
[![GitHub stars](https://img.shields.io/github/stars/HOWILLMAKEIT/skills?style=social)](https://github.com/HOWILLMAKEIT/skills)

**把日常技术工作里值得复用的流程，做成带明确边界和完成标准的 Agent Skills。**

[Skills](#skills) | [Quick Start](#quick-start) | [How It Works](#how-it-works) | [Details](#skill-details) | [Contributing](#contributing)

</div>

---

个人维护的 Agent Skills 合集，适用于 Claude Code、Codex 等 46+ 编码 agent（遵循 [Agent Skills 规范](https://agentskills.io)）。每个 skill 以 `SKILL.md` 为入口，写明何时使用、怎么做、怎样算完成。

与只给提示词的合集不同，这里的 skill 有三个共同点：先核对一手资料再下结论、输出区分“已验证 / 来源称 / 推断 / 未确认”、交付前有可检查的完成标准。

## Overview

### Highlights

<table>
<tr>
<td align="center" width="33%">🧭<br/><b>先核对，再下笔</b><br/><sub>笔记、总结、分析都要求回到官方文档、论文、代码或字幕</sub></td>
<td align="center" width="33%">🎯<br/><b>结论有边界</b><br/><sub>每个 skill 写明适用范围、不适用情形和完成标准</sub></td>
<td align="center" width="33%">✍️<br/><b>语言可核对</b><br/><sub>共享 STE 准确性规则与去 AI 味编辑，数字和情态词含义固定</sub></td>
</tr>
<tr>
<td align="center">🧪<br/><b>可运行的校验</b><br/><sub>结构校验器、自动测试与人工回归场景，区分“已运行”和“未验证”</sub></td>
<td align="center">📦<br/><b>多 agent 通用</b><br/><sub>同一套目录可装进 Claude Code、Codex、DSH</sub></td>
<td align="center">🔒<br/><b>不越权</b><br/><sub>外部操作、付费调用和发布需要用户明确授权</sub></td>
</tr>
</table>

### News

- **2026-10-09** 🖼️ v0.10.0：`gpt-paper-image` 改为人机协作：GPT 保存参考图并编写提示词，用户网页生图，GPT 再重建可编辑 PPT。
- **2026-10-08** 🧩 v0.9.0：新增 `gpt-paper-image`；`better-notes` 加入 Obsidian Datacore 组件与设计准则；五个 skill 加入共享的语言准确性规范。详见 [CHANGELOG](./CHANGELOG.md)。
- **2026-10-05** ✍️ v0.8.0：`better-notes` 内置 humanizer 风格编辑。
- **2026-09-17** 🧑‍💻 v0.7.0：`learn-by-running-code` 新增项目实作模式。
- **2026-09-16** 🎯 v0.6.0：新增 `better-decision`。

<details>
<summary>👉 更早的版本（点击展开）</summary>

完整历史见 [CHANGELOG.md](./CHANGELOG.md)。

</details>

## Skills

| Skill | 解决的问题 | 主要产出 |
| --- | --- | --- |
| [better-decision](./better-decision/) | 多件事都合理，不知道现在先做哪件；区分逃避、必要准备、阻塞与休息 | 当前优先事项、最小行动、暂缓项、复查条件 |
| [better-notes](./better-notes/) | 让 llm 写出有事实依据的技术笔记，避免过时 API 和无依据内容 | 带来源与访问日期的 Markdown 笔记；Obsidian 下用 Datacore 组件取代 Mermaid |
| [video-summary](./video-summary/) | 给一个 Bilibili / YouTube 链接，快速看懂视频 | TL;DR、带真实时间戳的要点、章节时间线、金句 |
| [undress](./undress/) | 论文、项目、简历的包装话术 | 作者实际复用、修改、实现、验证了什么，以及哪些结论缺证据 |
| [gpt-paper-image](./gpt-paper-image/) | 论文插图的人机协作绘制与后期修改 | 参考图、网页生图提示词、原生可编辑 PPT 与验证记录 |
| [learn-by-running-code](./learn-by-running-code/) | 学一项技术，或做一个真实项目 | 渐进式可运行课程，或经澄清、规划、验收的项目代码 |

## How It Works

```mermaid
flowchart LR
    A["用户请求"] --> B["SKILL.md<br/>适用范围与工作流"]
    B --> C["一手资料<br/>文档 / 论文 / 代码 / 字幕"]
    C --> D["事实草稿<br/>标注证据强度"]
    D --> E["语言准确性<br/>language-precision.md"]
    E --> F["完成标准检查<br/>校验器 / 测试 / 自检"]
    F --> G["最终交付"]

    style B fill:#e0f2fe,stroke:#0284c7,stroke-width:2px
    style E fill:#fef3c7,stroke:#f59e0b,stroke-width:2px
    style F fill:#f5f3ff,stroke:#8b5cf6,stroke-width:2px
```

1. `SKILL.md` 的 `description` 决定何时触发；正文给出工作流，参考文档按需加载。
2. 事实类内容先读一手资料，再写正文；无法取得时说明缺什么，不用记忆补全。
3. `better-decision`、`better-notes`、`undress`、`video-summary`、`learn-by-running-code` 共用一份 `references/language-precision.md`：把 [ASD-STE100](https://www.asd-ste100.org/)（简化技术英语）的写作原则和 [humanizer](https://github.com/blader/humanizer) 的结构编辑改写成中文规则，默认 80% 模式。它不含 STE 词典，也不声称符合该标准。
4. 交付前对照完成标准：结构校验通过不等于效果已验证，两者分开报告。

## Quick Start

### 方式一：npx 一键安装（推荐）

默认以软链方式装到各 agent 目录：

```bash
# Claude Code：全局安装全部 skill
npx -y skills@latest add HOWILLMAKEIT/skills --skill '*' -g -a claude-code -y
# Codex or deepseek harness：全局安装全部 skill
npx -y skills@latest add HOWILLMAKEIT/skills --skill '*' -g -a codex -y
# 只装一个 skill、装到当前项目：--skill video-summary，并去掉 -g
# 升级：npx -y skills@latest update video-summary -g
```

### 方式二：手动复制或软链（含 DSH）

```bash
git clone https://github.com/HOWILLMAKEIT/skills.git && cd skills

# Claude Code
mkdir -p ~/.claude/skills && cp -R better-decision better-notes video-summary undress learn-by-running-code gpt-paper-image ~/.claude/skills/
# Codex
mkdir -p ~/.codex/skills && cp -R better-decision better-notes video-summary undress learn-by-running-code gpt-paper-image ~/.codex/skills/
# DSH（已查证：dsh 自动读取 ~/.agents/skills，源码 dsh-skill-filesystem 默认 roots）
mkdir -p ~/.agents/skills && cp -R better-decision better-notes video-summary undress learn-by-running-code gpt-paper-image ~/.agents/skills/

# 不想复制多份？用软链（后续升级 = git pull 即生效）
ln -s "$(pwd)/better-notes" ~/.agents/skills/better-notes
```

### 目录对照与生效方式

| Agent | 全局技能目录 | 项目级技能目录 | 生效方式 |
| --- | --- | --- | --- |
| Claude Code | `~/.claude/skills/` | `<项目>/.claude/skills/` | 新开会话 |
| Codex | `~/.codex/skills/` | `<项目>/.agents/skills/` | 新开会话 |
| DSH | `~/.agents/skills/` | `<项目>/.agents/skills/` | 新开会话后自动触发，无需任何插件或配置 |

Codex 与 DSH 的项目级目录相同（`.agents/skills`），装一份两边都能用。

## Skill Details

### better-decision：先做当前最重要的事

输入目标、候选任务、期限和可用时间，输出“当前先做什么 → 最小行动与完成标准 → 暂缓什么 → 何时复查”。例如：“我一直研究求职方法却没投简历，帮我决定今天先做什么。”

它不把忙碌直接判为逃避，也不把休息判为懒惰；方法参考拖延的情绪调节解释、if–then 行动计划与进度监测研究。见[使用说明](./better-decision/README.md)与[依据及局限](./better-decision/references/evidence.md)。

### better-notes：先查资料，再写笔记

当用户要求编写、整理或重写技术与知识笔记时，先检索并阅读官方文档、发布说明、论文、官方仓库或高质量文章，再开始写作。涉及 API、命令或依赖时，核对目标版本、弃用状态、替代方案和迁移方式。

- **输出**：标题后列实际使用的资料，正文直接给出定义，按主题说明前置条件、输入、处理、输出、最小示例、限制与常见错误。不用比喻代替定义，取不到必要来源时不退回到纯记忆写作。
- **语言**：内置改写自 [blader/humanizer](https://github.com/blader/humanizer) 的[风格编辑](./better-notes/references/humanizer.md)与[语言准确性规范](./better-notes/references/language-precision.md)，清理无意义对比、空泛铺垫、重复结尾和宣传词。保留代码、公式、链接以及版本、条件、真实不确定性和引用归属，不附编辑过程或 AI 检测评分。
- **Obsidian**：保存位置在 Obsidian 库内时，用 Datacore 的 JSX 组件取代 Mermaid 图。环境检查、示例和冒烟测试见 [obsidian-datacore.md](./better-notes/references/obsidian-datacore.md)，界面设计准则见 [widget-design.md](./better-notes/references/widget-design.md)。笔记正文不写组件依赖或测试状态说明，这些只在对话里报告。

### video-summary：视频总结

参考 [BibiGPT-v1](https://github.com/JimmyLv/BibiGPT-v1) 的总结管线，收到视频链接后完成「URL 解析 → 字幕/转写抓取 → 结构化总结」两步，输出：

- **TL;DR**：一句话概括整支视频；
- **核心要点**：带真实时间戳的要点列表；
- **章节时间线**：按内容节奏切分，时间戳可点击跳转（B 站 `?t=秒` / YouTube `&t=秒`）；
- **金句**：原文引用 + 秒数。

装好后直接在对话里发链接并说“总结这个视频 / 提炼要点 / 做视频笔记”。

| 平台 | 链接形式 | 说明 |
| --- | --- | --- |
| Bilibili | `bilibili.com/video/BVxxx`、`b23.tv` 短链、`?p=N` 多 P | 零依赖纯 API 抓取；字幕（CC/AI）需 B 站登录态 |
| YouTube | `youtube.com/watch`、`youtu.be`、`shorts` | 走 yt-dlp（无 PATH 时自动 `uvx` 零安装运行） |

<details>
<summary>B 站登录态配置（决定能否拿到完整字幕）</summary>

```bash
# 方式一：浏览器登录 bilibili.com → F12 → Application → Cookies → 复制 SESSDATA
export BILIBILI_SESSDATA="<你的SESSDATA>"
# 方式二：直接读浏览器登录态
export BILIBILI_COOKIES_FROM_BROWSER=chrome   # 或 edge；safari 受 macOS 隐私保护可能失败
```

无登录态时 skill 不会悄悄降级：返回 `login-required` 引导你先登录；你确认无法登录后才加 `--allow-desc-fallback` 降级为“标题+简介”粗略总结。无字幕视频可进阶走本地 ASR（见 [video-summary/references](./video-summary/references/)）。

</details>

### undress：看穿包装

输入论文、仓库、博客或简历项目，输出作者实际复用了什么、修改了什么、实现了什么、验证了什么。区分概念复杂度、实现难度、实验严谨度和证据强度；无法验证的结论写“没有足够证据”，不替作者补全故事，也不反向贬低工作。

### gpt-paper-image：论文插图与可编辑 PPT

使用示例：“用 `$gpt-paper-image` 为这篇论文搜集参考图并写提示词，我在网页端手动生图后，你再转成可编辑 PPT。”GPT 先保存近期领域顶会同类型参考图，结合论文或代码及公开绘图方法准备提示词与上传清单；用户手动生图并提供原图后，GPT 再进行原生 PPT 重建、实际导出复核与留档。已有满意原图时可直接转换。

任务素材保存在对应项目中；技能包仅包含通用流程、公开来源链接和合成测试代码。详见 [SKILL.md](./gpt-paper-image/SKILL.md)。

### learn-by-running-code：学知识，也做项目

- **学知识**：“用可运行章节教我 asyncio。”先确认课程大纲，再生成独立运行的 Python/uv 章节。
- **做项目**：“带我完成领域 SFT，我有本地数据和代码。”先交流领域、数据、预算、分工与验收；读取已有材料，需求模糊则主动调研推荐；确认计划后从最小闭环逐步完成真实交付，不强制改用课程目录或 Python/uv。

详见[使用说明](./learn-by-running-code/README.md)和[项目规划流程](./learn-by-running-code/references/project-planning.md)。

知识学习采用：**最小知识讲解 → worked example → 代码映射 → 预测与运行 → 引导实践 → 独立实践 → 检索与自我解释**；项目模式按里程碑补所需知识，按确认分工实现，不把整套课程练习强加给项目。

两种模式都生成或增量维护根目录 `AGENTS.md` 与 `PROGRESS.md`。项目模式另用 `PROJECT.md` 保存确认范围、资源边界和验收计划；后续 Agent 可从未完成里程碑续作，不把脚手架、mock 或结构校验当成项目完成。

<details>
<summary>教学设计参考</summary>

- [Rosenshine 的教学原则](https://www.aft.org/sites/default/files/Rosenshine.pdf)：小步讲授、教师示范、引导练习、检查理解，再独立练习；
- [Roediger 与 Karpicke（2006）](https://pubmed.ncbi.nlm.nih.gov/16507066/)：检索练习有助于长期保持；
- [Chi 等（1989）](https://asu.elsevierpure.com/en/publications/self-explanations-how-students-study-and-use-examples-in-learning/)：自我解释促使学习者把示例步骤连接到原理；
- [Sweller 的认知负荷研究回顾](https://link.springer.com/article/10.1007/s10648-023-09817-2)：对新手先提供 worked example 和适当指导，减少无效搜索占用的工作记忆。

</details>

## Project Structure

```text
.
├── README.md
├── CHANGELOG.md
├── LICENSE
├── scripts/
│   └── validate-skills.mjs            # 合集结构校验（可本地运行）
└── <skill>/
    ├── SKILL.md                       # 技能入口（含 name + description frontmatter）
    ├── references/                    # 按需加载的参考文档
    │   └── language-precision.md      # 共享的语言准确性规范（部分 skill）
    ├── scripts/                       # skill 自带脚本
    └── assets/ evals/                 # 模板与评估（可选）
```

## Acknowledgements

- [blader/humanizer](https://github.com/blader/humanizer)（作者 Siqi Chen，MIT 协议）：`better-notes` 的 [humanizer 风格编辑](./better-notes/references/humanizer.md)和各 skill 共享的[语言准确性规范](./better-notes/references/language-precision.md)中的去 AI 味部分，由它的结构编辑方法改写为中文，并针对技术内容收紧事实保护边界。它的模式来源于 Wikipedia 的 [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)。本仓库不包含其原文。
- [ASD-STE100](https://www.asd-ste100.org/)（简化技术英语，ASD 维护）：语言准确性规范借鉴其写作原则。本仓库不含其词典，也不声称符合该标准。
- [BibiGPT-v1](https://github.com/JimmyLv/BibiGPT-v1)：`video-summary` 的总结管线与模板参考。
- Anthropic 的 [frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)：`better-notes` 组件设计准则借鉴其原则。

## Contributing

### 新增 skill

顶层新建同名目录，写入带 `name` + `description` frontmatter 的 `SKILL.md`，并在上方 Skills 表格加一行；`node scripts/validate-skills.mjs` 可本地校验合集结构。

### 发布

打 tag 并创建 GitHub Release（GitHub 会自动附上该 tag 的 Source code 压缩包，Release 说明写清本次修改内容即可）：

```bash
git tag vX.Y.Z && git push origin main vX.Y.Z
gh release create vX.Y.Z --title "vX.Y.Z" --notes "- 本次修改内容…"
```

问题与建议：[GitHub Issues](https://github.com/HOWILLMAKEIT/skills/issues)。

## Citation

```bib
@software{howillmakeit_skills,
  author = {HOWILLMAKEIT},
  title  = {{skills: a personal collection of Agent Skills}},
  url    = {https://github.com/HOWILLMAKEIT/skills},
  year   = {2026}
}
```

## License

[MIT](./LICENSE)
