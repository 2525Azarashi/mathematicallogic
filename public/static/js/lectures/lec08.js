import { h, html, talk, point, defn, lab, callout, esc } from '../lib/ui.js'
import { folInput } from '../widgets/fol-input.js'
import { parseFol, folHTML, showFol } from '../logic/fol.js'
import { clausify, parseClause } from '../logic/fol-proof.js'
import { clauseHTML, folResBoard } from '../widgets/fol-widgets.js'
import { toto } from '../lib/chars.js'

const F = (s) => `<span class="fx fol">${folHTML(parseFol(s))}</span>`

// ---------- Infographic: 命題論理の導出 vs 1階述語論理の導出 ----------
function folResCompareInfo() {
  return html(`<div class="info-card reveal ig-folres"><div class="ig-head"><span class="ig-tag">UPGRADE</span><h4>命題論理の導出に「単一化」が合体する</h4></div>
  <div class="sk-row">
    <div class="sk-c"><span class="fx">P ∨ C</span><span class="fx">¬P ∨ D</span><span class="sk-ar">⇒</span><span class="fx">C ∨ D</span><small><b>命題論理（第3回）</b>：まったく同じ命題記号 P と ¬P をそのまま打ち消す</small></div>
    <div class="sk-c"><span class="fx fol">${folHTML(parseFol('P(x) ∨ C'))}</span><span class="fx fol">${folHTML(parseFol('¬P(a) ∨ D'))}</span><span class="sk-ar">⇒</span><span class="fx fol">(C ∨ D){x := a}</span><small><b>1階述語論理（第8回）</b>：共通変数を分け、<b>mgu σ = {x := a}</b> で単一化してから打ち消し、残りにも σ をかける</small></div>
  </div>
  <p class="rd-note">※ 各節の変数は暗黙に <b>∀ で縛られている</b>（節ごとに独立なスコープ）ので、ぶつける前に<b>共通の変数名を別名につけかえる（変数の分離）</b>のが鉄則！</p></div>`)
}

// ---------- Lab 1: 1階の導出ボード（プリセットつき） ----------
function resLab() {
  const PRESETS = [
    ['三段論法（ソクラテス）', ['¬Human(x) ∨ Mortal(x)', 'Human(s)', '¬Mortal(s)']],
    ['f で2段つなぐ', ['P(a)', '¬P(x) ∨ P(f(x))', '¬P(f(f(a)))']],
    ['2引数述語・関係', ['R(a, b)', '¬R(x, y) ∨ R(y, x)', '¬R(b, a)']],
    ['共通変数の分離が必要', ['P(x) ∨ Q(x)', '¬P(a)', '¬Q(b)']],
  ]
  const board = folResBoard(PRESETS[0][1].map(parseClause))
  const pres = h('div.examples', { style: { marginBottom: '12px' } }, '節集合の例：', PRESETS.map(([name, cls]) => h('button', {
    type: 'button',
    onclick: () => board.load(cls.map(parseClause)),
  }, name)))
  return lab('1 階述語論理の導出ボード：単一化でリテラルを打ち消す', { badge: 'FOL RESOLUTION', hint: '節を 2 つクリックすると「変数つけかえ → mgu → 導出節」を表示' }, pres, board)
}

