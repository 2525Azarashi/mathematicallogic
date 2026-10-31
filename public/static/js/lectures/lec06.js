import { h, html, talk, point, defn, lab, callout, rich, tv, seg, confettiAt, toast, esc } from '../lib/ui.js'
import { folInput } from '../widgets/fol-input.js'
import { parseFol, folHTML, showFol, freeVars, boundVars, isClosed, occurrences, folSubformulas, subst, parseTerm, showTerm, signature, evalFol, evalTerm, searchModel, tuples, tryFol } from '../logic/fol.js'
import { toto } from '../lib/chars.js'

// 領域 D の要素（かわいく動物で）
const ANIMALS = ['🐰', '🐱', '🐻', '🐸']
const NAMES = ['うさぎ', 'ねこ', 'くま', 'かえる']
const el = (u) => `<span class="dm-e" title="${NAMES[u]}">${ANIMALS[u]}</span>`
const F = (s) => `<span class="fx fol">${folHTML(parseFol(s))}</span>`

// ---------- Infographic: anatomy of a FOL formula ----------
function folAnatomy() {
  const f = parseFol('∀x(P(x) ⊃ ∃y R(x, f(y)))')
  return html(`<div class="info-card reveal ig-folana"><div class="ig-head"><span class="ig-tag">ANATOMY</span><h4>述語論理の式は「3 階建て」</h4></div>
  <div class="fa-fx fx fol">${folHTML(f, { mark: true })}</div>
  <div class="fa-floors">
    <div class="fa-fl t3" style="--d:.1s"><b>論理式</b><span>⊤ ⊥ / 原子論理式 / ¬ ∧ ∨ ⊃ / <em>∀x ∃x</em></span><small>真偽値（⊤ / ⊥）になる</small></div>
    <div class="fa-fl t2" style="--d:.25s"><b>原子論理式</b><span class="fx fol">${folHTML(parseFol('R(x, f(y))'))}</span><small>述語記号 ＋ 項の並び</small></div>
    <div class="fa-fl t1" style="--d:.4s"><b>項</b><span class="fx fol"><span class="cn">a</span>　<span class="vr">x</span>　<span class="fn">f</span>(<span class="vr">y</span>)</span><small>「もの」＝ 領域 D の要素を指す</small></div>
  </div>
  <div class="fa-legend"><span class="lg pd">述語記号 P, Q, R</span><span class="lg fn">関数記号 f, g, h</span><span class="lg cn">定数 a, b, c</span><span class="lg vr">変数 x, y, z</span><span class="lg q">量化記号 ∀ ∃</span></div></div>`)
}
// ---------- Infographic: interpretation = 4 pieces ----------
function interpInfo() {
  const it = (n, t, d, ex, k) => `<div class="ip-it" style="--d:${k * 0.12}s"><span class="ip-n">${n}</span><b>${t}</b><span class="ip-ex">${ex}</span><small>${d}</small></div>`
  return html(`<div class="info-card reveal ig-interp"><div class="ig-head"><span class="ig-tag">INTERPRETATION</span><h4>解釈 I ＝ 世界をまるごと決める 4 点セット</h4></div>
  <div class="ip-grid">
    ${it('1', '対象領域 D', '空でない集合', `D = {${ANIMALS.slice(0, 3).join(', ')}}`, 0)}
    ${it('2', '定数記号 → D の要素', '名前を「もの」に', `I(a) = ${ANIMALS[0]}`, 1)}
    ${it('3', 'n 引数関数 → Dⁿ → D', '「もの」から「もの」へ', `I(f)(${ANIMALS[0]}) = ${ANIMALS[1]}`, 2)}
    ${it('4', 'n 引数述語 → Dⁿ → {⊤,⊥}', '「もの」の性質・関係', `I(P)(${ANIMALS[1]}) = <span class="tv t">⊤</span>`, 3)}
  </div>
  <div class="ip-plus"><span class="ip-j"><b>＋ 付値 J</b>：自由変数 → D の要素　<span class="fx">J(x) = ${ANIMALS[2]}</span></span><span class="ip-arrow">⟹</span><span class="ip-val"><b>[[A]]<sub>I,J</sub></b> ∈ {⊤, ⊥}</span></div></div>`)
}
// ---------- Infographic: ∀ = big ∧, ∃ = big ∨ ----------
function quantInfo() {
  return html(`<div class="info-card reveal ig-quant"><div class="ig-head"><span class="ig-tag">INTUITION</span><h4>D が有限なら … ∀ は「大きな ∧」、∃ は「大きな ∨」</h4></div>
  <div class="qi-row"><span class="qi-l fx fol">${folHTML(parseFol('∀x P(x)'))}</span><span class="qi-eq">≈</span><span class="qi-r">P(${ANIMALS[0]}) <b class="o o-and">∧</b> P(${ANIMALS[1]}) <b class="o o-and">∧</b> P(${ANIMALS[2]})</span><small>全員が ⊤ なら ⊤（1 匹でも ⊥ なら ⊥）</small></div>
  <div class="qi-row"><span class="qi-l fx fol">${folHTML(parseFol('∃x P(x)'))}</span><span class="qi-eq">≈</span><span class="qi-r">P(${ANIMALS[0]}) <b class="o o-or">∨</b> P(${ANIMALS[1]}) <b class="o o-or">∨</b> P(${ANIMALS[2]})</span><small>1 匹でも ⊤ なら ⊤</small></div>
  <p class="qi-note">⚠ D は無限でもよい（自然数全体など）。だから一般には真理値表が作れない ── 第 4 回でサカイが言っていたのはこのこと。</p></div>`)
}

