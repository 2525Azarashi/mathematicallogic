import { h, fxs } from '../lib/ui.js'
import { showSeq } from '../logic/core.js'

// static (non-interactive) proof tree from wang() result: root at the bottom, rule names on the bars
export function staticTree(t) {
  const node = (n) => {
    const w = h('div.pf-node')
    if (n.kids && n.kids.length) w.append(h('div.pf-prem', ...n.kids.map(node)), h('div.pf-bar', h('span.rl', n.rule)))
    else if (n.status === 'axiom') w.append(h('div.pf-mark.ok', '✓ 初期'))
    w.append(h('div.pf-seq.fx', { class: n.status === 'axiom' ? 'axiom' : n.status === 'fail' ? 'fail' : '', html: fxs(showSeq(n.seq)) }))
    return w
  }
  return h('div.pf', node(t))
}
