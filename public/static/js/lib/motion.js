// ============================================================
//  motion.js — kinetic typography & UI motion toolkit
//  (no deps; respects prefers-reduced-motion)
// ============================================================
import { h, $$ } from './ui.js'

export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches
const fine = matchMedia('(pointer: fine)').matches

// ---------- split text into chars (keeps <tags> intact) ----------
// splitChars(el) -> wraps every visible glyph in <span class="ch" style="--i:n">
export function splitChars(el, { cls = 'ch', start = 0 } = {}) {
  let i = start
  const walk = (node) => {
    ;[...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment()
        for (const c of n.textContent) {
          if (c === ' ' || c === '\n') { frag.append(document.createTextNode(c)); continue }
          const s = document.createElement('span'); s.className = cls; s.textContent = c; s.style.setProperty('--i', i++)
          frag.append(s)
          frag.append(document.createElement('wbr'))
        }
        n.replaceWith(frag)
      } else if (n.nodeType === 1 && !n.classList.contains('no-split')) walk(n)
    })
  }
  walk(el)
  el.classList.add('is-split')
  el.style.setProperty('--n', i)
  return i
}
// kinetic heading: h('h2', ...) -> chars rise in with stagger when revealed
export function kinetic(el, style = 'rise') {
  splitChars(el)
  el.classList.add('kt', 'kt-' + style)
  return el
}

// ---------- rotating word (text morph) ----------
export function rotator(words, { interval = 2200, cls = '' } = {}) {
  const el = h('span.rot', { class: cls, 'aria-live': 'off' })
  const sizer = h('span.rot-sizer', { 'aria-hidden': 'true' })
  el.append(sizer)
  let k = 0, cur = null
  const show = () => {
    const w = words[k % words.length]
    const word = h('span.rot-w')
    word.innerHTML = typeof w === 'string' ? w : w.html
    if (typeof w === 'object' && w.color) word.style.color = w.color
    splitChars(word)
    sizer.innerHTML = word.innerHTML
    if (cur) { const old = cur; old.classList.add('out'); setTimeout(() => old.remove(), 700) }
    el.append(word); cur = word
    requestAnimationFrame(() => word.classList.add('in'))
    k++
  }
  show()
  if (!REDUCED) el._t = setInterval(() => { if (!document.contains(el)) return clearInterval(el._t); show() }, interval)
  return el
}

// ---------- scramble / decode text ----------
const GLYPHS = '⊤⊥¬∧∨⊃→⊢⊨PQRαβγ'
export function scramble(el, finalText, { dur = 900 } = {}) {
  if (REDUCED) { el.textContent = finalText; return }
  const t0 = performance.now()
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur)
    const n = Math.floor(finalText.length * p)
    let s = finalText.slice(0, n)
    for (let i = n; i < finalText.length; i++) s += finalText[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]
    el.textContent = s
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// ---------- count-up numbers ----------
export function countUp(el, to, { dur = 1400, suffix = '', decimals = 0 } = {}) {
  if (REDUCED) { el.textContent = to.toFixed(decimals) + suffix; return }
  const t0 = performance.now()
  const ease = (x) => 1 - Math.pow(1 - x, 4)
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur)
    el.textContent = (to * ease(p)).toFixed(decimals) + suffix
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
// declarative: <b data-count="18" data-suffix="+">
export function wireCounters(root) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return
    const el = e.target
    countUp(el, +el.dataset.count, { suffix: el.dataset.suffix || '', decimals: +(el.dataset.dec || 0) })
    io.unobserve(el)
  }), { threshold: 0.4 })
  $$('[data-count]', root).forEach((el) => { el.textContent = '0' + (el.dataset.suffix || ''); io.observe(el) })
}

// ---------- marquee (infinite ticker) ----------
export function marquee(items, { speed = 40, reverse = false, cls = '' } = {}) {
  const track = h('div.mq-track')
  const row = () => h('div.mq-row', ...items.map((it) => h('span.mq-item', { html: it })))
  track.append(row(), row())
  const el = h('div.marquee', { class: cls + (reverse ? ' rev' : ''), 'aria-hidden': 'true', style: { '--mq-dur': speed + 's' } }, track)
  return el
}

// ---------- scroll-linked: progress var on elements ----------
// elements with [data-scroll] get --p (0..1) as they pass through viewport
let scrollEls = []
function onScroll() {
  const vh = innerHeight
  for (const el of scrollEls) {
    const r = el.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)))
    el.style.setProperty('--p', p.toFixed(4))
  }
  const d = document.documentElement
  d.style.setProperty('--sp', (d.scrollTop / Math.max(1, d.scrollHeight - innerHeight)).toFixed(4))
}
export function wireScroll(root, reset = false) {
  if (reset) scrollEls = []
  scrollEls = [...scrollEls.filter((e) => document.contains(e)), ...$$('[data-scroll]', root)]
  onScroll()
}
addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true })
addEventListener('resize', onScroll)

// ---------- magnetic buttons ----------
export function wireMagnetic(root) {
  if (!fine || REDUCED) return
  $$('.btn, .nav-btn, .icon-btn.play, .lec-card .go', root).forEach((b) => {
    if (b._mag) return; b._mag = 1
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect()
      const x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height
      b.style.setProperty('--mx', (x * 10).toFixed(1) + 'px'); b.style.setProperty('--my', (y * 8).toFixed(1) + 'px')
    })
    b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px') })
  })
}

