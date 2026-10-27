#!/usr/bin/env node
// Datacore JSX 组件冒烟测试：用与 Datacore 相同的方式转换并渲染，再自动操作一遍。
//
// 用法（依赖装在任意临时目录，不要装进笔记库）：
//   mkdir -p /tmp/dc-test && cd /tmp/dc-test && npm i jsdom sucrase preact@10.17.1
//   node <skill>/references/datacore/smoke-test.cjs <组件.jsx | 笔记.md> [...]
//
// 传入 .md 时，会提取其中所有 ```datacorejsx 代码块逐个测试。
// 做的事：
//   1. 用 sucrase（jsxPragma=h, jsxFragmentPragma=Fragment）转换，与 Datacore 一致；
//   2. 以 async 函数体执行，注入 dc / h / Fragment，要求返回组件函数或 VNode；
//   3. 用 preact 10.x 渲染到 jsdom；
//   4. 点击所有按钮、复选框和 SVG 节点，把所有 range 滑块拖到最大和最小，检查是否抛错、是否过慢；
//   5. 提供假的 dc.app / dc.currentPath()，读写 frontmatter 的组件也能跑；用 --fm '{...}' 给初始值。
// 不做的事：不验证样式、主题、布局，也不替代在 Obsidian 里实际打开确认。
// 退出码：全部通过为 0，有任何失败为 1。

const fs = require('fs');
const path = require('path');

const load = name => {
  try { return require(require.resolve(name, { paths: [process.cwd(), __dirname] })); }
  catch { console.error(`缺少依赖 ${name}。请在临时目录运行：npm i jsdom sucrase preact@10.17.1`); process.exit(2); }
};
const { JSDOM } = load('jsdom');
const { transform } = load('sucrase');
const preact = load('preact');
const hooks = load('preact/hooks');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const tick = (ms = 30) => new Promise(r => setTimeout(r, ms));
const SLOW_MS = 300;

// 可选：--fm '{"key": ...}' 提供初始 frontmatter（JSON），默认为空对象。
let FRONTMATTER = {};
const args = process.argv.slice(2);
const fmAt = args.indexOf('--fm');
if (fmAt >= 0) { FRONTMATTER = JSON.parse(args[fmAt + 1]); args.splice(fmAt, 2); }

function collect(file) {
  const src = fs.readFileSync(file, 'utf8');
  if (!file.endsWith('.md')) return [{ name: path.basename(file), code: src }];
  const out = [], re = /```datacorejsx?\n([\s\S]*?)\n```/g;
  let m, i = 0;
  while ((m = re.exec(src))) {
    const line = src.slice(0, m.index).split('\n').length;
    out.push({ name: `${path.basename(file)} 第 ${++i} 个代码块（第 ${line} 行）`, code: m[1] });
  }
  return out;
}

