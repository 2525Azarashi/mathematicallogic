import { h, html, talk, point, defn, lab, callout, rich, tv, esc } from '../lib/ui.js'
import { parseModal, tryModal, modalHTML, showModal, evalModal, succs, frameProps, searchKripke, parseModalSeq, modalSeqHTML, proveModalSeq } from '../logic/modal.js'
import { toto } from '../lib/chars.js'

const M = (s) => `<span class="fx fol">${modalHTML(parseModal(s))}</span>`
const WNAMES = ['w₀', 'w₁', 'w₂']
const WPOS = [
  { x: 96, y: 120 },
  { x: 256, y: 58 },
  { x: 256, y: 182 },
]

// ---------- モーダル式入力バー ----------
function modalInput({ value = '', examples = [], sequent = false, onChange }) {
  const input = h('input', {
    type: 'text',
    value,
    spellcheck: 'false',
    autocomplete: 'off',
    'aria-label': sequent ? '様相シーケントを入力' : '様相論理式を入力',
    placeholder: sequent ? '例: □(P ⊃ Q), □P → □Q' : '例: □(P ⊃ Q) ⊃ (□P ⊃ □Q)',
  })
  const msg = h('div.fin-msg', { 'aria-live': 'polite' })
  const root = h('div.fin.fol-in')
  const keys = h('div.keys')
  const K = [['□', 'q'], ['◇', 'q'], ['¬', 'not'], ['∧', 'and'], ['∨', 'or'], ['⊃', 'imp'], ['(', ''], [')', ''], ['P', ''], ['Q', '']]
  if (sequent) K.push(['→', ''], [',', ''])
  const ins = (s) => {
    const a = input.selectionStart ?? input.value.length, b = input.selectionEnd ?? a
    const pad = /[∧∨⊃→]/.test(s) ? ` ${s} ` : s === ',' ? ', ' : s
    input.value = input.value.slice(0, a) + pad + input.value.slice(b)
    const p = a + pad.length
    input.focus(); input.setSelectionRange(p, p)
    update()
  }
  K.forEach(([s, c]) => keys.append(h('button', { type: 'button', class: c ? 'k-' + c : '', onclick: () => ins(s) }, s)))
  keys.append(h('button.k-txt', { type: 'button', onclick: () => { input.value = ''; update(); input.focus() } }, 'クリア'))

  function normalize() {
    const before = input.value
    let v = before
      .replace(/\[\]/g, '□').replace(/<>/g, '◇')
      .replace(/->/g, '⊃').replace(/&/g, '∧').replace(/\|/g, '∨').replace(/~/g, '¬')
    if (sequent) v = v.replace(/=>/g, '→').replace(/⊢/g, '→')
    if (v !== before) {
      const d = before.length - v.length
      const p = Math.max(0, (input.selectionStart || 0) - d)
      input.value = v; input.setSelectionRange(p, p)
    }
  }
  function update() {
    normalize()
    const src = input.value
    root.classList.remove('err', 'ok')
    if (!src.trim()) {
      msg.className = 'fin-msg'
      msg.innerHTML = '<span class="hint">□ は <b>[]</b>、◇ は <b>&lt;&gt;</b> でも入力できます</span>'
      onChange && onChange(null, src)
      return
    }
    let res
    if (sequent) {
      try { res = { ok: true, f: parseModalSeq(src) } } catch (err) { res = { ok: false, err } }
    } else res = tryModal(src)
    if (res.ok) {
      root.classList.add('ok'); msg.className = 'fin-msg ok'; msg.innerHTML = '✓ 正しい' + (sequent ? 'シーケント' : '命題様相論理式') + 'です'
      onChange && onChange(res.f, src)
    } else {
      root.classList.add('err'); msg.className = 'fin-msg err'
      msg.innerHTML = `✗ ${esc(res.err.message)}${res.err.hint ? ` <span class="hint">— ${esc(res.err.hint)}</span>` : ''}`
      onChange && onChange(null, src)
    }
  }
  input.addEventListener('input', update)
  const ex = examples.length ? h('div.examples', '例：', examples.map((s) => h('button', { type: 'button', onclick: () => { input.value = s; update() } }, s))) : null
  root.append(h('div.fin-row', h('div.fin-box', input)), keys, msg, ex)
  root.set = (v) => { input.value = v; update() }
  queueMicrotask(update)
  return root
}

// ---------- Infographic: 事実 vs 必然性 vs 可能性 ----------
function modalIntroInfo() {
  return html(`<div class="info-card reveal ig-modal3"><div class="ig-head"><span class="ig-tag">MODALITIES</span><h4>「成り立つ」を 3 段階に分ける</h4></div>
  <div class="md-tri">
    <div class="md-c m-fact" style="--d:.1s"><b>A</b><span>事実として成り立つ</span><small>「いま・この世界で」真</small></div>
    <div class="md-c m-nec" style="--d:.25s"><b><span class="o o-mod">□</span>A</b><span>必ず成り立つ（必然性）</span><small>行ける<b>すべての</b>可能世界で真</small></div>
    <div class="md-c m-pos" style="--d:.4s"><b><span class="o o-mod">◇</span>A</b><span>成り立つ可能性がある（可能性）</span><small>行ける<b>ある</b>可能世界で真</small></div>
  </div>
  <div class="md-readings">
    <span class="lg">様相のとり方でいろんな論理になる：</span>
    <span class="chip">必然 / 可能（様相論理）</span>
    <span class="chip">将来いつも / いつか（時相論理）</span>
    <span class="chip">知っている / 信じている（知識と信念の論理）</span>
  </div></div>`)
}

