import { h, $, $$, observeReveal } from './lib/ui.js'
import { BRAND, avatar } from './lib/chars.js'
import { LECTURES } from './lectures/index.js'
import { homePage } from './pages/home.js'
import { lecturePage } from './pages/lecture.js'
import { toolsPage } from './pages/tools.js'
import { glossaryPage, sheetPage } from './pages/reference.js'
import { animateRoot, pageWipe, initCursor, intro, splitChars } from './lib/motion.js'
import { reviewPage } from './pages/review.js'
import { skeleton, closeSheet } from './lib/patterns.js'
import { siteSource, siteItems, openTerm, updateBadge } from './lib/features.js'

const app = $('#app')
const nav = h('header.nav', h('div.wrap.nav-in',
  h('a.brand.wave-hover', { href: '#/', html: BRAND + '<span><span class="bt">Tiny Tautology</span><small>数理論理学 2026 の遊び場</small></span>' }),
  h('nav.nav-links', { id: 'nav-links' },
    h('a', { href: '#/', dataset: { r: 'home' } }, 'ホーム'),
    h('a', { href: `#/lec/${LECTURES[LECTURES.length - 1].slug}`, dataset: { r: 'lec' } }, '講義'),
    h('a', { href: '#/tools', dataset: { r: 'tools' } }, 'ラボ'),
    h('a', { href: '#/sheet', dataset: { r: 'sheet' } }, 'チートシート'),
    h('a', { href: '#/glossary', dataset: { r: 'glossary' } }, '用語集'),
    h('a', { href: '#/review', dataset: { r: 'review' } }, '復習', h('span.badge', { 'aria-label': '未完了の数' }))),
  h('button.nav-btn', { type: 'button', onclick: () => openPal(), 'aria-label': '検索' }, '🔍', h('span.lbl', 'さがす'), h('kbd', '/')),
  h('button.icon-btn.menu-btn', { type: 'button', 'aria-label': 'メニュー', onclick: () => $('#nav-links').classList.toggle('open') }, '☰')))
document.body.prepend(h('div.read-bar'), nav)
splitChars(nav.querySelector('.bt'))
document.body.append(h('footer.foot', h('div.wrap.foot-in',
  h('div.foot-cast', h('div.avs', h('div', { html: avatar('S', 'happy') }), h('div', { html: avatar('R', 'happy') })), h('span', 'またね！ — Tiny Tautology は「数理論理学（2026年度）」の非公式学習サイトです。正式な情報は講義ページを確認してください。')),
  h('div.mono', `${LECTURES.length} lectures · ⊢ ⇔ ⊨`))))

// ---------- command palette (fuzzy autocomplete) ----------
const palIn = h('input', { type: 'search', placeholder: '章・用語・キーワード（例：cnf, わん, 充足）', 'aria-label': 'サイト内検索' })
const palList = h('ul')
const pal = h('div.pal-bg', { onclick: (e) => { if (e.target === pal) closePal() } }, h('div.pal', { role: 'dialog', 'aria-label': 'サイト内検索' }, palIn, palList))
document.body.append(pal)
let palSel = 0
let palHit = []
function drawPal() {
  const q = palIn.value.trim()
  palHit = q ? siteSource(q).slice(0, 24) : siteItems().filter((i) => !i.term).slice(-12).reverse().map((i) => ({ ...i, label: i.t }))
  palSel = Math.min(palSel, Math.max(0, palHit.length - 1))
  palList.innerHTML = ''
  if (!palHit.length) palList.append(h('li.pal-empty', 'みつからない… ひらがな・英語でも試してみて'))
  palHit.forEach((i, k) => palList.append(h('li', h('a', { href: i.href || '#', class: k === palSel ? 'on' : '', onclick: (e) => { e.preventDefault(); goPal(i) }, onpointermove: () => { if (palSel !== k) { palSel = k; markPal() } } },
    h('span.k.ac-kind', { class: 'k-' + (i.kindCls || '') }, i.kind), h('span', { html: i.label }), i.hint ? h('small.pal-hint', i.hint) : null))))
  if (!q) palList.prepend(h('li.pal-cap', 'よく使う場所'))
}
function markPal() { palList.querySelectorAll('a').forEach((a, k) => a.classList.toggle('on', k === palSel)); palList.querySelectorAll('a')[palSel]?.scrollIntoView({ block: 'nearest' }) }
function goPal(i) { closePal(); if (i.term) openTerm(i.term); else location.hash = i.href }
function openPal() { pal.classList.add('on'); palIn.value = ''; palSel = 0; drawPal(); palIn.focus() }
function closePal() { pal.classList.remove('on') }
palIn.addEventListener('input', () => { palSel = 0; drawPal() })
palIn.addEventListener('keydown', (e) => {
  const n = palHit.length; if (!n) return
  if (e.key === 'ArrowDown') { e.preventDefault(); palSel = (palSel + 1) % n; markPal() }
  if (e.key === 'ArrowUp') { e.preventDefault(); palSel = (palSel - 1 + n) % n; markPal() }
  if (e.key === 'Enter') { e.preventDefault(); goPal(palHit[palSel]) }
})
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && pal.classList.contains('on')) closePal()
  if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openPal() }
})

