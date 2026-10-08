# Obsidian 交互组件（Datacore）

目标笔记在 Obsidian 库里时，用 Datacore 的 JSX 代码块写可交互的小组件，**取代 Mermaid 图**，并在确有帮助的地方补充组件。本文件规定何时用、怎么写、怎么验证。示例见 `datacore/examples/`：读写 frontmatter 的组件见 `persisted-checklist.jsx` 和 `persisted-tracker.jsx`，其余组件见各自文件。

界面设计（颜色、版式、图形式、交互、文案、无障碍）见 [widget-design.md](widget-design.md)。写组件的界面前先读它。

## 1. 何时使用

- 保存位置的上级目录里有 `.obsidian/`，或用户明确说写给 Obsidian：使用本文件。
- 其他目标（GitHub README、PDF、网页、聊天回复）：不写组件，沿用表格、列表和 Mermaid。
- 在 Obsidian 里，流程图和对比图一律改成组件，不再写 Mermaid。图太简单、不值得做成组件时，用文字、列表或表格，不要回退到 Mermaid。只有 Datacore 不可用且用户不愿安装时，才回退到 Mermaid。

## 2. 先检查环境

```bash
# 向上找库根目录
d="<笔记所在目录>"; while [ "$d" != "/" ] && [ ! -d "$d/.obsidian" ]; do d=$(dirname "$d"); done; VAULT="$d"
grep '"datacore"' "$VAULT/.obsidian/community-plugins.json"   # 是否启用
cat "$VAULT/.obsidian/plugins/datacore/data.json"             # 需要含 "enableJs": true
```

Datacore 的 JavaScript 视图默认关闭（源码里 `enableJs: false`），所以只装插件不够。

环境不满足时，先告诉用户缺什么，并询问是否由你安装。不要擅自修改库配置。用户同意后：

1. 在 `https://github.com/blacksmithgu/datacore/releases` 找最新的正式版（不是 prerelease），下载 `main.js`、`manifest.json`、`styles.css` 到 `$VAULT/.obsidian/plugins/datacore/`，并核对 `manifest.json` 的 `minAppVersion` 不高于用户的 Obsidian 版本（macOS：`defaults read /Applications/Obsidian.app/Contents/Info.plist CFBundleShortVersionString`）。
2. 备份 `community-plugins.json`，把 `"datacore"` 加进去。
3. 写入 `plugins/datacore/data.json`：`{"enableJs": true}`（插件会与默认值合并）。
4. 提醒用户完全退出再重新打开 Obsidian：运行中的 Obsidian 可能覆盖配置。首次启动 Datacore 会为整个库建索引，大库会占用几秒到几十秒 CPU。

Datacore 在资料中仍标注为 beta，接口可能变化。写组件时记录所用的插件版本，在回复里告诉用户，不写进笔记。

## 3. 代码块运行环境

以下来自 Datacore 0.1.29 源码和官方文档，升级后需要重新核对。

- 语言标记：`datacorejsx`（JSX）。还有 `datacorejs`、`datacorets`、`datacoretsx`。
- 代码块内容是一个 async 函数体：可以先定义常量和函数，最后 `return function View() { ... }`，返回的组件会被渲染。
- 注入的全局变量：`dc`、`h`、`Fragment`。JSX 用 `h` 编译（preact 10，与 React 写法接近）。
- Hooks：`dc.useState`、`dc.useEffect`、`dc.useMemo`、`dc.useRef`、`dc.useCallback`、`dc.useReducer`、`dc.createContext`。笔记组件一般用不到 `dc.useQuery` 这类查询库内数据的 hook。
- 样式：`style={{ ... }}` 用对象，属性名驼峰。颜色用 Obsidian 变量以适配深浅色：`--background-primary`、`--background-secondary`、`--background-modifier-border`、`--text-normal`、`--text-muted`、`--text-faint`、`--interactive-accent`、`--text-on-accent`。表达固定语义的颜色（例如"思想=橙、代码=蓝"）要同时写死背景色和文字色。
- SVG 属性用短横线写法：`text-anchor`、`stroke-width`（preact 不会把驼峰转成短横线）。
- 事件：`onClick`、`onInput`、`onChange`、`onKeyDown`；读取输入值用 `e.currentTarget.value`。
- 不依赖网络、外部库、`eval`、`localStorage`。

