import { h, fxs, confettiAt, toast } from '../lib/ui.js'
import { resolve, clauseKey, showClause, refute, negLit } from '../logic/core.js'

// Interactive resolution board: pick 2 clauses with a clashing literal → resolvent drops in.
// opts: { negFrom: index from which clauses come from ¬G (dashed) }
export function resolutionBoard(clauses0, { negFrom = -1, onWin } = {}) {
  let cls, sel, log, won
  const board = h('div.rboard')
  const msg = h('div.lab-foot')
  const logEl = h('div.rlog')
  const treeBox = h('div.rtree')
  const autoB = h('button.btn.sm.yellow', { type: 'button', onclick: auto }, '▶ 自動で反駁')
  const undoB = h('button.btn.sm', { type: 'button', onclick: undo }, '↶ 戻す')
  const resetB = h('button.btn.sm', { type: 'button', onclick: () => load(clauses0) }, '↺ リセット')
  const el = h('div', h('div.ctrls', { style: { marginBottom: '14px' } }, autoB, undoB, resetB), board, logEl, treeBox, msg)

  function load(c0) {
    clauses0 = c0
    cls = c0.map((c, i) => ({ c: [...new Set(c)], id: i + 1, parents: null, neg: negFrom >= 0 && i >= negFrom }))
    sel = []; log = []; won = false
    render()
  }
  function add(c, parents, on) {
    const k = clauseKey(c)
    if (cls.some((x) => clauseKey(x.c) === k)) { toast('その節はもうあるよ'); return null }
    const n = { c, id: cls.length + 1, parents, on, fresh: true }
    cls.push(n); log.push(n)
    if (!c.length) { won = true; onWin && onWin() }
    return n
  }
  function click(n) {
    if (won) return
    if (sel.includes(n)) sel = sel.filter((x) => x !== n)
    else sel = [...sel, n].slice(-2)
    if (sel.length === 2) {
      const [a, b] = sel
      const rs = resolve(a.c, b.c)
      if (!rs.length) { toast('打ち消し合うリテラル（P と ¬P）がない組だよ'); sel = [b]; render(); return }
      const r = rs.find((x) => !x.taut) || rs[0]
      if (rs.length > 1 && r.taut) toast('この組から出る導出節は P ∨ ¬P を含み役に立たない')
      add(r.res, [a.id, b.id], r.on)
      sel = []
    }
    render()
  }
  function undo() { if (!log.length) return; const n = log.pop(); cls = cls.filter((x) => x !== n); won = false; sel = []; render() }
  function auto() {
    const res = refute(cls.map((x) => x.c))
    if (!res.found) { toast('⊥ は導けない：この節集合は充足可能'); msg.innerHTML = '<b>どの組を導出しても ⊥ に届かない</b> → 導出の完全性より、この節集合は<b>充足可能</b>。'; return }
    // replay new nodes from proof
    const map = new Map(res.nodes.slice(0, cls.length).map((n, i) => [n.id, cls[i].id]))
    const steps = res.proof.filter((n) => n.parents)
    let i = 0
    const tick = () => {
      if (i >= steps.length || won) return
      const n = steps[i++]
      const ex = cls.find((x) => clauseKey(x.c) === clauseKey(n.c))
      if (ex) { map.set(n.id, ex.id); tick(); return }
      const nn = add(n.c, n.parents.map((p) => map.get(p)), n.on)
      if (nn) map.set(n.id, nn.id)
      render(); setTimeout(tick, 650)
    }
    tick()
  }
  function litsHTML(n, clashWith) {
    if (!n.c.length) return '⊥'
    return n.c.map((l) => `<span class="lit ${clashWith && clashWith.c.includes(negLit(l)) ? 'clash' : ''}">${fxs(l)}</span>`).join(' <span class="o o-or">∨</span> ')
  }
  function render() {
    board.innerHTML = ''
    const other = sel.length === 1 ? sel[0] : null
    cls.forEach((n) => {
      const b = h('button.clause', { type: 'button', class: (sel.includes(n) ? 'sel ' : '') + (n.fresh ? 'new ' : '') + (n.neg ? 'from-neg ' : '') + (!n.c.length ? 'empty' : ''), onclick: () => click(n), title: n.neg ? '結論の否定 ¬G から来た節' : '' },
        h('span.num', String(n.id)), h('span.fx', { html: litsHTML(n, other && other !== n ? other : null) }))
      board.append(b)
      n.fresh = false
    })
    logEl.innerHTML = ''
    log.forEach((n) => logEl.append(h('div', h('span.chip', `${n.parents[0]} と ${n.parents[1]}`), `から ${n.on} について導出 →`, h('span', { html: `<span class="fx">${fxs(showClause(n.c))}</span>` }), h('span.chip', `節 ${n.id}`))))
    undoB.disabled = !log.length
    autoB.disabled = won
    drawTree()
    if (won) {
      msg.innerHTML = '<b style="color:var(--top-t)">空節 ⊥ を導出！</b> 導出の健全性より、この節集合は<b>充足不能</b>。'
      requestAnimationFrame(() => { const e = board.querySelector('.clause.empty'); if (e) confettiAt(e) })
    } else if (sel.length === 1) msg.innerHTML = `節 ${sel[0].id} を選択中。<b>打ち消し合うリテラル</b>（ピンク）を持つ節を選ぼう。`
    else msg.innerHTML = '2 つの節をクリック → 打ち消し合う P と ¬P を消して、残りを ∨ でつないだ<b>導出節</b>が追加される。目標は空節 ⊥。'
  }
  // small derivation tree (only when ⊥ found)
  function drawTree() {
    treeBox.innerHTML = ''
    if (!won) return
    const byId = new Map(cls.map((n) => [n.id, n]))
    const go = (id) => {
      const n = byId.get(id)
      const node = h('div.pf-node')
      if (n.parents) { node.append(h('div.pf-prem', ...n.parents.map(go)), h('div.pf-bar', h('span.rl', n.on))) }
      node.append(h('div.pf-seq', { class: !n.c.length ? 'fail' : n.parents ? '' : 'axiom', html: `<span class="fx">${fxs(showClause(n.c))}</span>` }))
      return node
    }
    const empty = cls.find((n) => !n.c.length)
    treeBox.append(h('h5', { style: { margin: '18px 0 0', fontSize: '13px', fontWeight: 900 } }, '導出の木（上が親節、下が導出節）'), h('div.pf-scroll', h('div.pf', go(empty.id))))
  }
  load(clauses0)
  el.load = (c, nf = -1) => { negFrom = nf; load(c) }
  return el
}
