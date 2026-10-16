// ============================================================
//  infographic.js — animated data graphics (SVG, scroll-triggered)
//  All graphics animate when their .reveal parent gets .in
// ============================================================
import { h, html, fxs } from '../lib/ui.js'
import { toto } from '../lib/chars.js'

const INK = '#2b2452'

// ---------- donut chart (grading 40/60) ----------
export function donut(parts, { size = 220, thick = 34, center = '' } = {}) {
  const r = (size - thick) / 2
  let off = 0
  const segs = parts.map((p, i) => {
    const s = `<circle class="dn-seg" pathLength="100" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${p.c}" stroke-width="${thick}" stroke-dashoffset="${-off}" style="--v:${p.v};--d:${0.2 + i * 0.5}s" transform="rotate(-90 ${size / 2} ${size / 2})"/>`
    off += p.v
    return s
  }).join('')
  return html(`<div class="donut"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#f3e7d8" stroke-width="${thick}"/>
    ${segs}
    <circle cx="${size / 2}" cy="${size / 2}" r="${r - thick / 2 - 2}" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r + thick / 2 + 1}" fill="none" stroke="${INK}" stroke-width="2.5"/>
  </svg><div class="dn-center">${center}</div></div>`)
}

// ---------- grading infographic ----------
export function gradingInfo() {
  return h('div.info-card.reveal.ig-grade',
    h('div.ig-head', h('span.ig-tag', 'GRADING'), h('h4', '成績のつけ方')),
    h('div.ig-grade-body',
      donut([{ v: 40, c: '#5aa9ff' }, { v: 60, c: '#ff6b8b' }], { center: '<b data-count="100" data-suffix="%">100%</b><small>試験のみ</small>' }),
      h('ul.ig-legend',
        h('li', h('i', { style: { background: '#5aa9ff' } }), h('div', h('b', { 'data-count': 40, 'data-suffix': '%' }), h('span', '中間試験 11/27'))),
        h('li', h('i', { style: { background: '#ff6b8b' } }), h('div', h('b', { 'data-count': 60, 'data-suffix': '%' }), h('span', '期末試験 01/08'))),
        h('li.muted', h('i', { style: { background: '#fff', borderStyle: 'dashed' } }), h('div', h('b', '0%'), h('span', 'レポートは採点に入らない。でも自分の理解のために、毎回出そう'))))))
}

// ---------- course timeline (14 weeks) ----------
export function timeline(lectures, upcoming) {
  const all = [...lectures.map((l) => ({ no: l.no, date: l.date, title: l.title.replace(/^.*— /, ''), live: true, color: l.color, slug: l.slug })), ...upcoming.map((u) => ({ ...u, title: u.title.replace(/^.*— /, '') }))].sort((a, b) => a.no - b.no)
  const n = all.length
  const W = 1100, H = 210, pad = 64, step = (W - pad * 2) / (n - 1)
  const lastLive = Math.max(...lectures.map((l) => l.no))
  const progX = pad + (lastLive - 1) * step
  const dots = all.map((it, i) => {
    const x = pad + i * step
    const up = i % 2 === 0
    const fill = it.exam ? '#ff6b8b' : it.live ? it.color : '#fff'
    const lbl = it.title.length > 9 ? it.title.slice(0, 9) + '…' : it.title
    const tag = it.live ? `<a href="#/lec/${it.slug}">` : '<g>'
    const tagEnd = it.live ? '</a>' : '</g>'
    return `${tag}<g class="tl-dot ${it.live ? 'live' : ''} ${it.exam ? 'exam' : ''}" style="--d:${0.25 + i * 0.07}s">
      <line x1="${x}" y1="${H / 2}" x2="${x}" y2="${up ? H / 2 - 42 : H / 2 + 42}" stroke="${INK}" stroke-width="2" stroke-dasharray="3 4"/>
      <circle cx="${x}" cy="${H / 2}" r="${it.exam ? 15 : 13}" fill="${fill}" stroke="${INK}" stroke-width="2.5"/>
      <text x="${x}" y="${H / 2 + 4.5}" text-anchor="middle" font-size="12" font-weight="700" fill="${it.live || it.exam ? INK : '#9a93b8'}">${it.exam ? '!' : it.no}</text>
      <text x="${x}" y="${up ? H / 2 - 66 : H / 2 + 62}" text-anchor="middle" font-size="12" font-weight="700" fill="${INK}" class="tl-t">${it.date}</text>
      <text x="${x}" y="${up ? H / 2 - 50 : H / 2 + 78}" text-anchor="middle" font-size="11.5" font-weight="700" fill="${it.live ? INK : '#9a93b8'}" class="tl-t">${lbl}</text>
    </g>${tagEnd}`
  }).join('')
  return html(`<div class="info-card reveal ig-timeline"><div class="ig-head"><span class="ig-tag">TIMELINE</span><h4>14 週間の地図</h4><span class="ig-note">色つき = 公開中 ／ ピンク = 試験</span></div>
  <div class="tl-scroll"><svg viewBox="0 0 ${W} ${H}" class="tl-svg">
    <line x1="${pad}" y1="${H / 2}" x2="${W - pad}" y2="${H / 2}" stroke="#eadbc8" stroke-width="10" stroke-linecap="round"/>
    <line class="tl-prog" x1="${pad}" y1="${H / 2}" x2="${progX}" y2="${H / 2}" stroke="${INK}" stroke-width="10" stroke-linecap="round" style="--len:${progX - pad}"/>
    <g class="tl-now" style="--x:${progX}px"><g transform="translate(${progX - 16} ${H / 2 - 112})"><rect width="32" height="22" rx="11" fill="#ffd23f" stroke="${INK}" stroke-width="2"/><text x="16" y="15.5" text-anchor="middle" font-size="11" font-weight="800" fill="${INK}">NOW</text></g></g>
    ${dots}
  </svg></div></div>`)
}

