// ============================================================
//  midterm-tools.js — 中間試験対策の高効率アクティブ・リコール教材＆学習ツール
//  1. 30秒 弱点スピード診断（8問即答 → 優先ルート自動ハイライト）
//  2. 口頭即答フラッシュカード（3段階 SRS 仕分け：◎余裕 / △あやしい / ✕要復習）
//  3. 混同しやすい概念 8大対比マトリクス（減点トラップ完全回避）
//  4. 本番60分 シミュレーション・タイマー（フェーズ連動ガイドつき）
// ============================================================
import { h, html, rich, store, confettiAt, toast } from '../lib/ui.js'

// ---------- 1. 8問・弱点スピード診断データ（第1回〜第8回 各1問） ----------
export const DIAG_QUESTIONS = [
  {
    lec: 1, phase: 1,
    q: '空集合 $\\emptyset$ のべき集合 $2^\\emptyset$ の要素数はいくつか？',
    opts: ['0個（$\\emptyset$）', '1個（$\\{\\emptyset\\}$）', '2個（$\\{\\emptyset, \\{\\emptyset\\}\\}$）'],
    a: 1,
    why: '要素 $0$ 個なので $2^0 = 1$ 個（$\\emptyset$ 自身のみが部分集合）。$\\emptyset$ と $\\{\\emptyset\\}$ の混同は頻出ミス！',
  },
  {
    lec: 2, phase: 1,
    q: '本講義の優先順位・結合規則で $P ⊃ Q ⊃ R$ に括弧を補うとどれか？',
    opts: ['$(P ⊃ Q) ⊃ R$', '$P ⊃ (Q ⊃ R)$', '括弧なしでは論理式でない'],
    a: 0,
    why: '本講義ノート 1.3 では同じ強さの結合子は一貫して「左優先（左結合）」と定義されているため $(P ⊃ Q) ⊃ R$。',
  },
  {
    lec: 3, phase: 2,
    q: '節 $P ∨ Q$ と節 $¬P ∨ ¬Q$ に導出原理を 1 回適用するとどうなるか？',
    opts: ['空節 $\\bot$ が出る', '$Q ∨ ¬Q$（または $P ∨ ¬P$）が出る', '導出は適用できない'],
    a: 1,
    why: '1 回の導出で消せるリテラルは 1 組だけ！ 2 組同時に消して $\\bot$ にするのは典型的な誤り（実際 $P=⊤, Q=⊥$ で充足可能）。',
  },
  {
    lec: 4, phase: 2,
    q: 'Wang のアルゴリズムで葉 $Q → P$ で行き止まりになった。元のシーケントを偽にする反例解釈は？',
    opts: ['$I(P)=⊤, I(Q)=⊥$', '$I(P)=⊥, I(Q)=⊤$', '$I(P)=⊥, I(Q)=⊥$'],
    a: 1,
    why: 'シーケントは「左がすべて $⊤$ ならば右のどれかが $⊤$」。だから左辺の記号 $Q$ を $⊤$、右辺の記号 $P$ を $⊥$ にすれば偽になる！',
  },
  {
    lec: 5, phase: 4,
    q: '演繹体系の「健全性（soundness）」を正しく表すものはどれか？',
    opts: ['$⊨ A$ ならば $⊢ A$', '$⊢ A$ ならば $⊨ A$', '$⊢ ¬A$ ならば $⊨ A$'],
    a: 1,
    why: '健全性＝「証明できるもの（$⊢ A$）はすべて本当に恒真（$⊨ A$）」（ウソを証明しない）。逆向き（$⊨ \\Rightarrow ⊢$）は完全性。',
  },
  {
    lec: 6, phase: 1,
    q: '論理式 $∀xP(x, y) ∧ ∀yQ(y)$ における変数 $y$ の分類として正しいものは？',
    opts: ['自由変数のみ', '束縛変数のみ', '自由変数であり、かつ束縛変数でもある'],
    a: 2,
    why: '$P(x, y)$ の $y$ は $∀y$ のスコープ外で自由な出現、$∀yQ(y)$ の $y$ は束縛された出現なので、両方に該当する！',
  },
  {
    lec: 7, phase: 3,
    q: '定数を含まない閉じた論理式 $∀x∃y R(x, y)$ を Skolem 化した式のエルブラン領域 $H$ は？',
    opts: ['$\\emptyset$（空集合）', '$\\{a\\}$（定数1個のみ）', '$\\{a, f(a), f(f(a)), …\\}$（無限集合）'],
    a: 2,
    why: '$∃y$ の前に $∀x$ があるので 1 引数 Skolem 関数 $f(x)$ が入り、定数がないため適当な定数 $a$ を補って $H_0=\\{a\\}$ から $f$ で無限に育つ！',
  },
  {
    lec: 8, phase: 3,
    q: '節 $C_1 = P(x) ∨ R(x)$ と節 $C_2 = ¬P(f(x))$ から導出を行うときの結果は？',
    opts: ['出現検査により単一化不可能', '$C_2$ の変数を $x_1$ に分離し $R(f(x_1))$ を導出', '$R(x)$ を導出'],
    a: 1,
    why: '異なる節の変数は別々の $∀$ に束縛された別物！ 先に $¬P(f(x_1))$ と変数を分離し、mgu $\\{x := f(x_1)\\}$ を残りの $R(x)$ にもかける。',
  },
]

