// ex8（第8回 一階述語論理 — 冠頭形・単一化・Skolem化・導出原理）の問題データ — 演習解説ページと第8回講義ページで共有
import { h, html, rich, esc } from '../lib/ui.js'
import { parseFol, folHTML, showFol, termHTML, showTerm } from '../logic/fol.js'
import { nnf, renameApart, pullQuant, withPrefix, skolemize, unify, parseClause } from '../logic/fol-proof.js'
import { subHTML, folResBoard } from '../widgets/fol-widgets.js'
import { toto } from '../lib/chars.js'

const F = (s) => `<span class="fx fol">${folHTML(parseFol(s))}</span>`

// ---------- 8.1 lab: 冠頭形変換ステップチェッカー ----------
function ex81PrenexLab() {
  const ITEMS = [
    {
      label: '(i) ∀xP(x) ∨ ∀xQ(x)',
      src: '∀xP(x) ∨ ∀xQ(x)',
      trap: '∀x(P(x) ∨ Q(x)) とまとめてしまうのは誤り！（ex7.1 で確かめた通り ∀ は ∨ にそのまま分配できない。必ず片方の束縛変数を別名 y につけかえてから前に出す！）',
      steps: [
        ['与えられた論理式', '∀xP(x) ∨ ∀xQ(x)', '2 つの ∀x のスコープは別々（左は P(x) のみ、右は Q(x) のみ）'],
        ['束縛変数名のつけかえ（1.6.1）', '∀xP(x) ∨ ∀yQ(y)', '右側の ∀xQ(x) の x を新しい変数 y におきかえる（∀xQ(x) = ∀yQ(y)）'],
        ['左の ∀x を外へ移動（1.6.3）', '∀x(P(x) ∨ ∀yQ(y))', '∀yQ(y) に自由変数 x は含まれないので Qxα[x] ∨ β = Qx(α[x] ∨ β)'],
        ['冠頭形の完成！（1.6.3）', '∀x∀y(P(x) ∨ Q(y))', 'P(x) に y は含まれないので ∀y も前に出せる（∀y∀x(P(x) ∨ Q(y)) も正解）'],
      ],
    },
    {
      label: '(ii) ¬∃xP(x) ∧ ∀xQ(x)',
      src: '¬∃xP(x) ∧ ∀xQ(x)',
      trap: '¬∃xP(x) を ∃x¬P(x) としてしまうのは誤り！（存在の否定は全称 ∀x¬P(x) に変わる）。また ∧ 同士なら ∀xα ∧ ∀xβ = ∀x(α ∧ β) で1つの ∀x にまとめても、別変数 y を導入して ∀x∀y(¬P(x) ∧ Q(y)) としてもどちらも論理的同値で正解！',
      steps: [
        ['与えられた論理式', '¬∃xP(x) ∧ ∀xQ(x)', '先頭の ¬ は ∃xP(x) にかかっている（¬∃x）'],
        ['ド・モルガン則（1.6.2）', '∀x¬P(x) ∧ ∀xQ(x)', '¬∃xP(x) = ∀x(¬P(x)) で ¬ を量化記号の内側へ入れる'],
        ['方法A（別変数 y を導入）', '∀x∀y(¬P(x) ∧ Q(y))', '右を ∀yQ(y) につけかえて順に前に出す（もっとも汎用で安全な手順）'],
        ['方法B（∀ と ∧ の分配で1変数に統合）', '∀x(¬P(x) ∧ Q(x))', '∀xα[x] ∧ ∀xβ[x] = ∀x(α[x] ∧ β[x]) を使えば新しい変数なしでも冠頭形になる（方法A・Bどちらも同値で正解！）'],
      ],
    },
  ]
  let cur = 0
  const tabs = h('div.mt-ex-filters', { style: { marginBottom: '10px' } })
  const stage = h('div')

  function render() {
    tabs.innerHTML = ''
    ITEMS.forEach((it, i) => tabs.append(h('button.mt-fbtn', {
      type: 'button',
      class: i === cur ? 'on' : '',
      onclick: () => { cur = i; render() },
    }, it.label)))

    const it = ITEMS[cur]
    stage.innerHTML = ''
    const ol = h('ol.ck-steps')
    it.steps.forEach(([labTxt, fxStr, note], idx) => {
      ol.append(h('li.ck-step', {
        style: { '--d': `${idx * 0.07}s` },
        class: idx === it.steps.length - 1 || idx === it.steps.length - 2 ? 'key' : '',
      },
      h('span.ck-lab', labTxt),
      h('span.fx.fol', { html: folHTML(parseFol(fxStr)) }),
      h('small', note)))
    })
    stage.append(
      ol,
      h('div.mt-trap-line', { style: { marginTop: '10px' }, html: rich(`<b>⚠️ 減点注意：</b>${it.trap}`) }))
  }

  render()
  return h('div',
    h('p.bl-lead', { html: rich('(i) と (ii) を切り替えて、「<b>¬ を内側へ入れる → 変数名の衝突を避ける → 量化記号を前へ出す</b>」の 1 行ずつの同値変形を確認できます。') }),
    tabs, stage)
}

