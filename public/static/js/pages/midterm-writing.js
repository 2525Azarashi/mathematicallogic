// ============================================================
//  midterm-writing.js — 「説明できる」を「実際に満点答案が書ける」へ引き上げる実戦ライティング教材
//  1. 記述答案 骨格穴埋めトレーナー（頻出4大証明テンプレートのインタラクティブ構築）
//  2. 減点答案 添削ドリル（学生がやりがちな「惜しい減点答案」の欠陥を見抜く）
//  3. 本番で問題用紙に記載される「定義・推論規則リファレンス」再現ドロワー
// ============================================================
import { h, html, rich, fxs, store, confettiAt, toast } from '../lib/ui.js'

// ============================================================
//  1. 記述答案 骨格穴埋めトレーナー（4大頻出記述パターン）
// ============================================================
const WRITING_DRILLS = [
  {
    id: 'w-ex51',
    badge: '最頻出 · ex5.1型（第5回）',
    title: 'LK規則の恒真性保持（同値変形を使わない背理法証明）',
    goal: '課題：「$A ∧ B ⊃ C$ がトートロジならば $B ⊃ C ∨ ¬A$ もトートロジである」を同値変形を使わず定義から証明せよ．',
    blanks: [
      { id: 0, ans: '任意の解釈 I', opts: ['任意の解釈 I', 'ある解釈 I', '真理値表の1行'] },
      { id: 1, ans: 'ある解釈 I', opts: ['任意の解釈 I', 'ある解釈 I', '空の解釈 I'] },
      { id: 2, ans: '[[B]]_I = ⊤ かつ [[C ∨ ¬A]]_I = ⊥', opts: ['[[B]]_I = ⊤ かつ [[C ∨ ¬A]]_I = ⊥', '[[B]]_I = ⊥ かつ [[C ∨ ¬A]]_I = ⊤', '[[B]]_I = ⊥ または [[C ∨ ¬A]]_I = ⊥'] },
      { id: 3, ans: '[[C]]_I = ⊥ かつ [[¬A]]_I = ⊥', opts: ['[[C]]_I = ⊥ かつ [[¬A]]_I = ⊥', '[[C]]_I = ⊥ または [[¬A]]_I = ⊥', '[[C]]_I = ⊤ かつ [[¬A]]_I = ⊤'] },
      { id: 4, ans: '[[A]]_I = ⊤', opts: ['[[A]]_I = ⊤', '[[A]]_I = ⊥', '一意に定まらない'] },
      { id: 5, ans: '[[A ∧ B ⊃ C]]_I = ⊥', opts: ['[[A ∧ B ⊃ C]]_I = ⊥', '[[A ∧ B ⊃ C]]_I = ⊤', 'A ∧ B = C'] },
    ],
    // [[0]]〜[[5]] をドロップダウンに置換して描画
    template: `
<p>$A ∧ B ⊃ C$ がトートロジであると仮定する．すなわち，{{0}} に対して $[[A ∧ B ⊃ C]]_I = ⊤$ である…（★）．</p>
<p>もし $B ⊃ C ∨ ¬A$ がトートロジでないと仮定すると，{{1}} が存在して $[[B ⊃ C ∨ ¬A]]_I = ⊥$ となる．</p>
<ol class="pt-steps">
<li>含意 $⊃$ の真偽値割り当ての定義 (7) より，{{2}} である．</li>
<li>選言 $∨$ の真偽値割り当ての定義 (6) より，{{3}} である．</li>
<li>否定 $¬$ の真偽値割り当ての定義 (4) より，{{4}} となる．</li>
<li>連言 $∧$ の定義 (5) より $[[A ∧ B]]_I = ⊤$ となり，$[[C]]_I = ⊥$ と定義 (7) から {{5}} となって（★）に矛盾する．</li>
</ol>
<p>したがって任意の解釈 $I$ に対して $[[B ⊃ C ∨ ¬A]]_I = ⊤$ であり，$B ⊃ C ∨ ¬A$ はトートロジである．∎</p>`,
    note: 'ポイント：「トートロジである仮定」には**任意の解釈 $I$**、「トートロジでない（背理法の仮定）」には**ある解釈 $I$** を使い分けるのが最大の採点ポイント！',
  },
  {
    id: 'w-ex71',
    badge: '頻出 · ex7.1型（第6〜7回）',
    title: '有限領域 $D$ 上の解釈 $I$ における量化式の真偽と理由記述',
    goal: '課題：$D=\\{1,2\\},\\ P(1)=⊤, P(2)=⊥, Q(1)=⊥, Q(2)=⊤$ のもとで $[[∀x(P(x)∨Q(x))]]_I = ⊤$ と $[[∀xP(x)∨∀xQ(x)]]_I = ⊥$ を理由つきで示せ．',
    blanks: [
      { id: 0, ans: 'すべての u ∈ D', opts: ['すべての u ∈ D', 'ある u ∈ D', '定数 a ∈ D'] },
      { id: 1, ans: 'J[1/x]', opts: ['J[1/x]', 'J[x/1]', 'I[1/x]'] },
      { id: 2, ans: 'u = 2 ∈ D のとき P(2) = ⊥', opts: ['u = 2 ∈ D のとき P(2) = ⊥', 'u = 1 ∈ D のとき P(1) = ⊤', 'P と Q が別記号'] },
      { id: 3, ans: '論理的に同値ではない', opts: ['論理的に同値ではない', '充足不能である', '恒真である'] },
    ],
    template: `
<p><b>(1)</b> 全称記号の定義 (8) より，$[[∀x(P(x)∨Q(x))]]_{I,J} = ⊤$ を示すには，{{0}} に対して $[[P(x)∨Q(x)]]_{I,J[u/x]} = ⊤$ を確かめればよい．</p>
<ul>
<li>$u = 1$ のとき：付値 {{1}} のもとで $I(P)(1) = ⊤$ なので，選言の定義 (6) より $[[P(x)∨Q(x)]]_{I,J[1/x]} = ⊤$．</li>
<li>$u = 2$ のとき：$I(Q)(2) = ⊤$ なので，同様に $[[P(x)∨Q(x)]]_{I,J[2/x]} = ⊤$．よって全体は $⊤$．</li>
</ul>
<p><b>(2)</b> 量化記号は $∨$ より優先順位が高いので $(∀xP(x)) ∨ (∀xQ(x))$ と読む．{{2}} なので $[[∀xP(x)]]_I = ⊥$，また $u = 1$ のとき $Q(1) = ⊥$ なので $[[∀xQ(x)]]_I = ⊥$．両方 $⊥$ ゆえ定義 (6) より全体は $⊥$．<br>
（補足：同じ解釈 $I$ で真偽が異なるため，2つの式は {{3}} こともわかる．）</p>`,
    note: 'ポイント：「$∀$ が $⊤$」を示すときは **$D$ の全要素** を書き並べ、「$∀$ が $⊥$」を示すときは **$⊥$ になる具体的な反例要素 $u$** を 1 つ名指しする！',
  },
  {
    id: 'w-ex61',
    badge: '頻出 · ex6.1 / 6.2型（第6回）',
    title: '1階述語論理の構文（非論理式の証明）と自由/束縛の記述',
    goal: '課題：(1) 定数 $a$，1引数述語 $P$ に対し $P(a(x))$ が論理式でない理由　(2) $∀xP(x,y) ∧ ∀yQ(y)$ の $y$ の分類理由を書け．',
    blanks: [
      { id: 0, ans: '0引数の関数記号（定数）', opts: ['0引数の関数記号（定数）', '1引数の述語記号', '束縛変数'] },
      { id: 1, ans: '項ではない', opts: ['項ではない', '真偽値が⊥になる', '自由変数を含む'] },
      { id: 2, ans: '∀y のスコープ（Q(y) のみ）の外', opts: ['∀y のスコープ（Q(y) のみ）の外', '∀x のスコープの外', '論理式の外側'] },
      { id: 3, ans: '自由変数であり，かつ束縛変数でもある', opts: ['自由変数であり，かつ束縛変数でもある', '束縛変数のみである', '自由変数のみである'] },
    ],
    template: `
<p><b>(1) $P(a(x))$ は論理式ではない．</b><br>
理由：$a$ は {{0}} であるため，引数 $x$ を与えた $a(x)$ は項の定義 (1)〜(3) のいずれでも作れず，{{1}}．1引数述語記号 $P$ の引数は項でなければならないため，$P(a(x))$ は原子論理式ではなく，論理式ではない．</p>
<p><b>(2) $y$ の分類：</b><br>
量化記号は $∧$ より優先順位が高いため $(∀xP(x,y)) ∧ (∀yQ(y))$ と読む．左側の $P(x,y)$ における $y$ は {{2}} にあるため<b>自由な出現</b>であり，右側の $∀yQ(y)$ における $y$ は<b>束縛された出現</b>である．したがって変数 $y$ は {{3}}．</p>`,
    note: 'ポイント：「なぜ論理式でないか」は必ず **「○○は項ではない → 述語の引数は項でなければならない → 原子論理式でない」** の三段論法で書く！',
  },
  {
    id: 'w-ex8',
    badge: '総仕上げ · 第7〜8回型',
    title: '1階述語論理の導出（反駁）による恒真性証明の完全記述',
    goal: '課題：$F = ∀x(P(x) ⊃ Q(x)) ∧ ∃xP(x) ⊃ ∃xQ(x)$ が恒真であることを導出原理で証明せよ．',
    blanks: [
      { id: 0, ans: '否定 ¬F', opts: ['否定 ¬F', 'そのままの式 F', '対偶'] },
      { id: 1, ans: '新しい Skolem 定数 c', opts: ['新しい Skolem 定数 c', '1引数 Skolem 関数 f(x)', '既存の変数 x'] },
      { id: 2, ans: '充足不能性', opts: ['充足不能性', '論理的同値性', '恒真性'] },
      { id: 3, ans: 'mgu σ₁ = {x := c}', opts: ['mgu σ₁ = {x := c}', '真理値割当 I(c) = ⊤', '同値変形'] },
      { id: 4, ans: '導出原理の健全性より ¬F は充足不能，よって F は恒真', opts: ['導出原理の健全性より ¬F は充足不能，よって F は恒真', '導出原理の完全性より F は充足可能', '葉が初期シーケントなのでトートロジ'] },
    ],
    template: `
<p>与えられた論理式 $F$ の {{0}} をとり，それが充足不能であることを示す．</p>
<ol class="pt-steps">
<li>$¬F = ∀x(¬P(x) ∨ Q(x)) ∧ ∃yP(y) ∧ ∀z¬Q(z)$ を冠頭形にすると $∃y∀x∀z((¬P(x) ∨ Q(x)) ∧ P(y) ∧ ¬Q(z))$．</li>
<li>先頭の $∃y$ の前には全称記号 $∀$ が 1 つもないため，{{1}} で $y$ を置き換えて $∃y$ を消去する（Skolem 化の正当性より {{2}} が保たれる）．</li>
<li>先頭の $∀$ を省略して節集合 <b>(1) $¬P(x) ∨ Q(x)$，(2) $P(c)$，(3) $¬Q(z)$</b> を得る．</li>
<li>(1) と (2) より {{3}} を用いて <b>(4) $Q(c)$</b> を導出し，さらに (3) と (4) より mgu $\\sigma_2 = \\{z := c\\}$ を用いて <b>(5) 空節 $\\bot$</b> を導出する．</li>
</ol>
<p>空節 $\\bot$ が導出されたので，{{4}} である．∎</p>`,
    note: 'ポイント：①最初に否定、②Skolem化の正当性（充足不能性の保持）、③親節番号＋mgu、④健全性から恒真を結論、の4点セットで減点ゼロ！',
  },
]

