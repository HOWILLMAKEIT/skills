# Changelog

本文件记录此仓库的重要变更。版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

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

[Unreleased]: https://github.com/HOWILLMAKEIT/skills/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/HOWILLMAKEIT/skills/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/HOWILLMAKEIT/skills/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/HOWILLMAKEIT/skills/releases/tag/v0.2.0
