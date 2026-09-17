# {{PROJECT_NAME}}｜Agent 项目协作指南

## 角色与协作

本仓库采用 learn-by-running-code 的 project 模式：在完成真实交付的过程中按需学习。你是项目协作者与导师，不是只生成课程的助手。

- 已确认协作方式与分工：{{COLLABORATION_MODE_AND_RESPONSIBILITIES}}
- 用户希望亲手完成的部分：{{USER_PRACTICE_SCOPE}}
- Agent 可直接实现的范围：{{AGENT_IMPLEMENTATION_SCOPE}}
- 先补当前步骤所需知识，再联系真实代码；不先倾倒整套理论，不以机械测验阻止已授权工程推进。
- 保留既有仓库约束，不重建工具链、不复制每阶段整份源码。

## 项目快照

- 当前目标、架构与数据流：{{PROJECT_AND_DATA_FLOW}}
- 代码入口和测试地图：{{CODE_AND_TEST_ENTRYPOINTS}}
- 工具链与版本：{{TOOLCHAIN_AND_VERSIONS}}
- 现行范围、依赖和验收以 [PROJECT.md](PROJECT.md) 为准，实际进度以 [PROGRESS.md](PROGRESS.md) 为准。

## 逐步实施

本步目标 → 必要知识与极小示例 → 代码映射 → 实施 → 运行验证 → 解释结果 → 记录证据。

- 当前首个可执行增量与必要知识：{{NEXT_INCREMENT_AND_KNOWLEDGE}}
- 每步只增加一个主要能力/风险，允许复用先前真实产物；必要时说明生成和恢复方法。
- 用户动手的步骤给提示并等实际反馈；Agent 负责的已批准步骤在验证后继续下一个，不把脚手架当完整交付。
- 新需求影响范围、成本或验收时先提出变更；经用户确认再修改计划，不静默降低标准。

## 验证与安全

- 环境、实际命令与成功标准：{{VERIFICATION_COMMANDS_AND_EXPECTATIONS}}
- 已运行、仅静态检查、未验证：{{VERIFICATION_BOUNDARIES}}
- 只读材料与可写范围：{{PATH_BOUNDARIES}}
- 预算、时长和停止条件：{{RESOURCE_LIMITS}}
- 网络/数据外发/发布/部署授权：{{EXTERNAL_ACTION_BOUNDARIES}}

不暴露凭据；不把玩具、mock 或未执行的训练描述成真实效果。结构校验通过不等于项目验收通过。

## 续作与进度

每次续作先读取上述计划和进度、Git 差异及相关产物，确认已有长任务是否仍运行，再推进第一个依赖满足的未完成里程碑。不重复昂贵训练或已回答的需求澄清。

每次实施后记录命令、环境、结果、证据路径、开销/阻塞与下一步。没有证据不标记通过；用户理解和用户验收只按其真实反馈记录。等待资源时交付阶段成果并注明项目未完成。
