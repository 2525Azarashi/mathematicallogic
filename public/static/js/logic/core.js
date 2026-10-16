// ============================================================
//  Tiny Tautology — logic engine (propositional logic)
//  AST: {t:'top'|'bot'} | {t:'var',n} | {t:'not',a} | {t:'and'|'or'|'imp',a,b}
//  Precedence (lecture 1.3):  ⊃ < ∨ < ∧ < ¬   and LEFT associative.
// ============================================================

export const SYM = { not: '¬', and: '∧', or: '∨', imp: '⊃', top: '⊤', bot: '⊥' }
export const PREC = { imp: 1, or: 2, and: 3, not: 4, var: 5, top: 5, bot: 5 }
export const OPNAME = { not: '否定', and: '連言', or: '選言', imp: '含意' }

export const V = (n) => ({ t: 'var', n })
export const TOP = { t: 'top' }, BOT = { t: 'bot' }
export const Not = (a) => ({ t: 'not', a })
export const And = (a, b) => ({ t: 'and', a, b })
export const Or = (a, b) => ({ t: 'or', a, b })
export const Imp = (a, b) => ({ t: 'imp', a, b })

export class ParseError extends Error {
  constructor(msg, pos, hint) { super(msg); this.pos = pos; this.hint = hint }
}

// ---------- tokenizer ----------
export function tokenize(src) {
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
    if (three === '<->' || three === '<=>') throw new ParseError('⇔（同値）はこの講義の論理記号にはありません', i, '(A ⊃ B) ∧ (B ⊃ A) と書きましょう')
    if (three === '-->' || three === '==>') { push('op', 'imp', 3); continue }
    if (two === '->' || two === '=>') {
      push('op', 'imp', 2); continue
    }
    if (c === '→') { push('arrow', '→', 1); continue }
    if (c === '⊃' || c === '>') { push('op', 'imp', 1); continue }
    if (two === '/\\') { push('op', 'and', 2); continue }
    if (two === '\\/') { push('op', 'or', 2); continue }
    if (two === '&&') { push('op', 'and', 2); continue }
    if (two === '||') { push('op', 'or', 2); continue }
    if (c === '∧' || c === '&' || c === '^' || c === '・') { push('op', 'and', 1); continue }
    if (c === '∨' || c === '|' || c === '+') { push('op', 'or', 1); continue }
    if (c === '¬' || c === '~' || c === '!' || c === '-' || c === '￢') { push('not', 'not', 1); continue }
    if (c === '⊤' || c === '1') { push('const', 'top', 1); continue }
    if (c === '⊥' || c === '0') { push('const', 'bot', 1); continue }
    const word = /^[A-Za-z][A-Za-z0-9_']*/.exec(s.slice(i))
    if (word) {
      const w = word[0]
      if (/^(top|true)$/i.test(w)) { push('const', 'top', w.length); continue }
      if (/^(bot|false)$/i.test(w)) { push('const', 'bot', w.length); continue }
      if (w === 'v' || w === 'or') { push('op', 'or', w.length); continue }
      if (w === 'and') { push('op', 'and', w.length); continue }
      if (w === 'not') { push('not', 'not', w.length); continue }
      if (/^[a-z]/.test(w)) throw new ParseError(`「${w}」は命題記号として使えません`, i, '命題記号は大文字（P, Q, R, P1 …）で書きます')
      push('var', w, w.length); continue
    }
    throw new ParseError(`「${c}」は論理式に使えない文字です`, i, '使える記号: ¬ ∧ ∨ ⊃ ⊤ ⊥ ( )  ／ 代用入力: ~ & | -> など')
  }
  return toks
}

