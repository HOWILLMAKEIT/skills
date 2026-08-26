# skills

个人维护的 Agent Skills 合集,适用于 Claude Code、Codex 等 46+ 编码 agent(遵循 [Agent Skills 规范](https://agentskills.io))。

## Skills

| Skill | 说明 |
| --- | --- |
| [undress](./undress/) | 技术工作去包装:去掉论文、开源项目、简历等材料中的包装性语言,说清作者实际复用了什么、修改了什么、实现了什么、验证了什么 |
| [learn-by-running-code](./learn-by-running-code/) | 代码优先学习:把 Python 主题拆成逐章增加一个概念、可独立运行的 uv 学习仓库,先确认大纲再创建文件 |

## 安装

本仓库采用主流 Skills 合集的 Git-first 方案：`npx` 从 npm 临时运行标准 [`skills`](https://www.npmjs.com/package/skills) 安装器，Skill 内容从 GitHub 仓库读取。每个 Skill 不需要重复发布成单独的 npm 包。

### 查看并交互选择

```bash
# 只查看合集里有哪些 Skill
npx -y skills@latest add HOWILLMAKEIT/skills --list

# 交互选择 Skill、Agent 和安装范围
npx -y skills@latest add HOWILLMAKEIT/skills -g
```

### 安装一个 Skill

```bash
# 给 Codex 全局安装 undress
npx -y skills@latest add HOWILLMAKEIT/skills --skill undress -g -a codex -y

# 给 Codex 全局安装 learn-by-running-code
npx -y skills@latest add HOWILLMAKEIT/skills --skill learn-by-running-code -g -a codex -y
```

把 `codex` 换成 `claude-code`、`cursor` 等即可安装到其他 Agent。省略 `-g` 时安装到当前项目。

### 安装多个或整个合集

```bash
# 一次选择多个 Skill
npx -y skills@latest add HOWILLMAKEIT/skills \
  --skill undress \
  --skill learn-by-running-code \
  -g -a codex -y

# 把合集里的全部 Skill 安装给 Codex
npx -y skills@latest add HOWILLMAKEIT/skills --skill '*' -g -a codex -y

# 把全部 Skill 安装给本机检测到的全部 Agent
npx -y skills@latest add HOWILLMAKEIT/skills --all -g
```

`v0.2.0` 发布后，安装固定版本时可以把 Git tag 写进来源 URL：

```bash
npx -y skills@latest add \
  'https://github.com/HOWILLMAKEIT/skills.git#v0.2.0' \
  --skill undress -g -a codex -y
```

cc-switch 用户可以在 Skills 页面添加仓库 `HOWILLMAKEIT/skills`。

### DeepSeek Harness(dsh)

独立发布为 [dsh bundle](./integrations/deepseek-harness/):

```bash
dsh plugin --profile web add @howillmakeit/skills-dsh@latest # 从 npm 安装整个合集
dsh plugin --profile web add ./integrations/deepseek-harness # 本地开发(免发布),在仓库根目录执行
```

- 验证:`dsh --profile web --dump-config | grep -A4 howillmakeit`,出现 `howillmakeit-skill-filesystem` 即成功;
- 生效:新增 bundle 后需重启 web 实例(`dsh web`,先关掉占用 3080 端口的旧实例);
- 调用:让 dsh 按名字使用技能,如 "Use learn-by-running-code to turn MCP into a runnable Python learning repository";
- 卸载:`dsh plugin --profile web remove @howillmakeit/skills-dsh`。

## 新增 skill

顶层新建同名目录,写入带 `name` + `description` frontmatter 的 `SKILL.md`,并在上方表格加一行。更新已发布 skill 用 `npx skills update <skill> -g`。

## 发布

`vX.Y.Z` tag 会触发 GitHub Actions：验证合集、发布 `@howillmakeit/skills-dsh`，再创建带 npm tarball 的 GitHub Release。版本修改、npm Trusted Publisher 和 tag 命令见 [发布说明](./docs/releasing.md)。

## License

[MIT](./LICENSE)
