# skills

个人维护的 Agent Skills 合集,适用于 Claude Code、Codex 等 46+ 编码 agent(遵循 [Agent Skills 规范](https://agentskills.io))。

## Skills

| Skill | 说明 |
| --- | --- |
| [undress](./undress/) | 技术工作去包装:去掉论文、开源项目、简历等材料中的包装性语言,说清作者实际复用了什么、修改了什么、实现了什么、验证了什么 |

## 安装

### 通用(npx skills)

```bash
npx skills add HOWILLMAKEIT/skills -g            # 自动检测已装 agent 并交互勾选
npx skills add HOWILLMAKEIT/skills -s undress -g -a claude-code -y   # 免交互:只装 undress 给 Claude Code
```

纯 git:`git clone --depth 1 https://github.com/HOWILLMAKEIT/skills.git && cp -r skills/undress ~/.claude/skills/`

cc-switch 用户:在 skills 页添加仓库 `HOWILLMAKEIT/skills`。

### DeepSeek Harness(dsh)

独立发布为 [dsh bundle](./integrations/deepseek-harness/):

```bash
dsh plugin --profile web add @howillmakeit/skills-dsh@0.1.0   # 从 npm 安装
dsh plugin --profile web add ./integrations/deepseek-harness # 本地开发(免发布),在仓库根目录执行
```

- 验证:`dsh --profile web --dump-config | grep -A4 howillmakeit`,出现 `howillmakeit-skill-filesystem` 即成功;
- 生效:新增 bundle 后需重启 web 实例(`dsh web`,先关掉占用 3080 端口的旧实例);
- 调用:让 dsh 按名字使用技能,如 "Use the undress skill to strip the packaging from this project";
- 卸载:`dsh plugin --profile web remove @howillmakeit/skills-dsh`。

## 新增 skill

顶层新建同名目录,写入带 `name` + `description` frontmatter 的 `SKILL.md`,并在上方表格加一行。更新已发布 skill 用 `npx skills update <skill> -g`。

## License

[MIT](./LICENSE)
