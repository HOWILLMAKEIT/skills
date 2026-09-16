# Changelog

本文件记录此仓库的重要变更。版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

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

[Unreleased]: https://github.com/HOWILLMAKEIT/skills/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/HOWILLMAKEIT/skills/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/HOWILLMAKEIT/skills/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/HOWILLMAKEIT/skills/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/HOWILLMAKEIT/skills/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/HOWILLMAKEIT/skills/releases/tag/v0.2.0
