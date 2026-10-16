import { h, html, talk, point, defn, lab, seg, callout, rich, fxs, fxHTML, tv, confettiAt, toast } from '../lib/ui.js'
import { exercise } from '../widgets/quiz.js'
import { atomFormula } from '../widgets/play.js'
import { formulaInput } from '../widgets/formula-input.js'
import { treeSVG } from '../widgets/tree.js'
import { truthTable, verdictEl } from '../widgets/truth-table.js'
import { parse, show, tryParse, classify, equivalent, fmtI, subformulas, interpretations, vars, sortVars, evaluate } from '../logic/core.js'
import { toto, setToto } from '../lib/chars.js'

// --- Lab: connectives as switches ---
function connectiveLab() {
  const P = { P: true, Q: true }
  const out = h('div.split-3', { style: { gridTemplateColumns: 'repeat(4,1fr)' } })
  const row = h('div.ctrls', { style: { justifyContent: 'center', marginBottom: '18px', gap: '18px' } })
  const mk = (n) => h('button.atom', { type: 'button', style: { fontSize: '28px' }, onclick: () => { P[n] = !P[n]; draw() } }, h('span', n), h('span.val'))
  const bP = mk('P'), bQ = mk('Q')
  row.append(bP, bQ)
  const cards = [
    ['¬P', '否定', 'でない', (I) => !I.P, 'P をひっくり返す'],
    ['P ∧ Q', '連言', 'かつ', (I) => I.P && I.Q, '両方 ⊤ のときだけ ⊤'],
    ['P ∨ Q', '選言', 'または', (I) => I.P || I.Q, 'どちらか ⊤ なら ⊤'],
    ['P ⊃ Q', '含意', 'ならば', (I) => !I.P || I.Q, 'P が ⊤ で Q が ⊥ のときだけ ⊥'],
  ]
  const els = cards.map(([f, n, jp, fn, gist]) => {
    const t = html(toto('top', { idle: false }))
    const c = h('div.panel', { style: { textAlign: 'center', background: '#fff' } }, h('div', { style: { fontSize: '24px' }, html: fxHTML(f) }), h('div', { style: { fontSize: '12px', fontWeight: 900, color: 'var(--ink-2)' } }, `${n}（${jp}）`), h('div', { style: { width: '62px', margin: '8px auto' } }, t), h('div', { style: { fontSize: '12.5px', fontWeight: 700, color: 'var(--ink-2)' } }, gist))
    c._fn = fn; c._t = t
    out.append(c); return c
  })
  function draw() {
    ;[[bP, 'P'], [bQ, 'Q']].forEach(([b, n]) => { b.classList.toggle('t', P[n]); b.classList.toggle('f', !P[n]); b.lastChild.textContent = P[n] ? '⊤' : '⊥' })
    els.forEach((c) => { const v = c._fn(P); setToto(c._t, v ? 'top' : 'bot'); c.style.background = v ? 'var(--top-l)' : 'var(--bot-l)' })
  }
  draw()
  return lab('4 つの論理記号を、スイッチで体験', { hint: 'P と Q を押して ⊤/⊥ を切り替え' }, row, out,
    h('p', { style: { textAlign: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--ink-2)', margin: '16px 0 0' }, html: 'マスコットの<b>トト</b>は ⊤ の形。偽になると逆さまになって ⊥ になります（⊥ は ⊤ を逆さにした形！）' }))
}

// --- Lab: is it a formula? (ex2.1) ---
function wffLab() {
  const res = h('div')
  const tree = h('div.tree-wrap')
  const fi = formulaInput({
    value: 'P ∧ (¬Q)', examples: ['P ∧ (¬Q)', 'P ∧ (∨Q)', '¬¬P', 'P ¬ Q', '(P ⊃ Q', 'P ∨ ⊥'],
    onChange(f) {
      tree.innerHTML = ''
      res.innerHTML = ''
      if (!f) { res.append(html(`<div class="verdict unsat">${toto('bot')}<div>論理式ではない<small>定義 (1)〜(3) をどう組み合わせても、この文字列は作れない。</small></div></div>`)); return }
      res.append(html(`<div class="verdict valid">${toto('top')}<div>論理式です<small>下の木は「定義のどの規則で組み立てたか」の記録。葉が原子論理式、節が論理記号。</small></div></div>`))
      tree.append(treeSVG(f, { gapX: 62 }))
    },
  })
  return lab('それ、論理式？ 定義で組み立てられるか判定', { hint: '例のボタンを押すか自由入力' }, fi, h('div', { style: { marginTop: '16px' } }, res), tree)
}

// --- Lab: precedence quiz ---
function precLab() {
  const items = [
    ['¬P ∨ Q ⊃ P ∧ Q', ['((¬P) ∨ Q) ⊃ (P ∧ Q)', '¬(P ∨ Q) ⊃ (P ∧ Q)', '(¬P ∨ (Q ⊃ P)) ∧ Q', '¬P ∨ ((Q ⊃ P) ∧ Q)']],
    ['P ∧ Q ∧ R', ['(P ∧ Q) ∧ R', 'P ∧ (Q ∧ R)']],
    ['P ∨ Q ∧ R', ['P ∨ (Q ∧ R)', '(P ∨ Q) ∧ R']],
    ['¬P ∧ Q', ['(¬P) ∧ Q', '¬(P ∧ Q)']],
    ['P ⊃ Q ∨ R ∧ S', ['P ⊃ (Q ∨ (R ∧ S))', '(P ⊃ Q) ∨ (R ∧ S)', '((P ⊃ Q) ∨ R) ∧ S']],
  ]
  let k = 0
  const body = h('div.paren-game')
  const tree = h('div.tree-wrap', { style: { marginTop: '14px' } })
  const bar = h('div.ctrls', { style: { justifyContent: 'space-between', marginBottom: '8px' } })
  function load() {
    const [src, opts] = items[k]
    const f = parse(src)
    body.innerHTML = ''; tree.innerHTML = ''
    bar.innerHTML = ''
    bar.append(h('span.chip', `問 ${k + 1} / ${items.length}`), h('button.btn.sm', { type: 'button', onclick: () => { k = (k + 1) % items.length; load() } }, '次の式 →'))
    const shuffled = opts.map((o, i) => [o, i]).sort(() => Math.random() - 0.5)
    const list = h('div.paren-opts')
    shuffled.forEach(([o, i]) => list.append(h('button', { type: 'button', html: fxs(o), onclick: (e) => {
      if (i === 0) { e.currentTarget.classList.add('right'); tree.innerHTML = ''; tree.append(h('p', { style: { fontWeight: 700, fontSize: '13.5px', margin: '0 0 6px' } }, '正解！ 構文木で見ると、いちばん上（根）が「最後に結合する」記号：'), treeSVG(f)); confettiAt(e.currentTarget) }
      else { e.currentTarget.classList.add('wrong'); toast('強い順は ¬ > ∧ > ∨ > ⊃、同じ記号は左から') }
    } })))
    body.append(h('div', { style: { textAlign: 'center' }, html: `<span class="fx" style="font-size:30px">${fxs(src)}</span>` }), h('p', { style: { fontWeight: 700, textAlign: 'center', margin: '6px 0 0', fontSize: '14px' } }, '括弧を補うと、どれと同じ意味？'), list)
  }
  load()
  const ladder = html(`<div class="ctrls" style="justify-content:center;gap:6px;margin-bottom:16px;font-weight:700;font-size:13px">
    <span>弱い（最後に結合）</span><span class="chip" style="background:var(--imp-l)"><span class="fx"><span class="o o-imp">⊃</span></span></span><span>＜</span>
    <span class="chip" style="background:var(--or-l)"><span class="fx"><span class="o o-or">∨</span></span></span><span>＜</span>
    <span class="chip" style="background:var(--and-l)"><span class="fx"><span class="o o-and">∧</span></span></span><span>＜</span>
    <span class="chip" style="background:var(--not-l)"><span class="fx"><span class="o o-not">¬</span></span></span><span>強い（先に結合）</span></div>`)
  return lab('括弧はずしクイズ：記号の強さ', { hint: '正解すると構文木が出ます' }, ladder, bar, body, tree)
}

// --- Lab: evaluation on a tree ---
function evalTreeLab() {
  let f = parse('¬P ∨ Q ⊃ P ∧ Q')
  const top = h('div', { style: { textAlign: 'center', fontSize: '28px', margin: '6px 0 12px' } })
  const tree = h('div.tree-wrap')
  const res = h('div')
  let I = null
  function draw() {
    top.innerHTML = ''
    const a = atomFormula(f, { I, onChange: (J) => { I = J; paint() } })
    I = a.I
    top.append(a.el)
    paint()
  }
  function paint() {
    tree.innerHTML = ''
    tree.append(treeSVG(f, { I }))
    const v = evaluate(f, I)
    res.innerHTML = ''
    res.append(html(`<div class="verdict ${v ? 'valid' : 'unsat'}">${toto(v ? 'top' : 'bot')}<div>[[ ${esc2(show(f))} ]]<sub>I</sub> = ${v ? '⊤' : '⊥'}<small>解釈 I：${fmtI(I)}　— 葉（命題記号）から根に向かって値が上がっていく</small></div></div>`))
  }
  const fi = formulaInput({ value: show(f), examples: ['¬P ∨ Q ⊃ P ∧ Q', '(P ∧ Q) ∨ ¬P', '¬Q ⊃ ¬P', 'P ⊃ Q ⊃ R'], onChange: (g) => { if (g) { f = g; I = null; draw() } } })
  draw()
  return lab('解釈 I で、木の下から真偽を計算する', { hint: '式の中の P・Q を押すと値が変わる' }, fi, h('hr', { style: { border: 0, borderTop: '2px dashed var(--rule)', margin: '18px 0' } }), top, tree, res)
}
const esc2 = (s) => s.replace(/</g, '&lt;')

// --- Lab: truth table builder (ex2.2) ---
function ttLab() {
  const box = h('div')
  let f = parse('(P ∧ Q) ∨ ¬P')
  const stepper = h('div.ctrls', { style: { margin: '14px 0' } })
  const verdict = h('div', { style: { marginTop: '14px' } })
  function load() {
    box.innerHTML = ''
    const t = truthTable(f, { columns: 'all' })
    box.append(t.el)
    let k = 0
    const n = t.cols.length
    const lbl = h('span.chip')
    const go = (x) => { k = Math.max(0, Math.min(n, x)); t.reveal(k); lbl.textContent = k < n ? `次に埋める列：${show(t.cols[k])}` : '完成！'; verdict.style.display = k === n ? '' : 'none' }
    stepper.innerHTML = ''
    stepper.append(h('button.btn.sm.yellow', { type: 'button', onclick: () => go(k + 1) }, '1 列ずつ埋める ▶'), h('button.btn.sm', { type: 'button', onclick: () => go(n) }, '全部表示'), h('button.btn.sm', { type: 'button', onclick: () => go(0) }, '↺'), lbl)
    verdict.innerHTML = ''; verdict.append(verdictEl(f))
    go(0)
  }
  const fi = formulaInput({ value: show(f), examples: ['(P ∧ Q) ∨ ¬P', '¬Q ⊃ ¬P', 'P ∨ ¬P', 'P ∧ ¬P', '(P ⊃ Q) ∧ P ⊃ Q'], onChange: (g) => { if (g) { f = g; load() } } })
  load()
  return lab('真理値表を「部分論理式の列」から組み立てる', { hint: '内側の部分論理式から順に列を埋める' }, fi, stepper, box, verdict)
}

// --- Lab: sorter (valid/sat/unsat) ---
function sorterLab() {
  const pool = ['P ∨ ¬P', 'P ∧ ¬P', 'P ⊃ P', 'P ⊃ Q', '(P ⊃ Q) ∧ P ∧ ¬Q', 'P ∧ Q ⊃ P', '¬(P ∨ ¬P)', 'P ∨ Q', 'P ⊃ (Q ⊃ P)']
  let sel = null
  const tray = h('div.tray')
  const bins = {}
  const sorter = h('div.sorter')
  ;[['valid', '恒真（トートロジ）', 'どの解釈でも ⊤'], ['sat', '充足可能だが恒真でない', '⊤ も ⊥ もある'], ['unsat', '充足不能', 'どの解釈でも ⊥']].forEach(([k, t, s]) => {
    const b = h('div.bin.' + k, h('h5', t), h('small', { style: { fontWeight: 700, color: 'var(--ink-2)', fontSize: '12px' } }, s))
    b.addEventListener('click', () => drop(k, b))
    bins[k] = b; sorter.append(b)
  })
  const left = h('span.chip')
  function drop(k, b) {
    if (!sel) { toast('先に上の式カードを選んでね'); return }
    const c = classify(parse(sel.dataset.f)).kind
    if (c === k) { sel.classList.remove('sel'); sel.classList.add('ok'); b.append(sel); confettiAt(sel); sel = null; upd() }
    else { sel.classList.add('ng'); setTimeout(() => sel && sel.classList.remove('ng'), 400); toast('真理値表で確かめてみよう（⊤ の行と ⊥ の行はある？）') }
  }
  function upd() { const n = tray.children.length; left.textContent = n ? `残り ${n} 枚` : '全部仕分けた！ 🎉' }
  pool.sort(() => Math.random() - 0.5).forEach((f) => {
    const c = h('button.card-f', { type: 'button', dataset: { f }, html: fxs(f), onclick: () => { if (c.classList.contains('ok')) return; if (sel) sel.classList.remove('sel'); sel = c; c.classList.add('sel') } })
    tray.append(c)
  })
  upd()
  return lab('仕分けゲーム：恒真・充足可能・充足不能', { hint: 'カードを選んで → 箱をクリック' }, h('div.ctrls', { style: { justifyContent: 'center', marginBottom: '10px' } }, left), tray, sorter)
}

// --- Lab: the mirror (A valid ⇔ ¬A unsat) ---
function mirrorLab() {
  const out = h('div.split')
  let f = parse('P ⊃ (Q ⊃ P)')
  function draw() {
    out.innerHTML = ''
    const g = { t: 'not', a: f }
    const col = (x, title) => h('div', h('h5', { style: { margin: '0 0 8px', fontWeight: 900 }, html: title + ' ' + fxHTML(show(x)) }), truthTable(x, { columns: 'atoms+goal', selectable: false }).el, h('div', { style: { marginTop: '10px' } }, verdictEl(x)))
    out.append(col(f, 'A ='), col(g, '¬A ='))
  }
  const fi = formulaInput({ value: show(f), examples: ['P ⊃ (Q ⊃ P)', 'P ∨ Q', 'P ∧ ¬P'], onChange: (x) => { if (x) { f = x; draw() } } })
  draw()
  return lab('鏡のラボ：A と ¬A の真理値表を並べる', { hint: '¬ をつけると ⊤ と ⊥ が全部入れかわる' }, fi, h('div', { style: { marginTop: '16px' } }, out))
}

// --- Lab: equivalence checker ---
function eqLab() {
  let a = parse('¬(P ∧ Q)'), b = parse('¬P ∨ ¬Q')
  const res = h('div', { style: { marginTop: '14px' } })
  const tt = h('div', { style: { marginTop: '14px' } })
  function draw() {
    res.innerHTML = ''; tt.innerHTML = ''
    if (!a || !b) return
    const e = equivalent(a, b)
    res.append(html(`<div class="verdict ${e.ok ? 'valid' : 'unsat'}">${toto(e.ok ? 'top' : 'bot')}<div>${e.ok ? '論理的に同値！' : '同値ではない'}<small>${e.ok ? 'すべての解釈で 2 つの式の真偽値が一致。' : `反例：${fmtI(e.counter)} のとき値がちがう。`}</small></div></div>`))
    tt.append(truthTable([a, b], { columns: 'atoms+goal', selectable: false }).el)
  }
  const fa = formulaInput({ value: show(a), onChange: (x) => { a = x; draw() } })
  const fb = formulaInput({ value: show(b), onChange: (x) => { b = x; draw() } })
  const presets = [['¬(P ∧ Q)', '¬P ∨ ¬Q', 'ド・モルガン'], ['P ⊃ Q', '¬P ∨ Q', '含意'], ['P ⊃ Q', '¬Q ⊃ ¬P', '対偶'], ['P ⊃ Q', 'Q ⊃ P', '逆（罠）'], ['P ∧ (Q ∨ R)', '(P ∧ Q) ∨ (P ∧ R)', '分配'], ['¬(P ∧ Q)', '¬P ∧ ¬Q', 'よくある間違い']]
  const pr = h('div.examples', '試す：', presets.map(([x, y, n]) => h('button', { type: 'button', onclick: () => { fa.set(x); fb.set(y) } }, n)))
  draw()
  return lab('同値チェッカー：2 つの式は「同じ意味」？', { hint: '反例が 1 つでもあれば同値ではない' }, pr, h('div.split', { style: { marginTop: '12px' } }, fa, fb), res, tt)
}

export default {
  no: 2, slug: 'lec02', date: '10/02', color: '#5aa9ff', colorL: '#ddeeff',
  title: '命題論理 — 言語，構文論，意味論', sub: '記号の「形」と「意味」を分けて考える',
  tags: ['論理式の定義', 'BNF', '優先順位', '解釈', '真理値表', '恒真・充足'],
  tinyFx: 'A ::= ⊤ | ⊥ | P | ¬A | A ∧ A | A ∨ A | A ⊃ A',
  summary: '論理式とは何か（構文論）と、その真偽はどう決まるか（意味論）。この 2 つを分けるのが数理論理学の第一歩。',
  chapters: [
    {
      id: 'lang', title: '言語：命題記号と論理記号', en: 'Language',
      build(el) {
        el.append(
          talk(`R: 命題って「真か偽かが決まる文」ですよね。「今日は晴れ」とか。
S: そう。で、数理論理学では文の中身は気にしないで、**P, Q, R** みたいな記号に置きかえちゃう。これが**命題記号**。
R: 中身を捨てちゃうんですか！？
S[happy]: 捨てるからこそ、どんな話題にも使える「形の法則」だけが残るんだ。そこに 4 つの**論理記号** ¬ ∧ ∨ ⊃ を組み合わせる。`),
          connectiveLab(),
          talk(`R: ⊃（ならば）だけ直感とズレます…。P が ⊥ なら Q に関係なく ⊤ ？
S: そこは第 3 回でじっくりやるね。今は「**P が ⊤ なのに Q が ⊥**、という約束やぶりのときだけ ⊥」と覚えておけば OK。`),
          callout('tip', '用語に注意：P, Q, R は<b>命題記号</b>、¬ ∧ ∨ ⊃ は<b>論理記号</b>。答案で混同しやすいポイントです。'),
        )
      },
    },
    {
      id: 'syntax', title: '構文論：論理式の定義', en: 'Syntax — well-formed formulas',
      build(el) {
        el.append(
          talk(`S: 次は「どんな記号列が論理式か」。定義はこう。`),
          defn('定義', '論理式', `<ol><li>$⊤, ⊥$ は論理式である．</li><li>原子論理式（命題記号 P, Q, R, …）は論理式である．</li><li>A, B が論理式ならば $¬A$, $A ∧ B$, $A ∨ B$, $A ⊃ B$ は論理式である．</li><li>(1)(2)(3) を<b>有限回</b>適用して得られるものだけが論理式である．</li></ol>
            <p class="note">BNF で書くと：<span class="fx">A ::= ⊤ | ⊥ | P | ¬A | A ∧ A | A ∨ A | A ⊃ A</span></p>`, { en: 'formula' }),
          talk(`R: (3) は「論理式から論理式を作るレシピ」で、(4) は「レシピで作れないものは論理式じゃない」って意味ですね。
S: 完璧。こういう定義を**帰納的定義**っていう。レゴのブロック（命題記号）と、つなぎ方のルール（論理記号）だけで世界を作るイメージ。
R: じゃあ $P ∧ (∨Q)$ は？
S[think]: ∨ は「A ∨ B」の形でしか使えないのに、左側の A がない。どのレシピでも作れないから**論理式ではない**。ラボで確かめてみて。`),
          wffLab(),
          defn('定義', '部分論理式', `A 自身は A の部分論理式。$¬B, B ∧ C, B ∨ C, B ⊃ C$ のどれかが A の部分論理式なら、B, C も A の部分論理式。<p class="note">→ 構文木でいえば「どこかの節から下を切り取った枝」全部。</p>`, { en: 'subformula' }),
          point('論理式かどうかは「定義のレシピで組み立てられるか」で決まる。組み立ての記録が<b>構文木</b>。'),
        )
      },
    },
    {
      id: 'prec', title: '記号の優先順位と結合性', en: 'Precedence & associativity',
      build(el) {
        el.append(
          talk(`R: 括弧を毎回書くの、めんどうです…。
S: だから省略ルールがある。**結びつきの強さ**は ¬ ＞ ∧ ＞ ∨ ＞ ⊃。掛け算が足し算より先なのと同じ感覚だよ。
R: $¬P ∨ Q ⊃ P ∧ Q$ なら、まず ¬P、次に P ∧ Q、それから ∨、最後に ⊃ …？
S[happy]: そう！ だから $((¬P) ∨ Q) ⊃ (P ∧ Q)$。いちばん弱い記号が、構文木のてっぺん（根）に来るんだ。
R: 同じ記号が続いたら？
S: **左優先**。$P ∧ Q ∧ R$ は $(P ∧ Q) ∧ R$ だね。`),
          precLab(),
          point('強さ ¬ ＞ ∧ ＞ ∨ ＞ ⊃、同じ記号は左から。<b>いちばん弱い記号が木の根</b>（＝その式の「主結合子」）。'),
        )
      },
    },
    {
      id: 'sem', title: '意味論：解釈と真偽値', en: 'Semantics — interpretation',
      build(el) {
        el.append(
          talk(`S: ここまでは「形」の話（構文論）。ここからは「意味」の話（意味論）。
R: 意味って、P = 「晴れ」とか？
S: いや、もっとドライ。命題記号に **⊤ か ⊥ を割り当てる関数**、これを**解釈 I** と呼ぶ。I(P) = ⊤ みたいにね。
R: 第 1 回の「関数」がここで！
S[happy]: そして、論理式全体の真偽値 [[A]]<sub>I</sub> は、木の**下から上へ**計算すれば決まる。`),
          defn('定義', '真偽値割り当て', `<ol><li>[[⊤]]<sub>I</sub> = ⊤,　[[⊥]]<sub>I</sub> = ⊥,　[[P]]<sub>I</sub> = I(P)</li>
            <li>[[¬A]]<sub>I</sub> = ⊤ iff [[A]]<sub>I</sub> = ⊥</li>
            <li>[[A ∧ B]]<sub>I</sub> = ⊤ iff [[A]]<sub>I</sub> = ⊤ <b>and</b> [[B]]<sub>I</sub> = ⊤</li>
            <li>[[A ∨ B]]<sub>I</sub> = ⊤ iff [[A]]<sub>I</sub> = ⊤ <b>or</b> [[B]]<sub>I</sub> = ⊤</li>
            <li>[[A ⊃ B]]<sub>I</sub> = ⊤ iff [[A]]<sub>I</sub> = ⊥ <b>or</b> [[B]]<sub>I</sub> = ⊤</li></ol>
            <p class="note">iff = if and only if（必要十分条件，〜のときに限り）</p>`, { en: 'truth value assignment' }),
          evalTreeLab(),
          talk(`R: 木の枝が緑とピンクに光ってるのが、下から値が伝わってく感じでわかりやすい！
S: 命題記号が n 個なら解釈は 2ⁿ 通り。全部並べたのが**真理値表**だよ。`),
          ttLab(),
          callout('tip', '真理値表のコツ：<b>部分論理式を内側から順に</b>列にする。いきなり最後の列を計算しようとするとミスが増えます。'),
        )
      },
    },
    {
      id: 'valid', title: '恒真・充足可能・充足不能', en: 'Valid / satisfiable / unsatisfiable',
      build(el) {
        el.append(
          talk(`S: 真理値表の**最後の列**を見ると、論理式は 3 種類に分かれる。
R: 全部 ⊤ と、全部 ⊥ と、まざってるの？
S[happy]: そう。全部 ⊤ が**恒真（トートロジ）**、1 つでも ⊤ があれば**充足可能**、1 つもなければ**充足不能**。`),
          defn('定義', '充足可能・充足不能・恒真', `<ul><li><b>充足可能</b>（satisfiable）：ある解釈 I で [[A]]<sub>I</sub> = ⊤</li><li><b>充足不能</b>（unsatisfiable）：充足可能でない（どの I でも ⊥）</li><li><b>恒真・トートロジ</b>（valid）：任意の I で [[A]]<sub>I</sub> = ⊤。記号で <span class="fx">⊨ A</span></li><li><b>論理的同値</b>：任意の I で [[A]]<sub>I</sub> = [[B]]<sub>I</sub></li></ul>`),
          sorterLab(),
          talk(`R: 「恒真」は「充足可能」の一部なんですね。全部 ⊤ なら当然どこかで ⊤ だし。
S: いいところに気づいた。じゃあ演習 2.3 の (1)「恒真 ⇔ 否定が充足不能」を確かめよう。`),
          mirrorLab(),
          talk(`R[wow]: ¬ をつけると表の ⊤ と ⊥ が全部入れかわる！ だから「全部 ⊤」⇔「否定は全部 ⊥」なんだ。
S[happy]: この関係が第 3 回の**導出原理**の土台になるよ。「A が恒真かを調べたい → ¬A が充足不能かを調べる」って作戦。
R: (2)「恒真でないなら充足不能」は… P 1 文字で反例ですね。P は恒真じゃないけど、I(P) = ⊤ で充足可能。`),
          point('<b>A が恒真 ⇔ ¬A が充足不能</b>。「恒真でない」と「充足不能」は別物（間に「充足可能だが恒真でない」がある）。'),
        )
      },
    },
    {
      id: 'laws', title: '論理的同値な式の代表例', en: 'Equivalence laws',
      build(el) {
        el.append(
          talk(`S: 最後に、同値の「公式集」。次回 CNF 変換で使いまくるから、真理値表で納得しておこう。
R: ド・モルガンって $¬(P ∧ Q) = ¬P ∧ ¬Q$ でしたっけ…？
S[oops]: それが一番よくある罠！ ¬ を中に入れると **∧ と ∨ が入れかわる**。チェッカーで「よくある間違い」を押してみて。`),
          eqLab(),
          h('table.tbl.reveal', { html: `<thead><tr><th>名前</th><th>同値な式（α, β, γ は任意の論理式 = メタ変数）</th></tr></thead><tbody>
            <tr><td>可換則</td><td>${fxHTML('α ∧ β = β ∧ α')}　${fxHTML('α ∨ β = β ∨ α')}</td></tr>
            <tr><td>結合則</td><td>${fxHTML('(α ∧ β) ∧ γ = α ∧ (β ∧ γ)')}　${fxHTML('(α ∨ β) ∨ γ = α ∨ (β ∨ γ)')}</td></tr>
            <tr><td>分配則</td><td>${fxHTML('α ∧ (β ∨ γ) = (α ∧ β) ∨ (α ∧ γ)')}<br>${fxHTML('α ∨ (β ∧ γ) = (α ∨ β) ∧ (α ∨ γ)')}</td></tr>
            <tr><td>二重否定</td><td>${fxHTML('¬(¬α) = α')}</td></tr>
            <tr><td>ド・モルガン則</td><td>${fxHTML('¬(α ∧ β) = ¬α ∨ ¬β')}　${fxHTML('¬(α ∨ β) = ¬α ∧ ¬β')}</td></tr>
            <tr><td>含意</td><td>${fxHTML('α ⊃ β = ¬α ∨ β')}</td></tr>
            <tr><td>その他</td><td>${fxHTML('α ∧ ⊤ = α')}　${fxHTML('α ∧ ⊥ = ⊥')}　${fxHTML('α ∨ ⊤ = ⊤')}　${fxHTML('α ∨ ⊥ = α')}<br>${fxHTML('α ∧ α = α')}　${fxHTML('α ∨ α = α')}　${fxHTML('α ∧ ¬α = ⊥')}　${fxHTML('α ∨ ¬α = ⊤')}</td></tr></tbody>` }),
          point('α, β は「どんな論理式でも入る箱」（<b>メタ変数</b>）。P, Q のような対象の記号とは区別する。'),
        )
      },
    },
  ],
  exercises: [
    {
      no: '2.1', q: 'P, Q を命題記号とする時，P ∧ (¬Q), P ∧ (∨Q) はそれぞれ命題論理の論理式か？ 理由をつけて答えよ．',
      hint: '定義 (1)〜(4) のどれを使えば組み立てられるかを、内側から順に書く。「論理式の定義に当てはまらない」理由は、どの規則でも作れないこと。',
      answer: `<b>P ∧ (¬Q)：論理式である。</b> P, Q は命題記号なので (2) より論理式。Q が論理式なので (3) より ¬Q は論理式。P と ¬Q が論理式なので (3) より P ∧ (¬Q) は論理式。<br><br><b>P ∧ (∨Q)：論理式ではない。</b> (3) で ∨ が現れるのは A ∨ B の形のみで、∨ の左に論理式が必要。∨Q はどの規則でも作れないので論理式ではなく、したがって P ∧ (∨Q) も (4) より論理式ではない。`,
    },
    {
      no: '2.2', q: '式 (P ∧ Q) ∨ ¬P, ¬Q ⊃ ¬P の真理値表をそれぞれ作成せよ．',
      hint: '部分論理式 P ∧ Q, ¬P, ¬Q を列に並べてから最後の列を計算。上の真理値表ラボに式を入れて答え合わせできます。',
      answer: (() => { const t = truthTable([parse('(P ∧ Q) ∨ ¬P'), parse('¬Q ⊃ ¬P')], { columns: 'all', selectable: false }); return h('div', t.el, h('p', { style: { margin: '8px 0 0', fontSize: '13.5px', fontWeight: 700 }, html: rich('(P ∧ Q) ∨ ¬P は P=⊤, Q=⊥ のときだけ ⊥。¬Q ⊃ ¬P も P=⊤, Q=⊥ のときだけ ⊥（実は $P ⊃ Q$ の対偶なので同値）。') })) })(),
    },
    {
      no: '2.3', q: '以下の各言明は正しいか？ 理由を付けて述べよ．(1) 論理式は恒真であれば，その時に限りその否定が充足不能である．(2) 論理式が恒真でないならば充足不能である．',
      hint: '(1) は「⇔」なので両方向を言う。(2) は反例を 1 つ挙げれば十分。',
      answer: `(1) <b>正しい。</b> A が恒真 ⇔ 任意の解釈 I で [[A]]<sub>I</sub> = ⊤ ⇔ 任意の I で [[¬A]]<sub>I</sub> = ⊥ ⇔ ¬A を真にする解釈が存在しない ⇔ ¬A は充足不能。<br>(2) <b>正しくない。</b> 反例：命題記号 P。I(P) = ⊥ とすると [[P]]<sub>I</sub> = ⊥ なので P は恒真でない。しかし I(P) = ⊤ なら [[P]]<sub>I</sub> = ⊤ なので P は充足可能であり、充足不能ではない。`,
    },
  ],
  quiz: [
    { q: '$P ⊃ Q ⊃ R$ を括弧で補うと？', opts: ['$(P ⊃ Q) ⊃ R$', '$P ⊃ (Q ⊃ R)$'], a: 0, why: 'この講義のルールは「左優先」なので (P ⊃ Q) ⊃ R。教科書によっては ⊃ だけ右結合のこともあるので、講義の定義に従おう。', hint: '講義ノート 1.3 の「左優先」を思い出して。' },
    { q: '$¬P ∧ Q ∨ R$ の主結合子（構文木の根）は？', opts: ['¬', '∧', '∨'], a: 2, why: 'いちばん弱いのは ∨。だから ((¬P) ∧ Q) ∨ R で、根は ∨。' },
    { q: '命題記号が P, Q, R, S の 4 つある論理式の真理値表は何行？', opts: ['4 行', '8 行', '16 行', '32 行'], a: 2, why: '各命題記号に ⊤/⊥ の 2 択 → 2⁴ = 16 通りの解釈。べき集合と同じ数え方だね。' },
    { q: '$(P ⊃ Q) ∧ P ∧ ¬Q$ は？', opts: ['恒真', '充足可能だが恒真でない', '充足不能'], a: 2, why: 'P ⊃ Q と P が両方 ⊤ なら Q は ⊤ になるはずなのに ¬Q も要求している。どの解釈でも ⊥ → 充足不能。', hint: '前半 2 つが ⊤ なら Q はどうなる？' },
    { q: '正しい同値はどれ？', opts: ['$¬(P ∨ Q) = ¬P ∨ ¬Q$', '$¬(P ∨ Q) = ¬P ∧ ¬Q$', '$P ⊃ Q = Q ⊃ P$', '$P ⊃ Q = P ∨ ¬Q$'], a: 1, why: 'ド・モルガン：¬ を中に入れると ∨ が ∧ に変わる。P ⊃ Q = ¬P ∨ Q であって、Q ⊃ P（逆）とは同値じゃない。' },
  ],
}