// ---------- Lab 1: free / bound highlighter ----------
function bindLab() {
  const out = h('div.bind-out')
  const fi = folInput({
    value: '∀x(P(x) ⊃ Q(x, y)) ∧ R(x)',
    examples: ['∀x(P(x) ⊃ Q(x, y)) ∧ R(x)', '∀xP(x) ⊃ Q(x)', '∃x∀y R(x, y)', '∀x∃y R(x, f(y, z))', 'P(x, g(x, y))', '∀x(P(x) ∧ ∃x Q(x))'],
    onChange(f) {
      out.innerHTML = ''
      if (!f) return
      const fv = [...freeVars(f)], bv = [...boundVars(f)], oc = occurrences(f)
      const box = h('div.bind-fx.fx.fol', { html: folHTML(f, { mark: true }) })
      // hover a quantifier/bound var → highlight its scope
      box.addEventListener('pointerover', (e) => {
        const t = e.target.closest('[data-b]'); box.querySelectorAll('.hl').forEach((x) => x.classList.remove('hl'))
        if (t) box.querySelectorAll(`[data-b="${t.dataset.b}"]`).forEach((x) => x.classList.add('hl'))
      })
      box.addEventListener('pointerleave', () => box.querySelectorAll('.hl').forEach((x) => x.classList.remove('hl')))
      const closed = isClosed(f)
      out.append(box,
        h('div.bind-stats',
          h('div.bst.free', h('b', String(oc.free)), h('span', '自由な出現'), h('small', fv.length ? `自由変数 ${fv.join(', ')}` : '自由変数なし')),
          h('div.bst.bound', h('b', String(oc.bound)), h('span', '束縛された出現'), h('small', bv.length ? `束縛変数 ${bv.join(', ')}` : '束縛変数なし')),
          h('div.bst', { class: closed ? 'closed' : 'open' }, h('b', closed ? '✓' : '✗'), h('span', closed ? '閉じた論理式' : '閉じていない'), h('small', closed ? '自由変数を含まない' : `${fv.join(', ')} が自由`))),
        h('p.bind-tip', { html: '量化記号や変数にカーソル（スマホはタップ）を合わせると、その<b>スコープ</b>が光ります。' }))
      if (fv.some((v) => bv.includes(v))) out.append(callout('warn', `同じ <b>${fv.filter((v) => bv.includes(v)).join(', ')}</b> が、ある場所では束縛・別の場所では自由。「自由か束縛か」は<b>変数</b>ではなく<b>出現</b>ごとに決まる。`))
    },
  })
  return lab('自由変数・束縛変数ハイライター', { hint: 'ピンク = 自由な出現 / 水色 = 束縛された出現' }, fi, out)
}

// ---------- Lab 2: substitution A[t/x] ----------
function substLab() {
  let f = null, x = 'x', t = parseTerm('f(a)')
  const out = h('div.sub-out')
  const tIn = h('input.sub-t', { type: 'text', value: 'f(a)', 'aria-label': '代入する項 t', spellcheck: 'false' })
  const xSel = h('div.sub-x')
  function draw() {
    out.innerHTML = ''
    xSel.innerHTML = ''
    if (!f) return
    const fv = [...freeVars(f)]
    const cand = [...new Set([...fv, ...boundVars(f)])].sort()
    if (!cand.includes(x)) x = fv[0] || cand[0] || 'x'
    cand.forEach((v) => xSel.append(h('button', { type: 'button', class: v === x ? 'on' : '', onclick: () => { x = v; draw() } }, v, fv.includes(v) ? null : h('small', ' 束縛'))))
    let tt
    try { tt = parseTerm(tIn.value); t = tt; tIn.classList.remove('bad') } catch { tIn.classList.add('bad'); out.append(h('p.sub-err', '項として読めません（例: a, y, f(a), g(x, b)）')); return }
    const r = subst(f, { [x]: t })
    const same = showFol(r.f) === showFol(f)
    out.append(
      h('div.sub-row', h('span.sub-k', 'A'), h('span.fx.fol', { html: folHTML(f, { mark: true }) })),
      h('div.sub-arrow', h('span', { html: `${esc(x)} の<b>自由な出現</b>を <span class="fx">${esc(showTerm(t))}</span> に` })),
      h('div.sub-row.res', h('span.sub-k', `A[${showTerm(t)}/${x}]`), h('span.fx.fol', { html: folHTML(r.f) })))
    if (same) out.append(callout('tip', `${x} の自由な出現がないので、何も変わらない。<b>束縛された x は置きかえない</b>（∀x の x は「仮の名前」だから）。`))
    if (r.captured.length) out.append(callout('warn', `<b>変数の捕獲</b>：代入した項の中の <b>${r.captured.join(', ')}</b> が、量化記号 ∀${r.captured[0]} / ∃${r.captured[0]} に捕まって束縛されてしまった。意味が変わるので、先に束縛変数の名前をつけかえる（第 7 回の「変数名のつけかえ」）。`))
  }
  tIn.addEventListener('input', draw)
  const fi = folInput({
    value: 'P(x, g(x, y))',
    examples: ['P(x, g(x, y))', '∀y R(x, y) ∧ Q(x)', '∀x P(x) ∧ Q(x)', '∃y R(x, y)'],
    onChange(g) { f = g; draw() },
  })
  return lab('代入 A[t/x] — 自由な出現だけを置きかえる', { hint: 'ノートの例：P(x, g(x, y)) で x → f(a), y → a' }, fi,
    h('div.sub-ctrl', h('label', '置きかえる変数 x：', xSel), h('label', '項 t：', tIn)), out)
}

