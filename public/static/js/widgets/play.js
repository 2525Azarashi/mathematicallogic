import { h, fxs } from '../lib/ui.js'
import { SYM, evaluate, vars, sortVars, PREC } from '../logic/core.js'

// Render a formula where every atom is a clickable ⊤/⊥ switch.
// returns { el, I, set(I) } ; onChange(I, value)
export function atomFormula(f, { I: I0, onChange, size } = {}) {
  const vs = sortVars(vars(f))
  const I = I0 ? { ...I0 } : Object.fromEntries(vs.map((v) => [v, true]))
  const el = h('span.fx.atom-fx')
  if (size) el.style.fontSize = size
  const btns = []
  const build = (g, ctx, side) => {
    const frag = document.createDocumentFragment()
    if (g.t === 'var') {
      const b = h('button.atom', { type: 'button', 'aria-label': `${g.n} の真偽を切り替え`, onclick: () => { I[g.n] = !I[g.n]; sync() } }, h('span', g.n), h('span.val'))
      b.dataset.v = g.n
      btns.push(b); frag.append(b); return frag
    }
    if (g.t === 'top' || g.t === 'bot') { frag.append(h('span', { class: g.t === 'top' ? 'c-top' : 'c-bot' }, SYM[g.t])); return frag }
    if (g.t === 'not') { frag.append(h('span.o.o-not', '¬'), build(g.a, PREC.not, 'u')); return frag }
    const p = PREC[g.t]
    const need = ctx > 0
    if (need) frag.append(h('span.p', '('))
    frag.append(build(g.a, p, 'l'), h('span.o.o-' + g.t, ` ${SYM[g.t]} `), build(g.b, p, 'r'))
    if (need) frag.append(h('span.p', ')'))
    return frag
  }
  el.append(build(f, 0, null))
  function sync(silent) {
    btns.forEach((b) => {
      const v = I[b.dataset.v]
      b.classList.toggle('t', v); b.classList.toggle('f', !v)
      b.lastChild.textContent = v ? '⊤' : '⊥'
    })
    if (!silent && onChange) onChange({ ...I }, evaluate(f, I))
  }
  sync(true)
  return { el, I, vars: vs, set(J) { Object.assign(I, J); sync() }, value: () => evaluate(f, I), refresh: () => sync() }
}
