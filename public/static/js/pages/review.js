import { h, html, fxs, rich, talk, confettiAt } from '../lib/ui.js'
import { toto } from '../lib/chars.js'
import { swipeable, toast, skeleton } from '../lib/patterns.js'
import { review, updateBadge, openTerm } from '../lib/features.js'
import { LECTURES } from '../lectures/index.js'

// Review list: swipe right = 覚えた (done) / swipe left = 削除 (with Undo toast)
export function reviewPage(root) {
  let tab = 'todo'
  const list = h('div.rv-list')
  const stats = h('div.rv-stats')
  const tabs = h('div.seg.rv-tabs', { role: 'tablist' },
    ...[['todo', '復習する'], ['done', '覚えた'], ['all', 'すべて']].map(([v, l]) => h('button', { type: 'button', dataset: { v }, onclick: () => { tab = v; draw() } }, l)))

  function stat(n, label, c) { return h('div.ls', { style: { background: c } }, h('b', String(n)), h('span', label)) }
  function draw() {
    ;[...tabs.children].forEach((b) => b.classList.toggle('on', b.dataset.v === tab))
    const all = review.all()
    stats.innerHTML = ''
    stats.append(stat(all.filter((x) => !x.done).length, '復習する', 'var(--or-l)'), stat(all.filter((x) => x.done).length, '覚えた', 'var(--top-l)'), stat(all.length, 'ぜんぶ', '#fff'))
    const items = all.filter((x) => (tab === 'all' ? true : tab === 'done' ? x.done : !x.done))
    list.innerHTML = ''
    if (!items.length) {
      list.append(html(`<div class="rv-empty">${toto(tab === 'done' ? 'bot' : 'top')}<b>${tab === 'done' ? 'まだ「覚えた」はありません' : 'ここは空っぽ'}</b><p>${tab === 'done' ? 'カードを右にスワイプすると「覚えた」に移ります。' : '類題の「☆ あとで復習」や、用語のシートから追加できます。'}</p></div>`))
      if (tab !== 'done') list.firstChild.append(h('a.btn.sm.yellow', { href: `#/lec/${LECTURES[LECTURES.length - 1].slug}/quiz` }, '類題を解きにいく →'))
      return
    }
    items.forEach((it) => list.append(row(it)))
  }
  function row(it) {
    const kindLabel = { quiz: '類題', term: '用語', formula: '式', ex: '演習' }[it.kind] || 'メモ'
    const go = () => { if (it.kind === 'term') openTerm(it.title); else if (it.href) location.hash = it.href }
    const card = h('div.sw-card', { 'data-cursor': 'スワイプ' },
      h('span.chip', { style: { background: it.kind === 'term' ? 'var(--imp-l)' : it.kind === 'quiz' ? 'var(--or-l)' : 'var(--and-l)' } }, kindLabel),
      h('div.sw-fx', h('span', { html: rich(it.title) }), it.sub ? h('span.sw-meta', { html: rich(it.sub).slice(0, 400) }) : null),
      h('div.sw-btns',
        h('button.ok', { type: 'button', 'aria-label': it.done ? '復習に戻す' : '覚えた', title: it.done ? '復習に戻す' : '覚えた', onclick: () => done() }, it.done ? '↺' : '✓'),
        h('button', { type: 'button', 'aria-label': 'ひらく', title: 'ひらく', onclick: go }, '→'),
        h('button.del', { type: 'button', 'aria-label': '削除', title: '削除', onclick: () => del() }, '×')),
      h('span.sw-grip', { 'aria-hidden': 'true' }, '⋮⋮'))
    const r = h('div.sw-row', h('div.sw-under', h('span.sw-l', h('b', it.done ? '↺' : '✓'), it.done ? '復習に戻す' : '覚えた！'), h('span.sw-r', '削除', h('b', '×'))), card)
    const collapse = (fn) => { r.style.height = r.offsetHeight + 'px'; requestAnimationFrame(() => { r.classList.add('gone'); r.style.height = '0px'; r.style.marginTop = '0px'; r.style.opacity = '0'; r.style.borderWidth = '0px' }); setTimeout(fn, 420) }
    function done() {
      const x = review.toggleDone(it.id)
      if (x && x.done) { confettiAt(card); toast({ msg: `「${strip(it.title)}」を覚えた！`, type: 'ok', action: { label: '元に戻す', fn: () => { review.toggleDone(it.id); draw() } } }) }
      else toast({ msg: '復習リストに戻しました', type: 'info' })
      collapse(draw)
    }
    function del() {
      const rem = review.remove(it.id)
      toast({ msg: `「${strip(it.title)}」を削除しました`, type: 'err', icon: '×', action: { label: '元に戻す', fn: () => { review.restore(rem); draw() } } })
      collapse(draw)
    }
    swipeable(r, { onRight: done, onLeft: del, threshold: 90 })
    // the swipe module translates the row element itself via --sx; map it to the card
    return r
  }
  const strip = (s) => s.replace(/\$|<[^>]+>/g, '').slice(0, 24)

  const box = h('div', skeleton('list'))
  root.append(
    h('section.lec-hero.wrap', h('div.crumbs', h('a', { href: '#/' }, 'ホーム'), '／', '復習リスト'),
      h('div.lec-hero-grid', { style: { gridTemplateColumns: 'auto 1fr' } }, h('div.big-no', { style: { background: '#fff3c2', fontSize: '54px' } }, '★'), h('div', h('h1', '復習リスト', h('span.sub', 'あとで見直したい類題・用語を、カードでさっと片づける'))))),
    h('section.wrap', { style: { paddingBottom: '70px', maxWidth: '820px' } },
      talk(`R: 間違えた問題、どうやって復習すればいいですか？
S[happy]: 「☆ あとで復習」で集めておいて、ここで片づけよう。**右にスワイプで「覚えた」、左で削除**。間違えて消しても「元に戻す」が出るから大丈夫。`),
      h('div.sw-hint', h('span.demo'), 'カードを左右にスワイプ（PC はドラッグ、またはボタン）'),
      stats, tabs, box))
  // brief skeleton then real list (local data is instant; the skeleton prevents layout jump on slow devices)
  setTimeout(() => { box.innerHTML = ''; box.append(list); draw(); list.classList.add('sk-fade') }, 280)
  updateBadge()
}
