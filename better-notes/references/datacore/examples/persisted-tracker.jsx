// 模式：按日期排列的打卡/记录表，数据存在 YAML 数组里
// 适用：每周习惯表、实验日志表等固定行列的记录
// 改写时替换：DATES、ROWS、GROUPS、frontmatter 的键名 habit_tracker、时间解析和配色规则
// 来源：用户库首页和周日志的组件（已通过 smoke-test.cjs 和读写 frontmatter 的专项测试）；读写的是当前笔记自己的 frontmatter。

const DATES = ["10.5 周一", "10.6 周二", "10.7 周三", "10.8 周四", "10.9 周五", "10.10 周六", "10.11 周日"];
const ROWS = [
  { key: "wake", label: "⏰ 起床时间", type: "text" },
  { key: "study", label: "📚 有效学习（小时）", type: "text" },
  { key: "algorithms", label: "💻 算法题", type: "check" },
  { key: "papers", label: "📄 每天读一篇论文", type: "text" },
  { key: "workout", label: "🏋️ 健身", type: "check" },
  { key: "ledger", label: "🧾 记账（18:00 后）", type: "check" },
  { key: "phone_off", label: "📵 到工位后手机关机（每天两次）", type: "double-check" },
  { key: "meditation", label: "🧘 冥想（每天两次）", type: "double-check" },
  { key: "output", label: "🚀 主线产出", type: "text" },
  { key: "sleep", label: "🌙 睡觉时间", type: "text" }
];
const GROUPS = [{ title: "周一至周四", start: 0, end: 4 }, { title: "周五至周日", start: 4, end: 7 }];
const file = dc.app.vault.getAbstractFileByPath(dc.currentPath());
const state = dc.app.metadataCache.getFileCache(file)?.frontmatter?.habit_tracker ?? {};
const CSS = `.week-habit-grid, .week-habit-grid * { box-sizing: border-box; }
.week-habit-grid { width: 100%; min-width: 0; margin: 1rem 0; }
.week-habit-grid h4 { margin: 1.2rem 0 .5rem; }
.week-habit-grid table { width: 100%; table-layout: fixed; border-collapse: collapse; margin-bottom: 1.2rem; }
.week-habit-grid th, .week-habit-grid td { min-width: 0; padding: .45rem .25rem; font-size: 12px; white-space: normal; overflow-wrap: anywhere; text-align: center; vertical-align: middle; border: 1px solid var(--background-modifier-border); }
.week-habit-grid th:first-child { width: 25%; text-align: left; }
.week-habit-grid thead th { background: var(--background-secondary); color: var(--text-muted); }
.week-habit-grid tbody tr:nth-child(2n) { background: var(--background-secondary-alt); }
.week-habit-grid .habit-checks { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 5px; }
.week-habit-grid .habit-check-label { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; }
.week-habit-grid input[type="checkbox"] { appearance: none; -webkit-appearance: none; position: relative; display: grid; place-content: center; width: 24px; height: 24px; margin: 0; padding: 0; border: 2px solid var(--text-muted); border-radius: 6px; background: var(--background-primary); background-image: none; box-shadow: none; cursor: pointer; }
.week-habit-grid input[type="checkbox"]::after { content: ""; position: static; width: auto; height: auto; background: none; mask: none; -webkit-mask: none; }
.week-habit-grid input[type="checkbox"]:checked { background: #15803d; border-color: #15803d; }
.week-habit-grid input[type="checkbox"]:checked::after { content: "✓"; color: #fff; font-size: 20px; line-height: 1; font-weight: 800; }
.week-habit-grid input:focus-visible, .week-habit-grid textarea:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: 2px; }
.week-habit-grid .habit-status { font-size: 11px; color: var(--text-muted); }
.week-habit-grid td.habit-half { background: linear-gradient(to right, #dcfce7 0%, #dcfce7 50%, var(--background-primary) 50%, var(--background-primary) 100%) !important; }
.week-habit-grid td.habit-filled { background: #dcfce7 !important; color: #14532d; }
.week-habit-grid td.habit-filled .habit-status { color: #14532d; }
.week-habit-grid input[type="text"], .week-habit-grid textarea { display: block; width: 100%; min-width: 0; max-width: 100%; padding: .25rem; font: inherit; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary); color: var(--text-normal); }
.week-habit-grid td.habit-filled input[type="text"], .week-habit-grid td.habit-filled textarea { background: transparent; color: #14532d; }
.week-habit-grid input[type="text"] { text-align: center; }
.week-habit-grid textarea { min-height: 60px; line-height: 1.5; resize: vertical; overflow: hidden; white-space: pre-wrap; overflow-wrap: anywhere; }
.week-habit-grid td.habit-time, .week-habit-grid td.habit-time input { background: var(--habit-bg) !important; color: #253329 !important; box-shadow: none !important; }`;

