import { h, html, talk, point, defn, lab, callout, rich, seg, esc } from '../lib/ui.js'
import { parseModal, evalLukasiewicz } from '../logic/modal.js'
import { toto } from '../lib/chars.js'

const F = (s) => `<span class="fx">${esc(s).replace(/¬/g, '<span class="o o-not">¬</span>').replace(/∧/g, '<span class="o o-and">∧</span>').replace(/∨/g, '<span class="o o-or">∨</span>').replace(/⊃/g, '<span class="o o-imp">⊃</span>')}</span>`

// ---------- Infographic: 排中律をめぐる 2 つの方向 ----------
function nonClassicalMapInfo() {
  return html(`<div class="info-card reveal ig-nclmap"><div class="ig-head"><span class="ig-tag">OVERVIEW</span><h4>古典論理から「非古典論理」へ広がる地図</h4></div>
  <div class="ncl-grid">
    <div class="ncl-card c1" style="--d:.08s"><span class="ncl-k">第12回</span><b>様相論理・時相論理</b><small>古典論理を<b>拡張</b>し、必然性 □・可能性 ◇（や時間軸）を導入する</small></div>
    <div class="ncl-card c2" style="--d:.2s"><span class="ncl-k">意味論的拡張</span><b>多値論理（Łukasiewicz）</b><small>真偽値を ⊤・⊥ の 2 値から 3 値（unknown）や [0, 1]（ファジィ）へ広げる → <b>P ∨ ¬P が恒真でなくなる</b></small></div>
    <div class="ncl-card c3" style="--d:.32s"><span class="ncl-k">構文論的制限</span><b>直観主義論理（Brouwer, Heyting）</b><small>シーケント右辺を<b>高々 1 個</b>に制限し、構成的な証明だけを認める → <b>P ∨ ¬P・¬¬P ⊃ P が証明不能</b></small></div>
    <div class="ncl-card c4" style="--d:.44s"><span class="ncl-k">構造規則の制限</span><b>BCK・適切さ・線形論理</b><small>contraction（複製）や weakening（使い捨て）を除き、仮定を<b>資源（リソース）</b>として扱う</small></div>
  </div></div>`)
}

