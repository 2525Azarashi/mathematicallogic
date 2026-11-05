// ============================================================
//  1 階述語論理（続き）— 講義ノート 第2部 1.5〜3.1
//   ・代入・合成・単一化（Robinson の不一致集合）・mgu
//   ・論理的同値の変形 → 冠頭形 → Skolem 化 → 節集合
//   ・エルブラン領域 / 基礎例 / 命題論理としての充足不能判定
//   ・1 階述語論理の導出（反駁）
//   ・1 階述語論理の LK（∀∃ 規則・変数条件・contraction）と自動証明
// ============================================================
import { parseFol, showFol, showTerm, Var, Const, Fn, Pred, FNot, All, Ex, freeVars, termVars, subst, signature, tuples, FolError } from './fol.js'

const And = (a, b) => ({ t: 'and', a, b })
const Or = (a, b) => ({ t: 'or', a, b })

// ---------- 代入 θ = { v: t } ----------
export function applyT(t, s) {
  if (t.t === 'var') return t.n in s ? s[t.n] : t
  if (t.t === 'fn') return Fn(t.n, t.args.map((a) => applyT(a, s)))
  return t
}
// 量化記号を含まない式への代入（同時置換）
export function applyF(f, s) {
  switch (f.t) {
    case 'pred': return Pred(f.n, f.args.map((t) => applyT(t, s)))
    case 'not': return FNot(applyF(f.a, s))
    case 'and': case 'or': case 'imp': return { t: f.t, a: applyF(f.a, s), b: applyF(f.b, s) }
    default: return f
  }
}
export const applyL = (l, s) => ({ neg: l.neg, a: applyF(l.a, s) })
// 合成 θ2θ1：θ1 をほどこしてから θ2 をほどこす
export function compose(s1, s2) {
  const r = {}
  for (const [v, t] of Object.entries(s1)) { const u = applyT(t, s2); if (!(u.t === 'var' && u.n === v)) r[v] = u }
  for (const [v, t] of Object.entries(s2)) if (!(v in s1)) r[v] = t
  return r
}
export const showSub = (s) => { const e = Object.entries(s); return e.length ? `{${e.map(([v, t]) => `${v} := ${showTerm(t)}`).join(', ')}}` : '{ }' }
export const occurs = (v, t) => termVars(t).has(v)
const tstr = (t) => (t.t === 'pred' ? showFol(t) : showTerm(t))
const headKey = (t) => (t.t === 'var' ? 'v:' + t.n : (t.t === 'pred' ? 'p:' : 'f:') + t.n + '/' + (t.args ? t.args.length : 0))

// 不一致集合（左から見て最初に食い違う位置の部分項の集合）
function disagreement(ts) {
  const s0 = tstr(ts[0])
  if (ts.every((t) => tstr(t) === s0)) return null
  const k0 = headKey(ts[0])
  if (ts.some((t) => t.t === 'var') || ts.some((t) => headKey(t) !== k0)) {
    const m = new Map(); ts.forEach((t) => m.set(tstr(t), t)); return [...m.values()]
  }
  for (let i = 0; i < ts[0].args.length; i++) { const d = disagreement(ts.map((t) => t.args[i])); if (d) return d }
  return null
}
// 単一化（mgu を求める）— steps に過程を記録
export function unify(exprs) {
  let s = {}
  const steps = []
  for (let g = 0; g < 80; g++) {
    const cur = exprs.map((e) => (e.t === 'pred' ? applyF(e, s) : applyT(e, s)))
    const strs = cur.map(tstr)
    const D = disagreement(cur)
    if (!D) { steps.push({ cur: strs, done: true, sub: s }); return { ok: true, mgu: s, steps } }
    const Ds = D.map(tstr)
    const v = D.find((t) => t.t === 'var')
    if (!v) { steps.push({ cur: strs, D: Ds, fail: 'clash' }); return { ok: false, steps, reason: `${Ds.join(' と ')} は記号そのものが違う（どちらも変数ではないので、代入では一致させられない）` } }
    const t = D.find((u) => u !== v && !occurs(v.n, u))
    if (!t) { steps.push({ cur: strs, D: Ds, fail: 'occurs' }); return { ok: false, steps, reason: `出現検査（occur check）で失敗：${v.n} を ${Ds.filter((x) => x !== v.n)[0]} に置きかえると、右辺にも ${v.n} があるので永遠に一致しない` } }
    const b = { [v.n]: t }
    steps.push({ cur: strs, D: Ds, bind: b })
    s = compose(s, b)
  }
  return { ok: false, steps, reason: '手順が長すぎます' }
}

