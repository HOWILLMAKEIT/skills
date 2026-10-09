# 留档、交付与隐私

## 项目产物结构

每个绘图任务在当前项目创建独立输出目录。名称可按惯例调整，角色必须保留。

| 路径 | 保存内容 |
| --- | --- |
| `figure-plan.md` | 主旨、事实、面板与语义连线 |
| `references/style-references.json` | 已查看论文的链接、会议、日期、图号/页码及借鉴属性 |
| `references/images/` | 实际搜集的参考图，可直接上传网页，编号与记录对应 |
| `references/papers/` | 可选的公开论文 PDF 或来源页 |
| `prompts/` | 各版准备稿与已知的实际使用稿，明确区分 |
| `handoff/` | 网页上传清单、提示词路径、操作与返回说明、交接状态 |
| `generated/` | 用户提供的网页生图原始文件和候选，不覆盖 |
| `generation/` | 手动网页/用户提供等来源、已知工具与模型、时间、输入输出对应关系、选中理由；未知信息留空 |
| `editable/` | 各版原生可编辑 PPTX |
| `source/` | 重建代码与必要场景数据 |
| `exports/` | 从最终 PPT 导出的论文用 PDF / 高分辨率图 |
| `previews/` | 实际 PPT 渲染及必要对照预览 |
| `qa/` | 可编辑性、视觉复核及其他实际执行的检查 |
| `manifest.json` | 文件角色、相对路径和 SHA256 |

收到用户提供的图片后立即将原始文件保存到 `generated/`。临时 URL、聊天图片、全局缓存仅是来源；如果环境无法保存原图，报告留档未完成。不要下载远程媒体绕过平台访问限制。只有截图时如实标明截图来源和还原限制。

建议 `figure-01_v001`、`figure-01_v002` 等版本名。已注册文件按版本保持不变，修改后注册新文件。生成原图、PPT 和导出通过生成/选中记录对应，不混淆“最近生成”与“最终选用”。

## 留档辅助脚本

`scripts/bundle.py` 只处理留档，不调用网络、生图或读取凭据。

```bash
python scripts/bundle.py init /project/figures/figure-01/r001
python scripts/bundle.py add /project/figures/figure-01/r001 /work/ref-01.png \
  --role reference --to references/images/ref-01.png
python scripts/bundle.py add /project/figures/figure-01/r001 /work/style-references.json \
  --role reference-notes --to references/style-references.json
python scripts/bundle.py add /project/figures/figure-01/r001 /work/prompt.txt \
  --role prompt --to prompts/figure-01_v001.txt
python scripts/bundle.py add /project/figures/figure-01/r001 /work/web-generation.md \
  --role handoff --to handoff/web-generation.md
python scripts/bundle.py verify /project/figures/figure-01/r001 --stage handoff

# 用户在网页端生图并提供原图后，继续注册重建阶段的产物。
python scripts/bundle.py add /project/figures/figure-01/r001 /tool/output.png \
  --role generated-original --to generated/figure-01_v001.png
python scripts/bundle.py add /project/figures/figure-01/r001 /project/work/figure.pptx \
  --role editable-pptx --to editable/figure-01_v001.pptx
python scripts/bundle.py verify /project/figures/figure-01/r001 --complete
```

输出目录内的现有文件也用 `add` 注册，`--to` 指向其当前相对路径。脚本拒绝覆盖不同内容、修改已注册文件、路径穿越以及在本 skill 内保存任务。`--stage handoff` 只检查参考图、来源记录、提示词及交接清单的角色和哈希，不要求尚未生成的原图/PPT。`--complete` 检查最终交付角色齐全和哈希一致；这些检查不代表科学/视觉质量通过，也不能判断图像是否真由指定模型生成。

交接阶段角色：`reference`、`reference-notes`、`prompt`、`handoff`。最终交付沿用角色：`generated-original`、`editable-pptx`、`prompt`、`reference-notes`、`generation-record`、`source`、`export`、`preview`、`qa`，并保留前期交接材料。其他素材可用 `reference` 或 `metadata` 注册。仅转已有原图或审计旧产物时，按实际范围注册和 `verify`，不为通过 `--complete` 伪造缺失的历史材料。

## 隐私与可公开复用

- Skill 只保存通用方法、公开链接与无业务含义代码。真实研究名称、机制、图像、提示词、论文、数据、作者及路径都留在项目。
- 当前研究图的裁剪、模糊或重绘版本也不能作为 skill 示例；仅匿名化标题不足以避免结构泄漏。测试使用独立创建的矩形、圆和通用标签。
- 生成调用只提交当前任务必要且已授权的内容；公开检索用领域和图类型，避免将未公开论文整段放入查询。
- 不记录 API key、认证信息、完整工具返回对象或秘密 URL；只保留必要的非秘密元数据。
- 同步/公开 skill 前检查新增文件、二进制素材、路径、压缩包、测试和元数据，不直接打包工作目录或会话。复制公开代码须遵循许可证；链接和独立编写的说明通常已足够。
- 只有用户明确要求时才更新全局记忆、发布远程仓库或共享任务素材。安装 skill 不等于授权发布。

## 完成标准

网页交接：参考图文件、来源记录、完整提示词及上传清单均已保存且可访问，借鉴用途与上传顺序对应，明确等待用户提供原图。此时只声明准备阶段完成，不声明生图或 PPT 完成。

重建交付：用户提供的原图与可编辑 PPT 均落盘、版本对应明确；已知来源及实际提示词可追溯，未知项如实记录；源代码和实际导出可用；编辑复读及视觉复核完成，遗留问题如实记录。用户要求同步论文时另查编译和图注。最终提供可点击文件链接及实际 PPT 预览，不仅列完成步骤。