// ---------- Lab 1: Łukasiewicz の 3 値論理 & [0,1] ファジィ論理チェッカー ----------
function manyValuedLab() {
  let mode = '3val' // '3val' | 'fuzzy'
  let pv = 0.5, qv = 0.5
  const ctrl = h('div.mv-ctrl')
  const out = h('div.mv-out')

  const FORMULAS = [
    ['P ∨ ¬P', '排中律（古典では恒真）'],
    ['¬¬P ⊃ P', '二重否定除去（Łukasiewicz でも恒真！）'],
    ['P ⊃ P', '同一律'],
    ['¬(P ∧ ¬P)', '無矛盾律の否定形（P = 0.5 だと…？）'],
    ['(P ⊃ Q) ⊃ (¬Q ⊃ ¬P)', '対偶'],
  ]

  const fmt3 = (v) => (v === 1 ? '<span class="tv t">⊤ (1)</span>' : v === 0 ? '<span class="tv f">⊥ (0)</span>' : '<span class="tv u">U (0.5)</span>')
  const fmtF = (v) => `<span class="mv-bar"><i style="width:${Math.round(v * 100)}%;background:${v === 1 ? 'var(--top)' : v === 0 ? 'var(--bot)' : 'var(--or)'}"></i><b>${v.toFixed(2)}</b></span>`

  function render() {
    ctrl.innerHTML = ''
    out.innerHTML = ''
    const modeSeg = seg([['3val', '3 値論理 {⊤, U, ⊥}'], ['fuzzy', '連続値 [0, 1]（fuzzy）']], mode, (m) => {
      mode = m
      if (mode === '3val') {
        pv = pv > 0.75 ? 1 : pv < 0.25 ? 0 : 0.5
        qv = qv > 0.75 ? 1 : qv < 0.25 ? 0 : 0.5
      }
      render()
    })

    if (mode === '3val') {
      const pick = (name, cur, set) => h('div.mv-pick', h('b', `${name} =`),
        ...[[1, '⊤ (1)'], [0.5, 'unknown (0.5)'], [0, '⊥ (0)']].map(([val, lbl]) => h('button', {
          type: 'button',
          class: cur === val ? 'on' : '',
          onclick: () => { set(val); render() },
        }, lbl)))
      ctrl.append(modeSeg, h('div.mv-picks', pick('P', pv, (v) => { pv = v }), pick('Q', qv, (v) => { qv = v })))
    } else {
      const slider = (name, cur, set) => h('label.mv-sl', h('b', `${name} = ${cur.toFixed(2)}`), h('input', {
        type: 'range', min: 0, max: 1, step: 0.05, value: cur,
        oninput: (e) => { set(+e.target.value); render() },
      }))
      ctrl.append(modeSeg, h('div.mv-picks', slider('P', pv, (v) => { pv = v }), slider('Q', qv, (v) => { qv = v })))
    }

    const env = { P: pv, Q: qv }
    const rows = FORMULAS.map(([src, note]) => {
      const val = evalLukasiewicz(parseModal(src), env)
      return h('tr', { class: val === 1 ? 't' : val === 0 ? 'f' : 'u' },
        h('td', { html: F(src) }),
        h('td', note),
        h('td', { html: mode === '3val' ? fmt3(val) : fmtF(val) }))
    })
    const lemVal = evalLukasiewicz(parseModal('P ∨ ¬P'), env)
    const dneVal = evalLukasiewicz(parseModal('¬¬P ⊃ P'), env)
    out.append(
      h('p.mv-rule-note', { html: 'Łukasiewicz の演算：<b>¬x = 1 − x</b>，<b>x ∧ y = min(x, y)</b>，<b>x ∨ y = max(x, y)</b>，<b>x ⊃ y = min(1, 1 − x + y)</b>' }),
      h('table.tbl.mv-tbl',
        h('thead', h('tr', h('th', '論理式'), h('th', 'ポイント'), h('th', '評価値'))),
        h('tbody', ...rows)),
      html(`<div class="verdict ${lemVal === 1 ? 'valid' : 'unsat'}">${toto(lemVal === 1 ? 'top' : 'bot')}<div>P = ${pv} のとき：排中律 P ∨ ¬P は <b>${lemVal}</b>、二重否定 ¬¬P ⊃ P は <b>${dneVal}</b><small>${lemVal < 1 ? 'unknown (0.5) があると max(0.5, 1 − 0.5) = 0.5 ＜ 1 となり、<b>P ∨ ¬P は恒真（つねに 1）ではなくなる</b>！ 一方 ¬¬P = 1 − (1 − P) = P なので <b>¬¬P ⊃ P はつねに 1（恒真）</b>のまま。' : 'P が 1 か 0 の両端のときは古典論理と一致します。P を unknown (0.5) に動かしてみよう！'}</small></div></div>`))
  }

  render()
  return lab('多値論理チェッカー：unknown (0.5) を入れると排中律はどうなる？', { badge: 'MANY-VALUED', hint: '講義ノート 3.2：¬¬P ⊃ P は恒真だが P ∨ ¬P は恒真でない' }, ctrl, out)
}

