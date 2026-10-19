// ============================================================
//  patterns.js — mobile-grade UI patterns
//  Toast · Bottom Sheet · Swipe Action · Pull to Refresh · Skeleton · Auto Complete
// ============================================================
import { h, esc } from './ui.js'

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches
const vibrate = (ms = 10) => { try { navigator.vibrate && navigator.vibrate(ms) } catch {} }

// ------------------------------------------------------------
//  TOAST — stackable, typed, optional action (e.g. Undo), swipe to dismiss
//  toast('msg') | toast({ msg, type:'ok'|'err'|'info'|'warn', action:{label,fn}, dur })
// ------------------------------------------------------------
let stack
const ICON = { ok: '✓', err: '✗', info: 'i', warn: '!', qed: '⊤' }
export function toast(opt) {
  if (typeof opt === 'string') opt = { msg: opt }
  const { msg, type = 'info', action, dur = action ? 4200 : 2400, icon } = opt
  if (!stack) { stack = h('div.toast-stack', { role: 'status', 'aria-live': 'polite' }); document.body.append(stack) }
  const bar = h('i.tst-bar')
  const el = h('div.tst', { class: 't-' + type },
    h('span.tst-ic', icon || ICON[type] || 'i'),
    h('span.tst-msg', { html: esc(msg) }),
    action ? h('button.tst-act', { type: 'button', onclick: () => { action.fn(); close() } }, action.label) : null,
    h('button.tst-x', { type: 'button', 'aria-label': '閉じる', onclick: () => close() }, '×'),
    bar)
  bar.style.animationDuration = dur + 'ms'
  stack.append(el)
  // keep max 3
  while (stack.children.length > 3) stack.firstChild.remove()
  requestAnimationFrame(() => el.classList.add('on'))
  let t = setTimeout(close, dur), left = dur, start = Date.now()
  el.addEventListener('pointerenter', () => { clearTimeout(t); left -= Date.now() - start; el.classList.add('paused') })
  el.addEventListener('pointerleave', () => { start = Date.now(); t = setTimeout(close, Math.max(600, left)); el.classList.remove('paused') })
  // swipe to dismiss
  swipeable(el, { onLeft: close, onRight: close, threshold: 70, rubber: false })
  function close() { clearTimeout(t); el.classList.remove('on'); el.classList.add('off'); setTimeout(() => el.remove(), 350) }
  return { close }
}

// ------------------------------------------------------------
//  BOTTOM SHEET — draggable, snap points (peek / full), backdrop, Esc, focus
//  sheet({ title, body: Node, onClose }) -> { close }
// ------------------------------------------------------------
let openSheet = null
export function closeSheet() { if (openSheet) openSheet.close() }
export function sheet({ title, kicker, body, actions = [], onClose, tall = false }) {
  if (openSheet) openSheet.close(true)
  const handle = h('div.bs-handle', { 'aria-hidden': 'true' }, h('i'))
  const content = h('div.bs-body', body)
  const head = h('div.bs-head', h('div', kicker ? h('div.bs-kicker', kicker) : null, h('h3', { id: 'bs-title' }, title)), h('button.bs-x', { type: 'button', 'aria-label': '閉じる', onclick: () => close() }, '×'))
  const foot = actions.length ? h('div.bs-foot', ...actions.map((a) => h('button.btn.sm', { type: 'button', class: a.cls || '', onclick: () => { a.fn(); if (a.close !== false) close() } }, a.label))) : null
  const panel = h('div.bs-panel', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'bs-title', tabindex: '-1' }, handle, head, content, foot)
  const bg = h('div.bs-bg', { onclick: () => close() })
  const root = h('div.bs', { class: tall ? 'tall' : '' }, bg, panel)
  document.body.append(root)
  document.documentElement.classList.add('bs-lock')
  const prevFocus = document.activeElement
  requestAnimationFrame(() => { root.classList.add('on'); panel.focus({ preventScroll: true }) })
  // drag to resize / dismiss
  let y0 = 0, dy = 0, dragging = false, startT = 0
  const down = (e) => {
    if (e.target.closest('.bs-body') && content.scrollTop > 0) return
    if (e.target.closest('button, a, input')) return
    dragging = true; y0 = e.clientY; dy = 0; startT = Date.now()
    panel.classList.add('drag'); panel.setPointerCapture(e.pointerId)
  }
  const move = (e) => {
    if (!dragging) return
    dy = e.clientY - y0
    const d = dy < 0 ? dy * 0.25 : dy // rubber band upward
    panel.style.transform = `translateY(${d}px)`
    bg.style.opacity = String(Math.max(0, 1 - Math.max(0, dy) / 400))
  }
  const up = () => {
    if (!dragging) return
    dragging = false; panel.classList.remove('drag')
    const v = dy / Math.max(1, Date.now() - startT)
    panel.style.transform = ''; bg.style.opacity = ''
    if (dy > 140 || v > 0.6) close()
    else if (dy < -60) root.classList.add('full')
    else if (dy > 40 && root.classList.contains('full')) root.classList.remove('full')
  }
  panel.addEventListener('pointerdown', down)
  panel.addEventListener('pointermove', move)
  panel.addEventListener('pointerup', up)
  panel.addEventListener('pointercancel', up)
  handle.addEventListener('click', () => root.classList.toggle('full'))
  const onKey = (e) => {
    if (e.key === 'Escape') close()
    if (e.key === 'Tab') { // focus trap
      const f = [...panel.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent)
      if (!f.length) return
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus() }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus() }
    }
  }
  addEventListener('keydown', onKey)
  function close(instant) {
    removeEventListener('keydown', onKey)
    root.classList.remove('on')
    document.documentElement.classList.remove('bs-lock')
    openSheet = null
    setTimeout(() => root.remove(), instant ? 0 : 380)
    onClose && onClose()
    if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true })
  }
  openSheet = { close, root, content }
  return openSheet
}