// ---------- router ----------
let first = true
function route() {
  const [, page, a, b] = (location.hash || '#/').split('/')
  closeSheet()
  if (app._cleanup) { app._cleanup(); app._cleanup = null }
  app._jump = null
  const render = () => {
    app.innerHTML = ''
    document.documentElement.style.removeProperty('--lec'); document.documentElement.style.removeProperty('--lec-l')
    $('.read-bar').style.width = '0'
    $$('.nav-links a').forEach((x) => x.classList.toggle('on', x.dataset.r === (page || 'home')))
    $('#nav-links').classList.remove('open')
    const titles = { tools: '論理式ラボ', sheet: 'チートシート', glossary: '用語集', review: '復習リスト' }
    if (page === 'lec') { lecturePage(app, a, b); const l = LECTURES.find((x) => x.slug === a); document.title = l ? `第${l.no}回 ${l.title} — Tiny Tautology` : 'Tiny Tautology' }
    else if (titles[page]) { ({ tools: toolsPage, sheet: sheetPage, glossary: glossaryPage, review: reviewPage })[page](app); document.title = `${titles[page]} — Tiny Tautology` }
    else { homePage(app); document.title = 'Tiny Tautology — 数理論理学 2026 の遊び場' }
    if (!(page === 'lec' && b)) scrollTo(0, 0)
    const h1 = app.querySelector('[data-hero-h1]')
    if (h1) splitChars(h1)
    animateRoot(app, { fresh: true })
    observeReveal(app)
    animateRoot(nav)
    updateBadge()
  }
  const label = page === 'lec' ? (() => { const l = LECTURES.find((x) => x.slug === a); return l ? `第${l.no}回 ${l.title.replace(/^.*— /, '')}` : '' })() : ({ tools: '論理式ラボ', sheet: 'チートシート', glossary: '用語集', review: '復習リスト' })[page] || 'Tiny Tautology'
  const color = page === 'lec' ? (LECTURES.find((x) => x.slug === a) || {}).color : null
  if (first) { first = false; intro().then(() => {}); render() } else {
    // skeleton screen: wipe covers → skeleton is revealed as the wipe peels away → real page fades in
    pageWipe(label, color).then(() => {
      app.innerHTML = ''; scrollTo(0, 0)
      app.append(skeleton(page === 'lec' ? 'lecture' : page === 'review' ? 'list' : 'card'))
      setTimeout(() => { render(); app.classList.remove('sk-in'); void app.offsetWidth; app.classList.add('sk-in') }, 340)
    })
  }
}
// in-page chapter links like #/lec/lec02/sem shouldn't re-render when already there
let lastKey = ''
addEventListener('hashchange', () => {
  const [, page, a] = location.hash.split('/')
  const key = `${page}/${a}`
  if (key === lastKey && page === 'lec') { const [, , , b] = location.hash.split('/'); if (b && app._jump) app._jump(b); return }
  lastKey = key
  route()
})
// hide nav on scroll down, show on scroll up
let lastY = 0
addEventListener('scroll', () => { const y = scrollY; nav.classList.toggle('hide', y > 300 && y > lastY + 4); if (y < lastY - 4 || y < 300) nav.classList.remove('hide'); lastY = y }, { passive: true })
initCursor()
lastKey = (() => { const [, p, a] = (location.hash || '#/').split('/'); return `${p}/${a}` })()
route()
