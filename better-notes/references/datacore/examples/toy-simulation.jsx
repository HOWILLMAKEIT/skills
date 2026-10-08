// 模式：玩具模拟：随机数演示机制，不代表真实实验
// 适用：想让读者看到"一轮流程如何改变状态"，且没有真实数据可用
// 改写时替换：init()/stepSim() 的机制；必须保留"示意，参数是自拟的"声明
// 来源：EoH 论文笔记中的组件（已通过 smoke-test.cjs），数据与文案须换成当前笔记中已核对的内容。

// 玩具模拟：适应度由随机数生成，只演示"选父代 → 生成 → 合并 → 留前 N"的流程，不是真实 LLM 或真实实验。
const N = 10, P = 5, TOP = 0.9935, FAIL = 0.12;
const STR = ['E1', 'E2', 'M1', 'M2', 'M3'];
const DELTA = { E1: [-0.004, 0.012], E2: [-0.001, 0.008], M1: [0, 0.004], M2: [0.0003, 0.002], M3: [-0.0003, 0.0015] };
const BORDER = '1px solid var(--background-modifier-border)';
const gauss = () => { let s = 0; for (let i = 0; i < 6; i++) s += Math.random(); return (s - 3) / 0.707; };
const fmt = f => f.toFixed(4).slice(2);
const mean = pop => pop.reduce((a, b) => a + b.f, 0) / pop.length;

// 按 p_i ∝ 1/(r_i + N) 不放回抽取 m 个父代的名次下标
function sample(m) {
  const idx = [...Array(N).keys()], out = [];
  for (let j = 0; j < m; j++) {
    const w = idx.map(i => 1 / (i + 1 + N));
    let r = Math.random() * w.reduce((a, b) => a + b, 0), c = 0;
    while (c < idx.length - 1 && (r -= w[c]) > 0) c++;
    out.push(idx.splice(c, 1)[0]);
  }
  return out;
}
function init() {
  const pop = Array.from({ length: N }, () => ({ f: 0.948 + Math.random() * 0.014, g: 0, s: '初' })).sort((a, b) => b.f - a.f);
  return { pop, gen: 0, hist: [{ best: pop[0].f, mean: mean(pop) }], report: null };
}
function stepSim(sim) {
  const { pop, gen } = sim, kids = [], report = [];
  for (const s of STR) {
    let ok = 0, best = -1;
    for (let k = 0; k < N; k++) {
      if (Math.random() < FAIL) continue; // 代码或思想不可行，丢弃
      const parents = sample(s[0] === 'E' ? P : 1).map(i => pop[i].f);
      const base = s === 'E1' ? parents.reduce((a, b) => a + b, 0) / parents.length : Math.max(...parents);
      let d = (DELTA[s][0] + DELTA[s][1] * gauss()) * 0.4;
      if (d > 0) d *= Math.max(0, (TOP - base) / 0.035);
      const f = Math.min(TOP, Math.max(0.9, base + d));
      kids.push({ f, g: gen + 1, s }); ok++; best = Math.max(best, f);
    }
    report.push({ s, ok, best });
  }
  const next = [...pop, ...kids].sort((a, b) => b.f - a.f).slice(0, N);
  for (const r of report) r.kept = next.filter(p => p.s === r.s && p.g === gen + 1).length;
  return { pop: next, gen: gen + 1, hist: [...sim.hist, { best: next[0].f, mean: mean(next) }], report };
}

function Chart({ hist }) {
  const W = 360, H = 90, L = 4, y0 = 0.94, y1 = 0.9945;
  const X = i => L + (hist.length > 1 ? (i * (W - 2 * L)) / (hist.length - 1) : 0);
  const Y = v => 6 + ((y1 - v) / (y1 - y0)) * (H - 12);
  const pts = key => hist.map((x, i) => `${X(i)},${Y(x[key])}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: '420px', height: 'auto' }}>
      <polyline points={pts('mean')} fill="none" stroke-width="2" style={{ stroke: 'var(--text-muted)' }} />
      <polyline points={pts('best')} fill="none" stroke-width="2" style={{ stroke: 'var(--interactive-accent)' }} />
    </svg>
  );
}

return function View() {
  const [sim, setSim] = dc.useState(init);
  const { pop, gen, hist, report } = sim;
  return (
    <div style={{ border: BORDER, borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <strong>交互：一代进化的流程（玩具模拟）</strong>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={() => setSim(stepSim)}>运行一代（5N = 50 次调用）</button>
        <button onClick={() => setSim(init())}>重置</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,minmax(0,1fr))', gap: '6px' }}>
        {pop.map((p, i) => {
          const fresh = gen > 0 && p.g === gen;
          return (
            <div title={`第 ${i + 1} 名，适应度 ${p.f.toFixed(4)}`}
              style={{ border: fresh ? '2px solid var(--interactive-accent)' : BORDER, borderRadius: '6px', padding: '4px 2px', textAlign: 'center', background: 'var(--background-secondary)', fontSize: '0.8em' }}>
              <div style={{ fontWeight: 600 }}>{fresh ? p.s : p.g === 0 ? '初' : '旧'}</div>
              <div style={{ color: 'var(--text-muted)' }}>{fmt(p.f)}</div>
            </div>
          );
        })}
      </div>
      {report ? (
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9em', marginBottom: '4px' }}>
            第 {gen} 代：合并 {N} 个旧个体与新个体，保留前 {N} 名。粗边框的是本代新进入种群的个体。
          </div>
          <table style={{ width: '100%', fontSize: '0.9em' }}>
            <thead><tr><th>策略</th><th>可行子代</th><th>子代最优</th><th>进入新种群</th></tr></thead>
            <tbody>
              {report.map(r => (
                <tr><td>{r.s}</td><td>{r.ok} / {N}</td><td>{r.ok ? fmt(r.best) : '—'}</td><td>{r.kept}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>当前是初始种群（标"初"），按适应度从高到低排列。点按钮运行一代。</div>
      )}
      <div>
        <Chart hist={hist} />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>折线：种群最优（强调色）与种群均值（灰色），共 {gen} 代；当前最优 {hist[hist.length - 1].best.toFixed(4)}</div>
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
        示意：N = 10，p = 5；适应度（越大越好，上限 0.9935）由随机数生成，各策略的提升幅度和 12% 的不可行概率是我设定的，不来自论文。父代按 p_i ∝ 1/(r_i + N) 不放回抽取（论文未说明是否放回）。
      </div>
    </div>
  );
};
