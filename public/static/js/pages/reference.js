import { h, html, fxs, fxHTML, rich } from '../lib/ui.js'
import { parse, equivalent } from '../logic/core.js'
import { GLOSS } from '../data/glossary.js'
import { autocomplete } from '../lib/patterns.js'
import { openTerm, glossSource } from '../lib/features.js'


export function glossaryPage(root) {
  const grid = h('div.gl-grid')
  const input = h('input', { type: 'search', placeholder: '用語・英語・説明で検索（例：充足, clause）', 'aria-label': '用語を検索' })
  const cnt = h('span.chip')
  function draw() {
    const q = input.value.trim().toLowerCase()
    grid.innerHTML = ''
    const hit = GLOSS.filter(([a, b, c]) => !q || (a + b + c).toLowerCase().includes(q))
    cnt.textContent = `${hit.length} 語`
    hit.forEach(([jp, en, d, no]) => grid.append(h('div.gl', { tabindex: 0, role: 'button', 'aria-label': `${jp} の詳細を開く`, onclick: (e) => { if (!e.target.closest('a')) openTerm(jp) }, onkeydown: (e) => { if (e.key === 'Enter' && e.target === e.currentTarget) openTerm(jp) } }, h('h4', jp, h('small', en)), h('p', { html: fxs(d).replace(/2\^S/g, '2<sup>S</sup>') }), h('div.from', h('a', { href: `#/lec/lec0${no}` }, `第${no}回`)))))
  }
  input.addEventListener('input', draw)
  draw()
  root.append(h('section.lec-hero.wrap', h('div.crumbs', h('a', { href: '#/' }, 'ホーム'), '／', '用語集'), h('div.lec-hero-grid', { style: { gridTemplateColumns: 'auto 1fr' } }, h('div.big-no', { style: { background: '#d3f6e6', fontSize: '44px' } }, 'Aa'), h('div', h('h1', '用語集', h('span.sub', '講義に出てきた言葉を、ひとことで'))))),
    h('section.wrap', { style: { paddingBottom: '60px' } }, h('div.gl-search', input, cnt), grid))
  autocomplete(input, glossSource, { onPick: (it) => { input.value = it.value; draw(); openTerm(it.value) }, max: 6 })
}