// ---------- Lab 2: 構造規則と「仮定＝回数つきの資源」シミュレータ ----------
function substructuralLab() {
  const SYSTEMS = [
    {
      id: 'lk', name: '古典論理 LK', c: true, w: true, rhsMany: true,
      usage: '何回使ってもよい（0 回でも 2 回以上でも OK）',
    },
    {
      id: 'int', name: '直観主義論理', c: true, w: true, rhsMany: false,
      usage: '何回使ってもよいが、シーケント右辺は高々 1 個（構成的）',
    },
    {
      id: 'bck', name: 'BCK 論理', c: false, w: true, rhsMany: false,
      usage: '各仮定を「高々 1 回」（0 回または 1 回）使えば導ける',
    },
    {
      id: 'rel', name: '適切さの論理', c: true, w: false, rhsMany: false,
      usage: '各仮定を「少なくとも 1 回」（1 回以上、使い捨て禁止）使えば導ける',
    },
    {
      id: 'lin', name: '線形論理', c: false, w: false, rhsMany: false,
      usage: '各仮定を「ちょうど 1 回」使えば導ける（余らせても複製してもダメ）',
    },
  ]

  const TESTS = [
    {
      seq: 'P → P',
      desc: '仮定 P をちょうど 1 回使って P を出す',
      check: () => [true, 'P をちょうど 1 回だけ使うので、すべての体系で証明可能。'],
    },
    {
      seq: 'P, Q → P',
      desc: '使わない仮定 Q がある（weakening が必要）',
      check: (s) => [s.w, s.w ? 'weakening（水増し）があるので、不要な Q を捨てて証明できる。' : '<b>weakening なし</b>：仮定 Q を 0 回しか使っていない（余っている）ため証明できない！'],
    },
    {
      seq: 'P, P ⊃ (P ⊃ Q) → Q',
      desc: '仮定 P を 2 回使う（contraction が必要）',
      check: (s) => [s.c, s.c ? 'contraction（複製）があるので、P を 2 回使って Q を導ける。' : '<b>contraction なし</b>：1 枚しかない資源 P を 2 回は使えないため証明できない！'],
    },
    {
      seq: '→ P ∨ ¬P',
      desc: '排中律（右辺に 2 つ並べて ¬右 で戻す操作が必要）',
      check: (s) => [s.rhsMany, s.rhsMany ? '古典 LK では → P, ¬P から (¬右) で P → P にでき、証明可能。' : '右辺が高々 1 個（または構造規則制限）のため、P と ¬P を右辺に同時には置けず<b>証明できない</b>。'],
    },
    {
      seq: '→ ¬¬P ⊃ P',
      desc: '二重否定の除去（背理法に相当）',
      check: (s) => [s.id === 'lk', s.id === 'lk' ? '古典 LK では ¬¬P → P から → P, ¬P（右辺 2 個！）を経由して証明可能。' : '講義ノート 3.3 / 3.4 の通り、直観主義論理や線形論理などでは <b>¬¬P ⊃ P は証明可能ではない</b>。'],
    },
  ]

  let cur = 'lin'
  const tabs = h('div.pv-tabs')
  const info = h('div.ss-info')
  const tblWrap = h('div.ss-tbl')

  function render() {
    tabs.innerHTML = ''
    info.innerHTML = ''
    tblWrap.innerHTML = ''
    const sys = SYSTEMS.find((x) => x.id === cur)
    SYSTEMS.forEach((s) => tabs.append(h('button', {
      type: 'button',
      class: s.id === cur ? 'on' : '',
      onclick: () => { cur = s.id; render() },
    }, s.name)))

    info.append(
      h('div.ss-badges',
        h('span.chip', { class: sys.c ? 'ok-c' : 'ng-c' }, `contraction（複製）：${sys.c ? 'あり ✓' : 'なし ✗'}`),
        h('span.chip', { class: sys.w ? 'ok-c' : 'ng-c' }, `weakening（破棄）：${sys.w ? 'あり ✓' : 'なし ✗'}`),
        h('span.chip', { class: sys.rhsMany ? 'ok-c' : 'ng-c' }, `右辺の式：${sys.rhsMany ? '複数個 OK' : '高々 1 個'}`)),
      h('p.ss-usage', { html: `<b>A₁, …, Aₘ → B の解釈：</b>${esc(sys.usage)}` }))

    tblWrap.append(h('table.tbl.ss-table',
      h('thead', h('tr', h('th', 'シーケント'), h('th', '特徴'), h('th', `${sys.name}で証明できる？`), h('th', '理由'))),
      h('tbody', ...TESTS.map((t) => {
        const [ok, why] = t.check(sys)
        return h('tr', { class: ok ? 't' : 'f' },
          h('td', h('span.fx', t.seq)),
          h('td', t.desc),
          h('td', h('b', { class: ok ? 'c-top' : 'c-bot' }, ok ? '⊢ 証明可能' : '⊬ 証明不能')),
          h('td', { html: why }))
      }))))
  }

  render()
  return lab('構造規則スイッチ：contraction と weakening を外すと何が変わる？', { badge: 'SUBSTRUCTURAL', hint: '100 円玉 1 枚（P）でジュースを 2 本買えないのが線形論理！' }, tabs, info, tblWrap)
}

