// 模式：单参数滑块，实时显示公式结果
// 适用：一个公式或超参数对结果的影响需要直观感受
// 改写时替换：滑块范围、公式（useMemo 内）、说明文字；公式须与正文一致
// 来源：EoH 论文笔记中的组件（已通过 smoke-test.cjs），数据与文案须换成当前笔记中已核对的内容。

const BORDER = '1px solid var(--background-modifier-border)';

return function View() {
  const [N, setN] = dc.useState(20);
  // 第 i 名的权重 1/(i + N)，归一化后即被选为父代的概率
  const probs = dc.useMemo(() => {
    const w = Array.from({ length: N }, (_, i) => 1 / (i + 1 + N));
    const s = w.reduce((a, b) => a + b, 0);
    return w.map(x => x / s);
  }, [N]);
  const first = probs[0], last = probs[N - 1];

  return (
    <div style={{ border: BORDER, borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <strong>交互：父代选择概率 p_i ∝ 1/(r_i + N)</strong>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span>种群大小 N = {N}</span>
        <input type="range" min={4} max={40} value={N} style={{ width: '240px', maxWidth: '100%' }}
          onInput={e => setN(+e.currentTarget.value)} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '110px' }}>
        {probs.map((p, i) => (
          <div title={`第 ${i + 1} 名：${(p * 100).toFixed(1)}%`}
            style={{ flex: 1, minWidth: '3px', borderRadius: '2px 2px 0 0', background: 'var(--interactive-accent)', opacity: 0.8, height: `${(p / first) * 100}%` }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8em' }}>
        <span>名次 1（最好）</span><span>名次 N（最差）</span>
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>
        第 1 名 {(first * 100).toFixed(1)}%，最后一名 {(last * 100).toFixed(1)}%，相差 {(first / last).toFixed(2)} 倍。柱高按第 1 名归一化；鼠标悬停可看每个名次的概率。
      </div>
    </div>
  );
};