// ---------- "3 ways to check truth" comparison (semantic vs resolution vs sequent) ----------
export function methodsInfo() {
  const card = (cls, ic, name, sub, how, scale, lec) => `<div class="m-card ${cls}">
    <div class="m-ic">${ic}</div><h5>${name}</h5><div class="m-sub">${sub}</div>
    <p>${how}</p>
    <div class="m-bar"><span>手間</span><div class="m-track"><i style="--w:${scale}%"></i></div></div>
    <div class="m-lec">${lec}</div></div>`
  return html(`<div class="info-card reveal ig-methods"><div class="ig-head"><span class="ig-tag">COMPARE</span><h4>「恒真か？」を確かめる 3 つの道</h4></div>
  <div class="m-grid">
    ${card('m1', '<span class="fx">⊨</span>', '真理値表', '意味論', `全 2ⁿ 通りの解釈を<b>総当たり</b>。確実だけど、命題記号が増えると爆発。`, 92, '第2回')}
    <div class="m-arrow">→</div>
    ${card('m2', '<span class="fx">⊥</span>', '導出原理', '反駁', `結論を否定して節に分解し、<b>空節 ⊥</b> が出るまでぶつける。機械向き。`, 55, '第3回')}
    <div class="m-arrow">→</div>
    ${card('m3', '<span class="fx">⊢</span>', 'シーケント計算', '構文論 LK', `推論規則を<b>逆向き</b>にほどく。葉が全部初期シーケントなら証明完成。`, 40, '第4回')}
  </div>
  <div class="m-foot"><span class="fx">⊢ A</span> と <span class="fx">⊨ A</span> が一致する ＝ <b>健全性 + 完全性</b>（第5回へ）</div></div>`)
}

