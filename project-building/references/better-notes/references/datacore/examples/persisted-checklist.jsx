// 模式：可编辑清单，数据存在当前笔记的 YAML 属性里
// 适用：待办、计划、阅读清单等需要读者勾选并保存状态的内容
// 改写时替换：AREAS、frontmatter 的键名 home_plan、CSS 类名前缀；保持"按 id 写回"和写入串行排队
// 来源：用户库首页和周日志的组件（已通过 smoke-test.cjs 和读写 frontmatter 的专项测试）；读写的是当前笔记自己的 frontmatter。

const AREAS = [
  { key: "metabbo", name: "MetaBBO", hint: "研究、实验、论文与工程事项" },
  { key: "llm", name: "LLM / Agent / RL", hint: "学习、项目、论文阅读与求职准备" },
];
const notePath = dc.currentPath();
const file = dc.app.vault.getAbstractFileByPath(notePath);
const initial = dc.app.metadataCache.getFileCache(file)?.frontmatter?.home_plan ?? {};
const tabKey = `home-plan-tab:${notePath}`;
const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const CSS = `.home-plan-board, .home-plan-board * { box-sizing: border-box; }
.home-plan-board { width: 100%; min-width: 0; margin: 16px 0; }
.home-plan-board .hp-tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; padding: 4px; margin-bottom: 28px; border: 1px solid var(--background-modifier-border); border-radius: 10px; background: var(--background-secondary); }
.home-plan-board .hp-tabs button { height: auto; min-height: 40px; padding: 9px 8px; white-space: normal; font-size: 13px; line-height: 1.4; border-radius: 7px; font-weight: 500; border: 1px solid transparent; color: var(--text-muted); background: transparent; box-shadow: none; cursor: pointer; }
.home-plan-board .hp-tabs button.is-active { color: var(--text-normal); font-weight: 650; border-color: var(--background-modifier-border); background: var(--background-primary); box-shadow: none; }
.home-plan-board .hp-panel[hidden] { display: none; }
.home-plan-board .hp-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.home-plan-board .hp-header h2 { margin: 0; font-size: 19px; font-weight: 650; line-height: 1.4; }
.home-plan-board .hp-count, .home-plan-board .hp-hint, .home-plan-board .hp-help { font-size: 12px; color: var(--text-muted); }
.home-plan-board .hp-count { font-variant-numeric: tabular-nums; }
.home-plan-board .hp-hint { margin: 6px 0 20px; line-height: 1.6; }
.home-plan-board .hp-list { display: flex; flex-direction: column; gap: 8px; }
.home-plan-board .hp-item { display: grid; grid-template-columns: minmax(0, 1fr) 44px; align-items: center; gap: 16px; padding: 12px 16px; border: 1px solid var(--background-modifier-border); border-radius: 8px; background: var(--background-secondary); transition: border-color .15s ease, background-color .15s ease; }
.home-plan-board .hp-item:focus-within { border-color: var(--text-muted); }
.home-plan-board .hp-item textarea { display: block; width: 100%; min-width: 0; max-width: 100%; min-height: 58px; margin: 0; padding: 4px; height: auto; border: none; box-shadow: none; background: transparent; color: var(--text-normal); font: inherit; font-size: 14px; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; resize: none; overflow: hidden; }
.home-plan-board .hp-item textarea:focus { outline: 2px solid var(--interactive-accent); outline-offset: 2px; border-radius: 4px; }
.home-plan-board .hp-check-label { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
.home-plan-board .hp-check-label input[type="checkbox"] { appearance: none; -webkit-appearance: none; display: grid; place-content: center; position: relative; width: 26px; height: 26px; margin: 0; padding: 0; border: 1.5px solid var(--text-muted); border-radius: 5px; background: var(--background-primary); background-image: none; box-shadow: none; cursor: pointer; }
.home-plan-board .hp-check-label input::after { content: ""; position: static; width: auto; height: auto; background: none; mask: none; -webkit-mask: none; }
.home-plan-board .hp-check-label input:checked { background: #15803d; border-color: #15803d; background-image: none; }
.home-plan-board .hp-check-label input:checked::after { content: "✓"; color: #fff; font-size: 21px; line-height: 1; font-weight: 800; }
.home-plan-board .hp-check-label input:focus-visible, .home-plan-board button:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: 3px; }
.home-plan-board .hp-status { font-size: 11px; color: var(--text-muted); }
.home-plan-board .hp-item.is-done { background: #e1f3e7; border-color: #a7d3b5; }
.home-plan-board .hp-item.is-done textarea, .home-plan-board .hp-item.is-done .hp-status { color: #14532d; }
.home-plan-board .hp-add { display: block; width: 100%; margin-top: 12px; height: auto; padding: 10px 14px; border: 1px dashed var(--background-modifier-border); border-radius: 8px; background: transparent; box-shadow: none; color: var(--text-muted); font-size: 13px; font-weight: 500; cursor: pointer; }
.home-plan-board .hp-add:hover { background: var(--background-secondary); color: var(--text-normal); }
.home-plan-board .hp-help { margin-top: 14px; font-size: 11px; line-height: 1.6; }
@media (prefers-reduced-motion: reduce) { .home-plan-board .hp-item { transition: none; } }`;

// 按事项 id 更新当前 YAML，而不是用旧页面数据覆盖其他事项；写入串行排队。
let writeQueue = Promise.resolve();
function saveItem(area, item, patch) {
  const next = writeQueue.then(() => dc.app.fileManager.processFrontMatter(file, fm => {
    fm.home_plan ??= {};
    if (!Array.isArray(fm.home_plan[area])) fm.home_plan[area] = [];
    const list = fm.home_plan[area];
    let saved = list.find(entry => entry.id === item.id);
    if (!saved) {
      saved = { id: item.id, text: item.text, done: item.done };
      list.push(saved);
    }
    Object.assign(saved, patch);
  }));
  writeQueue = next.catch(() => {});
  return next;
}
const toast = msg => { try { new Notice(msg); } catch (_) { console.warn(msg); } };

