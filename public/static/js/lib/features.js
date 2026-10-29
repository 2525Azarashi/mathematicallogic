// ============================================================
//  features.js — app-level features built on patterns.js
//  · Term bottom sheet + auto-linking glossary terms in text
//  · Review list (bookmarks) store with badge
//  · Autocomplete sources (site search / glossary / formula input)
// ============================================================
import { h, fxs, rich, store, $$ } from './ui.js'
import { sheet, toast, fuzzy } from './patterns.js'
import { GLOSS, RELATED, ALIASES, findTerm } from '../data/glossary.js'
import { LECTURES } from '../lectures/index.js'
import { tryParse, classify, show } from '../logic/core.js'

// ---------- REVIEW LIST (bookmarks) ----------
// item: { id, kind:'quiz'|'term'|'formula', title, sub, href, fx, at, done }
export const review = {
  all() { return store.get('review', []) },
  has(id) { return this.all().some((x) => x.id === id) },
  add(item) {
    const a = this.all().filter((x) => x.id !== item.id)
    a.unshift({ ...item, at: Date.now(), done: false })
    store.set('review', a); updateBadge(true)
  },
  remove(id) { const a = this.all(); const i = a.findIndex((x) => x.id === id); if (i < 0) return null; const [it] = a.splice(i, 1); store.set('review', a); updateBadge(); return { it, i } },
  restore({ it, i }) { const a = this.all(); a.splice(i, 0, it); store.set('review', a); updateBadge(true) },
  toggleDone(id) { const a = this.all(); const it = a.find((x) => x.id === id); if (it) it.done = !it.done; store.set('review', a); updateBadge(); return it },
  toggle(item) {
    if (this.has(item.id)) { const r = this.remove(item.id); toast({ msg: '復習リストから外しました', type: 'info', action: { label: '元に戻す', fn: () => this.restore(r) } }); return false }
    this.add(item); toast({ msg: '復習リストに追加しました', type: 'ok', icon: '★', action: { label: '見る', fn: () => (location.hash = '#/review') } }); return true
  },
}
export function updateBadge(bump) {
  const n = review.all().filter((x) => !x.done).length
  $$('.nav-links a[data-r="review"] .badge').forEach((b) => {
    b.textContent = n; b.classList.toggle('on', n > 0)
    if (bump) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump') }
  })
}
export function saveButton(item) {
  const b = h('button.save-btn', { type: 'button', 'aria-pressed': 'false' })
  const sync = () => { const on = review.has(item.id); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.innerHTML = on ? '★ 復習リスト' : '☆ あとで復習' }
  b.addEventListener('click', (e) => { e.stopPropagation(); review.toggle(item); sync() })
  sync()
  return b
}

// ---------- TERM SHEET ----------
export function openTerm(name) {
  const g = findTerm(name)
  if (!g) return
  const [jp, en, def, no] = g
  const lec = LECTURES.find((l) => l.no === no)
  const rel = (RELATED[jp] || []).filter((r) => findTerm(r))
  const body = h('div',
    h('p.term-def', { html: fxs(def).replace(/2\^S/g, '2<sup>S</sup>') }),
    h('div.term-from', h('span', '登場：'), lec ? h('a.chip', { href: `#/lec/${lec.slug}`, onclick: () => s.close() }, `第${no}回 ${lec.title.replace(/^.*— /, '')}`) : h('span.chip', `第${no}回`)),
    rel.length ? h('div', { style: { marginTop: '14px' } }, h('div.term-from', '関連する用語'), h('div.term-rel', ...rel.map((r) => h('button', { type: 'button', onclick: () => openTerm(r) }, r)))) : null)
  const s = sheet({
    kicker: 'GLOSSARY · ' + en.toUpperCase(), title: jp, body,
    actions: [
      { label: review.has('term:' + jp) ? '★ 復習リストに入っています' : '☆ あとで復習', cls: 'yellow', fn: () => review.toggle({ id: 'term:' + jp, kind: 'term', title: jp, sub: def, href: '#/glossary' }) },
      { label: '用語集をひらく', fn: () => (location.hash = '#/glossary') },
    ],
  })
  return s
}