// ---------- Lab 1: Kripke 構造プレイグラウンド ----------
function kripkeLab() {
  // 初期状態：w0 -> w1, w0 -> w2; P は w1 のみ ⊤, Q は w1,w2 で ⊤
  const st = {
    R: new Set(['0,1', '0,2']),
    V: [{ P: true, Q: false }, { P: true, Q: true }, { P: false, Q: true }],
    curW: 0,
  }
  let f = null
  const svgWrap = h('div.kr-canvas')
  const ctrlWrap = h('div.kr-ctrl')
  const outWrap = h('div.kr-out')

  const makeS = () => ({ W: [0, 1, 2], R: st.R, V: st.V })

  const PRESETS = [
    ['基本（分岐）', ['0,1', '0,2'], [{ P: true, Q: false }, { P: true, Q: true }, { P: false, Q: true }]],
    ['反射的（wRw）', ['0,0', '1,1', '2,2', '0,1', '1,2'], [{ P: true, Q: true }, { P: true, Q: false }, { P: false, Q: false }]],
    ['行き止まり（w₀ から矢印なし）', ['1,2'], [{ P: false, Q: false }, { P: true, Q: true }, { P: true, Q: false }]],
    ['反射＋推移（線形時間）', ['0,0', '1,1', '2,2', '0,1', '1,2', '0,2'], [{ P: true, Q: false }, { P: true, Q: true }, { P: true, Q: false }]],
  ]

  function drawGraph(S, vals) {
    const edges = []
    for (let u = 0; u < 3; u++) for (let v = 0; v < 3; v++) {
      if (!st.R.has(`${u},${v}`)) continue
      if (u === v) {
        const p = WPOS[u]
        const dir = u === 0 ? -1 : 1
        const lx = p.x + dir * 24, ly = p.y - 26
        edges.push(`<path d="M ${p.x + dir * 6} ${p.y - 26} C ${lx - dir * 18} ${ly - 30}, ${lx + dir * 32} ${ly - 16}, ${p.x + dir * 26} ${p.y - 6}" fill="none" stroke="#2b2452" stroke-width="2.5" marker-end="url(#kr-ar)"/>`)
      } else {
        const a = WPOS[u], b = WPOS[v]
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy)
        const nx = -dy / len, ny = dx / len
        const bi = st.R.has(`${v},${u}`) ? 10 : 0
        const sx = a.x + (dx / len) * 30 + nx * bi, sy = a.y + (dy / len) * 30 + ny * bi
        const ex = b.x - (dx / len) * 34 + nx * bi, ey = b.y - (dy / len) * 34 + ny * bi
        const cx = (sx + ex) / 2 + nx * bi * 1.4, cy = (sy + ey) / 2 + ny * bi * 1.4
        edges.push(`<path d="M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}" fill="none" stroke="#2b2452" stroke-width="2.6" marker-end="url(#kr-ar)"/>`)
      }
    }
    const nodes = [0, 1, 2].map((w) => {
      const p = WPOS[w]
      const v = vals ? vals[w] : null
      const fill = v == null ? '#fff' : v ? '#d3f6e6' : '#ffe1e8'
      const sel = w === st.curW
      const pv = `P:${st.V[w].P ? '⊤' : '⊥'} Q:${st.V[w].Q ? '⊤' : '⊥'}`
      return `<g class="kr-node" data-w="${w}" style="cursor:pointer">
        ${sel ? `<circle cx="${p.x}" cy="${p.y}" r="35" fill="none" stroke="#ff7a59" stroke-width="3" stroke-dasharray="5 4"/>` : ''}
        <circle cx="${p.x}" cy="${p.y}" r="28" fill="${fill}" stroke="#2b2452" stroke-width="3"/>
        <text x="${p.x}" y="${p.y - 3}" text-anchor="middle" font-size="15" font-weight="900" fill="#2b2452">${WNAMES[w]}</text>
        <text x="${p.x}" y="${p.y + 14}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#5d5683">${pv}</text>
      </g>`
    }).join('')
    svgWrap.innerHTML = `<svg viewBox="0 0 360 240" class="kr-svg" aria-label="Kripke 構造の図">
      <defs><marker id="kr-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 9 5 L 0 9 z" fill="#2b2452"/></marker></defs>
      ${edges}${nodes}
    </svg>`
    svgWrap.querySelectorAll('.kr-node').forEach((g) => g.addEventListener('click', () => { st.curW = +g.dataset.w; render() }))
  }

  function render() {
    ctrlWrap.innerHTML = ''
    outWrap.innerHTML = ''
    const S = makeS()
    const vals = f ? [0, 1, 2].map((w) => evalModal(f, S, w)) : null
    drawGraph(S, vals)

    // V table + R matrix
    const vTbl = h('div.mc-blk', h('h6', '① 各可能世界での V(w, P), V(w, Q)（タップで切替）'),
      h('table.kr-vtbl',
        h('tr', h('th', '世界'), h('th', 'P'), h('th', 'Q'), h('th', '注目')),
        ...[0, 1, 2].map((w) => h('tr',
          h('td', h('b', WNAMES[w])),
          ...['P', 'Q'].map((p) => h('td', h('button.mc-cell', {
            type: 'button',
            class: st.V[w][p] ? 't' : 'f',
            html: st.V[w][p] ? '⊤' : '⊥',
            onclick: () => { st.V[w][p] = !st.V[w][p]; render() },
          }))),
          h('td', h('button.btn.sm', {
            type: 'button',
            class: st.curW === w ? 'primary' : '',
            onclick: () => { st.curW = w; render() },
          }, st.curW === w ? '★ 評価中' : '選ぶ'))))))

    const rMat = h('table.kr-rtbl',
      h('tr', h('th', 'w₁ R w₂'), ...[0, 1, 2].map((v) => h('th', WNAMES[v]))),
      ...[0, 1, 2].map((u) => h('tr',
        h('th', WNAMES[u]),
        ...[0, 1, 2].map((v) => {
          const on = st.R.has(`${u},${v}`)
          return h('td', h('button.kr-edge-btn', {
            type: 'button',
            class: on ? 'on' : '',
            onclick: () => { const k = `${u},${v}`; st.R.has(k) ? st.R.delete(k) : st.R.add(k); render() },
          }, on ? '→' : '・'))
        }))))
    const fp = frameProps(S)
    const rBlk = h('div.mc-blk', h('h6', '② 到達可能関係 R（行 w₁ から列 w₂ への矢印）'), rMat,
      h('div.kr-props',
        h('span.chip', { class: fp.refl ? 'ok-c' : '' }, `反射律：${fp.refl ? '満たす ✓' : '満たさない'}`),
        h('span.chip', { class: fp.trans ? 'ok-c' : '' }, `推移律：${fp.trans ? '満たす ✓' : '満たさない'}`)))

    ctrlWrap.append(vTbl, rBlk)

    if (!f) return
    const w = st.curW
    const val = vals[w]
    const sc = succs(S, w)
    let reason = ''
    if (f.t === 'box') {
      reason = sc.length
        ? `${WNAMES[w]} から到達可能な世界は {${sc.map((u) => WNAMES[u]).join(', ')}}。そこでの ${showModal(f.a)} の値は ${sc.map((u) => `${WNAMES[u]}:${evalModal(f.a, S, u) ? '⊤' : '⊥'}`).join('，')}。<b>すべて ⊤ なら ⊤</b>（定義 (6)）。`
        : `${WNAMES[w]} から到達可能な世界 w' が <b>1 つもない</b>（空虚に「任意の w' で成り立つ」が満たされる）ので <b>□ は自動的に ⊤</b>！`
    } else if (f.t === 'dia') {
      reason = sc.length
        ? `${WNAMES[w]} から到達可能な世界は {${sc.map((u) => WNAMES[u]).join(', ')}}。そこでの ${showModal(f.a)} の値は ${sc.map((u) => `${WNAMES[u]}:${evalModal(f.a, S, u) ? '⊤' : '⊥'}`).join('，')}。<b>1 つでも ⊤ があれば ⊤</b>（定義 (7)）。`
        : `${WNAMES[w]} から到達可能な世界が 1 つもないので、「成り立つ w' が存在する」は偽 → <b>◇ は ⊥</b>。`
    } else {
      reason = `各世界での値：${[0, 1, 2].map((u) => `${WNAMES[u]} で ${vals[u] ? '⊤' : '⊥'}`).join(' ／ ')}`
    }

    const cnt = searchKripke(f, { want: false, maxW: 3, frame: 'any' })
    outWrap.append(
      html(`<div class="verdict ${val ? 'valid' : 'unsat'}">${toto(val ? 'top' : 'bot')}<div>S, ${WNAMES[w]} ${val ? '⊨' : '⊭'} <span class="fx fol">${modalHTML(f)}</span>　（${WNAMES[w]} で <b>${val ? '真' : '偽'}</b>）<small>${reason}</small></div></div>`),
      h('div.kr-valid-bar', { html: cnt.skipped ? '' : !cnt.found
        ? `🌟 この式は<b>すべての Kripke 構造・すべての可能世界で真（恒真 ⊨ ${esc(showModal(f))}）</b>です！`
        : `💡 恒真ではありません（偽になる Kripke 構造と世界が存在します。例：□P ⊃ P は反射律がない世界で偽になる）。` }))
  }

  const pres = h('div.examples', 'フレーム例：', PRESETS.map(([name, edges, V]) => h('button', {
    type: 'button',
    onclick: () => { st.R = new Set(edges); st.V = V.map((o) => ({ ...o })); render() },
  }, name)))

  const fi = modalInput({
    value: '□Q ∧ ◇P',
    examples: ['□Q ∧ ◇P', '□P ⊃ P', '□(P ⊃ Q) ⊃ (□P ⊃ □Q)', '¬◇P ⊃ □¬P', '□¬P ⊃ ¬◇P', '◇(P ∨ Q) ⊃ ◇P ∨ ◇Q', '□P ⊃ □□P'],
    onChange(g) { f = g; render() },
  })
  return lab('Kripke 構造チェッカー：可能世界と矢印 R をさわって S, w ⊨ A を確かめる', { badge: 'KRIPKE', hint: '丸をクリックすると評価する世界 w が切り替わる' },
    fi, pres, h('div.kr-grid', h('div', svgWrap, outWrap), ctrlWrap))
}