// ---------- 名前の管理 ----------
export function freshName(base, used) {
  if (!used.has(base)) { used.add(base); return base }
  const b = base.replace(/[0-9₀-₉]+$/, '')
  if (!used.has(b)) { used.add(b); return b }
  for (let i = 1; ; i++) { const n = b + i; if (!used.has(n)) { used.add(n); return n } }
}
function allVarNames(f, out = new Set()) {
  const tv = (t) => termVars(t, out)
  switch (f.t) {
    case 'pred': f.args.forEach(tv); break
    case 'not': allVarNames(f.a, out); break
    case 'and': case 'or': case 'imp': allVarNames(f.a, out); allVarNames(f.b, out); break
    case 'all': case 'ex': out.add(f.x); allVarNames(f.a, out); break
  }
  return out
}

// ---------- 論理的同値な変形（1.6）→ 冠頭形（1.7）→ Skolem 化 → 節 ----------
export function elimImp(f) {
  switch (f.t) {
    case 'imp': return Or(FNot(elimImp(f.a)), elimImp(f.b))
    case 'not': return FNot(elimImp(f.a))
    case 'and': case 'or': return { t: f.t, a: elimImp(f.a), b: elimImp(f.b) }
    case 'all': case 'ex': return { t: f.t, x: f.x, a: elimImp(f.a) }
    default: return f
  }
}
export function nnf(f) {
  switch (f.t) {
    case 'not': {
      const g = f.a
      switch (g.t) {
        case 'not': return nnf(g.a)
        case 'and': return Or(nnf(FNot(g.a)), nnf(FNot(g.b)))
        case 'or': return And(nnf(FNot(g.a)), nnf(FNot(g.b)))
        case 'imp': return And(nnf(g.a), nnf(FNot(g.b)))
        case 'all': return Ex(g.x, nnf(FNot(g.a)))
        case 'ex': return All(g.x, nnf(FNot(g.a)))
        case 'top': return { t: 'bot' }
        case 'bot': return { t: 'top' }
        default: return f
      }
    }
    case 'imp': return Or(nnf(FNot(f.a)), nnf(f.b))
    case 'and': case 'or': return { t: f.t, a: nnf(f.a), b: nnf(f.b) }
    case 'all': case 'ex': return { t: f.t, x: f.x, a: nnf(f.a) }
    default: return f
  }
}
export function renameApart(f, used = new Set(freeVars(f))) {
  const go = (f, env) => {
    switch (f.t) {
      case 'pred': return Pred(f.n, f.args.map((t) => applyT(t, env)))
      case 'not': return FNot(go(f.a, env))
      case 'and': case 'or': case 'imp': return { t: f.t, a: go(f.a, env), b: go(f.b, env) }
      case 'all': case 'ex': { const n = freshName(f.x, used); return { t: f.t, x: n, a: go(f.a, { ...env, [f.x]: Var(n) }) } }
      default: return f
    }
  }
  return go(f, {})
}
// NNF かつ束縛変数が互いに異なる式から量化記号を左から順に前へ出す
export function pullQuant(f, pref = []) {
  if (f.t === 'all' || f.t === 'ex') { pref.push({ q: f.t, x: f.x }); return pullQuant(f.a, pref) }
  if (f.t === 'and' || f.t === 'or') { const a = pullQuant(f.a, pref); const b = pullQuant(f.b, pref); return { t: f.t, a, b } }
  return f
}
export const withPrefix = (pref, m) => pref.reduceRight((g, { q, x }) => ({ t: q, x, a: g }), m)
function sigNames(f) { const { consts, fns, preds } = signature(f); return new Set([...consts, ...fns.keys(), ...preds.keys()].map((s) => s.toLowerCase())) }
function nextName(cands, used) {
  for (const c of cands) if (!used.has(c)) { used.add(c); return c }
  return freshName(cands[0], used)
}
// 冠頭形 Q1x1…QnxnA0 の Skolem 化（ノートの (i)(ii) のとおり）
export function skolemize(pref, matrix, used) {
  const univ = [], map = {}, made = []
  for (const { q, x } of pref) {
    if (q === 'all') { univ.push(x); continue }
    const t = univ.length ? Fn(nextName(['f', 'g', 'h', 'k'], used), univ.map(Var)) : Const(nextName(['c', 'd', 'e'], used))
    map[x] = t; made.push({ x, t, deps: [...univ] })
  }
  return { prefix: pref.filter((p) => p.q === 'all'), matrix: applyF(matrix, map), made }
}
export const showLit = (l) => (l.neg ? '¬' : '') + showFol(l.a)
export const showClause = (c) => (c.length ? c.map(showLit).join(' ∨ ') : '⊥')
const dedupeLits = (c) => { const m = new Map(); c.forEach((l) => m.set(showLit(l), l)); return [...m.values()] }
const isTaut = (c) => c.some((l) => c.some((m) => m.neg !== l.neg && showFol(m.a) === showFol(l.a)))
function cnfOf(f) {
  switch (f.t) {
    case 'and': return [...cnfOf(f.a), ...cnfOf(f.b)]
    case 'or': { const A = cnfOf(f.a), B = cnfOf(f.b), r = []; A.forEach((a) => B.forEach((b) => r.push([...a, ...b]))); return r }
    case 'not': return f.a.t === 'pred' ? [[{ neg: true, a: f.a }]] : f.a.t === 'top' ? [[]] : []
    case 'pred': return [[{ neg: false, a: f }]]
    case 'top': return []
    case 'bot': return [[]]
  }
  return []
}
export function toClauses(matrix) {
  const out = [], keys = new Set()
  cnfOf(matrix).map(dedupeLits).forEach((c) => { if (isTaut(c)) return; const k = clauseKey(c); if (!keys.has(k)) { keys.add(k); out.push(c) } })
  return out
}
// 変形の全工程（2.3 の (1)〜(3)）
export function clausify(f0, { negate = false } = {}) {
  const steps = []
  let f = f0
  const push = (k, label, g, note) => { if (!steps.length || showFol(steps[steps.length - 1].f) !== showFol(g)) steps.push({ k, label, f: g, note }) }
  steps.push({ k: 'start', label: '与えられた論理式', f })
  const fv = [...freeVars(f)]
  if (fv.length) { f = fv.reduceRight((g, x) => All(x, g), f); push('close', '全称閉包（自由変数を ∀ で閉じる）', f, '恒真性は全称閉包と同じ（第6回の定理）') }
  if (negate) { f = FNot(f); push('neg', '(1) 否定する', f) }
  const f1 = elimImp(f); push('imp', '⊃ を消す', f1, 'A ⊃ B ≡ ¬A ∨ B')
  const f2 = nnf(f1); push('nnf', '¬ を内側へ', f2, 'ド・モルガン則・¬∀xα ≡ ∃x¬α・¬∃xα ≡ ∀x¬α')
  const f3 = renameApart(f2); push('ren', '束縛変数の名前をつけかえる', f3, 'Qxα[x] ≡ Qyα[y]（量化記号ごとに別の名前に）')
  const pref = []; const mat = pullQuant(f3, pref)
  const f4 = withPrefix(pref, mat); push('prenex', '(2) 冠頭形にする', f4, '量化記号の移動：Qxα[x] ∧ β ≡ Qx(α[x] ∧ β) など')
  const used = sigNames(f0)
  const sk = skolemize(pref, mat, used)
  const f5 = withPrefix(sk.prefix, sk.matrix)
  if (sk.made.length) steps.push({ k: 'skolem', label: '(3) Skolem 化', f: f5, note: sk.made.map((m) => `${m.x} → ${showTerm(m.t)}${m.deps.length ? `（前にある ∀${m.deps.join(', ∀')} に依存）` : '（前に ∀ がない → 定数）'}`).join('　') })
  const clauses = toClauses(sk.matrix)
  return { steps, clauses, prenex: f4, prefix: pref, skolem: sk, matrix: sk.matrix }
}