// ---------- 8.2 lab: 単一化 (i)(ii) ステップ比較ラボ ----------
function ex82UnifyLab() {
  const CASES = [
    ['8.2 (i) P(x, y) と P(a, f(b))', 'P(x, y)', 'P(a, f(b))'],
    ['8.2 (ii) P(x, f(x)) と P(f(y), f(b))', 'P(x, f(x))', 'P(f(y), f(b))'],
    ['比較：もし P(x, f(x)) と P(f(b), f(f(b))) なら？', 'P(x, f(x))', 'P(f(b), f(f(b)))'],
  ]
  let cur = 0
  const tabs = h('div.mt-ex-filters', { style: { marginBottom: '10px' } })
  const stage = h('div')

  function render() {
    tabs.innerHTML = ''
    CASES.forEach(([label], i) => tabs.append(h('button.mt-fbtn', {
      type: 'button',
      class: i === cur ? 'on' : '',
      onclick: () => { cur = i; render() },
    }, label)))

    const [, s1, s2] = CASES[cur]
    const A = parseFol(s1), B = parseFol(s2)
    const r = unify([A, B])
    stage.innerHTML = ''

    const ol = h('ol.un-steps')
    r.steps.forEach((s, i) => {
      const li = h('li.un-step', { style: { '--d': `${i * 0.1}s` }, class: s.done ? 'ok' : s.fail ? 'ng' : '' })
      li.append(h('div.un-pair', ...s.cur.map((c) => h('span.fx.fol', { html: folHTML(parseFol(c)) }))))
      if (s.D) li.append(h('div.un-d', { html: `不一致集合 D = { ${s.D.map((d) => `<span class="fx">${esc(d)}</span>`).join(', ')} }` }))
      if (s.bind) li.append(h('div.un-b', { html: `→ 代入 <span class="fx fol">${subHTML(s.bind)}</span> を適用` }))
      if (s.done) li.append(h('div.un-b', '完全に一致した！'))
      ol.append(li)
    })

    stage.append(ol)
    if (r.ok) {
      stage.append(html(`<div class="verdict valid">${toto('top')}<div><b>単一化可能！</b>　mgu σ = <span class="fx fol">${subHTML(r.mgu)}</span><small>単一化後の式：<b>${esc(r.steps[r.steps.length - 1].cur[0])}</b></small></div></div>`))
    } else {
      stage.append(html(`<div class="verdict unsat">${toto('bot')}<div><b>単一化不可能</b><small>${esc(r.reason)}</small></div></div>`))
    }
  }

  render()
  return h('div',
    h('p.bl-lead', { html: rich('左から順番に最初の食い違い（不一致集合 D）を見つけて代入を合成していく過程を確認できます。(ii) がどの段でなぜ破綻するかに注目！') }),
    tabs, stage)
}