function Item({ area, item, autoFocus, visible, onSaved, onError }) {
  const [text, setText] = dc.useState(item.text);
  const [busy, setBusy] = dc.useState(false);
  const ref = dc.useRef(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(58, el.scrollHeight)}px`;
  };
  // 隐藏的标签页 scrollHeight 为 0，所以显示时和文字变化后都要重新量高度。
  dc.useEffect(() => { requestAnimationFrame(fit); }, [visible, text]);
  dc.useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, []);

  const commit = async value => {
    const done = value.trim() ? item.done : false;
    try {
      await saveItem(area, item, { text: value, done });
      onSaved(item.id, { text: value, done });
    } catch (error) { onError(error); }
  };
  const toggle = async e => {
    const box = e.currentTarget, value = ref.current ? ref.current.value : text;
    if (!value.trim()) {
      box.checked = false;
      toast("先填写事项，再标记完成。");
      if (ref.current) ref.current.focus();
      return;
    }
    const done = box.checked;
    setBusy(true);
    try {
      await saveItem(area, item, { text: value, done });
      onSaved(item.id, { text: value, done });
    } catch (error) { box.checked = item.done; onError(error); }
    finally { setBusy(false); }
  };

  return (
    <div class={`hp-item${item.done ? " is-done" : ""}`}>
      <textarea ref={ref} rows={2} value={text} placeholder="填写一件需要做或想做的事情…" aria-label={`${area} 事项`}
        onInput={e => setText(e.currentTarget.value)} onChange={e => commit(e.currentTarget.value)} />
      <label class="hp-check-label">
        <input type="checkbox" checked={item.done} disabled={busy} onChange={toggle}
          aria-label={`标记完成：${item.text || "空白事项"}`} />
        <span class="hp-status">{item.done ? "已完成" : "待完成"}</span>
      </label>
    </div>
  );
}

return function View() {
  const [active, setActive] = dc.useState(() => {
    let key = "metabbo";
    try { key = sessionStorage.getItem(tabKey) || key; } catch (_) {}
    return AREAS.some(a => a.key === key) ? key : "metabbo";
  });
  const [items, setItems] = dc.useState(() => Object.fromEntries(AREAS.map(a => {
    const list = Array.from(initial[a.key] ?? []).map(entry => ({
      id: String(entry.id || makeId()), text: String(entry.text ?? ""), done: entry.done === true
    }));
    if (!list.length) list.push({ id: makeId(), text: "", done: false });
    return [a.key, list];
  })));
  const [focusId, setFocusId] = dc.useState(null);
  const [error, setError] = dc.useState("");
  const tabRefs = dc.useRef({});

  const selectTab = key => {
    setActive(key);
    try { sessionStorage.setItem(tabKey, key); } catch (_) {}
  };
  const onSaved = (area, id, patch) => {
    setError("");
    setItems(prev => ({ ...prev, [area]: prev[area].map(it => it.id === id ? { ...it, ...patch } : it) }));
  };
  const onError = error => {
    const msg = `计划保存失败，请重试：${error.message || error}`;
    setError(msg);
    toast(msg);
  };
  const onTabKey = e => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const index = AREAS.findIndex(a => a.key === active);
    const n = e.key === "Home" ? 0 : e.key === "End" ? AREAS.length - 1 :
      (index + (e.key === "ArrowRight" ? 1 : -1) + AREAS.length) % AREAS.length;
    selectTab(AREAS[n].key);
    const btn = tabRefs.current[AREAS[n].key];
    if (btn) btn.focus();
  };

  return (
    <div class="home-plan-board">
      <style>{CSS}</style>
      <div class="hp-tabs" role="tablist" aria-label="计划领域">
        {AREAS.map(a => (
          <button type="button" role="tab" ref={el => { tabRefs.current[a.key] = el; }}
            class={active === a.key ? "is-active" : ""} aria-selected={String(active === a.key)} tabIndex={active === a.key ? 0 : -1}
            onClick={() => selectTab(a.key)} onKeyDown={onTabKey}>{a.name}</button>
        ))}
      </div>
      {AREAS.map(a => {
        const list = items[a.key];
        const written = list.filter(it => it.text.trim());
        return (
          <div class="hp-panel" role="tabpanel" aria-label={a.name} hidden={active !== a.key}>
            <div class="hp-header">
              <h2>{a.name}</h2>
              <span class="hp-count" aria-live="polite">{written.filter(it => it.done).length} / {written.length} 已完成</span>
            </div>
            <div class="hp-hint">{a.hint}</div>
            <div class="hp-list">
              {list.map(it => (
                <Item key={it.id} area={a.key} item={it} autoFocus={focusId === it.id} visible={active === a.key}
                  onSaved={(id, patch) => onSaved(a.key, id, patch)} onError={onError} />
              ))}
            </div>
            <button type="button" class="hp-add" onClick={() => {
              const item = { id: makeId(), text: "", done: false };
              setItems(prev => ({ ...prev, [a.key]: [...prev[a.key], item] }));
              setFocusId(item.id);
            }}>＋ 添加事项</button>
            <div class="hp-help">填写后离开输入框即保存；勾选即保存，取消勾选可恢复为待完成。</div>
          </div>
        );
      })}
      {error && <div class="hp-help" style={{ color: "var(--text-error)" }} role="alert">{error}</div>}
    </div>
  );
};
