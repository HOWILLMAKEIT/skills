# `@howillmakeit/skills-dsh`

[Howskills 合集](https://github.com/HOWILLMAKEIT/skills)的社区 DeepSeek Harness(dsh)集成包
实验性兼容开发者预览版 **`@deepseek-ai/dsh@0.1.0-rc.6`**，要求 Node.js **`^22.19.0 || >=24.0.0`**。不承诺跨版本稳定。

## 这是什么

一个纯 Skill bundle：向 dsh 的 web profile 插入一个**隔离的文件系统 Skill provider**（`providerName: howillmakeit-plugin`，`includeDefaultRoots: false`），把本仓库维护的 skills 暴露给 dsh。目前包含：

- `undress`：技术工作去包装；
- `learn-by-running-code`：把 Python 学习主题变成逐章可独立运行的 uv 仓库。

约束与边界：

- 不注册原生工具；
- 不含 Web 客户端、遥测、网络访问、凭据处理；
- 没有 `prepare`/`install`/`postinstall` 脚本。

## 工作原理

dsh 的插件树不是写死在一个配置文件里，而是由**多层 patch 叠加**组合出来的（profile bundle 机制）：内置 bundle 层（`dsh-base`、`dsh-web-app`…）→ 用户安装的第三方 bundle 层 → 用户 profile 自己的 `cordis.patch.yml` → 命令行 `--patch` overlay。本包就是其中一层 patch，完整链路如下。

### 第 1 步：安装，把包登记为 bundle 层

```bash
dsh plugin --profile web add @howillmakeit/skills-dsh@latest
```

`dsh plugin` 把参数转发给 web profile 目录内的 pnpm 安装本包，然后读取包的 `package.json`。由于包声明了 `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`，dsh 识别出它是 profile bundle，自动把它追加进 profile manifest 的 `dsh.profile.bundles` 列表——下次启动时按 patch 层加载。

### 第 2 步：启动，patch 层组合

dsh 按 `dsh.profile.bundles` 顺序解析每个 bundle 声明的 patch 文件，与用户层、overlay 一起作用到空根上，得到最终插件树。本包的 patch（`cordis.patch.yml`）内容是一条 `insert` 指令，向插件树插入一个官方技能提供者插件行：

```yaml
- insert:
    - id: howillmakeit-skill-filesystem
      name: '@deepseek-ai/dsh-skill-filesystem'
      config:
        providerName: howillmakeit-plugin
        includeDefaultRoots: false
        bundledSkillDir: <!!js 表达式，加载时求值，见下>
```

### 第 3 步：加载，注册一个只看自己目录的 Skill 提供者

`@deepseek-ai/dsh-skill-filesystem` 是 dsh 官方包，职责是扫描本地目录里的 `SKILL.md` 并注册进 `ctx.skills` 注册表。base bundle 里已经有一个默认实例（providerName `filesystem`，负责 dsh 的项目/用户技能）；本包再注册一个**唯一命名**的实例 `howillmakeit-plugin`，并用 `includeDefaultRoots: false` 让它**只扫描自己的根**——不掺和 dsh 的项目/用户技能扫描，两个提供者互不干扰（官方 README 称此为"隔离提供方"模式）。

`bundledSkillDir` 的值是一个 `!!js` 表达式，插件行加载时在 dsh loader 上下文里求值（实际配置为单行，下面为便于阅读做了折行）：

```yaml
bundledSkillDir: !!js process.getBuiltinModule('node:path').join(
  process.getBuiltinModule('node:path').dirname(
    process.getBuiltinModule('node:module').createRequire(baseUrl)
      .resolve('@howillmakeit/skills-dsh/package.json')),
  'skills')
```

- `baseUrl` 是 dsh loader 上下文的属性，指向 profile 目录（pnpm 安装时本包就装在这里）；
- `createRequire(baseUrl).resolve('@howillmakeit/skills-dsh/package.json')` 从 profile 目录解析出本包的真实安装位置；
- `dirname(...)` 取包根目录，`join(..., 'skills')` 指向包内的技能目录——即打进 npm tarball 的 `skills/`。

这样技能根路径**不写死**，包装在哪都能正确解析。

### 第 4 步：技能被发现，进入模型的 tool catalog

- `skills/<name>/SKILL.md` 符合 dsh 技能发现规范：一层深的 `<root>/<name>/SKILL.md`，frontmatter 含 kebab-case 的 `name` 与 `description`；
- 提供者扫描并解析 frontmatter，注册进 `ctx.skills` 注册表；
- `@deepseek-ai/dsh-tool-skill` 把可调用技能渲染进模型的 tool catalog；
- 之后模型侧按名字调用技能，技能通过 dsh 原生的 Skill、shell 和文件系统通道运行。

### 文件布局

| 文件 | 作用 |
|---|---|
| `package.json` | npm 元数据 + 接入声明（`dsh.bundle.patch` 字段、`files` 白名单、engines） |
| `cordis.patch.yml` | 方案核心：patch 层内容，插入 `dsh-skill-filesystem` 插件行 |
| `scripts/pack.mjs` | 发版前把仓库根目录的 skills 同步到 `./skills` 的构建脚本 |
| `skills/<name>/SKILL.md` | 每个 Skill 的 frontmatter、核心工作流和资源加载说明 |
| `skills/<name>/{references,assets,scripts,evals}/` | Skill 按需使用的参考、模板、确定性脚本和评测定义（若该 Skill 提供） |
| `skills/<name>/agents/openai.yaml` | OpenAI Agents SDK 风格接口文件，dsh 不读取，仅作其他宿主的兼容物 |

## 安装

```bash
dsh plugin --profile web add @howillmakeit/skills-dsh@latest
```

## 调用

让 dsh 按名字使用技能：

```text
Use the undress skill to strip the packaging from this project:
what was reused, what was modified, what was implemented, what was verified.
```

或者创建代码优先的学习仓库：

```text
Use learn-by-running-code to design a Python MCP learning repository.
Show me the chapter outline before creating files.
```

## 卸载

```bash
dsh plugin --profile web remove @howillmakeit/skills-dsh
```


## 维护者发布流程

正常发布由仓库根目录的 `.github/workflows/publish.yml` 完成。维护者先更新本文件夹 `package.json` 的版本并提交，然后推送同版本 tag，例如 `v0.2.0`。完整步骤见仓库的 [`docs/releasing.md`](../../docs/releasing.md)。

本地只做打包检查时，在本目录执行：

```bash
node scripts/pack.mjs
npm pack --dry-run --ignore-scripts
```

`skills/` 是构建产物（已 gitignore），通过 `files` 列表打进 tarball。不要从本地手工 `npm publish` 代替 tag 工作流。
