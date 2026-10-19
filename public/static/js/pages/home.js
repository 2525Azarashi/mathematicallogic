import { h, html, talk, fxs, store } from '../lib/ui.js'
import { avatar, toto, setToto } from '../lib/chars.js'
import { LECTURES, UPCOMING, PARTS, dueOf } from '../lectures/index.js'
import { atomFormula } from '../widgets/play.js'
import { parse, classify, show } from '../logic/core.js'
import { rotator, marquee } from '../lib/motion.js'
import { timeline, gradingInfo, methodsInfo } from '../widgets/infographic.js'
import { dailyQuestion } from '../widgets/daily.js'

function heroPlay() {
  const forms = ['P ∨ ¬P', 'P ⊃ Q', 'P ∧ ¬P', '(P ⊃ Q) ∧ P ⊃ Q']
  let cur = 0
  const fBox = h('div.hero-formula')
  const verdict = h('div.hp-verdict')
  const mascot = html(toto('top'))
  const msg = h('div')
  verdict.append(h('div.toto-slot', { style: { width: '58px', flex: 'none' } }, mascot), msg)
  const pick = h('div.hp-pick')
  forms.forEach((f, i) => pick.append(h('button', { type: 'button', html: fxs(f), onclick: () => { cur = i; load() } })))
  function load() {
    ;[...pick.children].forEach((b, i) => b.classList.toggle('on', i === cur))
    const f = parse(forms[cur])
    const c = classify(f)
    fBox.innerHTML = ''
    const a = atomFormula(f, { onChange: (I, v) => paint(v, c) })
    fBox.append(a.el)
    paint(a.value(), c)
  }
  function paint(v, c) {
    setToto(mascot, v ? 'top' : 'bot')
    const kind = c.kind === 'valid' ? '<b>どう押しても ⊤</b> ＝ 恒真（トートロジ）' : c.kind === 'unsat' ? '<b>どう押しても ⊥</b> ＝ 充足不能' : '<b>押し方しだいで ⊤ にも ⊥ にも</b> ＝ 充足可能'
    msg.innerHTML = `いまの値は <span class="tv ${v ? 't' : 'f'}">${v ? '⊤' : '⊥'}</span>　${kind}`
  }
  load()
  return h('div.hero-play.reveal', h('span.tab', 'さわってみて'), h('p', { style: { margin: 0, fontWeight: 700, fontSize: '14px', textAlign: 'center' } }, '式の中の P・Q を押すと、真（⊤）と偽（⊥）が切りかわる'), fBox, pick, verdict)
}

