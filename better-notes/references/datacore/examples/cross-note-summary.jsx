// 模式：读取另一篇笔记（YAML + 正文）并汇总成可筛选的时间线，只读
// 适用：月总结引用周记、项目总览引用各实验日志等"从别的笔记里动态汇总"的场景
// 改写时替换：WEEK_LINK/FALLBACK_PATH、parseBody() 里按该笔记的标题和列表格式写的解析规则、归类规则 RULES、统计项
// 来源：用户库月总结里的周汇总组件（已用真实周记测试）；解析规则依赖具体笔记的写法，换笔记必须重写并重测。

const WEEK_LINK = "第五周 9.28"; // 换成要汇总的笔记名
const FALLBACK_PATH = "周报/第五周 9.28.md";
const WEEKDAY = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
// 归类只是关键词规则（先匹配先生效），不是我对每件事的判断，可能不准。
const THEMES = [
  { key: "meta", name: "Meta²", color: "#3b82f6" },
  { key: "job", name: "求职", color: "#f59e0b" },
  { key: "read", name: "阅读", color: "#8b5cf6" },
  { key: "algo", name: "算法", color: "#10b981" },
  { key: "life", name: "生活", color: "#ec4899" },
  { key: "other", name: "其他", color: "#9ca3af" },
];
const RULES = [
  ["read", /读.*论文|读一下论文|eoh/i],
  ["job", /agent-reach|boss|实习|求职|小红书|岗位|面经/i],
  ["algo", /算法题/],
  ["life", /游泳|出去玩|地毯|怡宝|买了/],
  ["meta", /meta|v[5-8]|实验|符号|架构|代码|agent|知识库|论文写作|创新点|glm|评测|项目|文档|续训|奖励/i],
];
const classify = text => (RULES.find(([, re]) => re.test(text)) || ["other"])[0];
const theme = key => THEMES.find(t => t.key === key);
const clean = s => s.replace(/\*\*/g, "").replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1").trim();
const BORDER = "1px solid var(--background-modifier-border)";

// 从周记正文里按 "# 9.28" 这类一级标题切出每一天，收集列表项、记账行和"今日感悟"的小标题。
function parseBody(text) {
  const days = {};
  let cur = null, period = "", ledgerMode = false, reflect = false;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\r$/, "");
    const h1 = line.match(/^# (\d{1,2})\.(\d{1,2})\s*$/);
    if (h1) {
      cur = `${+h1[1]}.${+h1[2]}`;
      days[cur] ??= { items: [], ledger: [], reflections: [] };
      period = ""; ledgerMode = false; reflect = false;
      continue;
    }
    if (/^# /.test(line)) { cur = null; continue; }
    if (!cur) continue;
    if (/^## /.test(line)) { reflect = /感悟|复盘/.test(line); ledgerMode = false; continue; }
    if (reflect) {
      const h3 = line.match(/^### (.+)$/);
      if (h3) days[cur].reflections.push(clean(h3[1]));
      continue;
    }
    const per = line.match(/^(早上|上午|中午|下午|晚上|下午和晚上)\s*[：:]\s*$/);
    if (per) { period = per[1]; ledgerMode = false; continue; }
    const led = line.match(/^记账\s*[：:]\s*(.*)$/);
    if (led) { ledgerMode = true; if (led[1].trim()) days[cur].ledger.push(clean(led[1])); continue; }
    const li = line.match(/^(\t*)(?:\d+\.|[-*])\s+(.*\S)\s*$/);
    if (li) {
      if (ledgerMode) days[cur].ledger.push(clean(li[2]));
      else days[cur].items.push({ text: clean(li[2]), depth: li[1].length, period });
    } else if (ledgerMode && /^[^：:]{1,20}\s*[：:]\s*\d+(\.\d+)?\s*$/.test(line.trim())) {
      days[cur].ledger.push(clean(line.trim()));
    }
  }
  // 子项没有明确归类时沿用上一级的归类
  for (const d of Object.values(days)) {
    let parent = "other";
    for (const it of d.items) {
      const own = classify(it.text);
      if (it.depth === 0) { it.theme = own; parent = own; }
      else it.theme = own === "other" ? parent : own;
    }
  }
  return days;
}

const hours = v => { const n = parseFloat(String(v ?? "").trim()); return Number.isFinite(n) ? n : null; };
const filled = v => String(v ?? "").trim() !== "";

function findFile() {
  for (const name of [WEEK_LINK + ".md", WEEK_LINK]) {
    const f = dc.app.metadataCache.getFirstLinkpathDest(name, dc.currentPath());
    if (f) return f;
  }
  return dc.app.vault.getAbstractFileByPath(FALLBACK_PATH);
}

function Chip({ active, color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "3px 10px", borderRadius: "999px", border: active ? `2px solid ${color || "var(--interactive-accent)"}` : BORDER, cursor: "pointer",
      background: active ? "var(--background-secondary)" : "transparent", color: "var(--text-normal)", fontSize: "0.85em"
    }}>
      {color && <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: color, marginRight: "6px" }} />}
      {children}
    </button>
  );
}

