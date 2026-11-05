import { h, html, talk, point, defn, lab, callout, rich, fxs, fxHTML, tv, seg, confettiAt } from '../lib/ui.js'
import { formulaInput } from '../widgets/formula-input.js'
import { parseSequent, showSeq, sequentFormula, evaluate, wang, treeOk, findCounter, fmtI } from '../logic/core.js'
import { staticTree } from '../widgets/proof-static.js'
import { toto } from '../lib/chars.js'
import { EX5, breakLab } from '../data/ex5.js'

// LK の規則（Γ → G, Δ → D と 1 つの論理式に固定して検査する）
const RULES = [
  ['¬左', ['Γ → Δ, A'], '¬A, Γ → Δ'],
  ['¬右', ['A, Γ → Δ'], 'Γ → Δ, ¬A'],
  ['∧左', ['A, B, Γ → Δ'], 'A ∧ B, Γ → Δ'],
  ['∧右', ['Γ → Δ, A', 'Γ → Δ, B'], 'Γ → Δ, A ∧ B'],
  ['∨左', ['A, Γ → Δ', 'B, Γ → Δ'], 'A ∨ B, Γ → Δ'],
  ['∨右', ['Γ → Δ, A, B'], 'Γ → Δ, A ∨ B'],
  ['⊃左', ['Γ → Δ, A', 'B, Γ → Δ'], 'A ⊃ B, Γ → Δ'],
  ['⊃右', ['A, Γ → Δ, B'], 'Γ → Δ, A ⊃ B'],
]
// わざと壊した「にせ規則」
const FAKE = [
  ['にせ∨左', ['A, Γ → Δ'], 'A ∨ B, Γ → Δ', '本物の ∨左 は 2 本に枝分かれ。片方（A の場合）しか確かめていない。'],
  ['にせ¬右', ['A, Γ → Δ'], 'Γ → Δ, A', '¬ を外しただけで、反対側へ移すのを忘れている。'],
  ['にせ⊃右', ['B, Γ → Δ, A'], 'Γ → Δ, A ⊃ B', 'A と B の役割が逆。'],
]
const toLatin = (s) => s.replace(/Γ/g, 'G').replace(/Δ/g, 'D')
const ATOMS = ['A', 'B', 'G', 'D']

// ---------- Lab: 各規則は恒真性を保つか？ ----------
function preserveLab() {
  let pool = 'real', k = 0
  const tabs = h('div.pv-tabs')
  const body = h('div.pv-body')
  const pickTabs = () => {
    tabs.innerHTML = ''
    const list = pool === 'real' ? RULES : FAKE
    list.forEach(([n], i) => tabs.append(h('button', { type: 'button', class: i === k ? 'on' : '', onclick: () => { k = i; pickTabs(); draw() } }, n)))
  }
  function draw() {
    const [name, prem, conc, why] = (pool === 'real' ? RULES : FAKE)[k]
    const pF = prem.map((s) => sequentFormula(parseSequent(toLatin(s))))
    const cF = sequentFormula(parseSequent(toLatin(conc)))
    const rows = []
    for (let m = 0; m < 16; m++) {
      const I = {}; ATOMS.forEach((a, i) => { I[a] = !!(m & (8 >> i)) })
      const ps = pF.map((f) => evaluate(f, I)), c = evaluate(cF, I)
      rows.push({ I, ps, c, bad: ps.every(Boolean) && !c })
    }
    const bad = rows.filter((r) => r.bad)
    const grid = h('div.pv-grid', { role: 'table', 'aria-label': '16 通りの解釈' },
      ...rows.map((r, i) => h('div.pv-cell', { class: r.bad ? 'bad' : r.ps.every(Boolean) ? 'ok' : 'skip', style: { '--d': `${i * 0.025}s` }, title: ATOMS.map((a) => `${a === 'G' ? 'Γ' : a === 'D' ? 'Δ' : a}=${r.I[a] ? '⊤' : '⊥'}`).join(' '),
        html: `<span class="pv-i">${ATOMS.map((a) => (r.I[a] ? '<b class="t">⊤</b>' : '<b class="f">⊥</b>')).join('')}</span><span class="pv-v">${r.ps.map(tv).join('')}<i>→</i>${tv(r.c)}</span>` })))
    body.innerHTML = ''
    body.append(
      h('div.pv-rule', h('div.pv-prem', ...prem.map((p) => h('span.fx', { html: fxs(p) }))), h('div.pv-bar', h('span', name)), h('div.pv-conc.fx', { html: fxs(conc) })),
      h('div.pv-key', { html: 'セルの左 = <b>A B Γ Δ</b> の値（Γ, Δ は 1 つの論理式とみなす） / 右 = <b>前提</b> → <b>結論</b> の値　<span class="lg ok">前提が全部 ⊤</span><span class="lg skip">前提に ⊥ あり</span><span class="lg bad">前提 ⊤ なのに結論 ⊥</span>' }),
      grid)
    if (!bad.length) {
      body.append(html(`<div class="verdict valid">${toto('top')}<div>${name} は恒真性を保つ<small>前提が全部 ⊤ になる行では、結論も必ず ⊤。だから「前提がトートロジ ⇒ 結論もトートロジ」。</small></div></div>`))
    } else {
      const r = bad[0]
      body.append(html(`<div class="verdict unsat">${toto('bot')}<div>${name} は健全ではない！<small>${ATOMS.map((a) => `${a === 'G' ? 'Γ' : a === 'D' ? 'Δ' : a} = ${r.I[a] ? '⊤' : '⊥'}`).join(', ')} で、前提は ⊤ なのに結論が ⊥。${why || ''}</small></div></div>`))
    }
  }
  const sw = seg([['real', 'LK の 8 規則'], ['fake', 'にせ規則（壊れている）']], pool, (v) => { pool = v; k = 0; pickTabs(); draw() })
  pickTabs(); draw()
  return lab('規則チェッカー：前提が ⊤ なら結論も ⊤？', { badge: 'SOUND', hint: '16 通りの解釈を全部ためす' }, h('div.pv-top', sw), tabs, body)
}