// ---------- Lab 2: 様相シーケント計算 (□) 規則と証明図 ----------
function modalSeqTree(t) {
  const node = (n) => {
    const w = h('div.pf-node')
    if (n.kids && n.kids.length) {
      w.append(h('div.pf-prem', ...n.kids.map(node)), h('div.pf-bar', h('span.rl', { class: n.rule === '(□)' ? 'mod-rl' : '' }, n.rule)))
    } else {
      w.append(h('div.pf-mark.ok', '✓ 初期'))
    }
    w.append(h('div.pf-seq.fx.fol', { class: (!n.kids || !n.kids.length) ? 'axiom' : '', html: modalSeqHTML(n.seq) }))
    return w
  }
  return h('div.pf', node(t))
}

function modalSeqLab() {
  const out = h('div.msq-out')
  const fi = modalInput({
    sequent: true,
    value: '→ □(P ⊃ Q) ⊃ (□P ⊃ □Q)',
    examples: [
      '→ □(P ⊃ Q) ⊃ (□P ⊃ □Q)',
      '□P, □Q → □(P ∧ Q)',
      '→ ¬◇P ⊃ □¬P',
      '→ □¬P ⊃ ¬◇P',
      '→ □P ⊃ P',
      '→ P ⊃ □P',
    ],
    onChange(seq) {
      out.innerHTML = ''
      if (!seq) return
      const proof = proveModalSeq(seq)
      if (proof) {
        out.append(
          h('div.pf-scroll', modalSeqTree(proof)),
          html(`<div class="verdict valid">${toto('top')}<div>命題様相論理のシーケント体系で<b>証明可能（⊢）</b><small>完全性定理（1.6）より、すべての Kripke 構造のすべての世界で成り立つ<b>恒真（⊨）</b>なシーケントです。</small></div></div>`))
      } else {
        const eqFormula = seq.L.length
          ? { t: 'imp', a: seq.L.reduce((a, b) => ({ t: 'and', a, b })), b: seq.R.length ? seq.R.reduce((a, b) => ({ t: 'or', a, b })) : { t: 'bot' } }
          : (seq.R.length ? seq.R.reduce((a, b) => ({ t: 'or', a, b })) : { t: 'bot' })
        const cnt = searchKripke(eqFormula, { want: false, maxW: 3, frame: 'any' })
        let detail = '(□) 規則は「左辺が □A₁, …, □Aₘ、右辺が □B 1 個」の形にそろわないと使えません。'
        if (cnt.found) {
          const { S, w } = cnt.found
          const edges = [...S.R].map((e) => e.split(',').map((i) => WNAMES[i]).join('→')).join(', ') || 'なし'
          detail += `<br>実際、反例 Kripke 構造が存在します（W = {${S.W.map((i) => WNAMES[i]).join(', ')}}, R = {${edges}}, 世界 ${WNAMES[w]} で偽）。`
        }
        out.append(html(`<div class="verdict unsat">${toto('bot')}<div>この体系では<b>証明できません（⊬）</b><small>${detail}</small></div></div>`))
      }
    },
  })
  return lab('命題様相論理のシーケント証明チェッカー', { badge: 'SEQUENT (□)', hint: '□P ⊃ P がなぜ証明できないかも試してみよう' }, fi, out)
}