// ---------- Lab 2: 論理式の恒真性 → 否定 → Skolem 化 → 節集合 → 反駁 一貫パイプライン ----------
function pipelineLab() {
  const out = h('div.ck-out')
  const draw = (f) => {
    out.innerHTML = ''
    if (!f) return
    const r = clausify(f, { negate: true })
    const steps = h('ol.ck-steps')
    r.steps.forEach((s, i) => steps.append(h('li.ck-step', {
      style: { '--d': `${i * 0.07}s` },
      class: s.k === 'neg' || s.k === 'skolem' ? 'key' : '',
    }, h('span.ck-lab', s.label), h('span.fx.fol', { html: folHTML(s.f) }), s.note ? h('small', s.note) : null)))
    steps.append(h('li.ck-step.key', { style: { '--d': `${r.steps.length * 0.07}s` } },
      h('span.ck-lab', '(4) 節集合にする（∀ を省略し ∧ ごとに分割）'),
      h('div.ck-cls', ...(r.clauses.length ? r.clauses.map((c, idx) => h('span.fx.fol.ck-c', { html: `(${idx + 1}) ${clauseHTML(c)}` })) : [h('span', '（空の節集合）')]))))

    out.append(steps)
    if (r.clauses.length) {
      out.append(
        h('h5', { style: { margin: '16px 0 8px', fontSize: '14px', fontWeight: 900 } }, '(5) 節集合から空節 ⊥ を導出する（▶ 自動で反駁 も押せます）'),
        folResBoard(r.clauses))
    } else {
      out.append(html(`<div class="verdict valid">${toto('top')}<div>否定が恒偽になったため元の論理式は恒真です</div></div>`))
    }
  }
  const fi = folInput({
    value: '∀x(Human(x) ⊃ Mortal(x)) ∧ Human(s) ⊃ Mortal(s)',
    examples: [
      '∀x(Human(x) ⊃ Mortal(x)) ∧ Human(s) ⊃ Mortal(s)',
      '∀x P(x) ⊃ ∃x P(x)',
      '∃y∀x R(x, y) ⊃ ∀x∃y R(x, y)',
      '∀x(P(x) ⊃ Q(x)) ∧ ∀x(Q(x) ⊃ R(x)) ⊃ ∀x(P(x) ⊃ R(x))',
    ],
    onChange: draw,
  })
  return lab('恒真性の証明パイプライン：否定 → 冠頭形 → Skolem 化 → 節集合 → 反駁', { badge: 'PIPELINE', hint: '中間試験のクライマックス手順を丸ごと体験' }, fi, out)
}