// ---------- 2. メタデータ：25例題ごとの「採点キーワード」＆「減点トラップ」 ----------
export const EXAMPLE_META = {
  'e1-1': {
    keys: ['または（和集合）', 'かつ（6の倍数）', '全体集合（自然数）の中での奇数'],
    trap: '補集合を書くときに「全体集合が何か」を意識せず曖昧に書くミス（0 を自然数に含めるかも一言添えると万全）。',
  },
  'e1-2': {
    keys: ['空集合 ∅ を含む', 'S 自身を含む', '2³ = 8 個すべて', '2^∅ = {∅}（要素数1）'],
    trap: '$\\emptyset$ や $S$ 自身を書き忘れるミス、および $2^\\emptyset = \\emptyset$ と書いてしまうミス。',
  },
  'e1-3': {
    keys: ['すべての要素に値がただ1つ', '反例 (x, 0) で 0 除算が未定義', '定義域 R × (R − {0})'],
    trap: '「割り算はできないことがある」とだけ書き、具体的な定義域の修正 $\\mathbb{R} \\times (\\mathbb{R} - \\{0\\})$ で第1引数まで $0$ を除いてしまうミス。',
  },
  'e2-1': {
    keys: ['命題記号ゆえ定義(2)で論理式', '定義(3)を内側から順に適用', '∨ は二項 A ∨ B の形のみ', '有限回適用(4)で生成不可'],
    trap: '「カッコの中がおかしいから」と感覚だけで答え、論理式の帰納的定義 (1)〜(4) を引用しない記述減点。',
  },
  'e2-2': {
    keys: ['強さ ¬ > ∧ > ∨ > ⊃', '同じ強さは左優先（左結合）', '最後に結合する記号が主結合子'],
    trap: '他書の影響で $P ⊃ Q ⊃ R$ を右結合 $P ⊃ (Q ⊃ R)$ としてしまうミス（本講義は左結合！）。',
  },
  'e2-3': {
    keys: ['2² = 4 行すべての解釈', '部分論理式の列を内側から作成', 'P=⊤, Q=⊥ の行のみ ⊥'],
    trap: '部分論理式の列を省略して暗算し、$¬Q ⊃ ¬P$ の $P=⊤, Q=⊥$ と $P=⊥, Q=⊤$ の行を取り違えるミス。',
  },
  'e2-4': {
    keys: ['任意の解釈 I で ⊤（恒真の定義）', '否定の定義で任意の I で ⊥', '真にする I が存在しない（充足不能）', '反例：命題記号 P（I₁で⊥、I₂で⊤）'],
    trap: '(1) が「その時に限り（$\\Leftrightarrow$）」なのに片方向しか書かないミス、(2) で具体的な反例論理式と解釈 $I$ を挙げないミス。',
  },
  'e2-5': {
    keys: ['食い違う反例解釈 I を1つ提示', 'ド・モルガンは ∧ と ∨ が反転', '含意と同値なのは逆ではなく対偶'],
    trap: '「同値でない」理由に「形が違うから」と書くミス（形が違っても同値な式は無数にあるため、必ず反例解釈 $I$ の真偽値で示す！）。',
  },
  'e3-1': {
    keys: ['[[A ⊃ B]]_I = ⊤ iff ([[A]]_I=⊥ or [[B]]_I=⊤)', '⊥ なら A=⊤ かつ B=⊥ に確定', '= ⊤ では一意に定まらない', 'A=⊤ の例と A=⊥ の例を両方提示'],
    trap: '(2) で「わからない」「⊥」などと 1 つに決めてしまうミス。「一意に定まらない」と明言し、両方の具体例を示すのが満点答案。',
  },
  'e3-2': {
    keys: ['① ⊃ を ¬α ∨ β で除去', '② ド・モルガンと二重否定で ¬ を内側へ', '③ 分配則で ∧ を外側へ', '節（リテラルの ∨）の連言 ∧ になっている'],
    trap: '最後に $∧$ を中・$∨$ を外にして DNF（選言標準形）にしてしまうミス、途中の変形規則名を書き添えないミス。',
  },
  'e3-3': {
    keys: ['各節に番号を振る', '親節番号と消去した記号を明記', '1回の導出で消すのは1組だけ', '空節 ⊥ と導出の健全性から充足不能'],
    trap: '$P ∨ Q$ と $¬P ∨ ¬Q$ から 1 手で $P, Q$ を両方消して $\\bot$ を出してしまう重大ミス！',
  },
  'e3-4': {
    keys: ['前提 F₁…Fₙ はそのまま節にする', '結論 G だけを否定 ¬G にする', '空節 ⊥ を導出', '否定が充足不能ゆえ元の式は恒真'],
    trap: '前提まで否定してしまうミス、または結論 $G$ を否定し忘れてそのまま節集合に入れてしまうミス。',
  },
  'e4-1': {
    keys: ['左のカンマは ∧、右のカンマは ∨', '(A₁ ∧ … ∧ Aₘ) ⊃ (B₁ ∨ … ∨ Bₙ)', '初期シーケント＝両辺すべて命題記号＋左右に共通記号'],
    trap: '$P ∧ Q → P$ や $P ⊃ Q → P ⊃ Q$ のように論理結合子が残っているものを「初期シーケント」と判定してしまうミス。',
  },
  'e4-2': {
    keys: ['結論（下）で分解された結合子と左右を特定', '規則名（∧左 など）を明記', 'A, B, Γ, Δ すべてを対応づけ', '空の列も「空列」と明記'],
    trap: '$\\Gamma$ が空のときに何も書かず飛ばしてしまうミス（「$\\Gamma$ は空列」と明記して初めて満点）。',
  },
  'e4-3': {
    keys: ['根（一番下）に示したいシーケント', '横線の右に適用規則名', '枝分かれしない規則を優先', '「すべての葉が初期シーケントなのでトートロジ」'],
    trap: '証明図だけ描いて最後の結論の1文（「すべての葉が初期シーケントなのでトートロジである」）を書き忘れるミス。',
  },
  'e4-4': {
    keys: ['命題記号のみで共通記号のない葉（行き止まり）', '左辺の記号を ⊤、右辺の記号を ⊥ に設定', '元のシーケントが ⊥ になる反例解釈'],
    trap: '反例を作るときに左辺を $⊥$・右辺を $⊤$ と逆にしてしまい、含意が $⊤$ になって反例にならないミス。',
  },
  'e5-1': {
    keys: ['健全性：⊢ A ⇒ ⊨ A（証明可能なら恒真）', '完全性：⊨ A ⇒ ⊢ A（恒真なら証明可能）', '初期シーケントの恒真性＋各規則の恒真性保持（帰納法）', '対偶：証明不能なら Wang の失敗葉から反例構成'],
    trap: '健全性と完全性の矢印の向き（$⊢ \\Rightarrow ⊨$ と $⊨ \\Rightarrow ⊢$）を逆にしてしまう痛恨ミス。',
  },
  'e5-2': {
    keys: ['前提が任意の解釈 I で ⊤ と仮定', '結論がある解釈 I で ⊥ と仮定（背理法）', '同値変形を一切使わず真偽値定義 (4)〜(7) のみ使用', '前提もその I で ⊥ となり矛盾'],
    trap: '問題文で禁止されている「$B ⊃ C ∨ ¬A = ¬B ∨ C ∨ ¬A = …$」のような式の同値変形を使って0点になるミス！',
  },
  'e5-3': {
    keys: ['主結合子 ⊃ に (⊃右)', '左辺 ∧ に (∧左)', '左辺 ⊃ に (⊃左) で2枝分岐', '2つの葉 P→Q,P と Q,P→Q が初期シーケント'],
    trap: '(⊃左) を適用するときに前件 $P$ と後件 $Q$ の行く先を取り違えるミス（問題用紙の規則表を必ず指差し確認！）。',
  },
  'e6-1': {
    keys: ['項 → 原子論理式 → 論理式 の順で検証', '定数は0引数なので a(x) は項でない', '述語・関数の引数は「項」のみ（∃x や P(x) は不可）', '量化記号の直後は「変数」のみ'],
    trap: '$a(x)$ を1引数関数と見なしたり、$Q(P(x), y)$ のように原子論理式を述語の引数に入れて論理式としてしまうミス。',
  },
  'e6-2': {
    keys: ['量化記号は結合記号（∧,∨,⊃）より強い', '各出現ごとにスコープ内外を判定', '自由変数かつ束縛変数になりうる', '自由変数が0個なら閉じた論理式'],
    trap: '$∀xP(x) ⊃ Q(x)$ の $∀x$ が $Q(x)$ まで届くと誤読するミス、および「$y$ は束縛変数だから自由変数ではない」と片方しか書かないミス。',
  },
  'e6-3': {
    keys: ['自由な出現すべてを一斉に置換', '束縛変数は置換しない', '代入項の変数が内側の量化子に捕まる＝変数の捕獲', '捕獲を避けるため先に束縛変数名をつけかえる'],
    trap: '$P(x, g(x, y))$ で外側の $x$ だけ変えて $g(x, y)$ の中の $x$ を置き換え忘れるミス。',
  },
  'e6-4': {
    keys: ['特定の個体（11）は定数', '「すべての A は B」⇒ ∀x(A(x) ⊃ B(x))', '「ある A が B」⇒ ∃x(A(x) ∧ B(x))', '量化範囲全体を括弧で包む'],
    trap: '「どんな素数も…」を $∀x(\\mathrm{PRIME}(x) ∧ ¬\\mathrm{DIV2}(x))$ と $∧$ で書いてしまう最頻出ミス！',
  },
  'e6-5': {
    keys: ['∀x∃y（各 x ごとに y を選べる）と ∃y∀x（共通の1つの y）の違い', '対象領域 D は「空でない集合」', '1階述語論理ではトートロジではなく「恒真」と呼ぶ'],
    trap: '$∀xP(x) ⊃ ∃xP(x)$ が恒真である理由として「対象領域 $D$ が空でないこと（定義(1)）」に言及し忘れるミス。',
  },
  'e7-1': {
    keys: ['付値 J[u/x] の記法と定義 (3)(6)(8)', '(1) は u=1, 2 の両方で ⊤ を確認して ⊤', '(2) は ∀xP(x)=⊥ と ∀xQ(x)=⊥ を両方示して ⊥', '∀ は ∨ に分配できない（同値でない反例）'],
    trap: '(1) で片方の要素しか確かめないミス、または理由を書かずに $⊤, ⊥$ の記号だけ書いて大幅減点されるミス。',
  },
  'e7-2': {
    keys: ['¬∀x α = ∃x ¬α, ¬∃x α = ∀x ¬α', '束縛変数の名前がかぶらないようつけかえ', '∃ の前にあるすべての ∀ の変数を引数にした新関数', '同値性ではなく「充足不能性」を保持'],
    trap: '$∃x_2, ∃x_3$ に同じ Skolem 関数記号 $f$ を使い回すミス、または「Skolem 化した式は元の式と同値」と書いてしまうミス！',
  },
  'e7-3': {
    keys: ['定数なしなら適当な定数1つで H₀ = {a}', '関数記号があれば H は無限集合 {a, f(a), …}', 'HB はすべての引数組合せの原子論理式', '基礎例は先頭の ∀ を外して H の要素を代入'],
    trap: '①定数なしで $H=\\emptyset$ とする、②$Q(a,x)$ に釣られて $HB$ の第1引数を $a$ に限定する、③基礎例に $∀$ を残す、の3大ミス！',
  },
  'e7-4': {
    keys: ['左から最初の不一致集合 D を特定', 'それまでの代入にも右から合成（ノート記法 θ₂θ₁）', '異なる定数/関数どうし＝記号の衝突', '変数 v が項 t(v) の中に出現＝出現検査（occur check）'],
    trap: '後段で決まった $z := a$ を前段の $x := g(z)$ に反映し忘れて $\\{x := g(z), z := a\\}$ のまま止めてしまうミス。',
  },
  'e8-1': {
    keys: ['各節の変数は暗黙に独立な ∀ で束縛', '親節どうしの共通変数を別名（x₁ 等）に分離', '同じ1つの節内の同じ変数は連動して置換'],
    trap: '異なる節の $P(x)$ と $¬P(f(x))$ を変数分離せずぶつけて「出現検査で単一化不能」と誤答するミス！',
  },
  'e8-2': {
    keys: ['① 示したい式 F の否定 ¬F をとる', '② 冠頭形 → ③ Skolem化（充足不能性保持）→ ④ 節集合', '⑤ 親節番号と mgu σ を明記して空節 ⊥ を導出', '⑥ 健全性より ¬F は充足不能、よって F は恒真'],
    trap: '恒真性を示したい式 $F$ を否定せずにいきなり Skolem 化してしまう致命的ミス（Skolem 化は恒真性を保たない！）。',
  },
}

