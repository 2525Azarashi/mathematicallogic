import { h, fxs, fxHTML, Player } from '../lib/ui.js'
import { toCNFSteps, show, getAt, showClause } from '../logic/core.js'

// show f with the sub-term at `path` highlighted (span.hl / hl-new)
function showHL(f, path, cls) {
  if (!path) return fxs(show(f))
  // build string by replacing sub-term with a token, then substitute
  const rep = (g, p) => {
    if (!p.length) return { t: 'var', n: '§§' }
    const [k, ...rest] = p
    if (g.t === 'not') return { t: 'not', a: rep(g.a, rest) }
    return k === 'a' ? { t: g.t, a: rep(g.a, rest), b: g.b } : { t: g.t, a: g.a, b: rep(g.b, rest) }
  }
  try {
    const sub = getAt(f, path)
    let s = fxs(show(rep(f, path)))
    let inner = fxs(show(sub))
    // parenthesise if needed in context: compare string with full show
    const whole = show(f)
    const placed = show(rep(f, path)).replace('§§', show(sub))
    if (placed !== whole) inner = fxs('(' + show(sub) + ')')
    return s.replace('§§', `<span class="${cls}">${inner}</span>`)
  } catch { return fxs(show(f)) }
}

export function cnfStepper(f0) {
  const el = h('div')
  const phases = h('div.cnf-phases')
  const lines = h('div.cnf-lines')
  const result = h('div.panel', { style: { marginTop: '16px' } })
  let player
  const PH = ['(1) ⊃ を除去', '(2) ¬ を内側へ', '(3) 分配則', '(4) その他']
  PH.forEach((p) => phases.append(h('span', p)))
  function load(f) {
    const { steps, clauses } = toCNFSteps(f)
    lines.innerHTML = ''
    const rows = steps.map((s, i) => {
      const row = h('div.cnf-line', { style: { display: 'none' } },
        h('span.eqs', i ? '=' : ''),
        h('span.fx', { html: i === 0 ? fxs(show(s.f)) : '' }),
        h('span.why', { html: i ? `<b>${s.name}</b><br><span class="fx">${fxs(s.law)}</span>` : '<b>出発点</b>' }))
      row._s = s
      lines.append(row)
      return row
    })
    const draw = (k) => {
      rows.forEach((r, i) => {
        r.style.display = i <= k ? '' : 'none'
        r.classList.toggle('cur', i === k)
        const s = r._s, nx = rows[i + 1] ? rows[i + 1]._s : null
        const fxEl = r.children[1]
        if (i < k && nx && nx.path) fxEl.innerHTML = showHL(s.f, nx.path, 'hl')
        else if (i === k && i > 0 && s.path) fxEl.innerHTML = showHL(s.f, s.path, 'hl-new')
        else fxEl.innerHTML = fxs(show(s.f))
        if (i === k && i > 0) { r.classList.remove('new'); void r.offsetWidth; r.classList.add('new') }
      })
      const ph = steps[k].phase
      ;[...phases.children].forEach((p, i) => { p.classList.toggle('on', i + 1 === ph); p.classList.toggle('done', i + 1 < ph || (k === steps.length - 1 && i + 1 <= Math.max(ph, 1))) })
      result.style.display = k === steps.length - 1 ? '' : 'none'
    }
    result.innerHTML = ''
    result.append(h('h5', '✓ 連言標準形（CNF）と節集合'),
      h('div.kv', h('span', { html: fxHTML(show(steps[steps.length - 1].f)) })),
      h('div.clause-set', { style: { marginTop: '8px' } }, h('span.brace', '{'),
        ...(clauses || []).map((c, i) => h('span', { html: fxs(showClause(c)) + (i < clauses.length - 1 ? '<span class="p">,</span>' : '') })),
        h('span.brace', '}')),
      clauses && !clauses.length ? h('p', { style: { margin: '6px 0 0', fontSize: '13px', fontWeight: 700 } }, '節が 0 個 = ⊤（すべての節がトートロジとして消えた）') : '')
    if (!player) { player = new Player(steps.length, draw, { interval: 1200 }); ctrl.append(player.el) }
    else { player.onStep = draw; player.setN(steps.length) }
    player.go(steps.length > 1 ? 0 : 0)
  }
  const ctrl = h('div.ctrls', { style: { marginBottom: '14px', justifyContent: 'space-between' } })
  ctrl.append(h('span', { style: { fontSize: '13px', fontWeight: 700, color: 'var(--ink-2)' } }, '黄色 = 次の行で書き換わる部分 ／ 緑 = 書き換えた結果'))
  el.append(phases, ctrl, lines, result)
  load(f0)
  el.load = load
  return el
}
