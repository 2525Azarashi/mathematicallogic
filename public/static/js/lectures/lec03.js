import { h, html, talk, point, defn, lab, callout, rich, fxs, fxHTML, toast } from '../lib/ui.js'
import { atomFormula } from '../widgets/play.js'
import { formulaInput } from '../widgets/formula-input.js'
import { cnfStepper } from '../widgets/cnf.js'
import { resolutionBoard } from '../widgets/resolution.js'
import { truthTable } from '../widgets/truth-table.js'
import { parse, show, toCNFSteps, showClause, Not, And } from '../logic/core.js'
import { toto, setToto } from '../lib/chars.js'

// --- Lab: the promise metaphor for ⊃ ---
function promiseLab() {
  const I = { P: true, Q: true }
  const rows = [[true, true], [true, false], [false, true], [false, false]]
  const story = {
    'true,true': ['晴れた → 遊園地に行った', '約束どおり。', true],
    'true,false': ['晴れた → 行かなかった', '約束やぶり！ ここだけが ⊥。', false],
    'false,true': ['雨だった → でも行った', '「雨なら行かない」とは言ってない。約束は破られていない。', true],
    'false,false': ['雨だった → 行かなかった', '晴れなかったので、約束は試されてもいない。', true],
  }
  const grid = h('div.split', { style: { gridTemplateColumns: 'repeat(2,1fr)' } })
  const cards = rows.map(([p, q]) => {
    const [a, b, v] = story[`${p},${q}`]
    const t = html(toto(v ? 'top' : 'bot', { idle: false }))
    const c = h('button.panel', { type: 'button', style: { display: 'flex', gap: '14px', alignItems: 'center', textAlign: 'left', background: v ? 'var(--top-l)' : 'var(--bot-l)', cursor: 'pointer' }, onclick: () => { I.P = p; I.Q = q; sync() } },
      h('div', { style: { width: '54px', flex: 'none' } }, t),
      h('div', h('div', { style: { fontWeight: 900, fontSize: '14px' }, html: `P=${p ? '⊤' : '⊥'}, Q=${q ? '⊤' : '⊥'}　<span class="fx">P ⊃ Q</span> = ${v ? '⊤' : '⊥'}` }), h('div', { style: { fontSize: '13.5px', fontWeight: 700 } }, a), h('div', { style: { fontSize: '12.5px', color: 'var(--ink-2)', fontWeight: 700 } }, b)))
    c._k = `${p},${q}`
    grid.append(c); return c
  })
  const sync = () => cards.forEach((c) => { c.style.outline = c._k === `${I.P},${I.Q}` ? '3px solid var(--ink)' : 'none'; c.style.outlineOffset = '2px' })
  sync()
  return lab('「ならば」は約束：破られたのはどの場合？', { hint: 'P = 晴れる, Q = 遊園地に行く。「晴れたら遊園地に行くよ」' }, grid)
}

// --- Lab: CNF stepper (ex3.2) ---
function cnfLab() {
  const step = cnfStepper(parse('¬(P ∧ (Q ∨ R))'))
  const fi = formulaInput({ value: '¬(P ∧ (Q ∨ R))', examples: ['¬(P ∧ (Q ∨ R))', '(P ⊃ Q) ⊃ R', '¬(P ⊃ Q)', 'P ∨ (Q ∧ R)', '(P ∧ Q) ∨ (R ∧ S)'], onChange: (f) => f && step.load(f) })
  return lab('CNF 変換ステッパー：4 つの手順で変形', { hint: '▶ で 1 手ずつ。各行の右に使った規則' }, fi, h('hr', { style: { border: 0, borderTop: '2px dashed var(--rule)', margin: '18px 0' } }), step)
}

