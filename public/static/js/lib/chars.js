// Character art (inline SVG). サカイ = 先輩/解説役（眼鏡＋ボブ・琥珀）, リョウガ = 受講生/質問役（つんつん頭・シアン）
// + mascot "トト" : a ⊤-shaped blob. When false it flips upside-down and becomes ⊥ (⊥ is literally ⊤ upside-down).

const INK = '#2b2452'

const eyes = {
  normal: (x1, x2, y) => `<circle cx="${x1}" cy="${y}" r="3.3" fill="${INK}"/><circle cx="${x2}" cy="${y}" r="3.3" fill="${INK}"/><circle cx="${x1 + 1.1}" cy="${y - 1.2}" r="1.1" fill="#fff"/><circle cx="${x2 + 1.1}" cy="${y - 1.2}" r="1.1" fill="#fff"/>`,
  happy: (x1, x2, y) => `<path d="M${x1 - 4} ${y + 1} q4 -5 8 0 M${x2 - 4} ${y + 1} q4 -5 8 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  think: (x1, x2, y) => `<circle cx="${x1 + 1.5}" cy="${y - 1.5}" r="3" fill="${INK}"/><circle cx="${x2 + 1.5}" cy="${y - 1.5}" r="3" fill="${INK}"/>`,
  oops: (x1, x2, y) => `<path d="M${x1 - 3.5} ${y - 3.5} l7 7 M${x1 + 3.5} ${y - 3.5} l-7 7 M${x2 - 3.5} ${y - 3.5} l7 7 M${x2 + 3.5} ${y - 3.5} l-7 7" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
  wow: (x1, x2, y) => `<circle cx="${x1}" cy="${y}" r="4.4" fill="#fff" stroke="${INK}" stroke-width="2.2"/><circle cx="${x2}" cy="${y}" r="4.4" fill="#fff" stroke="${INK}" stroke-width="2.2"/><circle cx="${x1}" cy="${y}" r="2" fill="${INK}"/><circle cx="${x2}" cy="${y}" r="2" fill="${INK}"/>`,
}
const mouth = {
  normal: (x, y) => `<path d="M${x - 5} ${y} q5 4.5 10 0" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  happy: (x, y) => `<path d="M${x - 7} ${y - 1} q7 10 14 0 z" fill="#ff7a8c" stroke="${INK}" stroke-width="2.3" stroke-linejoin="round"/>`,
  think: (x, y) => `<path d="M${x - 4} ${y + 1} h8" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`,
  oops: (x, y) => `<path d="M${x - 6} ${y + 2} q3 -4 6 0 q3 4 6 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  wow: (x, y) => `<ellipse cx="${x}" cy="${y + 1}" rx="4" ry="5" fill="#ff7a8c" stroke="${INK}" stroke-width="2.3"/>`,
}
const blush = (x1, x2, y) => `<ellipse cx="${x1}" cy="${y}" rx="5" ry="3" fill="#ff9aa8" opacity=".55"/><ellipse cx="${x2}" cy="${y}" rx="5" ry="3" fill="#ff9aa8" opacity=".55"/>`

