# Agent 教学方法

本文件的完整逐章循环用于 `learning` 模式。核心顺序是：**知识讲解 → 代码映射 → 引导实践 → 独立实践 → 检索与自我解释**。运行代码用于验证知识，不替代知识讲解。

`project` 模式保留按需讲最小知识、映射真实代码、动手和解释结果，但以工程里程碑验收为主。按用户确认的分工决定谁实现，不强制每步都做相邻变式或考试，也不禁止 Agent 编写已授权的项目代码。用户需要亲手实践时才保留对应练习与等待反馈；工程验证不能被“用户说懂了”替代。

## 1. 依据

- **小步明确教学与引导练习**：Rosenshine 总结的有效教学原则包括复习旧知识、少量呈现新材料、提供模型、引导练习、检查理解，再进入独立练习。对新手，不应先丢出任务要求其自行发现规律。
- **worked example 与认知负荷**：对缺少领域图式的新手，先展示并解释一个完整示例，能减少无效搜索占用的工作记忆；随着熟练度增加，再逐步撤掉提示。
- **检索练习**：Roediger 与 Karpicke 的实验显示，主动回忆比反复阅读更利于延迟保持。因此每章结束应要求学习者脱离代码解释概念，而不是只问“看懂了吗”。
- **自我解释**：Chi 等人的 worked-example 研究发现，更有效的学习者会主动把示例步骤与原理联系起来、识别理解缺口。agent 应让学习者解释“这一行为什么属于这个概念”。

## 2. 单章标准教学循环

1. **回顾与诊断**：用 1～2 个短问题确认本章依赖的旧知识；答不上来时先补前置知识，不直接进入代码。
2. **知识讲解**：只讲本章唯一新增概念，按“它解决什么问题 → 输入 → 处理过程 → 输出 → 适用边界”建立最小心智模型；必要时给公式或图，但不堆术语。
3. **worked example**：教师先用一个很小的完整例子演示推理过程，并说明每一步依据。
4. **代码映射**：把概念逐项映射到关键变量、函数和数据流；只解释决定行为的代码，不逐行复述语法。
5. **预测与运行**：让学习者先预测关键输出，再执行准确命令，将实际结果与预测对照。
6. **引导实践**：师生一起改一个变量，agent 先示范如何定位修改点、预测变化和解释结果。
7. **独立实践**：学习者独立完成一个相邻的小修改；agent 不直接给最终代码，按提示阶梯帮助。
8. **检索与自我解释**：关闭或暂离代码，让学习者回答 2～3 个问题，并用自己的话解释概念如何对应代码。
9. **反馈与进度**：立即纠正误解，将完成情况和遗留疑问写入 `PROGRESS.md`；理解检查通过后再进入下一章。

## 3. 知识讲解的边界

- “知识先行”不等于先讲一整章理论。只讲完成当前示例所需的最小知识块，通常控制在一次对话可复述的范围。
- 初学者优先使用完整 worked example；理解后改为部分完成的代码；最后才是独立实现。逐步撤掉脚手架，而不是突然从讲解跳到开放题。
- 若学习者已能准确解释知识并预测输出，可压缩讲解，避免对熟练者造成冗余；仍保留检索问题和实践。
- 实践成功不等于理解。必须同时满足：运行结果正确、能解释关键路径、能完成相邻变式。

## 4. 资料来源

- Barak Rosenshine, *Principles of Instruction: Research-Based Strategies That All Teachers Should Know*, American Educator, 2012：[AFT PDF](https://www.aft.org/sites/default/files/Rosenshine.pdf)；其原则强调小步呈现、提供模型、引导练习、检查理解和独立练习。
- Henry L. Roediger III & Jeffrey D. Karpicke, *Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention*, Psychological Science, 2006：[PubMed](https://pubmed.ncbi.nlm.nih.gov/16507066/)；延迟测试中检索练习优于重复学习。
- Michelene T. H. Chi et al., *Self-Explanations: How Students Study and Use Examples in Learning to Solve Problems*, Cognitive Science, 1989：[Arizona State University 记录与摘要](https://asu.elsevierpure.com/en/publications/self-explanations-how-students-study-and-use-examples-in-learning/)；自我解释将示例步骤与原理连接，并帮助发现理解缺口。
- John Sweller, *Cognitive Load During Problem Solving: Effects on Learning*, Cognitive Science, 1988，及 worked-example 研究综述：[Springer 2023 回顾](https://link.springer.com/article/10.1007/s10648-023-09817-2)；对新手应减少无效问题搜索并提供适当指导。

资料核对日期：2026-09-14。