// --- Lab: resolution board (ex3.3) ---
function resLab() {
  const sets = [
    ['演習 3.3', [['P', 'Q', 'R'], ['¬P', 'R'], ['¬Q'], ['¬R']]],
    ['いちばん小さい例', [['P'], ['¬P']]],
    ['三段論法', [['¬P', 'Q'], ['¬Q', 'R'], ['P'], ['¬R']]],
    ['充足可能（⊥ に届かない）', [['P', 'Q'], ['¬P', 'Q'], ['¬Q', 'R']]],
  ]
  const board = resolutionBoard(sets[0][1])
  const pick = h('div.examples', '節集合：', sets.map(([n, c]) => h('button', { type: 'button', onclick: () => board.load(c) }, n)))
  return lab('導出ボード：2 つの節をぶつけて ⊥ を目指す', { hint: '節をクリックして 2 つ選ぶ' }, pick, h('div', { style: { height: '14px' } }), board)
}

// --- Lab: prove a tautology by refutation (full pipeline) ---
function pipelineLab() {
  const out = h('div')
  const premsBox = h('div')
  let prem = ['P ⊃ Q', 'Q ⊃ R'], goal = 'P ⊃ R'
  function run() {
    out.innerHTML = ''
    let fs, g
    try { fs = prem.filter((s) => s.trim()).map(parse); g = parse(goal) } catch { out.append(h('p.fin-msg.err', '式を確認してね')); return }
    const all = [], negFrom = []
    const lines = h('div.cnf-lines')
    fs.forEach((f, i) => {
      const c = toCNFSteps(f).clauses
      lines.append(h('div.cnf-line', h('span.eqs', `F${i + 1}`), h('span', { html: fxHTML(show(f)) }), h('span.why', { html: `節：<span class="fx">${c.map((x) => fxs(showClause(x))).join('　') || '（⊤：節なし）'}</span>` })))
      all.push(...c)
    })
    const nf = all.length
    const gc = toCNFSteps(Not(g)).clauses
    lines.append(h('div.cnf-line', { style: { background: 'var(--bot-l)' } }, h('span.eqs', '¬G'), h('span', { html: fxHTML(show(Not(g))) }), h('span.why', { html: `節：<span class="fx">${gc.map((x) => fxs(showClause(x))).join('　')}</span>` })))
    all.push(...gc)
    out.append(h('h5', { style: { margin: '0 0 6px', fontWeight: 900 } }, '① 前提と「結論の否定」を CNF にして節に分解'), lines,
      h('h5', { style: { margin: '18px 0 6px', fontWeight: 900 } }, '② 全部の節を 1 つの集合にして反駁（点線の枠 = ¬G から来た節）'),
      resolutionBoard(all, { negFrom: nf, onWin: () => toast(`⊥ が出た → ${prem.join(', ')} から ${goal} が言える！`) }))
  }
  const premField = h('input', { type: 'text', value: prem.join(' , '), style: { width: '100%', border: '2.5px solid var(--ink)', borderRadius: '16px', padding: '10px 14px', fontFamily: 'var(--f-fx)', fontSize: '18px', background: 'var(--paper)' } })
  const goalField = h('input', { type: 'text', value: goal, style: { width: '100%', border: '2.5px solid var(--ink)', borderRadius: '16px', padding: '10px 14px', fontFamily: 'var(--f-fx)', fontSize: '18px', background: 'var(--paper)' } })
  const norm = (s) => s.replace(/->/g, '⊃').replace(/&/g, '∧').replace(/\|/g, '∨').replace(/~/g, '¬')
  const go = h('button.btn.sm.yellow', { type: 'button', onclick: () => { prem = norm(premField.value).split(/[,，]/).map((s) => s.trim()); goal = norm(goalField.value); run() } }, '▶ この問題で反駁する')
  const presets = [[['P ⊃ Q', 'Q ⊃ R'], 'P ⊃ R', '推移律'], [['P ∨ Q', '¬P'], 'Q', '選言三段論法'], [['P ⊃ Q', '¬Q'], '¬P', '対偶的推論'], [['P ⊃ Q'], 'Q ⊃ P', '逆（成り立たない）']]
  premsBox.append(h('div.split', h('label', { style: { fontWeight: 900, fontSize: '13px' } }, '前提 F₁, …, Fₙ（カンマ区切り）', premField), h('label', { style: { fontWeight: 900, fontSize: '13px' } }, '結論 G', goalField)),
    h('div.ctrls', { style: { margin: '12px 0 18px' } }, go, h('div.examples', '例：', presets.map(([p, g, n]) => h('button', { type: 'button', onclick: () => { premField.value = p.join(' , '); goalField.value = g; go.click() } }, n)))))
  run()
  return lab('総仕上げ：F₁ ∧ … ∧ Fₙ ⊃ G を導出原理で示す', { badge: 'PIPELINE', hint: '前提 + 結論の否定 → 節集合 → ⊥' }, premsBox, out)
}

