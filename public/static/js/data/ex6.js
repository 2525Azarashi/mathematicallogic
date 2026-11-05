// ex6（第6回 一階述語論理 — 言語，構文論，意味論）の問題データ — 演習解説ページと第6回講義ページで共有
import { h, rich, esc } from '../lib/ui.js'
import { tryFol, folHTML, parseFol, signature, freeVars, searchModel } from '../logic/fol.js'
import { folInput } from '../widgets/fol-input.js'
import { toto } from '../lib/chars.js'

const F = (s) => `<span class="fx fol">${folHTML(parseFol(s))}</span>`

// ---------- 6.1 lab: 記号表に照らして「論理式か」を判定 ----------
const SIG = { fn: { f: 1 }, consts: ['a'], pred: { P: 1, Q: 2 }, vars: ['x', 'y'] }
function sigCheck(src) {
  const r = tryFol(src)
  if (!r.ok) return { ok: false, why: [r.err.message + (r.err.hint ? `（${r.err.hint}）` : '')] }
  const { consts, fns, preds } = signature(r.f)
  const why = []
  fns.forEach((k, n) => {
    if (SIG.consts.includes(n)) why.push(`<b>${esc(n)}</b> は<b>定数</b>（0 引数の関数記号）なのに、引数が ${k} 個ついている → <b>${esc(n)}(…) は項ではない</b>`)
    else if (!(n in SIG.fn)) why.push(`<b>${esc(n)}</b> は記号表にない関数記号`)
    else if (SIG.fn[n] !== k) why.push(`<b>${esc(n)}</b> は ${SIG.fn[n]} 引数の関数記号なのに、引数が ${k} 個`)
  })
  preds.forEach((k, n) => {
    if (!(n in SIG.pred)) why.push(`<b>${esc(n)}</b> は記号表にない述語記号`)
    else if (SIG.pred[n] !== k) why.push(`<b>${esc(n)}</b> は ${SIG.pred[n]} 引数の述語記号なのに、引数が ${k} 個`)
  })
  consts.forEach((c) => { if (!SIG.consts.includes(c)) why.push(`<b>${esc(c)}</b> は記号表にない（定数でも変数でもない）`) })
  return { ok: !why.length, f: r.f, why }
}
function sigLab() {
  const out = h('div.sg-out')
  const fi = folInput({
    value: '∀xP(f(x))',
    examples: ['∀xP(f(x))', 'P(a(x))', 'Q(∃x, y)', 'Q(f(a), x)', '∃yQ(y, f(y))', 'P(x, y)', 'f(P(x))'],
    onChange(_, src) {
      out.innerHTML = ''
      if (!src || !src.trim()) return
      const r = sigCheck(src)
      out.append(h('div', { html: `<div class="verdict ${r.ok ? 'valid' : 'unsat'}">${toto(r.ok ? 'top' : 'bot')}<div>${r.ok ? '1 階述語論理の論理式です' : '論理式ではありません'}<small>${r.ok ? '項 → 原子論理式 → 論理式 の定義どおりに組み立てられる。' : r.why.join('<br>')}</small></div></div>` }))
    },
  })
  const tbl = h('div.sg-tbl', { html: `<span class="lg fn">関数記号 f（1 引数）</span><span class="lg pd">述語 P（1 引数）・Q（2 引数）</span><span class="lg cn">定数 a</span><span class="lg vr">変数 x, y</span>` })
  return h('div', h('p.bl-lead', { html: rich('問題の<b>記号表</b>（下）に照らして判定します。ふつうのパーサは a(x) を「a という関数」と読んでしまうので、<b>a は定数</b>という約束をチェックするのがポイント。') }), tbl, fi, out)
}

