# 发布说明

这个仓库有两种发布结果，但只维护一个版本号：

- Git tag 和 GitHub Release：固定整个 Skills 合集的版本，通用 Agent 用户可以按 tag 安装；
- npm 包 `@howillmakeit/skills-dsh`：把同一版本的全部 Skill 提供给 DeepSeek Harness。

通用 Agent 的单 Skill 安装不需要把每个 Skill 单独发布成 npm 包。`npx skills` 是从 npm 临时运行的标准安装器，实际 Skill 内容来自这个 GitHub 仓库。

## 首次配置 npm Trusted Publisher

`@howillmakeit/skills-dsh` 已经存在于 npm，因此可以直接配置无长期 Token 的 OIDC 发布：

1. 打开 npm 包的 **Settings → Trusted Publisher**；
2. Provider 选择 **GitHub Actions**；
3. Organization or user：`HOWILLMAKEIT`；
4. Repository：`skills`；
5. Workflow filename：`publish.yml`，只填文件名；
6. Environment 留空；
7. Allowed actions 允许 `npm publish`。

工作流使用 `id-token: write` 获取短期凭据，不读取 `NPM_TOKEN`。Trusted Publisher 验证成功后，可以删除不再使用的发布 Token。

也可以使用 npm CLI 完成同一项配置。`npm trust` 要求 npm 11.15.0 或更高版本；你的本机默认 registry 可能是 npm 镜像，因此升级、登录和建立 trust 时都显式指定官方 registry：

```bash
npm install -g npm@^11.15.0 --registry https://registry.npmjs.org/
npm login --auth-type=web --registry https://registry.npmjs.org/
npm whoami --registry https://registry.npmjs.org/

npm trust github @howillmakeit/skills-dsh \
  --file publish.yml \
  --repo HOWILLMAKEIT/skills \
  --allow-publish \
  --registry https://registry.npmjs.org/ \
  -y
```

`npm whoami` 必须先输出你的 npm 用户名。如果返回 `E401`，说明官方 registry 的本地登录凭据无效，应重新完成浏览器登录后再运行 `npm trust`。

建议同时在 GitHub 为 `v*` 创建 tag ruleset，只允许仓库管理员创建发布 tag，并开启 immutable releases。

## 发布一个版本

下面以 `0.2.0` 为例。

### 1. 修改并验证版本

当前仓库已经把 DSH 包版本更新为 `0.2.0`。以后发布其他版本时，如果 `package.json` 还不是目标版本，先执行：

```bash
cd integrations/deepseek-harness
npm version 0.3.0 --no-git-tag-version
cd ../..
```

然后在仓库根目录执行发布前检查：

```bash
node scripts/check-release.mjs v0.2.0
node scripts/validate-skills.mjs
node integrations/deepseek-harness/scripts/pack.mjs
npm pack ./integrations/deepseek-harness --dry-run --ignore-scripts
```

### 2. 提交版本修改

```bash
git add .
git commit -m "release: v0.2.0"
git push origin main
```

### 3. 创建并推送 tag

```bash
git tag v0.2.0
git push origin v0.2.0
```

`.github/workflows/publish.yml` 随后会：

1. 检查 tag 与 DSH `package.json` 版本完全一致；
2. 验证全部 Skill；
3. 打包 `@howillmakeit/skills-dsh`；
4. 通过 npm Trusted Publishing 发布；
5. 创建 GitHub Release，并附上同一个 npm tarball。

如果版本不一致、npm 上已经存在该版本或 Trusted Publisher 尚未配置，工作流会失败，不会静默覆盖已有版本。

## 安装指定版本

通用 Agent 用户可以把 GitHub tag 作为不可变来源：

```bash
npx -y skills@latest add 'https://github.com/HOWILLMAKEIT/skills.git#v0.2.0' --skill undress -g -a codex -y
```

DSH 用户可以固定 npm 版本：

```bash
dsh plugin --profile web add @howillmakeit/skills-dsh@0.2.0
```