// ---------- Lab: Wang → 証明 or 反例（完全性） ----------
function completeLab() {
  const out = h('div', { style: { marginTop: '14px' } })
  const fi = formulaInput({
    sequent: true, value: 'P ∨ Q → P',
    examples: ['P ∨ Q → P', '→ (P ⊃ Q) ⊃ (Q ⊃ P)', '→ P ∧ (P ⊃ Q) ⊃ Q', 'P ⊃ Q → ¬P ∨ Q', '→ (P ⊃ Q) ∨ (Q ⊃ P)', 'P ∧ ¬P →'],
    onChange(s) {
      out.innerHTML = ''
      if (!s) return
      const t = wang(s)
      const ok = treeOk(t)
      out.append(h('div.pf-scroll', staticTree(t)))
      if (ok) out.append(html(`<div class="verdict valid">${toto('top')}<div>証明図が完成 → 健全性より<b>トートロジ</b><small>葉がすべて初期シーケント。</small></div></div>`))
      else {
        const I = findCounter(t)
        const f = sequentFormula(s)
        const v = evaluate(f, Object.fromEntries(Object.keys(I).map((k) => [k, I[k]])))
        out.append(html(`<div class="verdict unsat">${toto('bot')}<div>行き止まりの葉から<b>反例</b>が読める<small>${fmtI(I)} で、元のシーケントの論理式は ${v ? '⊤' : '⊥'}。 → トートロジではない。</small></div></div>`))
      }
    },
  })
  return lab('Wang は「証明」か「反例」を必ず返す', { badge: 'COMPLETE', hint: 'ピンクの葉 = 左の記号を ⊤・右の記号を ⊥ にする解釈' }, fi, out)
}

