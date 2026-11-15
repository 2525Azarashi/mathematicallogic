// Lecture registry. Add a new lecture: create lecNN.js exporting default {meta..., chapters, quiz, exercises}
// then import it here and remove the entry from UPCOMING.
import lec01 from './lec01.js'
import lec02 from './lec02.js'
import lec03 from './lec03.js'
import lec04 from './lec04.js'
import lec05 from './lec05.js'
import lec06 from './lec06.js'
import lec07 from './lec07.js'
import lec08 from './lec08.js'
import lec12 from './lec12.js'
import lec13 from './lec13.js'

export const LECTURES = [lec01, lec02, lec03, lec04, lec05, lec06, lec07, lec08, lec12, lec13]

export const UPCOMING = [
  { no: 9, title: '一階述語論理 — シーケント計算，構文論', date: '11/20' },
  { no: 10, title: '中間試験', date: '11/27', exam: true, href: '#/midterm' },
  { no: 11, title: '復習', date: '12/04' },
  { no: 14, title: '期末試験', date: '01/08', exam: true },
]

// 全14回の授業構成・配布資料一覧
export const SYLLABUS_SESSIONS = [
  { no: 1, date: '09/25', mode: 'on demand', title: 'はじめに，集合と関係', mats: ['動画：はじめに (23 min)', '動画：集合と関係 (50 min)', '講義ガイドスライド', '講義ノート：準備', '演習問題・提出システム', '解答例'] },
  { no: 2, date: '10/02', title: '命題論理 — 言語，構文論，意味論', mats: ['命題論理スライド', '講義ノート', '演習問題', '解答例'] },
  { no: 3, date: '10/09', title: '命題論理 — 導出(融合)原理', mats: ['講義ノート', '演習問題', '解答例'] },
  { no: 4, date: '10/16', title: '命題論理 — シーケント計算', mats: ['講義ノート', '演習問題', '解答例'] },
  { no: 5, date: '10/23', title: '命題論理 — 健全性と完全性', mats: ['講義ノート', '演習問題', '解答例'] },
  { no: 6, date: '10/30', title: '一階述語論理 — 言語，構文論，意味論', mats: ['1階述語論理スライド', '講義ノート', '演習問題', '解答例'] },
  { no: 7, date: '11/06', title: '一階述語論理 — エルブランの定理，単一化', mats: ['講義ノート', '演習問題'] },
  { no: 8, date: '11/13', title: '一階述語論理 — 導出(融合)原理', mats: ['講義ノート（第2部）'] },
  { no: 9, date: '11/20', title: '一階述語論理 — シーケント計算，構文論', mats: ['講義ノート（第2部）'] },
  { no: 10, date: '11/27', title: '中間試験（15:20–16:20 · 4号館401教室）', exam: true, href: '#/midterm', mats: ['中間試験案内（2026/11/13）', '範囲：第1回〜第8回（ex1〜ex8）', '持ち込み一切不可・記述式'] },
  { no: 11, date: '12/04', title: '復習', mats: [] },
  { no: 12, date: '12/11', title: '命題様相論理，時相論理', mats: ['講義ノート（第3部：非古典論理 1〜2章）'] },
  { no: 13, date: '12/18', title: '非古典論理，まとめ', mats: ['講義ノート（第3部：非古典論理 3章）'] },
  { no: 14, date: '01/08', title: '期末試験', exam: true, mats: [] },
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
  { tag: 'PART 0', title: '予備知識', items: [[1, 'はじめに，集合と関係']] },
  { tag: 'PART 1', title: '命題論理', items: [[2, '言語・構文論・意味論'], [3, '導出（融合）原理'], [4, 'シーケント計算'], [5, '健全性と完全性']] },
  { tag: 'PART 2', title: '1階述語論理', items: [[6, '言語・構文論・意味論'], [7, 'エルブラン・単一化'], [8, '導出原理'], [9, 'シーケント計算・構文論']] },
  { tag: 'PART 3', title: '非古典論理', items: [[12, '命題様相論理・時相論理'], [13, '非古典論理・まとめ']] },
]