// ---------- Lab 3: finite model checker ----------
function modelLab() {
  // 初期値：R = 🐰→🐱→🐻→🐰（∀x∃y R は ⊤、∃y∀x R は ⊥ になる例）
  const st = { n: 3, c: {}, f: {}, P: { R: { '0,1': true, '1,2': true, '2,0': true } }, J: {} }
  let f = null
  const ui = h('div.mc-ui'), out = h('div.mc-out')
  const key = (args) => args.join(',')
  const getP = (name, args) => !!(st.P[name] || {})[key(args)]
  const getF = (name, args) => { const v = (st.f[name] || {})[key(args)]; return v == null || v >= st.n ? 0 : v }
  const I = () => ({ D: [...Array(st.n).keys()], c: Object.fromEntries(Object.entries(st.c).map(([k, v]) => [k, v % st.n])), f: new Proxy({}, { get: (_, n) => (...a) => getF(n, a) }), P: new Proxy({}, { get: (_, n) => (...a) => getP(n, a) }) })
  const elSel = (cur, set, label) => h('div.mc-els', { role: 'group', 'aria-label': label }, ...[...Array(st.n).keys()].map((u) => h('button', { type: 'button', class: (cur % st.n) === u ? 'on' : '', html: ANIMALS[u], title: NAMES[u], onclick: () => { set(u); render() } })))
  function render() {
    ui.innerHTML = ''; out.innerHTML = ''
    if (!f) return
    const sig = signature(f), fv = [...freeVars(f)]
    const bad = [...sig.preds].filter(([, k]) => k > 2).concat([...sig.fns].filter(([, k]) => k > 1))
    if (bad.length) { out.append(callout('warn', 'このラボで編集できるのは <b>述語は 2 引数まで・関数は 1 引数まで</b>。式を短くしてね。')); return }
    // D
    ui.append(h('div.mc-blk', h('h6', '① 対象領域 D'), seg([[1, '1'], [2, '2'], [3, '3'], [4, '4']], st.n, (v) => { st.n = +v; render() }), h('div.mc-d', { html: `D = { ${[...Array(st.n).keys()].map(el).join(', ')} }` })))
    // consts
    if (sig.consts.size) ui.append(h('div.mc-blk', h('h6', '② 定数記号'), ...[...sig.consts].map((c) => h('div.mc-line', h('span.fx', { html: `I(<span class="cn">${c}</span>) =` }), elSel(st.c[c] ?? 0, (u) => { st.c[c] = u }, `I(${c})`)))))
    // fns
    sig.fns.forEach((k, name) => {
      st.f[name] = st.f[name] || {}
      ui.append(h('div.mc-blk', h('h6', `③ 関数記号 ${name}（${k} 引数）`), ...[...Array(st.n).keys()].map((u) => h('div.mc-line', h('span.fx', { html: `I(<span class="fn">${name}</span>)(${el(u)}) =` }), elSel(getF(name, [u]), (v) => { st.f[name][key([u])] = v }, `${name}(${NAMES[u]})`)))))
    })
    // preds
    sig.preds.forEach((k, name) => {
      st.P[name] = st.P[name] || {}
      const tog = (args) => h('button.mc-cell', { type: 'button', class: getP(name, args) ? 't' : 'f', 'aria-label': `${name}(${args.map((a) => NAMES[a]).join(',')}) を切り替え`, html: getP(name, args) ? '⊤' : '⊥', onclick: () => { st.P[name][key(args)] = !getP(name, args); render() } })
      let body
      if (k === 0) body = h('div.mc-line', h('span.fx', { html: `I(<span class="pd">${name}</span>) =` }), tog([]))
      else if (k === 1) body = h('div.mc-row1', ...[...Array(st.n).keys()].map((u) => h('div.mc-c1', h('span', { html: el(u) }), tog([u]))))
      else {
        const tb = h('table.mc-tab', h('tr', h('th', { html: `<span class="pd">${name}</span>` }), ...[...Array(st.n).keys()].map((v) => h('th', { html: el(v) }))))
        ;[...Array(st.n).keys()].forEach((u) => tb.append(h('tr', h('th', { html: el(u) }), ...[...Array(st.n).keys()].map((v) => h('td', tog([u, v]))))))
        body = h('div', tb, h('small.mc-cap', '行 = 第 1 引数、列 = 第 2 引数'))
      }
      ui.append(h('div.mc-blk', h('h6', `④ 述語記号 ${name}（${k} 引数）`), body))
    })
    // J
    if (fv.length) ui.append(h('div.mc-blk.j', h('h6', '＋ 付値 J（自由変数）'), ...fv.map((x) => h('div.mc-line', h('span.fx', { html: `J(<span class="vr free">${x}</span>) =` }), elSel(st.J[x] ?? 0, (u) => { st.J[x] = u }, `J(${x})`)))))
    // evaluate
    const II = I(), J = Object.fromEntries(fv.map((x) => [x, (st.J[x] ?? 0) % st.n]))
    let val
    try { val = evalFol(f, II, J) } catch (e) { out.append(h('p.sub-err', e.message)); return }
    out.append(html(`<div class="verdict ${val ? 'valid' : 'unsat'}">${toto(val ? 'top' : 'bot')}<div>[[A]]<sub>I,J</sub> = ${val ? '⊤' : '⊥'}<small>${val ? (isClosed(f) ? 'この解釈 I は A のモデル。' : 'この I と J のもとで真。') : 'この I（と J）のもとで偽。'}</small></div></div>`))
    out.append(traceView(f, II, J))
  }
  // J[u/x] 展開の可視化（外側から 2 段）
  function traceView(f, I, J) {
    const wrap = h('div.mc-trace')
    const lvl = (f, J, depth) => {
      if (!(f.t === 'all' || f.t === 'ex') || depth > 1) return null
      const rows = I.D.map((u) => {
        const J2 = { ...J, [f.x]: u }
        const v = evalFol(f.a, I, J2)
        const inner = lvl(f.a, J2, depth + 1)
        return h('div.mt-r', { class: v ? 't' : 'f' }, h('span.mt-j', { html: `J[${el(u)}/${f.x}]` }), h('span.mt-v', { html: tv(v) }), inner ? h('div.mt-in', inner) : null)
      })
      const all = f.t === 'all'
      const res = all ? rows.every((r) => r.classList.contains('t')) : rows.some((r) => r.classList.contains('t'))
      return h('div.mt', h('div.mt-h', { html: `<span class="fx fol">${folHTML(f)}</span><em>${all ? '定義 (8)：<b>すべての</b> u で ⊤ か？' : '定義 (9)：<b>ある</b> u で ⊤ か？'}</em>${tv(res)}` }), ...rows)
    }
    let g = f
    // 外側が ¬ のときは 1 段もぐる
    while (g.t === 'not') g = g.a
    const t = lvl(g, J, 0)
    if (t) wrap.append(h('h6', '量化記号を 1 つずつ展開（J[u/x]：x だけ u に差しかえた付値）'), t)
    return wrap
  }
  const fi = folInput({
    value: '∀x∃y R(x, y)',
    examples: ['∀x∃y R(x, y)', '∃y∀x R(x, y)', '∀x(P(x) ⊃ Q(x))', '∃x(P(x) ∧ ¬Q(x))', 'P(a) ∧ ∀x(P(x) ⊃ P(f(x)))', 'R(x, a)'],
    onChange(g) { f = g; render() },
  })
  return lab('有限モデルチェッカー：解釈 I を作って [[A]] を計算', { badge: 'MODEL', hint: '⊤/⊥ のマスをタップして述語の解釈を変える' }, fi, h('div.mc-grid', ui, out))
}

