import { h, html, talk, point, defn, lab, callout, esc } from '../lib/ui.js'
import { folInput } from '../widgets/fol-input.js'
import { parseFol, folHTML, termHTML, showFol } from '../logic/fol.js'
import { clausify, unify, showSub, herbrandUniverse, herbrandBase, groundInstances, minimalUnsat, parseClause } from '../logic/fol-proof.js'
import { clauseHTML, subHTML } from '../widgets/fol-widgets.js'
import { toto } from '../lib/chars.js'
import { EX7 } from '../data/ex7.js'

const F = (s) => `<span class="fx fol">${folHTML(parseFol(s))}</span>`

// ---------- Infographic: the road map ----------
function roadInfo() {
  const st = (n, t, d, k) => `<div class="rd-s" style="--d:${k * 0.13}s"><span class="rd-n">${n}</span><b>${t}</b><small>${d}</small></div>`
  return html(`<div class="info-card reveal ig-road"><div class="ig-head"><span class="ig-tag">ROAD MAP</span><h4>述語論理の「恒真」を機械で示すまでの道のり</h4></div>
  <div class="rd-line">
    ${st('1', '否定する', '恒真 ⇔ 否定が充足不能', 0)}
    ${st('2', '冠頭形', '量化記号を全部 前へ', 1)}
    ${st('3', 'Skolem 化', '∃ を消して ∀ だけに', 2)}
    ${st('4', '節集合', '∀ を省略して節の集合に', 3)}
    ${st('5', 'エルブラン', '「項で作った世界」だけ見ればよい', 4)}
    ${st('6', '単一化 → 導出', '変数をうまく合わせて ⊥ を出す', 5)}
  </div><p class="rd-note">今日（第7回）は 2〜5 と、6 の道具「単一化」。第8回で導出、第9回でシーケント計算。</p></div>`)
}
// ---------- Infographic: ∃ after ∀ depends ----------
function skolemInfo() {
  return html(`<div class="info-card reveal ig-skolem"><div class="ig-head"><span class="ig-tag">INTUITION</span><h4>Skolem 関数 ＝「選び方」に名前をつける</h4></div>
  <div class="sk-row">
    <div class="sk-c"><span class="fx fol">${folHTML(parseFol('∃y P(y)'))}</span><span class="sk-ar">⇒</span><span class="fx fol">${folHTML(parseFol('P(c)'))}</span><small>前に ∀ がない → そういう y を 1 つ選んで<b>定数 c</b> と呼ぶ</small></div>
    <div class="sk-c"><span class="fx fol">${folHTML(parseFol('∀x∃y Love(x, y)'))}</span><span class="sk-ar">⇒</span><span class="fx fol">${folHTML(parseFol('∀x Love(x, f(x))'))}</span><small>y は x ごとに違ってよい → 「x の好きな相手」を<b>関数 f(x)</b> と呼ぶ</small></div>
  </div>
  <div class="sk-arrow-demo" aria-hidden="true"><span>🐰</span><i></i><span>🐱</span><span>🐱</span><i></i><span>🐻</span><span>🐻</span><i></i><span>🐰</span><em>f は「矢印の先」を返す関数</em></div>
  <p class="sk-note">⚠ Skolem 化した式は元の式と<b>論理的同値ではない</b>。保たれるのは「<b>充足不能かどうか</b>」だけ（Skolem 化の正当性）。</p></div>`)
}
// ---------- Infographic: Herbrand universe as onion ----------
function onionInfo() {
  return html(`<div class="info-card reveal ig-onion"><div class="ig-head"><span class="ig-tag">HERBRAND</span><h4>エルブラン領域は「玉ねぎ」のように育つ</h4></div>
  <div class="on-wrap"><div class="onr r3" style="--d:.5s"><span>H₂ ＋ f(f(a)), g(a, f(a)) …</span></div><div class="onr r2" style="--d:.3s"><span>H₁ ＋ f(a), g(a, a)</span></div><div class="onr r1" style="--d:.1s"><span>H₀ = {a}</span></div></div>
  <p class="on-note">定数から出発して、関数記号を何度も当てはめた<b>項（記号の並び）そのもの</b>を世界の「もの」にする。関数記号があれば無限に育つ。</p></div>`)
}

