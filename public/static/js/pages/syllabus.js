// ============================================================
//  シラバス  #/syllabus
//  講義ページ（Mathematical Logic.pdf）の内容：目的・到達目標・レポート・資料・日程・成績・準備学習・参考文献
// ============================================================
import { h, talk, rich, callout } from '../lib/ui.js'
import { LECTURES, UPCOMING, dueOf } from '../lectures/index.js'
import { timeline, gradingInfo } from '../widgets/infographic.js'
import { splitChars } from '../lib/motion.js'

// 到達目標の各項目 → サイト内のどこで学べるか
const GOALS = [
  { t: '構文論と意味論', d: '記号の「形」と、解釈による「真偽」を区別し、その関係を理解する', at: [['lec02', 'syntax', '第2回 構文論'], ['lec02', 'sem', '第2回 意味論'], ['lec04', 'syn', '第4回 構文論 vs 意味論']] },
  { t: '自然演繹・公理系による証明方法', d: '公理と推論規則から論理式を導く「演繹体系」で証明する', at: [['lec04', 'syn', '第4回 演繹体系'], ['lec04', 'proof', '第4回 証明図']] },
  { t: '導出（融合）原理の基本操作', d: 'CNF に直し、節どうしを打ち消して空節 ⊥ を導く', at: [['lec03', 'clause', '第3回 CNF'], ['lec03', 'res', '第3回 導出・反駁']] },
  { t: '完全性・健全性の意味', d: '「証明できる」と「本当に正しい」が一致することの意味を理解する', at: [['lec03', 'res', '第3回 導出の健全性・完全性'], ['lec04', 'proof', '第4回 LK の健全性・完全性']], soon: '第5回で本格的に' },
]
const MATERIALS = [
  ['予備知識', '集合と関係', 'lec01'],
  ['第1部', '命題論理', 'lec02'],
  ['第2部', '1階述語論理', null],
  ['第3部', '非古典論理', null],
]
// [title, author, publisher, year, beginner(blue)]
const BOOKS = [
  ['論理と計算のしくみ', '萩谷昌己，西崎真也', '岩波書店', 2007, false, '内容・表記とも本講義にもっとも近い（絶版）'],
  ['情報科学における論理', '小野寛晰', '日本評論社', 1994],
  ['数理論理学', '古川康一，向井国昭', 'コロナ社', 2008],
  ['ソフトウェア科学のための論理学', '萩谷昌己', '岩波書店', 1994],
  ['人工知能の基礎知識', '太原育夫', 'サイエンス社', 1988, true],
  ['はじめての数理論理学', '山田俊行', '森北出版', 2018, true],
  ['情報基礎数学', '佐藤泰介 他', 'オーム社', 2014, true],
  ['情報系の数学入門', '林晋，八杉満利子', 'オーム社', 1993, true],
  ['論理学をつくる', '戸田山和久', '名古屋大学出版会', 2000],
  ['知識と推論', '森下真一', '共立出版', 1994],
  ['記号論理入門（新装版）', '前原昭二', '日本評論社', 2005],
  ['様相論理入門', 'G.E. Hughes, M.J. Cresswell（三浦聰 他訳）', '恒星社厚生閣', 1971],
]

