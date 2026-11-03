// ex5（第5回 健全性と完全性）の問題データ — 演習解説ページと第5回講義ページで共有
import { h, rich, fxs, tv } from '../lib/ui.js'
import { parse, parseSequent, evaluate, wang } from '../logic/core.js'
import { truthTable } from '../widgets/truth-table.js'
import { proofBuilder } from '../widgets/proof.js'
import { staticTree } from '../widgets/proof-static.js'

// ---------- ex5（第5回 健全性と完全性）----------
export const EX5 = [
  {
    no: '5.1',
    q: 'LK の推論規則 (¬右) において，Γ, Δ をどちらもそれぞれ 1 つの論理式 B, C から成るものとするとき，この規則は前提が A ∧ B → C，結論が B → C ∨ ¬A となる．この規則が恒真性を保持するという性質は「A ∧ B ⊃ C がトートロジ（恒真）ならば B ⊃ C ∨ ¬A もトートロジ（恒真）になる」と記述できる．これを証明せよ．問題の意図を考え，シーケントや式の同値変形を使わず，意味論のトートロジ（恒真）の定義から証明すること．',
    hint: 'もし B ⊃ C ∨ ¬A を ⊥ にする解釈 I があったら？ ⊃ が ⊥ になるのは「左 ⊤・右 ⊥」の 1 パターンだけ。定義 (7) → (6) → (4) と逆にたどると、A, B, C の値が全部決まる。その I で A ∧ B ⊃ C はどうなる？',
    answer: () => h('div.proof-text', { html: rich(`
<p class="pt-note">記号の強さは ¬ &gt; ∧ &gt; ∨ &gt; ⊃ なので，$A ∧ B ⊃ C$ は $(A ∧ B) ⊃ C$，$B ⊃ C ∨ ¬A$ は $B ⊃ (C ∨ ¬A)$ と読む．以下，(4)〜(7) は真偽値割り当ての定義の番号．</p>
<p><b>証明（背理法）</b></p>
<p>$A ∧ B ⊃ C$ がトートロジであると仮定する．すなわち，<b>任意の解釈 I</b> に対して</p>
<p class="pt-eq">[[A ∧ B ⊃ C]]<sub>I</sub> = ⊤　…（★）</p>
<p>ここで $B ⊃ C ∨ ¬A$ がトートロジ<b>でない</b>と仮定すると，<b>ある解釈 I</b> が存在して [[B ⊃ C ∨ ¬A]]<sub>I</sub> = ⊥ となる．</p>
<ol class="pt-steps">
<li>定義 (7) より，[[B]]<sub>I</sub> = ⊥ または [[C ∨ ¬A]]<sub>I</sub> = ⊤ が成り立たない．よって <b>[[B]]<sub>I</sub> = ⊤</b> かつ [[C ∨ ¬A]]<sub>I</sub> = ⊥．</li>
<li>[[C ∨ ¬A]]<sub>I</sub> = ⊥ と定義 (6) より，<b>[[C]]<sub>I</sub> = ⊥</b> かつ [[¬A]]<sub>I</sub> = ⊥．</li>
<li>[[¬A]]<sub>I</sub> = ⊥ と定義 (4) より，<b>[[A]]<sub>I</sub> = ⊤</b>．</li>
<li>[[A]]<sub>I</sub> = ⊤，[[B]]<sub>I</sub> = ⊤ と定義 (5) より，[[A ∧ B]]<sub>I</sub> = ⊤．</li>
<li>[[A ∧ B]]<sub>I</sub> = ⊤，[[C]]<sub>I</sub> = ⊥ と定義 (7) より，[[A ∧ B ⊃ C]]<sub>I</sub> = ⊥．</li>
</ol>
<p>これは（★）に矛盾する．したがって，任意の解釈 I に対して [[B ⊃ C ∨ ¬A]]<sub>I</sub> = ⊤，すなわち <b>$B ⊃ C ∨ ¬A$ はトートロジである</b>．∎</p>`) }),
    extra: [['📝 別解（場合分け）', () => h('div.ans.alt', h('h5', 'ANOTHER PROOF'), h('div.proof-text', { html: rich(`
<p>$A ∧ B ⊃ C$ がトートロジであると仮定し，<b>任意の解釈 I</b> をとる．[[B ⊃ C ∨ ¬A]]<sub>I</sub> = ⊤ を示す．定義 (7) より，[[B]]<sub>I</sub> = ⊥ または [[C ∨ ¬A]]<sub>I</sub> = ⊤ を示せばよい．</p>
<ol class="pt-steps">
<li><b>[[B]]<sub>I</sub> = ⊥ のとき</b>：定義 (7) より [[B ⊃ C ∨ ¬A]]<sub>I</sub> = ⊤．</li>
<li><b>[[B]]<sub>I</sub> = ⊤ かつ [[A]]<sub>I</sub> = ⊥ のとき</b>：定義 (4) より [[¬A]]<sub>I</sub> = ⊤．定義 (6) より [[C ∨ ¬A]]<sub>I</sub> = ⊤．よって定義 (7) より [[B ⊃ C ∨ ¬A]]<sub>I</sub> = ⊤．</li>
<li><b>[[B]]<sub>I</sub> = ⊤ かつ [[A]]<sub>I</sub> = ⊤ のとき</b>：定義 (5) より [[A ∧ B]]<sub>I</sub> = ⊤．仮定より [[A ∧ B ⊃ C]]<sub>I</sub> = ⊤ なので，定義 (7) より [[A ∧ B]]<sub>I</sub> = ⊥ または [[C]]<sub>I</sub> = ⊤．前者は成り立たないので [[C]]<sub>I</sub> = ⊤．定義 (6) より [[C ∨ ¬A]]<sub>I</sub> = ⊤，定義 (7) より [[B ⊃ C ∨ ¬A]]<sub>I</sub> = ⊤．</li>
</ol>
<p>いずれの場合も [[B ⊃ C ∨ ¬A]]<sub>I</sub> = ⊤．I は任意なので，$B ⊃ C ∨ ¬A$ はトートロジである．∎</p>`) }))]],
    see: ['lec04', 'syn'],
    lab: () => breakLab(),
    labLabel: '🧪 「壊せるか」ラボ',
  },
  {
    no: '5.2',
    q: 'Wang のアルゴリズムを使って → P ∧ (P ⊃ Q) ⊃ Q がトートロジであることを証明せよ．',
    hint: '主結合子は一番弱い ⊃ → まず (⊃右)。次に左辺の ∧ を (∧左) でカンマに。最後に左辺の ⊃ を (⊃左) で枝分かれ（A は右辺へ、B は左辺へ）。',
    answer: () => h('div', h('div.pf-scroll', staticTree(wang(parseSequent('→ P ∧ (P ⊃ Q) ⊃ Q')))),
      h('div.proof-text', { html: rich(`<ol class="pt-steps">
<li><b>(⊃右)</b>：右辺の $P ∧ (P ⊃ Q) ⊃ Q$ の前件を左辺へ → $P ∧ (P ⊃ Q) → Q$</li>
<li><b>(∧左)</b>：左辺の $P ∧ (P ⊃ Q)$ をカンマに → $P, P ⊃ Q → Q$</li>
<li><b>(⊃左)</b>：左辺の $P ⊃ Q$ で枝分かれ（Γ = P, Δ = Q, A = P, B = Q）→ $P → Q, P$ と $Q, P → Q$</li>
</ol>
<p>2 つの葉 $P → Q, P$ と $Q, P → Q$ は，両辺が命題記号だけで左右に共通の記号（P と Q）を含むので<b>初期シーケント</b>．すべての葉が初期シーケントなので，<b>→ P ∧ (P ⊃ Q) ⊃ Q はトートロジである</b>．</p>
<p class="pt-note">※ (⊃左) の規則の形は $A ⊃ B, Γ → Δ$ なので，厳密には交換規則 (exchange) で $P ⊃ Q$ を左端に並べ替えてから適用する．答案では「交換規則で並べ替え」と一言添えるか，交換は省略してよい扱いが多い．</p>`) })),
    see: ['lec04', 'proof'],
    lab: () => proofBuilder(parseSequent('→ P ∧ (P ⊃ Q) ⊃ Q')),
    labLabel: '🧪 証明図を自分で組む',
  },
]

