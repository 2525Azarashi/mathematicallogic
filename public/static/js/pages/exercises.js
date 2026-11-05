// ============================================================
//  演習解説ページ  #/ex , #/ex/<ex1..ex5>
//  各問題を「考え方（対話）→ ヒント → 解答例 → 採点ポイント → よくあるミス → ラボ」で並べる
// ============================================================
import { h, talk, rich, fxs, tv, lab, callout, store, $$ } from '../lib/ui.js'
import { LECTURES, dueOf } from '../lectures/index.js'
import { EXSETS } from '../data/exsets.js'
import { EXPLAIN, REPORT_TIPS } from '../data/explain.js'
import { parse, parseSequent, evaluate, wang } from '../logic/core.js'
import { truthTable } from '../widgets/truth-table.js'
import { cnfStepper } from '../widgets/cnf.js'
import { resolutionBoard } from '../widgets/resolution.js'
import { proofBuilder } from '../widgets/proof.js'
import { staticTree } from '../widgets/proof-static.js'
import { EX5 } from '../data/ex5.js'
import { EX6 } from '../data/ex6.js'
import { saveButton, linkTerms } from '../lib/features.js'
import { splitChars } from '../lib/motion.js'

// 問題ごとの「講義のどの章で復習するか」とラボ（ex1〜ex4）
const SEE = { '1.1': ['lec01', 'set'], '1.2': ['lec01', 'power'], '1.3': ['lec01', 'rel'], '2.1': ['lec02', 'syntax'], '2.2': ['lec02', 'sem'], '2.3': ['lec02', 'valid'], '3.1': ['lec03', 'imp'], '3.2': ['lec03', 'clause'], '3.3': ['lec03', 'res'], '4.1': ['lec04', 'lk'], '4.2 (1)': ['lec04', 'proof'], '4.2 (2)': ['lec04', 'proof'] }
const SEE6 = { '6.1': ['lec06', 'syntax'], '6.2': ['lec06', 'bind'], '6.3': ['lec06', 'lang'] }
const LABS = {
  '2.2': ['🧪 真理値表を触る', () => truthTable([parse('(P ∧ Q) ∨ ¬P'), parse('¬Q ⊃ ¬P')], { columns: 'all' }).el],
  '3.2': ['🧪 CNF 変換を 1 手ずつ', () => cnfStepper(parse('¬(P ∧ (Q ∨ R))'))],
  '3.3': ['🧪 自分で導出してみる', () => resolutionBoard([['P', 'Q', 'R'], ['¬P', 'R'], ['¬Q'], ['¬R']])],
  '4.2 (1)': ['🧪 証明図を自分で組む', () => proofBuilder(parseSequent('→ P ∨ ¬P'))],
  '4.2 (2)': ['🧪 証明図を自分で組む', () => proofBuilder(parseSequent('→ (P ∨ Q) ∨ R ⊃ P ∨ (Q ∨ R)'))],
}

function problemsOf(set) {
  if (set.no === 6) return EX6.map((p) => ({ ...p, see: SEE6[p.no] }))
  if (set.no === 5) return EX5
  const lec = LECTURES.find((l) => l.slug === set.lec)
  return (lec?.exercises || []).map((p) => ({ ...p, see: SEE[p.no], lab: LABS[p.no]?.[1], labLabel: LABS[p.no]?.[0] }))
}

// ---------- problem card ----------
function xpCard(p, set) {
  const e = EXPLAIN[p.no] || p.explain || {}
  const steps = h('div.ex-steps'), reveal = h('div.ex-reveal')
  const add = (label, build, cls = '') => {
    const pane = h('div.pane')
    reveal.append(pane)
    let built = false
    const b = h('button.btn.sm', { type: 'button', class: cls, 'aria-expanded': 'false', onclick: () => {
      if (!built) { built = true; pane.append(build()) }
      const on = !pane.classList.contains('on')
      pane.classList.toggle('on', on); b.classList.toggle('primary', on); b.setAttribute('aria-expanded', String(on))
    } }, label)
    steps.append(b)
  }
  if (p.hint) add('💡 ヒント', () => h('div.hint-box', h('h5', 'HINT'), h('div', { html: rich(p.hint) })))
  if (p.answer) add('✓ 解答例', () => h('div.ans', h('h5', 'ANSWER'), typeof p.answer === 'function' ? p.answer() : typeof p.answer === 'string' ? h('div', { html: rich(p.answer) }) : p.answer.cloneNode(true)))
  ;(p.extra || []).forEach(([label, build]) => add(label, build))
  if (e.points) add('📋 採点ポイント', () => h('div.xp-points', h('h5', '採点ポイント — ここが書けていれば OK'), h('ul', ...e.points.map((x) => h('li', { html: rich(x) })))))
  if (e.miss) add('⚠️ よくあるミス', () => h('div.xp-miss', h('h5', 'よくあるミス'), h('ul', ...e.miss.map((x) => h('li', { html: rich(x) })))))
  if (p.lab) add(p.labLabel || '🧪 ラボ', () => h('div.xp-lab', p.lab()))
  const lec = p.see && LECTURES.find((l) => l.slug === p.see[0])
  const chap = lec && lec.chapters.find((c) => c.id === p.see[1])
  const slugNo = p.no.replace(/\D+/g, '-').replace(/-$/, '')
  return h('article.ex.xp.reveal', { id: 'p-' + slugNo },
    h('div.ex-head', h('span.no', p.no), h('div.q-txt', { html: rich(p.q) }),
      saveButton({ id: set.lec ? `ex:${set.lec}:${problemsOf(set).indexOf(p)}` : `ex:${set.id}:${p.no}`, kind: 'ex', title: `演習 ${p.no}：` + String(p.q).replace(/<[^>]+>/g, '').slice(0, 70), sub: `ex${set.no} ${set.topic}`, href: `#/ex/${set.id}` })),
    h('div.ex-body',
      e.think ? h('div.xp-think', h('div.xp-label', h('span', '考え方'), h('small', 'サカイ × リョウガ')), talk(e.think)) : null,
      steps, reveal,
      chap ? h('div.xp-foot', h('a', { href: `#/lec/${lec.slug}/${chap.id}` }, h('small', `第${lec.no}回で復習`), chap.title, h('span.arr', ' →'))) : null))
}