export function homePage(root) {
  const done = (lec) => { const s = store.get('seen:' + lec.slug, []); return Math.round((s.length / lec.chapters.length) * 100) }
  const latest = LECTURES[LECTURES.length - 1]
  const now = new Date()
  const open = LECTURES.filter((l) => dueOf(l) > now)
  const fmtDue = (l) => { const d = dueOf(l); return `${d.getMonth() + 1}/${d.getDate()}（木）23:59` }
  const daysTo = (l) => Math.ceil((dueOf(l) - now) / 864e5)

  const floaters = h('div.hero-floaters', { 'aria-hidden': 'true' },
    ...[['¬', '47%', '74%', '34px', '-12deg', '#ff9d5c'], ['∧', '47%', '6%', '30px', '10deg', '#5aa9ff'], ['∨', '90%', '12%', '36px', '-8deg', '#f5c518'], ['⊃', '93%', '86%', '40px', '6deg', '#9d7bff'], ['⊢', '30%', '96%', '28px', '0deg', '#2b2452'], ['⊨', '60%', '92%', '26px', '-6deg', '#2ec486']]
      .map(([t, l, tp, fs, r, c], i) => h('span', { style: { left: l, top: tp, fontSize: fs, '--r': r, color: c, animationDelay: i * 0.7 + 's' } }, t)))

  const hero = h('section.hero.wrap', { id: 'hero-section', 'data-scroll': '' }, h('div.ghost-word', { 'aria-hidden': 'true', style: { left: '-4%', bottom: '-4%' } }, 'P ∨ ¬P'), floaters,
    h('div.hero-grid',
      h('div',
        h('div.hero-kicker', h('span.dot', '⊤'), `数理論理学 2026 ・ 第 ${LECTURES.length} 回まで公開中`),
        h('h1.kinetic-h1', { 'data-hero-h1': '', html: `<span class="row"><span>Truth,</span></span><span class="row"><span><span class="flip no-split"><span class="flip-in"><span class="face t sym">⊤</span><span class="face back b sym">⊥</span></span></span> or <span class="flip no-split"><span class="flip-in"><span class="face b sym">⊥</span><span class="face back t sym">⊤</span></span></span>,</span></span><span class="row"><span>made <em class="hl-tiny">tiny.</em></span></span>` }),
        h('div.hero-rot', h('span', '論理式を'), rotator([{ html: '押して', color: '#ffd23f' }, { html: 'ほどいて', color: '#9bcaff' }, { html: 'ぶつけて', color: '#ff9aae' }, { html: '証明して', color: '#7ef0b9' }], { interval: 1900 }), h('span', '、わかる。')),
        h('p.hero-lead', { html: '論理式は、ちいさな<b>スイッチの回路</b>。<br><b>サカイ</b>先輩と<b>リョウガ</b>くんのおしゃべりを聞きながら、押して・ほどいて・ぶつけて、「正しさ」のしくみを手でつかむ数理論理学の遊び場です。' }),
        h('div.hero-cta',
          h('a.btn.primary', { href: `#/lec/${latest.slug}` }, `最新・第${latest.no}回「${latest.title.replace('命題論理 — ', '')}」へ`, h('span.arr', '→')),
          h('a.btn', { href: '#/lec/lec01' }, '第1回から')),
        h('div.hero-meta',
          h('div', h('b', { 'data-count': LECTURES.length }), '公開中の回'),
          h('div', h('b', { 'data-count': LECTURES.reduce((s, l) => s + l.chapters.length, 0) }), '対話チャプター'),
          h('div', h('b', { 'data-count': 20, 'data-suffix': '+' }), 'さわれるラボ'))),
      heroPlay()))

  const dueBar = h('section.wrap', { style: { marginTop: '10px' } }, h('div.due.reveal', h('div.clock', '⏰'),
    h('div', h('b', '演習レポートの締切'), h('span', '講義日翌週の木曜 23:59。完答じゃなくても、できるところまで出そう。')),
    h('div.due-list', ...(open.length ? open : [latest]).map((l) => h('a.due-item', { href: `#/lec/${l.slug}/ex` }, h('small', `第${l.no}回 ex${l.no}`), h('b', fmtDue(l)), h('em', daysTo(l) > 0 ? `あと ${daysTo(l)} 日` : '締切済'))))))

  const mq = h('div', { style: { overflow: 'hidden', padding: '20px 0' } },
    marquee(['<span class="fx">P ∨ ¬P</span> is always <span class="hl-t">⊤</span>', 'touch the truth', '<span class="fx">⊢ A ⇔ ⊨ A</span>', 'unfold the formula', '<span class="fx">P ∧ ¬P</span> is always <span class="hl-b">⊥</span>', 'collide the clauses'], { speed: 38 }),
    marquee(['構文論', '意味論', '真理値表', '連言標準形', '導出原理', '反駁', 'シーケント計算', 'Wang のアルゴリズム', '健全性', '完全性'], { speed: 46, reverse: true, cls: 'alt' }))

  const totalQuiz = LECTURES.reduce((s, l) => s + l.quiz.length, 0), totalEx = LECTURES.reduce((s, l) => s + l.exercises.length, 0)
  const stats = h('section.section.wrap', { style: { paddingBottom: '20px' } },
    h('div.sec-head.reveal', h('div', h('div.eyebrow', 'In numbers'), h('h2', { 'data-kinetic': 'rise' }, 'The course, in data.', h('span.jp.no-split', 'このサイトと講義を数字で'))), h('p', '数字は講義資料と、このサイトの中身から。スクロールで動きます。')),
    h('div.stats-band',
      h('div.sb.reveal', { style: { '--c': '#5aa9ff' } }, h('span.sb-ic', '#'), h('b', { 'data-count': 14 }), h('span', '週の講義（試験2回を含む）'), h('i.sb-bar')),
      h('div.sb.reveal', { style: { '--c': '#2ec486' } }, h('span.sb-ic', '⊤'), h('b', { 'data-count': LECTURES.length }), h('span', '回分を公開中'), h('i.sb-bar')),
      h('div.sb.reveal', { style: { '--c': '#ffd23f' } }, h('span.sb-ic', '?'), h('b', { 'data-count': totalEx }), h('span', '問の公式演習（ヒント＋解答例）'), h('i.sb-bar')),
      h('div.sb.reveal', { style: { '--c': '#ff6b8b' } }, h('span.sb-ic', '✓'), h('b', { 'data-count': totalQuiz }), h('span', '問の類題クイズ'), h('i.sb-bar'))),
    timeline(LECTURES, UPCOMING),
    h('div.info-row', gradingInfo(), methodsInfo()))

  const quote = h('section.big-quote.wrap', { 'data-scroll': '' },
    h('p', { html: ['「正しい」を、', '<span class="fx">⊤</span>', 'と', '<span class="fx">⊥</span>', 'だけで', '決着させる。'].map((w, k) => `<span class="w" style="--k:${k}">${w}</span>`).join(' ') }),
    h('small', '— 数理論理学 は、そのための道具をつくる学問'))

  const cast = h('section.section.wrap', { id: 'cast-section', style: { paddingBottom: '20px' } },
    h('div.sec-head.reveal', h('div', h('div.eyebrow', 'Cast'), h('h2', { 'data-kinetic': 'rise' }, 'Two voices, one truth.', h('span.jp.no-split', 'ふたりの対話で進みます'))), h('p', '各回は「対話 → ラボ → POINT」のくり返し。リョウガくんの疑問は、たぶんあなたの疑問。')),
    h('div.cast.reveal',
      h('div.cast-card.s', h('div.av', { html: avatar('S', 'happy') }), h('div', h('h3', 'サカイ', h('small', 'SENPAI ・ 解説役')), h('p', '去年この授業を通った先輩。定義を読み上げる前に「なんでそう決めたのか」を話したがる。たとえ話が得意。'))),
      h('div.cast-card.r', h('div.av', { html: avatar('R', 'think') }), h('div', h('h3', 'リョウガ', h('small', 'STUDENT ・ 質問役')), h('p', 'いま受講中。わからない所で素直に止まれるのが強み。「⊃ ってやっぱり変じゃないですか？」')))),
    h('div.reveal', { style: { maxWidth: '780px', marginTop: '26px' } }, talk(`R: 先輩、数理論理学って結局なにを勉強するんですか？
S: ひとことで言うと「**正しい**って、どういうこと？」を、記号で決着させる学問。
R: 正しさ…ふわっとしてますね。
S[happy]: だから記号にするんだ。$P ∨ ¬P$ は、P が何であっても ⊤。上の式、押して確かめてみて。`)))

  const principles = h('section.section.wrap',
    h('div.sec-head.reveal', h('div', h('div.eyebrow', 'How it works'), h('h2', { 'data-kinetic': 'rise' }, 'Touch first,', h('span.jp.no-split', 'さわってから、定義を読む'))), h('p', '直感 → 形式化の順番で。定義は最後に「答え合わせ」として出てきます。')),
    h('div.principles',
      h('div.pr.reveal', h('div.ill', { html: `<div style="display:flex;gap:6px;font-size:26px"><span class="atom t" style="font-size:24px"><span>P</span><span class="val">⊤</span></span><span class="atom f" style="font-size:24px"><span>Q</span><span class="val">⊥</span></span></div>` }), h('div.num', '01 ・ SWITCH'), h('h3', '押して、真偽を感じる'), h('p', '命題記号はスイッチ。式の中で直接 ⊤/⊥ を切りかえて、論理記号のふるまいを体で覚える。')),
      h('div.pr.reveal', h('div.ill', { html: `<svg viewBox="0 0 120 80" width="120"><path d="M60 16 L30 60 M60 16 L90 60" stroke="#2b2452" stroke-width="3" fill="none"/><circle cx="60" cy="16" r="13" fill="#ece5ff" stroke="#2b2452" stroke-width="3"/><text x="60" y="21" text-anchor="middle" font-size="15" font-weight="700" fill="#2b2452">⊃</text><rect x="16" y="50" width="28" height="22" rx="8" fill="#d3f6e6" stroke="#2b2452" stroke-width="3"/><text x="30" y="66" text-anchor="middle" font-size="13" font-weight="700" fill="#2b2452">P</text><rect x="76" y="50" width="28" height="22" rx="8" fill="#ffe1e8" stroke="#2b2452" stroke-width="3"/><text x="90" y="66" text-anchor="middle" font-size="13" font-weight="700" fill="#2b2452">Q</text></svg>` }), h('div.num', '02 ・ UNFOLD'), h('h3', 'ほどいて、構造を見る'), h('p', '構文木・CNF 変換・証明図。式を 1 手ずつほどくステッパーで、変形の「理由」を見失わない。')),
      h('div.pr.reveal', h('div.ill', { html: toto('top') }), h('div.num', '03 ・ CHECK'), h('h3', '解いて、すぐ確かめる'), h('p', '公式の演習問題をヒント → 解答例の順で。各回の類題は、正解するとサカイ先輩が理由まで解説。'))))

  const list = h('div.lec-list')
  LECTURES.forEach((l) => {
    const p = done(l)
    list.append(h('a.lec-card.reveal', { href: `#/lec/${l.slug}`, style: { '--c': l.color } },
      h('div.no', h('small', 'LEC'), h('b', String(l.no).padStart(2, '0'))),
      h('div', h('div.sub', `${l.date}（金）`), h('h3', l.title), h('div.sub', l.sub), h('div.tiny-fx', { html: fxs(l.tinyFx) }), h('div.meta', ...l.tags.slice(0, 4).map((t) => h('span.chip', t)))),
      h('span.go', '→'), h('span.prog', { style: { width: p + '%' } })))
  })
  const up = h('div.up-list', ...UPCOMING.map((u) => h('div.up', { class: u.exam ? 'exam' : '' }, h('b', String(u.no).padStart(2, '0')), h('div', u.title, h('span.d', `${u.date}${u.exam ? '' : ' ・ 講義プリント待ち'}`)))))
  const lectures = h('section.section.wrap', { id: 'lectures' },
    h('div.sec-head.reveal', h('div', h('div.eyebrow', 'Lectures'), h('h2', { 'data-kinetic': 'rise' }, 'Step by step.', h('span.jp.no-split', '講義の回ごとに'))), h('p', '講義プリントが届くたびに、ここに 1 回ずつ増えていきます。カード下の色バーは読んだ割合。')),
    list, up)

  const map = h('section.section.wrap', { style: { paddingTop: 0 } },
    h('div.sec-head.reveal', h('div', h('div.eyebrow', 'Big picture'), h('h2', { 'data-kinetic': 'rise' }, 'Where are we?', h('span.jp.no-split', 'いま全体のどこ？'))), h('p', '命題論理で作った道具（意味論・導出・シーケント）を、そのまま 1 階述語論理へ持ち上げていく構成です。')),
    h('div.big-map', ...PARTS.map((p) => h('div.part.reveal', h('div.tag', p.tag), h('h4', p.title), h('ul', ...p.items.map(([n, t]) => {
      const live = LECTURES.find((l) => l.no === n)
      return h('li', { class: live ? (live === LECTURES[LECTURES.length - 1] ? 'now' : 'done') : '' }, h('i'), live ? h('a', { href: `#/lec/${live.slug}`, style: { textDecoration: 'none' } }, `第${n}回 ${t}`) : `第${n}回 ${t}`)
    }))))))

  const tools = h('section.section.wrap', { style: { paddingTop: 0 } },
    h('div.sec-head.reveal', h('div', h('div.eyebrow', 'Toolbox'), h('h2', { 'data-kinetic': 'rise' }, 'Your logic kit.', h('span.jp.no-split', 'いつでも使える道具箱'))), h('p', 'レポートの検算や、試験前の確認に。')),
    h('div.tools',
      h('a.tool.reveal', { href: '#/tools', style: { '--bg': '#ece5ff' } }, h('div.ic', '⊨'), h('h3', '論理式ラボ'), h('p', '式を入れると構文木・真理値表・恒真判定・CNF・Wang の証明図まで一気に出る。')),
      h('a.tool.reveal', { href: '#/sheet', style: { '--bg': '#fff3c2' } }, h('div.ic', '≡'), h('h3', 'チートシート'), h('p', '同値の公式・CNF の手順・LK の 8 規則を 1 枚に。試験前の見直し用。')),
      h('a.tool.reveal', { href: '#/glossary', style: { '--bg': '#d3f6e6' } }, h('div.ic', 'Aa'), h('h3', '用語集'), h('p', '「充足可能」「初期シーケント」…出てきた言葉を検索。英語つき。'))))

  root.append(hero, mq, dueBar, dailyQuestion(), cast, quote, principles, stats, lectures, map, tools)
}
