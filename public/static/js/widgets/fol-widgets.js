// 1 階述語論理（第7〜9回）用のウィジェット
//   folResBoard     : 1 階の導出ボード（単一化つき）
//   folProofBuilder : 1 階の LK 証明図ビルダー（∀∃・変数条件・contraction・自動証明）
//   folStaticTree   : 静的な証明図
//   modelHTML       : 小さな解釈の表示
import { h, esc, confettiAt, toast } from '../lib/ui.js'
import { folHTML, termHTML, showTerm, parseTerm } from '../logic/fol.js'
import { clauseKey, resolvents, refuteFol, decompF, contractF, proveFol, candidateTerms, freshVar, seqFree, isAtomF, isInitialF, ruleLabel } from '../logic/fol-proof.js'
import { tuples } from '../logic/fol.js'

export const ANIMALS = ['🐰', '🐱', '🐻', '🐸']
const el = (u) => `<span class="dm-e">${ANIMALS[u]}</span>`
export const litHTML = (l) => (l.neg ? '<span class="o o-not">¬</span>' : '') + folHTML(l.a)
export const clauseHTML = (c) => (c.length ? c.map(litHTML).join(' <span class="o o-or">∨</span> ') : '<span class="c-bot">⊥</span>')
export const subHTML = (s) => { const e = Object.entries(s); return e.length ? `{ ${e.map(([v, t]) => `<span class="vr">${esc(v)}</span> := ${termHTML(t)}`).join(', ')} }` : '{ }' }
export const seqHTML = (s) => `${s.L.map((f) => folHTML(f)).join(', ')}${s.L.length ? ' ' : ''}<span class="arrow">→</span>${s.R.length ? ' ' : ''}${s.R.map((f) => folHTML(f)).join(', ')}`

export function modelHTML({ I, J, n }) {
  const parts = [`D = {${[...Array(n).keys()].map(el).join(', ')}}`]
  Object.entries(I.c).forEach(([c, u]) => parts.push(`I(${esc(c)}) = ${el(u)}`))
  Object.entries(I.tables).forEach(([name, t]) => {
    if (t.fn) parts.push(`I(${esc(name)}): ${tuples(n, t.k).map((a, i) => `${a.map(el).join('')}↦${el(t.tab[i])}`).join(' ')}`)
    else if (t.k === 0) parts.push(`I(${esc(name)}) = ${t.tab[0] ? '⊤' : '⊥'}`)
    else { const yes = tuples(n, t.k).filter((_, i) => t.tab[i]); parts.push(`${esc(name)} が ⊤：${yes.length ? yes.map((a) => (t.k > 1 ? `(${a.map(el).join(',')})` : el(a[0]))).join(' ') : 'なし'}`) }
  })
  Object.entries(J).forEach(([x, u]) => parts.push(`J(${esc(x)}) = ${el(u)}`))
  return parts.join('<br>')
}