## 4. 选什么组件

| 要表达的内容 | 组件 | 示例文件 |
|---|---|---|
| 2–4 种做法的流程差异，各自能用一句话说明 | 并列对比，点选看说明 | `compare-lanes.jsx` |
| 有先后顺序、带循环或分支的流程 | 逐步播放（取代 Mermaid flowchart） | `flow-stepper.jsx` |
| 一个参数或公式对结果的影响 | 单滑块 | `slider-explorer.jsx` |
| 论文图或日志中按先后排列的关键节点 | 可点击轨迹 | `clickable-timeline.jsx` |
| 正文里的最小示例，读者想换参数再看 | 页面内真实运行 | `runnable-demo.jsx` |
| 想演示"一轮流程如何改变状态"，但没有真实数据 | 玩具模拟（必须标注示意） | `toy-simulation.jsx` |
| 读者要勾选、填写并保存的清单或打卡表 | 读写本笔记 frontmatter 的组件 | `persisted-checklist.jsx`、`persisted-tracker.jsx` |
| 把另一篇笔记（YAML + 正文）汇总成可筛选的时间线，只读 | 跨笔记汇总 | `cross-note-summary.jsx` |

选组件前先问：读者看完能多理解什么，是文字和表格给不了的？答不出就不加。一篇笔记通常 2–6 个，短笔记可以是 0 个；同一个概念最多一个组件；不为装饰添加。

## 5. 读写笔记属性（frontmatter）的组件

清单、打卡表这类组件要把状态存回笔记。用 Obsidian 自己的接口，不要手工改文件文本：

- **读初始值**：`dc.app.metadataCache.getFileCache(dc.app.vault.getAbstractFileByPath(dc.currentPath()))?.frontmatter`，同步且不依赖 Datacore 索引是否就绪。
- **写回**：`dc.app.fileManager.processFrontMatter(file, fm => { ... })`。按条目 id 或日期下标更新单个字段，不要用渲染时的旧数据整体覆盖。多个写入用同一个 Promise 链串行排队。
- **界面状态**：组件内用 `useState` 保存；写入失败时回滚勾选或文本，并在组件里显示错误。`Notice` 不是 Datacore 注入的全局变量，只能 `try { new Notice(msg) } catch {}` 作为附加提示，不能作为唯一的错误反馈。
- **类型**：YAML 里的值可能是数字、布尔或 null，渲染前统一转换（如 `String(value ?? "")`），不要直接调用 `.trim()`。
- **样式**：把 CSS 放进组件里的 `<style>{CSS}</style>`，类名加组件前缀避免污染笔记其他部分。需要 `!important` 的动态颜色，改成在元素上设置 CSS 变量（`style={{ "--bg": color }}`），再在样式表里写 `background: var(--bg) !important`，因为 style 对象不能带 `!important`。
- **测试**：冒烟测试提供内存里的假 `dc.app` 和 `dc.currentPath()`，用 `--fm '{"键": ...}'` 传入初始 frontmatter，不会写真实文件。读写逻辑还要另写专项测试：勾选后 fm 里对应字段变化、失败时回滚、其他字段不被覆盖。
- **读取另一篇笔记**：用 `dc.app.metadataCache.getFirstLinkpathDest(名称, dc.currentPath())` 按名称找文件（笔记被移动后仍能找到；带点号的名称同时试 `名称.md` 和 `名称`），失败时回退到固定路径，再失败就显示错误信息而不是空白。正文用 `await dc.app.vault.read(file)`，frontmatter 用 `getFileCache(file)?.frontmatter`。在 `useEffect` 里订阅 `dc.app.metadataCache.on("changed", ...)` 实现自动刷新，并在清理函数里 `offref`。
- **解析笔记正文**：只能按该笔记实际的标题和列表写法写解析规则，必须用真实内容测试，并处理重复标题、缺失日期、混入的引用块和感悟段落。自动归类、自动统计要在组件里写明"按关键词/规则得出，可能不准"，空白数据不算 0。汇总出的数字要与笔记里已有的文字总结核对，不一致时在回复里指出，不要悄悄选一个。
- **迁移已有的 dataviewjs 组件**：保持数据格式、键名和行为不变，已有笔记的 YAML 不需要改；改完把说明里的"Dataview 的 JavaScript 查询"更新为"Datacore 的 JavaScript 视图"。

