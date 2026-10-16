import { h, rich, say, confettiAt, store } from '../lib/ui.js'

// quiz([{ q, opts:[...], a: index, why, whyWrong? }], key)
export function quiz(items, key) {
  const saved = store.get('quiz:' + key, {})
  const box = h('div.quiz')
  const score = h('div.chip', { style: { alignSelf: 'flex-start' } })
  const upd = () => { const s = store.get('quiz:' + key, {}); const ok = Object.values(s).filter(Boolean).length; score.textContent = `正解 ${ok} / ${items.length}` }
  items.forEach((it, qi) => {
    const fb = h('div.fb')
    const q = h('div.q.reveal', h('span.qn', `Q${qi + 1}`), h('span.ok-stamp', 'OK!'), h('div.qtext', { html: rich(it.q) }))
    const opts = h('div.opts')
    it.opts.forEach((o, oi) => {
      const b = h('button.opt', { type: 'button', onclick: () => pick(oi) }, h('span.k', 'ABCDEF'[oi]), h('span', { html: rich(o) }))
      opts.append(b)
    })
    q.append(opts, fb)
    function pick(oi) {
      const right = oi === it.a
      const bs = [...opts.children]
      bs[oi].classList.add(right ? 'right' : 'wrong')
      if (right) {
        q.classList.add('done', 'done-ok')
        bs.forEach((b, k) => { if (k !== oi) b.style.opacity = '.55' })
        fb.innerHTML = ''
        fb.append(say('S', '正解！ ' + it.why, 'happy'))
        confettiAt(bs[oi])
        const s = store.get('quiz:' + key, {}); s[qi] = true; store.set('quiz:' + key, s); upd()
      } else {
        fb.innerHTML = ''
        fb.append(say('S', (it.hint ? it.hint : 'おしい！ もう一回考えてみよう。'), 'think'))
        const s = store.get('quiz:' + key, {}); if (!s[qi]) { s[qi] = false; store.set('quiz:' + key, s) } upd()
      }
    }
    if (saved[qi]) { q.classList.add('done', 'done-ok'); [...opts.children][it.a].classList.add('right'); fb.append(say('S', it.why, 'happy')) }
    box.append(q)
  })
  upd()
  box.prepend(score)
  return box
}

// exercise card: original 演習 problem with stepwise hint → answer
export function exercise({ no, q, hint, answer, extra }) {
  const panes = []
  const reveal = h('div.ex-reveal')
  const steps = h('div.ex-steps')
  const add = (label, content, cls) => {
    const pane = h('div.pane', content)
    reveal.append(pane)
    const b = h('button.btn.sm', { type: 'button', class: cls, onclick: () => { pane.classList.toggle('on'); b.classList.toggle('primary') } }, label)
    steps.append(b)
    panes.push(pane)
  }
  if (hint) add('💡 ヒント', h('div.hint-box', h('h5', 'HINT'), h('div', { html: rich(hint) })))
  if (answer) add('✓ 解答例を見る', h('div.ans', h('h5', 'ANSWER'), typeof answer === 'string' ? h('div', { html: rich(answer) }) : answer))
  if (extra) extra.forEach(([label, content]) => add(label, content))
  return h('div.ex.reveal', h('div.ex-head', h('span.no', no), h('div.q-txt', { html: rich(q) })), h('div.ex-body', steps, reveal))
}