function sakai(ex = 'normal') {
  const E = eyes[ex] || eyes.normal, M = mouth[ex] || mouth.normal
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="52" r="46" fill="#ffbe55" stroke="${INK}" stroke-width="3"/>
  <path d="M18 98 q32 -26 64 0" fill="#fff" stroke="${INK}" stroke-width="3"/>
  <path d="M40 80 l10 8 l10 -8" fill="#ffbe55" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="M24 50 q-4 -32 26 -34 q30 2 26 34 l3 22 q-6 4 -11 0 l-2 -14 h-32 l-2 14 q-5 4 -11 0z" fill="#5a3b2e" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="50" cy="53" rx="22" ry="23" fill="#ffe3cc" stroke="${INK}" stroke-width="3"/>
  <path d="M28 46 q8 -16 24 -16 q-2 8 -12 12 q10 -2 16 -10 q6 10 16 14 q-4 -20 -22 -22 q-20 0 -22 22z" fill="#5a3b2e" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
  ${blush(37, 63, 62)}
  ${E(41, 59, 54)}
  <rect x="33" y="47" width="15" height="13" rx="5" fill="none" stroke="${INK}" stroke-width="2.4"/>
  <rect x="52" y="47" width="15" height="13" rx="5" fill="none" stroke="${INK}" stroke-width="2.4"/>
  <path d="M48 52 h4" stroke="${INK}" stroke-width="2.4"/>
  ${M(50, 66)}
</svg>`
}
function ryoga(ex = 'normal') {
  const E = eyes[ex] || eyes.normal, M = mouth[ex] || mouth.normal
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="52" r="46" fill="#4cc9dc" stroke="${INK}" stroke-width="3"/>
  <path d="M18 98 q32 -26 64 0" fill="#2b2452" stroke="${INK}" stroke-width="3"/>
  <path d="M42 80 h16 l-3 10 h-10z" fill="#fff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
  <ellipse cx="50" cy="55" rx="22" ry="23" fill="#ffe3cc" stroke="${INK}" stroke-width="3"/>
  <path d="M26 50 l-4 -10 l9 2 l-2 -12 l10 6 l2 -12 l9 9 l5 -11 l5 11 l8 -8 l1 12 l10 -4 l-4 11 l6 2 q-6 6 -10 2 q-2 -8 -6 -10 q-10 6 -24 4 q-6 2 -8 10 q-4 2 -7 -2z" fill="#3b3366" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
  ${blush(37, 63, 64)}
  ${E(41, 59, 56)}
  <path d="M35 47 l9 1.5 M65 47 l-9 1.5" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
  ${M(50, 68)}
</svg>`
}
export function avatar(who, ex = 'normal') {
  return who === 'S' ? sakai(ex) : ryoga(ex)
}

// Toto : the ⊤ mascot. state 'top'|'bot'
export function toto(state = 'top', { idle = true, size } = {}) {
  const fill = state === 'bot' ? '#ff6b8b' : '#2ec486'
  const cls = `toto${state === 'bot' ? ' is-bot' : ''}${idle ? ' idle' : ''}`
  return `<div class="${cls}" ${size ? `style="width:${size}px"` : ''} data-toto><svg viewBox="0 0 100 100" aria-hidden="true">
  <ellipse cx="50" cy="95" rx="24" ry="4" fill="${INK}" opacity=".12"/>
  <g class="body">
    <path class="bfill" d="M14 18 q0 -10 10 -10 h52 q10 0 10 10 v6 q0 9 -10 9 h-14 v52 q0 9 -9 9 h-6 q-9 0 -9 -9 v-52 h-14 q-10 0 -10 -9z" fill="${fill}" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/>
    <path d="M22 14 q3 -2 8 -2" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>
    <g class="face-t">
      <circle cx="42" cy="21" r="3.2" fill="${INK}"/><circle cx="58" cy="21" r="3.2" fill="${INK}"/>
      <circle cx="43" cy="20" r="1" fill="#fff"/><circle cx="59" cy="20" r="1" fill="#fff"/>
      <path d="M46 26 q4 4 8 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <ellipse cx="34" cy="26" rx="4" ry="2.4" fill="#fff" opacity=".45"/><ellipse cx="66" cy="26" rx="4" ry="2.4" fill="#fff" opacity=".45"/>
    </g>
    <g class="face-b" transform="rotate(180 50 21)">
      <path d="M38 20 l7 3 M62 20 l-7 3" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M45 28 q5 -4 10 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M66 14 q2 4 0 6 q-2 -2 0 -6z" fill="#7ad0ff" stroke="${INK}" stroke-width="1.5"/>
    </g>
  </g>
</svg></div>`
}
export function setToto(el, state) {
  const t = el.matches?.('[data-toto]') ? el : el.querySelector('[data-toto]')
  if (!t) return
  t.classList.toggle('is-bot', state === 'bot')
  const p = t.querySelector('.bfill')
  if (p) p.setAttribute('fill', state === 'bot' ? '#ff6b8b' : '#2ec486')
}

export const BRAND = `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="2" y="4" width="36" height="34" rx="12" fill="${INK}"/><rect x="2" y="1.5" width="36" height="34" rx="12" fill="#ffd23f" stroke="${INK}" stroke-width="2.4"/><path d="M10 10 h20 M20 10 v18" stroke="#2ec486" stroke-width="5" stroke-linecap="round"/><path d="M10 10 h20 M20 10 v18" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".0"/><circle cx="16" cy="15.5" r="1.3" fill="${INK}"/><circle cx="24" cy="15.5" r="1.3" fill="${INK}"/></svg>`
