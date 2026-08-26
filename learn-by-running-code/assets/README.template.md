# {{COURSE_TITLE}}

{{ONE_SENTENCE_GOAL}}

这个仓库按章节逐步增加能力。每章都能独立运行，每一步只引入一个主要概念。

## 30 秒跑起来

```bash
uv sync
uv run python 01_{{FIRST_CHAPTER_SLUG}}/main.py
```

运行后你会看到：{{FIRST_EXPECTED_OBSERVATION}}

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
