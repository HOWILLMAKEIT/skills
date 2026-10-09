# Changelog

本文件记录此仓库的重要变更。版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [0.10.0] - 2026-10-09

### Changed

- `gpt-paper-image` 默认采用人机协作流程：GPT 搜集并保存领域顶会同类型参考图，结合论文或代码编写提示词，用户在网页端手动生图并提供选定原图，GPT 再重建原生可编辑 PPT、实际导出与复核。
- 参考图保存到 `references/images/`，提示词明确各图借鉴用途和上传顺序；新增网页生图交接清单、等待原图与恢复任务说明。
- 区分准备稿与实际提交提示词，手动网页生图的未知模型、时间及来源信息如实留空；已有满意原图可直接进入 PPT 重建。
- 更新 skill 入口、提示词模板、交付规范、OpenAI UI 提示及仓库使用说明，保留原图归档、原生对象重建和实际 PPT 导出验证要求。

### Added

- 归档脚本新增 `handoff` 角色和 `verify --stage handoff`，单独检查参考图、提示词及交接清单，不要求尚未生成的原图或 PPT；保留原有 `--complete` 最终交付检查。
- 新增两项交接阶段回归测试，覆盖准备完成与最终完成的区分、参考图篡改及缺失交接材料；全部九项合成测试通过。

## [0.9.0] - 2026-10-08

### Added

- 新增 `gpt-paper-image`：检索近期顶会图例、编写提示词、用 GPT Image 2 生图并重建为原生可编辑 PPT。
- `better-notes` 同步 Obsidian Datacore 交互组件支持：环境检查、组件示例、冒烟测试与回归场景。
- 为 `undress`、`learn-by-running-code`、`better-notes`、`better-decision`、`video-summary` 新增 `references/language-precision.md`：把 ASD-STE100 的写作原则（一句一事、一词一义、具体动词、固定情态词与证据标签）和 humanizer 的结构编辑方法改写为中文输出规则，默认 80% 模式。

- `better-notes` 新增 `references/widget-design.md`：从 frontend-design、dataviz 和 artifact-diagramming 提取并改写的 Datacore 组件设计准则（沿用主题、选图形式、标记与交互、文案、无障碍），并加入 5 个回归场景。

### Changed