// ---------- 3. 混同しやすい概念・8大対比マトリクス ----------
const CONFUSION_PAIRS = [
  {
    theme: '構文の階層（第6回）',
    left: ['項（term）', '領域 $D$ の「もの」を指す：$a,\\ x,\\ f(a),\\ g(x,y)$。関数や述語の引数になれるのは<b>項だけ</b>。'],
    right: ['原子論理式 / 論理式', '真偽値 $\\{⊤, ⊥\\}$ をとる：$P(a),\\ Q(x,f(y)),\\ ∀xP(x)$。関数や述語の引数には<b>絶対になれない</b>！'],
  },
  {
    theme: '翻訳の型（第6回 ex6.3）',
    left: ['$\\forall x (A(x) \\supset B(x))$', '「すべての $A$ は $B$ である」（もし $A$ なら $B$）。<b>$\\forall$ の相棒は $\\supset$</b>！'],
    right: ['$\\exists x (A(x) \\land B(x))$', '「ある $A$ が存在して $B$ である」（$A$ かつ $B$ なものがいる）。<b>$\\exists$ の相棒は $\\land$</b>！'],
  },
  {
    theme: '標準形（第3回 ex3.2）',
    left: ['CNF（連言標準形）', '$(L_{11} \\lor L_{12}) \\land (L_{21} \\lor L_{22})$：<b>$\\lor$ の袋（節）を $\\land$ で束ねる</b>。導出原理で使うのはこちら！'],
    right: ['DNF（選言標準形）', '$(L_{11} \\land L_{12}) \\lor (L_{21} \\land L_{22})$：$\\land$ を $\\lor$ でつないだ形。分配則の向きを逆にすると DNF になるので注意。'],
  },
  {
    theme: '構文論と意味論の橋（第4〜5回）',
    left: ['健全性（soundness）', '<b>$\\vdash A \\implies \\models A$</b>（証明できるなら恒真＝ウソを証明しない）。初期シーケント＋規則の恒真性保持（帰納法）で示す。'],
    right: ['完全性（completeness）', '<b>$\\models A \\implies \\vdash A$</b>（恒真なら必ず証明できる＝取りこぼさない）。対偶「証明不能 $\\Rightarrow$ Wang の失敗葉から反例」で示す。'],
  },
  {
    theme: '量化記号の交換（第6〜7回）',
    left: ['$\\exists y \\forall x R(x, y) \\supset \\forall x \\exists y R(x, y)$', '<b>恒真である</b>（全員共通の $y$ が1人いれば、各 $x$ ごとの相手としてその $y$ を選べばよい）。'],
    right: ['$\\forall x \\exists y R(x, y) \\supset \\exists y \\forall x R(x, y)$', '<b>恒真ではない！</b>（各自に相手がいても全員共通とは限らない。$D=\\{1,2\\}, R(1,2)=R(2,1)=⊤$ が反例）。'],
  },
  {
    theme: '変形が保つ性質（第7回）',
    left: ['冠頭形変換・CNF変換', '<b>論理的同値性</b>を保つ（どの解釈 $I$ でも変形前後で真偽値が完全に一致する）。'],
    right: ['Skolem 化（$\\exists$ の消去）', '論理的同値ではない！ 保つのは<b>充足不能性（と充足可能性）だけ</b>。だから必ず<b>否定した後に</b>使う。'],
  },
  {
    theme: 'エルブランの3用語（第7回 ex7.2）',
    left: ['エルブラン領域 $H$ ／ 基底 $HB$', '<b>$H$</b>＝定数（なければ $a$）と関数で作る基礎<b>項</b>の集合。<b>$HB$</b>＝述語に $H$ の項を入れた<b>原子論理式</b>全体の集合。'],
    right: ['基礎例（ground instance）', '$F = \\forall x_1…\\forall x_n A$ の<b>先頭の $\\forall$ を外した母式 $A$</b> の変数を $H$ の要素で置き換えた式（論理結合子はそのまま残る）。'],
  },
  {
    theme: '導出での変数の扱い（第8回）',
    left: ['異なる2つの節にある同じ文字 $x$', '別々の $\\forall$ に縛られた<b>赤の他人</b>！ ぶつける前に必ず片方を $x_1$ など別名につけかえる（変数の分離）。'],
    right: ['同じ1つの節内にある同じ文字 $x$', '$P(x) \\lor Q(x)$ の2つの $x$ は<b>同一人物</b>！ $P(x)$ を $\\{x:=a\\}$ で消したら残りの $Q(x)$ も強制的に $Q(a)$ になる。'],
  },
]