export default {
  no: 8, slug: 'lec08', date: '11/13', color: '#3b82f6', colorL: '#dbeafe',
  title: '一階述語論理 — 導出(融合)原理', sub: 'Skolem 化で作った節集合に「単一化＋導出」を繰り返して空節 ⊥ を導く（中間試験範囲の到達点）',
  tags: ['節集合への変換', '変数の分離（つけかえ）', '1階の導出規則', '反駁による恒真性証明', '健全性と完全性'],
  tinyFx: 'P(x) ∨ C , ¬P(a) ∨ D  ⟹  (C ∨ D){x := a}',
  summary: '第7回で学んだ冠頭形・Skolem 化・単一化（mgu）を結集し、1階述語論理の導出（融合）原理を構成する。示したい式の否定を節集合に変換し、空節 ⊥ を導いて充足不能（元の式が恒真）を証明する。',
  chapters: [
    {
      id: 'clause-set', title: '論理式から節集合への変換手順', en: 'From formulas to clause sets',
      build(el) {
        el.append(
          talk(`R: 第 7 回で「冠頭形」「Skolem 化」「単一化」と部品がたくさん出てきました。今日いよいよ全部つながるんですね！
S[happy]: そう！ ゴールは命題論理の第 3 回と同じ、「**論理式 $F$ が恒真であることを、導出（反駁）で証明する**」こと。そのためにまず、**否定した式 $¬F$ を「節集合」に変換する手順**を整理しよう。`),
          defn('手順', '恒真性を示したい式 F から節集合を作る 5 ステップ', `閉じた論理式 $F$ が<b>恒真</b>であることを示したいとき（自由変数があれば先に全称閉包をとる）：<br>
<b>(1) 否定する</b>：$¬F$ を作る（$F$ が恒真 ⇔ $¬F$ が充足不能）．<br>
<b>(2) 冠頭形にする</b>：$⊃$ の除去・ド・モルガン則（$¬∀x α = ∃x¬α$, $¬∃x α = ∀x¬α$）・束縛変数のつけかえ・量化記号の移動により，同値な冠頭形 $Q₁x₁ … Qₙxₙ A₀$ に直す．<br>
<b>(3) Skolem 化する</b>：存在記号 $∃$ を（前にある $∀$ の変数を引数とする）新しい Skolem 関数／定数で置き換えて消し，$∀y₁ … ∀yₘ B₀$ の形にする（充足不能性が保たれる）．<br>
<b>(4) 母式 $B₀$ を連言標準形（CNF）にする</b>：命題論理と同じく分配則などで $C₁ ∧ … ∧ Cₖ$（各 $Cᵢ$ はリテラルの選言）に直す．<br>
<b>(5) 節集合にする</b>：$∀x(C₁ ∧ C₂) = ∀x C₁ ∧ ∀x C₂$ なので，先頭の $∀$ を省略して節の集合 $\\{C₁, …, Cₖ\\}$ と表す．`, { en: 'clausal form' }),
          callout('warn', '<b>なぜ節ごとに変数が独立なのか？</b><br>$∀x(P(x) ∧ Q(x))$ は $(∀x P(x)) ∧ (∀x Q(x))$ と同値です。したがって節集合 $\\{P(x), Q(x)\\}$ と書いたとき、1 つ目の節の $x$ と 2 つ目の節の $x$ は<b>別々の $∀$ に束縛された別物</b>（$\\{P(x₁), Q(x₂)\\}$ と同じ意味）です。これが次の「変数のつけかえ」の根拠になります。'),
          point('恒真性の証明は <b>① 否定 → ② 冠頭形 → ③ Skolem 化 → ④ CNF → ⑤ 節集合</b> の順で準備する。節集合の各節の変数は暗黙に <b>∀ で全称量化</b>されている。'),
        )
      },
    },
    {
      id: 'res-rule', title: '1 階述語論理の導出（融合）規則', en: 'First-order resolution rule',
      build(el) {
        el.append(
          talk(`R: 節集合ができたら、あとは命題論理みたいに $P$ と $¬P$ を消せばいいんですか？
S: ほぼ同じだけど、1 階述語論理では引数の項が少しずつ違うよね。たとえば $P(x) ∨ Q(x)$ と $¬P(f(a)) ∨ R(a)$ みたいに。そこで第 7 回の**最汎単一化子（mgu）**の出番！`),
          folResCompareInfo(),
          defn('定義', '1 階述語論理の導出（resolution）', `2 つの節 $C₁, C₂$ について：<br>
<b>Step 1（変数の分離）</b>：$C₁$ と $C₂$ に共通の変数があれば，一方（たとえば $C₂$）の変数名を新しい変数につけかえて<b>共通変数をもたない</b>ようにする．<br>
<b>Step 2（単一化）</b>：$C₁ = L₁ ∨ C₁'$，$C₂ = ¬L₂ ∨ C₂'$（または逆符号）で，原子論理式 $L₁$ と $L₂$ が単一化可能であるとし，その<b>最汎単一化子（mgu）を $\\sigma$</b> とする（すなわち $L₁\\sigma = L₂\\sigma$）．<br>
<b>Step 3（導出節の生成）</b>：残りの部分に $\\sigma$ をほどこした節<br>
<p class="pt-eq"><b>(C₁' ∨ C₂')σ</b>　（重複するリテラルは 1 つにまとめる）</p>
を $C₁, C₂$ からの<b>導出節</b>（resolvent）といい，この操作を<b>導出</b>（融合）という．`, { en: 'first-order resolution' }),
          callout('tip', '<b>因数分解（factoring）の補足：</b>1 つの節の中に同じ符号で単一化できる 2 つのリテラルがあるとき（例：$P(x) ∨ P(y)$）、mgu $\\{x := y\\}$ をかけて $P(y)$ にまとめる操作も導出とあわせて使われます（完全性のため）。基本の演習問題では上の 2 節間の導出で一直線に $\\bot$ が出るものが中心です。'),
          resLab(),
          talk(`R[wow]: プリセットの「共通変数の分離が必要」を試したら、$P(x) ∨ Q(x)$ と $¬P(a)$ から $Q(a)$ が出て、最後に $¬Q(b)$ とぶつかって止まりました…あれ？
S: いい観察！ $P(x) ∨ Q(x)$ は「同じ $x$ について $P(x)$ か $Q(x)$」だから、$x := a$ で $P(a)$ を消した瞬間に残りは $Q(a)$ に確定して、$¬Q(b)$ とは単一化できない（実際 $P(a)=⊥, Q(a)=⊤, P(b)=⊤, Q(b)=⊥$ のモデルがあるので充足可能！）。
R: 逆に、別の節どうしにたまたま同じ文字 $x$ が書いてあるときは、別物だから $x₁$ につけかえてから単一化するんですね！`),
          point('導出する前に必ず<b>親節どうしの共通変数を別名につけかえる</b>。次に符号が逆のリテラル対の <b>mgu σ</b> を求め、<b>残りのリテラル全体にも忘れずに σ をかける</b>。'),
        )
      },
    },
    {
      id: 'refute', title: '反駁と健全性・完全性', en: 'Refutation, soundness & completeness',
      build(el) {
        el.append(
          talk(`S: 導出を繰り返してリテラルが 0 個の**空節 $\\bot$** が出たら**反駁（refutation）成功**！ 命題論理のときと同じく、健全性と完全性が成り立つよ。`),
          defn('定義 / 定理', '反駁と導出原理の健全性・完全性', `<b>反駁（refutation）</b>：節集合 $S$ から導出を有限回繰り返して<b>空節 $\\bot$</b> を導くこと．<br><br>
<b>[定理] 健全性と完全性</b>：節集合 $S$ に対して，<br>
$S$ から空節 $\\bot$ が導出可能である <b>⇔</b> $S$ は<b>充足不能</b>である．<p class="note">（健全性：$\\bot$ が導ければ $S$ は充足不能 ／ 完全性：$S$ が充足不能ならば必ず $\\bot$ が導ける — エルブランの定理と単一化の性質から証明される．）</p>`, { thm: true }),
          pipelineLab(),
          talk(`R: 前提 $F₁, …, Fₙ$ から結論 $G$ が出ることを示したいときはどう書けばいいですか？
S[happy]: 第 3 回とまったく同じ！ **$F₁, …, Fₙ$ と、結論の否定 $¬G$** をそれぞれ節にして 1 つの節集合に入れ、そこから $\\bot$ を導けば「$\\{F₁, …, Fₙ, ¬G\\}$ が充足不能 ⇒ $F₁ ∧ … ∧ Fₙ ⊃ G$ は恒真」が言える。答案では毎ステップ **「どの 2 節から・どの mgu $\\sigma$ で」** を明記して、最後に **「空節 $\\bot$ が導かれたので健全性より充足不能（よって元の式は恒真）」** と締めくくれば完璧だよ！`),
          point('前提 $F₁, …, Fₙ$ から結論 $G$ を示すには、<b>$\\{F₁, …, Fₙ, ¬G\\}$ を節集合にして $\\bot$ を導く</b>。答案には<b>使った親節の番号</b>と<b>mgu $\\sigma$</b> を必ず書く。'),
        )
      },
    },
  ],
  exercises: [
    {
      no: '8.A',
      q: '（中間試験対策・練習問題）次の節集合から導出原理を用いて空節 ⊥ を導き，充足不能であることを示せ．　(1) ¬P(x) ∨ Q(x, f(x))　(2) ¬Q(a, y) ∨ R(y)　(3) P(a)　(4) ¬R(f(a))',
      hint: '(1) と (3) を mgu {x := a} で導出 → 出てきた Q(a, f(a)) と (2) を mgu {y := f(a)} で導出 → 最後に (4) とぶつける。',
      answer: `<ol class="pt-steps">
<li>(1) と (3) より，$P(x)$ と $P(a)$ の mgu $\\sigma₁ = \\{x := a\\}$ を用いて <b>(5) $Q(a, f(a))$</b> を導出．</li>
<li>(2) と (5) より，$Q(a, y)$ と $Q(a, f(a))$ の mgu $\\sigma₂ = \\{y := f(a)\\}$ を用いて <b>(6) $R(f(a))$</b> を導出．</li>
<li>(4) と (6) より，$R(f(a))$ と $¬R(f(a))$（mgu $\\sigma₃ = \\{\\}$）から <b>(7) $\\bot$（空節）</b> を導出．</li>
</ol>
<p>空節 $\\bot$ が導出されたので，導出原理の健全性より与えられた節集合は<b>充足不能</b>である．∎</p>`,
    },
    {
      no: '8.B',
      q: '（中間試験対策・練習問題）導出原理（反駁）を用いて，論理式 ∀x(P(x) ⊃ Q(x)) ∧ ∃x P(x) ⊃ ∃x Q(x) が恒真であることを証明せよ．',
      hint: '① 式全体を否定すると ∀x(P(x) ⊃ Q(x)) ∧ ∃x P(x) ∧ ¬∃x Q(x)。② ∃x P(x) を Skolem 定数 c で P(c) にする（¬∃x Q(x) は ∀x ¬Q(x) なので Skolem 化不要！）。③ 3 つの節から ⊥ を出す。',
      answer: `<p><b>1. 否定して節集合へ変換する</b></p>
<ol class="pt-steps">
<li>与えられた論理式の否定をとる：$¬((∀x(P(x) ⊃ Q(x)) ∧ ∃x P(x)) ⊃ ∃x Q(x))$</li>
<li>$¬(A ⊃ B) = A ∧ ¬B$ と $A ⊃ B = ¬A ∨ B$，および $¬∃x Q(x) = ∀x ¬Q(x)$ より：<br>
$∀x(¬P(x) ∨ Q(x)) ∧ ∃x P(x) ∧ ∀x ¬Q(x)$</li>
<li>束縛変数をつけかえて冠頭形にする：$∃y ∀x ∀z ((¬P(x) ∨ Q(x)) ∧ P(y) ∧ ¬Q(z))$</li>
<li><b>Skolem 化</b>：$∃y$ の前に $∀$ がないので新しい定数 $c$ で置き換え，$∀x ∀z ((¬P(x) ∨ Q(x)) ∧ P(c) ∧ ¬Q(z))$（Skolem 化の正当性より充足不能性は保たれる）．</li>
<li>節集合にする：<b>(1) $¬P(x) ∨ Q(x)$</b>，<b>(2) $P(c)$</b>，<b>(3) $¬Q(z)$</b></li>
</ol>
<p><b>2. 導出による反駁</b></p>
<ol class="pt-steps">
<li>(1) と (2) より mgu $\\{x := c\\}$ で <b>(4) $Q(c)$</b> を導出．</li>
<li>(3) と (4) より mgu $\\{z := c\\}$ で <b>(5) $\\bot$</b> を導出．</li>
</ol>
<p>空節 $\\bot$ が導かれたので節集合は充足不能．したがって否定前の論理式は<b>恒真</b>である．∎</p>`,
    },
  ],
  quiz: [
    { q: '閉じた論理式 $F$ が恒真であることを導出原理で示す最初のステップは？', opts: ['F をそのまま Skolem 化する', '¬F を作り、それが充足不能であることを目指す', 'F の ∀ をすべて c に置き換える', '真理値表を書く'], a: 1, why: 'F が恒真 ⇔ ¬F が充足不能。Skolem 化は「充足不能性」を保つ操作なので、必ず先に否定 ¬F をとってから Skolem 化する。' },
    { q: '節 $P(x) ∨ Q(x)$ と節 $¬P(f(a))$ から導出される節は？', opts: ['Q(x)', 'Q(f(a))', 'P(f(a)) ∨ Q(f(a))', '⊥'], a: 1, why: 'P(x) と P(f(a)) の mgu σ = {x := f(a)} を残りの Q(x) にも適用するので Q(f(a)) になる。' },
    { q: '2 つの節 $C₁ = P(x) ∨ R(x)$ と $C₂ = ¬P(f(x))$ から導出を行うとき、最初に必要な操作は？', opts: ['出現検査で失敗と答える', '一方の節の変数 x を別名（例：x₁）につけかえて共通変数をなくす', 'f(x) を a に置き換える', '両方の x に同じ定数を入れる'], a: 1, why: '各節の変数は別々の ∀ で縛られた独立な変数。そのまま単一化すると x と f(x) で出現検査エラーになるため、先に ¬P(f(x₁)) につけかえて {x := f(x₁)} で単一化する。' },
    { q: '節集合から空節 $\\bot$ が導出できたとき言えることは？（導出の健全性）', opts: ['節集合は充足可能である', '節集合は恒真である', '節集合は充足不能である', '元の式は充足不能である'], a: 2, why: '空節 ⊥ が導けた節集合は充足不能（そしてそれが ¬F から作った節集合なら、元の式 F は恒真）。' },
  ],
}
