import { h, fxs, confettiAt, toast } from '../lib/ui.js'
import { show, isAtomic, isInitial, decompose, firstCompound, fmtI, parseSequent } from '../logic/core.js'

// Interactive Gentzen-style proof builder (Wang's algorithm, LK rules used backwards).
// Root sequent at the bottom; click a compound formula in an open (dashed) sequent to break it.
export function proofBuilder(seq0, { onDone, onStep, compact = false } = {}) {
  let root, history = [], lastNew = null
  const scroll = h('div.pf-scroll')
  const status = h('div.lab-foot')
  const undoB = h('button.btn.sm', { type: 'button', onclick: undo }, '↶ 1手戻す')
  const autoB = h('button.btn.sm.yellow', { type: 'button', onclick: autoStep }, '▶ Wang に 1 手まかせる')
  const allB = h('button.btn.sm', { type: 'button', onclick: autoAll }, '▶▶ 最後まで')
  const resetB = h('button.btn.sm', { type: 'button', onclick: () => load(cur) }, '↺ リセット')
  const bar = h('div.ctrls', { style: { marginBottom: '6px' } }, autoB, allB, undoB, resetB)
  const legend = h('div.pf-legend', { html: '<span><i style="background:#fff3c2;border-style:dashed"></i>未処理（論理記号の下線をクリック）</span><span><i style="background:#d3f6e6"></i>初期シーケント ✓</span><span><i style="background:#ffe1e8"></i>行き止まり ✗</span>' })
  const el = h('div', bar, legend, scroll, status)
  let cur = seq0

  const mk = (seq) => {
    const n = { seq, kids: null, rule: null }
    settle(n)
    return n
  }
  function settle(n) {
    if ([...n.seq.L, ...n.seq.R].every(isAtomic)) n.status = isInitial(n.seq) ? 'axiom' : 'fail'
    else n.status = 'open'
  }
  function load(seq) {
    cur = seq; root = mk(seq); history = []; lastNew = null; render()
  }
  function leaves(n = root, out = []) { if (!n.kids) out.push(n); else n.kids.forEach((k) => leaves(k, out)); return out }
  function apply(n, side, i) {
    const d = decompose(n.seq, side, i)
    if (!d) return
    history.push({ n })
    n.rule = d.rule; n.pick = { side, i }
    n.kids = d.premises.map(mk)
    n.status = 'done'
    lastNew = n
    onStep && onStep(d.rule, n)
    render()
  }
  function undo() {
    const last = history.pop()
    if (!last) return
    last.n.kids = null; last.n.rule = null; settle(last.n); lastNew = null
    render()
  }
  function autoStep() {
    const open = leaves().find((l) => l.status === 'open')
    if (!open) return
    const p = firstCompound(open.seq)
    apply(open, p.side, p.i)
  }
  function autoAll() {
    let g = 0
    const tick = () => {
      const open = leaves().find((l) => l.status === 'open')
      if (!open || g++ > 80) return
      autoStep(); setTimeout(tick, 380)
    }
    tick()
  }
  function seqEl(n) {
    const s = n.seq
    const box = h('div.pf-seq', { class: n.status === 'open' ? 'open' : n.status === 'axiom' ? 'axiom' : n.status === 'fail' ? 'fail' : '' })
    const matchNames = n.status === 'axiom' ? new Set(s.L.filter((a) => s.R.some((b) => b.n === a.n)).map((a) => a.n)) : new Set()
    const part = (side, xs) => xs.forEach((f, i) => {
      if (i) box.append(', ')
      const cx = !isAtomic(f)
      const sp = h('span.fm', { class: (cx ? 'cx' : '') + (matchNames.has(f.n) ? ' match' : ''), html: fxs(show(f)), title: cx && n.status === 'open' ? 'クリックで分解' : '' })
      if (cx && n.status === 'open') sp.addEventListener('click', () => apply(n, side, i))
      box.append(sp)
    })
    part('L', s.L)
    box.append(h('span.arrow', { html: (s.L.length ? '&nbsp;' : '') + '→' + (s.R.length ? '&nbsp;' : '') }))
    part('R', s.R)
    box.classList.add('fx')
    return box
  }
  function nodeEl(n) {
    const wrap = h('div.pf-node', { class: n === lastNew ? 'new' : '' })
    if (n.kids) {
      const prem = h('div.pf-prem')
      if (n.kids.length) n.kids.forEach((k) => prem.append(nodeEl(k)))
      else prem.append(h('div.pf-mark.ok', '（前提なし）'))
      wrap.append(prem, h('div.pf-bar', h('span.rl', n.rule)))
    } else if (n.status === 'axiom') wrap.append(h('div.pf-mark.ok', '✓ 初期'))
    else if (n.status === 'fail') wrap.append(h('div.pf-mark.ng', '✗ 行き止まり'))
    wrap.append(seqEl(n))
    return wrap
  }
  function render() {
    scroll.innerHTML = ''
    const pf = h('div.pf', nodeEl(root))
    scroll.append(pf)
    // keep root visible, centre horizontally if overflowing
    requestAnimationFrame(() => { scroll.scrollLeft = (scroll.scrollWidth - scroll.clientWidth) / 2 })
    const ls = leaves()
    const open = ls.filter((l) => l.status === 'open').length
    const fail = ls.find((l) => l.status === 'fail')
    undoB.disabled = !history.length
    autoB.disabled = allB.disabled = !open
    status.innerHTML = ''
    if (open) status.append(`あと ${open} 個の未処理シーケント。下線の付いた論理式をクリックして、推論規則を逆向きに使おう。`)
    else if (fail) {
      const I = {}
      fail.seq.L.forEach((a) => (I[a.n] = true)); fail.seq.R.forEach((a) => { if (!(a.n in I)) I[a.n] = false })
      status.append(h('span', { html: `<b style="color:var(--bot-t)">トートロジではない。</b> 行き止まり <span class="fx">${fxs(showSeqStr(fail.seq))}</span> から反例: <span class="fx">${fmtI(I) || '（なし）'}</span>（左辺を ⊤・右辺を ⊥ にする解釈）` }))
      onDone && onDone(false, root)
    } else {
      status.append(h('span', { html: `<b style="color:var(--top-t)">証明完成！</b> すべての葉が初期シーケント → このシーケントは<b>トートロジ</b>（LK で証明可能）。使った規則: ${history.length} 回` }))
      if (history.length) { confettiAt(scroll); toast('Q.E.D. ⊤') }
      onDone && onDone(true, root)
    }
  }
  load(seq0)
  el.load = (s) => load(typeof s === 'string' ? parseSequent(s) : s)
  return el
}
function showSeqStr(s) {
  return `${s.L.map((f) => show(f)).join(', ')} → ${s.R.map((f) => show(f)).join(', ')}`
}
