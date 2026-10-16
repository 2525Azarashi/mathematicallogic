import { avatar } from './chars.js'
import { show } from '../logic/core.js'
import { typeIn, REDUCED } from './motion.js'

// ---------- tiny hyperscript ----------
// h('div.cls#id', {attrs}, ...children)
export function h(sel, ...rest) {
  const m = sel.match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i)
  const el = document.createElement((m && m[1]) || 'div')
  if (m && m[2]) m[2].replace(/([.#])([\w-]+)/g, (_, t, n) => { if (t === '.') el.classList.add(n); else el.id = n })
  let attrs = null
  if (rest.length && rest[0] && typeof rest[0] === 'object' && !(rest[0] instanceof Node) && !Array.isArray(rest[0])) attrs = rest.shift()
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue
    if (k === 'html') el.innerHTML = v
    else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv } }
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v)
    else if (k === 'class') el.className += ' ' + v
    else if (k === 'dataset') Object.assign(el.dataset, v)
    else el.setAttribute(k, v === true ? '' : v)
  }
  append(el, rest)
  return el
}
function append(el, kids) {
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue
    el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  }
}
export const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.childNodes.length === 1 ? t.content.firstChild : t.content }
export const $ = (s, r = document) => r.querySelector(s)
export const $$ = (s, r = document) => [...r.querySelectorAll(s)]
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// ---------- formula colouring ----------
// fxs("P ∧ ¬Q") -> HTML string with coloured operators (works on any text with logic glyphs)
export function fxs(src) {
  return esc(src)
    .replace(/¬/g, '<span class="o o-not">¬</span>')
    .replace(/∧/g, '<span class="o o-and">∧</span>')
    .replace(/∨/g, '<span class="o o-or">∨</span>')
    .replace(/⊃/g, '<span class="o o-imp">⊃</span>')
    .replace(/⊤/g, '<span class="c-top">⊤</span>')
    .replace(/⊥/g, '<span class="c-bot">⊥</span>')
    .replace(/→/g, '<span class="arrow">→</span>')
    .replace(/([()])/g, '<span class="p">$1</span>')
}
export const fxHTML = (f) => `<span class="fx">${fxs(typeof f === 'string' ? f : show(f))}</span>`
export const fx = (f, cls = '') => html(`<span class="fx ${cls}">${fxs(typeof f === 'string' ? f : show(f))}</span>`)
export const tv = (b) => `<span class="tv ${b ? 't' : 'f'}">${b ? '⊤' : '⊥'}</span>`
export const tvEl = (b) => html(tv(b))

// inline markup used inside dialogue / prose:
//   $...$  -> formula,  **x** -> bold,  [[T]] / [[F]] -> truth chip
export function rich(s) {
  const parts = s.split(/(\$[^$]+\$|<[^>]+>)/g)
  s = parts.map((p) => {
    if (p.startsWith('$') && p.endsWith('$') && p.length > 1) return `<span class="fx">${fxs(p.slice(1, -1))}</span>`
    if (p.startsWith('<')) return p
    return p.replace(/[¬∧∨⊃]/g, (c) => `<span class="o o-${{ '¬': 'not', '∧': 'and', '∨': 'or', '⊃': 'imp' }[c]}">${c}</span>`)
  }).join('')
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\[\[T\]\]/g, tv(true)).replace(/\[\[F\]\]/g, tv(false))
}

// ---------- dialogue ----------
const CAST = { S: { name: 'サカイ', cls: 's' }, R: { name: 'リョウガ', cls: 'r' } }
function guessExpr(who, text) {
  if (/！？|えっ|ええ|まじ|マジ|すご|なるほど！|へえ/.test(text)) return 'wow'
  if (/うーん|むず|わから|あれ|\?|？|ん？|どうして|なんで/.test(text) && who === 'R') return 'think'
  if (/ミス|しまった|罠|ハマ|間違|ダメ/.test(text)) return 'oops'
  if (/！|いいね|正解|そう|その通り|♪|大丈夫|できた/.test(text)) return 'happy'
  return 'normal'
}
// talk(`R: 質問\nS[happy]: 答え\n  続きの行は同じ吹き出しで改行`)
export function talk(script, { animate = true } = {}) {
  const box = h('div.talk')
  const lines = script.trim().split('\n')
  const turns = []
  for (const ln of lines) {
    const m = ln.match(/^\s*([SR]|-)(?:\[(\w+)\])?:\s?(.*)$/)
    if (m) turns.push({ who: m[1], ex: m[2], text: [m[3]] })
    else if (turns.length) turns[turns.length - 1].text.push(ln.trim())
  }
  for (const t of turns) {
    if (t.who === '-') { box.append(h('div.say.aside', h('div.bubble', { html: rich(t.text.join('<br>')) }))); continue }
    const c = CAST[t.who]
    const body = t.text.join('\n')
    const ex = t.ex || guessExpr(t.who, body)
    const paras = body.split(/\n\n/).map((p) => `<p>${rich(p).replace(/\n/g, '<br>')}</p>`).join('')
    box.append(h(`div.say.${c.cls}`, { class: animate ? 'will-pop' : '' },
      h('div.av', { html: avatar(t.who, ex) + `<span class="nm">${c.name}</span>`, title: c.name }),
      h('div.bubble', { html: paras })))
  }
  return box
}
export const say = (who, text, ex) => talk(`${who}${ex ? `[${ex}]` : ''}: ${text}`, { animate: false }).firstChild

