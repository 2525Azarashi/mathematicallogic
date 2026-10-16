import { h, talk, point, defn, lab, seg, callout, rich, fxs } from '../lib/ui.js'
import { exercise } from '../widgets/quiz.js'

// ---------- Lab: sets of naturals (ex1.1) ----------
function setLab() {
  const N = 30
  const inA = (x) => x % 2 === 0, inB = (x) => x % 3 === 0
  const OPS = {
    A: { f: inA, label: 'A', desc: 'A = { x | mod(x,2) = 0 } … 2 の倍数（偶数）' },
    B: { f: inB, label: 'B', desc: 'B = { x | mod(x,3) = 0 } … 3 の倍数' },
    cup: { f: (x) => inA(x) || inB(x), label: 'A ∪ B', desc: 'A ∪ B … 「A に入る **または** B に入る」= 2 の倍数か 3 の倍数' },
    cap: { f: (x) => inA(x) && inB(x), label: 'A ∩ B', desc: 'A ∩ B … 「A に入り **かつ** B に入る」= 6 の倍数' },
    cmp: { f: (x) => !inA(x), label: 'A の補集合', desc: 'A の補集合 … 「A に入ら **ない**」= 奇数' },
    diff: { f: (x) => inA(x) && !inB(x), label: 'A − B', desc: 'A − B … 「A に入り、B に入らない」= 偶数だが 3 の倍数でない' },
  }
  let cur = 'cup'
  const grid = h('div.ngrid')
  const cells = []
  for (let x = 0; x < N; x++) {
    const c = h('div.n', h('span.mk', h('i', { style: { background: inA(x) ? '#5aa9ff' : 'transparent' } }), h('i', { style: { background: inB(x) ? '#f5c518' : 'transparent' } })), String(x))
    cells.push(c); grid.append(c)
  }
  const desc = h('p', { style: { fontWeight: 700, margin: '14px 0 0' } })
  const count = h('span.chip')
  const venn = vennSVG()
  function draw() {
    const o = OPS[cur]
    cells.forEach((c, x) => c.classList.toggle('in', o.f(x)))
    desc.innerHTML = rich(o.desc)
    count.textContent = `0〜${N - 1} のうち ${cells.filter((_, x) => o.f(x)).length} 個`
    venn.paint(cur)
  }
  const s = seg(Object.entries(OPS).map(([k, o]) => [k, o.label]), cur, (v) => { cur = v; draw() })
  draw()
  return lab('自然数の部分集合をぬってみる', { hint: '右上の小さな丸：青 = A に属す / 黄 = B に属す' },
    h('div.ctrls', { style: { marginBottom: '16px' } }, s, count),
    h('div.split', h('div', grid, desc), h('div', { style: { display: 'grid', placeItems: 'center' } }, venn)))
}
function vennSVG() {
  const NS = 'http://www.w3.org/2000/svg'
  const wrap = document.createElement('div')
  wrap.innerHTML = `<svg class="venn" viewBox="0 0 320 220" width="320" style="max-width:100%">
    <defs>
      <clipPath id="vA"><circle cx="125" cy="110" r="78"/></clipPath>
      <clipPath id="vB"><circle cx="195" cy="110" r="78"/></clipPath>
      <mask id="mNotA"><rect x="0" y="0" width="320" height="220" fill="#fff"/><circle cx="125" cy="110" r="78" fill="#000"/></mask>
      <mask id="mNotB"><rect x="0" y="0" width="320" height="220" fill="#fff"/><circle cx="195" cy="110" r="78" fill="#000"/></mask>
    </defs>
    <rect x="6" y="6" width="308" height="208" rx="22" fill="#fff" stroke="#2b2452" stroke-width="2.5"/>
    <g class="paint" fill="var(--accent)">
      <rect class="p-out" x="6" y="6" width="308" height="208" rx="22" mask="url(#mNotA)" opacity="0"/>
      <circle class="p-a" cx="125" cy="110" r="78" mask="url(#mNotB)" opacity="0"/>
      <circle class="p-b" cx="195" cy="110" r="78" mask="url(#mNotA)" opacity="0"/>
      <circle class="p-ab" cx="125" cy="110" r="78" clip-path="url(#vB)" opacity="0"/>
      <circle class="p-bout" cx="195" cy="110" r="78" mask="url(#mNotA)" opacity="0"/>
    </g>
    <circle cx="125" cy="110" r="78" fill="none" stroke="#2b2452" stroke-width="2.5"/>
    <circle cx="195" cy="110" r="78" fill="none" stroke="#2b2452" stroke-width="2.5"/>
    <text x="80" y="62" font-size="20">A</text><text x="232" y="62" font-size="20">B</text>
    <text x="22" y="34" font-size="13" fill="#5d5683">ℕ（自然数）</text>
  </svg>`
  const svg = wrap.firstElementChild
  const q = (c) => svg.querySelector(c)
  svg.paint = (k) => {
    const on = { A: ['p-a', 'p-ab'], B: ['p-b', 'p-ab'], cup: ['p-a', 'p-b', 'p-ab'], cap: ['p-ab'], cmp: ['p-out'], diff: ['p-a'] }[k]
    ;['p-out', 'p-a', 'p-b', 'p-ab', 'p-bout'].forEach((c) => { const e = q('.' + c); e.style.transition = 'opacity .4s'; e.setAttribute('opacity', on.includes(c) ? '.85' : '0') })
    // p-out covers the B-only region too when complement; handled via p-bout
    if (k === 'cmp') q('.p-out').setAttribute('mask', 'url(#mNotA)')
  }
  return svg
}