// ---------- formula anatomy (BNF building blocks) ----------
export function anatomyInfo() {
  return html(`<div class="info-card reveal ig-anatomy"><div class="ig-head"><span class="ig-tag">ANATOMY</span><h4>論理式の解剖図</h4></div>
  <svg viewBox="0 0 640 250" class="anat-svg">
    <g class="an-f" style="--d:.1s"><text x="320" y="44" text-anchor="middle" font-size="34" font-weight="600" fill="${INK}"><tspan fill="#e46e22">¬</tspan>P <tspan fill="#c39400">∨</tspan> Q <tspan fill="#7650f0">⊃</tspan> P <tspan fill="#2c86e8">∧</tspan> Q</text></g>
    <path data-draw class="an-l" d="M357 60 C 357 90, 320 90, 320 110" stroke="${INK}" stroke-width="2.5" fill="none" style="--d:.5s"/>
    <g class="an-n" style="--d:.8s"><circle cx="320" cy="128" r="20" fill="#ece5ff" stroke="${INK}" stroke-width="2.5"/><text x="320" y="135" text-anchor="middle" font-size="20" font-weight="700" fill="${INK}">⊃</text></g>
    <path data-draw class="an-l" d="M304 140 L210 186" stroke="${INK}" stroke-width="2.5" fill="none" style="--d:1s"/>
    <path data-draw class="an-l" d="M336 140 L430 186" stroke="${INK}" stroke-width="2.5" fill="none" style="--d:1s"/>
    <g class="an-n" style="--d:1.3s"><circle cx="200" cy="200" r="18" fill="#fff3c2" stroke="${INK}" stroke-width="2.5"/><text x="200" y="206" text-anchor="middle" font-size="18" font-weight="700" fill="${INK}">∨</text></g>
    <g class="an-n" style="--d:1.4s"><circle cx="440" cy="200" r="18" fill="#ddeeff" stroke="${INK}" stroke-width="2.5"/><text x="440" y="206" text-anchor="middle" font-size="18" font-weight="700" fill="${INK}">∧</text></g>
    <g class="an-c" style="--d:1.7s">
      <rect x="18" y="98" width="160" height="58" rx="14" fill="#fff" stroke="${INK}" stroke-width="2"/>
      <text x="30" y="122" font-size="12.5" font-weight="800" fill="${INK}">主結合子（根）</text>
      <text x="30" y="142" font-size="11.5" font-weight="700" fill="#5d5683">いちばん弱い ⊃ が最後</text>
      <path d="M178 127 L296 128" stroke="#9d7bff" stroke-width="2" stroke-dasharray="4 4"/>
    </g>
    <g class="an-c" style="--d:1.95s">
      <rect x="470" y="88" width="156" height="58" rx="14" fill="#fff" stroke="${INK}" stroke-width="2"/>
      <text x="482" y="112" font-size="12.5" font-weight="800" fill="${INK}">強さの順</text>
      <text x="482" y="132" font-size="12" font-weight="700" fill="#5d5683">¬ ＞ ∧ ＞ ∨ ＞ ⊃</text>
    </g>
  </svg></div>`)
}

// ---------- truth-value strips (2ⁿ growth) ----------
export function growthInfo() {
  const rows = [1, 2, 3, 4, 5].map((n) => {
    const cells = Array.from({ length: Math.min(32, 2 ** n) }, (_, i) => `<i style="--d:${(n * 0.12 + i * 0.012).toFixed(3)}s"></i>`).join('')
    return `<div class="gr-row"><span class="gr-n">n = ${n}</span><div class="gr-cells">${cells}</div><b class="gr-v" data-count="${2 ** n}">${2 ** n}</b></div>`
  }).join('')
  return html(`<div class="info-card reveal ig-growth"><div class="ig-head"><span class="ig-tag">GROWTH</span><h4>命題記号 n 個 → 解釈は 2ⁿ 通り</h4><span class="ig-note">n = 30 なら約 10 億行</span></div>${rows}</div>`)
}

// ---------- CNF pipeline (4 stages) ----------
export function cnfPipeInfo() {
  const st = [['⊃', '除去', 'α ⊃ β = ¬α ∨ β', '#ece5ff'], ['¬', '内側へ', 'ド・モルガン・二重否定', '#ffe8d8'], ['∨∧', '分配', '∧ を外へ追い出す', '#fff3c2'], ['✓', '整理', '⊤ ⊥・重複を消す', '#d3f6e6']]
  return html(`<div class="info-card reveal ig-pipe"><div class="ig-head"><span class="ig-tag">PIPELINE</span><h4>CNF 変換は 4 段のベルトコンベア</h4></div>
  <div class="pipe">${st.map(([ic, n, d, c], i) => `<div class="pipe-st" style="--d:${0.15 + i * 0.22}s;--c:${c}"><div class="pipe-ic fx">${fxs(ic)}</div><b>${i + 1}. ${n}</b><span class="fx-wrap">${fxs(d)}</span></div>${i < 3 ? `<div class="pipe-ar" style="--d:${0.3 + i * 0.22}s"><svg viewBox="0 0 40 20"><path d="M2 10 H32 M24 3 L33 10 L24 17" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>` : ''}`).join('')}</div>
  <div class="pipe-out"><span class="fx">${fxs('¬(P ∧ (Q ∨ R))')}</span><span class="pipe-arrow">⟹</span><span class="fx">${fxs('(¬P ∨ ¬Q) ∧ (¬P ∨ ¬R)')}</span></div></div>`)
}

