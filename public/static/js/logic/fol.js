// ============================================================
//  1 階述語論理（FOL）ミニエンジン — 講義ノート 第2部 1.1〜1.4
//  項:  {t:'var',n} | {t:'const',n} | {t:'fn',n,args}
//  式:  {t:'top'} | {t:'bot'} | {t:'pred',n,args} | {t:'not',a}
//       | {t:'and'|'or'|'imp',a,b} | {t:'all'|'ex',x,a}
//  優先順位（1.2）: ⊃ < ∨ < ∧ < ¬ ＝ 量化記号（量化記号は結合記号より強い）、左優先
//  命名規則: 変数 = u〜z で始まる小文字 / 定数 = それ以外の小文字 / 関数 = 小文字 + ( … )
//            述語 = 大文字（引数なしなら 0 引数述語）
// ============================================================

export class FolError extends Error {
  constructor(msg, pos, hint) { super(msg); this.pos = pos; this.hint = hint }
}
export const isVarName = (n) => /^[u-z]/.test(n)

// ---------- constructors ----------
export const Var = (n) => ({ t: 'var', n })
export const Const = (n) => ({ t: 'const', n })
export const Fn = (n, args) => ({ t: 'fn', n, args })
export const Pred = (n, args = []) => ({ t: 'pred', n, args })
export const FNot = (a) => ({ t: 'not', a })
export const All = (x, a) => ({ t: 'all', x, a })
export const Ex = (x, a) => ({ t: 'ex', x, a })

// ---------- tokenizer ----------
function tokenize(s) {
  const toks = []
  let i = 0
  const push = (type, val, len) => { toks.push({ type, val, pos: i }); i += len }
  while (i < s.length) {
    const c = s[i], two = s.slice(i, i + 2)
    if (/\s/.test(c)) { i++; continue }
    if (c === '(' || c === '（') { push('(', '(', 1); continue }
    if (c === ')' || c === '）') { push(')', ')', 1); continue }
    if (c === ',' || c === '，' || c === '、') { push(',', ',', 1); continue }
    if (c === '.' || c === '．') { push('.', '.', 1); continue }
    if (two === '->' || two === '=>') { push('op', 'imp', 2); continue }
    if (c === '⊃' || c === '>') { push('op', 'imp', 1); continue }
    if (two === '/\\' || two === '&&') { push('op', 'and', 2); continue }
    if (two === '\\/' || two === '||') { push('op', 'or', 2); continue }
    if (two === '\\A') { push('q', 'all', 2); continue }
    if (two === '\\E') { push('q', 'ex', 2); continue }
    if (c === '∧' || c === '&' || c === '^') { push('op', 'and', 1); continue }
    if (c === '∨' || c === '|') { push('op', 'or', 1); continue }
    if (c === '¬' || c === '~' || c === '!' || c === '￢') { push('not', 'not', 1); continue }
    if (c === '∀') { push('q', 'all', 1); continue }
    if (c === '∃') { push('q', 'ex', 1); continue }
    if (c === '⊤') { push('const', 'top', 1); continue }
    if (c === '⊥') { push('const', 'bot', 1); continue }
    // 小文字の語は小文字・数字のみ（∀xP を ∀ x P と読むため）
    const m = /^(?:[a-z][a-z0-9_'₀-₉]*|[A-Z][A-Za-z0-9_'₀-₉]*)/.exec(s.slice(i))
    if (m) {
      const w = m[0]
      if (w === 'forall') { push('q', 'all', w.length); continue }
      if (w === 'exists') { push('q', 'ex', w.length); continue }
      if (w === 'top') { push('const', 'top', w.length); continue }
      if (w === 'bot') { push('const', 'bot', w.length); continue }
      push(/^[A-Z]/.test(w) ? 'up' : 'low', w, w.length); continue
    }
    if (c === '→') throw new FolError('「→」はシーケントの矢印です', i, '含意は ⊃（または ->）で書きます')
    throw new FolError(`「${c}」は論理式に使えない文字です`, i, '使える記号: ∀ ∃ ¬ ∧ ∨ ⊃ ( ) ,')
  }
  return toks
}