// ---------- Lab: prenex & Skolem stepper ----------
function skolemLab() {
  const out = h('div.ck-out')
  let neg = false
  const draw = (f) => {
    out.innerHTML = ''
    if (!f) return
    const r = clausify(f, { negate: neg })
    const list = h('ol.ck-steps')
    r.steps.forEach((s, i) => list.append(h('li.ck-step', { style: { '--d': `${i * 0.09}s` }, class: s.k === 'prenex' || s.k === 'skolem' ? 'key' : '' }, h('span.ck-lab', s.label), h('span.fx.fol', { html: folHTML(s.f) }), s.note ? h('small', s.note) : null)))
    list.append(h('li.ck-step.key', { style: { '--d': `${r.steps.length * 0.09}s` } }, h('span.ck-lab', '節集合（∀ を省略）'), h('div.ck-cls', ...(r.clauses.length ? r.clauses.map((c) => h('span.fx.fol.ck-c', { html: clauseHTML(c) })) : [h('span', '（節なし ＝ 恒真な式）')]))))
    out.append(list)
  }
  let cur = null
  const tg = h('label.ck-neg', h('input', { type: 'checkbox', onchange: (e) => { neg = e.target.checked; draw(cur) } }), h('span', { html: ' 先に<b>否定</b>する（恒真性の証明に使うとき）' }))
  const fi = folInput({
    value: '∀x∃y Love(x, y)',
    examples: ['∀x∃y Love(x, y)', '¬∀x∃y R(x, y)', '∀x P(x) ⊃ ∃x Q(x)', '∀x(P(x) ⊃ ∃y(R(x, y) ∧ Q(y)))', '∃x∀y∃z R(x, y, z)', '∀x1∃x2∃x3∀x4∀x5∃x6∀x7(P(x1, x2) ∧ (¬P(x3, x5) ∨ Q(x4, x5)) ∧ ¬Q(x6, x7))'],
    onChange(f) { cur = f; draw(f) },
  })
  return lab('冠頭形 → Skolem 化 → 節：変形を 1 段ずつ', { badge: 'SKOLEM', hint: '最後の例はノートの例そのもの' }, fi, tg, out)
}

// ---------- Lab: Herbrand ----------
function herbrandLab() {
  const PRESETS = [
    ['ソクラテス', ['¬Human(x) ∨ Mortal(x)', 'Human(s)', '¬Mortal(s)']],
    ['f で育つ', ['P(a)', '¬P(x) ∨ P(f(x))', '¬P(f(f(a)))']],
    ['定数なし', ['P(x) ∨ Q(x)', '¬P(x)', '¬Q(x)']],
    ['充足可能', ['P(a)', '¬P(x) ∨ P(f(x))']],
  ]
  let src = PRESETS[0][1].join('\n'), lv = 2
  const ta = h('textarea.hb-in', { rows: 4, spellcheck: 'false', 'aria-label': '節（1 行に 1 つ）' }, src)
  const out = h('div.hb-out')
  const draw = () => {
    out.innerHTML = ''
    let cls
    try { cls = ta.value.split('\n').filter((s) => s.trim()).map(parseClause) } catch (e) { out.append(h('p.sub-err', `読めない行があります：${e.message}`)); return }
    if (!cls.length) return
    const U = herbrandUniverse(cls, lv, 40)
    const levels = h('div.hb-levels')
    U.levels.forEach((L, i) => levels.append(h('div.hb-lv', { style: { '--d': `${i * 0.15}s` } }, h('b', `H${'₀₁₂₃'[i]}${i ? ' で増えた分' : ''}`), h('div.hb-terms', ...(L.length ? L.map((t) => h('span.fx.fol.hb-t', { html: termHTML(t) })) : [h('small', '（増えない）')])))))
    const B = herbrandBase(cls, U.all, 24)
    const gi = groundInstances(cls, U.all, 300)
    const core = minimalUnsat(gi)
    out.append(
      h('div.hb-blk', h('h6', { html: `① エルブラン領域 H${U.dummy ? '（定数がないので a を 1 つ用意）' : ''}${U.finite ? ' — 関数記号がないので有限' : ' — 本当は無限。ここでは途中まで'}` }), levels),
      h('div.hb-blk', h('h6', `② エルブラン基底（原子論理式 ${B.truncated ? '先頭 24 個' : B.atoms.length + ' 個'}）`), h('div.hb-terms', ...B.atoms.map((a) => h('span.fx.fol.hb-a', { html: folHTML(a) })))),
      h('div.hb-blk', h('h6', `③ 基礎例（変数に H の要素を入れたもの）：${gi.length} 個`), h('div.hb-gi', ...gi.slice(0, 18).map((g) => h('span.fx.fol.hb-g', { class: core && core.includes(g) ? 'core' : '', html: clauseHTML(g.c) })), gi.length > 18 ? h('small', `… ほか ${gi.length - 18} 個`) : null)))
    if (core) out.append(html(`<div class="verdict unsat">${toto('bot')}<div>命題論理として充足不能な基礎例の組が見つかった<small>ピンクの ${core.length} 個（${core.map((g) => esc(showFolClause(g.c))).join(' ／ ')}）だけで矛盾する。エルブランの定理より、元の節集合は<b>充足不能</b>。</small></div></div>`))
    else out.append(html(`<div class="verdict sat">${toto('top')}<div>この範囲の基礎例は命題論理として充足可能<small>H を H${'₀₁₂₃'[lv]} までしか作っていないので「充足可能」とは言い切れない（もっと深い項で矛盾するかもしれない）。関数記号がなければ H は有限なので確定する。</small></div></div>`))
  }
  const showFolClause = (c) => (c.length ? c.map((l) => (l.neg ? '¬' : '') + showFol(l.a)).join(' ∨ ') : '⊥')
  ta.addEventListener('input', draw)
  const pres = h('div.examples', '例：', PRESETS.map(([n, c]) => h('button', { type: 'button', onclick: () => { ta.value = c.join('\n'); draw() } }, n)))
  const depth = h('div.hb-depth', h('span', 'H を何段まで作る？'), ...[1, 2, 3].map((k) => h('button', { type: 'button', class: k === lv ? 'on' : '', onclick: (e) => { lv = k; depth.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); draw() } }, `H${'₀₁₂₃'[k]}`)))
  queueMicrotask(draw)
  return lab('エルブラン領域・基底・基礎例を作ってみる', { badge: 'HERBRAND', hint: '節を 1 行に 1 つ。変数はすべて ∀ で縛られているとみなす' }, ta, pres, depth, out)
}