// ------------------------------------------------------------
//  SWIPE ACTION — horizontal swipe on a row reveals actions; past threshold commits
//  swipeable(el, { onLeft, onRight, leftLabel, rightLabel })
// ------------------------------------------------------------
export function swipeable(el, { onLeft, onRight, threshold = 96, rubber = true } = {}) {
  let x0 = 0, y0 = 0, dx = 0, active = false, locked = null, pid
  el.style.touchAction = 'pan-y'
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button, a, input')) return
    active = true; locked = null; x0 = e.clientX; y0 = e.clientY; dx = 0; pid = e.pointerId
  })
  el.addEventListener('pointermove', (e) => {
    if (!active) return
    const mx = e.clientX - x0, my = e.clientY - y0
    if (locked === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) { locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y'; if (locked === 'x') { el.setPointerCapture(pid); el.classList.add('swiping') } }
    if (locked !== 'x') return
    dx = mx
    if ((dx > 0 && !onRight) || (dx < 0 && !onLeft)) dx *= 0.2
    const shown = rubber && Math.abs(dx) > threshold ? Math.sign(dx) * (threshold + (Math.abs(dx) - threshold) * 0.5) : dx
    el.style.setProperty('--sx', shown + 'px')
    el.dataset.dir = dx > 0 ? 'right' : 'left'
    const armed = Math.abs(dx) > threshold
    if (armed !== el.classList.contains('armed')) { el.classList.toggle('armed', armed); if (armed) vibrate(8) }
  })
  const end = () => {
    if (!active) return
    active = false; el.classList.remove('swiping')
    if (locked === 'x' && Math.abs(dx) > threshold) {
      const fn = dx > 0 ? onRight : onLeft
      if (fn) { el.style.setProperty('--sx', (dx > 0 ? 1 : -1) * (el.offsetWidth + 40) + 'px'); el.classList.add('gone'); setTimeout(() => fn(), 230); return }
    }
    el.style.setProperty('--sx', '0px'); el.classList.remove('armed')
  }
  el.addEventListener('pointerup', end)
  el.addEventListener('pointercancel', end)
  return el
}

