// ex7（第7回 一階述語論理 — エルブランの定理，単一化）の問題データ — 演習解説ページと第7回講義ページで共有
import { h, html, rich, tv, seg, esc } from '../lib/ui.js'
import { parseFol, folHTML, termHTML, evalFol, subst } from '../logic/fol.js'
import { toto } from '../lib/chars.js'

const F = (s) => `<span class="fx fol">${folHTML(parseFol(s))}</span>`

// ---------- 7.1 lab: 解釈 I の表をいじって (1) と (2) を比較 ----------
function quantOrLab() {
  const st = { P: [true, false], Q: [false, true] }
  const f1 = parseFol('∀x(P(x) ∨ Q(x))')
  const f2 = parseFol('∀xP(x) ∨ ∀xQ(x)')
  const f1sub = parseFol('P(x) ∨ Q(x)')
  const fAllP = parseFol('∀xP(x)')
  const fAllQ = parseFol('∀xQ(x)')
  const tblWrap = h('div.qo-tbl')
  const out = h('div.qo-out')

  const makeI = () => ({
    D: [0, 1],
    c: {},
    f: {},
    P: {
      P: (u) => st.P[u],
      Q: (u) => st.Q[u],
    },
  })

  function draw() {
    tblWrap.innerHTML = ''
    out.innerHTML = ''
    const I = makeI()
    const cell = (pred, u) => {
      const on = st[pred][u]
      return h('button.mc-cell', {
        type: 'button',
        class: on ? 't' : 'f',
        'aria-label': `${pred}(${u + 1}) を切り替え`,
        html: on ? '⊤' : '⊥',
        onclick: () => { st[pred][u] = !st[pred][u]; draw() },
      })
    }
    tblWrap.append(
      h('div.qo-top',
        h('span.fx', 'I :　D = {1, 2}'),
        h('table.qo-itbl',
          h('tr',
            h('th', { html: F('P(1)') }),
            h('th', { html: F('P(2)') }),
            h('th', { html: F('Q(1)') }),
            h('th', { html: F('Q(2)') })),
          h('tr',
            h('td', cell('P', 0)),
            h('td', cell('P', 1)),
            h('td', cell('Q', 0)),
            h('td', cell('Q', 1)))),
        h('button.btn.sm', {
          type: 'button',
          onclick: () => { st.P = [true, false]; st.Q = [false, true]; draw() },
        }, '↺ 問題文の I に戻す')))

    const v1 = evalFol(f1, I, {})
    const v2 = evalFol(f2, I, {})
    const sub1 = [0, 1].map((u) => evalFol(f1sub, I, { x: u }))
    const vp = evalFol(fAllP, I, {})
    const vq = evalFol(fAllQ, I, {})

    out.append(
      h('div.qo-cards',
        h('div.qo-card', { class: v1 ? 't' : 'f' },
          h('div.qo-hd', h('b', '(1)'), h('span.fx.fol', { html: `[[${folHTML(f1)}]]<sub>I</sub>` }), html(tv(v1))),
          h('div.qo-steps',
            h('div.mt-r', { class: sub1[0] ? 't' : 'f' },
              h('span.mt-j', 'u = 1 : J[1/x]'),
              h('span', { html: `[[${folHTML(f1sub)}]] = ${tv(st.P[0])} <b class="o o-or">∨</b> ${tv(st.Q[0])} = ${tv(sub1[0])}` })),
            h('div.mt-r', { class: sub1[1] ? 't' : 'f' },
              h('span.mt-j', 'u = 2 : J[2/x]'),
              h('span', { html: `[[${folHTML(f1sub)}]] = ${tv(st.P[1])} <b class="o o-or">∨</b> ${tv(st.Q[1])} = ${tv(sub1[1])}` }))),
          h('small.qo-why', { html: `定義 (8)：<b>すべての u ∈ D</b> で ⊤ か？ → ${tv(sub1[0])} と ${tv(sub1[1])} なので <b>${v1 ? '⊤' : '⊥'}</b>` })),
        h('div.qo-card', { class: v2 ? 't' : 'f' },
          h('div.qo-hd', h('b', '(2)'), h('span.fx.fol', { html: `[[${folHTML(f2)}]]<sub>I</sub>` }), html(tv(v2))),
          h('div.qo-steps',
            h('div.mt-r', { class: vp ? 't' : 'f' },
              h('span.mt-j', { html: F('∀xP(x)') }),
              h('span', { html: `P(1)=${tv(st.P[0])}, P(2)=${tv(st.P[1])} → ${tv(vp)}` })),
            h('div.mt-r', { class: vq ? 't' : 'f' },
              h('span.mt-j', { html: F('∀xQ(x)') }),
              h('span', { html: `Q(1)=${tv(st.Q[0])}, Q(2)=${tv(st.Q[1])} → ${tv(vq)}` }))),
          h('small.qo-why', { html: `定義 (6)：左右の<b>どちらか一方でも</b> ⊤ か？ → ${tv(vp)} <b class="o o-or">∨</b> ${tv(vq)} = <b>${v2 ? '⊤' : '⊥'}</b>` }))))

    if (v1 !== v2) {
      out.append(html(`<div class="verdict unsat">${toto('bot')}<div>(1) は ${v1 ? '⊤' : '⊥'}、(2) は ${v2 ? '⊤' : '⊥'} — 真偽が食い違う！<small>この解釈 I は <b>∀x(P(x) ∨ Q(x))</b> と <b>∀xP(x) ∨ ∀xQ(x)</b> が<b>論理的同値でない</b>ことの具体例（反例）になっている。</small></div></div>`))
    } else {
      out.append(html(`<div class="verdict valid">${toto('top')}<div>この解釈 I ではどちらも ${v1 ? '⊤' : '⊥'}<small>「(2) が ⊤ ならば (1) も ⊤」は常に成り立つが、逆は成り立たない（問題文の I に戻して確かめよう）。</small></div></div>`))
    }
  }

  draw()
  return h('div',
    h('p.bl-lead', { html: rich('問題文の解釈 I からスタートします。表の ⊤ / ⊥ をタップして変えると、(1)「<b>各要素ごとに</b> P か Q」と (2)「<b>全員 P</b> または <b>全員 Q</b>」の違いがはっきり見えます。') }),
    tblWrap, out)
}