// ---------- parser (precedence climbing, left assoc) ----------
export function parse(src) {
  if (!src || !src.trim()) throw new ParseError('式が空です', 0, '例: P ∨ ¬P')
  const toks = tokenize(src)
  let k = 0
  const peek = () => toks[k]
  const end = () => k >= toks.length
  const posOf = (t) => (t ? t.pos : src.length)
  const opName = (v) => SYM[v]

  function primary() {
    const t = peek()
    if (!t) throw new ParseError('式が途中で終わっています', src.length, '演算子の後ろには論理式が必要です')
    if (t.type === 'not') { k++; return Not(primary()) }
    if (t.type === 'var') { k++; return V(t.val) }
    if (t.type === 'const') { k++; return t.val === 'top' ? TOP : BOT }
    if (t.type === '(') {
      k++
      if (peek() && peek().type === ')') throw new ParseError('( ) の中が空です', posOf(peek()), '括弧の中には論理式が必要です')
      const e = expr(0)
      if (!peek() || peek().type !== ')') throw new ParseError('閉じ括弧 ) が足りません', posOf(peek()), '( と ) の数をそろえましょう')
      k++
      return e
    }
    if (t.type === 'op') throw new ParseError(`「${opName(t.val)}」の左側に論理式がありません`, t.pos, `${opName(t.val)} は 2 つの論理式をつなぐ記号です（A ${opName(t.val)} B の形）`)
    if (t.type === ')') throw new ParseError('対応する ( がない ) があります', t.pos, '括弧の対応を確認しましょう')
    if (t.type === 'arrow') throw new ParseError('→ はシーケントの記号です', t.pos, '含意（ならば）は ⊃ を使います')
    throw new ParseError('ここに論理式が必要です', t.pos)
  }
  function expr(minP) {
    let lhs = primary()
    while (!end()) {
      const t = peek()
      if (t.type !== 'op') break
      const p = PREC[t.val]
      if (p < minP) break
      k++
      if (end()) throw new ParseError(`「${opName(t.val)}」の右側に論理式がありません`, src.length, `${opName(t.val)} は 2 つの論理式をつなぐ記号です`)
      const rhs = expr(p + 1) // left associative
      lhs = { t: t.val, a: lhs, b: rhs }
    }
    return lhs
  }
  const e = expr(0)
  if (!end()) {
    const t = peek()
    if (t.type === 'var' || t.type === 'const' || t.type === '(' || t.type === 'not')
      throw new ParseError('論理式が 2 つ並んでいます', t.pos, '間に ∧ ∨ ⊃ のどれかが必要です')
    if (t.type === ')') throw new ParseError('対応する ( がない ) があります', t.pos)
    if (t.type === ',') throw new ParseError('カンマは論理式の中では使えません', t.pos, 'シーケントの入力欄で使いましょう')
    throw new ParseError('ここで式が終わるはずです', t.pos)
  }
  return e
}

export function tryParse(src) {
  try { return { ok: true, f: parse(src) } } catch (e) { return { ok: false, err: e } }
}

// ---------- printing ----------
// show(f) -> minimal parens using lecture precedence + left assoc
export function show(f, opts = {}) {
  const full = opts.full
  const go = (f, ctx, side) => {
    let s
    switch (f.t) {
      case 'top': return '⊤'
      case 'bot': return '⊥'
      case 'var': return f.n
      case 'not': {
        const inner = go(f.a, PREC.not, 'u')
        return '¬' + inner
      }
      default: {
        const p = PREC[f.t]
        s = go(f.a, p, 'l') + ' ' + SYM[f.t] + ' ' + go(f.b, p, 'r')
        // "clear" style (default): parenthesize a binary child whose operator differs from
        // its parent's, plus same-op right children and nested ⊃. Strictly minimal with opts.min.
        let need
        if (full) need = ctx > 0
        else if (opts.min) need = p < ctx || (p === ctx && side === 'r')
        else need = ctx > 0 && ctx < PREC.not && side !== 'u'
        if (side === 'u') need = true
        return need ? '(' + s + ')' : s
      }
    }
  }
  return go(f, 0, null)
}
export const eq = (a, b) => show(a, { full: true }) === show(b, { full: true })

// ---------- structure ----------
export function vars(f, acc = new Set()) {
  if (f.t === 'var') acc.add(f.n)
  else if (f.t === 'not') vars(f.a, acc)
  else if (f.a) { vars(f.a, acc); vars(f.b, acc) }
  return acc
}
export function sortVars(set) {
  return [...set].sort((x, y) => {
    const order = 'PQRSTUVWXYZABCDEFGHIJKLMNO'
    const ix = order.indexOf(x[0]), iy = order.indexOf(y[0])
    return ix - iy || x.localeCompare(y, 'en', { numeric: true })
  })
}
export function subformulas(f) {
  const out = []
  const seen = new Set()
  const go = (g) => {
    if (g.a) go(g.a)
    if (g.b) go(g.b)
    const k = show(g, { full: true })
    if (!seen.has(k)) { seen.add(k); out.push(g) }
  }
  go(f)
  return out // ordered bottom-up (good for truth table columns)
}
export const size = (f) => (f.t === 'not' ? 1 + size(f.a) : f.a ? 1 + size(f.a) + size(f.b) : 1)
export const depth = (f) => (f.t === 'not' ? 1 + depth(f.a) : f.a ? 1 + Math.max(depth(f.a), depth(f.b)) : 0)