// ---------- 3D tilt cards ----------
export function wireTilt(root) {
  if (!fine || REDUCED) return
  $$('.lec-card, .pr, .tool, .cast-card, .hero-play, .info-card', root).forEach((c) => {
    if (c._tilt) return; c._tilt = 1
    c.classList.add('tilt')
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
      c.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg'); c.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg')
      c.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(1) + '%'); c.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(1) + '%')
    })
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg') })
  })
}

// ---------- ripple on click (global) ----------
document.addEventListener('pointerdown', (e) => {
  if (REDUCED) return
  const t = e.target.closest('.btn, .seg button, .keys button, .opt, .clause, .icon-btn, .atom, .hp-pick button, .examples button, .card-f')
  if (!t) return
  const r = t.getBoundingClientRect()
  const d = Math.max(r.width, r.height) * 2.2
  const s = document.createElement('span')
  s.className = 'ripple'
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`
  if (getComputedStyle(t).position === 'static') t.style.position = 'relative'
  t.style.overflow = t.classList.contains('atom') || t.classList.contains('clause') ? t.style.overflow : 'hidden'
  t.append(s)
  setTimeout(() => s.remove(), 650)
})

// ---------- custom cursor (desktop) ----------
export function initCursor() {
  if (!fine || REDUCED || document.querySelector('.cursor')) return
  const dot = h('div.cursor', h('span.cursor-label'))
  const ring = h('div.cursor-ring')
  document.body.append(ring, dot)
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px,${y}px)` }, { passive: true })
  const loop = () => { rx += (x - rx) * 0.18; ry += (y - ry) * 0.18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop) }
  loop()
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('a, button, .clause, .atom, .tt tr, .card-f, .fm.cx, input, [data-cursor]')
    ring.classList.toggle('hover', !!t)
    ring.classList.toggle('text', !!(t && t.tagName === 'INPUT'))
    const lbl = t && t.dataset && t.dataset.cursor
    dot.classList.toggle('has-label', !!lbl)
    dot.firstChild.textContent = lbl || ''
  })
  document.addEventListener('pointerdown', () => ring.classList.add('down'))
  document.addEventListener('pointerup', () => ring.classList.remove('down'))
  document.documentElement.classList.add('has-cursor')
}

// ---------- page wipe transition ----------
let wipeEl
export function pageWipe(label, color) {
  if (REDUCED) return Promise.resolve()
  if (!wipeEl) {
    wipeEl = h('div.wipe', h('div.wipe-bar.b1'), h('div.wipe-bar.b2'), h('div.wipe-bar.b3'), h('div.wipe-label'))
    document.body.append(wipeEl)
  }
  wipeEl.style.setProperty('--wc', color || '#9d7bff')
  const lbl = wipeEl.querySelector('.wipe-label')
  lbl.innerHTML = ''
  lbl.append(h('span', label))
  splitChars(lbl.firstChild)
  wipeEl.classList.remove('out'); void wipeEl.offsetWidth
  wipeEl.classList.add('in')
  return new Promise((res) => setTimeout(() => {
    res()
    setTimeout(() => { wipeEl.classList.remove('in'); wipeEl.classList.add('out') }, 120)
  }, 520))
}

// ---------- intro loader (first visit per session) ----------
export function intro() {
  if (REDUCED || sessionStorage.getItem('tt-intro')) return Promise.resolve()
  sessionStorage.setItem('tt-intro', '1')
  const word = h('div.intro-word')
  const seq = ['P', '¬P', 'P ∨ ¬P', '⊤']
  const el = h('div.intro', h('div.intro-grid'), word, h('div.intro-bar', h('i')), h('div.intro-cap', 'Tiny Tautology — loading truth…'))
  document.body.append(el)
  let k = 0
  const tick = () => {
    word.innerHTML = ''
    const s = h('span', seq[k]); word.append(s); splitChars(s)
    word.classList.toggle('final', k === seq.length - 1)
    k++
    if (k < seq.length) setTimeout(tick, 360)
  }
  tick()
  return new Promise((res) => setTimeout(() => { el.classList.add('done'); res(); setTimeout(() => el.remove(), 900) }, 1650))
}

// ---------- typing reveal for dialogue bubbles ----------
// characters of the bubble fade in sequentially (keeps markup)
export function typeIn(bubble, { cps = 90 } = {}) {
  if (REDUCED || bubble._typed) return 0
  bubble._typed = 1
  const n = splitChars(bubble, { cls: 'tc' })
  bubble.classList.add('typing')
  const dur = Math.min(1400, (n / cps) * 1000)
  bubble.style.setProperty('--tdur', dur + 'ms')
  bubble.style.setProperty('--tn', n)
  setTimeout(() => bubble.classList.add('typed'), 30)
  return dur
}

// ---------- draw-on SVG paths ----------
export function wireDraw(root) {
  $$('svg [data-draw]', root).forEach((p) => {
    try { const L = p.getTotalLength(); p.style.setProperty('--len', L); p.style.strokeDasharray = L; p.style.strokeDashoffset = L } catch {}
  })
}

// ---------- init everything on a freshly rendered root ----------
export function animateRoot(root, { fresh = false } = {}) {
  $$('[data-kinetic]', root).forEach((el) => { if (!el.classList.contains('is-split')) kinetic(el, el.dataset.kinetic || 'rise') })
  wireCounters(root)
  wireScroll(root, fresh)
  wireMagnetic(root)
  wireTilt(root)
  wireDraw(root)
}