// ============================================================
//  1 階の導出ボード
// ============================================================
export function folResBoard(clauses0, { negFrom = -1, onWin } = {}) {
  let cls, sel, log, won
  const board = h('div.rboard.fol-rb'), info = h('div.fr-info'), logEl = h('div.rlog'), msg = h('div.lab-foot')
  const autoB = h('button.btn.sm.yellow', { type: 'button', onclick: auto }, '▶ 自動で反駁')
  const undoB = h('button.btn.sm', { type: 'button', onclick: undo }, '↶ 戻す')
  const resetB = h('button.btn.sm', { type: 'button', onclick: () => load(clauses0) }, '↺ リセット')
  const el = h('div', h('div.ctrls', { style: { marginBottom: '14px' } }, autoB, undoB, resetB), board, info, logEl, msg)
  function load(c0) {
    clauses0 = c0
    const keys = new Set()
    cls = []
    c0.forEach((c, i) => { const k = clauseKey(c); if (keys.has(k)) return; keys.add(k); cls.push({ c, id: cls.length + 1, parents: null, neg: negFrom >= 0 && i >= negFrom }) })
    sel = []; log = []; won = false; info.innerHTML = ''; msg.innerHTML = ''
    if (cls.some((x) => !x.c.length)) { won = true; msg.innerHTML = '最初から空節 ⊥ を含んでいます。' }
    render()
  }
  function add(c, parents, extra = {}) {
    const k = clauseKey(c)
    if (cls.some((x) => clauseKey(x.c) === k)) return null
    const n = { c, id: cls.length + 1, parents, ...extra, fresh: true }
    cls.push(n); log.push(n)
    if (!c.length) { won = true; msg.innerHTML = '<b style="color:var(--top-t)">空節 ⊥ が導けた！</b> → 導出の健全性より、この節集合は<b>充足不能</b>。'; confettiAt(board); toast('⊥ が出た！'); onWin && onWin() }
    return n
  }
  function explain(a, b, r, added) {
    const ren = Object.entries(r.ren || {})
    return h('div.fr-exp', { html: `
      <div class="fr-row"><span class="k">親節</span><span class="fx fol">${clauseHTML(a.c)}</span><span class="fr-and">と</span><span class="fx fol">${clauseHTML(b.c)}</span></div>
      ${ren.length ? `<div class="fr-row"><span class="k">① 変数をつけかえ</span><span>共通の変数をなくす：${ren.map(([v, t]) => `<span class="vr">${esc(v)}</span> → <span class="vr">${esc(showTerm(t))}</span>`).join(', ')}（節 ${b.id} 側）</span></div>` : ''}
      <div class="fr-row"><span class="k">${ren.length ? '②' : '①'} 単一化</span><span class="fx">${esc(r.on[0])}</span> と <span class="fx">${esc(r.on[1].replace(/^¬/, ''))}</span>（符号は逆）の mgu σ = <span class="fx fol">${subHTML(r.mgu)}</span></div>
      <div class="fr-row res"><span class="k">${ren.length ? '③' : '②'} 導出節 Cσ ∨ Dσ</span><span class="fx fol">${clauseHTML(r.res)}</span>${added ? `<span class="chip">節 ${added.id}</span>` : '<span class="chip">既出</span>'}</div>` })
  }
  function click(n) {
    if (won) return
    if (sel.includes(n)) sel = sel.filter((x) => x !== n)
    else sel = [...sel, n].slice(-2)
    if (sel.length === 2) {
      const [a, b] = sel
      const rs = resolvents(a.c, b.c).filter((r) => !r.taut)
      if (!rs.length) { toast('符号が逆で単一化できるリテラルの組がない'); info.innerHTML = `<p class="fr-none">節 ${a.id} と節 ${b.id} には、<b>符号が逆で単一化できる</b>リテラルの組がありません（述語記号が違う／単一化に失敗）。</p>`; sel = [b]; render(); return }
      let added = null, r0 = rs[0]
      for (const r of rs) { added = add(r.res, [a.id, b.id], { mgu: r.mgu, on: r.on }); if (added) { r0 = r; break } }
      if (!added) toast('その導出節はもうある')
      info.innerHTML = ''; info.append(explain(a, b, r0, added))
      sel = []
    }
    render()
  }
  function undo() { if (!log.length) return; const n = log.pop(); cls = cls.filter((x) => x !== n); won = false; sel = []; msg.innerHTML = ''; render() }
  function auto() {
    if (won) return
    const res = refuteFol(cls.map((x) => x.c))
    if (!res.found) { msg.innerHTML = res.saturated ? '<b>これ以上新しい節が出ない（飽和）。</b> 空節は導けない → この節集合は<b>充足可能</b>。' : '<b>探索の上限まで導出したけど ⊥ は出なかった。</b> 充足可能か、もっと長い反駁が必要（1 階述語論理の導出は、充足可能なとき止まらないことがある）。'; return }
    const map = new Map(cls.map((x, i) => [i + 1, x.id]))
    const steps = res.proof.filter((n) => n.parents)
    let i = 0
    const tick = () => {
      if (i >= steps.length || won) return
      const n = steps[i++]
      const ex = cls.find((x) => clauseKey(x.c) === clauseKey(n.c))
      if (ex) { map.set(n.id, ex.id); tick(); return }
      const nn = add(n.c, n.parents.map((p) => map.get(p)), { mgu: n.mgu, on: n.on })
      if (nn) map.set(n.id, nn.id)
      render(); setTimeout(tick, 650)
    }
    tick()
  }
  function render() {
    board.innerHTML = ''
    const other = sel.length === 1 ? sel[0] : null
    cls.forEach((n) => {
      const lits = n.c.length ? n.c.map((l) => `<span class="lit ${other && other !== n && other.c.some((m) => m.neg !== l.neg && m.a.n === l.a.n) ? 'clash' : ''}">${litHTML(l)}</span>`).join(' <span class="o o-or">∨</span> ') : '⊥'
      board.append(h('button.clause', { type: 'button', class: (sel.includes(n) ? 'sel ' : '') + (n.fresh ? 'new ' : '') + (n.neg ? 'from-neg ' : '') + (!n.c.length ? 'empty' : ''), onclick: () => click(n), title: n.neg ? '結論の否定から来た節' : '' }, h('span.num', String(n.id)), h('span.fx.fol', { html: lits })))
      n.fresh = false
    })
    logEl.innerHTML = ''
    log.forEach((n) => logEl.append(h('div', h('span.chip', `${n.parents[0]} と ${n.parents[1]}`), h('span', { html: `σ = <span class="fx fol">${subHTML(n.mgu || {})}</span> →` }), h('span.fx.fol', { html: clauseHTML(n.c) }), h('span.chip', `節 ${n.id}`))))
    undoB.disabled = !log.length
    if (!won && !msg.innerHTML) msg.textContent = '節を 2 つクリックすると、単一化して導出節を作ります。'
  }
  load(clauses0)
  el.load = load
  return el
}

