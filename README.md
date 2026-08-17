# skills

个人维护的 Agent Skills 合集,适用于 Claude Code、Codex 等 46+ 编码 agent(遵循 [Agent Skills 规范](https://agentskills.io))。

## Skills

| Skill | 说明 |
| --- | --- |
| [undress](./undress/) | 技术工作去包装:去掉论文、开源项目、简历等材料中的包装性语言,说清作者实际复用了什么、修改了什么、实现了什么、验证了什么 |

## 安装

```bash
# 安装合集内全部 skills(全局,装到 ~/.claude/skills/ 等目录)
npx skills add HOWILLMAKEIT/skills -g

# 只安装某一个,指定 Claude Code,免交互
npx skills add HOWILLMAKEIT/skills -s undress -g -a claude-code -y

# 纯 git 方式
git clone --depth 1 https://github.com/HOWILLMAKEIT/skills.git
cp -r skills/undress ~/.claude/skills/
```

cc-switch 用户:在 skills 页添加仓库 `HOWILLMAKEIT/skills`,按需安装启用。

## 新增 skill

顶层新建同名目录,写入带 `name` + `description` frontmatter 的 `SKILL.md`,并在上方表格加一行即可。更新已发布的 skill 用 `npx skills update <skill> -g`。

## License

[MIT](./LICENSE)