// ---------- 8.3 lab: Skolem 化の依存関係ビジュアライザ ----------
function ex83SkolemLab() {
  const f0 = parseFol('∀x∀y∃z∃w(P(x, y) ∨ Q(x, z) ∨ R(z, w))')
  const pref = []
  const mat = pullQuant(renameApart(nnf(f0)), pref)
  // 問題文に P, Q, R しか関数記号がないので、新しい 2 引数関数記号として f, g を使う
  const sk = skolemize(pref, mat, new Set(['p', 'q', 'r']))
  const resF = withPrefix(sk.prefix, sk.matrix)

  return h('div',
    h('p.bl-lead', { html: rich('冠頭 <span class="fx">∀x ∀y ∃z ∃w</span> の並びを見て、各 <span class="fx">∃</span> の<b>左（前）にどの ∀ があるか</b>だけを指差し確認します。') }),
    html(`<div class="sk-row">
      <div class="sk-c">
        <b>1. ∃z の置き換え</b>
        <span class="fx"><b>∀x ∀y</b> ∃z …</span>
        <span class="sk-ar">↓ 前の ∀ は x, y の2つ</span>
        <span class="fx fol"><span class="vr">z</span> := <span class="fn">f</span>(<span class="vr">x</span>, <span class="vr">y</span>)</span>
        <small>母式で z が Q(x, z) だけに現れていても、冠頭で前に ∀x, ∀y の両方があるため <b>2 引数関数 f(x, y)</b> にする！</small>
      </div>
      <div class="sk-c">
        <b>2. ∃w の置き換え</b>
        <span class="fx"><b>∀x ∀y</b> ∃z ∃w …</span>
        <span class="sk-ar">↓ 前の ∀ は同じく x, y の2つ</span>
        <span class="fx fol"><span class="vr">w</span> := <span class="fn">g</span>(<span class="vr">x</span>, <span class="vr">y</span>)</span>
        <small>f とは<b>別の新しい 2 引数関数記号 g</b> を用意する！（前の ∃z は全称記号ではないので g の引数に z は入れない）</small>
      </div>
    </div>`),
    h('div.sub-row.res', { style: { marginTop: '12px' } },
      h('span.sub-k', 'Skolem 化の結果'),
      h('span.fx.fol', { html: folHTML(resF) })))
}

// ---------- 8.4 lab: インタラクティブ導出ボード ----------
function ex84ResLab() {
  const init = ['P(x) ∨ Q(x)', '¬P(f(a))', '¬Q(f(y)) ∨ R(y)', '¬R(z)'].map(parseClause)
  return h('div',
    h('p.bl-lead', { html: rich('問題 8.4 の 4 つの節が並んでいます。節を 2 つずつクリックして <b>mgu σ</b> と導出節を確かめながら <b>空節 ⊥</b> を出してみよう（「▶ 自動で反駁」も使えます）。') }),
    folResBoard(init))
}