const PREC = { imp: 1, or: 2, and: 3 }

export function parseFol(src) {
  const toks = tokenize(src)
  let k = 0
  const peek = () => toks[k]
  const end = () => (toks.length ? (toks[toks.length - 1].pos + 1) : 0)
  const expect = (type, msg, hint) => { const t = toks[k]; if (!t || t.type !== type) throw new FolError(msg, t ? t.pos : end(), hint); k++; return t }

  function term() {
    const t = peek()
    if (!t) throw new FolError('項が足りません', end(), '定数 a, 変数 x, 関数 f(x) のどれかを書きます')
    if (t.type === 'up') throw new FolError(`述語記号「${t.val}」は項の中には書けません`, t.pos, '項の中に書けるのは 定数・変数・関数記号 だけ')
    if (t.type !== 'low') throw new FolError('ここには項（a, x, f(x) など）が必要です', t.pos)
    k++
    if (peek() && peek().type === '(') { k++; return Fn(t.val, termList()) }
    return isVarName(t.val) ? Var(t.val) : Const(t.val)
  }
  function termList() {
    const args = [term()]
    while (peek() && peek().type === ',') { k++; args.push(term()) }
    expect(')', '「)」が閉じていません', '引数リストを ) で閉じます')
    return args
  }
  function unary() {
    const t = peek()
    if (!t) throw new FolError('論理式が途中で終わっています', end())
    if (t.type === 'not') { k++; return FNot(unary()) }
    if (t.type === 'q') {
      k++
      const v = peek()
      if (!v || v.type !== 'low') throw new FolError('量化記号のすぐ後には変数が必要です', v ? v.pos : end(), '例: ∀x P(x)')
      if (!isVarName(v.val)) throw new FolError(`「${v.val}」は定数です。量化できるのは変数（x, y, z, u, v, w …）だけ`, v.pos)
      k++
      if (peek() && peek().type === '.') k++
      return { t: t.val, x: v.val, a: unary() }
    }
    if (t.type === '(') { k++; const f = expr(0); expect(')', '「)」が閉じていません'); return f }
    if (t.type === 'const') { k++; return { t: t.val } }
    if (t.type === 'up') {
      k++
      if (peek() && peek().type === '(') { k++; return Pred(t.val, termList()) }
      return Pred(t.val, [])
    }
    if (t.type === 'low') throw new FolError(`「${t.val}」は項です。項だけでは論理式になりません`, t.pos, '述語記号で包みます：P(' + t.val + ')')
    throw new FolError('ここには論理式が必要です', t.pos)
  }
  function expr(min) {
    let lhs = unary()
    for (;;) {
      const t = peek()
      if (!t || t.type !== 'op') break
      const p = PREC[t.val]
      if (p < min) break
      k++
      lhs = { t: t.val, a: lhs, b: expr(p + 1) }
    }
    return lhs
  }
  if (!toks.length) throw new FolError('論理式が空です', 0)
  const f = expr(0)
  if (k < toks.length) {
    const t = toks[k]
    throw new FolError(t.type === 'low' || t.type === 'up' ? '記号が並んでいます（論理記号が抜けている？）' : '余分な記号があります', t.pos, t.type === '(' ? '述語・関数の名前と ( の間に空白は入れても OK。量化の範囲を広げるなら ∀x(…) のように括弧で包む' : undefined)
  }
  return f
}
export function tryFol(src) { try { return { ok: true, f: parseFol(src) } } catch (e) { return { ok: false, err: e } } }

// ---------- printing (as token pieces → plain text / HTML) ----------
const OPS = { and: '∧', or: '∨', imp: '⊃' }
const QS = { all: '∀', ex: '∃' }
const fPrec = (f) => (f.t in PREC ? PREC[f.t] : f.t === 'not' || f.t in QS ? 4 : 5)

