// 模式：在页面里实际运行最小示例（真实计算）
// 适用：正文有最小可运行示例，读者想换参数/随机种子再看结果
// 改写时替换：被演示的算法、数据生成、评价指标；须与已运行验证的脚本结果一致
// 来源：EoH 论文笔记中的组件（已通过 smoke-test.cjs），数据与文案须换成当前笔记中已核对的内容。

const C = 100;
const BORDER = '1px solid var(--background-modifier-border)';
const HEU = [
  ['First Fit', (it, rem, pos) => -pos],
  ['Best Fit', (it, rem) => it - rem],
  ['EoH（论文最终启发式）', (item, bins) => {
    const diff = bins - item, e = Math.exp(diff), sq = Math.sqrt(diff), comb = (1 - diff / bins) * sq;
    return bins / ((e + 0.7) * e) + (diff > item * 3 ? comb + 0.8 : comb + 0.3);
  }]
];
function rng(a) {
  let s = a >>> 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function makeItems(n, seed) {
  const r = rng(seed), a = [];
  for (let i = 0; i < n; i++) a.push(Math.max(1, Math.min(C, Math.round(45 * Math.pow(-Math.log(1 - r()), 1 / 3)))));
  return a;
}
// 与官方评测等价：已开箱子按序号排在前面，再加一个全新的空箱子；只在剩余容量 >= 物品的箱子中取得分最大者（并列取序号小的）。
function pack(items, score) {
  const rem = [];
  for (const it of items) {
    let best = -1, bs = -Infinity;
    for (let i = 0; i <= rem.length; i++) {
      const r = i < rem.length ? rem[i] : C;
      if (r < it) continue;
      const s = score(it, r, i);
      if (s > bs) { bs = s; best = i; }
    }
    if (best === rem.length) rem.push(C - it); else rem[best] -= it;
  }
  return rem.length;
}

return function View() {
  const [draft, setDraft] = dc.useState(2000); // 拖动时只更新数字
  const [n, setN] = dc.useState(2000);          // 松开后才重新计算
  const [seed, setSeed] = dc.useState(7);

  const data = dc.useMemo(() => {
    const items = makeItems(n, seed);
    const lb = Math.ceil(items.reduce((a, b) => a + b, 0) / C);
    const t0 = performance.now();
    const res = HEU.map(([name, f]) => { const used = pack(items, f); return { name, used, gap: ((used - lb) / lb) * 100 }; });
    return { res, lb, ms: Math.round(performance.now() - t0) };
  }, [n, seed]);
  const mx = Math.max(...data.res.map(r => r.gap), 0.01);
  const best = Math.min(...data.res.map(r => r.used));

  return (
    <div style={{ border: BORDER, borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <strong>交互：在浏览器里实际运行三条装箱规则</strong>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span>物品数 {draft}（容量 {C}）</span>
        <input type="range" min={500} max={5000} step={500} value={draft} style={{ width: '220px', maxWidth: '100%' }}
          onInput={e => setDraft(+e.currentTarget.value)} onChange={e => setN(+e.currentTarget.value)} />
        <button onClick={() => setSeed(seed + 101)}>换一组物品</button>
      </div>
      {data.res.map(r => (
        <div title={`用了 ${r.used} 个箱子，比下界多 ${r.used - data.lb} 个`}
          style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,190px) 1fr 70px', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontWeight: r.used === best ? 700 : 400 }}>{r.name}</span>
          <div style={{ height: '14px', background: 'var(--background-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(r.gap / mx) * 100}%`, background: r.used === best ? 'var(--interactive-accent)' : 'var(--text-faint)' }} />
          </div>
          <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.gap.toFixed(2)}%</span>
        </div>
      ))}
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
        条形是相对下界多用的箱子比例，越短越好；悬停可看箱子数。下界取 ⌈物品总大小 / 容量⌉ = {data.lb}。物品为 45×Weibull(3) 取整并截断到 [1, {C}]，种子 {seed}，只用 1 个实例，所以数值会比论文 5 个实例的平均值波动更大。本次计算用时 {data.ms} ms。
      </div>
    </div>
  );
};