let writes = Promise.resolve();
function save(key, index, value, fallback) {
  const result = writes.then(() => dc.app.fileManager.processFrontMatter(file, fm => {
    fm.habit_tracker ??= {};
    const values = Array.isArray(fm.habit_tracker[key]) ? [...fm.habit_tracker[key]] : Array(7).fill(fallback);
    while (values.length < 7) values.push(fallback);
    values[index] = value;
    fm.habit_tracker[key] = values;
  }));
  writes = result.catch(() => {});
  return result;
}
const toast = msg => { try { new Notice(msg); } catch (_) { console.warn(msg); } };

function parseHabitTime(value, key) {
  let text = String(value).trim().replace(/：/g, ":");
  const nextDay = /^(次日|翌日)/.test(text);
  text = text.replace(/^(次日|翌日)\s*/, "");
  text = text.replace(/点半$/, ":30").replace(/[点时]/, ":").replace(/分$/, "").replace(/:$/, "");
  const match = text.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  if (hour > 24 || minute > 59 || (hour === 24 && minute !== 0)) return null;
  // 睡觉栏的 11 点指晚上 23 点；凌晨按前一天晚间归属。
  if (key === "sleep" && !nextDay && hour >= 11 && hour < 18) hour += 12;
  let minutes = hour * 60 + minute;
  if (key === "sleep" && hour < 24 && (nextDay || hour < 11)) minutes += 24 * 60;
  return minutes;
}
function parseStudyHours(value) {
  const match = String(value).trim().match(/^(\d+(?:\.\d+)?)\s*(?:h|小时)?$/i);
  if (!match) return null;
  const hours = Number(match[1]);
  return hours <= 24 ? hours * 60 : null;
}
function habitTimeColor(minutes, key) {
  const start = key === "wake" ? 7 * 60 : 23 * 60;
  const distance = key === "study" ? 8 - minutes / 60 : (minutes - start) / 60;
  const position = Math.max(0, Math.min(4, distance));
  const palette = [[136,214,162], [200,223,141], [245,216,117], [240,173,120], [235,146,146]];
  if (key === "study") palette[1] = [182,232,198];
  const index = Math.min(3, Math.floor(position));
  const fraction = position - index;
  const rgb = palette[index].map((channel, i) => Math.round(channel + (palette[index + 1][i] - channel) * fraction));
  return `rgb(${rgb.join(", ")})`;
}

function CheckCell({ def, i, aria, onError }) {
  const total = def.type === "double-check" ? 2 : 1;
  const keys = total === 2 ? [`${def.key}_1`, `${def.key}_2`] : [def.key];
  const [checked, setChecked] = dc.useState(keys.map(k => state[k]?.[i] === true));
  const [busy, setBusy] = dc.useState(-1);
  const count = checked.filter(Boolean).length;
  const cls = ["habit-cell", count === total && "habit-filled", total === 2 && count === 1 && "habit-half"].filter(Boolean).join(" ");
  const change = async (n, value) => {
    setChecked(prev => prev.map((c, j) => j === n ? value : c));
    setBusy(n);
    try { await save(keys[n], i, value, false); }
    catch (error) { setChecked(prev => prev.map((c, j) => j === n ? !value : c)); onError(error); }
    finally { setBusy(-1); }
  };
  return (
    <td class={cls}>
      <div class="habit-checks">
        {keys.map((k, n) => (
          <label class="habit-check-label">
            <input type="checkbox" checked={checked[n]} disabled={busy === n}
              aria-label={total === 2 ? `${aria} 第${n + 1}次` : aria} onChange={e => change(n, e.currentTarget.checked)} />
            {total === 2 && <span class="habit-status">第{n + 1}次</span>}
          </label>
        ))}
      </div>
      <div class="habit-status">{total === 2 ? (count === 2 ? "已完成 2/2" : `已打卡 ${count}/2`) : (count ? "已完成" : "未勾选")}</div>
    </td>
  );
}