// ---------- resolution "collision" diagram ----------
export function resolveInfo() {
  return html(`<div class="info-card reveal ig-resolve"><div class="ig-head"><span class="ig-tag">HOW IT WORKS</span><h4>導出 ＝ P と ¬P の「対消滅」</h4></div>
  <div class="rs-stage">
    <div class="rs-c rs-a"><span class="lit k">P</span><span class="o o-or">∨</span><span class="lit">C</span><small>親節 1</small></div>
    <div class="rs-c rs-b"><span class="lit k">¬P</span><span class="o o-or">∨</span><span class="lit">D</span><small>親節 2</small></div>
    <div class="rs-boom">✦</div>
    <div class="rs-out"><span class="lit">C</span><span class="o o-or">∨</span><span class="lit">D</span><small>導出節</small></div>
  </div>
  <div class="rs-cap">P が ⊤ なら D が、P が ⊥ なら C が ⊤ のはず → どちらにしても <b>C ∨ D</b> は ⊤</div></div>`)
}

// ---------- sequent comma meaning ----------
export function sequentInfo() {
  return html(`<div class="info-card reveal ig-seq"><div class="ig-head"><span class="ig-tag">DECODE</span><h4>シーケントの読み方</h4></div>
  <div class="sq-row">
    <div class="sq-side l"><span class="fx">A₁, A₂, A₃</span><em>左のカンマ = <b class="o-and">∧</b></em><small>仮定が「全部」成り立つ</small></div>
    <div class="sq-arrow"><span>→</span><em>⊃</em></div>
    <div class="sq-side r"><span class="fx">B₁, B₂</span><em>右のカンマ = <b class="o-or">∨</b></em><small>結論の「どれか」が成り立つ</small></div>
  </div>
  <div class="sq-eq"><span class="fx">${fxs('(A₁ ∧ A₂ ∧ A₃) ⊃ (B₁ ∨ B₂)')}</span></div>
  <div class="sq-mini"><span>左が空 = <b class="c-top">⊤</b></span><span>右が空 = <b class="c-bot">⊥</b></span><span>初期シーケント = 両辺に同じ命題記号</span></div></div>`)
}

// ---------- set ↔ logic correspondence ----------
export function setLogicInfo() {
  const pair = (a, b, n, d) => `<div class="sl-row" style="--d:${d}s"><span class="sl-a">${a}</span><span class="sl-mid"><i></i><em>${n}</em><i></i></span><span class="sl-b fx">${fxs(b)}</span></div>`
  return html(`<div class="info-card reveal ig-setlogic"><div class="ig-head"><span class="ig-tag">MAPPING</span><h4>集合の記号 ⇄ 論理の記号</h4></div>
  ${pair('A ∪ B', 'P ∨ Q', 'または', 0.1)}${pair('A ∩ B', 'P ∧ Q', 'かつ', 0.25)}${pair('A の補集合', '¬P', 'でない', 0.4)}${pair('2<sup>S</sup>（2ⁿ 個）', '解釈（2ⁿ 通り）', '数え方が同じ', 0.55)}</div>`)
}

// ---------- lecture summary strip (stats) ----------
export function lecStats(lec, due) {
  const days = Math.ceil((due - new Date()) / 864e5)
  return h('div.lec-stats.reveal',
    h('div.ls', h('b', { 'data-count': lec.chapters.length }), h('span', 'チャプター')),
    h('div.ls', h('b', { 'data-count': lec.exercises.length }), h('span', '公式演習')),
    h('div.ls', h('b', { 'data-count': lec.quiz.length }), h('span', '類題')),
    h('div.ls.wide', h('div.ls-due', days > 0 ? h('b', { 'data-count': days }) : h('b', '✓'), h('span', days > 0 ? `日後が ex${lec.no} の締切` : `ex${lec.no} は締切済み（復習用に解答例を見よう）`)), h('div.ls-track', h('i', { style: { '--w': Math.max(0, Math.min(100, 100 - (days / 13) * 100)) + '%' } }))))
}

// chapter-id -> infographic factories (inserted after the chapter's first dialogue)
export const LEC_INFO = {
  lec01: { why: [setLogicInfo] },
  lec02: { prec: [anatomyInfo], sem: [growthInfo] },
  lec03: { clause: [cnfPipeInfo], res: [resolveInfo] },
  lec04: { syn: [methodsInfo], seq: [sequentInfo] },
}