// ---------- Lab 4: valid? satisfiable? search small models ----------
function classifyLab() {
  const out = h('div.cl-out')
  const fi = folInput({
    value: '∀x P(x) ⊃ ∃x P(x)',
    examples: ['∀x P(x) ⊃ ∃x P(x)', '∃x P(x) ⊃ ∀x P(x)', '∀x(P(x) ∨ ¬P(x))', '∃y∀x R(x, y) ⊃ ∀x∃y R(x, y)', '∀x∃y R(x, y) ⊃ ∃y∀x R(x, y)', '∃x P(x) ∧ ∀x ¬P(x)'],
    onChange(f) {
      out.innerHTML = ''
      if (!f) return
      const sat = searchModel(f, { want: true, maxSize: 3 })
      const cnt = searchModel(f, { want: false, maxSize: 3 })
      if (sat.skipped || cnt.skipped) { out.append(callout('warn', '組み合わせが多すぎて探しきれません。記号を減らしてね。')); return }
      const show = (r) => {
        const { I, J, n } = r.found
        const parts = [`D = {${[...Array(n).keys()].map(el).join(', ')}}`]
        Object.entries(I.c).forEach(([c, u]) => parts.push(`I(${c}) = ${el(u)}`))
        Object.entries(I.tables).forEach(([name, t]) => {
          if (t.fn) parts.push(`I(${name}): ${tuples(n, t.k).map((a, i) => `${a.map(el).join('')}↦${el(t.tab[i])}`).join(' ')}`)
          else { const yes = tuples(n, t.k).filter((_, i) => t.tab[i]); parts.push(`I(${name}) が ⊤ になるのは ${yes.length ? yes.map((a) => t.k ? `(${a.map(el).join(',')})` : '').join(' ') || '常に' : 'なし'}`) }
        })
        Object.entries(J).forEach(([x, u]) => parts.push(`J(${x}) = ${el(u)}`))
        return h('div.cl-model', { html: parts.join('<br>') })
      }
      let kind, txt
      if (!sat.found) { kind = 'unsat'; txt = ['充足不能（の可能性大）', '要素 3 個までのどの解釈でも ⊥。'] }
      else if (!cnt.found) { kind = 'valid'; txt = ['恒真（の可能性大）', '要素 3 個までのどの解釈・付値でも ⊤。'] }
      else { kind = 'sat'; txt = ['充足可能だが恒真ではない', '⊤ にする解釈も ⊥ にする解釈もある。'] }
      out.append(html(`<div class="verdict ${kind}">${toto(kind === 'unsat' ? 'bot' : 'top')}<div>${txt[0]}<small>${txt[1]}</small></div></div>`))
      const grid = h('div.cl-grid')
      if (sat.found) grid.append(h('div.cl-card.t', h('h6', '⊤ にする（モデル）'), show(sat)))
      if (cnt.found) grid.append(h('div.cl-card.f', h('h6', '⊥ にする（反例）'), show(cnt)))
      out.append(grid, h('p.cl-note', { html: '※ 探すのは要素 <b>3 個まで</b>の小さな世界だけ。反例が見つかれば「恒真でない」は<b>確定</b>。見つからなくても恒真の<b>証明にはならない</b>（D は無限かもしれない）。証明には第 7〜9 回の導出原理・シーケント計算を使う。' }))
    },
  })
  return lab('恒真？ 充足可能？ 小さな世界で反例さがし', { badge: 'SEARCH', hint: '要素 1〜3 個の解釈を総当たり' }, fi, out)
}