function DayCard({ day, filter }) {
  const items = day.items.filter((it, i, all) => {
    if (filter === "all") return true;
    // 过滤时按一级事项判断，保留它的子项
    let top = i; while (top > 0 && all[top].depth > 0) top--;
    return all[top].theme === filter;
  });
  return (
    <div style={{ border: BORDER, borderRadius: "8px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px", background: "var(--background-secondary)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px", alignItems: "baseline" }}>
        <strong style={{ fontSize: "1.05em" }}>{day.label}</strong>
        {day.badges.map(b => <span style={{ fontSize: "0.8em", color: "var(--text-muted)" }}>{b}</span>)}
      </div>
      {day.summary && <div style={{ fontSize: "0.85em", color: "var(--text-muted)" }}>摘要：{day.summary}</div>}
      {items.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {items.map(it => (
            <div style={{ display: "flex", gap: "8px", alignItems: "baseline", marginLeft: `${it.depth * 18}px` }}>
              <span title={theme(it.theme).name} style={{ flex: "none", width: "8px", height: "8px", borderRadius: "50%", background: theme(it.theme).color, transform: "translateY(-1px)" }} />
              <span>{it.text}</span>
              {it.period && it.depth === 0 && <span style={{ fontSize: "0.75em", color: "var(--text-faint)" }}>{it.period}</span>}
            </div>
          ))}
        </div>
      ) : <div style={{ color: "var(--text-muted)", fontSize: "0.9em" }}>{day.items.length ? "这一天没有该类事项" : "周记里这一天没有记录事项"}</div>}
      {day.ledger.length > 0 && <div style={{ fontSize: "0.8em", color: "var(--text-muted)" }}>记账：{day.ledger.join("；")}</div>}
      {day.reflections.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "0.8em", color: "var(--text-muted)" }}>今日感悟：</span>
          {day.reflections.map(r => <span style={{ fontSize: "0.8em", padding: "1px 8px", border: BORDER, borderRadius: "999px" }}>{r}</span>)}
        </div>
      )}
    </div>
  );
}