const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`

export function syllabusPage(root) {
  const title = h('h1', h('span.sy-title-t', 'シラバス'), h('span.sub', '数理論理学（2026年度）— Kazuko TAKAHASHI'))
  splitChars(title.firstChild)
  const hero = h('section.lec-hero.wrap', { 'data-scroll': '' }, h('div.ghost-word', { 'aria-hidden': 'true' }, '2026'),
    h('div.crumbs', h('a', { href: '#/' }, 'ホーム'), '／', 'シラバス'),
    h('div.lec-hero-grid', { style: { gridTemplateColumns: 'auto 1fr' } },
      h('div.big-no', { style: { background: '#fff3c2', fontSize: '50px' } }, '§'),
      h('div', title, h('div.meta', h('span.chip', '全 14 回'), h('span.chip', '中間 40% ＋ 期末 60%'), h('span.chip', { style: { background: 'var(--or-l)' } }, '講義ページ（Last Updated: 2026/10/9）より')))))

  const now = new Date()
  const all = [...LECTURES.map((l) => ({ no: l.no, date: l.date, title: l.title, slug: l.slug, color: l.color })), ...UPCOMING]
  const sched = h('table.tbl.sy-sched', h('thead', h('tr', h('th', '回'), h('th', '日付'), h('th', '内容'), h('th', 'このサイト'))),
    h('tbody', ...all.map((r) => {
      const live = !!r.slug
      const past = !r.exam && dueOf(r) < now
      return h('tr', { class: r.exam ? 'exam' : live ? 'live' : '' },
        h('td.no', String(r.no)), h('td.dt', r.date),
        h('td', r.exam ? h('b', '📝 ' + r.title) : r.title),
        h('td', live ? h('a.chip', { href: `#/lec/${r.slug}`, style: { background: r.color } }, '講義ページ →') : r.exam ? h('span.chip.muted', '試験') : h('span.chip.muted', past ? 'プリント待ち' : '準備中')))
    })))

  const goals = h('div.sy-goals', ...GOALS.map((g, i) => h('div.sy-goal.reveal',
    h('span.i', String(i + 1)), h('b', g.t), h('p', g.d),
    h('div.sy-at', ...g.at.map(([slug, id, label]) => h('a.chip', { href: `#/lec/${slug}/${id}` }, label + ' →')), g.soon ? h('span.chip.muted', g.soon) : null))))

  const books = h('ol.sy-books', ...BOOKS.map(([t, a, p, y, easy, note]) => h('li', { class: easy ? 'easy' : '' },
    h('span.bk-t', `「${t}」`), h('span.bk-a', `${a} 著，${p}，${y} 年`),
    easy ? h('span.chip.easy', '初心者向け') : null, note ? h('span.chip.note', note) : null)))

  const sec = (id, n, t, en, ...kids) => h('section.chap', { id: 'c-' + id }, h('div.chap-head.reveal', h('span.n', n), h('h2', t, h('small', en))), ...kids)

  const main = h('div.wrap.sy-main',
    talk(`R: シラバスって、最初の週に 1 回見たきりなんですよね…。
S: もったいない！ **到達目標**は「試験で何を聞かれるか」の地図なんだ。各目標がこのサイトのどこに対応するかも並べたよ。
R: 成績はレポート関係なし、試験だけ…でしたっけ。
S[happy]: そう、中間 40% ＋ 期末 60%。でもレポートは「自分の理解のために自分で解く」ものって明記されてる。解説ページは**提出後の答え合わせ**に使ってね。`),
    sec('purpose', '1', '授業目的', 'Purpose',
      h('blockquote.sy-quote.reveal', { html: rich('論理回路，プログラム理論，システム検証，人工知能など 多くの分野の理論的基盤となる考えを学び，<b>抽象化・形式化したものの考え方をする能力</b>を身につける．') })),
    sec('goals', '2', '到達目標', 'Learning goals',
      h('blockquote.sy-quote.reveal', { html: rich('<b>命題論理および1階述語論理の基本事項の習得</b>を目標とする．具体的には，構文論と意味論およびその関係，自然演繹や公理系による証明方法，導出(融合)原理の基本操作，完全性や健全性の意味が理解できることを目標とする．') }),
      h('p.sy-lead.reveal', '目標を 4 つに分けて、このサイトで学べる場所につなげました。'), goals),
    sec('report', '3', '毎回の演習レポート', 'Weekly reports',
      h('ul.sy-list.reveal',
        h('li', { html: rich('提出期限は<b>講義日翌週の木曜 23:59</b>（金曜講義なら 6 日後）．提出システムは 9/30 open．') }),
        h('li', { html: rich('評価は原則<b>試験のみ</b>で行うが，レポートは<b>自分の理解のために自分自身で考えて解く</b>こと．') }),
        h('li', { html: rich('<b>完答でなくても</b>できるところまで取り組んで提出することを推奨．') }),
        h('li', { html: rich('質問は対面でもメールでも随時歓迎．メールには本文中に必ず<b>宛名・自分の学籍番号と氏名</b>を書くこと．') })),
      h('div.sy-links.reveal', h('a.btn.sm.yellow', { href: '#/ex' }, '✎ 演習解説ページへ'), h('a.btn.sm', { href: '#/' }, '⏰ ホームで締切を見る'))),
    sec('materials', '4', '講義資料（教科書）', 'Materials',
      h('div.sy-mats.reveal', ...MATERIALS.map(([p, t, slug]) => slug
        ? h('a.sy-mat', { href: `#/lec/${slug}` }, h('small', p), h('b', t), h('span', 'このサイトで公開中 →'))
        : h('div.sy-mat.off', h('small', p), h('b', t), h('span', '後半で扱う')))),
      callout('info', 'スライド・講義ノート・演習問題は<b>印刷配布されない</b>ので，必要な人は講義ページからダウンロード／印刷すること．')),
    sec('schedule', '5', '各回の授業内容', 'Schedule',
      h('p.sy-lead.reveal', '進捗状況によって変更する場合あり。'), timeline(LECTURES, UPCOMING), h('div.sy-sched-wrap.reveal', sched)),
    sec('grading', '6', '成績評価方法・基準（予定）', 'Grading',
      h('div.reveal', gradingInfo())),
    sec('prep', '7', '準備学習・他の科目との関連', 'Preparation',
      callout('warn', '<b>集合論の基礎</b>（和集合，補集合，要素など）や<b>簡単な論理演算</b>（AND, OR, NOT など）は知っているものとして授業をすすめる．「論理回路」を履修したが単位を取得できなかった者は，本講義を理解するのにかなりの努力が必要である．'),
      h('div.sy-links.reveal', h('a.btn.sm', { href: '#/lec/lec01' }, '第1回「集合と関係」で復習 →'), h('a.btn.sm', { href: '#/lec/lec02/lang' }, '論理記号 ¬ ∧ ∨ ⊃ を確認 →'))),
    sec('books', '8', '参考文献', 'References',
      h('p.sy-lead.reveal', { html: rich('<span class="chip easy">初心者向け</span> は講義ページで<b>青字</b>（直観的な説明が多いもの）。1 は内容・表記とも本講義にもっとも近いが絶版。') }), books))

  root.append(hero, main)
  const bar = document.querySelector('.read-bar')
  const onScroll = () => { if (bar) { const d = document.documentElement; bar.style.width = (d.scrollTop / (d.scrollHeight - innerHeight)) * 100 + '%' } }
  addEventListener('scroll', onScroll, { passive: true })
  root._cleanup = () => removeEventListener('scroll', onScroll)
}