## 6. 内容规则

组件里的数字、文案和配对关系同样适用 SKILL.md 的核心规则：

- 数据只用已核对的来源。从论文图里读出的数值与标签配对，要在组件旁注明"以原图为准"。
- 自己设定的参数或随机数据，必须在组件内明示"示意，不来自论文/资料"，标题不能让读者误以为是真实结果。
- 计算类组件的语义必须与来源中的定义一致，并且先用独立脚本验证：同一输入下，组件的算法与已运行的脚本（例如 Python）得到一致的结果，再写进笔记。
- 不为了好看补写资料里没有的步骤、因果或数据。
- 文字遵守正文的风格规则：无比喻、无宣传词；标题写成"交互：……"，让读者知道这是可操作的。

## 7. 可用性规则

- 可点击的元素用 `<button>`，或 `role="button"` + `tabindex={0}` + Enter/空格的 `onKeyDown`。
- 窄屏：宽的 SVG 外层加 `overflowX: 'auto'`。
- 重计算用"拖动时只更新数字，松手（`onChange`）后才计算"。首次渲染和每次操作都应在 300 ms 以内。
- 定时器必须在 `useEffect` 的清理函数里清除。
- 代码块自包含，不使用 `dc.require` 引用其他文件，保证笔记可以单文件迁移。
- 组件不替代正文：删去所有组件后，正文和表格仍完整。没有 Datacore 时，代码块只显示源码，手机端、导出 PDF 和 Obsidian Publish 上也可能不渲染（未逐一验证）。
- **笔记正文里不写任何关于组件本身的说明**：不写“本组件由 Datacore 生成”“需要安装 Datacore / 开启 JavaScript 视图”“已通过冒烟测试”“尚未在 Obsidian 渲染验证”“插件版本 X”之类的话，也不加注释块、脚注或引用块。这些是写笔记过程的信息，读者不需要，只在回复里告诉用户。组件内部只保留对读者有用的内容：数据来源，以及“示意”标注。

## 8. 工作流

1. 正文草稿和事实核对完成后，按第 4 节决定放哪些组件。
2. 复制最接近的示例，替换数据和文案。示例开头 4 行是模式说明注释，放进笔记前删掉。
3. 放进笔记的 ```datacorejsx 代码块，紧跟在它所解释的静态内容之后。
4. 运行冒烟测试，失败必须修复，警告要解释或优化：

```bash
mkdir -p /tmp/dc-test && cd /tmp/dc-test && npm i jsdom sucrase preact@10.17.1   # 装在临时目录，不要装进笔记库
node <skill 目录>/references/datacore/smoke-test.cjs "<笔记.md>"                   # 测试笔记里所有 datacorejsx 块
```

   脚本用 sucrase 以 `h`/`Fragment` 转换代码（与 Datacore 一致），在 jsdom 里用 preact 渲染，然后点击所有按钮和可聚焦的 SVG 节点、把所有滑块拖到最大和最小，检查是否抛错、是否出现 `NaN`/`undefined`、是否超过 300 ms。它不验证样式、主题和布局。

5. 在**对话回复**里如实报告验证状态，例如“N 个组件（Datacore 版本 X）在 jsdom + preact 10.17 中测试通过，尚未在 Obsidian 里渲染验证”。不要把这句话写进笔记。没有在 Obsidian 里打开过时，不得在回复里说“效果已确认”。用户反馈渲染问题后再修正。