// ---------- semantics ----------
export function evaluate(f, I) {
  switch (f.t) {
    case 'top': return true
    case 'bot': return false
    case 'var': return !!I[f.n]
    case 'not': return !evaluate(f.a, I)
    case 'and': return evaluate(f.a, I) && evaluate(f.b, I)
    case 'or': return evaluate(f.a, I) || evaluate(f.b, I)
    case 'imp': return !evaluate(f.a, I) || evaluate(f.b, I)
  }
}
// rows in lecture order: ⊤ first (TT, T⊥, ⊥T, ⊥⊥)
export function interpretations(vs) {
  const n = vs.length, rows = []
  for (let m = 0; m < 1 << n; m++) {
    const I = {}
    vs.forEach((v, i) => { I[v] = !((m >> (n - 1 - i)) & 1) })
    rows.push(I)
  }
  return rows
}
export function truthTable(fs) {
  const list = Array.isArray(fs) ? fs : [fs]
  const vset = new Set()
  list.forEach((f) => vars(f, vset))
  const vs = sortVars(vset)
  const rows = interpretations(vs).map((I) => ({ I, vals: list.map((f) => evaluate(f, I)) }))
  return { vars: vs, rows }
}
export function classify(f) {
  const { rows } = truthTable(f)
  const t = rows.filter((r) => r.vals[0]).length
  if (t === rows.length) return { kind: 'valid', label: '恒真（トートロジ）', t, n: rows.length }
  if (t === 0) return { kind: 'unsat', label: '充足不能', t, n: rows.length }
  return { kind: 'sat', label: '充足可能（恒真ではない）', t, n: rows.length }
}
export function equivalent(f, g) {
  const { rows } = truthTable([f, g])
  const diff = rows.find((r) => r.vals[0] !== r.vals[1])
  return { ok: !diff, counter: diff ? diff.I : null }
}
export const fmtI = (I) => Object.entries(I).map(([k, v]) => `${k}=${v ? '⊤' : '⊥'}`).join(', ')

// ============================================================
//  CNF conversion — step by step (lecture §3: (1)⊃除去 (2)¬を内側へ (3)分配 (4)その他)
// ============================================================
const isLit = (f) => f.t === 'var' || (f.t === 'not' && f.a.t === 'var')

