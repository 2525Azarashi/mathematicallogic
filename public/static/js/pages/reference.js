import { h, html, fxs, fxHTML, rich } from '../lib/ui.js'
import { parse, equivalent } from '../logic/core.js'

const GLOSS = [
  ['集合', 'set', 'もののあつまり。外延的記法 {a,b} と内包的記法 {x | 条件} がある。', 1],
  ['べき集合', 'power set', '集合 S の部分集合すべての集合 2^S。要素 n 個なら 2ⁿ 個。', 1],
  ['全域関数', 'total function', '定義域のすべての要素に値が定まる関数。値が定まらない要素があれば部分関数。', 1],
  ['命題', 'proposition', '真 ⊤ か偽 ⊥ かが決まる宣言的な文。', 2],
  ['命題記号', 'propositional symbol', '命題を表す記号 P, Q, R, …。原子論理式。', 2],
  ['論理記号', 'logical connective', '¬（否定）∧（連言）∨（選言）⊃（含意）。', 2],
  ['論理式', 'formula', '⊤, ⊥, 命題記号から ¬ ∧ ∨ ⊃ で有限回組み立てたもの。BNF: A ::= ⊤ | ⊥ | P | ¬A | A∧A | A∨A | A⊃A', 2],
  ['部分論理式', 'subformula', '論理式を構成する途中の論理式。構文木の各節から下の部分。', 2],
  ['優先順位', 'precedence', '¬ ＞ ∧ ＞ ∨ ＞ ⊃ の順に強く結合。同じ記号は左優先。', 2],
  ['解釈', 'interpretation', '命題記号に真偽値を割り当てる関数 I。命題記号の集合 → {⊤, ⊥}。', 2],
  ['充足可能', 'satisfiable', 'ある解釈で ⊤ になる。', 2],
  ['充足不能', 'unsatisfiable', 'どの解釈でも ⊥（充足可能でない）。', 2],
  ['恒真（トートロジ）', 'valid / tautology', '任意の解釈で ⊤。⊨ A と書く。', 2],
  ['論理的同値', 'logically equivalent', '任意の解釈で真偽値が一致すること。', 2],
  ['メタ変数', 'meta variable', 'α, β のように「任意の論理式」を表す変数。対象言語の P, Q とは区別。', 2],
  ['リテラル', 'literal', '原子論理式またはその否定（P, ¬P）。', 3],
  ['節', 'clause', 'リテラルの選言 L₁ ∨ … ∨ Lₙ。順序・重複は無視。', 3],
  ['空節', 'empty clause', 'リテラル 0 個の節。⊥ で表す（常に偽）。', 3],
  ['連言標準形（CNF）', 'conjunctive normal form', '節の連言 C₁ ∧ … ∧ Cₖ。節の集合として表せる。和積標準形とも。', 3],
  ['導出', 'resolution', 'P ∨ C と ¬P ∨ D から C ∨ D を導く操作。', 3],
  ['導出節・親節', 'resolvent / parent clause', '導出で得られる節 C ∨ D が導出節、元の 2 節が親節。', 3],
  ['反駁', 'refutation', '節集合に導出を繰り返して空節 ⊥ を導くこと。', 3],
  ['健全性', 'soundness', '証明できる（⊥ が導ける）ならば本当に正しい（充足不能／恒真）。', 3],
  ['完全性', 'completeness', '本当に正しいならば必ず証明できる。', 3],
  ['構文論', 'syntax', '記号の形と変形規則だけで考える立場（⊢）。', 4],
  ['意味論', 'semantics', 'モデル・真偽値割り当てで考える立場（⊨）。', 4],
  ['演繹体系', 'deduction system', '公理から推論規則を有限回適用して定理を導く形式体系。', 4],
  ['シーケント', 'sequent', 'A₁,…,Aₘ → B₁,…,Bₙ。(A₁∧…∧Aₘ) ⊃ (B₁∨…∨Bₙ) を表す。', 4],
  ['初期シーケント（始式）', 'initial sequent', '両辺がすべて命題記号で、共通の命題記号を含むシーケント。', 4],
  ['LK', 'Gentzen\'s sequent calculus', 'Gentzen のシーケント計算の体系。¬∧∨⊃ それぞれに左規則・右規則。', 4],
  ['前提・結論', 'premise / conclusion', '推論規則の横線の上が前提、下が結論。', 4],
  ['証明図', 'proof figure', 'シーケントを推論規則で積み上げた木。葉がすべて初期シーケント。', 4],
  ['Wang のアルゴリズム', 'Wang\'s algorithm', '推論規則を逆向きに使ってシーケントがトートロジか判定する手続き。', 4],
]

export function glossaryPage(root) {
  const grid = h('div.gl-grid')
  const input = h('input', { type: 'search', placeholder: '用語・英語・説明で検索（例：充足, clause）', 'aria-label': '用語を検索' })
  const cnt = h('span.chip')
  function draw() {
    const q = input.value.trim().toLowerCase()
    grid.innerHTML = ''
    const hit = GLOSS.filter(([a, b, c]) => !q || (a + b + c).toLowerCase().includes(q))
    cnt.textContent = `${hit.length} 語`
    hit.forEach(([jp, en, d, no]) => grid.append(h('div.gl', h('h4', jp, h('small', en)), h('p', { html: fxs(d).replace(/2\^S/g, '2<sup>S</sup>') }), h('div.from', h('a', { href: `#/lec/lec0${no}` }, `第${no}回`)))))
  }
  input.addEventListener('input', draw)
  draw()
  root.append(h('section.lec-hero.wrap', h('div.crumbs', h('a', { href: '#/' }, 'ホーム'), '／', '用語集'), h('div.lec-hero-grid', { style: { gridTemplateColumns: 'auto 1fr' } }, h('div.big-no', { style: { background: '#d3f6e6', fontSize: '44px' } }, 'Aa'), h('div', h('h1', '用語集', h('span.sub', '講義に出てきた言葉を、ひとことで'))))),
    h('section.wrap', { style: { paddingBottom: '60px' } }, h('div.gl-search', input, cnt), grid))
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
