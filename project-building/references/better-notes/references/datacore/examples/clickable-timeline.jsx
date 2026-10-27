// 模式：可点击的过程轨迹（SVG 折线 + 详情）
// 适用：论文图/日志中有按先后排列的若干关键节点，每个节点有说明
// 改写时替换：D 数组（数值、标签、说明、代码）与坐标范围；逐项核对图中配对
// 来源：EoH 论文笔记中的组件（已通过 smoke-test.cjs），数据与文案须换成当前笔记中已核对的内容。

const D = [
  [0.9620, '初始化', '初始种群的最优个体', ''],
  [0.9621, 'M1', '对大箱子加惩罚', '(bins - item) < 0.2*bins.max()'],
  [0.9670, 'E2', '物品大小的立方根与剩余空间的比', 'cbrt(item) / (bins - item)'],
  [0.9689, 'E1', '与平均值的偏差', 'abs(bins - np.mean(bins))'],
  [0.9825, 'E2', '利用率与惩罚的组合', 'cbrt(item) / (bins - item) - (bins - item) < 0.4 * bins.max()'],
  [0.9927, 'E1', '混合项', '1 - (bins - item) / bins * sqrt(bins - item + 1)'],
  [0.9928, 'E1', '指数项', 'exp(-(bins - item)**2)'],
  [0.9929, 'M2', '混合调整项', 'where(diff > (item * 3),\n      (1 - diff / bins) * sqrt(diff + 3) + 0.8,\n      (1 - diff / bins) * sqrt(diff + 0.5) + 0.3)'],
  [0.9932, 'M3', '新的参数设置（图中只给出这个标注）', '最终启发式，见上文第二节']
];
const BORDER = '1px solid var(--background-modifier-border)';
const W = 720, H = 200, L = 50, R = 20, T = 26, B = 24, Y0 = 0.955, Y1 = 0.997;
const X = i => L + (i * (W - L - R)) / (D.length - 1);
const Y = v => T + ((Y1 - v) / (Y1 - Y0)) * (H - T - B);
const muted = { fill: 'var(--text-muted)', fontSize: '11px' };

return function View() {
  const [sel, setSel] = dc.useState(4);
  const path = D.map((p, i) => (i ? ` H${X(i)} V${Y(p[0])}` : `M${X(0)} ${Y(p[0])}`)).join('');
  const p = D[sel];
  const pick = i => setSel(i);

  return (
    <div style={{ border: BORDER, borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <strong>交互：Figure 2 的演化轨迹（点击节点或用按钮切换）</strong>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', minWidth: '520px' }}>
          {[0.96, 0.97, 0.98, 0.99].map(v => (
            <>
              <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} style={{ stroke: 'var(--background-modifier-border)' }} />
              <text x={L - 6} y={Y(v) + 4} text-anchor="end" style={muted}>{v.toFixed(2)}</text>
            </>
          ))}
          <path d={path} fill="none" stroke-width="2" style={{ stroke: 'var(--interactive-accent)' }} />
          {D.map((q, i) => (
            <>
              <circle cx={X(i)} cy={Y(q[0])} r="7" tabindex={0} role="button" aria-label={`${q[1]} ${q[0].toFixed(4)}`}
                onClick={() => pick(i)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(i); } }}
                style={{ cursor: 'pointer', stroke: 'var(--interactive-accent)', strokeWidth: 2, fill: i === sel ? 'var(--interactive-accent)' : 'var(--background-primary)' }} />
              <text x={X(i)} y={Y(q[0]) - 12} text-anchor="middle" style={muted}>{q[0].toFixed(4)}</text>
              <text x={X(i)} y={H - 6} text-anchor="middle" style={muted}>{q[1]}</text>
            </>
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button disabled={sel === 0} onClick={() => setSel(sel - 1)}>上一步</button>
        <button disabled={sel === D.length - 1} onClick={() => setSel(sel + 1)}>下一步</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--background-secondary)', borderRadius: '6px', padding: '10px 12px' }}>
        <div>适应度 {p[0].toFixed(4)}　策略 {p[1]}　（第 {sel + 1} / {D.length} 个节点）</div>
        <div>思想：{p[2]}</div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.85em' }}>{p[3] || '—'}</pre>
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>横轴是先后次序，不是代数；节点数值与标签按图上位置配对，精确对应以原图为准。</div>
    </div>
  );
};