// ---------- Lab 3: 命題線形時相論理タイムライン ----------
function temporalLab() {
  const N = 5
  const P = [true, true, false, true, false]
  const Q = [false, false, true, true, true]
  let curT = 0
  const tlWrap = h('div.tm-wrap')
  const outWrap = h('div.tm-out')

  const S = () => ({
    W: [0, 1, 2, 3, 4],
    // 反射律 (t ≤ t) かつ 推移律 (t1 ≤ t2 ≤ t3 => t1 ≤ t3) を満たす線形離散時間
    R: (u, v) => u <= v,
    V: (w, name) => (name === 'P' ? P[w] : Q[w]),
  })

  const FORMULAS = [
    ['P', '現在 P が成り立つ'],
    ['□P', '（現在を含む）将来いつも P が成り立つ'],
    ['◇P', '（現在を含む）将来いつかは P が成り立つ'],
    ['□◇P', 'どの時点から見ても、その先にまた P が来る（無限にしばしば）'],
    ['◇□Q', 'いつか Q になり、そこから先はずっと Q のまま（やがて安定）'],
    ['□(P ⊃ ◇Q)', 'P が起きたら、必ずその時か将来いつかは Q が起きる（応答性）'],
  ]

  function render() {
    tlWrap.innerHTML = ''
    outWrap.innerHTML = ''
    const nodes = h('div.tm-line')
    for (let t = 0; t < N; t++) {
      const future = t >= curT
      nodes.append(h('div.tm-step', { class: (t === curT ? 'now ' : '') + (future ? 'reach' : 'past') },
        h('button.tm-head', { type: 'button', onclick: () => { curT = t; render() } },
          h('small', t === curT ? 'NOW' : future ? '将来' : '過去'),
          h('b', `t${t}`)),
        h('div.tm-pqs',
          h('button.mc-cell', { type: 'button', class: P[t] ? 't' : 'f', onclick: () => { P[t] = !P[t]; render() } }, `P:${P[t] ? '⊤' : '⊥'}`),
          h('button.mc-cell', { type: 'button', class: Q[t] ? 't' : 'f', onclick: () => { Q[t] = !Q[t]; render() } }, `Q:${Q[t] ? '⊤' : '⊥'}`))))
    }
    tlWrap.append(nodes, h('small.mc-cap', { html: `現在時刻 <b>t${curT}</b> から到達可能な状態（反射律＋推移律：t${curT} R t' ⇔ t${curT} ≤ t'）を水色で表示しています。P / Q ボタンで各時刻の状態を切り替えられます。` }))

    const K = S()
    const rows = FORMULAS.map(([src, desc]) => {
      const ast = parseModal(src)
      const v = evalModal(ast, K, curT)
      return h('tr', { class: v ? 't' : 'f' },
        h('td', { html: M(src) }),
        h('td', desc),
        h('td', { html: tv(v) }))
    })
    outWrap.append(h('table.tbl.tm-tbl',
      h('thead', h('tr', h('th', '時相論理式'), h('th', '線形時間での直観的な意味'), h('th', `t${curT} での真偽`))),
      h('tbody', ...rows)))
  }
  render()
  return lab('線形離散時間のシミュレータ：□＝「将来いつも」・◇＝「将来いつか」', { badge: 'TEMPORAL', hint: 't₀〜t₄ をクリックして「現在時刻」を動かそう' }, tlWrap, outWrap)
}