// auto-link glossary terms inside dialogue bubbles / definitions (first occurrence per chapter)
const LINKABLE = (() => {
  const names = new Set()
  GLOSS.forEach(([jp]) => { if (jp.length >= 2 && !/[（）・]/.test(jp)) names.add(jp) })
  Object.keys(ALIASES).forEach((a) => names.add(a))
  ;['集合', '命題', '節', 'LK'].forEach((x) => names.delete(x)) // too generic / short
  return [...names].sort((a, b) => b.length - a.length)
})()
export function linkTerms(root) {
  const re = new RegExp(LINKABLE.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')
  $$('.chap', root).forEach((chap) => {
    const used = new Set()
    $$('.bubble p, .defn > div, .prose p', chap).forEach((p) => {
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest('.fx, .term, a, button, b.o, .o') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) })
      const texts = []; let n
      while ((n = walker.nextNode())) texts.push(n)
      texts.forEach((t) => {
        const s = t.textContent; re.lastIndex = 0
        let m, last = 0, frag = null
        while ((m = re.exec(s))) {
          const canon = findTerm(m[0])?.[0]
          if (!canon || used.has(canon)) continue
          used.add(canon)
          frag = frag || document.createDocumentFragment()
          frag.append(s.slice(last, m.index))
          frag.append(h('span.term', { tabindex: '0', role: 'button', 'data-term': canon, 'data-cursor': '用語', title: `「${canon}」の説明` }, m[0]))
          last = m.index + m[0].length
        }
        if (frag) { frag.append(s.slice(last)); t.replaceWith(frag) }
      })
    })
  })
}
document.addEventListener('click', (e) => { const t = e.target.closest('.term[data-term]'); if (t) openTerm(t.dataset.term) })
document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.term[data-term]')) { e.preventDefault(); openTerm(e.target.dataset.term) } })

// ---------- AUTOCOMPLETE SOURCES ----------
let _items
export function siteItems() { return _items || (_items = [
  ...LECTURES.flatMap((l) => [
    { kind: `第${l.no}回`, kindCls: 'chap', t: l.title, href: `#/lec/${l.slug}`, kw: l.tags.join(' ') },
    ...l.chapters.map((c) => ({ kind: `第${l.no}回`, kindCls: 'chap', t: c.title, href: `#/lec/${l.slug}/${c.id}`, kw: c.en })),
    { kind: `第${l.no}回`, kindCls: 'ex', t: `演習問題 ex${l.no}`, href: `#/lec/${l.slug}/ex`, kw: 'exercise 演習 レポート' },
  ]),
  ...GLOSS.map(([jp, en]) => ({ kind: '用語', kindCls: 'term', t: jp, term: jp, kw: en })),
  { kind: '演習', kindCls: 'ex', t: '演習解説（ex1〜ex5・採点ポイント・よくあるミス）', href: '#/ex', kw: 'exercise 解説 解答 レポート answer' },
  ...[[5, '健全性と完全性', '恒真性の保持 ¬右 意味論 Wang 5.1 5.2'], [4, 'シーケント計算', 'LK ∧左 Wang 4.1 4.2'], [3, '導出原理', '⊃ CNF 反駁 3.1 3.2 3.3'], [2, '言語・構文論・意味論', '論理式の定義 真理値表 恒真 2.1 2.2 2.3'], [1, '集合と関係', 'べき集合 全域関数 1.1 1.2 1.3']]
    .map(([n, t, kw]) => ({ kind: '演習', kindCls: 'ex', t: `ex${n} 解説：${t}`, href: `#/ex/ex${n}`, kw })),
  { kind: 'ツール', kindCls: 'tool', t: '論理式ラボ（構文木・真理値表・CNF・Wang）', href: '#/tools', kw: 'lab tool' },
  { kind: 'ツール', kindCls: 'tool', t: '復習リスト', href: '#/review', kw: 'review bookmark あとで' },
  { kind: 'ツール', kindCls: 'tool', t: 'チートシート', href: '#/sheet', kw: 'cheat' },
  { kind: 'ツール', kindCls: 'tool', t: '用語集', href: '#/glossary', kw: 'glossary' },
]) }
export function siteSource(q) {
  const out = []
  for (const it of siteItems()) {
    const a = fuzzy(q, it.t), b = it.kw ? fuzzy(q, it.kw) : null
    const best = a && (!b || a.score >= b.score - 10) ? a : b
    if (!best) continue
    out.push({ ...it, score: best.score + (it.term ? 4 : 0), label: a ? a.html : it.t, hint: !a && it.kw ? it.kw : '' })
  }
  return out.sort((x, y) => y.score - x.score)
}
export function glossSource(q) {
  return GLOSS.map(([jp, en]) => { const a = fuzzy(q, jp), b = fuzzy(q, en); const m = a || b; return m ? { score: Math.max(a?.score || -1e9, (b?.score || -1e9) - 5), label: a ? a.html : jp, hint: en, value: jp, complete: jp, kind: '用語', kindCls: 'term' } : null })
    .filter(Boolean).sort((x, y) => y.score - x.score)
}

