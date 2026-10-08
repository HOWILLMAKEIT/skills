# 参考检索与提示词设计

## 查图，而不只是查论文

1. 用领域词、具体问题、图的职能、会议及最近年份组合检索。先看目标领域的主要会议；不能把“顶会”固定等同于某几个机器学习会议。
2. 优先论文正式主页、会议论文集、作者公开 PDF 和 OpenReview；预印本的会议身份需另外核实。记录发表日期与访问日期，不能把上传日期当成会议年份。
3. 通常挑 3–5 个相关例子，至少实际检查其中最有用的图所在页面及图注。不为了凑数量引入不相关图。
4. 将参考拆成可迁移的属性：整体比例、面板职能、读图顺序、形状家族、字体、语义配色、箭头样式和细节密度。布局应服务于本图内容，不机械套用。
5. 比较开源工具时核对仓库身份、许可证、维护时间和实际样例。star 数只作辅助，记录时带日期，不在 skill 中固化“最新”或长期有效的排名。

`references/style-references.json` 每条记录建议包含：`title`、`url`、`venue`、`year`、`venue_evidence_url`、`figure`、`pdf_page`、`accessed_at`、`observed`、`adopt`、`avoid`。所有事实字段来自已核实的信息；明确区分观察到的样式和本图决定采用的样式。

## 公开方法来源

以下是工作流来源，不是固定模型、安装命令或效果保证。实际使用时重新读取当前文件；代码复用另行核对许可证与署名要求。

- [nature-figure](https://github.com/Yuan1z0825/nature-skills/tree/main/skills/nature-figure)：参考其 figure contract、主视觉、AI schematic 路线与 rendered QA。显式 Image 2 示意图不应被普通数据绘图的 Python/R 选择问题阻断。
- [PaperBanana 作者维护仓库](https://github.com/dwzhu-pku/PaperBanana)及 [skill 入口](https://github.com/dwzhu-pku/PaperBanana/blob/main/skill/SKILL.md)：借用检索、规划、风格、生成、批评的阶段分工。其自身模型默认值不替代本任务指定的 Image 2。
- [PaperVizAgent](https://github.com/google-research/papervizagent)：PaperBanana 仓库标示的原始公开实现来源。区分作者来源与社区重实现，避免把同名项目当成同一工具。

没有安装这些工具时，可以阅读公开说明并按本 skill 执行对应的推理步骤，不假称已经运行其框架。调用其代码不是完成本流程的前提。

## 提示词模板

把下面字段展开成连贯提示词，保留论文需要的语言。不要将模板字段名直接画进图中。

```text
Create a scientific [figure type] for [audience / target venue].

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

## 生成与选择

使用可用的 Image 2 工具和当前已核实的参数，不把服务商路由标识与实际后端版本混为一谈。原生工具没有模型参数时不要编造参数；返回值没有版本时写 `returned_model: null`、`model_version_verified: false`。

每个候选保存提示词、时间、工具/provider、请求模型、返回模型或未知值、尺寸、父图/输入参考、输出相对路径及工具暴露的 request ID。记录设置时排除 API key、认证 header 或带凭据的 URL。元数据示例：

```json
{
  "requested_model": "GPT Image 2",
  "returned_model": null,
  "model_version_verified": false,
  "tool": "actual tool name",
  "prompt_file": "prompts/figure-01_v001.txt",
  "output_file": "generated/figure-01_v001.png",
  "created_at": "actual timestamp",
  "parent_image": null
}
```

选择理由分别评价科学正确性、信息主次、视觉质量和可重建性。再次生成时说明具体缺陷，保留全部实际产出的候选及选中记录，不盲目增加候选数。用户要求精确模型版本但环境无法验证时，明确这一能力缺口。