const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}（${'日月火水木金土'[d.getDay()]}）23:59`
const daysLeft = (d) => Math.ceil((d - new Date()) / 864e5)

export function exercisesPage(root, anchor) {
  const now = new Date()
  const sets = EXSETS.map((s) => ({ ...s, due: dueOf({ date: s.date }), probs: problemsOf(s) }))
  const total = sets.reduce((n, s) => n + s.probs.length, 0)
  const next = [...sets].reverse().find((s) => s.due > now)

  const title = h('h1', h('span.xp-title-t', '演習解説'), h('span.sub', 'ex1〜ex5 を「考え方 → 解答例 → 採点ポイント」で'))
  splitChars(title.firstChild)
  const hero = h('section.lec-hero.wrap', { 'data-scroll': '' }, h('div.ghost-word', { 'aria-hidden': 'true' }, 'EX'),
    h('div.crumbs', h('a', { href: '#/' }, 'ホーム'), '／', '演習解説'),
    h('div.lec-hero-grid',
      h('div.big-no', { style: { background: '#ffe1ec', fontSize: '54px' } }, '✎'),
      h('div', title, h('div.meta', h('span.chip', `${sets.length} セット`), h('span.chip', `${total} 問`), h('span.chip', { style: { background: 'var(--top-l)' } }, '解答はボタンを押すまで非表示'))),
      next ? h('a.xp-due', { href: `#/ex/${next.id}`, onclick: (e) => { e.preventDefault(); jump(next.id) } }, h('small', 'NEXT DEADLINE'), h('b', `ex${next.no} · ${fmt(next.due)}`), h('em', daysLeft(next.due) <= 1 ? 'あと 1 日！' : `あと ${daysLeft(next.due)} 日`)) : h('span')))

  const tabs = h('nav.xp-tabs.wrap', { 'aria-label': '演習セット' }, ...sets.map((s) => h('a', { href: `#/ex/${s.id}`, style: { '--c': s.color, '--cl': s.colorL }, onclick: (e) => { e.preventDefault(); jump(s.id) } }, h('b', `ex${s.no}`), h('span', s.topic), s.fresh ? h('i.new', 'NEW') : null)))

  const all = [{ id: 'tips', title: '答案の書き方 5 か条' }, ...sets.map((s) => ({ id: s.id, title: `ex${s.no} ${s.topic}`, fresh: s.fresh }))]
  const toc = h('aside.toc', h('div.toc-in', h('h5', 'EXERCISES'), ...all.map((c, k) => h('a', { href: `#/ex/${c.id}`, dataset: { id: c.id }, onclick: (e) => { e.preventDefault(); jump(c.id) } }, h('span.n', k ? String(sets[k - 1].no) : '✓'), c.title, c.fresh ? h('i.new', 'NEW') : null))))

  const main = h('div.lec-main')
  // 0. tips
  main.append(h('section.chap', { id: 'c-tips', dataset: { id: 'tips' } },
    h('div.chap-head.reveal', h('span.n', '✓'), h('h2', '答案の書き方 5 か条', h('small', 'How to write a full-score answer'))),
    talk(`R: 演習、提出したあとに「結局どう書けば満点だったの？」ってモヤモヤするんですよね。
S[happy]: じゃあここで振り返ろう。各問題を **考え方 → ヒント → 解答例 → 採点ポイント → よくあるミス** の順に並べたよ。最新の ex5 も解説つき。
R: 解答例は、自分で解いてから開く…ですよね。
S: その通り。ボタンを押すまで隠してあるから、まずヒントだけ見て手を動かしてね。`),
    h('div.xp-tips', ...REPORT_TIPS.map(([t, d], i) => h('div.xp-tip.reveal', h('span.i', String(i + 1)), h('b', t), h('p', { html: rich(d) }))))))
  // sets (latest first)
  sets.forEach((s) => {
    const lec = s.lec && LECTURES.find((l) => l.slug === s.lec)
    const d = daysLeft(s.due)
    const sec = h('section.chap.xp-set', { id: 'c-' + s.id, dataset: { id: s.id }, style: { '--accent': s.color, '--accent-l': s.colorL } },
      h('div.chap-head.reveal', h('span.n', String(s.no)), h('h2', `ex${s.no}　${s.topic}`, h('small', `Exercise ${s.no} · 第${s.no}回（${s.date}）`))),
      h('div.xp-meta.reveal',
        h('span.chip', { class: s.due > now ? 'due-open' : '' }, s.due > now ? `⏰ 締切 ${fmt(s.due)} · あと ${d} 日` : `締切済（${fmt(s.due)}）`),
        h('span.chip', `${s.probs.length} 問`),
        ...s.tags.map((t) => h('span.chip.tag', t)),
        lec ? h('a.chip.link', { href: `#/lec/${lec.slug}` }, `第${lec.no}回の講義ページ →`) : h('span.chip', { style: { opacity: .7 } }, '講義ページは準備中')))
    if (s.no === 6) sec.append(
      talk(`R: ex6 は述語論理の最初の課題。3 問とも「定義どおりに読めるか」の確認ですね。
S: そう。6.1 は「項 → 原子論理式 → 論理式」の**どの段で失敗するか**、6.2 は**スコープ**、6.3 は**日本語を式に**。どれも第6回の定義カードがそのまま武器になる。
R[think]: 6.3 の「どんな素数も」は ∀ と…∧？ ⊃？
S[happy]: そこが最大の落とし穴。答えを開く前に、翻訳チェッカーで ∧ 版を試してみて。`),
      callout('warn', '<b>締切前の課題です（11/5 木 23:59）。</b>まず「ヒント」と「ラボ」で自分の答えを作り、書き終えてから解答例で答え合わせしよう。'))
    if (s.no === 5) sec.append(
      talk(`R: ex5 は「健全性と完全性」の回。5.1 はシーケントの規則なのに、真偽値で証明しろって言われてます。
S: そこがこの回の主役。**健全性**（証明できる ⇒ トートロジ）は、「初期シーケントはトートロジ」＋「**どの規則も、前提がトートロジなら結論もトートロジ**」を確かめれば示せる。5.1 はその (¬右) の確認なんだ。
R[think]: だから「同値変形を使うな」なんですね。使ったら、確かめたいことを先取りしちゃう。
S[happy]: そういうこと。道具は「トートロジの定義」と「真偽値割り当ての定義 (4)〜(7)」だけ。5.2 は第4回と同じ Wang のアルゴリズムだよ。`),
      callout('warn', '<b>締切前の課題です。</b>レポートは自分の理解のために自分で考えて解くもの（講義ページより）。まず「考え方」と「ヒント」で手を動かし、書き終えてから解答例で答え合わせしよう。'))
    s.probs.forEach((p) => sec.append(xpCard(p, s)))
    main.append(sec)
  })

  root.append(hero, tabs, h('div.wrap.lec-layout', toc, main))
  linkTerms(main)

  // toc highlight
  const secs = [...main.querySelectorAll('.chap')]
  const onScroll = () => {
    let cur = secs[0]
    for (const s of secs) if (s.getBoundingClientRect().top < innerHeight * 0.35) cur = s
    $$('a', toc).forEach((a) => a.classList.toggle('on', a.dataset.id === cur.dataset.id))
    $$('a', tabs).forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#/ex/${cur.dataset.id}`))
    const bar = document.querySelector('.read-bar')
    if (bar) { const d = document.documentElement; bar.style.width = (d.scrollTop / (d.scrollHeight - innerHeight)) * 100 + '%' }
  }
  addEventListener('scroll', onScroll, { passive: true })
  root._cleanup = () => removeEventListener('scroll', onScroll)
  // content-visibility makes off-screen heights estimates: instant jump, then re-correct until stable
  function jump(id, smooth = true) {
    const t = document.getElementById('c-' + id)
    if (!t) return
    history.replaceState(null, '', `#/ex/${id}`)
    const target = () => t.getBoundingClientRect().top + scrollY - 80
    if (smooth && Math.abs(t.getBoundingClientRect().top) < innerHeight * 1.5) { scrollTo({ top: target(), behavior: 'smooth' }); return }
    let n = 0
    const fix = () => { const y = target(); if (Math.abs(y - scrollY) > 2) scrollTo(0, y); if (++n < 14) requestAnimationFrame(() => setTimeout(fix, 60)) }
    fix()
  }
  root._jump = (id) => jump(id)
  if (anchor) requestAnimationFrame(() => jump(anchor, false))
  store.set('ex-visit', Date.now())
}
