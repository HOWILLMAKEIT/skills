# `@howillmakeit/skills-dsh`

[Howskills 合集](https://github.com/HOWILLMAKEIT/skills)的社区 DeepSeek Harness(dsh)集成包。非 DeepSeek 官方产品。

实验性兼容开发者预览版 **`@deepseek-ai/dsh@0.1.0-rc.6`**,要求 Node.js **`^22.19.0 || >=24.0.0`**。不承诺跨版本稳定。

这是一个纯 Skill bundle:插入一个隔离的文件系统 Skill provider(`howillmakeit-plugin`,`includeDefaultRoots: false`),把本仓库的 skills(当前为 `undress` 技术工作去包装)暴露给 dsh。不注册原生工具,不含 Web 客户端、遥测、网络访问、凭据处理,也没有 `prepare`/`install`/`postinstall` 脚本。

## 安装

```bash
dsh plugin --profile web add @howillmakeit/skills-dsh@0.1.0
```

## 调用

让 dsh 按名字使用技能:

```text
Use the undress skill to strip the packaging from this project:
what was reused, what was modified, what was implemented, what was verified.
```

技能通过 dsh 原生的 Skill、shell 和文件系统通道运行。

## 卸载

```bash
dsh plugin --profile web remove @howillmakeit/skills-dsh
```

## 维护者发布流程

在本目录执行:

```bash
node scripts/pack.mjs   # 把仓库根目录的 skills 同步到 ./skills
npm publish
```

需要拥有 `@howillmakeit` npm scope。`skills/` 是构建产物(已 gitignore),通过 `files` 列表打进 tarball。
