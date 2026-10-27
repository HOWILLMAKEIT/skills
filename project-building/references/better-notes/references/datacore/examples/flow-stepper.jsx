// 模式：流程逐步播放（含循环回路）
// 适用：有明确先后顺序、带循环或分支的算法/协议/流水线
// 改写时替换：STEPS 的名称与说明、ORDER、循环终止条件；回路规则写在 next() 中
// 来源：EoH 论文笔记中的组件（已通过 smoke-test.cjs），数据与文案须换成当前笔记中已核对的内容。

const STEPS = {
  s0: ['Step 0 初始化', '用初始化提示让 LLM 从零写出 N 条启发式，不需要专家提供种子。'],
  p1: ['1.1 选父代', '从当前种群中按排名概率 p_i ∝ 1/(r_i + N) 选出父代，用来构造当前策略的提示：E1、E2 选 p 条，M1–M3 选 1 条。'],
  p2: ['1.2 LLM 生成', '请求 LLM 生成一条新启发式：先用自然语言写出思想，再写出对应的代码实现。'],
  p3: ['1.3 评估', '在评估实例集上运行新启发式的代码，得到适应度。'],
  p4: ['1.4 入种群', '思想和代码都可行才加入当前种群，不可行则丢弃。五种策略各重复 N 次，所以每代最多新增 5N 个个体。'],
  s2: ['Step 2 种群管理', '把新旧个体合并，按适应度保留最好的 N 个，组成下一代种群。']
};
const ORDER = ['s0', 'p1', 'p2', 'p3', 'p4', 's2'];
const MAXGEN = 20;
const BORDER = '1px solid var(--background-modifier-border)';

// 状态转移：Step 2 之后，未到最后一代则回到 1.1 并让代数加 1，否则结束。
const next = s => {
  if (s.done) return s;
  if (ORDER[s.idx] === 's2') return s.gen + 1 >= MAXGEN ? { ...s, done: true } : { idx: 1, gen: s.gen + 1, done: false };
  return { ...s, idx: s.idx + 1 };
};

function Node({ id, active, onPick }) {
  return (
    <button
      onClick={() => onPick(id)}
      style={{
        padding: '8px 12px', borderRadius: '6px', border: BORDER, cursor: 'pointer', textAlign: 'center', lineHeight: 1.4,
        background: active ? 'var(--interactive-accent)' : 'var(--background-secondary)',
        color: active ? 'var(--text-on-accent)' : 'var(--text-normal)'
      }}
    >
      {STEPS[id][0]}
    </button>
  );
}
const Arrow = ({ t = '↓' }) => <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t}</div>;
const Pill = ({ on, children }) => (
  <div style={{
    textAlign: 'center', padding: '4px 10px', borderRadius: '12px', border: BORDER, fontSize: '0.9em',
    background: on ? 'var(--interactive-accent)' : 'transparent', color: on ? 'var(--text-on-accent)' : 'var(--text-normal)'
  }}>{children}</div>
);

return function View() {
  const [st, setSt] = dc.useState({ idx: 0, gen: 0, done: false });
  const [playing, setPlaying] = dc.useState(false);

  dc.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setSt(next), 700);
    return () => clearInterval(t);
  }, [playing]);
  dc.useEffect(() => { if (st.done) setPlaying(false); }, [st.done]);

  const cur = ORDER[st.idx];
  const atS2 = !st.done && cur === 's2';
  const more = st.gen + 1 < MAXGEN;
  const pick = id => { setPlaying(false); setSt({ idx: ORDER.indexOf(id), gen: st.gen, done: false }); };
  const reset = () => { setPlaying(false); setSt({ idx: 0, gen: 0, done: false }); };
  const play = () => {
    if (playing) return setPlaying(false);
    if (st.done) setSt({ idx: 0, gen: 0, done: false });
    setPlaying(true);
  };

  return (
    <div style={{ border: BORDER, borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <strong>交互：EoH 进化循环（点击任一步骤查看说明，或逐步播放）</strong>
      <Node id="s0" active={!st.done && cur === 's0'} onPick={pick} />
      <Arrow />
      <div style={{ border: '1px dashed var(--background-modifier-border-hover)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9em', textAlign: 'center' }}>Step 1 生成：五种策略各重复 N 次，共 5N 次 LLM 调用</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
          {['p1', 'p2', 'p3', 'p4'].map((id, i) => (
            <>
              {i > 0 && <Arrow t="→" />}
              <Node id={id} active={!st.done && cur === id} onPick={pick} />
            </>
          ))}
        </div>
      </div>
      <Arrow />
      <Node id="s2" active={atS2} onPick={pick} />
      <Arrow />
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Pill on={atS2 && more}>未到停止条件 → 回到 Step 1（本例共 {MAXGEN} 代）</Pill>
        <Pill on={(atS2 && !more) || st.done}>到达停止条件 → 输出最后一代种群</Pill>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button disabled={st.done} onClick={() => { setPlaying(false); setSt(next); }}>下一步</button>
        <button onClick={play}>{playing ? '暂停' : '自动播放'}</button>
        <button onClick={reset}>重置</button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>{st.done ? `已结束：共 ${MAXGEN} 代` : `当前第 ${st.gen + 1} 代`}</span>
      </div>
      <div style={{ background: 'var(--background-secondary)', borderRadius: '6px', padding: '10px 12px', minHeight: '3em' }}>
        {st.done ? '输出最后一代种群，其中适应度最优的个体就是设计结果。' : `${STEPS[cur][0]}：${STEPS[cur][1]}`}
      </div>
    </div>
  );
};