// rewrite the first (outermost, left-most) redex matched by rule; returns {f, path} or null
function rewriteOnce(f, rule, path = []) {
  const r = rule(f)
  if (r) return { f: r.f, name: r.name, law: r.law, path, before: f, after: r.f }
  if (f.t === 'not') {
    const x = rewriteOnce(f.a, rule, [...path, 'a'])
    if (x) return { ...x, f: Not(x.f) }
  } else if (f.a) {
    const x = rewriteOnce(f.a, rule, [...path, 'a'])
    if (x) return { ...x, f: { t: f.t, a: x.f, b: f.b } }
    const y = rewriteOnce(f.b, rule, [...path, 'b'])
    if (y) return { ...y, f: { t: f.t, a: f.a, b: y.f } }
  }
  return null
}
const R_IMP = (f) => (f.t === 'imp' ? { f: Or(Not(f.a), f.b), name: '⊃ を除去', law: 'α ⊃ β = ¬α ∨ β（含意）' } : null)
const R_NEG = (f) => {
  if (f.t !== 'not') return null
  const g = f.a
  if (g.t === 'not') return { f: g.a, name: '二重否定', law: '¬(¬α) = α' }
  if (g.t === 'and') return { f: Or(Not(g.a), Not(g.b)), name: 'ド・モルガン', law: '¬(α ∧ β) = ¬α ∨ ¬β' }
  if (g.t === 'or') return { f: And(Not(g.a), Not(g.b)), name: 'ド・モルガン', law: '¬(α ∨ β) = ¬α ∧ ¬β' }
  if (g.t === 'top') return { f: BOT, name: '定数の否定', law: '¬⊤ = ⊥' }
  if (g.t === 'bot') return { f: TOP, name: '定数の否定', law: '¬⊥ = ⊤' }
  return null
}
const R_DIST = (f) => {
  if (f.t !== 'or') return null
  if (f.b.t === 'and') return { f: And(Or(f.a, f.b.a), Or(f.a, f.b.b)), name: '分配則', law: 'α ∨ (β ∧ γ) = (α ∨ β) ∧ (α ∨ γ)' }
  if (f.a.t === 'and') return { f: And(Or(f.a.a, f.b), Or(f.a.b, f.b)), name: '分配則', law: '(β ∧ γ) ∨ α = (β ∨ α) ∧ (γ ∨ α)' }
  return null
}
const R_CONST = (f) => {
  if (f.t === 'and') {
    if (f.b.t === 'top') return { f: f.a, name: '⊤ を消す', law: 'α ∧ ⊤ = α' }
    if (f.a.t === 'top') return { f: f.b, name: '⊤ を消す', law: '⊤ ∧ α = α' }
    if (f.a.t === 'bot' || f.b.t === 'bot') return { f: BOT, name: '⊥ が吸収', law: 'α ∧ ⊥ = ⊥' }
  }
  if (f.t === 'or') {
    if (f.b.t === 'bot') return { f: f.a, name: '⊥ を消す', law: 'α ∨ ⊥ = α' }
    if (f.a.t === 'bot') return { f: f.b, name: '⊥ を消す', law: '⊥ ∨ α = α' }
    if (f.a.t === 'top' || f.b.t === 'top') return { f: TOP, name: '⊤ が吸収', law: 'α ∨ ⊤ = ⊤' }
  }
  return null
}

// clause-level helpers
export const litStr = (f) => (f.t === 'var' ? f.n : '¬' + f.a.n)
export const negLit = (l) => (l.startsWith('¬') ? l.slice(1) : '¬' + l)
const flatten = (f, op, out = []) => { if (f.t === op) { flatten(f.a, op, out); flatten(f.b, op, out) } else out.push(f); return out }

// returns clause set from a CNF formula (array of arrays of literal strings); null if not CNF
export function cnfToClauses(f) {
  if (f.t === 'top') return []
  if (f.t === 'bot') return [[]]
  const cls = []
  for (const c of flatten(f, 'and')) {
    if (c.t === 'bot') { cls.push([]); continue }
    if (c.t === 'top') continue
    const lits = flatten(c, 'or')
    if (!lits.every(isLit)) return null
    cls.push([...new Set(lits.map(litStr))])
  }
  return cls
}
export function isCNF(f) { return cnfToClauses(f) !== null }

export function clausesToFormula(cls) {
  if (!cls.length) return TOP
  const toF = (l) => (l.startsWith('¬') ? Not(V(l.slice(1))) : V(l))
  return cls.map((c) => (c.length ? c.map(toF).reduce((a, b) => Or(a, b)) : BOT)).reduce((a, b) => And(a, b))
}