// ---------- Lab: power set as switches (ex1.2) ----------
function powerLab() {
  const S = [['red', '#ff6b8b'], ['yellow', '#ffd23f'], ['blue', '#5aa9ff']]
  const on = [true, true, true]
  const bits = h('div.pbits')
  const grid = h('div.pset')
  const info = h('p', { style: { fontWeight: 700, textAlign: 'center', margin: '14px 0 0' } })
  S.forEach(([n, c], i) => bits.append(h('button', { type: 'button', onclick: (e) => { on[i] = !on[i]; e.currentTarget.classList.toggle('off', !on[i]); draw() } }, h('i', { style: { background: c } }), n)))
  const subs = []
  for (let m = 0; m < 8; m++) subs.push(S.filter((_, i) => (m >> (2 - i)) & 1))
  subs.sort((a, b) => a.length - b.length)
  subs.forEach((sub) => grid.append(h('div.sub', { dataset: { k: sub.map((x) => x[0]).join(',') } }, h('div.dots', sub.length ? sub.map(([, c]) => h('i', { style: { background: c } })) : h('span', { style: { fontFamily: 'var(--f-fx)', fontSize: '20px' } }, '∅')), h('code', sub.length ? `{${sub.map((x) => x[0]).join(', ')}}` : '∅ = { }'))))
  function draw() {
    const chosen = S.filter((_, i) => on[i]).map((x) => x[0]).join(',')
    ;[...grid.children].forEach((c) => c.classList.toggle('on', c.dataset.k === chosen))
    info.innerHTML = rich(`いまのスイッチ ＝ 部分集合 <b>${chosen ? '{' + chosen.replace(/,/g, ', ') + '}' : '∅'}</b>　｜　各要素「入れる / 入れない」の 2 択 × 3 要素 = 2³ = <b>8 個</b>`)
  }
  draw()
  return lab('べき集合 = 「入れる/入れない」スイッチの全パターン', { hint: '上のボタンで要素を ON/OFF' }, bits, grid, info)
}

// ---------- Lab: total vs partial function (ex1.3) ----------
function funcLab() {
  const xI = h('input', { type: 'range', min: -4, max: 4, step: 1, value: 3, style: { width: '100%' } })
  const yI = h('input', { type: 'range', min: -4, max: 4, step: 1, value: 2, style: { width: '100%' } })
  const out = h('div.split-3')
  const lx = h('b'), ly = h('b')
  function draw() {
    const x = +xI.value, y = +yI.value
    lx.textContent = x; ly.textContent = y
    const card = (name, expr, val, ok) => h('div.panel', { style: { background: ok ? 'var(--top-l)' : 'var(--bot-l)' } }, h('h5', name), h('div.big-ans', expr), h('div', { style: { textAlign: 'center', fontWeight: 900 } }, ok ? `= ${val}` : '値が決まらない！'))
    out.innerHTML = ''
    out.append(
      card('f（積）', `f(${x}, ${y}) = ${x} × ${y}`, x * y, true),
      card('g（商）', `g(${x}, ${y}) = ${x} ÷ ${y}`, y ? +(x / y).toFixed(3) : null, y !== 0),
      h('div.panel', h('h5', '判定'), h('p', { style: { margin: 0, fontWeight: 700, fontSize: '14px' }, html: y === 0 ? '<b>y = 0</b> のとき g には対応する値がない → g は R×R 上の<b>全域関数ではない</b>（部分関数）' : 'このペアでは f も g も値が 1 つ決まる。<b>y を 0 にしてみよう</b>。' })))
  }
  xI.oninput = yI.oninput = draw
  draw()
  return lab('全域関数？ ペアを動かして確かめる', { hint: 'スライダーで (x, y) を選ぶ' },
    h('div.split', { style: { marginBottom: '16px' } }, h('label', { style: { fontWeight: 700 } }, 'x = ', lx, xI), h('label', { style: { fontWeight: 700 } }, 'y = ', ly, yI)), out)
}