const LAWS = [
  ['可換則', 'P ∧ Q', 'Q ∧ P'], ['可換則', 'P ∨ Q', 'Q ∨ P'],
  ['結合則', '(P ∧ Q) ∧ R', 'P ∧ (Q ∧ R)'], ['結合則', '(P ∨ Q) ∨ R', 'P ∨ (Q ∨ R)'],
  ['分配則', 'P ∧ (Q ∨ R)', '(P ∧ Q) ∨ (P ∧ R)'], ['分配則', 'P ∨ (Q ∧ R)', '(P ∨ Q) ∧ (P ∨ R)'],
  ['二重否定', '¬¬P', 'P'],
  ['ド・モルガン', '¬(P ∧ Q)', '¬P ∨ ¬Q'], ['ド・モルガン', '¬(P ∨ Q)', '¬P ∧ ¬Q'],
  ['含意', 'P ⊃ Q', '¬P ∨ Q'], ['対偶', 'P ⊃ Q', '¬Q ⊃ ¬P'],
  ['その他', 'P ∧ ⊤', 'P'], ['その他', 'P ∧ ⊥', '⊥'], ['その他', 'P ∨ ⊤', '⊤'], ['その他', 'P ∨ ⊥', 'P'],
  ['その他', 'P ∧ ¬P', '⊥'], ['その他', 'P ∨ ¬P', '⊤'],
]
export function sheetPage(root) {
  const lawCard = h('div.sheet-card', h('h3', '論理的同値の公式', h('span.chip', '第2回'), h('span.chip', { style: { background: 'var(--top-l)' } }, `✓ 全 ${LAWS.filter(([, a, b]) => equivalent(parse(a), parse(b)).ok).length} 式を真理値表で自動検証`)),
    ...LAWS.map(([n, a, b]) => { return h('div.law', h('span', n), h('span', { html: `${fxHTML(a)} <b style="color:var(--ink-3)">=</b> ${fxHTML(b)} ` })) }),
    h('p', { style: { fontSize: '12.5px', fontWeight: 700, color: 'var(--ink-2)', margin: '8px 0 0' }, html: '※ 講義ノートではメタ変数 α, β, γ で書かれています（任意の論理式を代入してよい）。' }))
  const cnf = h('div.sheet-card', h('h3', 'CNF 変換の 4 手順', h('span.chip', '第3回')), h('div', { html: rich(`<ol style="margin:0;padding-left:1.4em;font-weight:700;font-size:14.5px;line-height:2.1"><li>⊃ を除去：$α ⊃ β = ¬α ∨ β$</li><li>¬ を内側へ：二重否定・ド・モルガン</li><li>分配則で ∧ を外へ：$α ∨ (β ∧ γ) = (α ∨ β) ∧ (α ∨ γ)$</li><li>その他（⊤⊥・重複・$P ∨ ¬P$ の節を整理）</li></ol>`) }),
    h('h3', { style: { marginTop: '22px' } }, '導出原理の使い方', h('span.chip', '第3回')), h('div', { html: rich(`<ol style="margin:0;padding-left:1.4em;font-weight:700;font-size:14.5px;line-height:2.1"><li>前提 F₁…Fₙ と<b>結論の否定 ¬G</b> を CNF に</li><li>全部の節を 1 つの集合に</li><li>$P ∨ C$, $¬P ∨ D$ → $C ∨ D$ を繰り返す</li><li>空節 ⊥ が出たら充足不能 ⇒ $F_1 ∧ … ∧ F_n ⊃ G$ は恒真</li></ol>`).replace('F_1', 'F₁').replace('F_n', 'Fₙ') }))
  const RULES = [['¬左', 'Γ → Δ, A', '¬A, Γ → Δ'], ['¬右', 'A, Γ → Δ', 'Γ → Δ, ¬A'], ['∧左', 'A, B, Γ → Δ', 'A ∧ B, Γ → Δ'], ['∧右', 'Γ → Δ, A　|　Γ → Δ, B', 'Γ → Δ, A ∧ B'], ['∨左', 'A, Γ → Δ　|　B, Γ → Δ', 'A ∨ B, Γ → Δ'], ['∨右', 'Γ → Δ, A, B', 'Γ → Δ, A ∨ B'], ['⊃左', 'Γ → Δ, A　|　B, Γ → Δ', 'A ⊃ B, Γ → Δ'], ['⊃右', 'A, Γ → Δ, B', 'Γ → Δ, A ⊃ B']]
  const lk = h('div.sheet-card', { style: { gridColumn: '1 / -1' } }, h('h3', 'LK の推論規則（上：前提 / 下：結論）', h('span.chip', '第4回')),
    h('div.rules', ...RULES.map(([n, p, c]) => h('div.rule', { class: p.includes('|') ? 'br' : '' }, h('span.rn', n), p.includes('|') ? h('span.split', '枝分かれ') : null, h('div.prem', ...p.split('　|　').map((x) => h('span', { html: fxs(x) }))), h('div.ln'), h('div.conc', { html: fxs(c) })))),
    h('p', { style: { fontSize: '13px', fontWeight: 700, color: 'var(--ink-2)', margin: '14px 0 0' }, html: rich('覚え方：¬ は反対側へ移る ／ 左の ∧・右の ∨ はカンマになる ／ 右の ∧・左の ∨・左の ⊃ は枝分かれ。初期シーケント = 両辺が命題記号だけで、共通の記号を含む。') }))
  const sem = h('div.sheet-card', { style: { gridColumn: '1 / -1' } }, h('h3', '真偽値割り当て（第2回）'), h('div', { html: `<table class="tbl"><thead><tr><th>P</th><th>Q</th><th>${fxHTML('¬P')}</th><th>${fxHTML('P ∧ Q')}</th><th>${fxHTML('P ∨ Q')}</th><th>${fxHTML('P ⊃ Q')}</th></tr></thead><tbody>${[[1, 1], [1, 0], [0, 1], [0, 0]].map(([p, q]) => `<tr>${[p, q, !p, p && q, p || q, !p || q].map((v) => `<td><span class="tv ${v ? 't' : 'f'}">${v ? '⊤' : '⊥'}</span></td>`).join('')}</tr>`).join('')}</tbody></table>` }))
  root.append(h('section.lec-hero.wrap', h('div.crumbs', h('a', { href: '#/' }, 'ホーム'), '／', 'チートシート'), h('div.lec-hero-grid', { style: { gridTemplateColumns: 'auto 1fr' } }, h('div.big-no', { style: { background: '#fff3c2', fontFamily: 'var(--f-fx)' } }, '≡'), h('div', h('h1', 'チートシート', h('span.sub', '試験前にこれ 1 枚。印刷にも対応'))))),
    h('section.wrap', { style: { paddingBottom: '60px' } }, h('div.sheet-grid', sem, lawCard, cnf, lk)))
}