function TextCell({ def, i, aria, onError }) {
  const multiline = ["papers", "output"].includes(def.key);
  const isTime = ["wake", "sleep", "study"].includes(def.key);
  const [value, setValue] = dc.useState(String(state[def.key]?.[i] ?? "")); // YAML 里的 8:30 等可能被解析成数字，统一转成字符串
  const [busy, setBusy] = dc.useState(false);
  const saved = dc.useRef(value);
  const ref = dc.useRef(null);
  const fit = () => {
    const el = ref.current;
    if (multiline && el) { el.style.height = "auto"; el.style.height = `${Math.max(60, el.scrollHeight)}px`; }
  };
  dc.useEffect(() => { requestAnimationFrame(fit); }, [value]);

  const minutes = !isTime ? null : def.key === "study" ? parseStudyHours(value) : parseHabitTime(value, def.key);
  const filled = !isTime && value.trim().length > 0;
  const colored = minutes !== null;
  const hint = def.key === "study" ? "请填小时数，如 7、8、6.5" : "请填时间，如 08:30、23:00、次日 01:00";
  const title = !isTime ? undefined : colored
    ? (def.key === "study" ? "学习时长：8小时绿，7小时浅绿，6小时黄，5小时橙，4小时及以下红；超过8小时不额外加绿" : "按时间配色：绿 → 黄绿 → 黄 → 橙 → 红")
    : (value.trim() ? hint : undefined);
  const cls = ["habit-cell", filled && "habit-filled", colored && "habit-time"].filter(Boolean).join(" ");
  const commit = async next => {
    setBusy(true);
    try { await save(def.key, i, next, ""); saved.current = next; }
    catch (error) { setValue(saved.current); onError(error); }
    finally { setBusy(false); }
  };
  const common = {
    ref, value, disabled: busy, title, "aria-label": aria,
    onInput: e => setValue(e.currentTarget.value), onChange: e => commit(e.currentTarget.value),
  };
  return (
    <td class={cls} style={colored ? { "--habit-bg": habitTimeColor(minutes, def.key) } : undefined}>
      {multiline
        ? <textarea rows={3} placeholder={def.key === "papers" ? "论文名" : "填写"} {...common} />
        : <input type="text" placeholder="填写" {...common} />}
    </td>
  );
}

return function View() {
  const [error, setError] = dc.useState("");
  const onError = e => {
    const msg = `保存失败：${e.message || e}`;
    setError(msg);
    toast(msg);
  };
  return (
    <div class="week-habit-grid">
      <style>{CSS}</style>
      <div class="habit-time-legend">时间配色：起床 7→8→9→10→11 点；睡觉 23→24→次日1→2→3 点，绿→黄绿→黄→橙→红。</div>
      {GROUPS.map(g => (
        <>
          <h4>{g.title}</h4>
          <table>
            <thead>
              <tr>
                <th>习惯项目</th>
                {DATES.slice(g.start, g.end).map(d => <th>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(def => (
                <tr>
                  <th>{def.label}</th>
                  {Array.from({ length: g.end - g.start }, (_, n) => g.start + n).map(i => {
                    const aria = `${def.label} ${DATES[i]}`;
                    return def.type === "text"
                      ? <TextCell def={def} i={i} aria={aria} onError={onError} />
                      : <CheckCell def={def} i={i} aria={aria} onError={onError} />;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ))}
      {error && <div class="habit-status" style={{ color: "var(--text-error)" }} role="alert">{error}</div>}
    </div>
  );
};
