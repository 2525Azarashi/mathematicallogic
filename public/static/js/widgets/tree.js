// Parse-tree renderer (SVG). Optional evaluation colouring.
import { SYM, evaluate, show } from '../logic/core.js'

const NS = 'http://www.w3.org/2000/svg'
const S = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e }
const COLOR = { not: '#ffe8d8', and: '#ddeeff', or: '#fff3c2', imp: '#ece5ff', var: '#fff', top: '#d3f6e6', bot: '#ffe1e8' }

// layout: leaves get x slots in order
function layout(f) {
  let x = 0
  const nodes = []
  const go = (g, d, parent) => {
    const n = { f: g, d, parent, kids: [] }
    nodes.push(n)
    if (g.t === 'not') n.kids.push(go(g.a, d + 1, n))
    else if (g.a) { n.kids.push(go(g.a, d + 1, n)); n.kids.push(go(g.b, d + 1, n)) }
    if (!n.kids.length) n.x = x++
    else n.x = n.kids.reduce((s, k) => s + k.x, 0) / n.kids.length
    return n
  }
  const root = go(f, 0, null)
  return { root, nodes, width: x, depth: Math.max(...nodes.map((n) => n.d)) + 1 }
}

// opts: { I (interpretation) | null, onHover(subformula|null), gap }
export function treeSVG(f, { I = null, onHover, gapX = 64, gapY = 74, r = 22, showValues = true } = {}) {
  const L = layout(f)
  const W = Math.max(1, L.width) * gapX, H = L.depth * gapY
  const svg = S('svg', { class: 'tree-svg', viewBox: `${-gapX / 2} ${-r - 8} ${W} ${H + 4}`, width: W, height: H + 4 + r - r })
  svg.style.maxWidth = '100%'
  svg.style.height = 'auto'
  const px = (n) => n.x * gapX, py = (n) => n.d * gapY
  const edges = S('g'), gn = S('g')
  svg.append(edges, gn)
  for (const n of L.nodes) {
    for (const k of n.kids) {
      const e = S('path', { class: 'edge', d: `M${px(n)} ${py(n)} C ${px(n)} ${py(n) + gapY * .5}, ${px(k)} ${py(k) - gapY * .5}, ${px(k)} ${py(k)}` })
      if (I && showValues) e.classList.add(evaluate(k.f, I) ? 'lit-t' : 'lit-f')
      edges.append(e)
    }
  }
  for (const n of L.nodes) {
    const g = S('g', { class: 'node', transform: `translate(${px(n)},${py(n)})` })
    const t = n.f.t
    const label = t === 'var' ? n.f.n : SYM[t]
    const shape = t === 'var' || t === 'top' || t === 'bot'
      ? S('rect', { x: -r, y: -r * .85, width: r * 2, height: r * 1.7, rx: 12, fill: COLOR[t] })
      : S('circle', { r, fill: COLOR[t] })
    g.append(S('circle', { class: 'ring', r: 22 }), shape)
    const tx = S('text', { 'font-size': t === 'var' ? 19 : 22 }); tx.textContent = label
    g.append(tx)
    if (I && showValues) {
      const v = evaluate(n.f, I)
      const b = S('g', { transform: `translate(${r * .95},${-r * .8})` })
      b.append(S('circle', { r: 10, fill: v ? '#2ec486' : '#ff6b8b', stroke: '#2b2452', 'stroke-width': 2 }))
      const bt = S('text', { class: 'badge-v', fill: '#fff' }); bt.textContent = v ? '⊤' : '⊥'; bt.setAttribute('fill', '#fff')
      b.append(bt); g.append(b)
    }
    g.addEventListener('mouseenter', () => { g.classList.add('hov'); onHover && onHover(n.f) })
    g.addEventListener('mouseleave', () => { g.classList.remove('hov'); onHover && onHover(null) })
    g.addEventListener('click', () => { g.classList.remove('pulse'); void g.getBBox(); g.classList.add('pulse'); onHover && onHover(n.f, true) })
    g.append(S('title')); g.lastChild.textContent = show(n.f)
    gn.append(g)
  }
  return svg
}