// ============================================================
//  1 階の LK 証明図
// ============================================================
export function folStaticTree(t) {
  const node = (n) => {
    const w = h('div.pf-node')
    if (n.kids && n.kids.length) w.append(h('div.pf-prem', ...n.kids.map(node)), h('div.pf-bar', h('span.rl', { class: n.bad ? 'bad' : '' }, (n.bad ? '✗ ' : '') + ruleLabel(n))))
    else if (n.status === 'axiom' || isInitialF(n.seq)) w.append(h('div.pf-mark.ok', '✓ 初期'))
    w.append(h('div.pf-seq.fx.fol', { class: (!n.kids || !n.kids.length) ? (isInitialF(n.seq) ? 'axiom' : 'fail') : '', html: seqHTML(n.seq) }))
    return w
  }
  return h('div.pf', node(t))
}
export function collectFormulas(t, out = new Map()) {
  ;[...t.seq.L, ...t.seq.R].forEach((f) => out.set(folHTML(f), f))
  ;(t.kids || []).forEach((k) => collectFormulas(k, out))
  return out
}

export function folProofBuilder(seq0, { onDone } = {}) {
  let root, history = [], cur = seq0
  const scroll = h('div.pf-scroll'), status = h('div.lab-foot'), chooser = h('div.fpb-choose')
  const autoB = h('button.btn.sm.yellow', { type: 'button', onclick: autoAll }, '▶ 残りを自動証明')
  const undoB = h('button.btn.sm', { type: 'button', onclick: undo }, '↶ 1手戻す')
  const resetB = h('button.btn.sm', { type: 'button', onclick: () => load(cur) }, '↺ リセット')
  const legend = h('div.pf-legend', { html: '<span><i style="background:#fff3c2;border-style:dashed"></i>未処理（式をクリック）</span><span><i style="background:#d3f6e6"></i>初期シーケント ✓</span><span><i style="background:#ffe1e8"></i>行き止まり</span><span><i style="background:#ffe4da"></i>∀∃ はクリック後に t / z を選ぶ</span>' })
  const el = h('div', h('div.ctrls', { style: { marginBottom: '6px' } }, autoB, undoB, resetB), legend, chooser, scroll, status)
  const mk = (seq) => { const n = { seq, kids: null }; settle(n); return n }
  function settle(n) { if ([...n.seq.L, ...n.seq.R].every(isAtomF)) n.status = isInitialF(n.seq) ? 'axiom' : 'fail'; else n.status = 'open' }
  function load(seq) { cur = seq; root = mk(seq); history = []; chooser.innerHTML = ''; render() }
  const leaves = (n = root, out = []) => { if (!n.kids) out.push(n); else n.kids.forEach((k) => leaves(k, out)); return out }
  function apply(n, side, i, opt = {}, contract = false) {
    let target = n, idx = i
    if (contract) {
      const c = contractF(n.seq, side, i)
      const mid = mk(c.premises[0])
      const d = decompF(mid.seq, side, c.copy, opt)
      if (!d || d.need) return
      if (d.err) { chooserErr(d.err); return }
      history.push(n)
      n.rule = c.rule; n.kids = [mid]; n.status = 'done'
      mid.rule = d.rule; mid.t = d.t; mid.z = d.z; mid.kids = d.premises.map(mk); mid.status = 'done'
      chooser.innerHTML = ''; render(); return
    }
    const d = decompF(target.seq, side, idx, opt)
    if (!d) return
    if (d.need) { openChooser(n, side, i, d.need); return }
    if (d.err) { chooserErr(d.err); return }
    history.push(n)
    n.rule = d.rule; n.t = d.t; n.z = d.z; n.kids = d.premises.map(mk); n.status = 'done'
    chooser.innerHTML = ''; render()
  }
  function chooserErr(m) {
    let e = chooser.querySelector('.fpb-err')
    if (!e) { e = h('div.fpb-err'); chooser.append(e) }
    e.innerHTML = `✗ ${esc(m)}`
    e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake')
    toast('その選び方はできない')
  }
  function openChooser(n, side, i, need) {
    const f = n.seq[side][i]
    const rule = (f.t === 'all' ? '∀' : '∃') + (side === 'L' ? '左' : '右')
    chooser.innerHTML = ''
    const head = h('div.fpb-h', { html: `<b>${rule}</b>　<span class="fx fol">${folHTML(f)}</span> をほどく：` })
    const row = h('div.fpb-opts')
    const input = h('input.sub-t', { type: 'text', placeholder: need === 't' ? '項（例: a, f(x)）' : '変数（例: z）', 'aria-label': need === 't' ? '項 t' : '変数 z' })
    let con = null
    if (need === 't') {
      head.append(h('span.fpb-note', { html: '「すべての x で成り立つ」（∀左）／「ある x で成り立つ」を示す（∃右）ので、<b>どんな項 t でもよい</b>。証明に役立つ t を選ぶのがコツ。' }))
      const cands = candidateTerms(n.seq)
      ;(cands.length ? cands : [{ t: 'var', n: freshVar(n.seq, f) }]).forEach((t) => row.append(h('button', { type: 'button', html: termHTML(t), onclick: () => apply(n, side, i, { t }, con.checked) })))
      con = h('input', { type: 'checkbox', id: 'fpb-con' })
      row.append(input, h('button.btn.sm', { type: 'button', onclick: () => { try { apply(n, side, i, { t: parseTerm(input.value) }, con.checked) } catch { chooserErr('項として読めません') } } }, '決定'))
      chooser.append(head, row, h('label.fpb-con', con, h('span', { html: ' <b>contraction</b> で元の式も残す（あとで別の t でもう一度使うとき）' })))
    } else {
      head.append(h('span.fpb-note', { html: '「任意の x で」を示す（∀右）／「ある x」を仮定に使う（∃左）ので、<b>下式に自由に出現しない新しい変数 z</b> を使う（変数条件）。' }))
      const good = freshVar(n.seq, f)
      row.append(h('button.good', { type: 'button', html: `<span class="vr">${esc(good)}</span> <small>おすすめ</small>`, onclick: () => apply(n, side, i, { z: good }) }))
      ;[...seqFree(n.seq)].filter((v) => v !== good).forEach((v) => row.append(h('button.bad', { type: 'button', html: `<span class="vr">${esc(v)}</span> <small>下式に自由に出現</small>`, onclick: () => apply(n, side, i, { z: v }) })))
      row.append(input, h('button.btn.sm', { type: 'button', onclick: () => { const v = input.value.trim(); if (!/^[u-z][a-z0-9_]*$/.test(v)) { chooserErr('変数は u〜z で始まる小文字で書きます'); return } apply(n, side, i, { z: v }) } }, '決定'))
      chooser.append(head, row)
    }
    chooser.append(h('button.fpb-x', { type: 'button', 'aria-label': '閉じる', onclick: () => { chooser.innerHTML = '' } }, '×'))
  }
  function undo() {
    const n = history.pop()
    if (!n) return
    n.kids = null; n.rule = null; n.t = null; n.z = null; settle(n); chooser.innerHTML = ''
    render()
  }
  function graft(leaf, r) {
    leaf.rule = r.rule; leaf.t = r.t; leaf.z = r.z
    if (r.kids && r.kids.length) { leaf.status = 'done'; leaf.kids = r.kids.map((k) => { const m = { seq: k.seq, kids: null }; settle(m); graft(m, k); return m }) }
    else { leaf.kids = null; settle(leaf) }
  }
  function autoAll() {
    const open = leaves().filter((l) => l.status === 'open')
    if (!open.length) return
    let ok = 0
    open.forEach((l) => { const r = proveFol(l.seq); if (r) { history.push(l); graft(l, r); ok++ } })
    chooser.innerHTML = ''
    if (ok < open.length) toast('自動では見つからない枝がある（恒真でないか、探索の上限）')
    render()
  }
  function seqEl(n) {
    const box = h('div.pf-seq.fx.fol', { class: n.status === 'open' ? 'open' : n.status === 'axiom' ? 'axiom' : n.status === 'fail' ? 'fail' : '' })
    const part = (side, xs) => xs.forEach((f, i) => {
      if (i) box.append(', ')
      const cx = !isAtomF(f)
      const sp = h('span.fm', { class: cx ? 'cx' + (f.t === 'all' || f.t === 'ex' ? ' qf' : '') : '', html: folHTML(f), title: cx && n.status === 'open' ? 'クリックで分解' : '' })
      if (cx && n.status === 'open') sp.addEventListener('click', () => apply(n, side, i))
      box.append(sp)
    })
    part('L', n.seq.L)
    box.append(h('span.arrow', { html: (n.seq.L.length ? '&nbsp;' : '') + '→' + (n.seq.R.length ? '&nbsp;' : '') }))
    part('R', n.seq.R)
    return box
  }
  function nodeEl(n) {
    const w = h('div.pf-node')
    if (n.kids) w.append(h('div.pf-prem', ...n.kids.map(nodeEl)), h('div.pf-bar', h('span.rl', ruleLabel(n))))
    else if (n.status === 'axiom') w.append(h('div.pf-mark.ok', '✓ 初期'))
    else if (n.status === 'fail') w.append(h('div.pf-mark.ng', '✗ 行き止まり'))
    w.append(seqEl(n))
    return w
  }
  function render() {
    scroll.innerHTML = ''
    scroll.append(h('div.pf', nodeEl(root)))
    requestAnimationFrame(() => { scroll.scrollLeft = (scroll.scrollWidth - scroll.clientWidth) / 2 })
    const ls = leaves(), open = ls.filter((l) => l.status === 'open').length, fail = ls.filter((l) => l.status === 'fail').length
    undoB.disabled = !history.length; autoB.disabled = !open
    status.innerHTML = ''
    if (open) status.append(`あと ${open} 個の未処理シーケント。論理記号・量化記号を含む式をクリックして、規則を下から上へ使おう。`)
    else if (fail) status.append(h('span', { html: `<b style="color:var(--bot-t)">行き止まりの葉が ${fail} 個。</b> 原子論理式だけになったのに左右に同じ式がない。1 階述語論理では「<b>t の選び方</b>が悪かった」「<b>contraction</b> が必要だった」だけかもしれない → ↶ で戻って試そう。` }))
    else { status.append(h('span', { html: `<b style="color:var(--top-t)">証明完成！</b> すべての葉が初期シーケント → LK で証明可能（健全性より恒真）。使った規則：${history.length ? countRules(root) : 0} 回` })); if (history.length) { confettiAt(scroll); toast('Q.E.D. ⊤') } onDone && onDone(root) }
  }
  const countRules = (n) => (n.kids ? 1 + n.kids.reduce((s, k) => s + countRules(k), 0) : 0)
  load(seq0)
  el.load = load
  el.tree = () => root
  return el
}