// pieces: {s, k, free?, b?} or {open:b} / {close:true}
export function pieces(f) {
  const out = []
  let bid = 0
  const termP = (t, env) => {
    if (t.t === 'var') { const b = env[t.n]; out.push({ s: t.n, k: 'var', free: b == null, b }) }
    else if (t.t === 'const') out.push({ s: t.n, k: 'const' })
    else { out.push({ s: t.n, k: 'fn' }, { s: '(', k: 'ap' }); t.args.forEach((a, i) => { if (i) out.push({ s: ', ', k: 'cm' }); termP(a, env) }); out.push({ s: ')', k: 'ap' }) }
  }
  const go = (f, ctx, side, env) => {
    const p = fPrec(f)
    const need = p < ctx || (p === ctx && side === 'r' && p < 4)
    if (need) out.push({ s: '(', k: 'p' })
    switch (f.t) {
      case 'top': out.push({ s: '⊤', k: 'c' }); break
      case 'bot': out.push({ s: '⊥', k: 'c' }); break
      case 'pred':
        out.push({ s: f.n, k: 'pred' })
        if (f.args.length) { out.push({ s: '(', k: 'ap' }); f.args.forEach((a, i) => { if (i) out.push({ s: ', ', k: 'cm' }); termP(a, env) }); out.push({ s: ')', k: 'ap' }) }
        break
      case 'not': out.push({ s: '¬', k: 'op' }); go(f.a, 4, 'u', env); break
      case 'all': case 'ex': {
        const b = ++bid
        out.push({ s: QS[f.t], k: 'q', b }, { s: f.x, k: 'var', free: false, b, binder: true })
        const env2 = { ...env, [f.x]: b }
        out.push({ open: b })
        if (fPrec(f.a) >= 4 && !(f.a.t === 'pred' && !f.a.args.length && false)) out.push({ s: ' ', k: 'sp' })
        go(f.a, 4, 'u', env2)
        out.push({ close: true })
        break
      }
      default:
        go(f.a, p, 'l', env); out.push({ s: ` ${OPS[f.t]} `, k: 'op' }); go(f.b, p, 'r', env)
    }
    if (need) out.push({ s: ')', k: 'p' })
  }
  go(f, 0, 'u', {})
  return out
}
export const showFol = (f) => pieces(f).filter((x) => x.s != null).map((x) => x.s).join('')
export const showTerm = (t) => (t.t === 'fn' ? `${t.n}(${t.args.map(showTerm).join(', ')})` : t.n)

const escH = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const OPCLS = { '¬': 'not', '∧': 'and', '∨': 'or', '⊃': 'imp' }
// HTML. mark=true → 変数の自由/束縛・量化のスコープをマークアップ
export function folHTML(f, { mark = false } = {}) {
  return pieces(f).map((x) => {
    if (x.open != null) return mark ? `<span class="sc" data-b="${x.open}">` : ''
    if (x.close) return mark ? '</span>' : ''
    const s = escH(x.s)
    switch (x.k) {
      case 'op': { const o = x.s.trim(); return s.replace(o, `<span class="o o-${OPCLS[o]}">${o}</span>`) }
      case 'q': return `<span class="o o-q"${mark ? ` data-b="${x.b}"` : ''}>${s}</span>`
      case 'var': return mark ? `<span class="vr ${x.free ? 'free' : 'bound'}${x.binder ? ' binder' : ''}"${x.b ? ` data-b="${x.b}"` : ''}>${s}</span>` : `<span class="vr">${s}</span>`
      case 'const': return `<span class="cn">${s}</span>`
      case 'fn': return `<span class="fn">${s}</span>`
      case 'pred': return `<span class="pd">${s}</span>`
      case 'c': return `<span class="${x.s === '⊤' ? 'c-top' : 'c-bot'}">${s}</span>`
      case 'p': return `<span class="p">${s}</span>`
      default: return s
    }
  }).join('')
}