// ---------- Infographic: ⊢ ⇄ ⊨ bridge ----------
function bridgeInfo() {
  return html(`<div class="info-card reveal ig-bridge"><div class="ig-head"><span class="ig-tag">BRIDGE</span><h4>構文論 ⊢ と 意味論 ⊨ をつなぐ 2 本の橋</h4></div>
  <div class="br-wrap">
    <div class="br-side syn"><b>⊢ A</b><span>証明できる</span><small>記号の変形だけ<br>（LK・導出）</small></div>
    <div class="br-mid">
      <div class="br-arrow r"><em>健全性 soundness</em><i></i><small>証明できるなら本当に正しい<br>＝ ウソは証明できない</small></div>
      <div class="br-arrow l"><i></i><em>完全性 completeness</em><small>本当に正しいなら証明できる<br>＝ 証明しそこねない</small></div>
    </div>
    <div class="br-side sem"><b>⊨ A</b><span>恒真</span><small>どの解釈でも ⊤<br>（真理値表）</small></div>
  </div></div>`)
}
// ---------- Infographic: proof strategy of soundness ----------
function soundPlanInfo() {
  return html(`<div class="info-card reveal ig-plan"><div class="ig-head"><span class="ig-tag">PROOF PLAN</span><h4>健全性の証明は「葉」と「1 段」を確かめるだけ</h4></div>
  <div class="pl-tree">
    <div class="pl-leaf" style="--d:.05s"><span>初期シーケント</span><b>✓ トートロジ</b></div><div class="pl-leaf" style="--d:.15s"><span>初期シーケント</span><b>✓ トートロジ</b></div>
    <div class="pl-step" style="--d:.3s">規則 1 段 ＝ <b>恒真性を保つ</b>（前提 ⊤ ⇒ 結論 ⊤）</div>
    <div class="pl-step" style="--d:.45s">規則 1 段 ＝ <b>恒真性を保つ</b></div>
    <div class="pl-root" style="--d:.6s">根（示したいシーケント）も <b>トートロジ</b> ！</div>
  </div>
  <p class="pl-note">葉から根へ「⊤ のバトン」が受け渡される（証明図の高さに関する帰納法）。ex5.1 はこのバトンの 1 本（¬右）を確かめる問題。</p></div>`)
}

const ex5Items = EX5.map((p) => ({ no: p.no, q: p.q, hint: p.hint, answer: p.answer(), extra: (p.extra || []).map(([l, b]) => [l, b()]) }))

