# 参考检索与提示词设计

## 查图，而不只是查论文

1. 用领域词、具体问题、图的职能、会议及最近年份组合检索。先看目标领域的主要会议；不能把“顶会”固定等同于某几个机器学习会议。
2. 优先论文正式主页、会议论文集、作者公开 PDF 和 OpenReview；预印本的会议身份需另外核实。记录发表日期与访问日期，不能把上传日期当成会议年份。
3. 通常挑 3–5 个相关例子，至少实际检查其中最有用的图所在页面及图注。不为了凑数量引入不相关图。
4. 将参考拆成可迁移的属性：整体比例、面板职能、读图顺序、形状家族、字体、语义配色、箭头样式和细节密度。布局应服务于本图内容，不机械套用。
5. 比较开源工具时核对仓库身份、许可证、维护时间和实际样例。star 数只作辅助，记录时带日期，不在 skill 中固化“最新”或长期有效的排名。
6. 将选用图保存到 `references/images/ref-01.png` 等路径。公开原图可直接保存；从 PDF 提取时检查裁剪是否包含完整图元、文字和必要图注，分辨率是否足够让网页端读取。可另存原 PDF 或整页截图用于核查，但上传清单应指向具体图文件。不要下载媒体绕过平台访问限制；保存受限则记录来源与缺口。

`references/style-references.json` 每条记录建议包含：`id`、`title`、`url`、`venue`、`year`、`venue_evidence_url`、`figure`、`pdf_page`、`accessed_at`、`local_image`、`source_pdf`（如已保存）、`observed`、`adopt`、`avoid`。`pdf_page` 使用从 1 开始的 PDF 页序号，路径相对任务目录。所有事实字段来自已核实的信息；明确区分观察到的样式和本图决定采用的样式。

## 公开方法来源

以下是工作流来源，不是固定模型、安装命令或效果保证。实际使用时重新读取当前文件；代码复用另行核对许可证与署名要求。