// ---------- syntax queries ----------
export function termVars(t, s = new Set()) { if (t.t === 'var') s.add(t.n); else if (t.t === 'fn') t.args.forEach((a) => termVars(a, s)); return s }
export function freeVars(f, bound = new Set(), out = new Set()) {
  switch (f.t) {
    case 'pred': f.args.forEach((a) => termVars(a).forEach((v) => { if (!bound.has(v)) out.add(v) })); break
    case 'not': freeVars(f.a, bound, out); break
    case 'and': case 'or': case 'imp': freeVars(f.a, bound, out); freeVars(f.b, bound, out); break
    case 'all': case 'ex': freeVars(f.a, new Set([...bound, f.x]), out); break
  }
  return out
}
export function boundVars(f, out = new Set()) {
  if (f.t === 'all' || f.t === 'ex') { out.add(f.x); boundVars(f.a, out) }
  else if (f.t === 'not') boundVars(f.a, out)
  else if (f.a && f.b) { boundVars(f.a, out); boundVars(f.b, out) }
  return out
}
export const isClosed = (f) => freeVars(f).size === 0
export function occurrences(f) {
  const ps = pieces(f).filter((x) => x.k === 'var')
  return { free: ps.filter((x) => x.free).length, bound: ps.filter((x) => !x.free).length, list: ps }
}
// 部分論理式（定義 (1)〜(3)。(4) の代入例は無限にあるので除外）
export function folSubformulas(f, out = []) {
  out.push(f)
  if (f.t === 'not' || f.t === 'all' || f.t === 'ex') folSubformulas(f.a, out)
  else if (f.a && f.b) { folSubformulas(f.a, out); folSubformulas(f.b, out) }
  return out
}

// ---------- substitution A[t/x]（自由な出現のみ） ----------
export function substTerm(t, map) {
  if (t.t === 'var') return t.n in map ? map[t.n] : t
  if (t.t === 'fn') return Fn(t.n, t.args.map((a) => substTerm(a, map)))
  return t
}
// returns { f, captured:[var names that got captured] }
export function subst(f, map) {
  const captured = new Set()
  const go = (f, m) => {
    if (!Object.keys(m).length) return f
    switch (f.t) {
      case 'pred': return Pred(f.n, f.args.map((a) => substTerm(a, m)))
      case 'not': return FNot(go(f.a, m))
      case 'and': case 'or': case 'imp': return { t: f.t, a: go(f.a, m), b: go(f.b, m) }
      case 'all': case 'ex': {
        const m2 = { ...m }; delete m2[f.x]
        Object.entries(m2).forEach(([x, t]) => { if (termVars(t).has(f.x) && freeVars(f.a).has(x)) captured.add(f.x) })
        return { t: f.t, x: f.x, a: go(f.a, m2) }
      }
      default: return f
    }
  }
  return { f: go(f, map), captured: [...captured] }
}
export function parseTerm(src) {
  const r = parseFol(`Q__(${src})`.replace('Q__', 'Z'))
  if (r.t !== 'pred' || r.args.length !== 1) throw new FolError('項を 1 つだけ書いてください', 0)
  return r.args[0]
}

// ---------- signature ----------
export function signature(f) {
  const consts = new Set(), fns = new Map(), preds = new Map()
  const tm = (t) => { if (t.t === 'const') consts.add(t.n); else if (t.t === 'fn') { fns.set(t.n, t.args.length); t.args.forEach(tm) } }
  const go = (f) => {
    if (f.t === 'pred') { preds.set(f.n, f.args.length); f.args.forEach(tm) }
    else if (f.t === 'not' || f.t === 'all' || f.t === 'ex') go(f.a)
    else if (f.a && f.b) { go(f.a); go(f.b) }
  }
  go(f)
  return { consts, fns, preds }
}

