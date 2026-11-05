import { h, esc } from '../lib/ui.js'
import { tryFol } from '../logic/fol.js'
import { tryFolSeq } from '../logic/fol-proof.js'

// 述語論理用の入力欄（記号キーボード + エラー表示 + 例ボタン）
// opts: { value, onChange(f, src), examples:[...], placeholder, label }
// sequent:true → 「Γ → Δ」形式のシーケントを読む（onChange には {L, R} が渡る）
export function folInput({ value = '', onChange, examples = [], placeholder, label, sequent = false } = {}) {
  placeholder = placeholder || (sequent ? '例: ∀x(P(x) ⊃ Q(x)), P(a) → Q(a)' : '例: ∀x(P(x) ⊃ ∃y R(x, y))')
  label = label || (sequent ? '述語論理のシーケントを入力' : '述語論理の論理式を入力')
  const input = h('input', { type: 'text', value, spellcheck: 'false', autocomplete: 'off', 'aria-label': label, placeholder })
  const msg = h('div.fin-msg', { 'aria-live': 'polite' })
  const root = h('div.fin.fol-in')
  const keys = h('div.keys')
  ;[['∀', 'q'], ['∃', 'q'], ['¬', 'not'], ['∧', 'and'], ['∨', 'or'], ['⊃', 'imp'], ['(', ''], [')', ''], [',', ''], ['x', 'v'], ['y', 'v'], ['P', ''], ['R', ''], ['a', ''], ['f', '']]
    .forEach(([s, c]) => keys.append(h('button', { type: 'button', class: c ? 'k-' + c : '', onclick: () => ins(s) }, s)))
  if (sequent) keys.append(h('button', { type: 'button', onclick: () => ins(' → ') }, '→'))
  keys.append(h('button.k-txt', { type: 'button', onclick: () => { input.value = ''; update(); input.focus() } }, 'クリア'))
  function ins(s) {
    const a = input.selectionStart ?? input.value.length, b = input.selectionEnd ?? a
    const pad = /[∧∨⊃]/.test(s) ? ` ${s} ` : s === ',' ? ', ' : s
    input.value = input.value.slice(0, a) + pad + input.value.slice(b)
    const p = a + pad.length
    input.focus(); input.setSelectionRange(p, p)
    update()
  }
  function normalize() {
    const before = input.value
    const v = (sequent ? before.replace(/=>/g, '→') : before).replace(/->/g, '⊃').replace(/\/\\/g, '∧').replace(/\\\//g, '∨').replace(/&/g, '∧').replace(/\|/g, '∨').replace(/~/g, '¬').replace(/\\A/g, '∀').replace(/\\E/g, '∃')
    if (v !== before) { const d = before.length - v.length, p = Math.max(0, (input.selectionStart || 0) - d); input.value = v; input.setSelectionRange(p, p) }
  }
  function update() {
    normalize()
    const src = input.value
    root.classList.remove('err', 'ok')
    if (!src.trim()) { msg.className = 'fin-msg'; msg.innerHTML = '<span class="hint">\\A → ∀、\\E → ∃、-&gt; → ⊃ に自動変換。変数は x〜z（u〜w も可）、定数は a, b, c …</span>'; onChange && onChange(null, src); return }
    const r = sequent ? tryFolSeq(src) : tryFol(src)
    if (r.ok) { root.classList.add('ok'); msg.className = 'fin-msg ok'; msg.textContent = sequent ? '✓ 正しいシーケントです' : '✓ 正しい論理式です'; onChange && onChange(sequent ? r.s : r.f, src) }
    else {
      root.classList.add('err'); msg.className = 'fin-msg err'
      const e = r.err
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