export function proofWritingTrainerWidget() {
  const saved = store.get('midterm-wtrainer', {}) // { drillId: { blankId: val } }
  let cur = 0
  const wrap = h('div.mt-wt-wrap.reveal')
  const tabs = h('div.mt-ex-filters')
  const body = h('div.mt-wt-body')

  function renderTabs() {
    tabs.innerHTML = ''
    WRITING_DRILLS.forEach((d, i) => {
      const st = saved[d.id] || {}
      const perfect = d.blanks.every((b) => st[b.id] === b.ans)
      tabs.append(h('button.mt-fbtn', {
        type: 'button',
        class: i === cur ? 'on' : '',
        onclick: () => { cur = i; renderTabs(); renderBody() },
      }, `${perfect ? '✓ ' : ''}${i + 1}. ${d.badge}`))
    })
  }

  function renderBody() {
    body.innerHTML = ''
    const d = WRITING_DRILLS[cur]
    const st = { ...(saved[d.id] || {}) }

    const feedback = h('div.mt-wt-fb')
    // Split template by {{0}}..{{n}}
    const htmlStr = rich(d.template)
    const parts = htmlStr.split(/\{\{(\d+)\}\}/g)
    const container = h('div.mt-wt-sheet.proof-text')

    // Build DOM safely while inserting <select> elements in place of {{k}}
    const markerHolder = h('div', { html: parts.map((p, idx) => (idx % 2 === 1 ? `<span data-slot="${p}"></span>` : p)).join('') })
    const selects = []

    d.blanks.forEach((b) => {
      const slot = markerHolder.querySelector(`[data-slot="${b.id}"]`)
      if (!slot) return
      const sel = h('select.mt-wt-sel', {
        'aria-label': `空欄 ${b.id + 1}`,
        onchange: (e) => {
          st[b.id] = e.target.value
          saved[d.id] = st
          store.set('midterm-wtrainer', saved)
          updateCheck(false)
          renderTabs()
        },
      },
      h('option', { value: '' }, `［空欄 ${b.id + 1} を選択］`),
      ...b.opts.map((o) => h('option', { value: o, selected: st[b.id] === o }, o)))
      selects.push({ b, sel })
      slot.replaceWith(sel)
    })

    while (markerHolder.firstChild) container.append(markerHolder.firstChild)

    function updateCheck(celebrate) {
      let okCnt = 0
      let filled = 0
      selects.forEach(({ b, sel }) => {
        const v = sel.value
        sel.classList.remove('ok', 'ng')
        if (v) {
          filled++
          if (v === b.ans) { okCnt++; sel.classList.add('ok') }
          else sel.classList.add('ng')
        }
      })
      feedback.innerHTML = ''
      if (okCnt === d.blanks.length) {
        feedback.append(h('div.mt-wt-ok', { html: rich(`🎉 <b>満点答案の骨格が完成しました！（${okCnt}/${d.blanks.length} 正解）</b>　${d.note}`) }))
        if (celebrate) confettiAt(feedback)
      } else if (filled > 0) {
        feedback.append(h('div.mt-wt-prog', `現在 ${okCnt} / ${d.blanks.length} 箇所正解（赤い空欄を見直してみよう！）`))
      }
    }

    const fillAnsBtn = h('button.btn.sm', {
      type: 'button',
      onclick: () => {
        d.blanks.forEach((b) => { st[b.id] = b.ans })
        saved[d.id] = st
        store.set('midterm-wtrainer', saved)
        renderTabs(); renderBody()
      },
    }, '👀 模範解答をすべて埋める')

    const clearBtn = h('button.btn.sm', {
      type: 'button',
      onclick: () => {
        delete saved[d.id]
        store.set('midterm-wtrainer', saved)
        renderTabs(); renderBody()
      },
    }, '↺ 空欄に戻して再テスト')

    selects.forEach(({ b, sel }) => {
      sel.addEventListener('change', () => {
        if (d.blanks.every((x) => (saved[d.id] || {})[x.id] === x.ans)) updateCheck(true)
      })
    })

    updateCheck(false)

    body.append(
      h('div.mt-wt-goal', { html: rich(`<b>${d.title}</b><br>${d.goal}`) }),
      container,
      feedback,
      h('div.mt-wt-actions', fillAnsBtn, clearBtn))
  }

  renderTabs()
  renderBody()

  wrap.append(
    h('div.mt-fc-head',
      h('div',
        h('span.ig-tag', 'PROOF WRITING TRAINER · 記述表現の型を体得'),
        h('h4', { style: { margin: '4px 0 2px', fontSize: '16.5px', fontWeight: 900 } }, '✍️ 記述答案・骨格穴埋めトレーナー（頻出4大証明テンプレ）'),
        h('p', { style: { margin: 0, fontSize: '12.5px', fontWeight: 700, color: 'var(--ink-2)' } }, '「わかっているのに言葉にできない」を解消！ 空欄を選ぶだけで、減点されない論理接続詞と量化表現（「任意の I」「ある I」）が身につきます。'))),
    tabs,
    body)
  return wrap
}