// ---------- semantics [[A]]_{I,J}（1.4 の (1)〜(9)） ----------
// I = { D:[...], c:{a:u}, f:{f:(...us)=>u}, P:{P:(...us)=>bool} },  J = { x:u }
export function evalTerm(t, I, J) {
  if (t.t === 'var') { if (!(t.n in J)) throw new FolError(`自由変数 ${t.n} に付値 J(${t.n}) が与えられていません`); return J[t.n] }
  if (t.t === 'const') { if (!(t.n in I.c)) throw new FolError(`定数 ${t.n} の解釈 I(${t.n}) がありません`); return I.c[t.n] }
  if (!I.f[t.n]) throw new FolError(`関数記号 ${t.n} の解釈 I(${t.n}) がありません`)
  return I.f[t.n](...t.args.map((a) => evalTerm(a, I, J)))
}
export function evalFol(f, I, J = {}) {
  switch (f.t) {
    case 'top': return true
    case 'bot': return false
    case 'pred': if (!I.P[f.n]) throw new FolError(`述語記号 ${f.n} の解釈 I(${f.n}) がありません`); return !!I.P[f.n](...f.args.map((a) => evalTerm(a, I, J)))
    case 'not': return !evalFol(f.a, I, J)
    case 'and': return evalFol(f.a, I, J) && evalFol(f.b, I, J)
    case 'or': return evalFol(f.a, I, J) || evalFol(f.b, I, J)
    case 'imp': return !evalFol(f.a, I, J) || evalFol(f.b, I, J)
    case 'all': return I.D.every((u) => evalFol(f.a, I, { ...J, [f.x]: u }))
    case 'ex': return I.D.some((u) => evalFol(f.a, I, { ...J, [f.x]: u }))
  }
  throw new FolError('未知の式')
}
// 外側の量化記号を J[u/x] で展開した表（2 段まで）
export function traceQuant(f, I, J = {}, depth = 2) {
  if (!(f.t === 'all' || f.t === 'ex') || depth <= 0) return null
  return I.D.map((u) => { const J2 = { ...J, [f.x]: u }; return { u, val: evalFol(f.a, I, J2), sub: traceQuant(f.a, I, J2, depth - 1) } })
}

// ---------- 小さな領域でモデル／反例モデルを総当たり ----------
// want=true → 充足する (I,J) を探す / want=false → 偽にする (I,J) を探す
export function searchModel(f, { want = true, maxSize = 3, limit = 60000 } = {}) {
  const { consts, fns, preds } = signature(f)
  const fv = [...freeVars(f)]
  let tried = 0
  for (let n = 1; n <= maxSize; n++) {
    const D = [...Array(n).keys()]
    const comps = []
    consts.forEach((c) => comps.push({ kind: 'c', name: c, card: n }))
    fv.forEach((x) => comps.push({ kind: 'v', name: x, card: n }))
    fns.forEach((k, name) => comps.push({ kind: 'f', name, k, cells: n ** k, card: n ** (n ** k) }))
    preds.forEach((k, name) => comps.push({ kind: 'P', name, k, cells: n ** k, card: 2 ** (n ** k) }))
    const total = comps.reduce((s, c) => s * c.card, 1)
    if (total > limit) return { found: null, tried, skipped: n, total }
    const idx = (args) => args.reduce((s, a) => s * n + a, 0)
    for (let code = 0; code < total; code++) {
      let r = code
      const I = { D, c: {}, f: {}, P: {}, tables: {} }, J = {}
      for (const c of comps) {
        const v = r % c.card; r = Math.floor(r / c.card)
        if (c.kind === 'c') I.c[c.name] = v
        else if (c.kind === 'v') J[c.name] = v
        else if (c.kind === 'f') { const tab = []; let q = v; for (let i = 0; i < c.cells; i++) { tab.push(q % n); q = Math.floor(q / n) } I.tables[c.name] = { k: c.k, tab, fn: true }; I.f[c.name] = (...a) => tab[idx(a)] }
        else { const tab = []; let q = v; for (let i = 0; i < c.cells; i++) { tab.push(q % 2 === 1); q = Math.floor(q / 2) } I.tables[c.name] = { k: c.k, tab }; I.P[c.name] = (...a) => tab[idx(a)] }
      }
      tried++
      if (evalFol(f, I, J) === want) return { found: { I, J, n }, tried }
    }
  }
  return { found: null, tried, exhausted: maxSize }
}
// 全組み合わせを tuple 列挙（表示用）
export function tuples(n, k) { if (k === 0) return [[]]; const r = []; tuples(n, k - 1).forEach((t) => { for (let i = 0; i < n; i++) r.push([...t, i]) }); return r }