// ---------- UI 1: 弱点スピード診断ウィジェット ----------
export function quickDiagnosisWidget(onHighlightPhase) {
  const saved = store.get('midterm-diag', {}) // { idx: chosenOpt }
  const answers = { ...saved }
  const wrap = h('div.mt-diag.reveal')
  const summaryBox = h('div.mt-diag-sum')
  const grid = h('div.mt-diag-grid')

  function renderSummary() {
    summaryBox.innerHTML = ''
    const answeredIdx = Object.keys(answers).map(Number)
    if (!answeredIdx.length) {
      summaryBox.append(h('p.mt-diag-lead', { html: rich('<b>⚡ まずは30秒で現在地チェック！</b> 第1〜8回の急所 8 問にワンタップで答えると、<b>あなたが今すぐ優先すべきエッセンシャルルートの Phase</b> を自動判定します。') }))
      return
    }
    const right = answeredIdx.filter((i) => answers[i] === DIAG_QUESTIONS[i].a).length
    const wrongPhases = [...new Set(answeredIdx.filter((i) => answers[i] !== DIAG_QUESTIONS[i].a).map((i) => DIAG_QUESTIONS[i].phase))].sort()
    const weakLecs = answeredIdx.filter((i) => answers[i] !== DIAG_QUESTIONS[i].a).map((i) => `第${DIAG_QUESTIONS[i].lec}回`)

    let msg
    if (answeredIdx.length < DIAG_QUESTIONS.length) {
      msg = `回答中：<b>${answeredIdx.length} / ${DIAG_QUESTIONS.length} 問</b>（現在 ${right} 問正解）— 残りもタップして優先ルートを確定しよう！`
    } else if (wrongPhases.length === 0) {
      msg = `🎉 <b>8問全問正解！</b> 基礎の急所は完璧です。直下の <b>Phase 4（定義からの記述証明）</b> と <b>60分予想問題</b> で満点答案の表現力を仕上げましょう！`
    } else {
      msg = `📊 診断結果：<b>${right} / ${DIAG_QUESTIONS.length} 点</b>　｜　要補強：<b>${weakLecs.join('・')}</b>　👉 下のルートでは <b>${wrongPhases.map((p) => `Phase ${p}`).join(' → ')}</b> を最優先で潰すと一気に伸びます！`
    }
    summaryBox.append(
      h('div.mt-diag-res',
        h('div', { html: rich(msg) }),
        h('button.btn.sm', {
          type: 'button',
          onclick: () => {
            Object.keys(answers).forEach((k) => delete answers[k])
            store.set('midterm-diag', {})
            if (onHighlightPhase) onHighlightPhase([])
            renderAll()
          },
        }, '↺ 診断をリセット')))
    if (onHighlightPhase) onHighlightPhase(wrongPhases)
  }

  function renderAll() {
    grid.innerHTML = ''
    DIAG_QUESTIONS.forEach((it, idx) => {
      const picked = answers[idx]
      const answered = picked !== undefined
      const isOk = answered && picked === it.a
      const optsEl = h('div.mt-dq-opts')
      it.opts.forEach((opt, oi) => {
        let cls = ''
        if (answered) {
          if (oi === it.a) cls = 'ok'
          else if (oi === picked) cls = 'ng'
        }
        optsEl.append(h('button.mt-dq-btn', {
          type: 'button',
          class: cls,
          html: rich(opt),
          onclick: (e) => {
            answers[idx] = oi
            store.set('midterm-diag', answers)
            if (oi === it.a && Object.keys(answers).length === DIAG_QUESTIONS.length && Object.keys(answers).every((k) => answers[k] === DIAG_QUESTIONS[k].a)) {
              confettiAt(e.currentTarget)
            }
            renderAll()
          },
        }))
      })
      grid.append(h('div.mt-dq-card', { class: answered ? (isOk ? 'done-ok' : 'done-ng') : '' },
        h('div.mt-dq-top',
          h('span.mt-eb-lec', `第${it.lec}回`),
          h('span.mt-dq-ph', `Phase ${it.phase}`),
          answered ? h('span.mt-dq-mark', isOk ? '✓ 正解' : '✕ 要優先復習') : null),
        h('div.mt-dq-q', { html: rich(it.q) }),
        optsEl,
        answered ? h('div.mt-dq-why', { html: rich(it.why) }) : null))
    })
    renderSummary()
  }

  const det = h('details.mt-diag-box', { open: Object.keys(answers).length < DIAG_QUESTIONS.length },
    h('summary', '🩺 30秒・弱点スピード診断（全8問で「今やるべき最優先 Phase」を自動判定）'),
    summaryBox,
    grid)
  renderAll()
  wrap.append(det)
  return wrap
}