// ------------------------------------------------------------
//  PULL TO REFRESH — on a scroll container OR the page (when at top)
//  pullToRefresh(target, onRefresh: () => Promise, { label })
// ------------------------------------------------------------
export function pullToRefresh(target, onRefresh, { page = false } = {}) {
  const ind = h('div.ptr', h('div.ptr-ic', h('span', '⊤')), h('div.ptr-txt', '引っぱって更新'))
  target.prepend(ind)
  target.classList.add('ptr-host')
  let y0 = 0, dy = 0, pulling = false, busy = false
  const MAX = 120, TRIG = 72
  const atTop = () => (page ? scrollY <= 0 : target.scrollTop <= 0)
  const set = (d) => {
    target.style.setProperty('--pull', d + 'px')
    const p = Math.min(1, d / TRIG)
    ind.style.setProperty('--pp', p)
    ind.querySelector('.ptr-txt').textContent = busy ? '新しい問題を用意中…' : p >= 1 ? '離すと更新' : '引っぱって更新'
    ind.classList.toggle('ready', p >= 1)
  }
  target.addEventListener('pointerdown', (e) => {
    if (busy || !atTop() || e.target.closest('button, a, input, .opt')) return
    pulling = true; y0 = e.clientY; dy = 0
  })
  target.addEventListener('pointermove', (e) => {
    if (!pulling) return
    dy = e.clientY - y0
    if (dy <= 0) { set(0); return }
    if (dy > 6) { target.setPointerCapture?.(e.pointerId); target.classList.add('ptr-pulling') }
    const d = MAX * (1 - Math.exp(-dy / 140)) // rubber band
    set(d)
    if (d >= TRIG && !ind._v) { vibrate(10); ind._v = 1 } else if (d < TRIG) ind._v = 0
  })
  const end = async () => {
    if (!pulling) return
    pulling = false; target.classList.remove('ptr-pulling')
    const d = parseFloat(target.style.getPropertyValue('--pull')) || 0
    if (d >= TRIG) {
      busy = true; ind.classList.add('busy'); set(56)
      try { await Promise.all([onRefresh(), new Promise((r) => setTimeout(r, 700))]) } finally {
        busy = false; ind.classList.remove('busy', 'ready'); set(0)
      }
    } else set(0)
  }
  target.addEventListener('pointerup', end)
  target.addEventListener('pointercancel', end)
  // keyboard / mouse fallback: a refresh button
  return { refresh: async () => { if (busy) return; busy = true; ind.classList.add('busy'); set(56); await Promise.all([onRefresh(), new Promise((r) => setTimeout(r, 700))]); busy = false; ind.classList.remove('busy'); set(0) } }
}

// ------------------------------------------------------------
//  SKELETON — shimmer placeholders
// ------------------------------------------------------------
export function skeleton(kind = 'lecture') {
  const line = (w, cls = '') => h('i.sk', { class: cls, style: { width: w } })
  if (kind === 'lecture') return h('div.sk-wrap.wrap',
    h('div.sk-row', h('i.sk.sk-box', { style: { width: '128px', height: '128px', borderRadius: '36px' } }), h('div.sk-col', line('62%', 'sk-h1'), line('38%'), h('div.sk-row', line('110px', 'sk-chip'), line('170px', 'sk-chip'), line('120px', 'sk-chip')))),
    h('div.sk-row', { style: { marginTop: '28px', alignItems: 'flex-start' } },
      h('div.sk-col', { style: { width: '236px', flex: 'none' } }, h('i.sk.sk-box', { style: { height: '320px' } })),
      h('div.sk-col', { style: { flex: 1 } },
        line('48%', 'sk-h2'),
        h('div.sk-bub.r', line('55%', 'sk-bubble')), h('div.sk-bub', h('i.sk.sk-av'), line('70%', 'sk-bubble tall')), h('div.sk-bub.r', line('40%', 'sk-bubble')),
        h('i.sk.sk-box', { style: { height: '260px', marginTop: '18px' } }))))
  if (kind === 'list') return h('div.sk-wrap', ...[1, 2, 3, 4].map(() => h('div.sk-row.sk-item', h('i.sk.sk-av'), h('div.sk-col', { style: { flex: 1 } }, line('70%'), line('40%')))))
  if (kind === 'card') return h('div.sk-wrap', h('i.sk', { style: { width: '30%', height: '14px' } }), h('i.sk', { style: { width: '90%', height: '22px' } }), h('div.sk-row', ...[1, 2, 3, 4].map(() => h('i.sk', { style: { flex: 1, height: '44px', borderRadius: '16px' } }))))
  return h('div.sk-wrap', line('100%'), line('80%'), line('60%'))
}
// mount heavy content lazily with a skeleton until visible
export function lazy(build, kind = 'card', minH = 220) {
  const box = h('div.lazy-box', { style: { minHeight: minH + 'px' } }, skeleton(kind))
  const io = new IntersectionObserver((es) => {
    if (!es.some((e) => e.isIntersecting)) return
    io.disconnect()
    requestAnimationFrame(() => setTimeout(() => {
      const el = build()
      box.innerHTML = ''; box.style.minHeight = ''
      box.append(el); el.classList?.add('sk-fade')
    }, REDUCED ? 0 : 260))
  }, { rootMargin: '300px 0px' })
  io.observe(box)
  return box
}

