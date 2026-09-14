# {{COURSE_TITLE}}

{{ONE_SENTENCE_GOAL}}

这个仓库按章节逐步增加能力。每章都能独立运行，每一步只引入一个主要概念。

## 30 秒跑起来

```bash
uv sync
uv run python 01_{{FIRST_CHAPTER_SLUG}}/main.py
```

运行后你会看到：{{FIRST_EXPECTED_OBSERVATION}}

## 让 agent 教你

本仓库包含根目录 `AGENTS.md`。让支持该约定的 agent 进入仓库并说“从第 01 章开始教我”，它会先讲清本章最小知识，再通过 worked example 映射到代码，随后引导你预测、运行、修改和独立实践，并把理解检查与进度记录到 `PROGRESS.md`。

## 教学方法依据

本课程采用“最小知识讲解 → worked example → 代码映射 → 预测与运行 → 引导实践 → 独立实践 → 检索与自我解释”的顺序：

- [Rosenshine 的教学原则](https://www.aft.org/sites/default/files/Rosenshine.pdf)：小步呈现新知识，先提供模型与引导练习，检查理解后再独立实践；
- [Roediger 与 Karpicke（2006）](https://pubmed.ncbi.nlm.nih.gov/16507066/)：主动检索不仅测量学习，还能提高延迟保持；
- [Chi 等（1989）](https://asu.elsevierpure.com/en/publications/self-explanations-how-students-study-and-use-examples-in-learning/)：自我解释帮助学习者把示例步骤与原理连接起来并发现理解缺口；
- [Sweller 的认知负荷与 worked-example 研究回顾](https://link.springer.com/article/10.1007/s10648-023-09817-2)：新手先看有解释的完整示例，可以减少无效搜索占用的工作记忆。

这些原则用于约束 agent 的教学方式，不会被扩写成脱离代码的长篇理论课。

## 学习路线

| 章节 | 唯一新增概念 | 运行命令 | 预期现象 | 外部要求 |
| --- | --- | --- | --- | --- |
| 01 | {{CHAPTER_01_CONCEPT}} | `uv run python 01_{{FIRST_CHAPTER_SLUG}}/main.py` | {{CHAPTER_01_OUTPUT}} | 无 |
| 02 | {{CHAPTER_02_CONCEPT}} | `uv run python 02_{{SECOND_CHAPTER_SLUG}}/main.py` | {{CHAPTER_02_OUTPUT}} | {{CHAPTER_02_REQUIREMENTS}} |

{{ADD_ALL_CONFIRMED_CHAPTERS}}

## 贯穿案例

{{COHERENT_EXAMPLE}}

## 配置

{{CONFIGURATION_OR_NO_CONFIGURATION_REQUIRED}}

不要把真实密钥提交到 Git。需要环境变量时，从 `.env.example` 复制变量名并在本地 `.env` 中填写。

## 常见问题

### 找不到 `uv`

根据 [uv 官方安装文档](https://docs.astral.sh/uv/getting-started/installation/) 安装后重新执行 `uv sync`。

### Python 或包无法导入

确认当前目录是仓库根目录，并使用 README 中的 `uv run python ...` 命令，不要直接调用系统 Python。

{{TOPIC_SPECIFIC_TROUBLESHOOTING}}

## 资料与版本

- Python：3.12
- {{DEPENDENCY_AND_VERSION}}
- 资料核对日期：{{VERIFIED_DATE}}
- 官方资料：{{PRIMARY_SOURCE_LINKS}}

## 验证状态

- 已实际运行：{{RUNTIME_VERIFIED_CHAPTERS}}
- 仅完成静态检查：{{STATIC_ONLY_CHAPTERS_OR_NONE}}
- 未验证原因：{{UNVERIFIED_REASON_OR_NONE}}