// ---------- UI 2: アクティブ・リコール（口頭30秒即答フラッシュカードデッキ） ----------
export function flashcardDeckWidget(examples, onStatusChange) {
  // status map: { [id]: 'easy' | 'hard' | 'again' }
  const srs = { ...store.get('midterm-srs', {}) }
  let deckMode = 'due' // 'due' (未評価 + again + hard) | 'star' | 'all'
  let curIdx = 0
  let revealed = false

  const box = h('div.mt-fc-wrap.reveal')
  const headStats = h('div.mt-fc-stats')
  const modeBar = h('div.mt-fc-modes')
  const stage = h('div.mt-fc-stage')

  const getDeck = () => {
    if (deckMode === 'due') return examples.filter((e) => srs[e.id] !== 'easy')
    if (deckMode === 'star') return examples.filter((e) => e.star)
    return examples
  }

  function syncStats() {
    const easy = examples.filter((e) => srs[e.id] === 'easy').length
    const hard = examples.filter((e) => srs[e.id] === 'hard').length
    const again = examples.filter((e) => srs[e.id] === 'again').length
    const unseen = examples.length - easy - hard - again
    headStats.innerHTML = ''
    headStats.append(
      h('span.chip', { style: { background: 'var(--top-l)' } }, `◎ 即答できる ${easy}`),
      h('span.chip', { style: { background: 'var(--or-l)' } }, `△ あやしい ${hard}`),
      h('span.chip', { style: { background: 'var(--bot-l)' } }, `✕ 要復習 ${again}`),
      h('span.chip', `未判定 ${unseen}`))
    if (onStatusChange) onStatusChange(srs)
  }

  function renderModes() {
    modeBar.innerHTML = ''
    ;[
      ['due', `🔥 要復習・未習得のみ (${examples.filter((e) => srs[e.id] !== 'easy').length})`],
      ['star', `★ 高得点必須のみ (${examples.filter((e) => e.star).length})`],
      ['all', `全 ${examples.length} 題`],
    ].forEach(([m, label]) => {
      modeBar.append(h('button.mt-fbtn', {
        type: 'button',
        class: deckMode === m ? 'on' : '',
        onclick: () => { deckMode = m; curIdx = 0; revealed = false; renderModes(); renderCard() },
      }, label))
    })
    if (Object.keys(srs).length) {
      modeBar.append(h('button.btn.sm', {
        type: 'button',
        onclick: () => {
          Object.keys(srs).forEach((k) => delete srs[k])
          store.set('midterm-srs', {})
          curIdx = 0; revealed = false
          syncStats(); renderModes(); renderCard()
        },
      }, '↺ 仕分けリセット'))
    }
  }

  function rate(id, lv, btnEl) {
    srs[id] = lv
    store.set('midterm-srs', srs)
    // Also sync to mastery checkbox store when rated 'easy'
    const chk = new Set(store.get('midterm-ex-chk', []))
    if (lv === 'easy') chk.add(id)
    else if (lv === 'again') chk.delete(id)
    store.set('midterm-ex-chk', [...chk])

    syncStats()
    renderModes()
    const deck = getDeck()
    if (!deck.length) {
      if (btnEl) confettiAt(btnEl)
      toast({ msg: 'すべての例題が「◎ 即答できる」になりました！', type: 'qed' })
    } else if (deckMode !== 'due') {
      curIdx = (curIdx + 1) % deck.length
    } else if (curIdx >= deck.length) {
      curIdx = 0
    }
    revealed = false
    renderCard()
  }

  function renderCard() {
    stage.innerHTML = ''
    const deck = getDeck()
    if (!deck.length) {
      stage.append(h('div.mt-ex-empty',
        '🎉 「要復習・未習得」のカードが 0 枚になりました！ 「全25題」に切り替えて総仕上げするか、下の60分予想問題へ進みましょう。'))
      return
    }
    if (curIdx >= deck.length) curIdx = 0
    const it = deck[curIdx]
    const meta = EXAMPLE_META[it.id] || { keys: [], trap: '' }
    const curLv = srs[it.id]

    const navRow = h('div.mt-fc-nav',
      h('span.mt-fc-pos', `カード ${curIdx + 1} / ${deck.length}（第${it.lec}回 · ${it.badge}）`),
      h('div', { style: { display: 'flex', gap: '6px' } },
        h('button.btn.sm', { type: 'button', onclick: () => { curIdx = (curIdx - 1 + deck.length) % deck.length; revealed = false; renderCard() } }, '← 前へ'),
        h('button.btn.sm', { type: 'button', onclick: () => { curIdx = (curIdx + 1) % deck.length; revealed = false; renderCard() } }, '次へ →')))

    const front = h('div.mt-fc-front',
      h('div.mt-fc-prompt', '🗣 声に出すか頭の中で「結論」と「なぜそうなるか（使う定義）」を30秒で言ってみよう：'),
      h('h4.mt-ex-title', { html: rich(it.title) }),
      h('div.mt-ex-q', { html: rich(it.q) }),
      curLv ? h('span.mt-fc-cur', `現在の判定：${curLv === 'easy' ? '◎ 即答できる' : curLv === 'hard' ? '△ あやしい' : '✕ 要復習'}`) : null)

    const back = revealed
      ? h('div.mt-fc-back',
          meta.keys.length
            ? h('div.mt-kp-box',
                h('b', '🔑 答案に必ず入れる採点キーワード：'),
                h('div.mt-kp-chips', ...meta.keys.map((k) => h('span.mt-kp', { html: rich(k) }))))
            : null,
          h('div.mt-ex-ans.proof-text', { html: rich(it.why) }),
          meta.trap ? h('div.mt-trap-line', { html: rich(`<b>⚠️ 減点トラップ：</b>${meta.trap}`) }) : null,
          h('div.mt-fc-rate',
            h('span', '今の出来は？ →'),
            h('button.mt-rbtn.again', { type: 'button', onclick: (e) => rate(it.id, 'again', e.currentTarget) }, '✕ 詰まった（もう1周）'),
            h('button.mt-rbtn.hard', { type: 'button', onclick: (e) => rate(it.id, 'hard', e.currentTarget) }, '△ 惜しい（後で確認）'),
            h('button.mt-rbtn.easy', { type: 'button', onclick: (e) => rate(it.id, 'easy', e.currentTarget) }, '◎ 定義から即答できた！')))
      : h('div.mt-fc-reveal-bar',
          h('button.btn.yellow', {
            type: 'button',
            onclick: () => { revealed = true; renderCard() },
          }, '👀 答えと採点キーワードをめくる'))

    stage.append(navRow, front, back)
  }

  syncStats()
  renderModes()
  renderCard()

  box.append(
    h('div.mt-fc-head',
      h('div',
        h('span.ig-tag', 'ACTIVE RECALL · 最速記憶定着モード'),
        h('h4', { style: { margin: '4px 0 2px', fontSize: '16.5px', fontWeight: 900 } }, '⚡ 30秒 口頭即答フラッシュカード（苦手自動抽出）'),
        h('p', { style: { margin: 0, fontSize: '12.5px', fontWeight: 700, color: 'var(--ink-2)' } }, '読むだけの復習より「思い出してから答えを見る」方が定着率は約2〜3倍！「◎ 即答できる」になった問題は自動でデッキから外れます。')),
      headStats),
    modeBar,
    stage)
  return box
}