// ============================================================
//  2. 減点答案・添削ドリル（「どこが減点されるか」を採点者目線で見抜く）
// ============================================================
const FLAW_CASES = [
  {
    no: '添削 1（ex5.1型）',
    q: '問題：「$A ∧ B ⊃ C$ がトートロジならば $B ⊃ C ∨ ¬A$ もトートロジ」を同値変形を使わず示せ．',
    badAns: '【学生の答案】$B ⊃ C ∨ ¬A$ は含意の同値変形により $¬B ∨ C ∨ ¬A$ となり，交換・結合則とド・モルガン則より $¬(A ∧ B) ∨ C$ すなわち $A ∧ B ⊃ C$ と論理的同値である．仮定より $A ∧ B ⊃ C$ はトートロジなので，結論もトートロジである．',
    options: [
      'ド・モルガン則の使い方が間違っている',
      '問題文で禁止されている「式の同値変形」を使っており，真偽値割り当ての定義から直接証明していない（大幅減点／0点）',
      '$A ∧ B ⊃ C$ の括弧の位置が間違っている',
    ],
    ans: 1,
    fix: '健全性（LKの正しさ）を示す場面では同値変形自体がまだ使えない前提のため，問題文で明確に禁止されています。必ず「ある解釈 $I$ で結論が $⊥$ になると仮定 → 真偽値定義 (7)(6)(4) で各値を決定 → 前提も $⊥$ になり矛盾」と<b>意味論の定義のみ</b>で書きましょう。',
  },
  {
    no: '添削 2（ex7.2型）',
    q: '問題：閉じた式 $F = ∀x∀y((P(x) ∨ ¬Q(a, x)) ∧ P(f(y)))$ のエルブラン基底 $HB$ と基礎例を1つ書け．',
    badAns: '【学生の答案】エルブラン領域は $H = \\{a, f(a), f(f(a)), …\\}$．よって $HB = \\{P(t) \\mid t \\in H\\} \\cup \\{Q(a, t) \\mid t \\in H\\}$．また基礎例は $∀x∀y((P(a) ∨ ¬Q(a, a)) ∧ P(f(a)))$ である．',
    options: [
      '減点箇所が2つある：① $HB$ の $Q$ の第1引数を $a$ に固定してしまっている点（正しくは $Q(t_1,t_2)$ 全体）、② 基礎例に先頭の $∀x∀y$ を残してしまっている点',
      'エルブラン領域 $H$ に変数 $x, y$ を入れていない点が誤り',
      '基礎例では $x$ と $y$ に必ず異なる要素 $a$ と $f(a)$ を入れなければならない',
    ],
    ans: 0,
    fix: '超頻出のダブル減点パターンです！ ① $HB$ は式中の出現形 $Q(a,x)$ に関係なく「述語記号に $H$ の要素を入れた原子論理式すべて（$Q(f(a), a)$ 等も含む）」、② 基礎例は<b>先頭の全称記号 $∀x∀y$ を外した母式</b>の変数を $H$ の要素に置き換えた $(P(a) ∨ ¬Q(a,a)) ∧ P(f(a))$ です！',
  },
  {
    no: '添削 3（第8回・1階導出）',
    q: '問題：節 (1) $P(x) ∨ Q(x)$ と 節 (2) $¬P(f(x))$ から導出を行え．',
    badAns: '【学生の答案】$P(x)$ と $P(f(x))$ を単一化しようとすると，不一致集合 $\\{x, f(x)\\}$ において $f(x)$ の中に変数 $x$ 自身が出現するため，出現検査（occur check）により単一化不可能である．よって導出節は作れない．',
    options: [
      '実は $x := a$ を代入すれば単一化できる',
      '親節どうしの変数 $x$ は別々の $∀$ で縛られた独立な変数なのに，導出前の「変数の分離（例：$¬P(f(x_1))$ へのつけかえ）」を忘れている',
      '出現検査は命題論理にしか存在しないルールである',
    ],
    ans: 1,
    fix: '節集合の各節はそれぞれ独立に全称量化（$∀x(P(x)∨Q(x))$ と $∀x¬P(f(x))$）されています！ ぶつける前に必ず片方を新しい変数につけかえて $¬P(f(x_1))$ と分離すれば，mgu $\\{x := f(x_1)\\}$ で単一化でき，導出節 $Q(f(x_1))$ が得られます。',
  },
  {
    no: '添削 4（ex3.1 / ex6.2型）',
    q: '問題：(a) $[[A ⊃ B]]_I = ⊤$ のときの $[[A]]_I$ の値　(b) $∀xP(x,y) ∧ ∀yQ(y)$ の $y$ は自由変数か束縛変数か．',
    badAns: '【学生の答案】(a) $A ⊃ B$ が真なので前件も真とは限らず $[[A]]_I = ⊥$ である．　(b) 後半に $∀y$ があるので $y$ は束縛変数である（自由変数ではない）．',
    options: [
      '(a) は $⊤$ と答えるべきで、(b) は自由変数のみと答えるべき',
      '(a) は「一意に定まらない（$⊤$ の例と $⊥$ の例の両方がある）」と答えるべきで、(b) は自由な出現と束縛された出現の両方をもつため「自由変数であり，かつ束縛変数でもある」と両方答えるべき',
      '(a)(b) ともにこの答案で満点になる',
    ],
    ans: 1,
    fix: 'どちらも「片方に決めつけて半分の点数を落とす」典型例です！ (a) $[[A]]_I=⊥$ のときも $[[A]]_I=[[B]]_I=⊤$ のときも $[[A⊃B]]_I=⊤$ になるため「一意には定まらない」が正解。(b) 自由変数・束縛変数は排他的ではなく、出現場所によって両方に該当しえます！',
  },
]

