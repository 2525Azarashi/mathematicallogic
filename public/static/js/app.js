import { h, $, $$, observeReveal } from './lib/ui.js'
import { BRAND, avatar } from './lib/chars.js'
import { LECTURES } from './lectures/index.js'
import { homePage } from './pages/home.js'
import { lecturePage } from './pages/lecture.js'
import { toolsPage } from './pages/tools.js'
import { glossaryPage, sheetPage } from './pages/reference.js'

const app = $('#app')
const nav = h('header.nav', h('div.wrap.nav-in',
  h('a.brand', { href: '#/', html: BRAND + '<span>Tiny Tautology<small>数理論理学 2026 の遊び場</small></span>' }),
  h('nav.nav-links', { id: 'nav-links' },
    h('a', { href: '#/', dataset: { r: 'home' } }, 'ホーム'),
    h('a', { href: `#/lec/${LECTURES[LECTURES.length - 1].slug}`, dataset: { r: 'lec' } }, '講義'),
    h('a', { href: '#/tools', dataset: { r: 'tools' } }, 'ラボ'),
    h('a', { href: '#/sheet', dataset: { r: 'sheet' } }, 'チートシート'),
    h('a', { href: '#/glossary', dataset: { r: 'glossary' } }, '用語集')),
  h('button.nav-btn', { type: 'button', onclick: () => openPal(), 'aria-label': '検索' }, '🔍', h('span.lbl', 'さがす'), h('kbd', '/')),
  h('button.icon-btn.menu-btn', { type: 'button', 'aria-label': 'メニュー', onclick: () => $('#nav-links').classList.toggle('open') }, '☰')))
document.body.prepend(h('div.read-bar'), nav)
document.body.append(h('footer.foot', h('div.wrap.foot-in',
  h('div.foot-cast', h('div.avs', h('div', { html: avatar('S', 'happy') }), h('div', { html: avatar('R', 'happy') })), h('span', 'またね！ — Tiny Tautology は「数理論理学（2026年度）」の非公式学習サイトです。正式な情報は講義ページを確認してください。')),
  h('div.mono', `${LECTURES.length} lectures · ⊢ ⇔ ⊨`))))

// ---------- command palette ----------
const items = [
  ...LECTURES.flatMap((l) => [
    { k: `第${l.no}回`, t: l.title, href: `#/lec/${l.slug}`, kw: l.tags.join(' ') + ' ' + l.tinyFx },
    ...l.chapters.map((c) => ({ k: `第${l.no}回`, t: c.title, href: `#/lec/${l.slug}/${c.id}`, kw: c.en })),
    { k: `第${l.no}回`, t: `演習問題 ex${l.no}`, href: `#/lec/${l.slug}/ex` },
  ]),
  { k: 'ツール', t: '論理式ラボ（構文木・真理値表・CNF・Wang）', href: '#/tools' },
  { k: 'ツール', t: 'チートシート', href: '#/sheet' },
  { k: 'ツール', t: '用語集', href: '#/glossary' },
]
const palIn = h('input', { type: 'search', placeholder: '章・キーワードで移動（例：CNF, Wang, 充足）', 'aria-label': 'サイト内検索' })
const palList = h('ul')
const pal = h('div.pal-bg', { onclick: (e) => { if (e.target === pal) closePal() } }, h('div.pal', { role: 'dialog', 'aria-label': 'サイト内検索' }, palIn, palList))
document.body.append(pal)
let palSel = 0
function drawPal() {
  const q = palIn.value.trim().toLowerCase()
  const hit = items.filter((i) => !q || (i.k + i.t + (i.kw || '')).toLowerCase().includes(q)).slice(0, 30)
  palSel = Math.min(palSel, Math.max(0, hit.length - 1))
  palList.innerHTML = ''
  hit.forEach((i, k) => palList.append(h('li', h('a', { href: i.href, class: k === palSel ? 'on' : '', onclick: closePal }, h('span.k', i.k), i.t))))
}
function openPal() { pal.classList.add('on'); palIn.value = ''; palSel = 0; drawPal(); palIn.focus() }
function closePal() { pal.classList.remove('on') }
palIn.addEventListener('input', () => { palSel = 0; drawPal() })
palIn.addEventListener('keydown', (e) => {
  const n = palList.children.length
  if (e.key === 'ArrowDown') { e.preventDefault(); palSel = (palSel + 1) % n; drawPal() }
  if (e.key === 'ArrowUp') { e.preventDefault(); palSel = (palSel - 1 + n) % n; drawPal() }
  if (e.key === 'Enter') { const a = palList.querySelectorAll('a')[palSel]; if (a) { location.hash = a.getAttribute('href'); closePal() } }
})
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePal()
  if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openPal() }
})

// ---------- router ----------
let first = true
function route() {
  const [, page, a, b] = (location.hash || '#/').split('/')
  if (app._cleanup) { app._cleanup(); app._cleanup = null }
  const render = () => {
    app.innerHTML = ''
    document.documentElement.style.removeProperty('--lec'); document.documentElement.style.removeProperty('--lec-l')
    $('.read-bar').style.width = '0'
    $$('.nav-links a').forEach((x) => x.classList.toggle('on', x.dataset.r === (page || 'home')))
    $('#nav-links').classList.remove('open')
    const titles = { tools: '論理式ラボ', sheet: 'チートシート', glossary: '用語集' }
    if (page === 'lec') { lecturePage(app, a, b); const l = LECTURES.find((x) => x.slug === a); document.title = l ? `第${l.no}回 ${l.title} — Tiny Tautology` : 'Tiny Tautology' }
    else if (titles[page]) { ({ tools: toolsPage, sheet: sheetPage, glossary: glossaryPage })[page](app); document.title = `${titles[page]} — Tiny Tautology` }
    else { homePage(app); document.title = 'Tiny Tautology — 数理論理学 2026 の遊び場' }
    if (!(page === 'lec' && b)) scrollTo(0, 0)
    observeReveal(app)
    app.classList.remove('leaving'); app.classList.add('entering')
    setTimeout(() => app.classList.remove('entering'), 500)
  }
  if (first) { first = false; render() } else { app.classList.add('leaving'); setTimeout(render, 170) }
}
// in-page chapter links like #/lec/lec02/sem shouldn't re-render when already there
let lastKey = ''
addEventListener('hashchange', () => {
  const [, page, a] = location.hash.split('/')
  const key = `${page}/${a}`
  if (key === lastKey && page === 'lec') { const [, , , b] = location.hash.split('/'); const t = document.getElementById('c-' + b); if (t) scrollTo({ top: t.getBoundingClientRect().top + scrollY - 80, behavior: 'smooth' }); return }
  lastKey = key
  route()
})
lastKey = (() => { const [, p, a] = (location.hash || '#/').split('/'); return `${p}/${a}` })()
route()
