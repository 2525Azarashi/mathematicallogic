import { h, html, talk, point, defn, lab, callout, rich, fxs, fxHTML, confettiAt, toast, seg } from '../lib/ui.js'
import { proofBuilder } from '../widgets/proof.js'
import { formulaInput } from '../widgets/formula-input.js'
import { parseSequent, showSeq, sequentFormula, show, classify, wang, treeOk, findCounter, fmtI } from '../logic/core.js'
import { toto } from '../lib/chars.js'

// rule cards (lecture 4.3.1)
const RULES = [
  ['¬左', ['Γ → Δ, A'], '¬A, Γ → Δ', '左の ¬A は、右へ移って A になる', false],
  ['¬右', ['A, Γ → Δ'], 'Γ → Δ, ¬A', '右の ¬A は、左へ移って A になる', false],
  ['∧左', ['A, B, Γ → Δ'], 'A ∧ B, Γ → Δ', '左の ∧ は、カンマに分かれる', false],
  ['∧右', ['Γ → Δ, A', 'Γ → Δ, B'], 'Γ → Δ, A ∧ B', '右の ∧ は、2 本に枝分かれ', true],
  ['∨左', ['A, Γ → Δ', 'B, Γ → Δ'], 'A ∨ B, Γ → Δ', '左の ∨ は、2 本に枝分かれ（場合分け）', true],
  ['∨右', ['Γ → Δ, A, B'], 'Γ → Δ, A ∨ B', '右の ∨ は、カンマに分かれる', false],
  ['⊃左', ['Γ → Δ, A', 'B, Γ → Δ'], 'A ⊃ B, Γ → Δ', '左の ⊃ は枝分かれ：A を右へ / B を左へ', true],
  ['⊃右', ['A, Γ → Δ, B'], 'Γ → Δ, A ⊃ B', '右の ⊃ は、A を左へ・B は右に残す', false],
]
const ruleCard = ([n, prem, conc, gist, br]) => h('div.rule', { class: br ? 'br' : '' },
  h('span.rn', n), br ? h('span.split', '枝分かれ') : null,
  h('div.prem', ...prem.map((p) => h('span', { html: fxs(p) }))), h('div.ln'), h('div.conc', { html: fxs(conc) }), h('div.gist', gist))

// --- Lab: sequent = formula translator ---
function seqMeaningLab() {
  const out = h('div', { style: { marginTop: '14px' } })
  const fi = formulaInput({
    sequent: true, value: 'P, Q → P ∧ Q', examples: ['P, Q → P ∧ Q', 'P ∨ Q → P, Q', '→ P ∨ ¬P', 'P →', 'P → Q'],
    onChange(s) {
      out.innerHTML = ''
      if (!s) return
      const f = sequentFormula(s)
      const c = classify(f)
      out.append(h('div.cnf-line', { style: { background: 'var(--paper)' } }, h('span.eqs', '≡'), h('span', { html: fxHTML(show(f)) }), h('span.why', { html: `左は <b>∧</b> で、右は <b>∨</b> でつなぐ${!s.L.length ? '<br>（左が空 → ⊤）' : ''}${!s.R.length ? '<br>（右が空 → ⊥）' : ''}` })),
        html(`<div class="verdict ${c.kind === 'valid' ? 'valid' : 'unsat'}" style="margin-top:10px">${toto(c.kind === 'valid' ? 'top' : 'bot')}<div>${c.kind === 'valid' ? 'トートロジであるシーケント' : 'トートロジではない'}<small>${c.kind === 'valid' ? '左を全部 ⊤ にすると、右のどれかが必ず ⊤ になる。' : '左が全部 ⊤ なのに右が全部 ⊥ になる解釈がある。'}</small></div></div>`))
    },
  })
  return lab('シーケント → 論理式 翻訳機', { hint: '「→」はキーボードの => でも入力可' }, fi, out)
}