// ------------------------------------------------------------
//  AUTO COMPLETE — attach to an input; source(q) -> [{label(html), value, hint, kind}]
//  keyboard: ↑ ↓ Enter Tab Esc ; mouse/touch select
// ------------------------------------------------------------
export function autocomplete(input, source, { onPick, min = 1, max = 8, ghost = true } = {}) {
  const list = h('ul.ac-list', { role: 'listbox', id: 'ac-' + Math.random().toString(36).slice(2, 8) })
  const wrap = input.parentElement
  wrap.classList.add('ac-host')
  wrap.append(list)
  const gh = ghost ? h('span.ac-ghost', { 'aria-hidden': 'true' }) : null
  if (gh) wrap.append(gh)
  input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-controls', list.id); input.setAttribute('aria-expanded', 'false')
  let items = [], sel = 0, open = false
  const render = () => {
    list.innerHTML = ''
    items.forEach((it, i) => list.append(h('li.ac-item', { role: 'option', id: list.id + '-' + i, 'aria-selected': String(i === sel), class: i === sel ? 'on' : '', onpointerdown: (e) => { e.preventDefault(); pick(i) } },
      it.kind ? h('span.ac-kind', { class: 'k-' + (it.kindCls || '') }, it.kind) : null, h('span.ac-label', { html: it.label }), it.hint ? h('span.ac-hint', it.hint) : null)))
    list.classList.toggle('on', open && items.length > 0)
    input.setAttribute('aria-expanded', String(open && items.length > 0))
    if (items[sel]) input.setAttribute('aria-activedescendant', list.id + '-' + sel)
    if (gh) {
      const it = items[sel], q = input.value
      const v = it && it.complete
      gh.textContent = open && v && v.toLowerCase().startsWith(q.toLowerCase()) && q ? q + v.slice(q.length) : ''
      gh.style.setProperty('--pad', getComputedStyle(input).paddingLeft)
    }
  }
  const update = () => {
    const q = input.value
    if (q.trim().length < min) { items = []; open = false; render(); return }
    items = source(q, input).slice(0, max)
    sel = 0; open = true; render()
  }
  const pick = (i) => {
    const it = items[i]; if (!it) return
    open = false; render()
    onPick ? onPick(it, input) : (input.value = it.value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    setTimeout(() => { items = []; render() }, 0)
  }
  input.addEventListener('input', (e) => { if (e.isTrusted || e.inputType) update() })
  input.addEventListener('focus', update)
  input.addEventListener('blur', () => setTimeout(() => { open = false; render() }, 120))
  input.addEventListener('keydown', (e) => {
    if (!open || !items.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); sel = (sel + 1) % items.length; render() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); sel = (sel - 1 + items.length) % items.length; render() }
    else if (e.key === 'Enter' || (e.key === 'Tab' && items[sel]?.complete)) { e.preventDefault(); e.stopImmediatePropagation(); pick(sel) }
    else if (e.key === 'Escape') { open = false; render() }
  }, true)
  return { update, close: () => { open = false; render() } }
}

// fuzzy scorer: returns {score, html} or null. Matches subsequence; contiguous & prefix boosted.
export function fuzzy(q, text) {
  q = q.trim().toLowerCase(); if (!q) return { score: 0, html: esc(text) }
  const t = text.toLowerCase()
  const at = t.indexOf(q)
  if (at >= 0) return { score: 100 - at + (at === 0 ? 50 : 0) - text.length * 0.1, html: esc(text.slice(0, at)) + '<mark>' + esc(text.slice(at, at + q.length)) + '</mark>' + esc(text.slice(at + q.length)) }
  let i = 0, out = '', score = 0, run = 0
  for (let k = 0; k < text.length; k++) {
    if (i < q.length && t[k] === q[i]) { out += '<mark>' + esc(text[k]) + '</mark>'; i++; run++; score += 2 + run } else { out += esc(text[k]); run = 0 }
  }
  return i === q.length ? { score: score - text.length * 0.2, html: out } : null
}
