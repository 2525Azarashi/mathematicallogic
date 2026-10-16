import { h, html, lab, talk, fxs, fxHTML, seg } from '../lib/ui.js'
import { formulaInput } from '../widgets/formula-input.js'
import { treeSVG } from '../widgets/tree.js'
import { truthTable, verdictEl } from '../widgets/truth-table.js'
import { cnfStepper } from '../widgets/cnf.js'
import { proofBuilder } from '../widgets/proof.js'
import { atomFormula } from '../widgets/play.js'
import { show, size, depth, vars, sortVars, subformulas } from '../logic/core.js'

export function toolsPage(root) {
  let f = null
  const out = h('div')
  const tabs = [['tree', '構文木'], ['tt', '真理値表'], ['cnf', 'CNF 変換'], ['wang', '証明図（Wang）']]
  let tab = 'tt'
  const body = h('div', { style: { marginTop: '16px' } })
  const info = h('div.ctrls', { style: { margin: '14px 0 4px' } })
  const s = seg(tabs, tab, (v) => { tab = v; draw() })
  function draw() {
    body.innerHTML = ''; info.innerHTML = ''
    if (!f) return
    info.append(h('span.chip', `命題記号 ${sortVars(vars(f)).join(', ') || 'なし'}`), h('span.chip', `部分論理式 ${subformulas(f).length} 個`), h('span.chip', `木の深さ ${depth(f)}`), h('span.chip', { html: `完全括弧：<span class="fx">${fxs(show(f, { full: true }))}</span>` }))
    body.append(verdictEl(f), h('div', { style: { height: '16px' } }))
    if (tab === 'tree') { const a = atomFormula(f, { onChange: (I) => { t.innerHTML = ''; t.append(treeSVG(f, { I })) } }); const t = h('div.tree-wrap'); t.append(treeSVG(f, { I: a.I })); body.append(h('div', { style: { textAlign: 'center', fontSize: '26px', marginBottom: '10px' } }, a.el), t) }
    if (tab === 'tt') body.append(truthTable(f, { columns: 'all' }).el)
    if (tab === 'cnf') body.append(cnfStepper(f))
    if (tab === 'wang') body.append(proofBuilder({ L: [], R: [f] }))
  }
  const fi = formulaInput({ value: '(P ⊃ Q) ∧ (Q ⊃ R) ⊃ (P ⊃ R)', examples: ['(P ⊃ Q) ∧ (Q ⊃ R) ⊃ (P ⊃ R)', '¬(P ∧ Q) ⊃ ¬P ∨ ¬Q', '(P ∨ Q) ∧ ¬P ⊃ Q', 'P ⊃ Q ⊃ R', '((P ⊃ Q) ⊃ P) ⊃ P'], onChange: (g) => { if (g) { f = g; draw() } } })
  root.append(h('section.lec-hero.wrap', h('div.crumbs', h('a', { href: '#/' }, 'ホーム'), '／', 'ツール'), h('div.lec-hero-grid', { style: { gridTemplateColumns: 'auto 1fr' } }, h('div.big-no', { style: { background: '#ece5ff', fontFamily: 'var(--f-fx)' } }, '⊨'), h('div', h('h1', '論理式ラボ', h('span.sub', '1 つの式を、構文論と意味論の両方から丸ごと調べる')))),
    h('div', { style: { maxWidth: '760px' } }, talk(`R: レポートの答え、合ってるか自信がないときは？
S[happy]: ここに式を入れてみて。真理値表も CNF も証明図も出るから、**自分の手計算と見比べる**のに使ってね。答えを写すんじゃなくて、検算用だよ。`))),
    h('section.wrap', { style: { paddingBottom: '60px' } }, lab('式を入れる', { badge: 'INPUT', hint: '~ & | -> と打っても自動で記号に変換' }, fi, info, h('div', { style: { marginTop: '10px' } }, s), body)))
}