// ---------- Lab: unification stepper ----------
function unifyLab() {
  let A = null, B = null
  const out = h('div.un-out')
  const draw = () => {
    out.innerHTML = ''
    if (!A || !B) return
    if (A.t !== 'pred' || B.t !== 'pred') { out.append(h('p.sub-err', '原子論理式（P(…) の形）を 2 つ入れてください')); return }
    if (A.n !== B.n || A.args.length !== B.args.length) { out.append(html(`<div class="verdict unsat">${toto('bot')}<div>単一化できない<small>述語記号（または引数の数）が違う：${esc(A.n)} と ${esc(B.n)}。代入で変えられるのは変数だけ。</small></div></div>`)); return }
    const r = unify([A, B])
    const ol = h('ol.un-steps')
    r.steps.forEach((s, i) => {
      const li = h('li.un-step', { style: { '--d': `${i * 0.12}s` }, class: s.done ? 'ok' : s.fail ? 'ng' : '' })
      li.append(h('div.un-pair', ...s.cur.map((c) => h('span.fx.fol', { html: folHTML(parseFol(c)) }))))
      if (s.D) li.append(h('div.un-d', { html: `不一致集合 D = { ${s.D.map((d) => `<span class="fx">${esc(d)}</span>`).join(', ')} }` }))
      if (s.bind) li.append(h('div.un-b', { html: `→ 代入 <span class="fx fol">${subHTML(s.bind)}</span>` }))
      if (s.done) li.append(h('div.un-b', '一致した！'))
      ol.append(li)
    })
    out.append(ol)
    if (r.ok) out.append(html(`<div class="verdict valid">${toto('top')}<div>mgu σ = <span class="fx fol">${subHTML(r.mgu)}</span><small>${esc(showFol(A))}σ ＝ ${esc(showFol(B))}σ ＝ <b>${esc(r.steps[r.steps.length - 1].cur[0])}</b>。これより「強すぎない（一般的な）」単一化子はない。</small></div></div>`))
    else out.append(html(`<div class="verdict unsat">${toto('bot')}<div>単一化できない<small>${esc(r.reason)}</small></div></div>`))
  }
  const fa = folInput({ value: 'P(x, f(y))', label: '1 つめの原子論理式', examples: ['P(x, f(y))', 'Q(f(x), y)', 'P(x, x)', 'P(x)', 'R(x, g(x), z)'], onChange(f) { A = f; draw() } })
  const fb = folInput({ value: 'P(a, f(g(z)))', label: '2 つめの原子論理式', examples: ['P(a, f(g(z)))', 'Q(y, f(a))', 'P(a, b)', 'P(f(x))', 'R(f(y), g(f(a)), y)'], onChange(f) { B = f; draw() } })
  return lab('単一化ステッパー：不一致を左から 1 つずつ消す', { badge: 'UNIFY', hint: '上下の例ボタンは同じ位置どうしでペアになっています' }, h('div.un-in', h('div', h('h6', 'A₁'), fa), h('div', h('h6', 'A₂'), fb)), out)
}