export const point = (text) => h('div.point.reveal', h('span.tag', 'POINT'), h('p', { html: rich(text) }))
export function defn(label, title, body, { thm = false, en } = {}) {
  return h('div.defn.reveal', h('span.lbl', { class: thm ? 'thm' : '' }, label),
    title ? h('h4', { html: rich(title) + (en ? ` <small>${en}</small>` : '') }) : null,
    h('div', { html: rich(body) }))
}
export const callout = (kind, text) => h(`div.callout.${kind}`, h('span.ic', kind === 'warn' ? '⚠️' : kind === 'tip' ? '💡' : '📎'), h('p', { html: rich(text) }))
export const prose = (s) => h('div.prose', { html: s.trim().split(/\n\n/).map((p) => `<p>${rich(p)}</p>`).join('') })

export function lab(title, { badge = 'LAB', hint } = {}, ...body) {
  return h('section.lab.reveal', h('div.lab-head', h('span.badge', badge), h('h4', title), hint ? h('span.hint', hint) : null), h('div.lab-body', ...body))
}
export function seg(options, value, onChange) {
  const el = h('div.seg', { role: 'tablist' })
  const render = (v) => [...el.children].forEach((b) => b.classList.toggle('on', b.dataset.v === String(v)))
  options.forEach(([v, label]) => el.append(h('button', { type: 'button', dataset: { v }, html: label, onclick: () => { render(v); onChange(v) } })))
  render(value)
  el.set = render
  return el
}

// ---------- step player ----------
export class Player {
  constructor(n, onStep, { interval = 1100 } = {}) {
    this.n = n; this.i = 0; this.onStep = onStep; this.interval = interval; this.t = null
    this.prev = h('button.icon-btn', { 'aria-label': '前へ', onclick: () => this.go(this.i - 1) }, '◀')
    this.next = h('button.icon-btn', { 'aria-label': '次へ', onclick: () => this.go(this.i + 1) }, '▶')
    this.playB = h('button.icon-btn.play', { 'aria-label': '再生', onclick: () => this.toggle() }, '▶▶')
    this.reset = h('button.icon-btn', { 'aria-label': '最初から', onclick: () => { this.stop(); this.go(0) } }, '↺')
    this.cnt = h('span.cnt')
    this.el = h('div.stepper', this.reset, this.prev, this.cnt, this.next, this.playB)
    this.el.tabIndex = 0
    this.el.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); this.go(this.i + 1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.go(this.i - 1) }
      if (e.key === ' ') { e.preventDefault(); this.toggle() }
    })
    this.go(0)
  }
  setN(n) { this.n = n; this.stop(); this.go(0) }
  go(i) {
    i = Math.max(0, Math.min(this.n - 1, i))
    const fwd = i > this.i
    this.i = i
    this.cnt.textContent = `${i + 1} / ${this.n}`
    this.prev.disabled = i === 0
    this.next.disabled = i >= this.n - 1
    this.onStep(i, fwd)
    if (i >= this.n - 1) this.stop()
  }
  toggle() { this.t ? this.stop() : this.play() }
  play() {
    if (this.i >= this.n - 1) this.go(0)
    this.playB.textContent = '❚❚'
    this.t = setInterval(() => this.go(this.i + 1), this.interval)
  }
  stop() { clearInterval(this.t); this.t = null; this.playB.textContent = '▶▶' }
}

// ---------- storage ----------
export const store = {
  get(k, d) { try { const v = localStorage.getItem('tt:' + k); return v == null ? d : JSON.parse(v) } catch { return d } },
  set(k, v) { try { localStorage.setItem('tt:' + k, JSON.stringify(v)) } catch {} },
}

// ---------- fx: confetti / toast ----------
export function confetti(x, y, n = 22) {
  const glyphs = ['⊤', '✦', '●', '∧', '∨', '★']
  const colors = ['#2ec486', '#ffd23f', '#5aa9ff', '#9d7bff', '#ff9d5c', '#ff6b8b']
  for (let i = 0; i < n; i++) {
    const s = h('span.confetti', glyphs[i % glyphs.length])
    s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.color = colors[i % colors.length]
    document.body.append(s)
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 110
    s.animate([
      { transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 40}px)) rotate(${Math.random() * 360}deg) scale(1)`, opacity: 1, offset: .6 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.2}px), calc(-50% + ${Math.sin(a) * d + 60}px)) rotate(${Math.random() * 720}deg) scale(.6)`, opacity: 0 },
    ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove()
  }
}
export function confettiAt(el) { const r = el.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2) }
let toastEl
export function toast(msg) {
  if (!toastEl) { toastEl = h('div.toast'); document.body.append(toastEl) }
  toastEl.textContent = msg
  toastEl.classList.add('on')
  clearTimeout(toastEl._t)
  toastEl._t = setTimeout(() => toastEl.classList.remove('on'), 1800)
}

// ---------- reveal on scroll ----------
let io
export function observeReveal(root = document) {
  if (!io) io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return
    const el = e.target
    el.classList.add('in')
    // dialogue: bubbles appear one after another, text "types" in
    let t = 0
    $$('.say.will-pop', el).forEach((b) => {
      const at = t
      setTimeout(() => {
        b.classList.add('pop', 'speaking'); b.classList.remove('will-pop')
        const bub = b.querySelector('.bubble')
        const d = bub ? typeIn(bub, { cps: 140 }) : 0
        setTimeout(() => b.classList.remove('speaking'), d + 200)
      }, at)
      const len = (b.textContent || '').length
      t += REDUCED ? 0 : Math.min(950, 260 + len * 7)
    })
    io.unobserve(el)
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 })
  $$('.reveal:not(.in), .talk', root).forEach((el) => io.observe(el))
}