// ---------- 節の道具 ----------
export function clauseVars(c, s = new Set()) { c.forEach((l) => (l.a.args || []).forEach((t) => termVars(t, s))); return s }
const VRE = /(^|[^A-Za-z0-9_])([u-z][a-z0-9_'₀-₉]*)(?![A-Za-z0-9_(])/g
export function clauseKey(c) {
  const skel = (l) => showLit(l).replace(VRE, '$1_')
  const sorted = [...c].sort((a, b) => (skel(a) < skel(b) ? -1 : skel(a) > skel(b) ? 1 : 0))
  const map = {}; let k = 0
  sorted.forEach((l) => (l.a.args || []).forEach((t) => termVars(t, new Set()).forEach(() => {})))
  const order = []
  const walk = (t) => { if (t.t === 'var') { if (!(t.n in map)) { map[t.n] = Var('v' + k++); order.push(t.n) } } else if (t.t === 'fn') t.args.forEach(walk) }
  sorted.forEach((l) => (l.a.args || []).forEach(walk))
  return [...new Set(sorted.map((l) => showLit(applyL(l, map))))].sort().join(' | ')
}
// 節の読み込み：「P(x) ∨ ¬Q(x, a)」形式（⊥ / 空 は空節）
export function parseClause(src) {
  const s = src.trim()
  if (!s || s === '⊥' || s === '□') return []
  const f = parseFol(s)
  const lits = []
  const go = (g) => {
    if (g.t === 'or') { go(g.a); go(g.b) }
    else if (g.t === 'pred') lits.push({ neg: false, a: g })
    else if (g.t === 'not' && g.a.t === 'pred') lits.push({ neg: true, a: g.a })
    else throw new FolError('節はリテラル（P(…) または ¬P(…)）を ∨ でつないだ形で書きます', 0)
  }
  go(f)
  return dedupeLits(lits)
}
const termDepth = (t) => (t.t === 'fn' ? 1 + Math.max(...t.args.map(termDepth)) : 0)
const clauseDepth = (c) => Math.max(0, ...c.flatMap((l) => (l.a.args || []).map(termDepth)))

// C1 と C2 の導出節をすべて（C2 の変数は必要ならつけかえて共通変数をなくす）
export function resolvents(c1, c2) {
  const v1 = clauseVars(c1), v2 = clauseVars(c2)
  const used = new Set([...v1, ...v2])
  const ren = {}
  ;[...v2].forEach((v) => { if (v1.has(v)) ren[v] = Var(freshName(v, used)) })
  const d2 = c2.map((l) => applyL(l, ren))
  const out = []
  c1.forEach((l1, i) => d2.forEach((l2, j) => {
    if (l1.neg === l2.neg || l1.a.n !== l2.a.n || l1.a.args.length !== l2.a.args.length) return
    const u = unify([l1.a, l2.a])
    if (!u.ok) return
    const res = dedupeLits([...c1.filter((_, k) => k !== i), ...d2.filter((_, k) => k !== j)].map((l) => applyL(l, u.mgu)))
    out.push({ res, mgu: u.mgu, steps: u.steps, i, j, ren, c2r: d2, taut: isTaut(res), on: [showLit(l1), showLit(l2)] })
  }))
  return out
}
// 反駁（幅優先の飽和）。maxNew 個まで導出節を作る
export function refuteFol(clauses0, { maxNew = 260, maxLits = 5, maxDepth = 3 } = {}) {
  const nodes = [], keys = new Set()
  let pruned = false
  const add = (c, parents, info = {}) => { const k = clauseKey(c); if (keys.has(k)) return null; keys.add(k); const n = { id: nodes.length + 1, c, parents, ...info }; nodes.push(n); return n }
  clauses0.forEach((c) => add(c, null))
  const trace = (n) => { const need = new Set(), st = [n]; while (st.length) { const x = st.pop(); if (need.has(x.id)) continue; need.add(x.id); (x.parents || []).forEach((p) => st.push(nodes[p - 1])) } return nodes.filter((x) => need.has(x.id)) }
  const empty0 = nodes.find((n) => !n.c.length)
  if (empty0) return { found: true, nodes, proof: [empty0] }
  const limit = clauses0.length + maxNew
  for (let j = 1; j < nodes.length; j++) {
    for (let a = 0; a < j; a++) {
      for (const r of resolvents(nodes[a].c, nodes[j].c)) {
        if (r.taut) continue
        if (r.res.length > maxLits || clauseDepth(r.res) > maxDepth) { pruned = true; continue }
        const n = add(r.res, [nodes[a].id, nodes[j].id], { mgu: r.mgu, ren: r.ren, on: r.on })
        if (n && !n.c.length) return { found: true, nodes, proof: trace(n) }
        if (nodes.length >= limit) return { found: false, nodes, limit: true }
      }
    }
  }
  return { found: false, nodes, saturated: !pruned, pruned }
}

// ---------- エルブラン（1.5） ----------
export function clauseSig(clauses) {
  const consts = new Set(), fns = new Map(), preds = new Map()
  const tm = (t) => { if (t.t === 'const') consts.add(t.n); else if (t.t === 'fn') { fns.set(t.n, t.args.length); t.args.forEach(tm) } }
  clauses.forEach((c) => c.forEach((l) => { preds.set(l.a.n, l.a.args.length); l.a.args.forEach(tm) }))
  return { consts, fns, preds }
}
export function herbrandUniverse(clauses, levels = 2, cap = 60) {
  const { consts, fns } = clauseSig(clauses)
  let H0 = [...consts].sort().map(Const)
  const dummy = !H0.length
  if (dummy) H0 = [Const('a')]
  const lv = [H0], seen = new Set(H0.map(showTerm))
  let all = [...H0], truncated = false
  for (let i = 1; i <= levels; i++) {
    const add = []
    for (const [f, k] of fns) {
      for (const ix of tuples(all.length, k)) {
        const t = Fn(f, ix.map((j) => all[j])), s = showTerm(t)
        if (seen.has(s)) continue
        if (seen.size >= cap) { truncated = true; break }
        seen.add(s); add.push(t)
      }
    }
    lv.push(add); all = all.concat(add)
  }
  return { levels: lv, all, dummy, truncated, finite: !fns.size }
}
export function herbrandBase(clauses, H, cap = 40) {
  const { preds } = clauseSig(clauses)
  const out = []
  for (const [p, k] of preds) for (const ix of tuples(H.length, k)) { if (out.length >= cap) return { atoms: out, truncated: true }; out.push(Pred(p, ix.map((j) => H[j]))) }
  return { atoms: out, truncated: false }
}
export function groundInstances(clauses, H, cap = 400) {
  const out = []
  clauses.forEach((c, ci) => {
    const vs = [...clauseVars(c)]
    for (const ix of tuples(H.length, vs.length)) {
      if (out.length >= cap) return
      const s = Object.fromEntries(vs.map((v, i) => [v, H[ix[i]]]))
      out.push({ ci, sub: s, c: dedupeLits(c.map((l) => applyL(l, s))) })
    }
  })
  return out
}
// 命題論理としての充足可能性（基礎リテラル = 命題記号）
function dpll(cls) {
  if (!cls.length) return true
  if (cls.some((c) => !c.length)) return false
  const unit = cls.find((c) => c.length === 1)
  const lit = unit ? unit[0] : cls[0][0]
  const asg = (k, neg) => cls.filter((c) => !c.some((m) => m.k === k && m.neg === neg)).map((c) => c.filter((m) => m.k !== k))
  if (dpll(asg(lit.k, lit.neg))) return true
  if (unit) return false
  return dpll(asg(lit.k, !lit.neg))
}
const toProp = (gc) => gc.map((l) => ({ k: showFol(l.a), neg: l.neg }))
export const groundSat = (gcs) => dpll(gcs.map(toProp))
export function minimalUnsat(insts) {
  let cur = [...insts]
  if (groundSat(cur.map((x) => x.c))) return null
  for (let i = cur.length - 1; i >= 0; i--) { const t = cur.filter((_, k) => k !== i); if (!groundSat(t.map((x) => x.c))) cur = t }
  return cur
}

// ---------- 1 階述語論理の LK（3.1） ----------
function splitTop(s) {
  const out = []; let d = 0, cur = ''
  for (const ch of s) { if (ch === '(' || ch === '（') d++; if (ch === ')' || ch === '）') d--; if ((ch === ',' || ch === '，') && d === 0) { out.push(cur); cur = '' } else cur += ch }
  out.push(cur)
  return out
}
export function parseFolSeq(src) {
  const parts = src.split(/→|=>|⊢/)
  if (parts.length > 2) throw new FolError('矢印 → は 1 つだけ', 0)
  const [lhs, rhs] = parts.length === 1 ? ['', parts[0]] : parts
  const side = (x) => (x.trim() ? splitTop(x).map((p) => { if (!p.trim()) throw new FolError('カンマの間が空です', 0); return parseFol(p) }) : [])
  return { L: side(lhs), R: side(rhs) }
}
export function tryFolSeq(src) { try { return { ok: true, s: parseFolSeq(src) } } catch (e) { return { ok: false, err: e } } }
export const showFolSeq = (s) => `${s.L.map(showFol).join(', ')}${s.L.length ? ' ' : ''}→${s.R.length ? ' ' : ''}${s.R.map(showFol).join(', ')}`
export const isAtomF = (f) => f.t === 'pred' || f.t === 'top' || f.t === 'bot'
export function isInitialF(s) {
  if (![...s.L, ...s.R].every(isAtomF)) return false
  const R = new Set(s.R.map(showFol))
  return s.L.some((a) => R.has(showFol(a)))
}
export function seqFree(s) { const o = new Set(); [...s.L, ...s.R].forEach((f) => freeVars(f).forEach((v) => o.add(v))); return o }
function seqAllVars(s) { const o = new Set(); [...s.L, ...s.R].forEach((f) => allVarNames(f, o)); return o }
export function candidateTerms(s) {
  const m = new Map()
  const walk = (t) => { m.set(showTerm(t), t); if (t.t === 'fn') t.args.forEach(walk) }
  const go = (f) => { if (f.t === 'pred') f.args.forEach(walk); else if (f.t === 'not' || f.t === 'all' || f.t === 'ex') go(f.a); else if (f.a && f.b) { go(f.a); go(f.b) } }
  ;[...s.L, ...s.R].forEach(go)
  // 束縛変数そのものは候補にしない
  const free = seqFree(s)
  return [...m.values()].filter((t) => !(t.t === 'var' && !free.has(t.n))).sort((a, b) => showTerm(a).length - showTerm(b).length)
}
// 変数条件を満たす新しい変数（できれば元の変数名 x をそのまま使う）
export function freshVar(s, f) {
  const free = seqFree(s), all = seqAllVars(s)
  const tryName = (n) => !free.has(n) && !subst(f.a, { [f.x]: Var(n) }).captured.length
  if (tryName(f.x) && !free.has(f.x)) return f.x
  for (const n of ['z', 'w', 'v', 'u', 'y', 'x']) if (!all.has(n) && tryName(n)) return n
  const used = new Set([...all])
  for (;;) { const n = freshName('z', used); if (tryName(n)) return n }
}
// 規則を下から上へ（opt.t：∀左/∃右の項、opt.z：∀右/∃左の変数）
export function decompF(s, side, i, opt = {}) {
  const f = s[side][i]
  const L = s.L.filter((_, k) => !(side === 'L' && k === i))
  const R = s.R.filter((_, k) => !(side === 'R' && k === i))
  const inst = (term) => subst(f.a, { [f.x]: term })
  if (side === 'L') {
    switch (f.t) {
      case 'not': return { rule: '¬左', premises: [{ L, R: [...R, f.a] }] }
      case 'and': return { rule: '∧左', premises: [{ L: [f.a, f.b, ...L], R }] }
      case 'or': return { rule: '∨左', premises: [{ L: [f.a, ...L], R }, { L: [f.b, ...L], R }] }
      case 'imp': return { rule: '⊃左', premises: [{ L, R: [...R, f.a] }, { L: [f.b, ...L], R }] }
      case 'all': { if (!opt.t) return { need: 't' }; const r = inst(opt.t); if (r.captured.length) return { err: `項 ${showTerm(opt.t)} の中の ${r.captured.join(', ')} が量化記号に捕まってしまう` }; return { rule: '∀左', t: opt.t, premises: [{ L: [r.f, ...L], R }] } }
      case 'ex': {
        if (!opt.z) return { need: 'z' }
        if (seqFree(s).has(opt.z)) return { err: `変数条件違反：${opt.z} は下式（結論のシーケント）に自由に出現している`, eigen: true }
        const r = inst(Var(opt.z)); if (r.captured.length) return { err: `${opt.z} が内側の量化記号に捕まってしまう` }
        return { rule: '∃左', z: opt.z, premises: [{ L: [r.f, ...L], R }] }
      }
    }
  } else {
    switch (f.t) {
      case 'not': return { rule: '¬右', premises: [{ L: [f.a, ...L], R }] }
      case 'and': return { rule: '∧右', premises: [{ L, R: [...R, f.a] }, { L, R: [...R, f.b] }] }
      case 'or': return { rule: '∨右', premises: [{ L, R: [...R, f.a, f.b] }] }
      case 'imp': return { rule: '⊃右', premises: [{ L: [f.a, ...L], R: [...R, f.b] }] }
      case 'all': {
        if (!opt.z) return { need: 'z' }
        if (seqFree(s).has(opt.z)) return { err: `変数条件違反：${opt.z} は下式（結論のシーケント）に自由に出現している`, eigen: true }
        const r = inst(Var(opt.z)); if (r.captured.length) return { err: `${opt.z} が内側の量化記号に捕まってしまう` }
        return { rule: '∀右', z: opt.z, premises: [{ L, R: [...R, r.f] }] }
      }
      case 'ex': { if (!opt.t) return { need: 't' }; const r = inst(opt.t); if (r.captured.length) return { err: `項 ${showTerm(opt.t)} の中の ${r.captured.join(', ')} が量化記号に捕まってしまう` }; return { rule: '∃右', t: opt.t, premises: [{ L, R: [...R, r.f] }] } }
    }
  }
  return null
}
// contraction：A を複製（A, A, Γ → Δ ／ Γ → Δ, A, A）。複製は側の先頭（左）／末尾（右）に置く
export function contractF(s, side, i) {
  const f = s[side][i]
  return side === 'L' ? { rule: 'contraction 左', premises: [{ L: [f, ...s.L], R: s.R }], copy: 0 } : { rule: 'contraction 右', premises: [{ L: s.L, R: [...s.R, f] }], copy: s.R.length }
}
// 自動証明（深さ制限つき探索）。成功すれば証明図の木、失敗なら null
export function proveFol(s0, { maxInst = 4, maxContract = 2, maxNodes = 30000 } = {}) {
  let count = 0
  const pri = (side, f) => {
    if (f.t === 'not' || (side === 'L' && f.t === 'and') || (side === 'R' && (f.t === 'or' || f.t === 'imp'))) return 0
    if ((side === 'R' && f.t === 'all') || (side === 'L' && f.t === 'ex')) return 1
    if (f.t === 'and' || f.t === 'or' || f.t === 'imp') return 2
    return 3
  }
  const go = (s, inst, con) => {
    if (++count > maxNodes) return null
    const items = [...s.L.map((f, i) => ['L', i, f]), ...s.R.map((f, i) => ['R', i, f])].filter(([, , f]) => !isAtomF(f))
    if (!items.length) return isInitialF(s) ? { seq: s, kids: [], status: 'axiom' } : null
    let best = items[0]
    items.forEach((it) => { if (pri(it[0], it[2]) < pri(best[0], best[2])) best = it })
    const p = pri(best[0], best[2])
    if (p < 3) {
      const [side, i, f] = best
      const opt = p === 1 ? { z: freshVar(s, f) } : {}
      const d = decompF(s, side, i, opt)
      const kids = []
      for (const q of d.premises) { const k = go(q, inst, con); if (!k) return null; kids.push(k) }
      return { seq: s, rule: d.rule, z: d.z, kids, status: 'ok' }
    }
    if (inst >= maxInst) return null
    const cands = candidateTerms(s)
    for (const contract of con < maxContract ? [false, true] : [false]) {
      for (const [side, i, f] of items) {
        const cs = cands.length ? cands : [Var(freshVar(s, f))]
        for (const t of cs) {
          if (contract) {
            const c = contractF(s, side, i), s2 = c.premises[0]
            const d = decompF(s2, side, c.copy, { t })
            if (!d || d.err) continue
            const k = go(d.premises[0], inst + 1, con + 1)
            if (k) return { seq: s, rule: c.rule, kids: [{ seq: s2, rule: d.rule, t, kids: [k], status: 'ok' }], status: 'ok' }
          } else {
            const d = decompF(s, side, i, { t })
            if (!d || d.err) continue
            const k = go(d.premises[0], inst + 1, con)
            if (k) return { seq: s, rule: d.rule, t, kids: [k], status: 'ok' }
          }
        }
      }
    }
    return null
  }
  // 反復深化：量化の具体化回数と contraction 回数を少しずつ増やす（短い証明から見つける）
  const IM = maxInst, CM = maxContract
  for (let c = 0; c <= CM; c++) for (let m = 1; m <= IM; m++) {
    maxInst = m; maxContract = c; count = 0
    const r = go(s0, 0, 0)
    if (r) return r
  }
  return null
}
export const ruleLabel = (n) => n.rule + (n.t ? `  t = ${showTerm(n.t)}` : n.z ? `  z = ${n.z}` : '')