export default {
  no: 12, slug: 'lec12', date: '12/11', color: '#00a896', colorL: '#d4f5ef',
  title: '命題様相論理，時相論理', sub: '「たまたま真」と「必然的に真」を分ける。可能世界と時間軸の上で論理を動かす',
  tags: ['必然性 □・可能性 ◇', 'Kripke フレーム', '可能世界・到達可能関係', 'Kripke 構造', '様相シーケント (□)', '時相論理・反射律・推移律'],
  tinyFx: 'S, w ⊨ □A  ⇔  ∀w\'(wRw\' ⇒ S, w\' ⊨ A)',
  summary: '第3部「非古典論理」の前半。必然性 □ と可能性 ◇ を導入し、可能世界 W と到達可能関係 R からなる Kripke モデルで意味を与える。R を時間軸（反射的かつ推移的）とみなす命題線形時相論理まで学ぶ。',
  chapters: [
    {
      id: 'modal', title: '命題様相論理：必然性 □ と可能性 ◇', en: 'Propositional modal logic',
      build(el) {
        el.append(
          talk(`R: 第 3 部「非古典論理」に入りました！ これまでの命題論理や述語論理が「古典論理」だったんですね。
S: そう。古典論理では、文は単に「成り立つ（⊤）」か「成り立たない（⊥）」の 2 択だった。でも日常や科学では、**「たまたま事実として正しいこと」**と**「必然的に正しいこと」**を区別したい場面がたくさんある。
R: たとえば「今日は晴れている」と「1 + 1 = 2 である」みたいな違いですか？
S[happy]: まさにそれ！ 両方とも今は ⊤ だけど、「今日は晴れ」は雨だった可能性もある。この違いを表すために **□（必然性）**と **◇（可能性）**という 2 つの**様相記号**を足したのが**命題様相論理**だよ。`),
          modalIntroInfo(),
          defn('1.1 / 1.2', '命題様相論理の言語と論理式', `<b>(1) 命題記号</b> $P, Q, R, …$　<b>(2) 論理記号</b> ∧, ∨, ⊃, ¬　<b>(3) 様相記号</b> <b>□</b>（必然性），<b>◇</b>（可能性）<br><br>
<b>[定義] 原子論理式（素式）</b>：命題記号 $P, Q, R, …$ は原子論理式である．<br>
<b>[定義] 論理式</b>：<br>
(1) 原子論理式は論理式である．<br>
(2) A, B が論理式ならば $¬A, A ∧ B, A ∨ B, A ⊃ B$ は論理式である．<br>
(3) A が論理式ならば <b>□A, ◇A</b> は論理式である．<br>
(4) (1)〜(3) を有限回適用させて得られるもののみが論理式である．<p class="note">BNF 記法：<b>A ::= P | ¬A | A ∧ A | A ∨ A | A ⊃ A | □A | ◇A</b></p>`, { en: 'formula' }),
          defn('1.3', '記号の優先順位と結合性', `様相演算子（<b>□，◇</b>）は否定（<b>¬</b>）と同等の結合力をもつ．（∧, ∨ よりも強い．）<br>例：${M('□P ∧ Q')} は <b>(□P) ∧ Q</b> の意味．`),
          point('<b>A</b>：A が成り立つ ／ <b>□A</b>：A は必ず成り立つ（必然性） ／ <b>◇A</b>：A は成り立つ可能性がある（可能性）。□ と ◇ の結合力は <b>¬ と同じ強さ</b>。'),
        )
      },
    },
    {
      id: 'kripke', title: 'Kripke モデルと可能世界意味論', en: 'Kripke semantics',
      build(el) {
        el.append(
          talk(`R: □A の真偽って、真理値表で決められるんですか？ A = ⊤ のとき □A は…？
S: いい質問！「晴れている（P = ⊤）」は必然じゃないけど、「P ∨ ¬P（= ⊤）」は必然だよね。つまり **いまの世界の ⊤/⊥ だけでは □A の真偽は決まらない**。
R[wow]: 真理値表が書けない！ じゃあどうやって意味を決めるんですか？
S[happy]: Kripke（クリプキ）が考えた**可能世界意味論**を使う。「もしかしたらありえた別の世界」をいくつも並べて、矢印 $R$ で「どの世界からどの世界が考えられるか」をつなぐんだ。`),
          defn('1.4.1', 'Kripke フレーム Kripke frame', `空でない集合 W と W 上の 2 項関係 $R ⊆ W × W$ の対 <b>(W, R)</b> を様相論理に対する <b>Kripke フレーム</b>という．<br>W および R をそれぞれこの Kripke フレームの<b>可能世界</b>（possible world）の集合，<b>到達可能関係</b>（accessibility relation）という．$⟨w₁, w₂⟩ ∈ R$ のとき，$w₂$ は $w₁$ から<b>到達可能</b>であるといい，<b>w₁Rw₂</b> と記述する．`, { en: 'Kripke frame' }),
          defn('1.4.2', 'Kripke 構造と真偽値割り当て', `<b>[定義] Kripke 構造</b>：(W, R) を Kripke フレーム，V を各命題変数に対して W の各要素 w における真偽値割り当てを行う関数とするとき，<b>S = (W, R, V)</b> を <b>Kripke 構造</b>という．<br>$V(w, P)$ は命題変数 P の $w ∈ W$ における真偽値を表す．<b>S, w ⊨ A</b> は w の上で A が真，<b>S, w ⊭ A</b> は偽を表す．<br><br>
<b>[定義] 真偽値割り当て</b>：<br>
(1) A が命題記号のとき：$V(w, A) = ⊤$ iff $S, w ⊨ A$<br>
(2)〜(5) ¬, ∧, ∨, ⊃ はその世界 w での古典論理と同じ（例：$S, w ⊨ ¬A$ iff $S, w ⊨ A$ でない）<br>
(6) <b>wRw' となる任意の w' ∈ W に対して S, w' ⊨ A</b> が成り立つとき，そしてそのときに限り <b>S, w ⊨ □A</b><br>
(7) <b>wRw' となる w' ∈ W で S, w' ⊨ A が成り立つものが存在する</b>とき，そしてそのときに限り <b>S, w ⊨ ◇A</b>`, { en: 'Kripke structure' }),
          defn('定義', 'モデル・充足可能・充足不能・恒真', `<b>充足可能・モデル</b>：論理式 A に対し，Kripke 構造 $S = (W, R, V)$ と $w ∈ W$ が存在して $S, w ⊨ A$ が成り立つとき，A は<b>充足可能</b>といい，S は A の<b>モデル</b>という．充足可能でないとき<b>充足不能</b>という．<br>
<b>恒真（valid）</b>：<b>任意の Kripke 構造 S = (W, R, V) および任意の w ∈ W</b> に対して $S, w ⊨ A$ が成り立つとき，A は<b>恒真</b>といい，<b>⊨ A</b> と表記する．`, { en: 'valid' }),
          kripkeLab(),
          talk(`R: ラボで「行き止まり（w₀ から矢印なし）」を選んだら、P が偽でも $□P$ が ⊤ になりました！？
S: そこ、テストでも超重要！ 定義 (6) は「$w₀Rw'$ となる**任意の** $w'$ について $S, w' ⊨ P$」。行ける先 $w'$ が 0 個なら、「反例になる $w'$ が存在しない」から空虚に真（⊤）になる。逆に $◇P$ は「そういう $w'$ が**存在する**」だから ⊥ になる。
R: 1 階述語論理の ∀ と ∃ にそっくりですね！
S[happy]: 大正解！ □ は「到達可能な世界についての ∀」、◇ は「到達可能な世界についての ∃」なんだ。だから 1.5 のド・モルガンみたいな同値式もそのまま成り立つよ。`),
          defn('1.5', '論理的同値な式の例', `<span class="fx fol">${modalHTML(parseModal('¬◇A'))} = ${modalHTML(parseModal('□¬A'))}</span>　（「A が成り立つ可能性はない」＝「必ず A でない」）`),
          point('<b>S, w ⊨ □A</b> ⇔ w から行ける<b>すべての</b> w\' で A が真。<b>S, w ⊨ ◇A</b> ⇔ w から行ける<b>ある</b> w\' で A が真。<b>¬◇A = □¬A</b>。'),
        )
      },
    },
    {
      id: 'seq', title: '命題様相論理のシーケント計算と完全性', en: 'Modal sequent calculus',
      build(el) {
        el.append(
          talk(`R: すべての Kripke 構造を調べるのは、述語論理と同じで無限にあって無理ですよね。証明図で書けるんですか？
S: 書けるよ！ 古典命題論理のシーケント計算 LK に、**たった 1 つの様相規則 (□)** と構造規則（contraction など）を足すだけで、基本的な命題様相論理の**健全かつ完全**な体系になる。`),
          defn('1.6', '命題様相論理のシーケントと推論規則', `（古典）命題論理の体系に以下の推論規則を追加する．<br><br>
<div class="frac-rule"><span>(□)</span><div class="fr-top"><span>A₁, …, Aₘ → B</span></div><div class="fr-bar"></div><div>□A₁, …, □Aₘ → □B</div></div>
<div class="frac-rule"><span>(contraction 左)</span><div class="fr-top"><span>A, A, Γ → Δ</span></div><div class="fr-bar"></div><div>A, Γ → Δ</div></div>
<div class="frac-rule"><span>(contraction 右)</span><div class="fr-top"><span>Γ → Δ, A, A</span></div><div class="fr-bar"></div><div>Γ → Δ, A</div></div>`, { en: 'modal sequent rules' }),
          defn('定理', '命題様相論理の健全性・完全性', `命題様相論理のシーケントの体系は<b>健全かつ完全</b>である．すなわち，任意の命題様相論理式 A に対して，<b>⊢ A ならば ⊨ A</b> であり（健全性），<b>⊨ A ならば ⊢ A</b> である（完全性）．`, { thm: true }),
          modalSeqLab(),
          talk(`R: $→ □(P ⊃ Q) ⊃ (□P ⊃ □Q)$ はきれいに証明できました！ ⊃右 を 2 回使って $□(P ⊃ Q), □P → □Q$ にしてから、(□) で一斉に □ を剥がすんですね。
S: そう！ (□) 規則のポイントは、結論の左辺が **□ がついた式だけ**、右辺が **□B 1 個だけ** のときにまとめて □ を外せること（m = 0、つまり左辺が空の $→ B$ から $→ □B$ を導くのも OK）。
R[think]: でも $→ □P ⊃ P$ は証明できませんでした。「必然的に P なら P」って正しそうなのに…。
S[happy]: いいところに気づいた！ Kripke フレームで自分自身への矢印 $wRw$（**反射律**）がないと、行ける先では全部 P なのに「いまここ $w$」では P じゃない、ということが起きる。逆に言えば、R にどんな性質を仮定するかで成り立つ式が変わるんだ。それが次の**時相論理**につながるよ。`),
          point('規則 <b>(□)</b>：$A₁, …, Aₘ → B$ から $□A₁, …, □Aₘ → □B$ を導く。この体系で <b>⊢ A ⇔ ⊨ A</b>（健全性・完全性）。'),
        )
      },
    },
    {
      id: 'temporal', title: '時相論理：時間軸の上の □ と ◇', en: 'Temporal logic',
      build(el) {
        el.append(
          talk(`S: 様相論理の Kripke フレーム $(W, R)$ で、$W$ を「**各時刻におけるシステムの状態**」、$R$ を「**時間の流れ（時間軸）**」と読みかえてみよう。これが**時相論理**（temporal logic）。
R: プログラムやシステムの検証に使われるっていうやつですか？
S: そう！「エラー状態には**将来けっして**入らない（$□¬Error$）」とか、「リクエストを送ったら**いつかは必ず**応答が返る（$□(Req ⊃ ◇Ack)$）」をそのまま論理式で書ける。`),
          defn('2', '時相論理 temporal logic', `・古典論理に<b>時間の概念</b>を陽にとりいれた様相論理の一種．プログラムやシステムの動作についての記述・推論に応用される．<br>
・Kripke フレームにおける <b>W は各時間における状態</b>，<b>R を時間軸</b>と考える．<br>
・時間のとり方によってさまざまな体系がある：<br>
　— <b>線形時間</b>をとったもの ／ <b>分岐時間</b>をとったもの<br>
　— <b>未来にむけて一方向</b>にのびる時間 ／ <b>未来と過去の双方向</b>の時間<br>
　— <b>離散時間</b>をとったもの ／ <b>時間幅</b>を単位としてとったもの`),
          defn('2.1', '命題線形時相論理', `一方向にのびる線形離散時間をとったもの．到達可能関係 R は<b>反射律</b>（reflexivity）かつ<b>推移律</b>（transitivity）を満たす．<br>
・<b>反射律</b>：任意の $w₁$ に対して <b>w₁Rw₁</b> が成り立つ．（「現在」も到達可能）<br>
・<b>推移律</b>：任意の $w₁, w₂, w₃$ に対して <b>w₁Rw₂ かつ w₂Rw₃ ならば w₁Rw₃</b> が成り立つ．（将来の将来も将来）<br><br>
<b>直観的な意味</b>（P を論理式とする）：<br>
・<b>P</b>：P が成り立つ<br>
・<b>□P</b>：<b>（現在を含む）将来いつも</b> P が成り立つ<br>
・<b>◇P</b>：<b>（現在を含む）将来いつかは</b> P が成り立つ`, { en: 'linear temporal logic' }),
          temporalLab(),
          talk(`R[wow]: 反射律（$w₁Rw₁$）があるから、「将来いつも（□P）」の中に**現在も含まれる**んですね！
S[happy]: その通り！ だから線形時相論理では、さっきは成り立たなかった $□P ⊃ P$（将来いつも P なら今も P）や、推移律による $□P ⊃ □□P$ がちゃんと成り立つようになる。フレームの性質と論理式の法則がピタッと対応するのが様相論理の美しいところなんだ。`),
          point('<b>命題線形時相論理</b>：R は<b>反射律</b>（$w₁Rw₁$）と<b>推移律</b>（$w₁Rw₂ ∧ w₂Rw₃ ⇒ w₁Rw₃$）を満たす。<b>□P ＝ 現在を含む将来いつも P</b>、<b>◇P ＝ 現在を含む将来いつかは P</b>。'),
        )
      },
    },
  ],
  exercises: [
    {
      no: '12.A',
      q: '（自習用）任意の Kripke 構造 S = (W, R, V) と任意の w ∈ W に対して，S, w ⊨ ¬◇A と S, w ⊨ □¬A が同値である（¬◇A = □¬A）ことを，真偽値割り当ての定義 (2)(6)(7) から示せ．',
      hint: 'S, w ⊨ ¬◇A から出発し、定義 (2) → 定義 (7) →「存在しない ⇔ すべてについて〜でない」→ 定義 (2) → 定義 (6) の順に同値変形する。',
      answer: `任意の Kripke 構造 $S = (W, R, V)$ と任意の $w ∈ W$ をとる．<br>
1. $S, w ⊨ ¬◇A$ ⇔（定義 (2)）$S, w ⊨ ◇A$ が成り立たない<br>
2. ⇔（定義 (7)）$wRw'$ かつ $S, w' ⊨ A$ となる $w' ∈ W$ が存在しない<br>
3. ⇔ $wRw'$ となる任意の $w' ∈ W$ に対して，$S, w' ⊨ A$ が成り立たない<br>
4. ⇔（定義 (2)）$wRw'$ となる任意の $w' ∈ W$ に対して，$S, w' ⊨ ¬A$ が成り立つ<br>
5. ⇔（定義 (6)）$S, w ⊨ □¬A$．<br>
よって $¬◇A = □¬A$（論理的同値）である．∎`,
    },
    {
      no: '12.B',
      q: '（自習用）命題様相論理のシーケント計算で → □(P ⊃ Q) ⊃ (□P ⊃ □Q) の証明図を書け．',
      hint: '下から上へ：(⊃右) を 2 回使って左辺に □(P ⊃ Q) と □P、右辺に □Q を集め、そこで規則 (□) を適用すると命題論理のシーケント P ⊃ Q, P → Q になる。',
      answer: () => h('div',
        h('div.pf-scroll', modalSeqTree(proveModalSeq(parseModalSeq('→ □(P ⊃ Q) ⊃ (□P ⊃ □Q)')))),
        h('p', { style: { margin: '8px 0 0', fontSize: '13.5px', fontWeight: 700 } }, '葉 Q, P → Q と P → Q, P はどちらも初期シーケントなので証明可能。')),
    },
    {
      no: '12.C',
      q: '（自習用）論理式 □P ⊃ P は（R に条件を課さない一般の）命題様相論理で恒真か？ 恒真でなければ反例となる Kripke 構造 S = (W, R, V) と世界 w を 1 つ挙げよ．また R が反射律を満たす場合はどうか．',
      hint: 'w₀ で P が偽、しかも w₀ から到達可能な世界では P が真（または到達可能な世界が 1 つもない）構造を作ってみよう。',
      answer: `<b>一般には恒真ではない．</b><br>
<b>反例：</b>$W = \\{w₀, w₁\\}$，$R = \\{⟨w₀, w₁⟩\\}$，$V(w₀, P) = ⊥, V(w₁, P) = ⊤$ とおく．<br>
$w₀$ から到達可能な世界は $w₁$ のみで $S, w₁ ⊨ P$ だから，定義 (6) より $S, w₀ ⊨ □P$．一方 $V(w₀, P) = ⊥$ より $S, w₀ ⊭ P$．よって定義 (5) より $S, w₀ ⊭ □P ⊃ P$．（$W = \\{w₀\\}, R = ∅, V(w₀, P) = ⊥$ でも反例になる．）<br>
<b>R が反射律を満たす場合：</b>任意の $w$ で $wRw$ が成り立つので，$S, w ⊨ □P$ ならば（$w' = w$ として）$S, w ⊨ P$ となり，$□P ⊃ P$ はつねに真となる．`,
    },
  ],
  quiz: [
    { q: '命題様相論理で $□P ∧ Q$ はどう解釈される？', opts: ['□(P ∧ Q)', '(□P) ∧ Q', '□P ∧ □Q', '構文エラー'], a: 1, why: '1.3 優先順位：様相演算子 (□, ◇) は否定 ¬ と同じ結合力をもち、∧ や ∨ より強い。' },
    { q: 'Kripke 構造 $S = (W, R, V)$ で $S, w ⊨ □A$ が成り立つ条件は？', opts: ['すべての w\' ∈ W で S, w\' ⊨ A', 'wRw\' となる任意の w\' ∈ W で S, w\' ⊨ A', 'wRw\' となるある w\' ∈ W で S, w\' ⊨ A', 'S, w ⊨ A かつ R が空でない'], a: 1, why: '定義 (6)。W 全体ではなく「w から到達可能なすべての w\'」で A が真であること。' },
    { q: '世界 $w$ から到達可能な世界が 1 つもない（$wRw\'$ となる $w\'$ が存在しない）とき、$□P$ と $◇P$ の真偽は？', opts: ['□P は真、◇P は偽', '□P は偽、◇P は真', 'どちらも真', 'どちらも偽'], a: 0, why: '反例となる到達可能世界がないので □P は空虚に真。到達可能世界が存在しないので ◇P は偽。' },
    { q: '$¬◇A$ と論理的に同値な式は？', opts: ['◇¬A', '¬□A', '□¬A', '□A'], a: 2, why: '1.5 の同値式 ¬◇A = □¬A。「A の可能性がない」＝「必然的に ¬A」。' },
    { q: '命題様相論理のシーケント規則 (□) で、前提 $A₁, A₂ → B$ から導ける結論は？', opts: ['□A₁, A₂ → □B', '□A₁, □A₂ → B', '□A₁, □A₂ → □B', '◇A₁, ◇A₂ → ◇B'], a: 2, why: '前提の左辺すべての式と右辺の 1 つの式に一斉に □ をつける。' },
    { q: '講義ノート 2.1 の命題線形時相論理で、到達可能関係 $R$ が満たす性質の組み合わせは？', opts: ['対称律と推移律', '反射律と推移律', '反射律と反対称律のみ', '条件なし'], a: 1, why: '任意の w₁ に w₁Rw₁（反射律：現在を含む）と、w₁Rw₂ かつ w₂Rw₃ なら w₁Rw₃（推移律）。' },
    { q: '命題線形時相論理における $◇P$ の直観的な意味は？', opts: ['過去のある時点で P が成り立った', '現在を除いた未来のどこかで P が成り立つ', '（現在を含む）将来いつかは P が成り立つ', '将来いつも P が成り立つ'], a: 2, why: '反射律 wRw があるため「現在を含む」将来いつかは P が成り立つ、を表す（将来いつもは □P）。' },
  ],
}