// ---------- UI 3: 混同しやすい概念・8大対比マトリクス ----------
export function confusionMatrixWidget() {
  const rows = CONFUSION_PAIRS.map((p) => h('div.mt-cmp-card.reveal',
    h('div.mt-cmp-theme', p.theme),
    h('div.mt-cmp-two',
      h('div.mt-cmp-side.a',
        h('b', { html: rich(p.left[0]) }),
        h('p', { html: rich(p.left[1]) })),
      h('div.mt-cmp-vs', 'VS'),
      h('div.mt-cmp-side.b',
        h('b', { html: rich(p.right[0]) }),
        h('p', { html: rich(p.right[1]) })))))
  return h('div.mt-cmp-wrap', ...rows)
}

// ---------- UI 4: 60分 本番シミュレーション・タイマー ----------
export function mockExamTimerWidget() {
  const TOTAL = 60 * 60 // 3600 sec
  let remain = TOTAL
  let timerId = null

  const timeDisp = h('div.mt-tm-clock', '60:00')
  const phaseDisp = h('div.mt-tm-phase')
  const barFill = h('i')

  const getPhaseGuide = (elapsedMin) => {
    if (elapsedMin < 2) return '【00–02分：全体俯瞰】問題数と、問題文に与えられた定義・LK規則表の位置を確認！'
    if (elapsedMin < 20) return '【02–20分：構文・計算パート】予想問題1(1)・2(2)・3 を素早く正確に片付けて時間を貯金！'
    if (elapsedMin < 38) return '【20–38分：述語・単一化・導出】予想問題4・5（否定忘れ・共通変数分離・mgu明記に注意！）'
    if (elapsedMin < 52) return '【38–52分：定義からの記述証明】予想問題1(2)・2(1)（「任意の解釈 I」と定義番号を丁寧に記述！）'
    return '【52–60分：8分間の減点潰し】∅とS自身、定数なしH₀={a}、結論の締めの一文「よって恒真」を見直し！'
  }

  function paint() {
    const m = Math.floor(remain / 60)
    const s = remain % 60
    timeDisp.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    const elapsedMin = (TOTAL - remain) / 60
    barFill.style.width = Math.min(100, (remain / TOTAL) * 100) + '%'
    phaseDisp.textContent = remain === 0
      ? '⏰ 60分終了！ 自己採点チェックを開いて「採点キーワード」が全部書けているか確認しましょう！'
      : getPhaseGuide(elapsedMin)
    timeDisp.classList.toggle('warn', remain <= 8 * 60 && remain > 0)
  }

  const startBtn = h('button.btn.sm.yellow', {
    type: 'button',
    onclick: () => {
      if (timerId) {
        clearInterval(timerId); timerId = null
        startBtn.textContent = '▶ 再開'
      } else {
        if (remain <= 0) remain = TOTAL
        timerId = setInterval(() => {
          remain = Math.max(0, remain - 1)
          paint()
          if (remain === 0) {
            clearInterval(timerId); timerId = null
            startBtn.textContent = '▶ 60分スタート'
            toast({ msg: '60分経過！ 試験終了です。採点チェックで答え合わせしましょう！', type: 'qed' })
          }
        }, 1000)
        startBtn.textContent = '⏸ 一時停止'
      }
    },
  }, '▶ 60分タイマー開始')

  const resetBtn = h('button.btn.sm', {
    type: 'button',
    onclick: () => {
      if (timerId) { clearInterval(timerId); timerId = null }
      remain = TOTAL
      startBtn.textContent = '▶ 60分タイマー開始'
      paint()
    },
  }, '↺ 60:00 に戻す')

  paint()

  const el = h('div.mt-timer-card.reveal',
    h('div.mt-tm-top',
      h('div',
        h('span.ig-tag', '60-MIN EXAM SIMULATOR'),
        h('b', { style: { display: 'block', fontSize: '15px', marginTop: '2px' } }, '⏱ 本番60分 ペースメーカー（途中退出不可の本番と同じ時間感覚で演習）')),
      timeDisp,
      h('div.mt-tm-btns', startBtn, resetBtn)),
    h('div.pbar', { style: { margin: '8px 0 6px' } }, barFill),
    phaseDisp)

  el._stop = () => { if (timerId) { clearInterval(timerId); timerId = null } }
  return el
}