export function toCNFSteps(f0) {
  const steps = [{ phase: 0, f: f0, name: '出発', law: '' }]
  const phases = [
    { id: 1, title: '(1) ⊃ を除去', rule: R_IMP },
    { id: 2, title: '(2) ¬ を内側へ', rule: R_NEG },
    { id: 3, title: '(3) 分配則', rule: R_DIST },
  ]
  let f = f0
  for (const ph of phases) {
    let guard = 0
    while (guard++ < 400) {
      const r = rewriteOnce(f, ph.rule)
      if (!r) break
      steps.push({ phase: ph.id, phaseTitle: ph.title, f: r.f, prev: f, name: r.name, law: r.law, path: r.path, before: r.before, after: r.after })
      f = r.f
    }
  }
  // (4) constants + simplify clauses
  let guard = 0
  while (guard++ < 200) {
    const r = rewriteOnce(f, R_CONST)
    if (!r) break
    steps.push({ phase: 4, phaseTitle: '(4) その他の規則', f: r.f, prev: f, name: r.name, law: r.law, path: r.path, before: r.before, after: r.after })
    f = r.f
  }
  const cls = cnfToClauses(f)
  if (cls) {
    const notes = []
    let simp = cls.map((c) => {
      const u = [...new Set(c)]
      if (u.length < c.length) notes.push('同じリテラルを 1 つに（α ∨ α = α）')
      return u
    })
    const before = simp.length
    simp = simp.filter((c) => !c.some((l) => c.includes(negLit(l))))
    if (simp.length < before) notes.push('P ∨ ¬P を含む節は ⊤ なので消す（α ∨ ¬α = ⊤, α ∧ ⊤ = α）')
    const seen = new Set()
    const ded = []
    simp.forEach((c) => { const k = [...c].sort().join('|'); if (!seen.has(k)) { seen.add(k); ded.push(c) } })
    if (ded.length < simp.length) notes.push('同じ節を 1 つに（α ∧ α = α）')
    if (notes.length) {
      const nf = clausesToFormula(ded)
      if (!eq(nf, f)) {
        steps.push({ phase: 4, phaseTitle: '(4) その他の規則', f: nf, prev: f, name: '整理', law: [...new Set(notes)].join(' ／ ') })
        f = nf
      }
    }
  }
  return { steps, result: f, clauses: cnfToClauses(f) }
}
export const toCNF = (f) => toCNFSteps(f).result

// path helpers for highlighting
export function getAt(f, path) { return path.reduce((g, k) => g[k], f) }

// ============================================================
//  Resolution
// ============================================================
export const clauseKey = (c) => [...c].sort().join('|')
export const showClause = (c) => (c.length ? c.join(' ∨ ') : '⊥')

// resolve on literal symbol P (c1 has P, c2 has ¬P or vice versa)
export function resolve(c1, c2) {
  const outs = []
  for (const l of c1) {
    if (c2.includes(negLit(l))) {
      const r = [...new Set([...c1.filter((x) => x !== l), ...c2.filter((x) => x !== negLit(l))])]
      outs.push({ on: l.replace('¬', ''), lit: l, res: r, taut: r.some((x) => r.includes(negLit(x))) })
    }
  }
  return outs
}

// saturating refutation; returns {found, nodes, proof}
export function refute(clauses, limit = 600) {
  const nodes = clauses.map((c, i) => ({ id: i, c: [...new Set(c)], parents: null }))
  const keys = new Map(nodes.map((n) => [clauseKey(n.c), n.id]))
  const empty0 = nodes.find((n) => n.c.length === 0)
  if (empty0) return { found: true, nodes, proof: proofFrom(nodes, empty0.id) }
  let i = 0
  while (i < nodes.length && nodes.length < limit) {
    for (let j = 0; j < i; j++) {
      for (const r of resolve(nodes[j].c, nodes[i].c)) {
        if (r.taut) continue
        const k = clauseKey(r.res)
        if (keys.has(k)) continue
        const n = { id: nodes.length, c: r.res, parents: [j, i], on: r.on }
        nodes.push(n); keys.set(k, n.id)
        if (!r.res.length) return { found: true, nodes, proof: proofFrom(nodes, n.id) }
      }
    }
    i++
  }
  return { found: false, nodes, proof: null }
}
function proofFrom(nodes, id) {
  const used = new Set()
  const walk = (k) => { if (used.has(k)) return; used.add(k); const n = nodes[k]; if (n.parents) n.parents.forEach(walk) }
  walk(id)
  return [...used].sort((a, b) => a - b).map((k) => nodes[k])
}