// ---------- 5.1 lab: 結論を ⊥ にできるか？ ----------
export function breakLab() {
  const v = { A: true, B: true, C: false }
  const prem = parse('(A ∧ B) ⊃ C'), concl = parse('B ⊃ (C ∨ ¬A)')
  const chain = [['A ∧ B', '(5)'], ['¬A', '(4)'], ['C ∨ ¬A', '(6)']].map(([s, d]) => [parse(s), s, d])
  const sw = h('div.tv-sws')
  const chainEl = h('div.bl-chain'), big = h('div.bl-big'), msg = h('div.bl-msg')
  ;['A', 'B', 'C'].forEach((k) => sw.append(h('button.tv-sw', { type: 'button', dataset: { k }, 'aria-label': `${k} の値を切り替え`, onclick: () => { v[k] = !v[k]; draw() } })))
  function draw() {
    sw.querySelectorAll('.tv-sw').forEach((b) => { const k = b.dataset.k; b.classList.toggle('on', v[k]); b.innerHTML = `<span class="k">[[${k}]]<sub>I</sub></span>${tv(v[k])}` })
    chainEl.innerHTML = chain.map(([f, s, d]) => `<span class="bl-c"><span class="fx">${fxs(s)}</span> ${tv(evaluate(f, v))}<small>${d}</small></span>`).join('')
    const p = evaluate(prem, v), c = evaluate(concl, v)
    big.innerHTML = `<div class="bl-box ${p ? 't' : 'f'}"><small>前提</small><span class="fx">${fxs('(A ∧ B) ⊃ C')}</span>${tv(p)}</div><div class="bl-arr">ならば？</div><div class="bl-box ${c ? 't' : 'f'}"><small>結論</small><span class="fx">${fxs('B ⊃ (C ∨ ¬A)')}</span>${tv(c)}</div>`
    msg.className = 'bl-msg ' + (c ? '' : 'hit')
    msg.innerHTML = c
      ? (p ? '結論は ⊤。結論を ⊥ にするには、(7) より <b>B = ⊤</b> かつ <b>C ∨ ¬A = ⊥</b> が必要…。' : '前提が ⊥ の解釈。でも前提は「トートロジ（どの I でも ⊤）」と仮定しているので、こういう I はそもそも考えなくていい。')
      : '<b>結論が ⊥ になった！</b> でもこのとき <b>前提も ⊥</b>。前提がトートロジなら、こんな I は存在しない → 結論はどの I でも ⊤。<b>これが背理法の中身。</b>'
  }
  draw()
  const tt = truthTable([prem, concl], { columns: 'atoms+goal', selectable: false })
  return h('div',
    h('p.bl-lead', { html: rich('A, B, C は<b>任意の論理式</b>だけど、1 つの解釈 I のもとでの値は ⊤ か ⊥ のどちらか。だから「値の組」は 8 通りしかない。スイッチを押して、<b>前提が ⊤ のまま結論だけ ⊥</b> にできるか試してみよう。') }),
    sw, chainEl, big, msg,
    h('details.bl-all', h('summary', '8 通りすべてを一覧で見る'), tt.el, h('p.bl-cap', { html: rich('結論が ⊥ の行（A=⊤, B=⊤, C=⊥）では、前提も ⊥。前提が ⊤ の行では、結論も必ず ⊤。') })))
}

