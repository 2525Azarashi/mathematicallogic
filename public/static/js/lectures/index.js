// Lecture registry. Add a new lecture: create lecNN.js exporting default {meta..., chapters, quiz, exercises}
// then import it here and remove the entry from UPCOMING.
import lec01 from './lec01.js'
import lec02 from './lec02.js'
import lec03 from './lec03.js'
import lec04 from './lec04.js'

export const LECTURES = [lec01, lec02, lec03, lec04]

export const UPCOMING = [
  { no: 5, title: '命題論理 — 健全性と完全性', date: '10/23' },
  { no: 6, title: '一階述語論理 — 言語，構文論，意味論', date: '10/30' },
  { no: 7, title: '一階述語論理 — エルブランの定理，単一化', date: '11/06' },
  { no: 8, title: '一階述語論理 — 導出(融合)原理', date: '11/13' },
  { no: 9, title: '一階述語論理 — シーケント計算，構文論', date: '11/20' },
  { no: 10, title: '中間試験', date: '11/27', exam: true },
  { no: 11, title: '復習', date: '12/04' },
  { no: 12, title: '命題様相論理，時相論理', date: '12/11' },
  { no: 13, title: '非古典論理，まとめ', date: '12/18' },
  { no: 14, title: '期末試験', date: '01/08', exam: true },
]

// 講義日（金）翌週の木曜 23:59 が提出期限
export const COURSE = { year: 2026, deadlineRule: '講義日翌週の木曜 23:59' }
export function dueOf(lec) {
  const [m, d] = lec.date.split('/').map(Number)
  const y = m < 4 ? COURSE.year + 1 : COURSE.year
  const day = new Date(y, m - 1, d)
  // 「翌週の木曜」= 講義週の次の週（月〜日）の木曜。金曜講義なら 6 日後。
  const toMon = (8 - day.getDay()) % 7 || 7 // days to next Monday
  const due = new Date(y, m - 1, d + toMon + 3, 23, 59, 0)
  return due
}
export const PARTS = [
  { tag: 'PART 0', title: '予備知識', items: [[1, '集合と関係']] },
  { tag: 'PART 1', title: '命題論理', items: [[2, '言語・構文論・意味論'], [3, '導出（融合）原理'], [4, 'シーケント計算'], [5, '健全性と完全性']] },
  { tag: 'PART 2 / 3', title: '1階述語論理・非古典論理', items: [[6, '言語・構文論・意味論'], [7, 'エルブラン・単一化'], [8, '導出原理'], [9, 'シーケント計算'], [12, '様相・時相論理'], [13, '非古典論理']] },
]