export const EX8 = [
  {
    no: '8.1',
    q: 'P, Q を述語記号，x を変数とするとき，以下の論理式を論理的同値な冠頭形に変換せよ．必要ならば他の変数も導入すること．<br>(i) ∀xP(x) ∨ ∀xQ(x)　　(ii) ¬∃xP(x) ∧ ∀xQ(x)',
    hint: '<b>(i)</b> ∀ は ∨ にはそのまままとめられない（∀xP(x) ∨ ∀xQ(x) ≠ ∀x(P(x) ∨ Q(x))）。片方の束縛変数 x を新しい変数 y につけかえてから量化記号を前へ出そう！<br><b>(ii)</b> まず ¬∃xP(x) にド・モルガン則 ¬∃xα = ∀x¬α を使う。すると ∀x¬P(x) ∧ ∀xQ(x) になるので、別変数 y を導入して ∀x∀y(…) にしても、∀ と ∧ の同値性で ∀x(¬P(x) ∧ Q(x)) にまとめても OK！',
    answer: () => h('div.proof-text', { html: rich(`
<p><b>(i)　${F('∀x∀y(P(x) ∨ Q(y))')}</b>　（${F('∀y∀x(P(x) ∨ Q(y))')} も同値で正解）</p>
<p><b>変換過程：</b></p>
<ol class="pt-steps">
<li>与えられた式：${F('∀xP(x) ∨ ∀xQ(x)')}</li>
<li>右側の束縛変数 $x$ を新しい変数 $y$ につけかえる（$∀xQ(x) = ∀yQ(y)$）：<br>${F('∀xP(x) ∨ ∀yQ(y)')}</li>
<li>$∀yQ(y)$ は自由変数 $x$ を含まないので，$∀x$ を前に出す：<br>${F('∀x(P(x) ∨ ∀yQ(y))')}</li>
<li>$P(x)$ は自由変数 $y$ を含まないので，$∀y$ を前に出して冠頭形を得る：<br><b>${F('∀x∀y(P(x) ∨ Q(y))')}</b></li>
</ol>
<p class="pt-note">※ 注意：$∀x(P(x) ∨ Q(x))$ は元の式と論理的同値ではないため誤り（ex7.1 で確認した通り）。必ず別変数 $y$ を導入する。</p>

<p style="margin-top:14px"><b>(ii)　${F('∀x∀y(¬P(x) ∧ Q(y))')}　または　${F('∀x(¬P(x) ∧ Q(x))')}</b>（どちらも論理的同値な冠頭形で正解）</p>
<p><b>変換過程（別変数 $y$ を導入する方法）：</b></p>
<ol class="pt-steps">
<li>与えられた式：${F('¬∃xP(x) ∧ ∀xQ(x)')}</li>
<li>量化記号のド・モルガン則 $¬∃xP(x) = ∀x(¬P(x))$ を適用する：<br>${F('∀x¬P(x) ∧ ∀xQ(x)')}</li>
<li>右側の束縛変数 $x$ を新しい変数 $y$ につけかえる：<br>${F('∀x¬P(x) ∧ ∀yQ(y)')}</li>
<li>(i) と同様に量化記号を順に前へ出して冠頭形を得る：<br><b>${F('∀x∀y(¬P(x) ∧ Q(y))')}</b></li>
</ol>
<p class="pt-note">※ 別解：ステップ 2 の ${F('∀x¬P(x) ∧ ∀xQ(x)')} に対して，論理的同値 $∀x\\alpha[x] ∧ ∀x\\beta[x] = ∀x(\\alpha[x] ∧ \\beta[x])$（講義ノート 1.6.3）を直接適用すれば，新しい変数を導入せず <b>${F('∀x(¬P(x) ∧ Q(x))')}</b> としてもよい（どちらも正しい冠頭形である）．</p>`) }),
    lab: () => ex81PrenexLab(),
    labLabel: '🧪 (i)(ii) の同値変形を1段ずつ確認',
  },
  {
    no: '8.2',
    q: 'f を 1 引数の関数記号，P を 2 引数の述語記号，x, y を個体変数，a, b を定数記号とする時，以下の各式の組は単一化可能か？ 可能な場合は最汎単一化子 (mgu) を求め，可能でない場合は理由を示せ．<br>(i) P(x, y) と P(a, f(b))，　(ii) P(x, f(x)) と P(f(y), f(b))',
    hint: '<b>(i)</b> 左から引数を比べると第 1 引数は x と a、第 2 引数は y と f(b)。変数の衝突も出現検査の問題もない！<br><b>(ii)</b> 第 1 引数 x と f(y) を合わせるには <b>x := f(y)</b> が必要。それを 1 つ目の式の第 2 引数 f(x) にも代入すると <b>f(f(y))</b> になり、2 つ目の式の第 2 引数 <b>f(b)</b> と比べると f(y) と b がぶつかる！',
    answer: () => h('div.proof-text', { html: rich(`
<p><b>(i)　単一化可能．最汎単一化子（mgu）は <span class="fx">{x := a, y := f(b)}</span></b></p>
<p><b>過程：</b></p>
<ol class="pt-steps">
<li>$P(x, y)$ と $P(a, f(b))$ を左から比較すると，最初の不一致集合は $\\{x, a\\}$ である．代入 $\\sigma_1 = \\{x := a\\}$ をほどこすと，両式は $P(a, y)$ と $P(a, f(b))$ になる．</li>
<li>次の不一致集合は $\\{y, f(b)\\}$ である（$f(b)$ に変数 $y$ は出現しない）．代入 $\\sigma_2 = \\{y := f(b)\\}$ を合成すると，両式とも $P(a, f(b))$ となって一致する．</li>
<li>よって単一化可能であり，mgu は <b>$\\sigma = \\sigma_2\\sigma_1 = \\{x := a,\\ y := f(b)\\}$</b> である．</li>
</ol>

<p style="margin-top:14px"><b>(ii)　単一化可能でない（単一化不可能）．</b></p>
<p><b>理由：</b></p>
<ol class="pt-steps">
<li>$P(x, f(x))$ と $P(f(y), f(b))$ が単一化可能であると仮定し，ある単一化子 $\\theta$ によって両式が一致するとする．</li>
<li>まず第 1 引数 $x$ と $f(y)$ を一致させる必要があるため，不一致集合 $\\{x, f(y)\\}$ より $\\sigma_1 = \\{x := f(y)\\}$ を適用する．</li>
<li>すると 1 つ目の式は $P(f(y), f(f(y)))$，2 つ目の式は $P(f(y), f(b))$ となる．</li>
<li>次に第 2 引数 $f(f(y))$ と $f(b)$（外側の $f$ を除いた内側）を比較すると，不一致集合は <b>$\\{f(y),\\ b\\}$</b> となる．</li>
<li>ここで <b>$f(y)$ は 1 引数関数記号 $f$ から始まる項であり，$b$ は定数記号（0 引数）であるため，どちらも変数ではない（記号の衝突）</b>．いかなる代入を $y$ にほどこしても $f(t)$ の形の項が定数 $b$ と一致することはない．</li>
</ol>
<p>したがって，$P(x, f(x))$ と $P(f(y), f(b))$ は<b>単一化不可能</b>である．</p>`) }),
    lab: () => ex82UnifyLab(),
    labLabel: '🧪 単一化ステッパーで (i)(ii) を検証',
  },
  {
    no: '8.3',
    q: '以下の論理式を Skolem 化せよ．<br><span class="fx fol">∀x∀y∃z∃w(P(x, y) ∨ Q(x, z) ∨ R(z, w))</span>',
    hint: 'すでに冠頭形になっている！ ∃z と ∃w の<b>前（左側）にある全称記号 ∀</b> はどちらも <b>∀x と ∀y の 2 つ</b>。だから z と w をそれぞれ <b>x, y の 2 つを引数にとる別々の新しい Skolem 関数記号</b>（たとえば f(x, y) と g(x, y)）で置き換え、∃z∃w を冠頭から取り除く。',
    answer: () => h('div.proof-text', { html: rich(`
<p><b>解答例：</b>新しい 2 引数の関数記号（Skolem 関数）$f, g$ を導入すると，</p>
<p class="pt-eq">${F('∀x∀y(P(x, y) ∨ Q(x, f(x, y)) ∨ R(f(x, y), g(x, y)))')}</p>
<p><b>解説（手順）：</b></p>
<ol class="pt-steps">
<li>与えられた論理式はすでに冠頭形 $∀x∀y∃z∃w\\ A_0(x, y, z, w)$ である．</li>
<li>存在記号 <b>$∃z$</b> の前にある全称記号は <b>$∀x, ∀y$</b> の 2 つであるから，新しい 2 引数の Skolem 関数記号 <b>$f$</b> を用意し，母式中のすべての $z$（2 箇所）を <b>$f(x, y)$</b> で置き換え，冠頭から $∃z$ を除く．</li>
<li>存在記号 <b>$∃w$</b> の前にある全称記号も <b>$∀x, ∀y$</b> の 2 つであるから，$f$ とは異なる新しい 2 引数の Skolem 関数記号 <b>$g$</b> を用意し，母式中の $w$ を <b>$g(x, y)$</b> で置き換え，冠頭から $∃w$ を除く．</li>
</ol>
<p class="pt-note">※ 重要ポイント：<br>
・$Q(x, z)$ に $y$ が見かけ上現れていなくても，後ろの $R(z, w)$ や冠頭の定義（ノート 1.7：前にあるすべての全称記号の変数を引数とする）にしたがい，<b>$z$ は必ず $x, y$ 両方の関数 $f(x, y)$</b> にする．<br>
・$∃w$ の前にあった $∃z$ は存在記号であって全称記号ではないため，$g$ の引数に $z$ や $f(x, y)$ を入れて $g(x, y, z)$ などとしてはいけない（引数はあくまで前の $∀$ の変数 $x, y$ のみ）．<br>
・また，$z$ と $w$ に同じ関数記号 $f(x, y)$ を使い回すのも誤り．</p>`) }),
    lab: () => ex83SkolemLab(),
    labLabel: '🧪 Skolem 関数の引数の決まり方を図解',
  },
  {
    no: '8.4',
    q: '以下の 1 階述語論理の節集合に導出原理を適用し，この集合が充足不能であることを示せ．ただし，P, Q, R は述語記号，f は関数記号，x, y, z は個体変数，a は定数記号である．<br><span class="fx fol">{ P(x) ∨ Q(x),　¬P(f(a)),　¬Q(f(y)) ∨ R(y),　¬R(z) }</span>',
    hint: '4 つの節に番号 (1)〜(4) を振ろう。① (1) $P(x) ∨ Q(x)$ と (2) $¬P(f(a))$ を <b>mgu {x := f(a)}</b> で導出すると、残りの $Q(x)$ にも代入がかかって <b>$Q(f(a))$</b> が出る！ ② それと (3) $¬Q(f(y)) ∨ R(y)$ を <b>mgu {y := a}</b> で導出して <b>$R(a)$</b>！ ③ 最後に (4) $¬R(z)$ と <b>mgu {z := a}</b> でぶつければ <b>空節 ⊥</b>！',
    answer: () => h('div.proof-text', { html: rich(`
<p>与えられた節集合の各節に次のように番号をつける（各節の間で変数はすでに $x, y, z$ と互いに異なる）：</p>
<ul style="margin:4px 0 10px">
<li>(1)　${F('P(x) ∨ Q(x)')}</li>
<li>(2)　${F('¬P(f(a))')}</li>
<li>(3)　${F('¬Q(f(y)) ∨ R(y)')}</li>
<li>(4)　${F('¬R(z)')}</li>
</ul>
<p><b>導出の過程：</b></p>
<ol class="pt-steps">
<li><b>(1) と (2) から導出：</b>$P(x)$ と $P(f(a))$ の最汎単一化子（mgu）$\\sigma_1 = \\{x := f(a)\\}$ により $P$ を消去し，残りの $Q(x)$ に $\\sigma_1$ を適用して<br>
<b>(5)　${F('Q(f(a))')}</b>　を得る．</li>
<li><b>(5) と (3) から導出：</b>$Q(f(a))$ と $Q(f(y))$ の mgu $\\sigma_2 = \\{y := a\\}$ により $Q$ を消去し，残りの $R(y)$ に $\\sigma_2$ を適用して<br>
<b>(6)　${F('R(a)')}</b>　を得る．</li>
<li><b>(6) と (4) から導出：</b>$R(a)$ と $R(z)$ の mgu $\\sigma_3 = \\{z := a\\}$ により $R$ を消去して<br>
<b>(7)　$\\bot$（空節）</b>　を得る．</li>
</ol>
<p>以上の導出（反駁）により空節 $\\bot$ が導出されたので，<b>導出原理の健全性</b>より，与えられた節集合は<b>充足不能</b>である．∎</p>
<p class="pt-note">※ 別順序でも正解：たとえば先に (3) と (4) を mgu $\\{z := y\\}$ で導出して (5') $¬Q(f(y))$ を作り，(1) と (2) からの $Q(f(a))$ と mgu $\\{y := a\\}$ で $\\bot$ を導くなど，どの順序で空節 $\\bot$ に到達してもよい．いずれの場合も<b>親節の番号</b>と<b>その段の mgu</b>，および最後の<b>「空節 $\\bot$ が導出されたので（健全性より）充足不能」</b>の一文を明記すること．</p>`) }),
    lab: () => ex84ResLab(),
    labLabel: '🧪 導出ボードで 8.4 を反駁する',
  },
]
