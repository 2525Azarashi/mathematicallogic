import { h, talk, store, $$ } from '../lib/ui.js'
import { avatar } from '../lib/chars.js'
import { LECTURES, dueOf } from '../lectures/index.js'
import { quiz, exercise } from '../widgets/quiz.js'
import { LEC_INFO, lecStats } from '../widgets/infographic.js'
import { splitChars } from '../lib/motion.js'

export function lecturePage(root, slug, anchor) {
  const i = LECTURES.findIndex((l) => l.slug === slug)
  const lec = LECTURES[i]
  if (!lec) { root.append(h('section.wrap.section', h('h2', '見つかりませんでした'), h('a.btn', { href: '#/' }, 'ホームへ'))); return }
  document.documentElement.style.setProperty('--lec', lec.color)
  document.documentElement.style.setProperty('--lec-l', lec.colorL)
  const due = dueOf(lec)

  const titleEl = h('h1', h('span.lec-title-t', lec.title), h('span.sub', lec.sub))
  splitChars(titleEl.firstChild)
  const bigFx = h('div.lec-big-fx.kt.kt-rise.kt-now', lec.tinyFx)
  splitChars(bigFx)
  const hero = h('section.lec-hero.wrap', { 'data-scroll': '' }, h('div.ghost-word', { 'aria-hidden': 'true' }, String(lec.no).padStart(2, '0')),
    h('div.crumbs', h('a', { href: '#/' }, 'ホーム'), '／', h('span', `第${lec.no}回`)),
    h('div.lec-hero-grid',
      h('div.big-no', h('span.digit', String(lec.no))),
      h('div', titleEl,
        h('div.meta', h('span.chip', `📅 ${lec.date}（金）`), h('span.chip', `📝 演習締切 ${due.getMonth() + 1}/${due.getDate()}（木）23:59`), h('span.chip', `💬 ${lec.chapters.length} チャプター`)), bigFx),
      h('div.cast-mini', h('div.av', { html: avatar('S', 'happy') }), h('div.av', { html: avatar('R', 'normal') }))),
    lecStats(lec, due))

  const all = [...lec.chapters.map((c) => ({ id: c.id, title: c.title })), { id: 'ex', title: '演習問題（公式）' }, { id: 'quiz', title: '類題でチェック' }]
  const toc = h('aside.toc', h('div.toc-in', h('h5', 'CONTENTS'), ...all.map((c, k) => h('a', { href: `#/lec/${lec.slug}/${c.id}`, dataset: { id: c.id }, onclick: (e) => { e.preventDefault(); jump(c.id) } }, h('span.n', String(k + 1)), c.title)),
    h('div.pbar', h('i')), h('div.pct')))
  const main = h('div.lec-main')
  lec.chapters.forEach((c, k) => {
    const h2 = h('h2', h('span.ct', c.title), h('small', c.en))
    splitChars(h2.firstChild)
    const sec = h('section.chap', { id: 'c-' + c.id, dataset: { id: c.id } }, h('div.chap-head.reveal', h('span.n', String(k + 1)), h2))
    c.build(sec)
    const infos = (LEC_INFO[lec.slug] || {})[c.id]
    if (infos) { const firstTalk = sec.querySelector('.talk'); const els = infos.map((f) => f()); if (firstTalk) firstTalk.after(...els); else sec.append(...els) }
    main.append(sec)
  })
  const ex = h('section.chap', { id: 'c-ex', dataset: { id: 'ex' } }, h('div.chap-head.reveal', h('span.n', String(lec.chapters.length + 1)), h('h2', { class: 'plain' }, `演習問題 ex${lec.no}`, h('small', 'Official exercises'))),
    talk(`R: 演習、いきなり答えを見たくなっちゃうんですよね…。
S[happy]: まずは自分で。詰まったら「ヒント」、それでもダメなら「解答例」。**できたところまで出す**のが一番の勉強だよ。`),
    ...lec.exercises.map(exercise))
  const qz = h('section.chap', { id: 'c-quiz', dataset: { id: 'quiz' } }, h('div.chap-head.reveal', h('span.n', String(lec.chapters.length + 2)), h('h2', { class: 'plain' }, '類題でチェック', h('small', 'Quick quiz'))),
    talk(`S: 最後に確認テスト。間違えても何度でも押せるし、正解すると理由を話すね。`), quiz(lec.quiz, lec.slug))
  const prev = LECTURES[i - 1], nxt = LECTURES[i + 1]
  const nav = h('div.lec-next', prev ? h('a', { href: `#/lec/${prev.slug}` }, h('small', '← 前の回'), `第${prev.no}回 ${prev.title}`) : h('span'), nxt ? h('a.nx', { href: `#/lec/${nxt.slug}` }, h('small', '次の回 →'), `第${nxt.no}回 ${nxt.title}`) : h('a.nx', { href: '#/tools' }, h('small', '次の回は準備中'), '論理式ラボで遊ぶ →'))
  main.append(ex, qz, nav)

  root.append(hero, h('div.wrap.lec-layout', toc, main))

  // progress tracking
  const seen = new Set(store.get('seen:' + lec.slug, []))
  const pbar = toc.querySelector('.pbar i'), pct = toc.querySelector('.pct')
  const updProg = () => {
    const p = Math.round((seen.size / lec.chapters.length) * 100)
    pbar.style.width = Math.min(100, p) + '%'; pct.textContent = `読んだ割合 ${Math.min(100, p)}%`
    $$('a', toc).forEach((a) => a.classList.toggle('seen', seen.has(a.dataset.id)))
  }
  updProg()
  const secs = [...main.querySelectorAll('.chap')]
  const onScroll = () => {
    let cur = secs[0]
    for (const s of secs) if (s.getBoundingClientRect().top < innerHeight * 0.35) cur = s
    $$('a', toc).forEach((a) => a.classList.toggle('on', a.dataset.id === cur.dataset.id))
    secs.forEach((s) => {
      const r = s.getBoundingClientRect()
      if (r.bottom < innerHeight * 0.9 && lec.chapters.some((c) => c.id === s.dataset.id) && !seen.has(s.dataset.id)) { seen.add(s.dataset.id); store.set('seen:' + lec.slug, [...seen]); updProg() }
    })
    const bar = document.querySelector('.read-bar')
    if (bar) { const d = document.documentElement; bar.style.width = (d.scrollTop / (d.scrollHeight - innerHeight)) * 100 + '%' }
  }
  addEventListener('scroll', onScroll, { passive: true })
  root._cleanup = () => removeEventListener('scroll', onScroll)
  function jump(id) {
    const t = document.getElementById('c-' + id)
    if (t) { scrollTo({ top: t.getBoundingClientRect().top + scrollY - 80, behavior: 'smooth' }); history.replaceState(null, '', `#/lec/${lec.slug}/${id}`) }
  }
  if (anchor) setTimeout(() => jump(anchor), 80)
}
