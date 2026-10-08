// 模式：并列方案对比，点选一条查看说明
// 适用：比较 2–4 种做法的流程差异，且各自能用一句话说明
// 改写时替换：LANES 里的名称、节点序列、说明文字；说明必须能在来源中找到出处
// 来源：EoH 论文笔记中的组件（已通过 smoke-test.cjs），数据与文案须换成当前笔记中已核对的内容。

const BORDER = '1px solid var(--background-modifier-border)';
// kind: t = 思想，c = 代码，其余为普通步骤
const LANES = [
  {
    name: '人工设计',
    nodes: [['已有启发式'], ['专家推理'], ['新思想', 't']],
    text: '启发式设计通常依赖人类专家，在思想层面上推理（论文 Figure 1(a)）。人工设计、修改和配置一条启发式很耗人力，需要丰富的专家经验。'
  },
  {
    name: 'FunSearch',
    nodes: [['已有代码'], ['LLM 改写'], ['新代码', 'c']],
    text: '把启发式看作程序，只在代码空间里进化，不显式使用提示策略，也没有思想这一层（论文 Figure 1(b)、§3.1）。论文称它通常要生成数百万个程序（即对 LLM 的查询）才能找到好的启发式。'
  },
  {
    name: 'EoH',
    nodes: [['已有 思想+代码'], ['LLM（提示策略）'], ['新思想', 't'], ['LLM'], ['新代码', 'c']],
    text: '同时进化思想和代码（论文 Figure 1(c)）：LLM 先按提示策略写出新思想，再把思想翻译成代码。父代的思想和代码一起放进提示，五种提示策略（E1、E2、M1、M2、M3）决定 LLM 做哪种推理。'
  }
];
const KIND = {
  t: { background: '#fbefd8', border: '1px solid #9a5200', color: '#5a3000', fontWeight: 700 },
  c: { background: '#e7ecfb', border: '1px solid #2748a8', color: '#102060', fontWeight: 700 }
};

function Lane({ lane, active, onPick }) {
  return (
    <div role="button" tabindex={0} onClick={onPick} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(); } }}
      style={{ cursor: 'pointer', border: active ? '2px solid var(--interactive-accent)' : BORDER, borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--background-primary)' }}>
      <div style={{ fontWeight: 700 }}>{lane.name}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {lane.nodes.map(([label, kind], i) => (
          <>
            {i > 0 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
            <span style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--background-secondary)', border: BORDER, ...(kind ? KIND[kind] : {}) }}>{label}</span>
          </>
        ))}
      </div>
    </div>
  );
}

return function View() {
  const [sel, setSel] = dc.useState(2);
  return (
    <div style={{ border: BORDER, borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <strong>交互：三种设计启发式的做法（点击查看说明）</strong>
      {LANES.map((l, i) => <Lane lane={l} active={i === sel} onPick={() => setSel(i)} />)}
      <div style={{ display: 'flex', gap: '14px', fontSize: '0.85em', color: 'var(--text-muted)' }}>
        <span><span style={{ ...KIND.t, padding: '0 6px', borderRadius: '4px' }}>思想</span> 自然语言描述</span>
        <span><span style={{ ...KIND.c, padding: '0 6px', borderRadius: '4px' }}>代码</span> 可执行实现</span>
      </div>
      <div style={{ background: 'var(--background-secondary)', borderRadius: '6px', padding: '10px 12px' }}>
        <strong>{LANES[sel].name}：</strong>{LANES[sel].text}
      </div>
    </div>
  );
};