return function View() {
  const [data, setData] = dc.useState({ status: "loading" });
  const [tick, setTick] = dc.useState(0);
  const [filter, setFilter] = dc.useState("all");
  const [sel, setSel] = dc.useState("all");

  dc.useEffect(() => {
    let alive = true;
    const file = findFile();
    if (!file) { setData({ status: "error", msg: `找不到周记「${WEEK_LINK}」，它可能被重命名或移动了。` }); return; }
    (async () => {
      try {
        const text = await dc.app.vault.read(file);
        const fm = dc.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
        if (alive) setData({ status: "ok", file, body: parseBody(text), hab: fm.habit_tracker ?? {} });
      } catch (e) { if (alive) setData({ status: "error", msg: `读取周记失败：${e.message || e}` }); }
    })();
    // 周记被编辑后自动刷新
    const ref = dc.app.metadataCache.on("changed", f => { if (f && f.path === file.path) setTick(t => t + 1); });
    return () => { alive = false; dc.app.metadataCache.offref(ref); };
  }, [tick]);

  const view = dc.useMemo(() => {
    if (data.status !== "ok") return null;
    const m = data.file.basename.match(/(\d{1,2})\.(\d{1,2})/);
    const year = new Date(data.file.stat?.ctime ?? Date.now()).getFullYear();
    const start = new Date(year, +m[1] - 1, +m[2]);
    const hab = data.hab;
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const key = `${d.getMonth() + 1}.${d.getDate()}`;
      const b = data.body[key] ?? { items: [], ledger: [], reflections: [] };
      const at = name => hab[name]?.[i];
      const badges = [];
      if (hours(at("study")) !== null) badges.push(`📚 ${hours(at("study"))} 小时`);
      if (at("algorithms") === true) badges.push("💻 算法题");
      if (at("workout") === true) badges.push("🏋️ 健身");
      if (at("ledger") === true) badges.push("🧾 已记账");
      if (filled(at("papers"))) badges.push(`📄 ${String(at("papers")).trim()}`);
      if (filled(at("wake"))) badges.push(`⏰ ${String(at("wake")).trim()}`);
      if (filled(at("sleep"))) badges.push(`🌙 ${String(at("sleep")).trim()}`);
      return { key, label: `${key} ${WEEKDAY[d.getDay()]}`, study: hours(at("study")), summary: filled(at("output")) ? String(at("output")).trim() : "", badges, ...b };
    });
    const study = days.map(d => d.study).filter(x => x !== null);
    const count = name => (hab[name] || []).filter(v => v === true).length;
    const themeCount = Object.fromEntries(THEMES.map(t => [t.key, days.reduce((n, d) => n + d.items.filter(it => it.depth === 0 && it.theme === t.key).length, 0)]));
    return {
      days, themeCount,
      stats: [
        ["有效学习", `${study.reduce((a, b) => a + b, 0)} 小时`, `${study.length} 天有记录`],
        ["算法题", `${count("algorithms")} 天`, "勾选为准"],
        ["记账", `${count("ledger")} 天`, "勾选为准"],
        ["论文", `${(hab.papers || []).filter(filled).length} 篇`, "有篇名才计"],
        ["健身", `${count("workout")} 次`, "勾选为准"],
      ],
      maxStudy: Math.max(8, ...study),
    };
  }, [data]);

  if (data.status === "loading") return <div style={{ color: "var(--text-muted)" }}>正在读取周记…</div>;
  if (data.status === "error") return <div role="alert" style={{ color: "var(--text-error)" }}>{data.msg}</div>;

  const shown = view.days.filter(d => sel === "all" || d.key === sel).filter(d => filter === "all" || d.items.some(it => it.theme === filter));
  return (
    <div style={{ border: BORDER, borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ fontSize: "1.1em" }}>第五周（{view.days[0].key}–{view.days[6].key}）：我做了什么</strong>
        <button onClick={() => dc.app.workspace.openLinkText(data.file.path, dc.currentPath())}>打开周记</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: "8px" }}>
        {view.stats.map(([name, value, note]) => (
          <div style={{ border: BORDER, borderRadius: "8px", padding: "8px 10px", background: "var(--background-secondary)" }}>
            <div style={{ fontSize: "0.8em", color: "var(--text-muted)" }}>{name}</div>
            <div style={{ fontSize: "1.25em", fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>{value}</div>
            <div style={{ fontSize: "0.75em", color: "var(--text-faint)" }}>{note}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: "0.85em", color: "var(--text-muted)", marginBottom: "6px" }}>点某一天只看当天；柱高是当天有效学习小时数（空白表示没有记录，不是 0）</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: "6px" }}>
          {view.days.map(d => {
            const on = sel === d.key;
            return (
              <button onClick={() => setSel(on ? "all" : d.key)} aria-pressed={on} title={d.badges.join(" · ")}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "6px 2px", borderRadius: "8px", cursor: "pointer",
                  border: on ? "2px solid var(--interactive-accent)" : BORDER, background: on ? "var(--background-secondary)" : "transparent", color: "var(--text-normal)" }}>
                <div style={{ height: "34px", width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  {d.study !== null && <div style={{ width: "40%", height: `${Math.max(6, (d.study / view.maxStudy) * 100)}%`, background: "var(--interactive-accent)", borderRadius: "2px 2px 0 0", opacity: 0.8 }} />}
                </div>
                <div style={{ fontSize: "0.8em", fontVariantNumeric: "tabular-nums" }}>{d.key}</div>
                <div style={{ fontSize: "0.7em", color: "var(--text-muted)" }}>{d.label.split(" ")[1]}</div>
                <div style={{ display: "flex", gap: "2px", minHeight: "6px" }}>
                  {THEMES.filter(t => d.items.some(it => it.depth === 0 && it.theme === t.key)).map(t => (
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: t.color }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>全部</Chip>
        {THEMES.filter(t => view.themeCount[t.key] > 0).map(t => (
          <Chip active={filter === t.key} color={t.color} onClick={() => setFilter(filter === t.key ? "all" : t.key)}>{t.name} {view.themeCount[t.key]}</Chip>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {shown.length ? shown.map(d => <DayCard day={d} filter={filter} />) : <div style={{ color: "var(--text-muted)" }}>没有符合条件的记录。</div>}
      </div>

      <div style={{ fontSize: "0.8em", color: "var(--text-muted)", lineHeight: 1.6 }}>
        数据来自周记 <a class="internal-link" data-href={data.file.path} href={data.file.path}>{data.file.basename}</a> 的习惯表（YAML）和每天的正文记录，周记修改后自动刷新。
        只统计已经记录的内容，空白不算 0；事项的颜色归类按关键词自动判断，可能不准，计数只统计一级事项。
      </div>
    </div>
  );
};
