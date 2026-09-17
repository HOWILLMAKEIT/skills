# learn-by-running-code

从简单到复杂，通过可运行代码**学知识，或完成一个真实项目**。先分清目标，再规划，不直接把所有需求变成课程。

| 模式 | 怎么推进 | 什么算完成 |
| --- | --- | --- |
| 知识学习 `learning` | 最小知识 → 独立章节 → 运行、修改、解释 | 课程可运行；用户理解另行检查 |
| 项目实作 `project` | 多轮澄清 → 检查材料/主动调研 → 确认计划 → 同一代码库累计实现 | 对照用户确认的范围和标准完成真实验收 |

## 使用

```bash
npx -y skills@latest add HOWILLMAKEIT/skills --skill learn-by-running-code -g -a codex -y
```

- 学知识：“我会 Python，想通过可运行章节系统学 asyncio。”
- 做项目：“带我做一个领域 SFT 项目。我有数据和基础代码，先问清楚目标、预算和交付要求。”
- 需求模糊：“我想做一个有实用价值的 Agent 项目，方向没定，请按我的基础和资源调研并推荐。”

已有数据集、代码或本地笔记，直接给路径/链接，注明只读参考或可修改。没有选型也可以，Agent 会调研并比较候选，而不是要求你先想好一切。

项目模式不强制 Python、uv 或章节目录。它保留已有工具链，按约定分工教学与实现，通过 `PROJECT.md`、`AGENTS.md`、`PROGRESS.md` 和 README 支持续作，不把脚手架或假数据 demo 当成完整交付。

## 内容与验证

- [SKILL.md](SKILL.md)：入口与两种模式的流程。
- [项目规划](references/project-planning.md)：多轮澄清、材料检查、方案推荐及 SFT 示例。
- [项目契约](references/project-contract.md) / [学习契约](references/repository-contract.md)：两种模式分别约束。
- [教学依据](references/teaching-method.md)：小步讲解、示例和实践。

结构检查用 Python 3.11+，不改变目标项目技术栈，也不执行项目命令：

```bash
python3 scripts/validate_learning_repo.py <学习仓库>
python3 scripts/validate_project_repo.py <项目仓库>
python3 -B -m unittest discover -s scripts -p 'test_validate_repos.py' -v
```

上述命令在本 skill 目录运行。学习模式默认检查 Python 3.12；已确认其他版本时，可显式传入 `--python-version` 与 `--requires-python`（见学习契约）。结构通过不等于项目功能或模型效果达标；仍须执行确认的测试/评估。版本记录见 [CHANGELOG](../CHANGELOG.md)。