- [nature-figure](https://github.com/Yuan1z0825/nature-skills/tree/main/skills/nature-figure)：参考其 figure contract、主视觉、AI schematic 路线与 rendered QA，提炼为用户可在网页端使用的提示词。
- [PaperBanana 作者维护仓库](https://github.com/dwzhu-pku/PaperBanana)及 [skill 入口](https://github.com/dwzhu-pku/PaperBanana/blob/main/skill/SKILL.md)：借用检索、规划、风格、生成、批评的阶段分工；本流程将生成阶段交给用户，其模型默认值和自动执行方式不改变人机分工。
- [PaperVizAgent](https://github.com/google-research/papervizagent)：PaperBanana 仓库标示的原始公开实现来源。区分作者来源与社区重实现，避免把同名项目当成同一工具。

没有安装这些工具时，可以阅读公开说明并按本 skill 执行对应的推理步骤，不假称已经运行其框架。调用其代码不是完成本流程的前提。

## 提示词模板

先从论文和相关代码中提取实体、输入输出、阶段、条件与反馈关系，并与 `figure-plan.md` 核对。代码中的实现细节不自动等于论文贡献；参考论文的标签或机制不混入本图。把下面字段展开成完整提示词，保留论文需要的语言。不要将模板字段名直接画进图中，也不要写“如上文所述”等依赖聊天上下文的指代。

```text
Create a scientific [figure type] for [audience / target venue].

Attached references (in upload order):
[Image 1 = ref-01.png: use its panel layout and reading order only.]
[Image 2 = ref-02.png: use its palette and connector styling only.]
[Reference-paper labels and mechanisms are not the scientific content below.]

Core message:
[One sentence describing what readers should understand.]

Scientific content:
[Verified objects, stages, inputs, outputs, and definitions.]
[Exact labels and mathematical notation.]
[Directed relations: source -> destination, what each arrow means.]
[Separate conceptual illustrations from measured results.]

Composition:
[Canvas ratio and intended print width.]
[Panel roles, dominant region, hierarchy, reading order, alignment.]
[Comparison warranted by the supplied evidence.]

Reference-informed styling:
[Which references inform which visual attributes.]
[Semantic palette: role -> fill/outline/accent.]
[Font hierarchy, line weights, connector styles, whitespace.]
[Native-reconstructible gradients and curved shapes, if appropriate.]

Visual details:
[Concrete diagrams and motifs justified by the method.]
[Simplify clutter while preserving distinct components and hierarchy.]

Constraints:
Do not add unsupported measurements, claims, mechanisms, affiliations or logos.
Do not copy reference-paper artwork or labels.
Keep labels readable and scientific relations unambiguous.
Use shapes that can be faithfully reconstructed as editable slide objects.
```

不得为了生成模型更容易画而随意删掉关键对照、条件或反馈关系。涉及真实数据的曲线、误差条或数值必须从真实数据绘制，生成模型只能辅助非定量示意部分。

## 网页生图交接与回收

将主提示词保存为 `prompts/figure-01_v001.txt`，将以下内容写入 `handoff/web-generation.md`：

- 任务目录、参考图上传顺序与相对路径、每张图借鉴用途，以及主提示词路径。
- 用户操作：上传清单中的参考图，粘贴完整提示词，在网页端生成，检查标签、连线与主旨，下载原始图片。提示词中的 Image 1、Image 2 必须对应实际上传顺序。
- 返回材料：选定图片附件或本地路径；如方便，附实际使用的提示词改动、网页显示的工具/模型及候选选择。只有图片是 PPT 重建的必要输入，其他未知信息可留空。
- 当前状态：`awaiting-user-image`；参考图和提示词已完成，尚未生图或重建 PPT。修订已注册交接文件时另存新版本。

交接时给出可点击参考图目录/文件与提示词链接，必要时展示可直接复制的全文。默认结束当前轮，等待用户手动生图，不调用 API、不代操作网页、不以空 PPT 填充后续产物。

用户提供结果后，查看选定图并无覆盖地保存到 `generated/`，将可确认来源信息写入 `generation/`。区分 GPT 准备的提示词和用户实际提交的提示词：用户未确认是否修改时写明 `prompt_usage: unknown`，不能将准备稿标成已使用。截图只能证明可见信息；未获得原始下载文件时记录实际收到的是截图，不假称无损原图。

网页显示的模型名可按用户说明记录，来源注明 `user-reported` 或 `visible-ui`；它不自动证明后台版本。未知信息用 `null` 或 `unknown`，不能编造模型、时间、request ID 或工具返回。保留导入时间，实际生成时间未知时留空。网页端手动生成的记录示例：

```json
{
  "generation_mode": "manual-web",
  "tool": null,
  "displayed_model": null,
  "returned_model": null,
  "model_version_verified": false,
  "metadata_source": "unknown",
  "prepared_prompt_file": "prompts/figure-01_v001.txt",
  "actual_prompt_file": null,
  "prompt_usage": "unknown",
  "prepared_reference_images": ["references/images/ref-01.png"],
  "actual_reference_images": null,
  "output_file": "generated/figure-01_v001.png",
  "received_artifact_kind": "downloaded-original",
  "created_at": null,
  "imported_at": "actual import timestamp",
  "parent_image": null,
  "selected": true
}
```

记录图片实际尺寸，保留用户提供的候选及选中理由。再次生成时按内容错误、构图、样式分别说明具体缺陷，输出修订提示词并交回用户；不要自动增加生成调用或替用户更换已选原图。记录中排除认证信息和带凭据的 URL。

已有原图直接转 PPT 时，记录 `generation_mode: user-provided` 及已知来源，不强迫补做检索/网页生图，也不补造不存在的提示词或生成记录。用户后来明确要求自动生图时，使用当前实际可用且已授权的工具，并按真实调用记录模型/输入输出；不能将手动网页记录伪装成 API 记录。