async function run({ name, code }) {
  const errors = [];
  const onErr = e => errors.push(String(e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e));
  process.on('uncaughtException', onErr);
  const dom = new JSDOM('<body><div id="c"></div></body>', { pretendToBeVisual: true, url: 'http://localhost/' });
  Object.assign(global, {
    window: dom.window, document: dom.window.document, Node: dom.window.Node, Event: dom.window.Event,
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window), sessionStorage: dom.window.sessionStorage,
  });
  // 读写笔记属性（frontmatter）的组件会用到 dc.app：这里用内存里的假 frontmatter，写入不会碰真实文件。
  const fm = JSON.parse(JSON.stringify(FRONTMATTER));
  const app = {
    vault: { getAbstractFileByPath: p => ({ path: p }), read: async () => '' },
    metadataCache: {
      getFileCache: () => ({ frontmatter: JSON.parse(JSON.stringify(fm)) }),
      getFirstLinkpathDest: () => null, on: () => ({}), offref: () => {},   // 读取其他笔记的组件会走「找不到文件」分支
    },
    workspace: { openLinkText: () => {} },
    fileManager: { processFrontMatter: async (file, fn) => { fn(fm); } },
  };
  const dc = {
    preact, h: preact.h,
    useState: hooks.useState, useEffect: hooks.useEffect, useMemo: hooks.useMemo, useRef: hooks.useRef,
    useCallback: hooks.useCallback, useReducer: hooks.useReducer, createContext: preact.createContext, useContext: hooks.useContext,
    useQuery: () => [], useCurrentFile: () => ({ $path: 'test.md', $name: 'test' }),
    currentPath: () => 'test.md', app,
  };
  const report = { name, ok: true, notes: [] };
  const fail = msg => { report.ok = false; report.notes.push('失败：' + msg); };
  try {
    const js = transform(code, { transforms: ['jsx'], jsxPragma: 'h', jsxFragmentPragma: 'Fragment' }).code;
    let t0 = Date.now();
    const View = await new AsyncFunction('dc', 'h', 'Fragment', js)(dc, preact.h, preact.Fragment);
    if (typeof View !== 'function' && !(View && View.type !== undefined)) return { ...report, ok: false, notes: ['失败：代码块没有返回组件函数（需要 return function View() {...}）'] };
    const c = document.getElementById('c');
    preact.render(typeof View === 'function' ? preact.h(View) : View, c);
    await tick();
    const renderMs = Date.now() - t0;
    if (renderMs > SLOW_MS) report.notes.push(`警告：首次渲染 ${renderMs} ms，超过 ${SLOW_MS} ms`);
    const text = () => c.textContent.replace(/\s+/g, ' ');
    const before = text();
    if (!before.trim()) fail('渲染结果为空');
    if (/NaN|undefined|\[object Object\]/.test(before)) fail('首次渲染出现 NaN / undefined / [object Object]');

    let acts = 0;
    const act = async (label, fn) => {
      const s = Date.now();
      try { fn(); } catch (e) { fail(`${label} 抛错：${e.message}`); }
      await tick(10);
      acts++;
      const ms = Date.now() - s;
      if (ms > SLOW_MS) report.notes.push(`警告：${label} 耗时 ${ms} ms`);
    };
    const click = el => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    const nButtons = c.querySelectorAll('button').length;
    for (let i = 0; i < nButtons; i++) {
      const b = c.querySelectorAll('button')[i];
      if (b && !b.disabled) await act(`点击按钮「${(b.textContent || '').trim().slice(0, 12)}」`, () => click(b));
    }
    const nBoxes = c.querySelectorAll('input[type=checkbox]').length;
    for (let i = 0; i < nBoxes; i++) {
      const el = c.querySelectorAll('input[type=checkbox]')[i];
      if (el && !el.disabled) await act(`切换复选框 #${i}`, () => { el.checked = !el.checked; el.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
    }
    const nNodes = c.querySelectorAll('svg circle, svg [role=button], [tabindex]').length;
    for (let i = 0; i < nNodes; i++) {
      const el = c.querySelectorAll('svg circle, svg [role=button], [tabindex]')[i];
      if (el) await act(`点击可聚焦节点 #${i}`, () => click(el));
    }
    const nRange = c.querySelectorAll('input[type=range]').length;
    for (let i = 0; i < nRange; i++) {
      for (const pick of ['max', 'min']) {
        const el = c.querySelectorAll('input[type=range]')[i];
        if (!el) continue;
        await act(`拖动滑块 #${i} 到${pick === 'max' ? '最大' : '最小'}`, () => {
          el.value = el[pick];
          el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
          el.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
        });
      }
    }
    const after = text();
    if (/NaN|undefined|\[object Object\]/.test(after)) fail('操作后出现 NaN / undefined / [object Object]');
    report.notes.push(`交互 ${acts} 次（按钮 ${nButtons}、复选框 ${nBoxes}、节点 ${nNodes}、滑块 ${nRange}）；文本${before === after ? '未变化' : '有变化'}`);
    preact.render(null, c);
  } catch (e) {
    fail(`转换或执行出错：${e.message}`);
  }
  await tick(20);
  process.removeListener('uncaughtException', onErr);
  if (errors.length) fail('未捕获异常：' + errors.join(' ; '));
  return report;
}

(async () => {
  const files = args;
  if (!files.length) { console.error("用法：node smoke-test.cjs [--fm '{json}'] <组件.jsx | 笔记.md> [...]"); process.exit(2); }
  let bad = 0, total = 0;
  for (const f of files) {
    const blocks = collect(f);
    if (!blocks.length) { console.log(`${f}：没有找到 datacorejsx 代码块`); continue; }
    for (const b of blocks) {
      const r = await run(b); total++;
      if (!r.ok) bad++;
      console.log(`${r.ok ? '通过' : '失败'}  ${r.name}`);
      for (const n of r.notes) console.log('       ' + n);
    }
  }
  console.log(`\n共 ${total} 个，通过 ${total - bad}，失败 ${bad}`);
  process.exit(bad ? 1 : 0);
})();