// --- Lab: identify the rule (ex4.1 style) ---
function whichRuleLab() {
  const items = [
    { prem: ['P, Q → P ∨ Q'], conc: 'P ∧ Q → P ∨ Q', a: '∧左', map: 'A = P, B = Q, Γ = （空）, Δ = P ∨ Q' },
    { prem: ['P → Q, R'], conc: 'P → Q ∨ R', a: '∨右', map: 'A = Q, B = R, Γ = P, Δ = （空）' },
    { prem: ['P → Q', 'P → R'], conc: 'P → Q ∧ R', a: '∧右', map: 'A = Q, B = R, Γ = P, Δ = （空）' },
    { prem: ['P → Q'], conc: '→ P ⊃ Q', a: '⊃右', map: 'A = P, B = Q, Γ = （空）, Δ = （空）' },
    { prem: ['Q → P'], conc: '¬P, Q →', a: '¬左', map: 'A = P, Γ = Q, Δ = （空）' },
    { prem: ['→ P, Q', 'R → Q'], conc: 'P ⊃ R → Q', a: '⊃左', map: 'A = P, B = R, Γ = （空）, Δ = Q' },
  ]
  let k = 0
  const body = h('div')
  function load() {
    const it = items[k]
    body.innerHTML = ''
    const opts = h('div.keys', { style: { justifyContent: 'center', marginTop: '16px' } })
    const fb = h('div', { style: { marginTop: '14px', minHeight: '40px' } })
    RULES.forEach(([n]) => opts.append(h('button', { type: 'button', style: { fontFamily: 'var(--f-jp)', fontSize: '15px', minWidth: '64px' }, onclick: (e) => {
      if (n === it.a) { e.currentTarget.style.background = 'var(--top-l)'; fb.innerHTML = `<div class="callout tip"><span class="ic">✓</span><p>正解：<b>${n}</b>。対応は <span class="fx">${fxs(it.map)}</span></p></div>`; confettiAt(e.currentTarget) }
      else { e.currentTarget.style.background = 'var(--bot-l)'; toast('結論（下）で、どの論理式のどの側が消えた？') }
    } }, n)))
    body.append(h('div.ctrls', { style: { justifyContent: 'space-between' } }, h('span.chip', `問 ${k + 1} / ${items.length}`), h('button.btn.sm', { type: 'button', onclick: () => { k = (k + 1) % items.length; load() } }, '次の問題 →')),
      h('div.pf-scroll', h('div.pf', h('div.pf-node', h('div.pf-prem', ...it.prem.map((p) => h('div.pf-seq.fx', { html: fxs(p) }))), h('div.pf-bar', h('span.rl', '？')), h('div.pf-seq.fx', { html: fxs(it.conc) })))), opts, fb)
  }
  load()
  return lab('どの推論規則？ 上下を見比べて当てる', { hint: '下（結論）にあって上（前提）で分解された論理式を探す' }, body)
}

// --- Lab: proof builder (Wang) ---
function proofLab() {
  const pb = proofBuilder(parseSequent('→ P ∨ ¬P'))
  const fi = formulaInput({
    sequent: true, value: '→ P ∨ ¬P',
    examples: ['→ P ∨ ¬P', '→ (P ∨ Q) ∨ R ⊃ P ∨ (Q ∨ R)', 'P ∧ Q → P ∨ Q', '→ (P ⊃ Q) ⊃ (¬Q ⊃ ¬P)', '→ ¬(P ∧ Q) ⊃ ¬P ∨ ¬Q', 'P ∨ Q → P', '→ (P ⊃ Q) ⊃ (Q ⊃ P)'],
    onChange: (s) => s && pb.load(s),
  })
  return lab('証明図ビルダー：Wang のアルゴリズムを手で回す', { badge: 'PROOF', hint: '下線の付いた論理式をクリック → 推論規則を逆向きに適用' }, fi, h('hr', { style: { border: 0, borderTop: '2px dashed var(--rule)', margin: '18px 0' } }), pb)
}