export default {
  no: 6, slug: 'lec06', date: '10/30', color: '#ff7a59', colorL: '#ffe4da',
  title: '一階述語論理 — 言語，構文論，意味論', sub: '「すべての」「ある」を記号にする。命題の中身（もの・性質・関係）まで見る論理',
  tags: ['項', '述語記号', '量化記号 ∀ ∃', '自由変数・束縛変数', '代入', '解釈・付値', 'モデル'],
  tinyFx: '∀x ∃y R(x, y)',
  summary: '命題論理では「P」としか書けなかった文を、「もの（項）」と「性質・関係（述語）」に分解し、∀（すべての）と ∃（ある）で量を表す。意味は領域 D・解釈 I・付値 J で決まる。',
  chapters: [
    {
      id: 'why', title: 'なぜ述語論理？ 命題論理の限界', en: 'Why first-order logic',
      build(el) {
        el.append(
          talk(`R: 第 2 部スタートですね。命題論理でけっこう何でも書けた気がするんですけど…。
S: じゃあ、有名な三段論法。「すべての人間は死ぬ」「ソクラテスは人間」⇒「ソクラテスは死ぬ」。命題論理で書いてみて。
R: えっと…P = 「すべての人間は死ぬ」、Q = 「ソクラテスは人間」、R = 「ソクラテスは死ぬ」で、$P ∧ Q ⊃ R$？
S: それ、トートロジ？
R[oops]: …違う。P = ⊤, Q = ⊤, R = ⊥ で偽になっちゃう。正しい推論なのに！
S[happy]: そう。命題論理は文を**丸ごと 1 つの記号**にするから、「人間」「死ぬ」「ソクラテス」という**中身**が見えない。中身まで分解するのが **1 階述語論理**（first-order logic）だよ。`),
          html(`<div class="split reveal" style="margin:22px 0">
            <div class="panel" style="background:var(--bot-l)"><h5>命題論理</h5><p style="margin:0;font-weight:700;font-size:14px"><span class="fx">P ∧ Q ⊃ R</span><br>中身が見えない → トートロジにならない</p></div>
            <div class="panel" style="background:var(--top-l)"><h5>1 階述語論理</h5><p style="margin:0;font-weight:700;font-size:14px">${F('∀x(Human(x) ⊃ Mortal(x)) ∧ Human(s) ⊃ Mortal(s)')}<br>「すべての x」まで書ける → 恒真！</p></div></div>`),
          talk(`R[wow]: Human(x) って、x を入れると ⊤/⊥ が決まる「穴あきの命題」みたい。
S: いい表現！ それが**述語**。そして $∀x$ は「すべての x について」、$∃x$ は「ある x について」。この 2 つが**量化記号**。
R: 「1 階」ってどういう意味ですか？
S: 量化できるのが「もの（個体）」だけ、という意味。「すべての述語 P について」とは書けない（それは 2 階）。`),
          point('命題論理：文を <b>1 つの記号</b>で表す。　1 階述語論理：文を <b>もの（項）＋ 性質・関係（述語）＋ 量（∀ ∃）</b>に分解する。'),
        )
      },
    },
    {
      id: 'lang', title: '言語：記号と優先順位', en: 'Language & precedence',
      build(el) {
        el.append(
          talk(`S: まず使う記号。命題論理の ¬ ∧ ∨ ⊃ に、**もの**を表す記号と**量化記号**が加わる。
R: 大文字・小文字で役割が違うんですね。`),
          defn('1.1', '言語（記号）', `(1) 記号<br>　(a) <b>定数（記号）</b>　a, b, c, …<br>　(b) <b>（個体）変数</b>　x, y, z, …<br>　(c) <b>（n 引数）関数記号</b>　f, g, h, …<br>　(d) <b>（n 引数）述語記号</b>　P, Q, R, …<br>(2) 論理記号　∧（論理積，かつ），∨（論理和，または），⊃（含意，ならば），¬（否定，でない）<br>(3) <b>量化記号</b>（限量子）（quantifier）　∀（全称記号，すべての），∃（存在記号，ある）`, { en: 'language' }),
          html(`<div class="sym-grid reveal">
            <div class="sym cn"><b>a</b><span>定数</span><small>特定の「もの」の名前<br>例：ソクラテス、0</small></div>
            <div class="sym vr"><b>x</b><span>変数</span><small>「もの」が入る穴<br>∀x, ∃x で縛れる</small></div>
            <div class="sym fn"><b>f( )</b><span>関数記号</span><small>もの → もの<br>例：父(x), x + 1</small></div>
            <div class="sym pd"><b>P( )</b><span>述語記号</span><small>もの → ⊤/⊥<br>例：人間(x), x &lt; y</small></div>
            <div class="sym q"><b>∀ ∃</b><span>量化記号</span><small>すべての / ある</small></div></div>`),
          talk(`R: f(x) と P(x)、見た目はそっくりなのに…。
S: **出てくるものが違う**。f(x) は「もの」（例：x の父）、P(x) は「⊤ か ⊥」（例：x は人間である）。だから f(x) は P の引数に入れられるけど、P(x) を f の引数には入れられない。
R: 「父(ソクラテス) は人間」はOK、「父(ソクラテスは人間)」は意味不明、か。`),
          defn('1.2', '記号の優先順位と結合性', `結合記号の優先順位　<b>⊃ ＜ ∨ ＜ ∧ ＜ ¬</b>（右ほど強い）　例：$¬P ∨ Q ⊃ P ∧ Q$ は $((¬P) ∨ Q) ⊃ (P ∧ Q)$<br>左優先　例：$P ∧ Q ∧ R$ は $(P ∧ Q) ∧ R$<br><b>量化記号は結合記号よりも優先順位が高い</b>　例：∀xP ⊃ Q は (∀xP) ⊃ Q の意味`),
          html(`<div class="prec-q reveal"><div class="pq-a"><span class="fx fol">${folHTML(parseFol('∀xP(x) ⊃ Q(x)'))}</span><em>＝</em><span class="fx fol">(${folHTML(parseFol('∀xP(x)'))}) ⊃ Q(x)</span><small>∀x が届くのは P(x) だけ。Q(x) の x は<b>自由</b></small></div>
            <div class="pq-b"><span class="fx fol">${folHTML(parseFol('∀x(P(x) ⊃ Q(x))'))}</span><small>括弧で包むと、∀x が全体に届く</small></div></div>`),
          callout('warn', '「∀x のあとの式全体」に効くと思いがちだけど、<b>∀x・∃x は ¬ と同じくらい強い</b>。範囲を広げたいときは必ず括弧 ∀x(…) で包もう。'),
        )
      },
    },
    {
      id: 'syntax', title: '構文論：項・原子論理式・論理式', en: 'Terms, atoms, formulas',
      build(el) {
        el.append(
          talk(`S: 命題論理では「論理式」だけを定義した。述語論理では**2 段階**。まず「もの」を表す**項**、次にそれを使って**論理式**。
R: 項 → 原子論理式 → 論理式、の 3 階建てですね。`),
          folAnatomy(),
          defn('定義', '項 term', `(1) 定数（記号）は項である．<br>(2) （個体）変数は項である．<br>(3) $t₁, …, tₙ$ が項，f が n 引数の関数記号の時，$f(t₁, …, tₙ)$ は項である．<br>(4) (1) から (3) を有限回適用させて得られるもののみが項である．<p class="note">（注：定数記号は 0 引数の関数記号と考えられる．）　BNF：<b>t ::= a | x | f(t, …, t)</b></p>`, { en: 'term' }),
          defn('定義', '原子論理式 atomic formula', `$t₁, …, tₙ$ が項，P が n 引数の述語記号の時，$P(t₁, …, tₙ)$ は<b>原子論理式</b>である．`, { en: 'atomic formula' }),
          defn('定義', '論理式 formula', `(1) ⊤, ⊥ は論理式である．<br>(2) 原子論理式は論理式である．<br>(3) A, B が論理式ならば $¬A$, $A ∧ B$, $A ∨ B$, $A ⊃ B$ は論理式である．<br>(4) P が論理式, x が変数ならば <b>∀xP, ∃xP</b> は論理式である．<br>(5) (1)〜(4) を有限回適用させて得られるもののみが論理式である．<p class="note">BNF：<b>A ::= P(t, …, t) | ¬A | A ∧ A | A ∨ A | A ⊃ A | ∀xA | ∃xA</b></p>`, { en: 'formula' }),
          talk(`R: 入力欄で、わざと変なのを書いてみます。$P(Q)$ は…「述語記号 Q は項の中には書けません」。
S[happy]: そう、述語の引数は**項**だけ。$x$ だけ書いても「項だけでは論理式になりません」って怒られるはず。
R: ∀a P(a) も駄目でした。「量化できるのは変数だけ」。
S: 定数 a は**特定の 1 つ**を指す名前だから、「すべての a」は意味をなさない。`),
          defn('定義', 'メタ変数，対象変数', `論理式を表す A, B, … のような変数を<b>メタ変数</b>，論理式に現れる x, y, … のような変数を<b>対象変数</b>または単に<b>変数</b>という．`),
          callout('tip', 'このサイトの入力ルール：<b>変数 = x, y, z（u, v, w も可）</b>、<b>定数 = それ以外の小文字</b>（a, b, c, s …）、<b>関数 = 小文字 + 括弧</b>、<b>述語 = 大文字</b>。∀ は <b>\\A</b>、∃ は <b>\\E</b> でも入力できます。'),
        )
      },
    },
    {
      id: 'bind', title: '自由変数と束縛変数・スコープ', en: 'Free & bound variables',
      build(el) {
        el.append(
          talk(`S: 述語論理でいちばん大事な構文の概念がこれ。$∀x(P(x) ⊃ Q(x, y))$ の x と y、何が違う？
R: x は ∀x に「縛られて」る。y は誰にも縛られてない…？
S: その通り。∀x の後ろで影響を受ける x が**束縛変数**、そうでない y が**自由変数**。∀x が影響する範囲を**スコープ**という。
R: 束縛された x って、名前を変えても意味は同じですよね？ $∀y(P(y) ⊃ …)$ みたいに。
S[happy]: 鋭い！ 束縛変数は「仮の名前」（Σ の添字 i と同じ）。でも自由変数 y は、外から J で値をもらう「本物の穴」なんだ。`),
          defn('定義', '束縛変数・自由変数・閉じた論理式・スコープ', `量化記号のあとに現れ限定されている変数を<b>束縛変数</b>（bound variable），束縛変数でない変数を<b>自由変数</b>（free variable）という．自由変数を含まない論理式を<b>閉じた論理式</b>（closed formula）という．束縛変数の影響がおよぶ部分論理式をその束縛変数の<b>スコープ</b>（scope）という．`),
          defn('定義', '変数の出現 / 自由な出現・束縛された出現', `論理式内で変数が現れている特定の場所のことをその変数の<b>出現</b>（occurrence）という．<br>変数の出現は，その変数につく量化記号の<b>スコープ内</b>に出現する場合，または，量化記号の<b>すぐ後</b>に出現する場合は，<b>束縛された出現</b>といい，そうでなければ<b>自由な出現</b>という．`),
          bindLab(),
          talk(`R: 例の $∀x(P(x) ⊃ Q(x, y)) ∧ R(x)$、最後の R(x) の x はピンク（自由）！ 同じ x なのに。
S: ∀x のスコープは括弧の中だけだからね。「x は自由変数か？」より「**この場所の x** は自由な出現か？」で考えるのが正確。
R: $∀x(P(x) ∧ ∃x Q(x))$ は？ Q(x) の x はどっちの量化記号に縛られてるんですか？
S: **一番内側（近い）**の ∃x。スコープの上でカーソルを動かすと、どっちに属してるか光るよ。`),
          point('<b>束縛</b>＝量化記号のスコープ内（または ∀x の x 自身）。<b>自由</b>＝それ以外。判定は<b>出現ごと</b>。自由変数がなければ<b>閉じた論理式</b>。'),
        )
      },
    },
    {
      id: 'subst', title: '代入 A[t] と部分論理式', en: 'Substitution & subformulas',
      build(el) {
        el.append(
          talk(`S: 自由変数は「穴」だから、項を差し込める。それが**代入**。
R: 束縛されてる x にも代入するんですか？
S: しない。**自由な出現だけ**。ノートの例でやってみよう。`),
          defn('記法', 'A[x₁, …, xₙ] と A[t₁, …, tₙ]', `自由変数 $x₁, …, xₙ$ を含む論理式 A を $A[x₁, …, xₙ]$ と表す．A における $x₁, …, xₙ$ のすべての出現をそれぞれ項 $t₁, …, tₙ$ におきかえて得られる式を $A[t₁, …, tₙ]$ と表す．<p class="note">例：A[x, y] を P(x, g(x, y)) とすると，A[f(a), a] は <b>P(f(a), g(f(a), a))</b>．</p>`),
          substLab(),
          talk(`R: $∃y R(x, y)$ の x に y を代入したら「変数の捕獲」って出ました。
S: $∃y R(y, y)$ になって、入れた y が ∃y に捕まっちゃった。「x と関係をもつ何かがいる」が「自分自身と関係をもつ何かがいる」に変わってしまう。
R[wow]: 意味が変わるのはまずい…。
S: だから代入の前に、束縛変数を別の名前（$∃z R(x, z)$）につけかえる。今は「捕獲に注意」だけ覚えておけば OK。`),
          defn('定義', '部分論理式 subformula', `A を 1 階述語論理の論理式とする．<br>(1) A 自身は A の部分論理式である．<br>(2) ¬B, B ∧ C, B ∨ C, B ⊃ C のいずれかが A の部分論理式のとき，B, C はいずれも A の部分論理式である．<br>(3) ∀xB または ∃xB が A の部分論理式のとき，B は A の部分論理式である．<br>(4) x を自由変数，t を項とし，A[x] が A の部分論理式のとき，<b>A[t] は A の部分論理式</b>である．`, { en: 'subformula' }),
          talk(`R: (4) が命題論理にはない！ $∀x P(x)$ の部分論理式に P(a) も P(f(a)) も入るってことですか？
S[happy]: そう。(3) で P(x) が部分論理式、(4) で x に何を入れても部分論理式。だから**無限個**になりうる。シーケント計算（第 9 回）で ∀ をほどくとき P(t) が出てくるのは、この定義とつながっているんだ。`),
          (() => { const f = parseFol('∀x(P(x) ⊃ ∃y R(x, y))'); const subs = folSubformulas(f); return h('div.subf.reveal', h('h6', { html: `${F('∀x(P(x) ⊃ ∃y R(x, y))')} の部分論理式（(1)〜(3) の分）` }), h('div.subf-l', ...subs.map((s, i) => h('span.fx.fol', { style: { '--d': `${i * 0.08}s` }, html: folHTML(s) }))), h('small', { html: '＋ (4) により P(a), P(f(a)), ∃y R(a, y), R(a, b) … など、x や y に項を代入したものすべて' })) })(),
        )
      },
    },
    {
      id: 'sem', title: '意味論：解釈・付値・真偽値', en: 'Interpretation & valuation',
      build(el) {
        el.append(
          talk(`R: 命題論理の解釈は「命題記号 → ⊤/⊥」でした。述語論理だと？
S: P(x) の真偽を決めるには、まず「x は何の話？」を決めないといけない。だから解釈は**世界そのもの**を作る作業になる。
R: 世界…！
S: 「どんな**もの**があるか（領域 D）」「a はどれか」「f はどう対応するか」「P はどれに対して ⊤ か」。この 4 点セットが**解釈 I**（構造ともいう）。`),
          interpInfo(),
          defn('定義', '解釈 interpretation', `以下のような，定数記号，関数記号，述語記号の領域 D 上での解釈を論理式の解釈という．<br>(1) <b>空でない</b>対象領域 D を定める．<br>(2) 論理式に出現する定数記号に D の要素を割り当てる．<br>(3) 論理式に出現する n 引数関数記号に $Dⁿ$ から D への写像を割り当てる．<br>(4) 論理式に出現する n 引数述語記号に $Dⁿ$ から {⊤, ⊥} への写像を割り当てる．<p class="note">1 階述語論理の場合，解釈は<b>構造</b>（structure）とも呼ばれる．</p>`, { en: 'interpretation' }),
          defn('定義', '付値 valuation', `解釈 I が定義されたとき，各変数に対象領域 D の要素を割り当てる関数を I のもとでの<b>付値</b>という．付値は論理式の中の<b>自由変数</b>を解釈するために用いる．`, { en: 'valuation' }),
          talk(`R: 解釈 I だけじゃ足りないんですか？
S: $R(x, a)$ を考えて。I で R と a が決まっても、x が誰かわからないと ⊤/⊥ が決まらない。自由変数の値を決めるのが**付値 J**。
R: 閉じた論理式なら J はいらない？
S[happy]: その通り。だから閉じた式は $[[A]]_I$ と J を省略して書く。`),
          defn('定義', '真偽値割り当て truth value assignment', `解釈 I と付値 J が与えられたとき，論理式 A の真偽値 [[A]]<sub>I,J</sub> を以下のように定義する．<br><b>[項の解釈]</b><br>(1) [[x]]<sub>I,J</sub> = J(x)　<span class="note-i">（定数 a は [[a]] = I(a)）</span><br>(2) [[f(t₁, …, tₙ)]]<sub>I,J</sub> = I(f)([[t₁]]<sub>I,J</sub>, …, [[tₙ]]<sub>I,J</sub>)<br><b>[論理式の解釈]</b><br>(3) [[P(t₁, …, tₙ)]]<sub>I,J</sub> = I(P)([[t₁]]<sub>I,J</sub>, …, [[tₙ]]<sub>I,J</sub>)<br>(4)〜(7) ¬, ∧, ∨, ⊃ は命題論理と同じ<br>(8) [[∀xA]]<sub>I,J</sub> = ⊤ iff <b>任意の</b> D の要素 u に対して [[A]]<sub>I,J[u/x]</sub> = ⊤<br>(9) [[∃xA]]<sub>I,J</sub> = ⊤ iff D の<b>ある</b>要素 u に対して [[A]]<sub>I,J[u/x]</sub> = ⊤<p class="note">ただし J[u/x](x) = u，J[u/x](y) = J(y)（y は x とは異なる変数）．</p>`, { en: 'truth value assignment' }),
          talk(`R: J[u/x] がよくわからないです…。
S: 「J をコピーして、**x のところだけ u に書きかえた**付値」。∀x A を調べるには、x に D の要素を 1 つずつ入れて A を調べる。そのとき「x 以外の変数はそのまま」にしたいから、こう書くんだ。
R: 下のラボの「J[🐰/x]」「J[🐱/x]」…の行がそれですね！`),
          quantInfo(),
          modelLab(),
          talk(`R[wow]: $∀x∃y R(x, y)$ は ⊤ なのに、$∃y∀x R(x, y)$ は ⊥ になった！ 量化記号の順番を入れかえただけなのに。
S[happy]: 「みんな**誰かしら**好きな相手がいる」と「**みんなに好かれている誰か**がいる」の違い。表の各行に ⊤ があれば前者、ある列が全部 ⊤ なら後者。
R: 表で見ると一発ですね。∀∃ は「各行に 1 つ」、∃∀ は「1 列まるごと」。`),
          point('<b>[[∀xA]]</b> ＝ x に D の要素を<b>全部</b>入れて A が ⊤ か（大きな ∧）。<b>[[∃xA]]</b> ＝ <b>1 つでも</b> ⊤ になる要素があるか（大きな ∨）。J[u/x] は「x だけ u に差しかえ」。'),
        )
      },
    },
    {
      id: 'valid', title: '充足可能・恒真・モデル', en: 'Satisfiability, validity & models',
      build(el) {
        el.append(
          talk(`S: 最後に、命題論理でおなじみの言葉を述語論理版に。違いは「どの解釈でも」が「**どの解釈 I とどの付値 J でも**」になるところ。
R: 解釈って無限にあるんですよね？ 全部調べられるんですか？
S: 無理。D は無限集合でもいいし、要素数も選び放題だから。だから「恒真」は計算で確かめるんじゃなく、**証明する**しかない。`),
          defn('定義', '充足可能・充足不能', `論理式 A がある解釈 I とある付値 J のもとで [[A]]<sub>I,J</sub> = ⊤ であるとき，A は<b>充足可能</b>（satisfiable）という．論理式 A は充足可能でないとき，<b>充足不能</b>（unsatisfiable）という．`),
          defn('定義', '恒真 valid', `論理式 A の<b>任意の解釈 I と任意の付値 J</b> のもとで [[A]]<sub>I,J</sub> = ⊤ であるとき，A は<b>恒真</b>といい，<b>⊨ A</b> と表記する．<p class="note">（1 階述語論理の場合は<b>トートロジとは言わない</b>．）</p>`, { en: 'valid' }),
          defn('定義', '論理的同値', `論理式 A, B に対して，任意の解釈 I と任意の付値 J のもとで [[A]]<sub>I,J</sub> = [[B]]<sub>I,J</sub> であるとき，A と B は<b>論理的に同値</b>であるという．`, { en: 'logically equivalent' }),
          classifyLab(),
          talk(`R: $∀x P(x) ⊃ ∃x P(x)$ は恒真っぽい。どうしてですか？
S: 解釈の定義 (1) を思い出して。D は**空でない**。だから全員が P なら、少なくとも 1 人は P。
R: $∃x P(x) ⊃ ∀x P(x)$ は反例が出ました。🐰 だけ P で 🐱 は P じゃない世界。
S[happy]: 「誰かが P なら全員 P」は明らかに変だよね。反例モデルを 1 つ示せば「恒真でない」の証明になる。`),
          defn('定理', '恒真性と全称閉包', `$x₁, …, xₙ$ を論理式 A に出現する自由変数とすると，以下は同値である．<br>(1) 論理式 A は恒真である．<br>(2) 論理式 $∀x₁ … ∀xₙ A$ は恒真である．<br>(3) 論理式 $¬(∀x₁ … ∀xₙ A)$ は充足不能である．`, { thm: true }),
          talk(`R: (1) と (2) が同じなのは、「どの J でも ⊤」＝「自由変数に何を入れても ⊤」＝「全部 ∀ で縛っても ⊤」だから？
S: そういうこと。そして (3) が**第 7〜8 回の導出原理**の出発点。「恒真を示したい ⇒ 否定が充足不能を示す」── 命題論理の反駁と同じ作戦だよ。`),
          defn('定義', 'モデル model', `$x₁, …, xₙ$ を論理式 A に出現する自由変数とすると，解釈 I に対して [[∀x₁ … ∀xₙ A]]<sub>I</sub> = ⊤ ならば I を A の<b>モデル</b>という．<p class="note">閉じた論理式に対しては，[[A]]<sub>I,J</sub> を [[A]]<sub>I</sub> と記述する．</p>`, { en: 'model' }),
          point('<b>恒真</b>：どの I・J でも ⊤（⊨ A。トートロジとは呼ばない）。<b>モデル</b>：A（の全称閉包）を ⊤ にする解釈。反例モデルが 1 つあれば恒真でない。'),
        )
      },
    },
  ],
  exercises: [
    {
      no: '6.A', q: '（自習用・公式演習ではありません）論理式 ∀x(P(x) ⊃ Q(x, y)) ∧ R(x) について，(1) 各変数の出現が自由か束縛かを答え，(2) 自由変数と束縛変数をすべて挙げ，(3) 閉じた論理式かどうかを答えよ．',
      hint: '∀x のスコープは括弧 (P(x) ⊃ Q(x, y)) の中だけ。最後の R(x) は ∧ の右側でスコープの外。',
      answer: `(1) ∀x の直後の x，P(x) の x，Q(x, y) の x は<b>束縛された出現</b>．Q(x, y) の y と R(x) の x は<b>自由な出現</b>．<br>(2) 自由変数：<b>x, y</b>　束縛変数：<b>x</b>（x は出現によって自由にも束縛にもなる）<br>(3) 自由変数を含むので<b>閉じた論理式ではない</b>．`,
    },
    {
      no: '6.B', q: '（自習用）D = {1, 2}，I(R) を「R(u, v) = ⊤ iff u ≠ v」とする解釈 I のもとで，∀x∃y R(x, y) と ∃y∀x R(x, y) の真偽値を，真偽値割り当ての定義 (8)(9) にしたがって求めよ．',
      hint: '∀x∃y：x = 1 のとき y = 2、x = 2 のとき y = 1 が見つかる？　∃y∀x：y = 1 のとき x = 1 で R(1,1) は？',
      answer: `<b>∀x∃y R(x, y) = ⊤</b>：(8) より任意の u ∈ D で [[∃y R(x, y)]]<sub>I,J[u/x]</sub> = ⊤ を示す．u = 1 のとき y = 2 で R(1, 2) = ⊤，u = 2 のとき y = 1 で R(2, 1) = ⊤．よって (9) よりどちらも ⊤．<br><b>∃y∀x R(x, y) = ⊥</b>：(9) より，ある v で [[∀x R(x, y)]]<sub>I,J[v/y]</sub> = ⊤ となる必要がある．v = 1 のとき x = 1 で R(1, 1) = ⊥，v = 2 のとき x = 2 で R(2, 2) = ⊥．よって (8) よりどちらも ⊥ で，全体は ⊥．`,
    },
  ],
  quiz: [
    { q: '$∀xP(x) ⊃ Q(x)$ の正しい読み方は？', opts: ['∀x(P(x) ⊃ Q(x))', '(∀xP(x)) ⊃ Q(x)', '∀x P(x ⊃ Q(x))', '構文エラー'], a: 1, why: '量化記号は結合記号より優先順位が高い。∀x が届くのは P(x) だけで、Q(x) の x は自由。' },
    { q: '項でないものはどれ？（a 定数, x 変数, f 関数記号, P 述語記号）', opts: ['a', 'f(x, a)', 'f(f(x))', 'P(x)'], a: 3, why: 'P(x) は原子論理式（⊤/⊥ になるもの）。項は「もの」を表す a, x, f(…) だけ。' },
    { q: '$∃y R(x, y) ∧ P(y)$ の自由変数は？', opts: ['x のみ', 'y のみ', 'x と y', 'なし'], a: 2, why: '∃y のスコープは R(x, y) まで（量化記号が強い）。x はどこでも自由、P(y) の y も自由。' },
    { q: 'P(x, g(x, y)) で x を f(a)、y を a に置きかえた結果は？', opts: ['P(f(a), g(x, a))', 'P(f(a), g(f(a), a))', 'P(a, g(a, f(a)))', 'P(f(a), g(f(a), y))'], a: 1, why: '「すべての出現」を置きかえる。g の中の x も f(a) になる（ノートの例そのもの）。' },
    { q: '解釈で n 引数の述語記号に割り当てるのは？', opts: ['D の要素', 'Dⁿ → D の写像', 'Dⁿ → {⊤, ⊥} の写像', '{⊤, ⊥}'], a: 2, why: '述語は「もの n 個」を受け取って ⊤/⊥ を返す。Dⁿ → D は関数記号の解釈。' },
    { q: '[[∃xA]]<sub>I,J</sub> = ⊤ となる条件は？', opts: ['任意の u ∈ D で [[A]]_{I,J[u/x]} = ⊤', 'ある u ∈ D で [[A]]_{I,J[u/x]} = ⊤', '[[A]]_{I,J} = ⊤', 'D が空でない'], a: 1, why: '定義 (9)。∃ は「ある要素で ⊤」＝大きな ∨。任意の u なら ∀（定義 (8)）。' },
    { q: '恒真ではないのはどれ？', opts: ['∀x P(x) ⊃ ∃x P(x)', '∀x(P(x) ∨ ¬P(x))', '∃x P(x) ⊃ ∀x P(x)', '∃y∀x R(x, y) ⊃ ∀x∃y R(x, y)'], a: 2, why: 'D = {🐰, 🐱}、P が 🐰 だけ ⊤ の解釈が反例。① は D が空でないので恒真。④ も恒真（逆向きは恒真でない）。', hint: '反例モデルを 1 つ作れるのはどれ？' },
    { q: '1 階述語論理で「任意の解釈・付値で ⊤」になる式を何と呼ぶ？', opts: ['トートロジ', '恒真', '充足可能', 'モデル'], a: 1, why: 'ノートの注：1 階述語論理の場合は「トートロジとは言わない」。恒真（valid）、⊨ A と書く。' },
  ],
}