export function spotTheFlawWidget() {
  const picked = {}
  const wrap = h('div.mt-flaw-wrap')

  FLAW_CASES.forEach((c, idx) => {
    const resBox = h('div')
    const optsBox = h('div.mt-flaw-opts')

    const renderOpts = () => {
      optsBox.innerHTML = ''
      resBox.innerHTML = ''
      const ch = picked[idx]
      c.options.forEach((o, oi) => {
        let cls = ''
        if (ch !== undefined) {
          if (oi === c.ans) cls = 'ok'
          else if (oi === ch) cls = 'ng'
        }
        optsBox.append(h('button.mt-dq-btn', {
          type: 'button',
          class: cls,
          html: rich(o),
          onclick: (e) => {
            picked[idx] = oi
            if (oi === c.ans) confettiAt(e.currentTarget)
            renderOpts()
          },
        }))
      })
      if (ch !== undefined) {
        resBox.append(h('div.mt-flaw-fix', {
          html: rich(`${ch === c.ans ? '<b>✓ 見事！ 採点者の視点クリア：</b>' : '<b>✕ 惜しい！ 正しい減点理由：</b>'} ${c.fix}`),
        }))
      }
    }
    renderOpts()

    wrap.append(h('article.mt-flaw-card.reveal',
      h('div.mt-ex-badges', h('span.mt-eb-lec', c.no), h('span.mt-eb-kind.ex', '🔍 減点箇所を見抜け！')),
      h('div.mt-flaw-q', { html: rich(c.q) }),
      h('div.mt-flaw-bad', { html: rich(c.badAns) }),
      optsBox,
      resBox))
  })
  return wrap
}