export default {
  no: 5, slug: 'lec05', date: '10/23', color: '#ff7aa8', colorL: '#ffe1ec',
  title: '命題論理 — 健全性と完全性', sub: '「証明できる」と「本当に正しい」がぴったり一致することを確かめる',
  tags: ['健全性', '完全性', '恒真性の保持', '帰納法', '反例', 'Wang'],
  tinyFx: '⊢ A  ⇔  ⊨ A',
  summary: 'LK で証明できるシーケントはトートロジ（健全性）、トートロジなら必ず証明できる（完全性）。健全性は「初期シーケントはトートロジ」＋「各規則が恒真性を保つ」、完全性は「Wang が失敗したら反例が作れる」で示す。',
  chapters: [
    {
      id: 'why', title: '2 つの「正しい」をつなぐ', en: 'Soundness & completeness',
      build(el) {
        el.append(
          talk(`R: 第 4 回の最後に「健全性と完全性は第 5 回」って言ってましたね。
S: うん。おさらいすると、正しさには 2 種類あった。**⊢ A**（LK で証明できる＝構文論）と、**⊨ A**（どの解釈でも ⊤＝意味論）。
R: 定義がまったく違うのに、なんで同じ答えになるんですか？
S[happy]: それこそが今日のテーマ。「同じになる」こと自体が**定理**で、ちゃんと証明が必要なんだ。`),
          bridgeInfo(),
          defn('定義', '健全性と完全性 — 構文論と意味論の一致', `<b>健全性</b>（soundness）：論理式 A がある演繹体系で証明可能（$⊢ A$）ならばトートロジ（$⊨ A$）である．<br><b>完全性</b>（completeness）：論理式 A がトートロジならば，その演繹体系で証明可能である．`),
          talk(`R: 健全性がないと？
S: 「証明できたのに実はウソ」がありえる。そんな体系は危なくて使えない。
R: 完全性がないと？
S: 「正しいのに証明できない」式が残る。使えるけど、力不足。
R[wow]: 健全 ＝ ウソをつかない、完全 ＝ 取りこぼさない、か。`),
          defn('定理', 'LK の健全性・完全性', `<b>LK の健全性</b>：任意のシーケントは LK で証明可能ならばトートロジである．<br><b>LK の完全性</b>：任意のシーケントはトートロジであれば LK で証明可能である．`, { thm: true }),
          html(`<div class="sc-quad reveal">
            <div class="qd ok"><b>証明できる ＆ トートロジ</b><small>例：→ P ∨ ¬P</small></div>
            <div class="qd no1"><b>証明できる のに トートロジでない</b><small>健全性があれば<br>存在しない</small></div>
            <div class="qd no2"><b>トートロジ なのに 証明できない</b><small>完全性があれば<br>存在しない</small></div>
            <div class="qd ok2"><b>証明できない ＆ トートロジでない</b><small>例：P ∨ Q → P</small></div></div>`),
          point('<b>健全性</b> ⊢ ⇒ ⊨（ウソは証明できない）。<b>完全性</b> ⊨ ⇒ ⊢（正しいものは必ず証明できる）。両方そろうと <b>⊢ ⇔ ⊨</b>。'),
        )
      },
    },
    {
      id: 'sound', title: '健全性：規則は恒真性を保つ', en: 'Proving soundness',
      build(el) {
        el.append(
          talk(`R: 健全性って、証明図は無限にあるのに全部確かめるんですか？
S: 全部は無理。でも証明図は**初期シーケント（葉）**から**規則（1 段）**を積み上げたものだよね。だから 2 つ確かめれば十分。
・葉：初期シーケントはトートロジ
・1 段：どの規則も「前提がトートロジ ⇒ 結論もトートロジ」
R: ドミノ倒しだ！ 最初が倒れて、1 個倒れたら次も倒れる。
S[happy]: まさに帰納法。この「前提がトートロジ ⇒ 結論もトートロジ」を、規則が**恒真性を保持する**という。`),
          soundPlanInfo(),
          html(`<div class="sp-two reveal">
            <div class="sp-c"><span class="sp-n">①</span><b>初期シーケントはトートロジ</b><p>例 <span class="fx">${fxs('P, Q → R, P')}</span>：左の P が ⊤ なら右の P も ⊤。左右に同じ命題記号があるから、どの解釈でも「左が全部 ⊤ ⇒ 右のどれかが ⊤」。</p></div>
            <div class="sp-c"><span class="sp-n">②</span><b>各規則が恒真性を保持する</b><p>8 つの規則それぞれで「前提がトートロジならば結論もトートロジ」。下のチェッカーで全部ためせる。</p></div></div>`),
          preserveLab(),
          talk(`R: 本物の 8 規則は全部緑！ にせ ∨左 は赤いセルが出ました。
S: 「A のときに Δ が言える」だけじゃ、「A ∨ B のとき」は言えない。B のときを確かめてないからね。**枝分かれする規則がなぜ 2 本必要か**が、反例でわかる。
R: でもこのチェッカー、Γ と Δ を 1 個の論理式に固定してますよね。いいんですか？
S: 鋭い。Γ = $C₁, …, Cₖ$ でも、左のカンマは ∧ だから $C₁ ∧ … ∧ Cₖ$ を 1 つの式として扱える（空なら ⊤）。Δ も同じく ∨ でまとめられる（空なら ⊥）。だから 1 個で考えれば本質は同じ。`),
          callout('warn', 'セルを 16 通り見たのは「直観」。<b>レポートや試験では</b>、A, B が<b>任意の論理式</b>であることを踏まえて、<b>真偽値割り当ての定義 (4)〜(7) とトートロジの定義</b>から言葉で証明します。それが ex5.1。'),
        )
      },
    },
    {
      id: 'neg', title: 'ex5.1 を意味論で証明する', en: 'Semantic proof of (¬R)',
      build(el) {
        el.append(
          talk(`S: ex5.1 は (¬右) で Γ = B, Δ = C としたもの。前提 $A ∧ B → C$、結論 $B → C ∨ ¬A$。
R: シーケントを論理式に直すと、「$A ∧ B ⊃ C$ がトートロジ ⇒ $B ⊃ C ∨ ¬A$ もトートロジ」。
S: ここで「$B ⊃ C ∨ ¬A$ は $A ∧ B ⊃ C$ と同値だから」って書きたくなるけど…
R[think]: 同値変形を使うのは禁止、でしたよね。なんでですか？
S: 今やってるのは「LK が正しいこと」の確認。同値変形の正しさを前提にしたら、確かめたいことを先取りしてしまう。だから道具は**定義だけ**。`),
          html(`<div class="neg-flow reveal">
            <div class="nf-s" style="--d:.05s"><span>仮定</span><b>結論が ⊥ になる I がある</b></div>
            <div class="nf-s" style="--d:.2s"><span>(7)</span><b>B = ⊤, C ∨ ¬A = ⊥</b></div>
            <div class="nf-s" style="--d:.35s"><span>(6)</span><b>C = ⊥, ¬A = ⊥</b></div>
            <div class="nf-s" style="--d:.5s"><span>(4)</span><b>A = ⊤</b></div>
            <div class="nf-s hit" style="--d:.65s"><span>(5)(7)</span><b>前提 A ∧ B ⊃ C = ⊥</b><small>前提がトートロジに矛盾！</small></div></div>`),
          talk(`R: 結論を ⊥ にしようとすると、A, B, C の値が全部決まっちゃう。そしてその値だと前提まで ⊥ になる。
S[happy]: そう。だから「前提がどの I でも ⊤」なら、結論を ⊥ にする I は存在しない。下のスイッチで実際に試してみて。`),
          lab('「壊せるか」ラボ — 前提 ⊤ のまま結論だけ ⊥ にできる？', { hint: 'A, B, C の値を切り替える' }, breakLab()),
          point('ex5.1 の型：<b>「結論を ⊥ にする I があると仮定」→ 定義 (7)(6)(4) で各値が決まる → その I で前提も ⊥ → 前提がトートロジに矛盾</b>。場合分けで直接示しても OK（解答例の別解）。'),
        )
      },
    },
    {
      id: 'complete', title: '完全性：Wang が失敗したら反例', en: 'Proving completeness',
      build(el) {
        el.append(
          talk(`R: 完全性は「トートロジなら証明できる」。こっちはどう示すんですか？
S: **対偶**を使う。「証明できないなら、トートロジではない」。
R: 証明できない…ってことは、Wang のアルゴリズムで行き止まりの葉が出る？
S: そう。Wang は規則を逆向きにほどいていくけど、LK の規則は**逆向きにも恒真性を保つ**（結論がトートロジ ⇔ 前提が全部トートロジ）。だから途中で嘘が混ざらない。
R: で、最後に命題記号だけの葉が残って、それが初期シーケントじゃなかったら？
S[happy]: 左の記号を全部 ⊤、右の記号を全部 ⊥ にする解釈で、その葉は偽。それが**根まで遡って元のシーケントの反例**になる。`),
          completeLab(),
          talk(`R: $P ∨ Q → P$ だと葉 $Q → P$ で行き止まり、反例は Q = ⊤, P = ⊥。元の式に入れると ⊤ ⊃ ⊥ = ⊥ だ！
S: Wang は**必ず止まって**、「証明図」か「反例」のどちらかを返す。だから「トートロジなのに証明できない」はありえない。これが完全性の中身。`),
          html(`<div class="cp-flow reveal">
            <div class="cp-b"><b>トートロジでない</b><small>反例の解釈 I がある</small></div><div class="cp-a">⇐</div>
            <div class="cp-b"><b>行き止まりの葉</b><small>命題記号だけ・左右に共通なし</small></div><div class="cp-a">⇐</div>
            <div class="cp-b"><b>証明できない</b><small>Wang が証明図を作れない</small></div></div>`),
          point('完全性 ＝ 対偶「<b>証明できない ⇒ トートロジでない</b>」。Wang の行き止まりの葉 <b>左 → 右</b> で「左を ⊤・右を ⊥」にすれば、元のシーケントの反例になる。'),
        )
      },
    },
    {
      id: 'res', title: '導出原理の健全性・完全性と比べる', en: 'Comparison with resolution',
      build(el) {
        el.append(
          talk(`R: 健全性・完全性って、第 3 回の導出原理でも聞きました。
S: そう、導出のほうは「充足不能」の側から言う。`),
          defn('定理', '導出の健全性・完全性', `<b>健全性</b>：節の集合 Δ から ⊥（空節）が反駁によって導出可能ならば，Δ は充足不能である．<br><b>完全性</b>：節の集合 Δ が充足不能ならば，Δ から ⊥（空節）が反駁によって導出可能である．`, { thm: true }),
          html(`<div class="cmp-tab reveal"><table>
            <tr><th></th><th>LK（シーケント計算）</th><th>導出原理（反駁）</th></tr>
            <tr><th>示すもの</th><td>A は<b>トートロジ</b></td><td>¬A（の節集合）は<b>充足不能</b></td></tr>
            <tr><th>ゴール</th><td>葉がすべて初期シーケント</td><td>空節 ⊥ が出る</td></tr>
            <tr><th>健全性の鍵</th><td>各規則が恒真性を保つ</td><td>導出節は親節から論理的に導かれる</td></tr>
            <tr><th>失敗したら</th><td>行き止まりの葉 → 反例</td><td>新しい節が出なくなる → 充足させる解釈</td></tr>
            <tr><th>次の第 2 部では</th><td>第 9 回：∀∃ の規則</td><td>第 7〜8 回：単一化・導出</td></tr></table></div>`),
          talk(`R: どっちも「健全で完全」なら、どっちを使っても答えは同じ？
S[happy]: 命題論理ならね。しかも真理値表とも一致する。でも述語論理では真理値表が作れないから、**健全で完全な証明体系**の価値がぐっと上がる。それが第 6 回からの第 2 部だよ。`),
          point('LK も導出も<b>健全かつ完全</b>。LK は「トートロジ」を、導出は「否定が充足不能」を示す ── 向きが違うだけで同じことを確かめている。'),
        )
      },
    },
  ],
  exercises: ex5Items,
  quiz: [
    { q: '健全性を表すのは？', opts: ['⊨ A ならば ⊢ A', '⊢ A ならば ⊨ A', '⊢ A ならば ⊢ ¬A', '⊨ A ならば ⊨ ¬A'], a: 1, why: '健全性：証明できる（⊢）ならば本当に正しい（⊨）。逆向きが完全性。' },
    { q: '「LK は健全」を示すために確かめることは？', opts: ['すべての証明図を列挙する', '初期シーケントがトートロジ＋各規則が恒真性を保持', 'Wang が必ず止まる', 'すべてのトートロジに証明図がある'], a: 1, why: '葉がトートロジで、規則 1 段ごとに「前提がトートロジ ⇒ 結論もトートロジ」なら、帰納法で根もトートロジ。' },
    { q: '規則が「恒真性を保持する」とは？', opts: ['結論がトートロジなら前提もトートロジ', '前提がすべてトートロジなら結論もトートロジ', '前提と結論が論理的同値', '前提が初期シーケント'], a: 1, why: '前提 → 結論 の向きに「⊤ のバトン」が渡ること。' },
    { q: 'ex5.1 の証明で使ってはいけないのは？', opts: ['真偽値割り当ての定義 (7)', 'トートロジの定義', '背理法', '同値変形 B ⊃ C ∨ ¬A ≡ A ∧ B ⊃ C'], a: 3, why: '問題文で「シーケントや式の同値変形を使わず」と指定されている。定義から直接示すのが目的。' },
    { q: '「にせ∨左」（前提 A, Γ → Δ だけから A ∨ B, Γ → Δ）が健全でない理由は？', opts: ['A が右に移っていない', 'B の場合を確かめていない', 'Γ が消えている', '実は健全'], a: 1, why: 'A ∨ B が ⊤ でも A は ⊥（B だけ ⊤）の場合がある。だから本物の ∨左 は 2 本に枝分かれする。' },
    { q: 'Wang の行き止まりの葉が「R → P, Q」。元のシーケントの反例は？', opts: ['P=⊤, Q=⊤, R=⊥', 'P=⊥, Q=⊥, R=⊤', 'P=⊤, Q=⊥, R=⊤', '反例はない'], a: 1, why: '左の記号を ⊤、右の記号を ⊥ にする。R = ⊤, P = Q = ⊥ でこの葉が偽になり、根まで偽が伝わる。' },
    { q: '完全性の証明で使う考え方は？', opts: ['対偶：証明できないならトートロジでない', '逆：トートロジでないなら証明できる', '帰納法：規則が恒真性を保つ', '同値変形'], a: 0, why: 'Wang が失敗したら反例の解釈が作れる → トートロジでない。これが「トートロジなら証明できる」の対偶。' },
  ],
}
