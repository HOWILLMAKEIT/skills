# better-decision

**值得做，不等于现在最该做。** 帮你从多个合理任务中确定当前优先事项，把“想清楚”变成可验证的下一步。

## 使用

```bash
npx -y skills@latest add HOWILLMAKEIT/skills --skill better-decision -g -a codex -y
```

Claude Code 将 `codex` 换为 `claude-code`；其他方式见[仓库安装说明](../README.md#安装)。

对 Agent 说：

> 用 better-decision 帮我取舍：我一直在研究求职方法，但还没投简历。今天有 90 分钟，有两个明天截止的合适岗位，也想整理论文笔记。

输入：目标、候选任务、期限、可用时间与阻塞。

输出：**当前先做什么 → 为什么 → 最小行动与完成标准 → 暂缓什么 → 何时复查。**

它会区分生产性逃避、必要准备、真实阻塞和合理休息，不会简单地催你“做最难的事”。任务已经明确时直接执行，不额外制造规划工作。

## 方法与依据

[SKILL.md](SKILL.md) 是 Agent 入口；[研究依据](references/evidence.md) 对照情绪调节、if–then 行动计划、进度监测的研究，并说明局限；[场景检查](references/scenarios.md) 用于人工验收。

这是研究启发的实践流程，不是心理诊断、专业决策替代品或最优决策保证。不替用户做价值判断，不自动发送、投递或发布。

版本及发布记录统一维护在仓库 [CHANGELOG](../CHANGELOG.md)。