export default {
  no: 1, slug: 'lec01', date: '09/25', color: '#ff9d5c', colorL: '#ffe8d8',
  title: 'はじめに，集合と関係', sub: '論理学の「入れ物」をそろえる準備運動',
  tags: ['集合', '和・積・補集合', 'べき集合', '関数'],
  tinyFx: 'A ∪ B,  A ∩ B,  2ˢ,  f : R × R → R',
  summary: '集合の演算は「または・かつ・でない」そのもの。論理記号の前ぶれとして、集合と関数の言葉を押さえる回。',
  chapters: [
    {
      id: 'why', title: 'なぜ「集合」から始めるの？', en: 'Why sets first',
      build(el) {
        el.append(
          talk(`R: 数理論理学なのに、初回は集合なんですね。論理ってもっと「ならば」とかの話かと思ってました。
S: いい疑問。実は**集合の演算と論理の記号はそっくり**なんだ。「A に入る **または** B に入る」が和集合、「**かつ**」が共通部分、「入ら**ない**」が補集合。
R: あ、∪ と ∨、∩ と ∧ って形も似てる！
S[happy]: そう、偶然じゃないよ。あとで出てくる「解釈」は**関数**だし、「べき集合」は真理値表の行の数え方と同じ。今日は論理の道具箱を先にそろえる回なんだ。`),
          point('集合の **∪ ∩ 補集合** は、論理の **∨ ∧ ¬** の「集合バージョン」。'),
        )
      },
    },
    {
      id: 'set', title: '集合と、その演算', en: 'Sets & operations',
      build(el) {
        el.append(
          talk(`S: 集合は「ものの集まり」。書き方は 2 つあるよ。全部並べる {red, yellow, blue} みたいな**外延的記法**と、条件で書く {x | mod(x,2)=0} みたいな**内包的記法**。
R: 縦棒の右が「条件」なんですね。mod(x,2) = 0 は「2 で割った余りが 0」だから…偶数！
S: その通り。じゃあ演習 1.1 の A と B で、演算を実際に塗ってみよう。`),
          setLab(),
          talk(`R: A ∪ B は「2 の倍数か 3 の倍数」、A ∩ B は「6 の倍数」になった！
S: 2 と 3 の両方で割り切れる ⇔ 6 で割り切れる、だね。補集合は「全体集合」を決めないと意味が決まらない点に注意。ここでは全体は自然数 ℕ だから、A の補集合は**奇数**。
R[think]: 全体を R（実数）にしたら、補集合に 0.5 とかも入っちゃうのか…。
S[happy]: そういうこと。補集合は**何の中での補集合か**がいつも大事。`),
          defn('定義', '集合の演算', `<ul>
            <li>和集合 $A ∪ B = {x | x ∈ A$ または $x ∈ B}$</li>
            <li>共通部分 $A ∩ B = {x | x ∈ A$ かつ $x ∈ B}$</li>
            <li>補集合 $Ā$ = {x | x ∉ A}（全体集合の中で）</li>
            <li>差 $A − B = {x | x ∈ A$ かつ $x ∉ B}$</li></ul>`),
          callout('warn', '「自然数に 0 を含むか」は本によって違います。0 を含めると 0 は A にも B にも入る（0 = 2×0 = 3×0）。答案では前提を一言書いておくと安全。'),
        )
      },
    },
    {
      id: 'power', title: 'べき集合', en: 'Power set',
      build(el) {
        el.append(
          talk(`R: べき集合 2<sup>S</sup> って、なんで「2 の S 乗」って書くんですか？
S: 部分集合を作るとき、各要素について「入れる / 入れない」の **2 択**を選ぶでしょ。要素が 3 つなら 2 × 2 × 2 = 8 通り。だから 2<sup>S</sup>。
R: 空集合 ∅ と、S 自身も入るんですよね？
S[happy]: そう！ 全部 OFF が ∅、全部 ON が S 自身。どっちも立派な部分集合。`),
          powerLab(),
          talk(`S: これ、第 2 回の**真理値表**とまったく同じ構造なんだ。命題記号 P, Q, R それぞれに「⊤ / ⊥」の 2 択 → 解釈は 2³ = 8 通り。
R[wow]: スイッチの ON/OFF が ⊤/⊥ になるだけか！`),
          point('要素が n 個なら部分集合は 2ⁿ 個。命題記号が n 個なら解釈（真理値表の行）も 2ⁿ 個。'),
        )
      },
    },
    {
      id: 'rel', title: '直積・関係・関数', en: 'Product, relation, function',
      build(el) {
        el.append(
          talk(`S: 直積 $A × B$ は「A の要素と B の要素のペア全部」の集合。**関係**はその部分集合、**関数**は「左の各要素に対して右がちょうど 1 つ」決まる特別な関係だよ。
R: $f : R × R → R$ は「実数のペアを入れると実数が 1 つ出てくる」ってことですね。
S: そう。そして**全域関数**は、定義域の**すべての**要素に値が決まるもの。一部でしか決まらないものは**部分関数**っていう。`),
          funcLab(),
          talk(`R: 積はどんなペアでも OK だけど、商は y = 0 でアウトだ！
S[happy]: だから g を全域関数にしたいなら、定義域を R × (R − {0}) に**狭めれば**いい。値が決まらない入力を最初から除くんだ。
R: 関数の「型」を直すって感じですね。`),
          defn('定義', '全域関数と部分関数', `関数 $f : X → Y$ が、<b>すべての</b> $x ∈ X$ に対して値 $f(x) ∈ Y$ をもつとき <b>全域関数</b>（total function）。値をもたない $x$ があるとき <b>部分関数</b>（partial function）。`),
          talk(`S: 次回からの**解釈 I** も関数なんだ。「命題記号の集合 → {⊤, ⊥}」。各命題記号にちょうど 1 つの真偽値を割り当てる、全域関数。
R: 集合と関数、ちゃんと伏線だった…！`),
        )
      },
    },
  ],
  exercises: [
    {
      no: '1.1', q: '自然数 n, m に対して mod(n,m) は n を m で割った余りを表す．A = {x | mod(x,2) = 0}, B = {x | mod(x,3) = 0} とすると，A ∪ B, A ∩ B, A（の補集合）はそれぞれどのような集合か．',
      hint: '上のラボで「A ∪ B」「A ∩ B」「A の補集合」を順に押して、塗られた数を眺めよう。言葉で言い換えるのがゴール。',
      answer: `<ul><li>A ∪ B = {x | mod(x,2)=0 または mod(x,3)=0}：<b>2 の倍数または 3 の倍数</b>の集合 = {0, 2, 3, 4, 6, 8, 9, 10, 12, …}</li>
        <li>A ∩ B = {x | mod(x,6)=0}：<b>6 の倍数</b>の集合 = {0, 6, 12, 18, …}</li>
        <li>A の補集合 = {x | mod(x,2)=1}：<b>奇数</b>の集合 = {1, 3, 5, …}（全体集合を自然数としたとき）</li></ul>`,
    },
    {
      no: '1.2', q: '集合 S = {red, yellow, blue} に対してそのべき集合 2<sup>S</sup> を求めよ．',
      hint: '「入れる / 入れない」を 3 回選ぶ → 8 個。∅ と S 自身を忘れずに。',
      answer: `2<sup>S</sup> = { ∅, {red}, {yellow}, {blue}, {red, yellow}, {red, blue}, {yellow, blue}, {red, yellow, blue} }（全 2³ = 8 個）`,
    },
    {
      no: '1.3', q: '2 つの実数に対してそれらの積，商を対応させる規則をそれぞれ f : R × R → R，g : R × R → R とする．(1) f, g はそれぞれ全域関数か．(2) 全域関数でない場合，定義域をどのように変更すれば全域関数になるか．',
      hint: '「どんなペア (x, y) を入れても値が 1 つ決まるか」をチェック。割り算で困る y は？',
      answer: `(1) f は全域関数（任意の実数の組に積が定まる）。g は全域関数ではない（y = 0 のとき x ÷ 0 が定まらない）。<br>(2) g の定義域を <b>R × (R − {0})</b>（第 2 引数から 0 を除く）とすれば全域関数になる。`,
    },
  ],
  quiz: [
    { q: '全体集合を自然数としたとき，{x | mod(x,2)=1} ∩ {x | mod(x,3)=0} は？', opts: ['6 の倍数', '奇数の 3 の倍数（3, 9, 15, …）', '3 の倍数すべて', '空集合'], a: 1, why: '奇数かつ 3 の倍数なので 3, 9, 15, 21, …。6 の倍数（偶数）は入らないね。', hint: '「奇数」かつ「3 の倍数」。6 は奇数？' },
    { q: '要素が 4 個の集合のべき集合の要素数は？', opts: ['4', '8', '16', '24'], a: 2, why: '各要素について入れる/入れないの 2 択 × 4 回 = 2⁴ = 16。∅ と自分自身も含むよ。' },
    { q: '空集合 ∅ のべき集合 2<sup>∅</sup> は？', opts: ['∅', '{∅}', '{∅, {∅}}', '定義できない'], a: 1, why: '∅ の部分集合は ∅ 自身ただ 1 つ。だから 2<sup>∅</sup> = {∅} で、要素数は 2⁰ = 1。∅ と {∅} は別物！', hint: '2⁰ = ? 個の要素をもつはず。' },
    { q: 'h : R → R, h(x) = √x（実数の範囲）は全域関数？', opts: ['全域関数', '全域関数ではない'], a: 1, why: 'x < 0 のとき実数の平方根は存在しない。定義域を x ≥ 0 に狭めれば全域関数になるよ。' },
  ],
}
