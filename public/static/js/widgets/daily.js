import { h, rich, say, confettiAt, store } from '../lib/ui.js'
import { pullToRefresh, toast } from '../lib/patterns.js'
import { saveButton } from '../lib/features.js'
import { LECTURES } from '../lectures/index.js'

// "今日の一問": random quiz from released lectures. Pull down (or press ↻) for another.
export function dailyQuestion() {
  const pool = LECTURES.flatMap((l) => l.quiz.map((q, i) => ({ ...q, lec: l, i })))
  let cur = null
  const inner = h('div.daily-in')
  const streak = h('span.streak')
  const card = h('section.daily.reveal', { 'aria-label': '今日の一問' }, inner)
  const updStreak = () => { const s = store.get('daily', { ok: 0, n: 0 }); streak.textContent = `これまで ${s.ok} / ${s.n} 問正解` }
  function pick() {
    let next
    do { next = pool[(Math.random() * pool.length) | 0] } while (pool.length > 1 && next === cur)
    cur = next
    render()
  }
  function render() {
    const q = cur
    inner.innerHTML = ''
    const fb = h('div', { style: { marginTop: '12px' } })
    const opts = h('div.opts')
    let answered = false
    q.opts.forEach((o, k) => opts.append(h('button.opt', { type: 'button', onclick: (e) => {
      if (answered) return
      const ok = k === q.a
      e.currentTarget.classList.add(ok ? 'right' : 'wrong')
      const s = store.get('daily', { ok: 0, n: 0 })
      if (ok) { answered = true; s.ok++; s.n++; confettiAt(e.currentTarget); fb.innerHTML = ''; fb.append(say('S', '正解！ ' + q.why, 'happy')); toast({ msg: '正解！ 下に引っぱると次の問題', type: 'ok' }) }
      else { s.n++; fb.innerHTML = ''; fb.append(say('S', q.hint || 'おしい！ もう一回。', 'think')); toast({ msg: 'おしい！ もう一度選べます', type: 'err' }) }
      store.set('daily', s); updStreak()
    } }, h('span.k', 'ABCD'[k]), h('span', { html: rich(o) }))))
    inner.append(
      h('div.daily-head.swap-in', h('span.ig-tag', 'DAILY'), h('h3', '今日の一問'), h('span.chip', `第${q.lec.no}回`),
        h('span.ptr-tip', h('span.arrow-dn', '↓'), '下に引っぱると次の問題（PC は ↻ ボタン）')),
      h('div.qtext.swap-in', { html: rich(q.q) }), opts, fb,
      h('div.daily-foot', h('button.btn.sm', { type: 'button', onclick: () => ptr.refresh() }, '↻ 別の問題'),
        saveButton({ id: `quiz:${q.lec.slug}:${q.i}`, kind: 'quiz', title: q.q, sub: `第${q.lec.no}回の類題（今日の一問から）`, href: `#/lec/${q.lec.slug}/quiz` }),
        h('a.btn.sm', { href: `#/lec/${q.lec.slug}/quiz` }, `第${q.lec.no}回の類題へ →`), streak))
    updStreak()
  }
  const ptr = pullToRefresh(card, async () => { pick() })
  pick()
  return card
}