export default {
  no: 3, slug: 'lec03', date: '10/09', color: '#2ec486', colorL: '#d3f6e6',
  title: '命題論理 — 導出（融合）原理', sub: '「矛盾が出るまでぶつける」だけの証明法',
  tags: ['⊃ の意味', 'リテラル・節', 'CNF', '導出', '反駁', '健全性・完全性'],
  tinyFx: '(P ∨ C) , (¬P ∨ D)  ⟹  C ∨ D',
  summary: '論理式を節の集合に分解し、P と ¬P を打ち消し合わせて空節 ⊥ を目指す。機械でも実行できる、AI の推論の原点。',
  chapters: [
    {
      id: 'imp', title: '[[A ⊃ B]] の値から逆算する', en: 'Reading implication backwards',
      build(el) {
        el.append(
          talk(`R: 前回ひっかかった ⊃ です。P が ⊥ なら何でも ⊤、ってやっぱり変じゃないですか？
S: 「晴れたら遊園地に行くよ」って約束を想像して。約束を**破った**と言えるのはどんな時？
R: 晴れたのに…行かなかった時、だけ？
S[happy]: そう！ 雨の日にどうしようと、約束は破られてない。⊃ は「**破られていない**」を ⊤ と呼んでいるんだ。`),
          promiseLab(),
          talk(`S: これで演習 3.1 は逆算できる。[[A ⊃ B]]<sub>I</sub> = ⊥ なのは「約束やぶり」の 1 パターンだけだから…
R: [[A]]<sub>I</sub> = ⊤ かつ [[B]]<sub>I</sub> = ⊥ に決まる！
S: じゃあ [[A ⊃ B]]<sub>I</sub> = ⊤ のときの [[A]]<sub>I</sub> は？
R[think]: 残り 3 パターンで A は ⊤ も ⊥ もある…から、**一意には決まらない**。
S[happy]: 正解。「決まらない」も立派な答え。理由として ⊤ の例と ⊥ の例を両方挙げればいい。`),
          point('[[A ⊃ B]] = ⊥ になるのは <b>A = ⊤, B = ⊥ の 1 通りだけ</b>。だから ⊥ からは逆算できるが、⊤ からは A が決まらない。'),
        )
      },
    },
    {
      id: 'clause', title: 'リテラル・節・連言標準形', en: 'Literal, clause, CNF',
      build(el) {
        el.append(
          talk(`S: 導出原理は、論理式をまず**決まった形**にそろえてから使う。部品から覚えよう。
R: リテラル、節、CNF…名前が多い。
S: 入れ子の箱だと思って。いちばん小さい箱が**リテラル**（P か ¬P）。リテラルを ∨ でつないだのが**節**。節を ∧ でつないだのが **CNF**。
R: 「∨ の袋」を「∧ で束ねる」！
S[happy]: そのイメージ。だから CNF は「節の集合」{C₁, …, Cₖ}として書けるんだ。`),
          html(`<div class="split-3 reveal" style="margin:22px 0">
            <div class="panel" style="background:#fff"><h5>① リテラル literal</h5><div class="big-ans fx">${fxs('P　¬Q')}</div><p style="margin:0;font-size:13px;font-weight:700;color:var(--ink-2)">原子論理式 or その否定</p></div>
            <div class="panel" style="background:#fff"><h5>② 節 clause</h5><div class="big-ans fx">${fxs('P ∨ ¬Q ∨ R')}</div><p style="margin:0;font-size:13px;font-weight:700;color:var(--ink-2)">リテラルの ∨。順序・重複は無視。0 個なら<b>空節 ⊥</b></p></div>
            <div class="panel" style="background:#fff"><h5>③ CNF 連言標準形</h5><div class="big-ans fx" style="font-size:20px">${fxs('(P ∨ ¬Q) ∧ (¬P ∨ R)')}</div><p style="margin:0;font-size:13px;font-weight:700;color:var(--ink-2)">節の ∧ ＝ 節の集合 ${fxHTML('{P ∨ ¬Q, ¬P ∨ R}')}</p></div></div>`),
          talk(`R: 空節がなんで ⊥ なんですか？
S: 節は「どれか 1 つのリテラルが ⊤ なら ⊤」。リテラルが 1 つもなければ、⊤ にしようがない。だから**必ず ⊥**。
R: 誰も手を挙げられない多数決…！
S[happy]: うまい。そして**任意の論理式は同値な CNF に変換できる**。手順は 4 つだけ。`),
          defn('手順', 'CNF への変換', `<ol><li><b>⊃ を除去</b>（ルール 6：$α ⊃ β = ¬α ∨ β$）</li><li><b>¬ を内側へ</b>（ルール 4,5：二重否定・ド・モルガン）</li><li><b>分配則</b>（ルール 3：$α ∨ (β ∧ γ) = (α ∨ β) ∧ (α ∨ γ)$）</li><li><b>その他の規則</b>（⊤, ⊥ や重複の整理）</li></ol>`),
          cnfLab(),
          callout('warn', 'CNF では「∨ の中に ∧」があってはいけません。最後に分配則で <b>∧ を外へ</b>追い出すのがゴール。逆向き（∨ を外へ）にすると DNF（選言標準形）になってしまいます。'),
          point('CNF 変換は <b>⊃ 除去 → ¬ を内側 → 分配 → 整理</b> の順。答案には各行で使った規則名を書く。'),
        )
      },
    },
    {
      id: 'res', title: '導出：P と ¬P を打ち消す', en: 'Resolution',
      build(el) {
        el.append(
          talk(`S: いよいよ本題。$P ∨ C$ と $¬P ∨ D$ という 2 つの節があったら、$C ∨ D$ を導ける。これが**導出**。
R: P と ¬P が対消滅して、残りがくっつく感じ？
S: そう。なぜ正しいか、場合分けで考えてみて。P が ⊤ なら…
R[think]: 2 つ目の節で ¬P は ⊥ だから、D が ⊤ じゃなきゃいけない。P が ⊥ なら 1 つ目から C が ⊤。どっちにしても C か D は ⊤ … だから $C ∨ D$ ！
S[happy]: 完璧な説明。両方の節が ⊤ なら、導出節も必ず ⊤ になる。`),
          defn('定義', '導出（resolution）', `$C₁ = P ∨ C$, $C₂ = ¬P ∨ D$ のとき，$C₁, C₂$ から $C ∨ D$ を導く動作を<b>導出</b>という．$C ∨ D$ を<b>導出節</b>（resolvent），$C₁, C₂$ を<b>親節</b>（parent clause）という．`),
          talk(`R: で、空節 ⊥ が出てきたら？
S: 「全部の節が同時に ⊤」なら導出節もずっと ⊤ のはず。なのに必ず ⊥ の空節が出た → 最初から**全部同時に ⊤ にするのは無理**だった、つまり**充足不能**。これが**反駁**。`),
          resLab(),
          talk(`R: 演習 3.3、①と③で R ∨ P … じゃなくて P ∨ R、それと②で R、④とぶつけて ⊥！
S[happy]: 番号を振って「節 i と節 j から ○ について導出」と書くと、採点者に伝わりやすいよ。下に出る導出の木も、答案にそのまま描ける形。`),
          defn('定理', '導出の健全性・完全性', `<b>健全性</b>：節の集合 Δ から反駁で ⊥ が導出可能ならば，Δ は充足不能である．<br><b>完全性</b>：節の集合 Δ が充足不能ならば，Δ から反駁で ⊥ が導出可能である．`, { thm: true }),
          callout('tip', '健全性 =「⊥ が出たら本当に矛盾」（嘘をつかない）。完全性 =「矛盾なら必ず ⊥ が出せる」（見逃さない）。セットで「導出は充足不能性をちょうど判定できる」。'),
        )
      },
    },
    {
      id: 'apply', title: '導出原理で「定理」を証明する', en: 'Proving with refutation',
      build(el) {
        el.append(
          talk(`R: でも、矛盾を見つけて何がうれしいんですか？ 証明したいのは「正しいこと」なのに。
S: 第 2 回の鏡を思い出して。**A が恒真 ⇔ ¬A が充足不能**。だから「$F₁ ∧ … ∧ Fₙ ⊃ G$ が恒真」を示したいなら…
R[wow]: 否定した $F₁ ∧ … ∧ Fₙ ∧ ¬G$ が充足不能を示せばいい！ 背理法だ！
S[happy]: そう。前提を全部 CNF にして、**結論だけ否定して** CNF にして、節を全部まとめて ⊥ を目指す。`),
          defn('手順', '導出原理の問題への適用', `次の (1) と (2) は等価：<br>(1) $F₁ ∧ … ∧ Fₙ ⊃ G$ がトートロジである．<br>(2) $F₁, …, Fₙ, ¬G$ をそれぞれ CNF にし節集合 $C₁, …, Cₙ₊₁$ で表すとき，$C₁ ∪ … ∪ Cₙ₊₁$ から ⊥ が反駁によって導出可能である．`),
          pipelineLab(),
          point('<b>結論を否定して前提に加え、⊥ を導く</b>＝背理法の機械版。否定するのは結論 G だけ（前提は否定しない）。'),
        )
      },
    },
  ],
  exercises: [
    {
      no: '3.1', q: 'A, B を論理式とする．(1) [[A ⊃ B]]<sub>I</sub> = ⊥ のとき，[[A]]<sub>I</sub> の値を求めよ．(2) [[A ⊃ B]]<sub>I</sub> = ⊤ のとき，[[A]]<sub>I</sub> の値を求めよ．理由を説明すること．',
      hint: '真偽値割り当ての定義 (7)：[[A ⊃ B]] = ⊤ iff [[A]] = ⊥ or [[B]] = ⊤。この否定を考える。',
      answer: `(1) <b>[[A]]<sub>I</sub> = ⊤</b>。定義より [[A ⊃ B]]<sub>I</sub> = ⊤ iff ([[A]]<sub>I</sub> = ⊥ または [[B]]<sub>I</sub> = ⊤)。これが ⊥ なので「[[A]]<sub>I</sub> = ⊥ または [[B]]<sub>I</sub> = ⊤」が成り立たない、すなわち [[A]]<sub>I</sub> = ⊤ かつ [[B]]<sub>I</sub> = ⊥。<br>(2) <b>一意には定まらない</b>。[[A]]<sub>I</sub> = ⊥ のときは [[B]]<sub>I</sub> によらず [[A ⊃ B]]<sub>I</sub> = ⊤。[[A]]<sub>I</sub> = ⊤ のときも [[B]]<sub>I</sub> = ⊤ なら [[A ⊃ B]]<sub>I</sub> = ⊤。よって ⊤・⊥ のどちらもありうる。`,
    },
    {
      no: '3.2', q: '¬(P ∧ (Q ∨ R)) を連言標準形（CNF）に変換せよ．変換過程も示せ．',
      hint: '⊃ はないので (2) から。ド・モルガンを 2 回 → 分配則。上の CNF ステッパーで確認できます。',
      answer: `<span class="fx">${fxs('¬(P ∧ (Q ∨ R))')}</span><br>= <span class="fx">${fxs('¬P ∨ ¬(Q ∨ R)')}</span>（ド・モルガン）<br>= <span class="fx">${fxs('¬P ∨ (¬Q ∧ ¬R)')}</span>（ド・モルガン）<br>= <span class="fx">${fxs('(¬P ∨ ¬Q) ∧ (¬P ∨ ¬R)')}</span>（分配則）　節集合 {¬P ∨ ¬Q, ¬P ∨ ¬R}`,
    },
    {
      no: '3.3', q: 'P, Q, R を命題記号とする．節の集合 {P ∨ Q ∨ R, ¬P ∨ R, ¬Q, ¬R} に導出原理を適用し，この集合が充足不能であることを示せ．',
      hint: '①P∨Q∨R ②¬P∨R ③¬Q ④¬R と番号を振る。Q を消す → P を消す → R を消す。',
      answer: `① P ∨ Q ∨ R　② ¬P ∨ R　③ ¬Q　④ ¬R とする。<br>⑤ P ∨ R（①と③から Q について導出）<br>⑥ R（⑤と②から P について導出）<br>⑦ ⊥（⑥と④から R について導出）<br>空節 ⊥ が導出されたので、導出の健全性よりこの節集合は充足不能である。`,
    },
  ],
  quiz: [
    { q: '$P ∨ ¬Q$ と $Q ∨ R$ の導出節は？', opts: ['$P ∨ R$', '$P ∨ ¬Q ∨ R$', '$¬Q ∨ R$', '導出できない'], a: 0, why: 'Q と ¬Q が打ち消し合って、残りの P と R を ∨ でつなぐ → P ∨ R。' },
    { q: 'CNF でないのは？', opts: ['$P ∧ (Q ∨ ¬R)$', '$¬P ∨ Q$', '$P ∨ (Q ∧ R)$', '$¬P$'], a: 2, why: 'P ∨ (Q ∧ R) は ∨ の中に ∧ がある。分配して (P ∨ Q) ∧ (P ∨ R) にすれば CNF。¬P ∨ Q は節 1 つ、¬P はリテラル 1 つの節なので CNF だよ。', hint: '「∨ の中に ∧」を探そう。' },
    { q: '$P ∨ Q$ と $¬P ∨ ¬Q$ を導出すると？', opts: ['空節 ⊥ が出る', '$Q ∨ ¬Q$（役に立たない）', '導出できない'], a: 1, why: '一度に消せるのは 1 組だけ。P で導出すると Q ∨ ¬Q（トートロジ）になって ⊥ には近づかない。P と Q を同時に消して ⊥ にするのは誤り！', hint: '1 回の導出で打ち消せるリテラルは何組？' },
    { q: '「P ⊃ Q と P から Q」を導出原理で示すとき、節集合は？', opts: ['{¬P ∨ Q, P, Q}', '{¬P ∨ Q, P, ¬Q}', '{P ∨ ¬Q, ¬P, ¬Q}', '{¬P ∨ Q, ¬P, ¬Q}'], a: 1, why: '前提はそのまま（P ⊃ Q → ¬P ∨ Q、P）、結論 Q だけ否定して ¬Q。そこから Q → ⊥ と導けるね。' },
    { q: '節集合から ⊥ が導出できた。言えることは？', opts: ['充足可能', '充足不能', '恒真', '何も言えない'], a: 1, why: '導出の健全性：⊥ が導出できたら、その節集合は充足不能。' },
  ],
}