// ============================================================
//  Sequents & LK (Wang's algorithm)
//  sequent: {L:[f...], R:[f...]}
// ============================================================
export const isAtomic = (f) => f.t === 'var'
export function showSeq(s) {
  const side = (xs) => xs.map((f) => show(f)).join(', ')
  return `${side(s.L)}${s.L.length ? ' ' : ''}→${s.R.length ? ' ' : ''}${side(s.R)}`
}
export function parseSequent(src) {
  const idx = src.search(/→|=>|\|-|⊢|⇒/)
  let lhs = '', rhs = src
  if (idx >= 0) {
    const m = src.slice(idx).match(/^(→|=>|\|-|⊢|⇒)/)
    lhs = src.slice(0, idx); rhs = src.slice(idx + m[0].length)
  } else {
    // allow "->" only if used once as sequent arrow? Treat whole as formula on right
  }
  const split = (s) => s.split(/[,，、]/).map((x) => x.trim()).filter(Boolean).map(parse)
  return { L: split(lhs), R: split(rhs) }
}
export function isInitial(s) {
  if (![...s.L, ...s.R].every(isAtomic)) return false
  return s.L.some((a) => s.R.some((b) => a.n === b.n))
}
// Decompose the formula at side/index; returns {rule, premises:[seq...]}
export function decompose(s, side, i) {
  const f = s[side][i]
  const L = s.L.filter((_, k) => !(side === 'L' && k === i))
  const R = s.R.filter((_, k) => !(side === 'R' && k === i))
  if (side === 'L') {
    switch (f.t) {
      case 'not': return { rule: '¬左', premises: [{ L, R: [...R, f.a] }] }
      case 'and': return { rule: '∧左', premises: [{ L: [f.a, f.b, ...L], R }] }
      case 'or': return { rule: '∨左', premises: [{ L: [f.a, ...L], R }, { L: [f.b, ...L], R }] }
      case 'imp': return { rule: '⊃左', premises: [{ L, R: [...R, f.a] }, { L: [f.b, ...L], R }] }
      case 'top': return { rule: '⊤左', premises: [{ L, R }], ext: true }
      case 'bot': return { rule: '⊥左', premises: [], ext: true }
    }
  } else {
    switch (f.t) {
      case 'not': return { rule: '¬右', premises: [{ L: [f.a, ...L], R }] }
      case 'and': return { rule: '∧右', premises: [{ L, R: [...R, f.a] }, { L, R: [...R, f.b] }] }
      case 'or': return { rule: '∨右', premises: [{ L, R: [...R, f.a, f.b] }] }
      case 'imp': return { rule: '⊃右', premises: [{ L: [f.a, ...L], R: [...R, f.b] }] }
      case 'top': return { rule: '⊤右', premises: [], ext: true }
      case 'bot': return { rule: '⊥右', premises: [{ L, R }], ext: true }
    }
  }
  return null
}
export function firstCompound(s) {
  // Wang: choose a compound formula; prefer non-branching rules first (smaller trees)
  const cands = []
  s.L.forEach((f, i) => { if (!isAtomic(f)) cands.push({ side: 'L', i, branch: f.t === 'or' || f.t === 'imp' }) })
  s.R.forEach((f, i) => { if (!isAtomic(f)) cands.push({ side: 'R', i, branch: f.t === 'and' }) })
  if (!cands.length) return null
  return cands.find((c) => !c.branch) || cands[0]
}
// returns proof tree {seq, rule, kids, status: 'axiom'|'fail'|'ok'|'bad', counter}
export function wang(s, strategy = firstCompound, depthLimit = 60) {
  const go = (s, d) => {
    const pick = strategy(s)
    if (!pick || d > depthLimit) {
      if (isInitial(s)) return { seq: s, rule: null, kids: [], status: 'axiom' }
      const I = {}
      s.L.forEach((a) => { if (a.t === 'var') I[a.n] = true })
      s.R.forEach((a) => { if (a.t === 'var' && !(a.n in I)) I[a.n] = false })
      return { seq: s, rule: null, kids: [], status: 'fail', counter: I }
    }
    const dec = decompose(s, pick.side, pick.i)
    const kids = dec.premises.map((p) => go(p, d + 1))
    const ok = kids.every((k) => k.status === 'axiom' || k.status === 'ok')
    return { seq: s, rule: dec.rule, pick, kids, status: ok ? 'ok' : 'bad', ext: dec.ext }
  }
  return go(s, 0)
}
export function treeOk(t) { return t.status === 'ok' || t.status === 'axiom' }
export function findCounter(t) {
  if (t.status === 'fail') return t.counter
  for (const k of t.kids || []) { const c = findCounter(k); if (c) return c }
  return null
}
export function sequentFormula(s) {
  const l = s.L.length ? s.L.reduce((a, b) => And(a, b)) : TOP
  const r = s.R.length ? s.R.reduce((a, b) => Or(a, b)) : BOT
  return Imp(l, r)
}