export default {
  no: 7, slug: 'lec07', date: '11/06', color: '#3fb6a8', colorL: '#d8f4f0',
  title: '一階述語論理 — エルブランの定理，単一化', sub: '無限の世界を「項でできた世界」に縮め、変数を合わせる技術を手に入れる',
  tags: ['論理的同値', '冠頭形', 'Skolem 化', 'エルブラン領域', '基礎例', '代入・合成', '単一化・mgu'],
  tinyFx: '∀x∃y R(x, y) ⇝ ∀x R(x, f(x))',
  summary: '述語論理の恒真性を機械的に示す準備。式を冠頭形にして Skolem 化で ∃ を消し、エルブランの定理で「項の世界」だけ調べればよいことを知る。導出に必要な単一化（mgu）も学ぶ。',
  chapters: [
    {
      id: 'why', title: '無限の解釈をどう調べる？', en: 'The plan',
      build(el) {
        el.append(
          talk(`R: 前回、恒真かどうかは「全部の解釈を調べる」のは無理って話でした。じゃあどうするんですか？
S: 命題論理のときと同じ作戦。**否定して、充足不能を示す**。第6回の定理を思い出して。
R: 「A が恒真 ⇔ ¬(∀x₁…∀xₙ A) が充足不能」！
S[happy]: そう。そして充足不能を示す道具が**導出（第8回）**。でもその前に、式を導出が扱える形 ── **∀ だけの節集合** ── に直す必要がある。今日はその変形と、「本当にそれでいいの？」を保証する**エルブランの定理**、それと導出の心臓部の**単一化**。`),
          roadInfo(),
        )
      },
    },
    {
      id: 'eq', title: '1 階述語論理の論理的同値', en: 'Logical equivalences',
      build(el) {
        el.append(
          talk(`S: 冠頭形を作るための変形ルール。命題論理のド・モルガン則などはそのまま使えて、それに量化記号の規則が加わる。
R: 「すべての人が P ではない」は「P である人がいない」…あれ、ややこしい。
S: ゆっくりいこう。**¬∀x** は「全員 P、ではない」＝「P でない人が**いる**」＝ **∃x¬**。`),
          defn('1.6', '論理的同値な命題の代表例', `α, β は任意の論理式，Q は量化記号（∀, ∃）．左辺と右辺は論理的同値．<br>
<b>1. 変数名のつけかえ</b>　Qxα[x] = Qyα[y]（α における x のすべての出現を y におきかえても同値）<br>
<b>2.（一種の）ド・モルガン則</b>　¬∀xα[x] = ∃x(¬α[x])　／　¬∃xα[x] = ∀x(¬α[x])<br>
<b>3. 量化記号の移動</b>（上の 2 つでは β は変数 x を含まない．最後の 2 つでは z は α[x] に出現しない変数）<br>
　Qxα[x] ∧ β = Qx(α[x] ∧ β)　／　Qxα[x] ∨ β = Qx(α[x] ∨ β)<br>
　∀xα[x] ∧ ∀xβ[x] = ∀x(α[x] ∧ β[x])　／　∃xα[x] ∨ ∃xβ[x] = ∃x(α[x] ∨ β[x])<br>
　∀xα[x] ∧ ∃xβ[x] = ∀x∃z(α[x] ∧ β[z])　／　∀xα[x] ∨ ∃xβ[x] = ∀x∃z(α[x] ∨ β[z])`, { en: 'logical equivalence' }),
          html(`<div class="eq-trap reveal">
            <div class="et ok"><b>OK</b><span class="fx fol">${folHTML(parseFol('∀x P(x) ∧ ∀x Q(x)'))}</span><em>＝</em><span class="fx fol">${folHTML(parseFol('∀x(P(x) ∧ Q(x))'))}</span></div>
            <div class="et ng"><b>NG</b><span class="fx fol">${folHTML(parseFol('∀x P(x) ∨ ∀x Q(x)'))}</span><em>≠</em><span class="fx fol">${folHTML(parseFol('∀x(P(x) ∨ Q(x))'))}</span><small>右は「全員 P か Q のどちらか」。左は「全員 P」または「全員 Q」。🐰 だけ P・🐱 だけ Q の世界が反例。</small></div>
            <div class="et ng"><b>NG</b><span class="fx fol">${folHTML(parseFol('∃x P(x) ∧ ∃x Q(x)'))}</span><em>≠</em><span class="fx fol">${folHTML(parseFol('∃x(P(x) ∧ Q(x))'))}</span><small>P の人と Q の人が別人でもよい。だから別の変数 z にしてから前に出す。</small></div></div>`),
          talk(`R: ∀ は ∧ と、∃ は ∨ と相性がいいんですね。
S[happy]: 第6回の「∀ は大きな ∧、∃ は大きな ∨」を思い出せば自然でしょ。相性の悪い組み合わせは、**変数名をつけかえてから**前に出せば OK。`),
          point('<b>¬∀ = ∃¬</b>、<b>¬∃ = ∀¬</b>。量化記号を前に出すときは、<b>束縛変数の名前がかぶらないようにつけかえてから</b>。'),
        )
      },
    },
    {
      id: 'skolem', title: '冠頭形と Skolem 化', en: 'Prenex form & Skolemization',
      build(el) {
        el.append(
          talk(`S: 量化記号を全部いちばん前に並べた形が**冠頭形**。
R: $∀x P(x) ⊃ ∃x Q(x)$ だと？
S: まず ⊃ を消して $¬∀x P(x) ∨ ∃x Q(x)$、ド・モルガンで $∃x¬P(x) ∨ ∃x Q(x)$、名前をつけかえて前に出すと $∃x∃x1(¬P(x) ∨ Q(x1))$。`),
          defn('定義', '冠頭形 prefix form', `$Q₁x₁ … Qₙxₙ A₀$ という形の論理式を<b>冠頭形</b>という．ただし，$Qᵢ$ は量化記号，$x₁, …, xₙ$ は $A₀$ に出現する変数，$A₀$ は量化記号を含まない論理式である．`, { en: 'prefix form' }),
          defn('定理', '冠頭形への変換', '任意の論理式は論理的同値な冠頭形に書き換えられる．', { thm: true }),
          talk(`R: 次は ∃ を消すんですよね。どうやって？
S: 「ある y がいる」なら、その y に**名前をつけちゃう**。それが Skolem 化。`),
          skolemInfo(),
          defn('定義', 'Skolem 化', `冠頭形の論理式 $Q₁x₁ … Qₙxₙ A₀$ において，すべての存在記号 $Qᵣ$ について以下の操作を<b>Skolem 化</b>（Skolem 変換）という．<br>(i) $Q₁, …, Qᵣ₋₁$ がすべて全称記号（∀）でなければ（＝前に ∀ が 1 つもなければ），新しい<b>定数 c</b> を用意し，$A₀$ に出現する $xᵣ$ をすべて c で置き換え，$Qᵣxᵣ$ を冠頭から取り除く．<br>(ii) $Q₁, …, Qᵣ₋₁$ に全称記号がある場合，それらを Q<sub>s₁</sub>, …, Q<sub>sₘ</sub> とおく．新しい<b>関数記号 f</b> を用意し，$A₀$ に出現する $xᵣ$ をすべて f(x<sub>s₁</sub>, …, x<sub>sₘ</sub>) で置き換え，$Qᵣxᵣ$ を冠頭から取り除く．<p class="note">c, f を <b>Skolem 関数</b>という．</p>`, { en: 'Skolemization' }),
          callout('warn', 'ノートの (i) は「すべて全称記号でなければ」と書かれていますが、意味は「<b>前に ∀ が 1 つもなければ</b>定数」「<b>前に ∀ があれば</b>その ∀ の変数を<b>全部</b>引数にした関数」です。下の最後の例で x₆ が f(x₁, x₄, x₅) になるのを確認しよう。'),
          skolemLab(),
          defn('定理', 'Skolem 化の正当性', 'F を論理式，$F_S$ を F の Skolem 化の結果得られる論理式とする．$F_S$ が充足不能であるならば，そのときに限り F は充足不能である．', { thm: true }),
          talk(`R: 同値じゃないのに使っていいんですか？
S: 目的は「充足不能を示す」ことだからね。充足不能性さえ保たれれば十分。だから Skolem 化は**否定してから**使うのがポイント。
R[wow]: 恒真を示したいなら、否定 → 冠頭形 → Skolem 化、の順番なんだ。`),
          point('Skolem 化：<b>前に ∀ がない ∃ → 定数</b>、<b>前に ∀ がある ∃ → その ∀ の変数を引数にした関数</b>。同値性ではなく<b>充足不能性</b>が保たれる。'),
        )
      },
    },
    {
      id: 'herbrand', title: 'エルブランの定理', en: "Herbrand's theorem",
      build(el) {
        el.append(
          talk(`R: Skolem 化して ∀ だけの式になりました。でも解釈が無限にあるのは変わらないですよね？
S: そこでエルブランの大発見。「∀ だけの式が充足不能かどうかは、**式に出てくる記号だけで作った項の世界**を調べれば十分」。
R: 記号で作った世界…？
S: たとえば定数 a と関数 f があれば、a, f(a), f(f(a)), … という**記号の並びそのもの**を「もの」にする。`),
          onionInfo(),
          defn('定義', 'エルブラン領域 Herbrand universe', `$A[x₁, …, xₙ]$ を量化記号を含まない論理式とする．閉じた論理式 $F = ∀x₁ … ∀xₙ A[x₁, …, xₙ]$ について以下の集合を考える．<br>(1) $H₀$ は A に現れる定数の集合である．A が 1 つも定数を含まない時は，1 つの適当な定数からなる集合（たとえば $H₀ = {a}$）とする．<br>(2) i = 0, 1, 2, … に対して $Hᵢ₊₁ = Hᵢ ∪ {f(t₁, …, tₖ) |$ f は F に現れる k 引数関数記号, $t₁, …, tₖ ∈ Hᵢ}$ とする．<p class="note">このとき H = lim<sub>i→∞</sub> Hᵢ を F の<b>エルブラン領域</b>という．</p>`, { en: 'Herbrand universe' }),
          defn('定義', 'エルブラン基底・エルブラン解釈・基礎例', `<b>エルブラン基底</b>：$HB = {P(t₁, …, tₖ) |$ P は A に現れる k 引数述語記号, $t₁, …, tₖ$ は F のエルブラン領域の要素$}$<br><b>エルブラン解釈</b>：F の解釈で，(1) F のすべての定数をそれ自身に写像し，(2) k 引数関数記号 f に $(h₁, …, hₖ) ∈ H × … × H$ から $f(h₁, …, hₖ) ∈ H$ への写像を割り当てるもの．<br><b>基礎例</b>（ground instance）：F において A に出現する変数を F のエルブラン領域の要素でおきかえたもの．`),
          talk(`R: エルブラン解釈って、a は「a という記号」、f(a) は「f(a) という記号」…自分自身を指してるだけ？
S[happy]: そう！ 項の意味を固定して、自由に決めるのは**述語がどの原子論理式で ⊤ になるか**だけ。つまり「エルブラン基底の各要素に ⊤/⊥ を割り当てる」＝ **命題論理の解釈**と同じになる。`),
          defn('定理', 'エルブランの定理', `$∀x₁ … ∀xₙ A[x₁, …, xₙ]$ が充足不能であるとき，そしてその時に限り，$∀x₁ … ∀xₙ A[x₁, …, xₙ]$ の<b>基礎例で命題論理として充足不能なもの</b>（の有限集合）が存在する．`, { thm: true }),
          herbrandLab(),
          talk(`R: 「f で育つ」の例、P(a)、P(a)⊃P(f(a))、P(f(a))⊃P(f(f(a)))、¬P(f(f(a))) の 4 つで矛盾してる！ ドミノ倒しみたい。
S: しかも全部**変数のない式**だから、P(a) や P(f(a)) を命題記号だと思えば**真理値表で判定できる**。述語論理の問題が、命題論理の問題に戻ったんだ。
R: でも H が無限だと、基礎例も無限ですよね？
S: そう。だから「どの基礎例を選べば早く矛盾するか」を賢く探したい。その鍵が次の**単一化**だよ。`),
          point('エルブランの定理：∀ だけの式が充足不能 ⇔ <b>有限個の基礎例</b>が命題論理として充足不能。述語論理の問題を<b>命題論理の問題</b>に還元できる。'),
        )
      },
    },
    {
      id: 'unify', title: '代入・合成・単一化', en: 'Substitution & unification',
      build(el) {
        el.append(
          talk(`S: 基礎例を手当たり次第に試すのは大変。たとえば $P(x, f(y))$ と $¬P(a, f(g(z)))$ をぶつけたいとき、x に a、y に g(z) を入れれば一致する。この「**うまく合わせる代入**」を求めるのが単一化。
R: 全部を基礎例にしなくても、必要なところだけ合わせればいいんですね。`),
          defn('定義', '代入（置換）substitution', `$vᵢ$（i = 1, …, n）はそれぞれ異なる変数，$tᵢ$ はそれぞれ $vᵢ$ とは異なる項である時，<b>{v₁ := t₁, …, vₙ := tₙ}</b> を<b>代入</b>という．量化記号を含まない式 A に代入 θ をほどこすことを <b>Aθ</b> と表す．これによって，A に出現するすべての $vᵢ$ はそれぞれ $tᵢ$ に置き換えられる．`, { en: 'substitution' }),
          defn('定義', '合成 composition', `θ₁, θ₂ を代入とする．θ₁ をほどこしてから θ₂ をほどこすことを θ₁, θ₂ の<b>合成</b>といい，<b>θ₂θ₁</b> と表す．`, { en: 'composition' }),
          callout('warn', '合成の書き順に注意：ノートの記法では <b>θ₂θ₁ ＝「θ₁ が先、θ₂ が後」</b>。（教科書によっては逆順で書くものもあるので、試験ではノートの記法に従おう。）'),
          defn('定義', '単一化・単一化子', `<b>{A₁, …, Aₖ}</b> を 1 階述語論理の式の集合，θ を代入とすると，$A₁θ = … = Aₖθ$ の時，θ は <b>{A₁, …, Aₖ}</b> の<b>単一化子</b>（unifier），この操作を<b>単一化</b>といい，<b>{A₁, …, Aₖ}</b> を<b>単一化可能</b>という．`, { en: 'unifier' }),
          defn('定義', '最汎単一化子 mgu', `σ を $S = {A₁, …, Aₖ}$ の単一化子とする．S の任意の単一化子 θ に対して <b>θ = λσ</b> である λ が存在すれば，σ を S の<b>最汎単一化子</b>（most general unifier, mgu）という．`, { en: 'most general unifier' }),
          talk(`R: 「最も汎用的」ってどういうこと？
S: $P(x)$ と $P(y)$ を合わせる代入は、<span class="fx">{x := y}</span> でも <span class="fx">{x := a, y := a}</span> でもいい。でも後者は「余計に決めすぎ」。前者に <span class="fx">{y := a}</span> を後から足せば後者が作れるでしょ。**どの単一化子も、mgu に何かを付け足して作れる** ── それが mgu。
R: 必要最小限しか決めない代入、か。`),
          html(`<div class="mgu-vs reveal"><div class="mv mgu"><b>mgu</b><span class="fx">{x := y}</span><small>必要最小限</small></div><div class="mv-ar">＋ λ = {y := a} →</div><div class="mv"><b>単一化子</b><span class="fx">{x := a, y := a}</span><small>決めすぎ（でも単一化はできている）</small></div></div>`),
          unifyLab(),
          talk(`R: $P(x)$ と $P(f(x))$ は失敗しました。「出現検査」って？
S: x := f(x) にすると、右辺の中にも x があるから、f(f(x)), f(f(f(x))), … と永遠に終わらない。だから「**変数を、その変数自身を含む項に置きかえない**」というチェックが必要なんだ。
R: $P(x, x)$ と $P(a, b)$ は「a と b は記号そのものが違う」。x を a にしたら、もう 1 つの x も a になっちゃうから b と合わない。
S[happy]: 完璧。単一化の失敗は、この 2 種類（**記号の衝突**と**出現検査**）だけだよ。`),
          point('単一化：左から見て<b>最初の食い違い（不一致集合）</b>を探し、片方が変数なら代入して消す。<b>記号の衝突</b>か<b>出現検査</b>で失敗。得られる代入が <b>mgu</b>。'),
        )
      },
    },
  ],
  exercises: [
    ...EX7.map((p) => ({ no: p.no, q: p.q, hint: p.hint, answer: p.answer(), extra: (p.extra || []).map(([l, b]) => [l, b()]) })),
    {
      no: '7.A', q: '（自習用・公式演習ではありません）∀x∃y∀z∃w R(x, y, z, w) を Skolem 化せよ．',
      hint: '∃y の前には ∀x だけ、∃w の前には ∀x と ∀z がある。',
      answer: `y は前にある ∀x に依存するので <b>f(x)</b>，w は前にある ∀x, ∀z に依存するので <b>g(x, z)</b>．<br>結果：<b>∀x∀z R(x, f(x), z, g(x, z))</b>（f, g は新しい関数記号）．`,
    },
    {
      no: '7.B', q: '（自習用）P(x, f(y), y) と P(g(z), f(a), z) の mgu を求めよ．',
      hint: '左から順に不一致を消す。第 1 引数：x と g(z)、第 2 引数：y と a、第 3 引数：（それまでの代入をほどこしてから）比べる。',
      answer: `① 第 1 引数の不一致 {x, g(z)} → <b>x := g(z)</b><br>② 第 2 引数 f(y) と f(a) の不一致 {y, a} → <b>y := a</b><br>③ 第 3 引数は a と z → <b>z := a</b>．このとき x := g(z) も g(a) になる．<br>mgu：<b>{x := g(a), y := a, z := a}</b>．どちらも P(g(a), f(a), a) になる．`,
    },
    {
      no: '7.C', q: '（自習用）節集合 {P(a), ¬P(x) ∨ P(f(x)), ¬P(f(f(a)))} のエルブラン領域を H₂ まで書き，命題論理として充足不能になる基礎例の集合を示せ．',
      hint: 'H₀ = {a}、関数記号は f だけ。x に a と f(a) を入れた基礎例を考える。',
      answer: `H₀ = {a}，H₁ = {a, f(a)}，H₂ = {a, f(a), f(f(a))}．<br>基礎例 <b>P(a)</b>，<b>¬P(a) ∨ P(f(a))</b>（x := a），<b>¬P(f(a)) ∨ P(f(f(a)))</b>（x := f(a)），<b>¬P(f(f(a)))</b> の 4 つは，P(a), P(f(a)), P(f(f(a))) を命題記号とみなすと充足不能（前から順に P(a) = ⊤ → P(f(a)) = ⊤ → P(f(f(a))) = ⊤ となり最後と矛盾）．エルブランの定理より元の節集合は充足不能．`,
    },
  ],
  quiz: [
    { q: '$¬∀x P(x)$ と論理的同値なのは？', opts: ['∀x¬P(x)', '∃x¬P(x)', '¬∃x P(x)', '∃x P(x)'], a: 1, why: '（一種の）ド・モルガン則。「全員 P ではない」＝「P でない人がいる」。' },
    { q: '一般には論理的同値に<b>ならない</b>のは？', opts: ['∀xP(x) ∧ ∀xQ(x) と ∀x(P(x) ∧ Q(x))', '∃xP(x) ∨ ∃xQ(x) と ∃x(P(x) ∨ Q(x))', '∀xP(x) ∨ ∀xQ(x) と ∀x(P(x) ∨ Q(x))', '¬∃xP(x) と ∀x¬P(x)'], a: 2, why: '∀ と ∨ は相性が悪い。🐰 だけ P・🐱 だけ Q の世界で、右は ⊤ だが左は ⊥。' },
    { q: '∀x∃y R(x, y) の Skolem 化は？', opts: ['∀x R(x, c)', '∀x R(x, f(x))', 'R(c, f(c))', '∃y R(f(y), y)'], a: 1, why: '∃y の前に ∀x があるので、y は x に依存する関数 f(x) に置きかえる。' },
    { q: 'Skolem 化で保たれる性質は？', opts: ['論理的同値', '恒真性', '充足不能性', '冠頭形であること以外なにも保たれない'], a: 2, why: 'Skolem 化の正当性：F_S が充足不能 ⇔ F が充足不能。同値ではない。' },
    { q: '定数 a, 1 引数関数 f, 2 引数関数 g をもつ式のエルブラン領域 H₁ の要素数は？', opts: ['2', '3', '4', '無限'], a: 1, why: 'H₀ = {a}、H₁ = {a, f(a), g(a, a)} の 3 個。H 全体は無限。' },
    { q: 'P(x, a) と P(b, y) の mgu は？', opts: ['{x := a, y := b}', '{x := b, y := a}', '{x := y}', '単一化できない'], a: 1, why: '第 1 引数で x := b、第 2 引数で y := a。どちらも P(b, a) になる。' },
    { q: 'P(x) と P(f(x)) が単一化できない理由は？', opts: ['述語記号が違う', '記号の衝突', '出現検査（occur check）', '引数の数が違う'], a: 2, why: 'x := f(x) にすると右にも x が残り、永遠に一致しない。' },
    { q: '合成 θ₂θ₁ の意味（ノートの記法）は？', opts: ['θ₂ をほどこしてから θ₁', 'θ₁ をほどこしてから θ₂', 'θ₁ と θ₂ の共通部分', 'θ₁ と θ₂ を同時に'], a: 1, why: '右に書いた θ₁ が先。式 A に対して (Aθ₁)θ₂ と同じ。' },
  ],
}