// formula input: suggest well-known formulas & laws by prefix / keyword, show verdict chip
const FORMULAS = [
  ['P ∨ ¬P', '排中律'], ['P ∧ ¬P', '矛盾'], ['¬¬P ⊃ P', '二重否定'], ['(P ⊃ Q) ∧ P ⊃ Q', 'モーダスポネンス'], ['(P ⊃ Q) ∧ ¬Q ⊃ ¬P', 'モーダストレンス'],
  ['(P ⊃ Q) ∧ (Q ⊃ R) ⊃ (P ⊃ R)', '推移律（三段論法）'], ['(P ∨ Q) ∧ ¬P ⊃ Q', '選言三段論法'], ['¬(P ∧ Q) ⊃ ¬P ∨ ¬Q', 'ド・モルガン'], ['¬(P ∨ Q) ⊃ ¬P ∧ ¬Q', 'ド・モルガン'],
  ['(P ⊃ Q) ⊃ (¬Q ⊃ ¬P)', '対偶'], ['(P ⊃ Q) ⊃ (Q ⊃ P)', '逆（成り立たない）'], ['P ⊃ (Q ⊃ P)', '公理 K'], ['((P ⊃ Q) ⊃ P) ⊃ P', 'パースの法則'],
  ['P ∧ (Q ∨ R) ⊃ (P ∧ Q) ∨ (P ∧ R)', '分配則'], ['¬(P ∧ (Q ∨ R))', '演習 3.2'], ['(P ∧ Q) ∨ ¬P', '演習 2.2'], ['¬Q ⊃ ¬P', '演習 2.2'], ['(P ∨ Q) ∨ R ⊃ P ∨ (Q ∨ R)', '演習 4.2'],
]
const SEQS = [['→ P ∨ ¬P', '演習 4.2 (1)'], ['→ (P ∨ Q) ∨ R ⊃ P ∨ (Q ∨ R)', '演習 4.2 (2)'], ['P, Q → P ∨ Q', '演習 4.1 前提'], ['P ∧ Q → P ∨ Q', '演習 4.1 結論'], ['P ∨ Q → P', '反例あり'], ['P, P ⊃ Q → Q', 'モーダスポネンス']]
const norm = (s) => s.replace(/\s+/g, '').replace(/->/g, '⊃').replace(/&/g, '∧').replace(/\|/g, '∨').replace(/~/g, '¬')
export function formulaSource(sequent) {
  return (q) => {
    const nq = norm(q)
    const pool = sequent ? SEQS : FORMULAS
    const res = []
    for (const [f, name] of pool) {
      const nf = norm(f)
      let score = -1
      if (nf.startsWith(nq)) score = 100 - nf.length * 0.5
      else if (nf.includes(nq)) score = 60 - nf.indexOf(nq)
      else { const m = fuzzy(q, name); if (m) score = 40 + m.score * 0.1 }
      if (score < 0 || nf === nq) continue
      let chip = ''
      if (!sequent) { const r = tryParse(f); if (r.ok) { const c = classify(r.f).kind; chip = c === 'valid' ? '恒真' : c === 'unsat' ? '充足不能' : '充足可能' } }
      res.push({ score, label: `<span class="fx">${fxs(f)}</span>`, hint: name + (chip ? ' · ' + chip : ''), value: f, complete: f, kind: sequent ? 'seq' : 'fx', kindCls: 'sym' })
    }
    return res.sort((a, b) => b.score - a.score)
  }
}
