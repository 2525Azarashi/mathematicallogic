import { h, html, fxHTML, tv } from '../lib/ui.js'
import { subformulas, vars, sortVars, interpretations, evaluate, show, classify } from '../logic/core.js'
import { toto } from '../lib/chars.js'

// Truth table with column-by-column reveal (lecture style: rows ⊤⊤, ⊤⊥, ⊥⊤, ⊥⊥)
// opts: { columns: 'all'|'atoms+goal', onRow(I), reveal: boolean }
export function truthTable(fs, { columns = 'all', onRow, selectable = true, extra = [] } = {}) {
  const list = Array.isArray(fs) ? fs : [fs]
  const vs = sortVars(list.reduce((s, f) => vars(f, s), new Set()))
  let cols = []
  if (columns === 'all') {
    const seen = new Set()
    list.forEach((f) => subformulas(f).forEach((g) => { if (g.t === 'var') return; const k = show(g, { full: true }); if (!seen.has(k)) { seen.add(k); cols.push(g) } }))
    // keep goals last in given order
    const goalKeys = list.map((f) => show(f, { full: true }))
    cols = cols.filter((c) => !goalKeys.includes(show(c, { full: true }))).concat(list.filter((f) => f.t !== 'var'))
  } else cols = list
  const rows = interpretations(vs)
  const goalKeys = new Set(list.map((f) => show(f, { full: true })))
  const tbl = h('table.tt')
  const thead = h('thead'), tr = h('tr')
  vs.forEach((v) => tr.append(h('th.var', { html: fxHTML(v) })))
  cols.forEach((c) => tr.append(h('th', { class: goalKeys.has(show(c, { full: true })) ? 'goal' : '', html: fxHTML(show(c)) })))
  thead.append(tr); tbl.append(thead)
  const tb = h('tbody')
  rows.forEach((I, ri) => {
    const r = h('tr', { dataset: { i: ri } })
    vs.forEach((v) => r.append(h('td.var', { html: tv(I[v]) })))
    cols.forEach((c, ci) => r.append(h('td', { class: goalKeys.has(show(c, { full: true })) ? 'goal' : '', dataset: { c: ci }, html: tv(evaluate(c, I)) })))
    if (selectable) r.addEventListener('click', () => { select(ri); onRow && onRow(I, ri) })
    tb.append(r)
  })
  tbl.append(tb)
  const wrap = h('div.tt-wrap', tbl)
  function select(ri) { [...tb.children].forEach((r, k) => r.classList.toggle('on', k === ri)) }
  // reveal column k (0..cols.length) ; cells of col >= k hidden
  function reveal(k) {
    tb.querySelectorAll('td[data-c]').forEach((td) => {
      const c = +td.dataset.c
      const hide = c >= k
      const was = td.classList.contains('hide')
      td.classList.toggle('hide', hide)
      td.classList.toggle('fresh', was && !hide)
    })
  }
  return { el: wrap, cols, vars: vs, rows, select, reveal }
}

export function verdictEl(f) {
  const c = classify(f)
  const state = c.kind === 'unsat' ? 'bot' : 'top'
  const sub = c.kind === 'valid' ? `全 ${c.n} 通りの解釈で ⊤。どう割り当てても真。`
    : c.kind === 'unsat' ? `全 ${c.n} 通りの解釈で ⊥。真にする解釈が 1 つもない。`
    : `${c.n} 通り中 ${c.t} 通りで ⊤。真にできる解釈はあるが、偽になる解釈もある。`
  return html(`<div class="verdict ${c.kind}">${toto(state, { idle: true })}<div>${c.label}<small>${sub}</small></div></div>`)
}
