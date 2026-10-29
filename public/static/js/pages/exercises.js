// ============================================================
//  演習解説ページ  #/ex , #/ex/<ex1..ex5>
//  各問題を「考え方（対話）→ ヒント → 解答例 → 採点ポイント → よくあるミス → ラボ」で並べる
// ============================================================
import { h, talk, rich, fxs, tv, lab, callout, store, $$ } from '../lib/ui.js'
import { LECTURES, dueOf } from '../lectures/index.js'
import { EXSETS } from '../data/exsets.js'
import { EXPLAIN, REPORT_TIPS } from '../data/explain.js'
import { parse, parseSequent, evaluate, wang } from '../logic/core.js'
import { truthTable } from '../widgets/truth-table.js'
import { cnfStepper } from '../widgets/cnf.js'
import { resolutionBoard } from '../widgets/resolution.js'
import { proofBuilder } from '../widgets/proof.js'
import { staticTree } from '../widgets/proof-static.js'
import { saveButton, linkTerms } from '../lib/features.js'
import { splitChars } from '../lib/motion.js'

// ---------- ex5（第5回 健全性と完全性）----------
const EX5 = [
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

// 問題ごとの「講義のどの章で復習するか」とラボ（ex1〜ex4）
const SEE = { '1.1': ['lec01', 'set'], '1.2': ['lec01', 'power'], '1.3': ['lec01', 'rel'], '2.1': ['lec02', 'syntax'], '2.2': ['lec02', 'sem'], '2.3': ['lec02', 'valid'], '3.1': ['lec03', 'imp'], '3.2': ['lec03', 'clause'], '3.3': ['lec03', 'res'], '4.1': ['lec04', 'lk'], '4.2 (1)': ['lec04', 'proof'], '4.2 (2)': ['lec04', 'proof'] }
const LABS = {
  '2.2': ['🧪 真理値表を触る', () => truthTable([parse('(P ∧ Q) ∨ ¬P'), parse('¬Q ⊃ ¬P')], { columns: 'all' }).el],
  '3.2': ['🧪 CNF 変換を 1 手ずつ', () => cnfStepper(parse('¬(P ∧ (Q ∨ R))'))],
  '3.3': ['🧪 自分で導出してみる', () => resolutionBoard([['P', 'Q', 'R'], ['¬P', 'R'], ['¬Q'], ['¬R']])],
  '4.2 (1)': ['🧪 証明図を自分で組む', () => proofBuilder(parseSequent('→ P ∨ ¬P'))],
  '4.2 (2)': ['🧪 証明図を自分で組む', () => proofBuilder(parseSequent('→ (P ∨ Q) ∨ R ⊃ P ∨ (Q ∨ R)'))],
}

function problemsOf(set) {
  if (set.no === 5) return EX5
  const lec = LECTURES.find((l) => l.slug === set.lec)
  return (lec?.exercises || []).map((p) => ({ ...p, see: SEE[p.no], lab: LABS[p.no]?.[1], labLabel: LABS[p.no]?.[0] }))
}

// ---------- 5.1 lab: 結論を ⊥ にできるか？ ----------
function breakLab() {
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

// ---------- problem card ----------
function xpCard(p, set) {
  const e = EXPLAIN[p.no] || p.explain || {}
  const steps = h('div.ex-steps'), reveal = h('div.ex-reveal')
  const add = (label, build, cls = '') => {
    const pane = h('div.pane')
    reveal.append(pane)
    let built = false
    const b = h('button.btn.sm', { type: 'button', class: cls, 'aria-expanded': 'false', onclick: () => {
      if (!built) { built = true; pane.append(build()) }
      const on = !pane.classList.contains('on')
      pane.classList.toggle('on', on); b.classList.toggle('primary', on); b.setAttribute('aria-expanded', String(on))
    } }, label)
    steps.append(b)
  }
  if (p.hint) add('💡 ヒント', () => h('div.hint-box', h('h5', 'HINT'), h('div', { html: rich(p.hint) })))
  if (p.answer) add('✓ 解答例', () => h('div.ans', h('h5', 'ANSWER'), typeof p.answer === 'function' ? p.answer() : typeof p.answer === 'string' ? h('div', { html: rich(p.answer) }) : p.answer.cloneNode(true)))
  ;(p.extra || []).forEach(([label, build]) => add(label, build))
  if (e.points) add('📋 採点ポイント', () => h('div.xp-points', h('h5', '採点ポイント — ここが書けていれば OK'), h('ul', ...e.points.map((x) => h('li', { html: rich(x) })))))
  if (e.miss) add('⚠️ よくあるミス', () => h('div.xp-miss', h('h5', 'よくあるミス'), h('ul', ...e.miss.map((x) => h('li', { html: rich(x) })))))
  if (p.lab) add(p.labLabel || '🧪 ラボ', () => h('div.xp-lab', p.lab()))
  const lec = p.see && LECTURES.find((l) => l.slug === p.see[0])
  const chap = lec && lec.chapters.find((c) => c.id === p.see[1])
  const slugNo = p.no.replace(/\D+/g, '-').replace(/-$/, '')
  return h('article.ex.xp.reveal', { id: 'p-' + slugNo },
    h('div.ex-head', h('span.no', p.no), h('div.q-txt', { html: rich(p.q) }),
      saveButton({ id: set.lec ? `ex:${set.lec}:${problemsOf(set).indexOf(p)}` : `ex:${set.id}:${p.no}`, kind: 'ex', title: `演習 ${p.no}：` + String(p.q).replace(/<[^>]+>/g, '').slice(0, 70), sub: `ex${set.no} ${set.topic}`, href: `#/ex/${set.id}` })),
    h('div.ex-body',
      e.think ? h('div.xp-think', h('div.xp-label', h('span', '考え方'), h('small', 'サカイ × リョウガ')), talk(e.think)) : null,
      steps, reveal,
      chap ? h('div.xp-foot', h('a', { href: `#/lec/${lec.slug}/${chap.id}` }, h('small', `第${lec.no}回で復習`), chap.title, h('span.arr', ' →'))) : null))
}

const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}（${'日月火水木金土'[d.getDay()]}）23:59`
const daysLeft = (d) => Math.ceil((d - new Date()) / 864e5)

export function exercisesPage(root, anchor) {
  const now = new Date()
  const sets = EXSETS.map((s) => ({ ...s, due: dueOf({ date: s.date }), probs: problemsOf(s) }))
  const total = sets.reduce((n, s) => n + s.probs.length, 0)
  const next = [...sets].reverse().find((s) => s.due > now)

  const title = h('h1', h('span.xp-title-t', '演習解説'), h('span.sub', 'ex1〜ex5 を「考え方 → 解答例 → 採点ポイント」で'))
  splitChars(title.firstChild)
  const hero = h('section.lec-hero.wrap', { 'data-scroll': '' }, h('div.ghost-word', { 'aria-hidden': 'true' }, 'EX'),
    h('div.crumbs', h('a', { href: '#/' }, 'ホーム'), '／', '演習解説'),
    h('div.lec-hero-grid',
      h('div.big-no', { style: { background: '#ffe1ec', fontSize: '54px' } }, '✎'),
      h('div', title, h('div.meta', h('span.chip', `${sets.length} セット`), h('span.chip', `${total} 問`), h('span.chip', { style: { background: 'var(--top-l)' } }, '解答はボタンを押すまで非表示'))),
      next ? h('a.xp-due', { href: `#/ex/${next.id}`, onclick: (e) => { e.preventDefault(); jump(next.id) } }, h('small', 'NEXT DEADLINE'), h('b', `ex${next.no} · ${fmt(next.due)}`), h('em', daysLeft(next.due) <= 1 ? 'あと 1 日！' : `あと ${daysLeft(next.due)} 日`)) : h('span')))

  const tabs = h('nav.xp-tabs.wrap', { 'aria-label': '演習セット' }, ...sets.map((s) => h('a', { href: `#/ex/${s.id}`, style: { '--c': s.color, '--cl': s.colorL }, onclick: (e) => { e.preventDefault(); jump(s.id) } }, h('b', `ex${s.no}`), h('span', s.topic), s.fresh ? h('i.new', 'NEW') : null)))

  const all = [{ id: 'tips', title: '答案の書き方 5 か条' }, ...sets.map((s) => ({ id: s.id, title: `ex${s.no} ${s.topic}`, fresh: s.fresh }))]
  const toc = h('aside.toc', h('div.toc-in', h('h5', 'EXERCISES'), ...all.map((c, k) => h('a', { href: `#/ex/${c.id}`, dataset: { id: c.id }, onclick: (e) => { e.preventDefault(); jump(c.id) } }, h('span.n', k ? String(sets[k - 1].no) : '✓'), c.title, c.fresh ? h('i.new', 'NEW') : null))))

  const main = h('div.lec-main')
  // 0. tips
  main.append(h('section.chap', { id: 'c-tips', dataset: { id: 'tips' } },
    h('div.chap-head.reveal', h('span.n', '✓'), h('h2', '答案の書き方 5 か条', h('small', 'How to write a full-score answer'))),
    talk(`R: 演習、提出したあとに「結局どう書けば満点だったの？」ってモヤモヤするんですよね。
S[happy]: じゃあここで振り返ろう。各問題を **考え方 → ヒント → 解答例 → 採点ポイント → よくあるミス** の順に並べたよ。最新の ex5 も解説つき。
R: 解答例は、自分で解いてから開く…ですよね。
S: その通り。ボタンを押すまで隠してあるから、まずヒントだけ見て手を動かしてね。`),
    h('div.xp-tips', ...REPORT_TIPS.map(([t, d], i) => h('div.xp-tip.reveal', h('span.i', String(i + 1)), h('b', t), h('p', { html: rich(d) }))))))
  // sets (latest first)
  sets.forEach((s) => {
    const lec = s.lec && LECTURES.find((l) => l.slug === s.lec)
    const d = daysLeft(s.due)
    const sec = h('section.chap.xp-set', { id: 'c-' + s.id, dataset: { id: s.id }, style: { '--accent': s.color, '--accent-l': s.colorL } },
      h('div.chap-head.reveal', h('span.n', String(s.no)), h('h2', `ex${s.no}　${s.topic}`, h('small', `Exercise ${s.no} · 第${s.no}回（${s.date}）`))),
      h('div.xp-meta.reveal',
        h('span.chip', { class: s.due > now ? 'due-open' : '' }, s.due > now ? `⏰ 締切 ${fmt(s.due)} · あと ${d} 日` : `締切済（${fmt(s.due)}）`),
        h('span.chip', `${s.probs.length} 問`),
        ...s.tags.map((t) => h('span.chip.tag', t)),
        lec ? h('a.chip.link', { href: `#/lec/${lec.slug}` }, `第${lec.no}回の講義ページ →`) : h('span.chip', { style: { opacity: .7 } }, '講義ページは準備中')))
    if (s.no === 5) sec.append(
      talk(`R: ex5 は「健全性と完全性」の回。5.1 はシーケントの規則なのに、真偽値で証明しろって言われてます。
S: そこがこの回の主役。**健全性**（証明できる ⇒ トートロジ）は、「初期シーケントはトートロジ」＋「**どの規則も、前提がトートロジなら結論もトートロジ**」を確かめれば示せる。5.1 はその (¬右) の確認なんだ。
R[think]: だから「同値変形を使うな」なんですね。使ったら、確かめたいことを先取りしちゃう。
S[happy]: そういうこと。道具は「トートロジの定義」と「真偽値割り当ての定義 (4)〜(7)」だけ。5.2 は第4回と同じ Wang のアルゴリズムだよ。`),
      callout('warn', '<b>締切前の課題です。</b>レポートは自分の理解のために自分で考えて解くもの（講義ページより）。まず「考え方」と「ヒント」で手を動かし、書き終えてから解答例で答え合わせしよう。'))
    s.probs.forEach((p) => sec.append(xpCard(p, s)))
    main.append(sec)
  })

  root.append(hero, tabs, h('div.wrap.lec-layout', toc, main))
  linkTerms(main)

  // toc highlight
  const secs = [...main.querySelectorAll('.chap')]
  const onScroll = () => {
    let cur = secs[0]
    for (const s of secs) if (s.getBoundingClientRect().top < innerHeight * 0.35) cur = s
    $$('a', toc).forEach((a) => a.classList.toggle('on', a.dataset.id === cur.dataset.id))
    $$('a', tabs).forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#/ex/${cur.dataset.id}`))
    const bar = document.querySelector('.read-bar')
    if (bar) { const d = document.documentElement; bar.style.width = (d.scrollTop / (d.scrollHeight - innerHeight)) * 100 + '%' }
  }
  addEventListener('scroll', onScroll, { passive: true })
  root._cleanup = () => removeEventListener('scroll', onScroll)
  // content-visibility makes off-screen heights estimates: instant jump, then re-correct until stable
  function jump(id, smooth = true) {
    const t = document.getElementById('c-' + id)
    if (!t) return
    history.replaceState(null, '', `#/ex/${id}`)
    const target = () => t.getBoundingClientRect().top + scrollY - 80
    if (smooth && Math.abs(t.getBoundingClientRect().top) < innerHeight * 1.5) { scrollTo({ top: target(), behavior: 'smooth' }); return }
    let n = 0
    const fix = () => { const y = target(); if (Math.abs(y - scrollY) > 2) scrollTo(0, y); if (++n < 14) requestAnimationFrame(() => setTimeout(fix, 60)) }
    fix()
  }
  root._jump = (id) => jump(id)
  if (anchor) requestAnimationFrame(() => jump(anchor, false))
  store.set('ex-visit', Date.now())
}
