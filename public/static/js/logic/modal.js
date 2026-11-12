// ============================================================
//  第3部：非古典論理エンジン（NonClassicalLogic.pdf）
//   ・命題様相論理のパーサ（□, ◇ は ¬ と同じ強さ、∧ ∨ ⊃ は左優先）
//   ・Kripke フレーム (W, R)・Kripke 構造 S = (W, R, V) での評価 S, w ⊨ A
//   ・小さな Kripke 構造での恒真判定・反例探索（K / 反射的 T / 反射推移 S4）
//   ・命題様相論理のシーケント計算（LK + (□) + contraction）の自動証明
//   ・Łukasiewicz の 3 値論理 / ファジィ論理（[0,1] 値）での評価
// ============================================================
import { esc } from '../lib/ui.js'

export class ModalError extends Error {
  constructor(msg, pos, hint) { super(msg); this.pos = pos; this.hint = hint }
}

const PREC = { imp: 1, or: 2, and: 3, not: 4, box: 4, dia: 4, var: 5, top: 5, bot: 5 }
const SYM = { not: '¬', box: '□', dia: '◇', and: '∧', or: '∨', imp: '⊃', top: '⊤', bot: '⊥' }

export function tokenizeModal(src) {
  const toks = []
  let i = 0
  const s = src
  const push = (type, val, len) => { toks.push({ type, val, pos: i, len }); i += len }
  while (i < s.length) {
    const c = s[i], two = s.slice(i, i + 2), three = s.slice(i, i + 3)
    if (/\s/.test(c)) { i++; continue }
    if (c === '(' || c === '（') { push('(', '(', 1); continue }
    if (c === ')' || c === '）') { push(')', ')', 1); continue }
    if (c === ',' || c === '，' || c === '、') { push(',', ',', 1); continue }
    if (two === '[]') { push('un', 'box', 2); continue }
    if (two === '<>') { push('un', 'dia', 2); continue }
    if (c === '□' || c === '◻' || c === '■') { push('un', 'box', 1); continue }
    if (c === '◇' || c === '◊' || c === '◆') { push('un', 'dia', 1); continue }
    if (three === '<->' || three === '<=>') throw new ModalError('⇔（同値）はこの講義の論理記号にはありません', i, '(A ⊃ B) ∧ (B ⊃ A) と書きましょう')
    if (three === '-->' || three === '==>') { push('op', 'imp', 3); continue }
    if (two === '->' || two === '=>') { push('op', 'imp', 2); continue }
    if (c === '→') { push('arrow', '→', 1); continue }
    if (c === '⊃' || c === '>') { push('op', 'imp', 1); continue }
    if (two === '/\\' || two === '&&') { push('op', 'and', 2); continue }
    if (two === '\\/' || two === '||') { push('op', 'or', 2); continue }
    if (c === '∧' || c === '&' || c === '^') { push('op', 'and', 1); continue }
    if (c === '∨' || c === '|' || c === '+') { push('op', 'or', 1); continue }
    if (c === '¬' || c === '~' || c === '!' || c === '￢') { push('un', 'not', 1); continue }
    if (c === '⊤' || c === '1') { push('const', 'top', 1); continue }
    if (c === '⊥' || c === '0') { push('const', 'bot', 1); continue }
    const word = /^[A-Za-z][A-Za-z0-9_']*/.exec(s.slice(i))
    if (word) {
      const w = word[0]
      if (/^(box|nec)$/i.test(w)) { push('un', 'box', w.length); continue }
      if (/^(dia|pos)$/i.test(w)) { push('un', 'dia', w.length); continue }
      if (/^(top|true)$/i.test(w)) { push('const', 'top', w.length); continue }
      if (/^(bot|false)$/i.test(w)) { push('const', 'bot', w.length); continue }
      if (/^[a-z]/.test(w)) throw new ModalError(`「${w}」は命題記号として使えません`, i, '命題記号は大文字（P, Q, R …）で書きます。□ は []、◇ は <> でも入力できます')
      push('var', w, w.length); continue
    }
    throw new ModalError(`「${c}」は使えない文字です`, i, '使える記号: □ ◇ ¬ ∧ ∨ ⊃ ( ) P Q R（代用: [] <> ~ & | ->）')
  }
  return toks
}

export function parseModal(src) {
  if (!src || !src.trim()) throw new ModalError('式が空です', 0, '例: □(P ⊃ Q) ⊃ (□P ⊃ □Q)')
  const toks = tokenizeModal(src)
  let k = 0
  const peek = () => toks[k]
  const end = () => k >= toks.length
  const posOf = (t) => (t ? t.pos : src.length)

  function primary() {
    const t = peek()
    if (!t) throw new ModalError('式が途中で終わっています', src.length, '演算子の後ろには論理式が必要です')
    if (t.type === 'un') { k++; return { t: t.val, a: primary() } }
    if (t.type === 'var') { k++; return { t: 'var', n: t.val } }
    if (t.type === 'const') { k++; return { t: t.val } }
    if (t.type === '(') {
      k++
      if (peek() && peek().type === ')') throw new ModalError('( ) の中が空です', posOf(peek()))
      const e = expr(0)
      if (!peek() || peek().type !== ')') throw new ModalError('閉じ括弧 ) が足りません', posOf(peek()))
      k++
      return e
    }
    if (t.type === 'op') throw new ModalError(`「${SYM[t.val]}」の左側に論理式がありません`, t.pos)
    if (t.type === ')') throw new ModalError('対応する ( がない ) があります', t.pos)
    throw new ModalError('ここに論理式が必要です', t.pos)
  }
  function expr(minP) {
    let lhs = primary()
    while (!end()) {
      const t = peek()
      if (t.type !== 'op') break
      const p = PREC[t.val]
      if (p < minP) break
      k++
      if (end()) throw new ModalError(`「${SYM[t.val]}」の右側に論理式がありません`, src.length)
      const rhs = expr(p + 1)
      lhs = { t: t.val, a: lhs, b: rhs }
    }
    return lhs
  }
  const e = expr(0)
  if (!end()) throw new ModalError('論理式が 2 つ並んでいます', peek().pos, '間に ∧ ∨ ⊃ のどれかが必要です')
  return e
}

export function tryModal(src) {
  try { return { ok: true, f: parseModal(src) } } catch (err) { return { ok: false, err } }
}

export function showModal(f, parentP = 0, rightChild = false) {
  const p = PREC[f.t]
  let s
  if (f.t === 'var') return f.n
  if (f.t === 'top' || f.t === 'bot') return SYM[f.t]
  if (f.t === 'not' || f.t === 'box' || f.t === 'dia') {
    const sub = showModal(f.a, p, false)
    return SYM[f.t] + sub
  }
  s = `${showModal(f.a, p, false)} ${SYM[f.t]} ${showModal(f.b, p, true)}`
  const need = p < parentP || (p === parentP && rightChild)
  return need ? `(${s})` : s
}

export function modalHTML(f, parentP = 0, rightChild = false) {
  const p = PREC[f.t]
  if (f.t === 'var') return `<span class="pd">${esc(f.n)}</span>`
  if (f.t === 'top') return '<span class="c-top">⊤</span>'
  if (f.t === 'bot') return '<span class="c-bot">⊥</span>'
  if (f.t === 'not' || f.t === 'box' || f.t === 'dia') {
    const cls = f.t === 'not' ? 'o-not' : 'o-mod'
    return `<span class="o ${cls}">${SYM[f.t]}</span>${modalHTML(f.a, p, false)}`
  }
  const s = `${modalHTML(f.a, p, false)} <span class="o o-${f.t}">${SYM[f.t]}</span> ${modalHTML(f.b, p, true)}`
  const need = p < parentP || (p === parentP && rightChild)
  return need ? `<span class="p">(</span>${s}<span class="p">)</span>` : s
}

export function modalVars(f, out = new Set()) {
  if (!f) return out
  if (f.t === 'var') out.add(f.n)
  else if (f.a && f.b) { modalVars(f.a, out); modalVars(f.b, out) }
  else if (f.a) modalVars(f.a, out)
  return out
}

// ---------- Kripke 構造 S = (W, R, V) での評価 ----------
// S: { W: [0,1,...], R: Set('0,1') or (u,v)=>bool, V: (w, name)=>bool }
export function hasEdge(S, u, v) {
  return typeof S.R === 'function' ? S.R(u, v) : S.R.has(`${u},${v}`)
}
export function succs(S, w) {
  return S.W.filter((u) => hasEdge(S, w, u))
}
export function evalModal(f, S, w) {
  switch (f.t) {
    case 'top': return true
    case 'bot': return false
    case 'var': return typeof S.V === 'function' ? !!S.V(w, f.n) : !!(S.V[w] && S.V[w][f.n])
    case 'not': return !evalModal(f.a, S, w)
    case 'and': return evalModal(f.a, S, w) && evalModal(f.b, S, w)
    case 'or': return evalModal(f.a, S, w) || evalModal(f.b, S, w)
    case 'imp': return !evalModal(f.a, S, w) || evalModal(f.b, S, w)
    case 'box': return succs(S, w).every((u) => evalModal(f.a, S, u))
    case 'dia': return succs(S, w).some((u) => evalModal(f.a, S, u))
  }
  return false
}

// フレームの性質チェック（2.1 反射律・推移律など）
export function frameProps(S) {
  const refl = S.W.every((u) => hasEdge(S, u, u))
  let trans = true, sym = true, serial = true
  for (const u of S.W) {
    if (!succs(S, u).length) serial = false
    for (const v of S.W) {
      if (hasEdge(S, u, v) && !hasEdge(S, v, u)) sym = false
      if (hasEdge(S, u, v)) {
        for (const z of S.W) if (hasEdge(S, v, z) && !hasEdge(S, u, z)) trans = false
      }
    }
  }
  return { refl, trans, sym, serial }
}

// 小さな Kripke 構造で反例／モデルを探索（frame: 'any' | 'refl' | 's4'）
export function searchKripke(f, { want = false, maxW = 3, frame = 'any' } = {}) {
  const vars = [...modalVars(f)]
  if (vars.length > 3) return { skipped: true }
  for (let n = 1; n <= maxW; n++) {
    const W = [...Array(n).keys()]
    const pairs = []
    for (let u = 0; u < n; u++) for (let v = 0; v < n; v++) {
      if (frame !== 'any' && u === v) continue // 反射的フレームでは自己ループ固定
      pairs.push([u, v])
    }
    const edgeMasks = 1 << pairs.length
    const valMasks = 1 << (n * vars.length)
    for (let em = 0; em < edgeMasks; em++) {
      const R = new Set()
      if (frame !== 'any') W.forEach((u) => R.add(`${u},${u}`))
      pairs.forEach(([u, v], bit) => { if ((em >> bit) & 1) R.add(`${u},${v}`) })
      if (frame === 's4') {
        let ok = true
        for (let u = 0; u < n && ok; u++) for (let v = 0; v < n && ok; v++) if (R.has(`${u},${v}`)) {
          for (let z = 0; z < n; z++) if (R.has(`${v},${z}`) && !R.has(`${u},${z}`)) { ok = false; break }
        }
        if (!ok) continue
      }
      for (let vm = 0; vm < valMasks; vm++) {
        const V = W.map(() => ({}))
        vars.forEach((p, pi) => W.forEach((u) => { V[u][p] = !!((vm >> (pi * n + u)) & 1) }))
        const S = { W, R, V }
        for (const w of W) {
          if (evalModal(f, S, w) === want) return { found: { S, w, n } }
        }
      }
    }
  }
  return { found: null }
}

// ---------- 命題様相論理のシーケント計算（1.6：古典 LK + (□) + weakening/contraction） ----------
// 注：◇A は ¬□¬A（1.5 の ¬◇A = □¬A より ◇A = ¬□¬A）として扱うことも可能
export function parseModalSeq(src) {
  const parts = src.split(/→|⊢/)
  if (parts.length > 2) throw new ModalError('矢印 → は 1 つだけです', 0)
  const [lhs, rhs] = parts.length === 1 ? ['', parts[0]] : parts
  const splitTop = (s) => {
    const out = []; let d = 0, cur = ''
    for (const ch of s) {
      if (ch === '(' || ch === '（') d++
      if (ch === ')' || ch === '）') d--
      if ((ch === ',' || ch === '，') && d === 0) { out.push(cur); cur = '' } else cur += ch
    }
    out.push(cur); return out
  }
  const side = (x) => (x.trim() ? splitTop(x).map((p) => parseModal(p)) : [])
  return { L: side(lhs), R: side(rhs) }
}
export const showModalSeq = (s) => `${s.L.map((f) => showModal(f)).join(', ')}${s.L.length ? ' ' : ''}→${s.R.length ? ' ' : ''}${s.R.map((f) => showModal(f)).join(', ')}`
export const modalSeqHTML = (s) => `${s.L.map((f) => modalHTML(f)).join(', ')}${s.L.length ? ' ' : ''}<span class="arrow">→</span>${s.R.length ? ' ' : ''}${s.R.map((f) => modalHTML(f)).join(', ')}`

const isAtomM = (f) => f.t === 'var' || f.t === 'top' || f.t === 'bot'
const isModalAtom = (f) => isAtomM(f) || f.t === 'box'

function isAxiomM(s) {
  if (s.L.some((f) => f.t === 'bot') || s.R.some((f) => f.t === 'top')) return true
  const rVars = new Set(s.R.filter((f) => f.t === 'var').map((f) => f.n))
  return s.L.some((f) => f.t === 'var' && rVars.has(f.n))
}

// K のシーケント証明探索（LK 規則 + (□) 規則：□A₁,…,□Aₘ → □B の上の A₁,…,Aₘ → B）
export function proveModalSeq(s0, depth = 0) {
  if (depth > 18) return null
  if (isAxiomM(s0)) return { seq: s0, kids: [], status: 'axiom' }

  // 1. 古典命題論理の非分岐規則（¬左, ¬右, ∧左, ∨右, ⊃右）と ◇ の書き換え（◇A ≡ ¬□¬A）
  for (let i = 0; i < s0.L.length; i++) {
    const f = s0.L[i], restL = s0.L.filter((_, k) => k !== i)
    if (f.t === 'not') { const r = proveModalSeq({ L: restL, R: [...s0.R, f.a] }, depth + 1); if (r) return { seq: s0, rule: '¬左', kids: [r] } }
    if (f.t === 'and') { const r = proveModalSeq({ L: [f.a, f.b, ...restL], R: s0.R }, depth + 1); if (r) return { seq: s0, rule: '∧左', kids: [r] } }
    if (f.t === 'dia') { const r = proveModalSeq({ L: [{ t: 'not', a: { t: 'box', a: { t: 'not', a: f.a } } }, ...restL], R: s0.R }, depth + 1); if (r) return { seq: s0, rule: '◇定義 (¬◇=□¬)', kids: [r] } }
  }
  for (let i = 0; i < s0.R.length; i++) {
    const f = s0.R[i], restR = s0.R.filter((_, k) => k !== i)
    if (f.t === 'not') { const r = proveModalSeq({ L: [f.a, ...s0.L], R: restR }, depth + 1); if (r) return { seq: s0, rule: '¬右', kids: [r] } }
    if (f.t === 'or') { const r = proveModalSeq({ L: s0.L, R: [...restR, f.a, f.b] }, depth + 1); if (r) return { seq: s0, rule: '∨右', kids: [r] } }
    if (f.t === 'imp') { const r = proveModalSeq({ L: [f.a, ...s0.L], R: [...restR, f.b] }, depth + 1); if (r) return { seq: s0, rule: '⊃右', kids: [r] } }
    if (f.t === 'dia') { const r = proveModalSeq({ L: s0.L, R: [...restR, { t: 'not', a: { t: 'box', a: { t: 'not', a: f.a } } }] }, depth + 1); if (r) return { seq: s0, rule: '◇定義 (¬◇=□¬)', kids: [r] } }
  }

  // 2. 分岐規則（∨左, ⊃左, ∧右）
  for (let i = 0; i < s0.L.length; i++) {
    const f = s0.L[i], restL = s0.L.filter((_, k) => k !== i)
    if (f.t === 'or') {
      const r1 = proveModalSeq({ L: [f.a, ...restL], R: s0.R }, depth + 1)
      if (!r1) return null
      const r2 = proveModalSeq({ L: [f.b, ...restL], R: s0.R }, depth + 1)
      return r2 ? { seq: s0, rule: '∨左', kids: [r1, r2] } : null
    }
    if (f.t === 'imp') {
      const r1 = proveModalSeq({ L: restL, R: [...s0.R, f.a] }, depth + 1)
      if (!r1) return null
      const r2 = proveModalSeq({ L: [f.b, ...restL], R: s0.R }, depth + 1)
      return r2 ? { seq: s0, rule: '⊃左', kids: [r1, r2] } : null
    }
  }
  for (let i = 0; i < s0.R.length; i++) {
    const f = s0.R[i], restR = s0.R.filter((_, k) => k !== i)
    if (f.t === 'and') {
      const r1 = proveModalSeq({ L: s0.L, R: [...restR, f.a] }, depth + 1)
      if (!r1) return null
      const r2 = proveModalSeq({ L: s0.L, R: [...restR, f.b] }, depth + 1)
      return r2 ? { seq: s0, rule: '∧右', kids: [r1, r2] } : null
    }
  }

  // 3. すべて命題記号または □A になったら、(□) 規則を試す
  // (□): A₁, …, Aₘ → B から □A₁, …, □Aₘ → □B （不要な式は weakening で落としてから適用）
  if ([...s0.L, ...s0.R].every(isModalAtom)) {
    const boxL = s0.L.filter((f) => f.t === 'box')
    const boxR = s0.R.filter((f) => f.t === 'box')
    for (const target of boxR) {
      const prem = { L: boxL.map((f) => f.a), R: [target.a] }
      const sub = proveModalSeq(prem, depth + 1)
      if (sub) {
        const cleanSeq = { L: boxL, R: [target] }
        const same = boxL.length === s0.L.length && s0.R.length === 1
        const boxStep = { seq: cleanSeq, rule: '(□)', kids: [sub] }
        return same ? boxStep : { seq: s0, rule: 'weakening', kids: [boxStep] }
      }
    }
  }
  return null
}

// ---------- Łukasiewicz の多値論理（[0, 1] 値：3 値論理は {0, 0.5, 1}） ----------
// ¬x = 1 - x, x ∧ y = min(x, y), x ∨ y = max(x, y), x ⊃ y = min(1, 1 - x + y)
export function evalLukasiewicz(f, env) {
  switch (f.t) {
    case 'top': return 1
    case 'bot': return 0
    case 'var': return env[f.n] ?? 1
    case 'not': return +(1 - evalLukasiewicz(f.a, env)).toFixed(6)
    case 'and': return Math.min(evalLukasiewicz(f.a, env), evalLukasiewicz(f.b, env))
    case 'or': return Math.max(evalLukasiewicz(f.a, env), evalLukasiewicz(f.b, env))
    case 'imp': return +Math.min(1, 1 - evalLukasiewicz(f.a, env) + evalLukasiewicz(f.b, env)).toFixed(6)
    default: return 0
  }
}
