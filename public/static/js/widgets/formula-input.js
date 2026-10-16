import { h, esc } from '../lib/ui.js'
import { tryParse, parseSequent } from '../logic/core.js'

// Formula input with symbol keyboard & friendly error messages.
// opts: { value, onChange(f, src), sequent:boolean, examples:[...] , placeholder }
export function formulaInput({ value = '', onChange, sequent = false, examples = [], placeholder } = {}) {
  const input = h('input', { type: 'text', value, spellcheck: 'false', autocomplete: 'off', 'aria-label': sequent ? 'シーケントを入力' : '論理式を入力', placeholder: placeholder || (sequent ? '例: P, Q → P ∧ Q' : '例: (P ⊃ Q) ∧ P ⊃ Q') })
  const msg = h('div.fin-msg', { 'aria-live': 'polite' })
  const root = h('div.fin')
  const keys = h('div.keys')
  const K = [['¬', 'not'], ['∧', 'and'], ['∨', 'or'], ['⊃', 'imp'], ['⊤', 'top'], ['⊥', 'bot'], ['(', ''], [')', ''], ['P', ''], ['Q', ''], ['R', '']]
  if (sequent) K.push(['→', ''], [',', ''])
  K.forEach(([s, c]) => keys.append(h('button', { type: 'button', class: c ? 'k-' + c : '', onclick: () => ins(s) }, s)))
  keys.append(h('button.k-txt', { type: 'button', onclick: () => { const p = input.selectionStart; if (p > 0) { input.value = input.value.slice(0, p - 1) + input.value.slice(p); input.setSelectionRange(p - 1, p - 1); update() } input.focus() } }, '⌫'))
  keys.append(h('button.k-txt', { type: 'button', onclick: () => { input.value = ''; update(); input.focus() } }, 'クリア'))

  function ins(s) {
    const a = input.selectionStart ?? input.value.length, b = input.selectionEnd ?? a
    const pad = /[∧∨⊃→]/.test(s) ? ` ${s} ` : s === ',' ? ', ' : s
    input.value = input.value.slice(0, a) + pad + input.value.slice(b)
    const p = a + pad.length
    input.focus(); input.setSelectionRange(p, p)
    update()
  }
  // live ascii -> glyph replacement
  function normalize() {
    const before = input.value
    let v = before
      .replace(/<->/g, '<->')
      .replace(/->/g, '⊃').replace(/=>/g, sequent ? '→' : '⊃')
      .replace(/\/\\/g, '∧').replace(/\\\//g, '∨')
      .replace(/&/g, '∧').replace(/\|/g, '∨').replace(/~/g, '¬').replace(/!/g, '¬')
    if (sequent) v = v.replace(/\|-/g, '→').replace(/⊢/g, '→')
    if (v !== before) {
      const d = before.length - v.length
      const p = Math.max(0, (input.selectionStart || 0) - d)
      input.value = v; input.setSelectionRange(p, p)
    }
  }
  function update() {
    normalize()
    const src = input.value
    root.classList.remove('err', 'ok')
    if (!src.trim()) { msg.className = 'fin-msg'; msg.innerHTML = '<span class="hint">↑ キーボードでも入力できます（~ & | -&gt; も自動変換）</span>'; return }
    let res
    if (sequent) {
      try { res = { ok: true, f: parseSequent(src) } } catch (e) { res = { ok: false, err: e } }
    } else res = tryParse(src)
    if (res.ok) {
      root.classList.add('ok'); msg.className = 'fin-msg ok'; msg.innerHTML = '✓ 正しい' + (sequent ? 'シーケント' : '論理式') + 'です'
      onChange && onChange(res.f, src)
    } else {
      root.classList.add('err'); msg.className = 'fin-msg err'
      const e = res.err
      const near = e.pos != null ? `<span class="caret">${esc(src.slice(Math.max(0, e.pos - 4), e.pos))}<u>${esc(src.slice(e.pos, e.pos + 1) || '␣')}</u></span>` : ''
      msg.innerHTML = `✗ ${esc(e.message)} ${near} ${e.hint ? `<span class="hint">— ${esc(e.hint)}</span>` : ''}`
      onChange && onChange(null, src, e)
    }
  }
  input.addEventListener('input', update)
  const ex = examples.length ? h('div.examples', '例：', examples.map((s) => h('button', { type: 'button', onclick: () => { input.value = s; update() } }, s))) : null
  root.append(h('div.fin-row', h('div.fin-box', input)), keys, msg, ex)
  root.set = (v) => { input.value = v; update() }
  root.input = input
  queueMicrotask(update)
  return root
}