// ---------- 6.2 lab: 出現ごとの自由/束縛 ----------
function occLab() {
  const f = parseFol('∀xP(x, y) ∧ ∀yQ(y)')
  const box = h('div.bind-fx.fx.fol', { html: folHTML(f, { mark: true }) })
  box.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-b]'); box.querySelectorAll('.hl').forEach((x) => x.classList.remove('hl'))
    if (t) box.querySelectorAll(`[data-b="${t.dataset.b}"]`).forEach((x) => x.classList.add('hl'))
  })
  box.addEventListener('pointerleave', () => box.querySelectorAll('.hl').forEach((x) => x.classList.remove('hl')))
  const rows = [
    ['x', '∀x の直後', '束縛', '量化記号のすぐ後に出現'],
    ['x', 'P(x, y) の中', '束縛', '∀x のスコープ P(x, y) の中'],
    ['y', 'P(x, y) の中', '自由', 'y につく量化記号 ∀y のスコープ（Q(y) だけ）の外'],
    ['y', '∀y の直後', '束縛', '量化記号のすぐ後に出現'],
    ['y', 'Q(y) の中', '束縛', '∀y のスコープ Q(y) の中'],
  ]
  return h('div',
    h('p.bl-lead', { html: rich('量化記号は ∧ より強いので、式は <b>(∀xP(x, y)) ∧ (∀yQ(y))</b>。∀ や変数にカーソル（スマホはタップ）を合わせると、その<b>スコープ</b>が光ります。') }),
    box,
    h('div.occ-tbl', h('table', h('tr', h('th', '変数'), h('th', '場所'), h('th', '出現'), h('th', '理由')),
      ...rows.map(([v, w, k, y], i) => h('tr', { style: { '--d': `${i * 0.08}s` } }, h('td', h('span.vr', { class: k === '自由' ? 'free' : 'bound' }, v)), h('td', w), h('td', h('b', { class: k === '自由' ? 'c-bot' : 'c-top' }, k)), h('td', y))))))
}

// ---------- 6.3 lab: 翻訳チェッカー ----------
function transLab() {
  const TARGET = { 1: parseFol('¬DIV2(11)'), 2: parseFol('∀x(PRIME(x) ⊃ ¬DIV2(x))') }
  let which = 2
  const out = h('div.tr-out')
  const judge = (f) => {
    out.innerHTML = ''
    if (!f) return
    const T = TARGET[which]
    const fv = [...freeVars(f)]
    if (fv.length) { out.append(h('div', { html: `<div class="verdict unsat">${toto('bot')}<div>自由変数 ${fv.join(', ')} が残っている<small>「どんな素数も」は文全体で 1 つの主張。∀x で x を縛り、量化の範囲を括弧で包もう。</small></div></div>` })); return }
    const iff = { t: 'and', a: { t: 'imp', a: f, b: T }, b: { t: 'imp', a: T, b: f } }
    const r = searchModel(iff, { want: false, maxSize: 3 })
    if (!r.found) out.append(h('div', { html: `<div class="verdict valid">${toto('top')}<div>正解と同じ意味です<small>小さな世界（要素 3 個まで）のどの解釈でも、正解の式と真偽が一致しました。</small></div></div>` }))
    else {
      const { I, n } = r.found
      const D = [...Array(n).keys()]
      const pr = (P) => (I.tables[P] ? D.filter((u) => I.tables[P].tab[u]) : [])
      const name = ['🐰', '🐱', '🐻']
      const desc = [`D = {${D.map((u) => name[u]).join(', ')}}`]
      if ('11' in I.c) desc.push(`11 は ${name[I.c['11']]}`)
      ;['PRIME', 'DIV2'].forEach((P) => { if (I.tables[P]) desc.push(`${P} が ⊤：${pr(P).map((u) => name[u]).join(' ') || 'なし'}`) })
      out.append(h('div', { html: `<div class="verdict unsat">${toto('bot')}<div>意味がずれています<small>次の世界で、あなたの式と正解の式の真偽が食い違う：<br>${desc.join('　')}</small></div></div>` }))
    }
  }
  const fi = folInput({ value: '∀x(PRIME(x) ∧ ¬DIV2(x))', examples: ['∀x(PRIME(x) ∧ ¬DIV2(x))', '∀xPRIME(x) ⊃ ¬DIV2(x)', '¬∀x(PRIME(x) ⊃ DIV2(x))', '¬∃x(PRIME(x) ∧ DIV2(x))', '∀x(PRIME(x) ⊃ ¬DIV2(x))', '¬DIV2(11)'], onChange: judge })
  const sw = h('div.seg', ...[[1, '(1) 11 は 2 で割り切れない'], [2, '(2) どんな素数も 2 で割り切れない']].map(([v, l]) => h('button', { type: 'button', class: v === which ? 'on' : '', onclick: (e) => { which = v; sw.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); fi.set(fi.input.value) } }, l)))
  return h('div', h('p.bl-lead', { html: rich('まちがえやすい訳を例ボタンで試してみよう。<b>正解の式と小さな世界で比べて</b>、意味がずれていれば食い違う世界（反例）を見せます。') }), sw, fi, out)
}