- `better-notes` 不再要求在笔记正文里写组件依赖和验证状态说明，改在回复里报告。
- 各 SKILL.md 增加语言准确性要求及交付检查；`learn-by-running-code` 的 AGENTS 模板同步加入讲解与指令语言条目；`better-notes` 的 humanizer 参考与新规则对齐句长参考值的用法。
- 本规范不含 ASD-STE100 词典，也不声称符合该标准；去 AI 味部分注明改写自 [blader/humanizer](https://github.com/blader/humanizer)（MIT），README 新增 Acknowledgements。

## [0.8.0] - 2026-10-05

### Added

- 为 `better-notes` 内置 humanizer 风格编辑参考与人工回归场景，无需额外安装 `humanizer`。
- 明确去 AI 味的事实保护边界：保留技术内容、版本、实验条件、不确定性、引用归属和用户声音，不虚构经历或承诺通过 AI 检测。

### Changed

- 写作流程增加事实草稿后的内部风格编辑与前后核对，清理无意义对比、空泛铺垫、重复结尾、机械排比、宣传词及装饰格式，只交付最终笔记。
- 笔记风格指南与 README 同步新流程；保留有信息的对比、真实三项列表、语义箭头、必要限制和验证状态。

## [0.7.0] - 2026-09-17

### Added

- 为 `learn-by-running-code` 新增 `project` 项目实作模式：多轮澄清领域、目标、数据、代码基础、预算、资源、协作分工与验收标准；读取用户本地材料，需求模糊时主动调研并比较可行方案。
- 新增项目规划与仓库契约、SFT 规划示例，以及 PROJECT、AGENTS、PROGRESS、README 四类项目模板；确认具体计划后在同一真实代码库上累计推进里程碑直到验收。
- 新增只读、无工具链限制的项目文档结构校验器，以及学习/项目模式和模板一致性的 26 项自动回归测试。
- 行为评估规格扩展为 12 个场景，覆盖意图不明、本地材料、模糊需求、已有仓库、续作、资源阻塞、范围变化和模式切换。

### Changed

- Skill 入口先区分 `learning` 与 `project`；保留原知识先行、独立章节的学习模式，项目模式不强制 Python/uv、空目录或每阶段独立源码。
- 同步两种模式的教学边界、OpenAI 提示、学习模板、skill README 与仓库索引；明确脚手架、mock、结构检查均不代表真实项目完成。
- 学习校验器支持显式传入经确认的 `--python-version` 与 `--requires-python`，保留 Python 3.12 默认值，并明确结构检查不代替实际运行。

## [0.6.0] - 2026-09-16

### Added

- 新增 `better-decision` skill：从目标、约束、延迟代价、依赖和反馈中确定当前优先事项，输出最小行动、完成标准、暂缓项与复查条件。
- 区分生产性逃避、必要准备、真实阻塞与合理休息；加入高风险决策、信息不足、双硬期限及外部操作授权边界。
- 新增简洁使用说明、三类研究依据及局限说明、11 个可用于人工回归的场景。

### Changed

- 仓库 README 增加 `better-decision` 索引、介绍和手动安装路径。

## [0.5.0] - 2026-09-14

### Added

- 为 `learn-by-running-code` 新增 `AGENTS.md` 导师指南契约与可复用模板，使后续 Agent 能按章节继续教学并记录学习进度。
- 新增基于 Rosenshine 明确教学、worked example、检索练习、自我解释与认知负荷研究的 `teaching-method.md` 教学方法参考。

### Changed

- 将 `learn-by-running-code` 的核心教学顺序从“先运行再解释”调整为“最小知识讲解 → worked example → 代码映射 → 预测与运行 → 引导实践 → 独立实践 → 检索与自我解释”。
- 更新仓库总 README、课程 README、章节代码和 OpenAI 提示模板，使知识讲解自然过渡到代码讲解与实践，并公开列出教学方法依据。
- 扩展仓库校验器：强制生成 `AGENTS.md`、覆盖每章运行命令，并检查知识先行教学顺序及必要教学环节。

## [0.4.0] - 2026-09-08

### Added

- 新增 `better-notes` skill：要求 Agent 在编写技术与知识笔记前先查阅并核对网络资料。
- 新增资料核对规则：优先官方文档、发布说明、迁移指南、原始论文和官方仓库，并区分已证实、推断与未确认内容。
- 新增 API 时效性检查：确认目标版本、弃用或移除状态、推荐替代项与迁移方式。
- 新增简洁笔记风格指南：直接定义概念，明确前置条件、输入、处理、输出、限制和示例验证状态，不使用比喻。

### Changed

- README 增加 `better-notes` 的介绍、安装命令和使用说明。
- README 补充 Claude Code、Codex 与 DSH 的分平台安装命令。
- 首次加入本 Changelog，后续 release 在此持续记录。

## [0.3.0] - 2026-09-01

### Added

- 新增 `video-summary` skill，支持 Bilibili 与 YouTube 字幕抓取和结构化总结。

### Changed

- 简化安装方式，直接使用各 Agent 原生的 skill 目录。

### Removed

- 移除不再需要的 DeepSeek Harness npm 集成包与 npm 发布工作流。

## [0.2.0] - 2026-08-26

### Fixed

- 修复本地 npm tarball 发布流程。

[Unreleased]: https://github.com/HOWILLMAKEIT/skills/compare/v0.10.0...HEAD
[0.10.0]: https://github.com/HOWILLMAKEIT/skills/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/HOWILLMAKEIT/skills/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/HOWILLMAKEIT/skills/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/HOWILLMAKEIT/skills/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/HOWILLMAKEIT/skills/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/HOWILLMAKEIT/skills/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/HOWILLMAKEIT/skills/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/HOWILLMAKEIT/skills/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/HOWILLMAKEIT/skills/releases/tag/v0.2.0