export default {
  no: 13, slug: 'lec13', date: '12/18', color: '#e06d53', colorL: '#fde2db',
  title: '非古典論理，まとめ', sub: '「排中律 P ∨ ¬P は本当に正しい？」から広がる多値・直観主義・線形論理、そして全13回の総まとめ',
  tags: ['排中律への疑問', '構成主義', '多値論理・ファジィ', '直観主義論理', 'BCK・適切さ・線形論理', '全体のまとめ'],
  tinyFx: 'P ∨ ¬P  ?   A₁, …, Aₘ → B',
  summary: '排中律 P ∨ ¬P への疑問と構成主義を出発点に、多値論理（意味論的拡張）、直観主義論理（構文論的変更）、構造規則を除いた論理（BCK・適切さの論理・線形論理）を俯瞰し、講義全体を振り返る。',
  chapters: [
    {
      id: 'lem', title: '排中律 P ∨ ¬P ははたして正しいか？', en: 'Questioning the law of excluded middle',
      build(el) {
        el.append(
          talk(`R: 第 2 回からずっと、$P ∨ ¬P$（排中律）は「いつだって ⊤ の代表」として出てきましたよね。あれが正しくないことなんてあるんですか！？
S: 古典論理では Hilbert の公理系でも Gentzen の LK でも証明できて、完全性より恒真だよ。でも、**現実の文や数学の証明**に当てはめると「本当に今 ⊤ と言い切っていいの？」と首をかしげたくなる例があるんだ。`),
          nonClassicalMapInfo(),
          defn('3.1', '排中律への疑問と構成主義', `・<b>$P ∨ ¬P$（排中律）</b>：Hilbert の公理系・Gentzen の公理系ともに証明可能であり，それぞれの完全性により（古典論理では）恒真である．<br>
・<b>疑問が生じる例</b>：<br>
　1. <i>「hiro は明日の昼食にラーメンを食べる」</i> — いま真偽値が確定しているなら，ずっと前から未来が決まっていたことになる（偶然性に左右される未来の出来事）．<br>
　2. <i>「4 以上の全ての偶数は 2 個の素数の和で表すことができる」</i>（ゴールドバッハ予想） — 正しいとも正しくないともまだ証明されていないのに，$P ∨ ¬P$ が成り立つと言えるか？<br><br>
・<b>存在証明と背理法</b>：古典論理の存在証明では背理法（存在しないと仮定して矛盾を導く ← 排中律に基づく）をよく使うが，それでは<b>具体的な解のつくり方</b>を述べたことにならない．<br>
・<b>構成主義</b>：式そのものの証明を<b>直接具体的につくることができる場合のみ</b>，その式を証明可能と考える立場．`),
          callout('info', '<b>構成主義が証明可能と認めない有名な例（講義ノート 3.1）：</b><br>「$x^y = z$ を満たす実数 $x, y, z$ の中で，$x, y$ が無理数で $z$ が有理数であるものが存在する」<br><small>（古典的な証明：$a = \\sqrt{2}^{\\sqrt{2}}$ とおく。排中律より「$a$ は有理数」または「$a$ は無理数」。もし有理数なら $x=y=\\sqrt{2}, z=a$ が答え。もし無理数なら $x=a, y=\\sqrt{2}$ とすると $x^y = (\\sqrt{2}^{\\sqrt{2}})^{\\sqrt{2}} = (\\sqrt{2})^2 = 2$ で有理数！ —— どちらに転んでも存在は言えるのに、<b>結局どちらが本当の $(x, y)$ なのか具体的に決まっていない</b>！）</small>'),
          talk(`R[wow]: うわあ、$\\sqrt{2}^{\\sqrt{2}}$ の証明、たしかに「どっちかは知らないけど存在する」になってますね！
S[happy]: でしょ？ プログラムの世界だと「解が存在します（でも計算方法は知りません）」じゃ動かないよね。だから $P ∨ ¬P$ を無条件には認めない論理が研究されてきた。大きく分けて **意味論を広げる「多値論理」** と、**推論規則をしぼる「直観主義論理」** の 2 つのルートがあるよ。`),
          point('排中律 $P ∨ ¬P$ を認めないアプローチには、<b>多値論理（意味論的拡張）</b>と<b>直観主義論理（構文論的拡張／変更）</b>の 2 方向がある。'),
        )
      },
    },
    {
      id: 'many-int', title: '多値論理と直観主義論理', en: 'Many-valued & intuitionistic logics',
      build(el) {
        el.append(
          talk(`S: まず 1 つ目の**多値論理**。明日の昼食や未解決問題みたいに「今はまだ ⊤ とも ⊥ とも決まらない」なら、**第 3 の真偽値 unknown** を作っちゃえばいい、という発想。
R: 真偽値を 0 から 1 までの連続な数にしたのがファジィ論理（fuzzy logic）ですか？
S: そう！ Łukasiewicz（ウカシェヴィチ）の多値論理では、P が 0.5（unknown）のとき $P ∨ ¬P$ も 0.5 になって 1（真）にならない。でも面白いことに **$¬¬P ⊃ P$ は恒真のまま**なんだ。ラボで確かめてみて！`),
          defn('3.2', '多値論理 many-valued logic', `・<b>Łukasiewicz</b> らが創始．論理式の真偽値が <b>⊤ と ⊥ だけでない</b>論理．<br>
・真偽値が <b>0 から 1 の間</b>をとるもの（<b>fuzzy logic</b> に発展），真偽値が <b>⊤, ⊥, unknown</b> をとるものなどがある．<br>
・<b>$¬¬P ⊃ P$ は恒真</b>である（一方，$P ∨ ¬P$ は恒真ではない）．<br>
・回路の検証（不定値 X を含む 3 値シミュレーションなど）や専門家システムへ応用．`),
          manyValuedLab(),
          talk(`R: ほんとだ！ $P = 0.5$ のとき $¬¬P$ も $1 - (1 - 0.5) = 0.5$ に戻るから、$¬¬P ⊃ P$ はちゃんと 1 になるんですね。じゃあ**直観主義論理**のほうはどう変えるんですか？
S: 直観主義論理は LK のシーケント $A₁, …, Aₘ → B₁, …, Bₙ$ の**右辺に置ける論理式を高々 1 個（0 個か 1 個）に制限**する！
R[think]: えっ、それだけで排中律が証明できなくなるんですか？
S[happy]: 第 4 回で $→ P ∨ ¬P$ を証明したとき、最初に (∨右) で $→ P, ¬P$ って**右辺に 2 個並べた**でしょ？ 右辺が 1 個までだとそれができない！ 同じ理由で $→ ¬¬P ⊃ P$（背理法）もブロックされるんだ。`),
          defn('3.3', '直観主義論理 intuitionistic logic', `・<b>Brouwer, Heyting</b> による．排中律や背理法の無制限な使用を排除するように推論規則を変更した論理．<br>
・シーケントを <b>$A₁, …, Aₘ → B$（右側の論理式は高々 1 個）</b>の形に制限する．推論規則は LK と同じだが，出現する式が制限される．<br>
・式の証明において，<b>実際にそれが構成できるプロセスが示される場合のみ</b>，証明可能とする（例：$A ∨ B$ が証明できるなら $A$ の証明か $B$ の証明のどちらかが実際に得られる）．<br>
・意味論は<b>可能世界（Kripke モデル）</b>で与えられ，<b>完全性も成立</b>する．`),
          point('<b>多値論理</b>：真偽値を増やす（$¬¬P ⊃ P$ は恒真だが $P ∨ ¬P$ は非恒真）。<b>直観主義論理</b>：LK の右辺を<b>高々 1 個</b>に制限（構成的証明のみ、$P ∨ ¬P$ も $¬¬P ⊃ P$ も証明不能）。'),
        )
      },
    },
    {
      id: 'substruct', title: '構造に関する推論規則を除いた論理', en: 'Substructural & linear logics',
      build(el) {
        el.append(
          talk(`S: 最後はちょっと視点を変えて、LK の「裏方の規則」に注目しよう。シーケントの左辺にある仮定を**勝手に増やしたり（weakening）、同じ仮定を 2 つにコピーしたり（contraction）**する規則を**構造規則**という。
R: ふだんの数学だと、仮定を 2 回使っても、使わない仮定が混ざっていても誰も文句を言わないですよね。
S: 「真理」を扱うならそれでいい。でも仮定を**「100 円玉」や「メモリ上のデータ」みたいな資源（リソース）**だと思ったらどう？
R[wow]: 100 円玉を勝手にコピー（contraction）したら偽造だし、勝手に消滅（weakening）しても困る！
S[happy]: まさにそれ！ 構造規則を外すことで、「仮定を何回使ったか」を厳密に管理できる論理が生まれるんだ。`),
          defn('3.4', '構造に関する推論規則を除いた論理', `古典論理の体系 LK から構造に関する推論規則（contraction, weakening）のいくつかを除いた論理．シーケント <b>$A₁, …, Aₘ → B$</b> の解釈が次のように変わる：<br><br>
・<b>BCK 論理（contraction なし）</b>：$A₁, …, Aₘ$ のそれぞれを<b>高々 1 回</b>使えば $B$ が導かれる．<br>
・<b>適切さの論理（weakening なし）</b>：$A₁, …, Aₘ$ のそれぞれを（少なくとも 1 回、）何回使ってもよければ $B$ が導かれる（無関係な仮定で水増しできない）．<br>
・<b>線形論理（contraction, weakening ともになし）</b>：$A₁, …, Aₘ$ のそれぞれを<b>ちょうど 1 回</b>使えば $B$ が導かれる．<br>
　— 「P ならば Q」と「P ならば R」から「P ならば Q ∧ R（や Q ∨ R の複製を伴う推論）」を無制限には導けない（P が 1 回分しかないため）<br>
　— <b>$¬¬P ⊃ P$ は証明可能ではない</b><br>
　— <b>資源の利用</b>に対する記述や，<b>並行プロセスの動作記述</b>に応用される．`),
          substructuralLab(),
          point('<b>BCK 論理</b>＝contraction なし（高々 1 回）／ <b>適切さの論理</b>＝weakening なし（使い捨て不可）／ <b>線形論理</b>＝両方なし（<b>ちょうど 1 回</b>使う＝資源・並行プロセスの記述）。'),
        )
      },
    },
    {
      id: 'wrapup', title: '数理論理学 全体のまとめ', en: 'Course wrap-up',
      build(el) {
        el.append(
          talk(`R: 第 1 回の「集合と関係」から始まって、命題論理、1 階述語論理、そして非古典論理まで…全部つながってたんですね！
S[happy]: おつかれさま！ 最後に、この授業で一貫して追いかけてきた**いちばん大事な柱**を振り返ろう。どの論理でも、いつも **「構文論（記号の形と証明 ⊢）」** と **「意味論（モデルと真偽 ⊨）」** の 2 つの世界を作って、その橋渡しとして **健全性と完全性** を考えてきたんだ。`),
          html(`<div class="cmp-tab reveal"><table>
            <tr><th>体系</th><th>言語の特徴</th><th>意味論（⊨）</th><th>構文論・証明法（⊢）</th><th>健全性・完全性</th></tr>
            <tr><th>命題論理<br><small>第2〜5回</small></th><td>命題記号 P, Q<br>¬ ∧ ∨ ⊃</td><td>真理値割り当て I<br>（2ⁿ 行の真理値表）</td><td>CNF ＋ 導出原理（反駁）<br>シーケント計算 LK（Wang）</td><td>成立（決定可能）</td></tr>
            <tr><th>1階述語論理<br><small>第6〜9回</small></th><td>項（定数・変数・関数）<br>述語記号・量化記号 ∀ ∃</td><td>対象領域 D ＋ 解釈 I ＋ 付値 J<br>エルブラン解釈</td><td>Skolem 化 ＋ 単一化 ＋ 導出<br>LK + ∀∃ 規則（変数条件）</td><td>成立（半決定可能）</td></tr>
            <tr><th>様相・時相論理<br><small>第12回</small></th><td>様相記号 □（必然/いつも）<br>◇（可能/いつか）</td><td>Kripke 構造 (W, R, V)<br>可能世界と到達可能関係 R</td><td>LK ＋ 規則 (□) ＋ contraction</td><td>成立（R の性質 ⇄ 公理）</td></tr>
            <tr><th>その他の非古典論理<br><small>第13回</small></th><td>排中律や構造規則を再検討</td><td>多値 [0,1] / 3値（Łukasiewicz）<br>直観主義 Kripke モデル</td><td>右辺高々1個（直観主義）<br>contraction/weakening 除去（線形など）</td><td>用途（構成的証明・資源・回路検証）に応じ設計</td></tr>
          </table></div>`),
          talk(`R: 期末試験に向けて、特にどこを押さえておけばいいですか？
S: **第 1 部（命題論理）と第 2 部（1 階述語論理）**では、定義どおりの構文判定・意味論の評価・CNF と Skolem 化・単一化と導出・シーケント計算の証明図を自分の手で書けること。そして**第 3 部（非古典論理）**では、Kripke 構造での □・◇ の評価や様相シーケント規則 (□)、それから各非古典論理が「古典論理のどこを変えた論理か」を対比して説明できるようにしておこう！`),
          point('数理論理学の背骨：<b>言語（構文）を厳密に定義し、モデル（意味論 ⊨）と推論規則（構文論 ⊢）を与え、健全性（⊢ ⇒ ⊨）と完全性（⊨ ⇒ ⊢）で橋を架ける</b>。'),
        )
      },
    },
  ],
  exercises: [
    {
      no: '13.A',
      q: '（自習用）排中律 P ∨ ¬P を認めない代表的な論理を、「意味論的拡張」と「構文論的変更」のそれぞれの立場から 1 つずつ挙げ、どのように古典論理を変更しているか簡潔に説明せよ．',
      hint: '講義ノート 3.1〜3.3。意味論側は「真偽値の種類」、構文論側は「シーケントの右辺の個数」に注目。',
      answer: `・<b>意味論的拡張：多値論理</b>（Łukasiewicz など） — 真偽値を ⊤, ⊥ の 2 値だけでなく unknown を含む 3 値や 0 から 1 の間の実数値に拡張する（P が unknown / 0.5 のとき P ∨ ¬P は ⊤ にならない）．<br>
・<b>構文論的変更：直観主義論理</b>（Brouwer, Heyting） — シーケント計算 LK においてシーケントを $A₁, …, Aₘ → B$（右辺の論理式は高々 1 個）の形に制限し，構成的な証明が存在する式のみを証明可能とする．`,
    },
    {
      no: '13.B',
      q: '（自習用）古典論理の LK から構造規則を除いた「BCK 論理」「適切さの論理」「線形論理」について，それぞれどの構造規則を除いたか，またシーケント A₁, …, Aₘ → B がどのような意味になるかを答えよ．',
      hint: 'contraction（同じ仮定をまとめる＝逆向きに見ると複製）と weakening（仮定を増やす＝使い捨て）の 2 つ。',
      answer: `・<b>BCK 論理</b>：<b>contraction</b> を除いた論理．「$A₁, …, Aₘ$ のそれぞれを<b>高々 1 回</b>使えば $B$ が導かれる」．<br>
・<b>適切さの論理</b>：<b>weakening</b> を除いた論理．「$A₁, …, Aₘ$ のそれぞれを（少なくとも 1 回、）何回使ってもよければ $B$ が導かれる」．<br>
・<b>線形論理</b>：<b>contraction と weakening の両方</b>を除いた論理．「$A₁, …, Aₘ$ のそれぞれを<b>ちょうど 1 回</b>使えば $B$ が導かれる」（資源の利用や並行プロセス記述に応用）．`,
    },
  ],
  quiz: [
    { q: '式そのものの証明を直接具体的につくることができる場合のみ証明可能と考える立場を何というか？', opts: ['決定論', '構成主義', '形式主義', '二値原理'], a: 1, why: '講義ノート 3.1。背理法（排中律）による非構成的な存在証明を認めない立場。' },
    { q: 'Łukasiewicz の多値論理に関する記述として正しいものは？', opts: ['P ∨ ¬P は恒真だが ¬¬P ⊃ P は恒真でない', '¬¬P ⊃ P は恒真だが P ∨ ¬P は恒真でない', 'P ∨ ¬P も ¬¬P ⊃ P も恒真でない', '真偽値はつねに 2 個だけである'], a: 1, why: '講義ノート 3.2。真偽値が 0〜1 や {⊤, ⊥, unknown} をとり、P ∨ ¬P は恒真でなくなるが ¬¬P ⊃ P は恒真。' },
    { q: '直観主義論理のシーケント計算における制限はどれか？', opts: ['左辺の論理式を高々 1 個に制限する', '右辺の論理式を高々 1 個（A₁, …, Aₘ → B）に制限する', '含意 ⊃ の使用を禁止する', '初期シーケントを禁止する'], a: 1, why: '講義ノート 3.3。右辺を高々 1 個に制限することで排中律や背理法の無制限な使用を排除する。' },
    { q: '古典論理 LK から contraction のみを除いた論理はどれか？', opts: ['適切さの論理', '線形論理', 'BCK 論理', '時相論理'], a: 2, why: '講義ノート 3.4。BCK 論理は contraction なし（各仮定を高々 1 回使用）。' },
    { q: '線形論理において除かれている構造規則と、$A₁, …, Aₘ → B$ の解釈の組み合わせは？', opts: ['weakening のみなし ／ 少なくとも 1 回使う', 'contraction のみなし ／ 高々 1 回使う', 'contraction, weakening ともになし ／ それぞれをちょうど 1 回使えば B が導かれる', 'exchange のみなし ／ 順番どおりに使う'], a: 2, why: '講義ノート 3.4。contraction と weakening の両方を除き、仮定を「ちょうど 1 回消費する資源」として扱う。' },
    { q: '線形論理に関する記述として<b>誤っている</b>ものは？', opts: ['資源の利用に対する記述ができる', '並行プロセス動作記述に応用される', '¬¬P ⊃ P が証明可能である', 'contraction と weakening がともにない'], a: 2, why: '講義ノート 3.4 にある通り、線形論理では ¬¬P ⊃ P は証明可能ではない。' },
  ],
}