// ---------- 7.2 lab: H_i の成長・HB・基礎例ジェネレータ ----------
function ex72HerbrandLab() {
  const matrix = parseFol('(P(x) ∨ ¬Q(a, x)) ∧ P(f(y))')
  const makeTerm = (depth) => {
    let t = { t: 'const', n: 'a' }
    for (let i = 0; i < depth; i++) t = { t: 'fn', n: 'f', args: [t] }
    return t
  }
  const TERMS = [0, 1, 2, 3].map(makeTerm)
  let lv = 2, ix = 0, iy = 0
  const lvOut = h('div.hb-out')
  const giOut = h('div.ex72-gi')

  function drawLevels() {
    lvOut.innerHTML = ''
    const levels = h('div.hb-levels')
    for (let i = 0; i <= lv; i++) {
      const cur = TERMS.slice(0, i + 1)
      levels.append(h('div.hb-lv', { style: { '--d': `${i * 0.1}s` } },
        h('b', `H${'₀₁₂₃'[i]} =`),
        h('div.hb-terms', ...cur.map((t, k) => h('span.fx.fol.hb-t', { class: k === i ? 'new' : '', html: termHTML(t) })))))
    }
    const Hcur = TERMS.slice(0, lv + 1)
    const pAtoms = Hcur.map((t) => ({ t: 'pred', n: 'P', args: [t] }))
    const qAtoms = []
    Hcur.forEach((t1) => Hcur.forEach((t2) => qAtoms.push({ t: 'pred', n: 'Q', args: [t1, t2] })))

    lvOut.append(
      h('div.hb-blk',
        h('h6', `① エルブラン領域 H = lim Hᵢ（ここでは H${'₀₁₂₃'[lv]} まで表示・実際は無限集合）`),
        levels,
        h('small.mc-cap', { html: 'H = { a, f(a), f(f(a)), … } = { fⁿ(a) | n ≥ 0 }' })),
      h('div.hb-blk',
        h('h6', `② エルブラン基底 HB（H${'₀₁₂₃'[lv]} の要素までで作れる原子論理式：P が ${pAtoms.length} 個 ＋ Q が ${qAtoms.length} 個）`),
        h('div.hb-sub', h('small', '1 引数述語 P(t)（t ∈ H）：'), h('div.hb-terms', ...pAtoms.map((a) => h('span.fx.fol.hb-a', { html: folHTML(a) })), h('small', '…'))),
        h('div.hb-sub', { style: { marginTop: '8px' } }, h('small', '2 引数述語 Q(t₁, t₂)（t₁, t₂ ∈ H）：※ 式では Q(a, x) だが HB では第 1 引数も任意の t₁ ∈ H！'), h('div.hb-terms', ...qAtoms.map((a) => h('span.fx.fol.hb-a', { html: folHTML(a) })), h('small', '…')))))
  }

  function drawGI() {
    giOut.innerHTML = ''
    const tx = TERMS[ix], ty = TERMS[iy]
    const inst = subst(matrix, { x: tx, y: ty }).f
    const pick = (cur, set) => h('div.sub-x', ...TERMS.map((t, i) => h('button', {
      type: 'button',
      class: i === cur ? 'on' : '',
      html: termHTML(t),
      onclick: () => { set(i); drawGI() },
    })))
    giOut.append(
      h('div.hb-blk',
        h('h6', '③ 基礎例（ground instance）を組み立てる：∀x∀y を外し、x, y ∈ H を代入'),
        h('div.sub-ctrl', { style: { marginTop: '6px' } },
          h('label', { html: '<span class="fx fol"><span class="vr">x</span></span> に代入：' }, pick(ix, (v) => { ix = v })),
          h('label', { html: '<span class="fx fol"><span class="vr">y</span></span> に代入：' }, pick(iy, (v) => { iy = v }))),
        h('div.sub-row.res', { style: { marginTop: '10px' } },
          h('span.sub-k', '基礎例'),
          h('span.fx.fol', { html: folHTML(inst) })),
        h('small.mc-cap', { html: `量化記号 ∀x∀y は付けず、変数 x, y が 1 つも残っていない式にする（x と y に別々の要素を入れても同じ要素を入れても基礎例）。` })))
  }

  const depth = seg([[0, 'H₀'], [1, 'H₁'], [2, 'H₂'], [3, 'H₃']], lv, (v) => { lv = +v; drawLevels() })
  drawLevels()
  drawGI()
  return h('div',
    h('p.bl-lead', { html: rich('定数 <b>a</b> と 1 引数関数記号 <b>f</b> から H がどう育つか、そして <b>HB</b> と<b>基礎例</b>がどう作られるかを確認できます。') }),
    h('div.hb-depth', h('span', '表示する深さ：'), depth),
    lvOut, giOut)
}