export const EX6 = [
  {
    no: '6.1',
    q: 'f を 1 引数の関数記号，P, Q をそれぞれ 1 引数，2 引数の述語記号，x, y を変数，a を定数とする時，∀xP(f(x)), P(a(x)), Q(∃x, y) はそれぞれ 1 階述語論理の論理式か？ 理由をつけて答えよ．',
    hint: '「項 → 原子論理式 → 論理式」の順に、定義の番号で確かめる。述語記号の引数に書けるのは<b>項だけ</b>。a は<b>定数</b>（0 引数の関数記号）だから、a(x) は…？ ∃x は項？',
    answer: () => h('div.proof-text', { html: rich(`
<p><b>(1) ∀xP(f(x))　→ 論理式である</b></p>
<ol class="pt-steps">
<li>x は変数なので項（項の定義 (2)）．</li>
<li>f は 1 引数の関数記号，x は項なので，f(x) は項（項の定義 (3)）．</li>
<li>P は 1 引数の述語記号，f(x) は項なので，P(f(x)) は原子論理式（原子論理式の定義）．よって論理式（論理式の定義 (2)）．</li>
<li>P(f(x)) は論理式，x は変数なので，∀xP(f(x)) は論理式（論理式の定義 (4)）．</li>
</ol>
<p><b>(2) P(a(x))　→ 論理式ではない</b></p>
<p>a は定数（0 引数の関数記号）である．項の定義 (3) で f(t₁, …, tₙ) が項になるのは f が <b>n 引数</b>の関数記号で引数がちょうど n 個のときだけなので，0 引数の a に引数 x を 1 つ与えた <b>a(x) は項ではない</b>（(1)〜(3) のどれでも作れない）．P の引数が項でないので P(a(x)) は原子論理式ではなく，論理式の定義 (1)〜(4) のどれにも当てはまらない．よって論理式ではない．</p>
<p><b>(3) Q(∃x, y)　→ 論理式ではない</b></p>
<p>原子論理式 Q(t₁, t₂) の引数 t₁, t₂ は<b>項</b>でなければならない．y は変数なので項だが，<b>∃x は項ではない</b>（項は定数・変数・関数記号の適用だけで，量化記号は現れない．そもそも ∃xA の形の論理式でもなく，A がない）．よって Q(∃x, y) は原子論理式ではなく，論理式の定義のどれにも当てはまらないので論理式ではない．</p>`) }),
    lab: () => sigLab(),
    labLabel: '🧪 記号表チェッカー',
  },
  {
    no: '6.2',
    q: 'P, Q を述語記号，x, y を個体変数とする．このとき，以下の式に出現する x, y はそれぞれ自由な出現か束縛された出現か．また，各変数は自由変数か束縛変数か．それぞれ理由をつけて答えよ．　∀xP(x, y) ∧ ∀yQ(y)',
    hint: 'まず優先順位：量化記号は ∧ より強いので (∀xP(x, y)) ∧ (∀yQ(y))。∀x のスコープは P(x, y) だけ、∀y のスコープは Q(y) だけ。P(x, y) の中の y は、∀y のスコープの中？',
    answer: () => h('div.proof-text', { html: rich(`
<p class="pt-note">量化記号は結合記号より優先順位が高いので，この式は (∀xP(x, y)) ∧ (∀yQ(y)) と読む．∀x のスコープは P(x, y)，∀y のスコープは Q(y) である．</p>
<p><b>変数の出現</b>（左から順に）</p>
<ol class="pt-steps">
<li><b>∀x の x</b>：量化記号のすぐ後に出現するので<b>束縛された出現</b>．</li>
<li><b>P(x, y) の x</b>：x につく量化記号 ∀x のスコープ P(x, y) 内にあるので<b>束縛された出現</b>．</li>
<li><b>P(x, y) の y</b>：y につく量化記号 ∀y のスコープは Q(y) だけで，P(x, y) はその外．他に y を束縛する量化記号もないので<b>自由な出現</b>．</li>
<li><b>∀y の y</b>：量化記号のすぐ後に出現するので<b>束縛された出現</b>．</li>
<li><b>Q(y) の y</b>：∀y のスコープ Q(y) 内にあるので<b>束縛された出現</b>．</li>
</ol>
<p><b>各変数</b></p>
<ul>
<li><b>x は束縛変数</b>（自由変数ではない）：x の出現はすべて束縛された出現で，自由な出現をもたないから．</li>
<li><b>y は自由変数であり，束縛変数でもある</b>：P(x, y) の y は量化記号に限定されていない自由な出現なので y は自由変数．一方 ∀yQ(y) では量化記号 ∀ のあとに現れて限定されているので束縛変数でもある．</li>
</ul>
<p class="pt-note">補足：自由変数 y を含むので，この式は閉じた論理式ではない．∀yQ(y) は束縛変数の名前をつけかえて ∀zQ(z) と書いても同じ意味なので，P(x, y) の y と Q(y) の y は「名前が同じだけの別物」．</p>`) }),
    lab: () => occLab(),
    labLabel: '🧪 出現を 1 つずつ見る',
  },
  {
    no: '6.3',
    q: 'PRIME(x), DIV2(x) がそれぞれ「x は素数である」，「x は 2 で割り切れる」を表すとき，以下の (1)(2) を 1 階述語論理の論理式で記述せよ．　(1)「11 は 2 で割り切れない」　(2)「どんな素数も 2 で割り切れない」',
    hint: '(1) 11 は特定の 1 つ → 定数。(2)「どんな x も、<b>もし素数ならば</b>、2 で割り切れない」。∀ と組むのは ∧ ではなく <b>⊃</b>。量化の範囲は括弧で包む。',
    answer: () => h('div.proof-text', { html: rich(`
<p><b>(1)</b>　${F('¬DIV2(11)')}　（11 は定数）</p>
<p><b>(2)</b>　${F('∀x(PRIME(x) ⊃ ¬DIV2(x))')}</p>
<p class="pt-note">(2) は「任意の x について，x が素数ならば x は 2 で割り切れない」．同値な書き方として ${F('¬∃x(PRIME(x) ∧ DIV2(x))')}（2 で割り切れる素数は存在しない）でもよい．<br>※ 実際には 2 が素数かつ 2 で割り切れるので (2) は数学的には偽の命題だが，問われているのは「記述（翻訳）」なので式を書けばよい．</p>`) }),
    extra: [['🙅 よくある誤訳と意味', () => h('div.ans.alt', h('h5', 'WRONG TRANSLATIONS'), h('div.proof-text', { html: rich(`
<ul>
<li>${F('∀x(PRIME(x) ∧ ¬DIV2(x))')}：「<b>すべてのものが</b>素数で，しかも 2 で割り切れない」になってしまう（4 や 9 も素数だと言っている）．∀ と組むのは ⊃．</li>
<li>${F('∀xPRIME(x) ⊃ ¬DIV2(x)')}：量化記号は ⊃ より強いので (∀xPRIME(x)) ⊃ ¬DIV2(x)．∀x が PRIME(x) にしか届かず，¬DIV2(x) の x は<b>自由</b>．括弧が必要．</li>
<li>${F('¬∀x(PRIME(x) ⊃ DIV2(x))')}：「すべての素数が 2 で割り切れる，わけではない」＝「2 で割り切れない素数が<b>ある</b>」．否定の位置で意味が変わる．</li>
</ul>`) }))]],
    lab: () => transLab(),
    labLabel: '🧪 翻訳チェッカー',
  },
]