export default {
  no: 4, slug: 'lec04', date: '10/16', color: '#9d7bff', colorL: '#ece5ff',
  title: '命題論理 — シーケント計算', sub: '「→」の左右に式を並べ、規則を逆にたどって証明する',
  tags: ['構文論と意味論', '健全性・完全性', 'シーケント', 'LK', '証明図', 'Wang'],
  tinyFx: 'A, B, Γ → Δ  /  A ∧ B, Γ → Δ',
  summary: '真理値表を使わずに、記号の変形ルールだけで「正しい」ことを示す。LK の推論規則を下から上へ逆向きに使うと、証明が自動で見つかる。',
  chapters: [
    {
      id: 'syn', title: '構文論 vs 意味論：もう 1 つの「正しさ」', en: 'Syntax vs semantics',
      build(el) {
        el.append(
          talk(`R: 恒真かどうかは真理値表でわかるのに、なんで別の方法がいるんですか？
S: 命題記号が 30 個あったら真理値表は 2³⁰ ≒ 10 億行。それに、次の**述語論理**では真理値表そのものが作れなくなる。
R[wow]: え、作れない！？
S: だから「意味（⊤/⊥）を計算する」のとは別に、「**記号の変形ルールだけで導けるか**」で正しさを示す方法が必要なんだ。それが**構文論**側の**演繹体系**。`),
          html(`<div class="split reveal" style="margin:22px 0">
            <div class="panel" style="background:var(--top-l)"><h5>意味論 semantics　<span class="fx">⊨ A</span></h5><p style="margin:0;font-weight:700;font-size:14px">解釈・真偽値割り当てで「どの I でも ⊤」を確かめる。<br>道具：真理値表、（導出原理）</p></div>
            <div class="panel" style="background:var(--imp-l)"><h5>構文論 syntax　<span class="fx">⊢ A</span></h5><p style="margin:0;font-weight:700;font-size:14px">公理から推論規則を有限回使って導けるか。<br>Hilbert 型（公理が複雑）／Gentzen 型（規則で構造を分解：<b>シーケント</b>・自然演繹）</p></div></div>`),
          defn('定義', '健全性と完全性 — 構文論と意味論の一致', `<b>健全性</b>（soundness）：$⊢ A$ ならば $⊨ A$。証明できるものは本当に正しい。<br><b>完全性</b>（completeness）：$⊨ A$ ならば $⊢ A$。正しいものは必ず証明できる。`),
          talk(`R: 導出原理のときと同じ言葉だ。
S[happy]: そう。健全で完全なら、「証明できる」と「トートロジ」がぴったり一致する。今日の LK はまさにそういう体系。証明は第 5 回のテーマだよ。`),
          point('<b>⊢</b>（証明できる＝構文論）と <b>⊨</b>（いつでも真＝意味論）は別の概念。両者をつなぐのが健全性・完全性。'),
        )
      },
    },
    {
      id: 'seq', title: 'シーケントってなに？', en: 'Sequents',
      build(el) {
        el.append(
          talk(`S: シーケントは $A₁, …, Aₘ → B₁, …, Bₙ$ という形。左が「仮定の束」、右が「結論の候補の束」。
R: カンマが左と右で意味が違うって聞きました。
S: そこが核心。**左のカンマは ∧、右のカンマは ∨**。つまり「左が**全部**成り立つなら、右の**どれか**が成り立つ」。
R: 左が空なら？
S: 左が空 = ⊤（何も仮定しない）、右が空 = ⊥（何も主張できない＝矛盾）。翻訳機で遊んでみて。`),
          seqMeaningLab(),
          defn('定義', 'シーケントの意味', `シーケント $A₁, …, Aₘ → B₁, …, Bₙ$ に論理式 $(A₁ ∧ … ∧ Aₘ) ⊃ (B₁ ∨ … ∨ Bₙ)$ を対応させる。これがトートロジのとき，シーケントは<b>トートロジである</b>という。`),
          defn('定義', '初期シーケント（始式）', `両辺が<b>すべて命題記号</b>で、左右に<b>同じ命題記号</b>が現れるシーケント。例：$P, Q → R, P$<p class="note">左の P が ⊤ なら右の P も ⊤ なので、明らかにトートロジ。証明図の「葉」になる。</p>`, { en: 'initial sequent' }),
        )
      },
    },
    {
      id: 'lk', title: '体系 LK の推論規則', en: 'Inference rules of LK',
      build(el) {
        el.append(
          talk(`S: LK の規則は、論理記号ごとに「左にあるとき」「右にあるとき」の 2 種類。全部で 8 つ（＋並べかえの exchange）。
R: 8 個も覚えられるかな…。
S: 覚え方のコツがある。線の**下が結論、上が前提**。下にある論理記号を 1 つ**ほどいた**のが上。そして、
・**¬** はほどくと**反対側へ移る**
・**左の ∧ / 右の ∨** はカンマになるだけ（カンマの意味と一致！）
・**右の ∧ / 左の ∨ / 左の ⊃** は**枝分かれ**する`),
          h('div.rules.reveal', ...RULES.map(ruleCard)),
          h('p', { class: 'reveal', style: { fontSize: '13px', fontWeight: 700, color: 'var(--ink-2)', margin: '14px 0' }, html: rich('（exchange）$Γ → Δ$ から、Γ, Δ の中の論理式を並べかえた $Γ\' → Δ\'$ を導いてよい。Γ, Δ は 0 個以上の論理式の列、A, B は 1 個の論理式。') }),
          talk(`R: 右の ∨ がカンマになるのは「右のカンマ = ∨」だからか！ 左の ∧ も「左のカンマ = ∧」。
S[happy]: そういうこと。そしてカンマにできない組み合わせ（右の ∧ や左の ∨）は、**両方を別々に示す**しかないから枝分かれする。
R: 左の ∨ は「場合分け」ですね。A のときも B のときも Δ が言えればいい。`),
          whichRuleLab(),
          callout('tip', '演習 4.1 の答え方：「<b>○○ 規則</b>。Γ = …, Δ = …, A = …, B = …」と、規則の文字に具体的な式を対応させて書く。空のときは「Γ, Δ は空列」と明記しましょう。'),
        )
      },
    },
    {
      id: 'proof', title: '証明図と Wang のアルゴリズム', en: 'Proof figures & Wang\'s algorithm',
      build(el) {
        el.append(
          talk(`S: 証明図は、シーケントを規則で積み上げた木。**一番下（根）が示したいシーケント、上の葉が全部初期シーケント**なら完成。
R: 上から組み立てるの、どこから始めればいいかわからないです…。
S: だから**逆向き**に作る。示したいシーケントを下に置いて、論理記号を 1 つずつほどきながら上へ伸ばす。これが **Wang のアルゴリズム**。`),
          defn('アルゴリズム', 'Check(S) — Wang のアルゴリズム', `<ol><li>S が論理記号を含む → 推論規則を<b>逆向き</b>に使って分解し、得られた各シーケント $S₁, S₂$ に Check を行う。<b>いずれも</b>トートロジならば S はトートロジ。</li><li>S が論理記号を含まず、初期シーケント → トートロジ。</li><li>それ以外 → トートロジではない。</li></ol>`),
          talk(`R: ほどく順番は自由なんですか？
S: どの順でも結果（トートロジかどうか）は変わらない。ただ、**枝分かれしない規則を先に**使うと木が小さくなってラクだよ。「▶ Wang に 1 手まかせる」はその戦略で選んでる。`),
          proofLab(),
          talk(`R[wow]: $→ (P ∨ Q) ∨ R ⊃ P ∨ (Q ∨ R)$ が、葉が全部緑になって完成した！
S[happy]: 演習 4.2 (2) だね。答案では、この木を下から描いて、各横線の右に規則名を書けば OK。
R: $P ∨ Q → P$ はピンクの葉が出ました。
S: 行き止まりの $Q → P$ は「Q = ⊤, P = ⊥」で左が ⊤・右が ⊥ になる。それがそのまま元のシーケントの**反例**になるんだ。Wang は証明だけじゃなく、反例探しもしてくれる。`),
          point('Wang：<b>根に示したいシーケント → 論理記号をほどく → 葉が全部初期シーケントなら証明完成</b>。1 つでも行き止まりがあればトートロジではない（反例も読める）。'),
          defn('定理', 'LK の健全性・完全性', `<b>健全性</b>：任意のシーケントは LK で証明可能ならばトートロジである．<br><b>完全性</b>：任意のシーケントはトートロジであれば LK で証明可能である．`, { thm: true }),
        )
      },
    },
  ],
  exercises: [
    {
      no: '4.1', q: 'P, Q, R を命題記号とする．「P, Q → P ∨ Q ／ P ∧ Q → P ∨ Q」（上が前提、下が結論）は LK のどの推論規則を適用したものか．また，適用した推論規則の Γ, Δ, A, B それぞれがこの例では何に対応しているのかを示せ．',
      hint: '下の左辺にある P ∧ Q が、上では P, Q とカンマに分かれている。「左の ∧ はカンマに」…。',
      answer: `<b>(∧ 左)</b> 規則。<br>規則の形 $A, B, Γ → Δ$ ／ $A ∧ B, Γ → Δ$ と照らし合わせると、<b>A = P, B = Q, Γ = 空列（論理式 0 個）, Δ = P ∨ Q</b>。`,
    },
    {
      no: '4.2 (1)', q: 'Wang のアルゴリズムを使って → P ∨ ¬P がトートロジであることを証明せよ．',
      hint: '右の ∨ をほどく（∨右）→ 右に P, ¬P。次に右の ¬ を左へ（¬右）。',
      answer: (() => { const t = wang(parseSequent('→ P ∨ ¬P')); return h('div', h('div.pf-scroll', staticTree(t)), h('p', { style: { margin: '6px 0 0', fontSize: '13.5px', fontWeight: 700 } }, '葉 P → P は初期シーケントなので、→ P ∨ ¬P はトートロジ。')) })(),
    },
    {
      no: '4.2 (2)', q: 'Wang のアルゴリズムを使って → (P ∨ Q) ∨ R ⊃ P ∨ (Q ∨ R) がトートロジであることを証明せよ．',
      hint: 'まず優先順位で主結合子を確認：⊃ が一番弱い。⊃右 → ∨右 × 2 → ∨左 × 2 の順で、葉が 3 つ。',
      answer: (() => { const t = wang(parseSequent('→ (P ∨ Q) ∨ R ⊃ P ∨ (Q ∨ R)')); return h('div', h('div.pf-scroll', staticTree(t)), h('p', { style: { margin: '6px 0 0', fontSize: '13.5px', fontWeight: 700 } }, '3 つの葉 P → P, Q, R ／ Q → P, Q, R ／ R → P, Q, R はすべて初期シーケントなので、与えられたシーケントはトートロジ。')) })(),
    },
  ],
  quiz: [
    { q: 'シーケント $P, Q → R, S$ が表す論理式は？', opts: ['$(P ∨ Q) ⊃ (R ∧ S)$', '$(P ∧ Q) ⊃ (R ∨ S)$', '$(P ∧ Q) ⊃ (R ∧ S)$', '$P ∧ Q ∧ R ∧ S$'], a: 1, why: '左のカンマは ∧、右のカンマは ∨。「左が全部 ⊤ なら右のどれかが ⊤」。' },
    { q: '初期シーケントはどれ？', opts: ['$P ∧ Q → P$', '$P, Q → R$', '$Q, P → R, P$', '$→ P$'], a: 2, why: '両辺が命題記号だけで、左右に同じ P がある。P ∧ Q → P はトートロジだけど論理記号 ∧ を含むので「初期」ではない（∧左 で 1 回ほどく必要あり）。', hint: '「すべて命題記号」かつ「左右に共通の記号」。' },
    { q: '逆向きに使うと枝分かれする規則は？', opts: ['∧左', '∨右', '⊃右', '⊃左'], a: 3, why: '⊃左 は「Γ → Δ, A」と「B, Γ → Δ」の 2 本に分かれる。他に ∧右・∨左 も枝分かれ。' },
    { q: '$→ ¬P$ に ¬右 を逆向きに使うと？', opts: ['$P →$', '$→ P$', '$¬P →$', '$P → P$'], a: 0, why: '右の ¬A は左に移って A になる。だから P →（右辺は空 = ⊥）。' },
    { q: 'Wang で 1 つの葉が「$Q → P$」で行き止まりになった。元のシーケントの反例は？', opts: ['P = ⊤, Q = ⊤', 'P = ⊥, Q = ⊤', 'P = ⊤, Q = ⊥', '反例はない'], a: 1, why: '左を ⊤、右を ⊥ にする解釈：Q = ⊤, P = ⊥。この解釈で元のシーケントも偽になる。' },
  ],
}

// static (non-interactive) proof tree
function staticTree(t) {
  const node = (n) => {
    const w = h('div.pf-node')
    if (n.kids && n.kids.length) w.append(h('div.pf-prem', ...n.kids.map(node)), h('div.pf-bar', h('span.rl', n.rule)))
    else if (n.status === 'axiom') w.append(h('div.pf-mark.ok', '✓ 初期'))
    w.append(h('div.pf-seq.fx', { class: n.status === 'axiom' ? 'axiom' : n.status === 'fail' ? 'fail' : '', html: fxs(showSeq(n.seq)) }))
    return w
  }
  return h('div.pf', node(t))
}