export const EX7 = [
  {
    no: '7.1',
    q: `P, Q を述語記号，x を変数とする．次のような解釈 I を与えたときに，以下の (1)(2) に答えよ．<div class="ex-itbl"><span class="fx">I :　D = {1, 2}</span><table><tr><th>P(1)</th><th>P(2)</th><th>Q(1)</th><th>Q(2)</th></tr><tr><td>⊤</td><td>⊥</td><td>⊥</td><td>⊤</td></tr></table></div>(1) [[∀x(P(x) ∨ Q(x))]]<sub>I</sub> の真偽値を示せ．理由も示すこと．<br>(2) [[∀xP(x) ∨ ∀xQ(x)]]<sub>I</sub> の真偽値を示せ．理由も示すこと．`,
    hint: '(1) は「<b>どの u ∈ D についても</b>、P(u) ∨ Q(u) が ⊤ か？」を u = 1, 2 の両方で確かめる。(2) は先に [[∀xP(x)]]<sub>I</sub> と [[∀xQ(x)]]<sub>I</sub> をそれぞれ出してから ∨ をとる。真偽値割り当ての定義 (3)(6)(8) を使おう。',
    answer: () => h('div.proof-text', { html: rich(`
<p class="pt-note">与えられた論理式はいずれも自由変数を含まない閉じた論理式なので，任意の付値 J を 1 つとって真偽値割り当ての定義 (3)(6)(8) にしたがって評価する（結果は J によらない）．</p>
<p><b>(1)　[[∀x(P(x) ∨ Q(x))]]<sub>I</sub> = [[T]]（真）</b></p>
<p><b>理由：</b>真偽値割り当ての定義 (8) より，[[∀x(P(x) ∨ Q(x))]]<sub>I,J</sub> = ⊤ となるのは，任意の u ∈ D = {1, 2} に対して [[P(x) ∨ Q(x)]]<sub>I,J[u/x]</sub> = ⊤ のときである．</p>
<ol class="pt-steps">
<li><b>u = 1 のとき：</b>定義 (3) と I の定義より [[P(x)]]<sub>I,J[1/x]</sub> = I(P)(1) = ⊤，[[Q(x)]]<sub>I,J[1/x]</sub> = I(Q)(1) = ⊥．よって定義 (6) より [[P(x) ∨ Q(x)]]<sub>I,J[1/x]</sub> = ⊤．</li>
<li><b>u = 2 のとき：</b>定義 (3) と I の定義より [[P(x)]]<sub>I,J[2/x]</sub> = I(P)(2) = ⊥，[[Q(x)]]<sub>I,J[2/x]</sub> = I(Q)(2) = ⊤．よって定義 (6) より [[P(x) ∨ Q(x)]]<sub>I,J[2/x]</sub> = ⊤．</li>
</ol>
<p>すべての u ∈ D について [[P(x) ∨ Q(x)]]<sub>I,J[u/x]</sub> = ⊤ が成り立つので，定義 (8) より <b>[[∀x(P(x) ∨ Q(x))]]<sub>I</sub> = ⊤</b> である．</p>

<p style="margin-top:14px"><b>(2)　[[∀xP(x) ∨ ∀xQ(x)]]<sub>I</sub> = [[F]]（偽）</b></p>
<p><b>理由：</b>量化記号は ∨ より優先順位が高いので，この式は (∀xP(x)) ∨ (∀xQ(x)) である．</p>
<ol class="pt-steps">
<li><b>[[∀xP(x)]]<sub>I</sub> について：</b>u = 2 ∈ D のとき [[P(x)]]<sub>I,J[2/x]</sub> = I(P)(2) = ⊥ なので，すべての u ∈ D で ⊤ とはならない．よって定義 (8) より <b>[[∀xP(x)]]<sub>I,J</sub> = ⊥</b>．</li>
<li><b>[[∀xQ(x)]]<sub>I</sub> について：</b>u = 1 ∈ D のとき [[Q(x)]]<sub>I,J[1/x]</sub> = I(Q)(1) = ⊥ なので，すべての u ∈ D で ⊤ とはならない．よって定義 (8) より <b>[[∀xQ(x)]]<sub>I,J</sub> = ⊥</b>．</li>
<li>両方とも ⊥ なので，定義 (6) より <b>[[∀xP(x) ∨ ∀xQ(x)]]<sub>I</sub> = ⊥</b> である．</li>
</ol>
<p class="pt-note">補足：この解釈 I において (1) は ⊤，(2) は ⊥ となることから，$∀x(P(x) ∨ Q(x))$ と $∀xP(x) ∨ ∀xQ(x)$ は<b>論理的に同値ではない</b>ことがわかる（∀ は ∧ には分配できるが，∨ にはそのまま分配できない）．</p>`) }),
    lab: () => quantOrLab(),
    labLabel: '🧪 解釈 I で (1)(2) を比べる',
  },
  {
    no: '7.2',
    q: 'f を 1 引数の関数記号，P, Q をそれぞれ 1 引数，2 引数の述語記号，x, y を変数，a を定数とする時，閉じた論理式 ∀x∀y((P(x) ∨ ¬Q(a, x)) ∧ P(f(y))) のエルブラン領域 H，エルブラン基底 HB をそれぞれ求めよ．またこの式の基礎例を 1 つ示せ．',
    hint: '① <b>H</b>：定数 a から出発（H₀ = {a}）し、1 引数関数記号 f を繰り返し適用する（無限集合になる）。<br>② <b>HB</b>：式に現れる述語記号 P（1 引数）と Q（2 引数）の引数に H の要素を入れた<b>原子論理式</b>の集合。式の中で Q(a, x) と書かれていても、HB では Q の第 1 引数にも H の任意の要素が入る点に注意！<br>③ <b>基礎例</b>：先頭の ∀x∀y を外した本体 (P(x) ∨ ¬Q(a, x)) ∧ P(f(y)) の x, y を H の要素で置き換えたもの。',
    answer: () => h('div.proof-text', { html: rich(`
<p class="pt-note">与えられた閉じた論理式を $F = ∀x∀y A[x, y]$（ただし $A[x, y] = (P(x) ∨ ¬Q(a, x)) ∧ P(f(y))$）とおく．F に現れる定数は <b>a</b>，関数記号は 1 引数の <b>f</b>，述語記号は 1 引数の <b>P</b> と 2 引数の <b>Q</b> である．</p>

<p><b>1. エルブラン領域 H</b></p>
<p>定義にしたがって $H₀, H₁, H₂, …$ を順に作ると，</p>
<ul style="margin:4px 0 8px">
<li><span class="fx">H₀ = {a}</span>（A に現れる定数の集合）</li>
<li><span class="fx">H₁ = H₀ ∪ {f(t) ∣ t ∈ H₀} = {a, f(a)}</span></li>
<li><span class="fx">H₂ = H₁ ∪ {f(t) ∣ t ∈ H₁} = {a, f(a), f(f(a))}</span></li>
<li>以下同様に f を繰り返し適用して得られる．</li>
</ul>
<p>よって，エルブラン領域 H（= lim<sub>i→∞</sub> H<sub>i</sub>）は</p>
<p class="pt-eq">H = { a, f(a), f(f(a)), f(f(f(a))), … }　（＝ { fⁿ(a) ∣ n ≥ 0 }）</p>

<p><b>2. エルブラン基底 HB</b></p>
<p>A に現れる述語記号は 1 引数の P と 2 引数の Q であるから，それらの引数に H の要素を割り当てた原子論理式全体の集合 HB は</p>
<p class="pt-eq">HB = { P(t) ∣ t ∈ H } ∪ { Q(t₁, t₂) ∣ t₁, t₂ ∈ H }</p>
<p class="pt-note">（具体的に書き並べると <span class="fx">HB = { P(a), P(f(a)), P(f(f(a))), …, Q(a, a), Q(a, f(a)), Q(f(a), a), Q(f(a), f(a)), … }</span>．論理式の中では Q の第 1 引数が a になっているが，エルブラン基底の定義は「A に現れる k 引数述語記号に H の要素 t₁, …, tₖ を入れた原子論理式全体」なので，Q(f(a), a) のように第 1 引数が a 以外のものも含まれる．）</p>

<p><b>3. 基礎例（1 つ示せばよい）</b></p>
<p>$A[x, y]$ の変数 x, y を H の要素で置き換えたものが基礎例である．たとえば <b>x := a, y := a</b> とおくと，</p>
<p class="pt-eq">${F('(P(a) ∨ ¬Q(a, a)) ∧ P(f(a))')}</p>
<p class="pt-note">※ 他の例でも正解：たとえば x := f(a), y := a とした ${F('(P(f(a)) ∨ ¬Q(a, f(a))) ∧ P(f(a))')} や，x := a, y := f(a) とした ${F('(P(a) ∨ ¬Q(a, a)) ∧ P(f(f(a)))')} など，x, y に H のどの要素を代入してもよい．先頭の量化記号 ∀x∀y は<b>つけない</b>こと，また ¬ を除いた原子論理式だけを並べるのではなく A 全体の変数をおきかえた式を書くことに注意．</p>`) }),
    lab: () => ex72HerbrandLab(),
    labLabel: '🧪 H・HB・基礎例を組み立てる',
  },
]