// ============================================================
//  3. 試験用紙に記載される「定義・推論規則リファレンス」再現シート
// ============================================================
export function examGivenDefinitionsDrawer() {
  const LK_MINI = [
    ['¬左', 'Γ → Δ, A', '¬A, Γ → Δ'],
    ['¬右', 'A, Γ → Δ', 'Γ → Δ, ¬A'],
    ['∧左', 'A, B, Γ → Δ', 'A ∧ B, Γ → Δ'],
    ['∧右', 'Γ → Δ, A　｜　Γ → Δ, B', 'Γ → Δ, A ∧ B'],
    ['∨左', 'A, Γ → Δ　｜　B, Γ → Δ', 'A ∨ B, Γ → Δ'],
    ['∨右', 'Γ → Δ, A, B', 'Γ → Δ, A ∨ B'],
    ['⊃左', 'Γ → Δ, A　｜　B, Γ → Δ', 'A ⊃ B, Γ → Δ'],
    ['⊃右', 'A, Γ → Δ, B', 'Γ → Δ, A ⊃ B'],
  ]

  return h('details.mt-given-sheet.reveal',
    h('summary', '📄 本番の問題用紙に記載される「定義・LK推論規則シート」を開いて見ながら解く（クリックで開閉）'),
    h('div.mt-given-in',
      h('p.mt-mail-note', { html: rich('中間試験案内：<i>「必要な定義は大体記述しますので，たとえばシーケント計算の推論規則を覚える必要はありません」</i> — 予想問題を解くときは、本番と同じく<b>この定義シートだけを参照して</b>自分の言葉で答案を書いてみましょう！') }),
      h('div.mt-given-grid',
        h('div.mt-given-box',
          h('h6', '[定義] 真偽値割り当て（命題・1階述語）'),
          h('div', { html: rich(`<ul class="mt-given-ul">
            <li>(3) $[[P(t_1,…,t_n)]]_{I,J} = I(P)([[t_1]]_{I,J},…,[[t_n]]_{I,J})$</li>
            <li>(4) $[[¬A]]_{I,J} = ⊤ \\iff [[A]]_{I,J} = ⊥$</li>
            <li>(5) $[[A ∧ B]]_{I,J} = ⊤ \\iff [[A]]_{I,J} = ⊤$ かつ $[[B]]_{I,J} = ⊤$</li>
            <li>(6) $[[A ∨ B]]_{I,J} = ⊤ \\iff [[A]]_{I,J} = ⊤$ または $[[B]]_{I,J} = ⊤$</li>
            <li>(7) $[[A ⊃ B]]_{I,J} = ⊤ \\iff [[A]]_{I,J} = ⊥$ または $[[B]]_{I,J} = ⊤$</li>
            <li>(8) $[[∀xA]]_{I,J} = ⊤ \\iff$ 任意の $u \\in D$ に対し $[[A]]_{I,J[u/x]} = ⊤$</li>
            <li>(9) $[[∃xA]]_{I,J} = ⊤ \\iff$ ある $u \\in D$ に対し $[[A]]_{I,J[u/x]} = ⊤$</li>
          </ul>`) })),
        h('div.mt-given-box',
          h('h6', '[定義] 充足可能・恒真・エルブラン領域'),
          h('div', { html: rich(`<ul class="mt-given-ul">
            <li><b>充足可能：</b>ある $I$（と $J$）で $[[A]] = ⊤$ ／ <b>充足不能：</b>充足可能でない</li>
            <li><b>恒真（トートロジ）：</b>任意の $I$（と $J$）で $[[A]] = ⊤$</li>
            <li><b>エルブラン領域 $H$：</b>(1) $H_0$ は $A$ に現れる定数の集合（定数がなければ $H_0=\\{a\\}$）．(2) $H_{i+1} = H_i \\cup \\{f(t_1,…,t_k) \\mid t_j \\in H_i\\}$．$H = \\lim_{i\\to\\infty} H_i$．</li>
            <li><b>エルブラン基底 $HB$：</b>$\\{P(t_1,…,t_k) \\mid P$ は $A$ の述語, $t_j \\in H\\}$</li>
            <li><b>基礎例：</b>$F=∀x_1…∀x_n A$ の $A$ の変数を $H$ の要素で置き換えた式</li>
          </ul>`) }))),
      h('div.mt-given-box', { style: { marginTop: '8px' } },
        h('h6', '[規則表] シーケント計算 LK の推論規則（上が前提・下が結論）＋ 初期シーケント（両辺が命題記号のみで共通記号を含む）'),
        h('div.mt-lk-mini',
          ...LK_MINI.map(([name, prem, conc]) => h('div.mt-lkm-cell',
            h('span.rn', name),
            h('div.p', { html: fxs(prem) }),
            h('div.bar'),
            h('div.c', { html: fxs(conc) })))))))
}
