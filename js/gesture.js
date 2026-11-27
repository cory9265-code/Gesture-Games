/* 手勢判斷：只做數學，不碰畫面與鏡頭（終端機也能 import）。 */

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const okPoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);

const valid = lm => Array.isArray(lm) && lm.length === 21 && lm.every(okPoint);

/** 四指各自有沒有伸直：[食指, 中指, 無名指, 小指]。指尖到手腕 > 第二關節到手腕 × 1.22 */
function fourFingers(lm) {
  const wrist = lm[0];
  return [[8, 6], [12, 10], [16, 14], [20, 18]].map(([tip, pip]) => dist(lm[tip], wrist) > dist(lm[pip], wrist) * 1.22);
}

/** 大拇指有沒有伸出：三個條件都要成立，避免比 1 時微張的大拇指被多算一根。
   1. 指尖離小指根夠遠（比拇指關節遠 1.1 倍以上）
   2. 大拇指本身是直的（指尖－關節－根部的夾角 > 145 度）
   3. 指尖沒有靠在食指根部旁邊（距離 > 0.6 個手掌長）
   4. 指尖沒有碰到其他手指的指尖（比 3 時大拇指常圈住食指或小指） */
function thumbOut(lm) {
  const pinkyBase = lm[17], palm = dist(lm[0], lm[9]) || 1e-6;
  const far = dist(lm[4], pinkyBase) > dist(lm[3], pinkyBase) * 1.1;
  const ax = lm[2].x - lm[3].x, ay = lm[2].y - lm[3].y, bx = lm[4].x - lm[3].x, by = lm[4].y - lm[3].y;
  const cos = (ax * bx + ay * by) / ((Math.hypot(ax, ay) * Math.hypot(bx, by)) || 1e-6);
  const straight = cos < Math.cos(145 * Math.PI / 180);
  const awayFromIndex = dist(lm[4], lm[5]) > palm * 0.6;
  const notTouching = [8, 12, 16, 20].every(k => dist(lm[4], lm[k]) > palm * 0.3);
  return far && straight && awayFromIndex && notTouching;
}

/** 寬鬆版大拇指：只用在比 6（大拇指往旁邊張開時常常有點彎，嚴格版會漏掉）。
   指尖離小指根比拇指關節遠，而且明顯離開手掌（離食指根、中指根都夠遠）。 */
function thumbLoose(lm) {
  const palm = dist(lm[0], lm[9]) || 1e-6;
  return dist(lm[4], lm[17]) > dist(lm[3], lm[17]) && dist(lm[4], lm[5]) > palm * 0.5 && dist(lm[4], lm[9]) > palm * 0.7;
}

/** 回傳伸出幾根手指（0～5）；資料不完整回傳 null。用距離與角度判斷，手轉任何方向都適用。 */
export function countFingers(landmarks) {
  if (!valid(landmarks)) return null;
  return fourFingers(landmarks).filter(Boolean).length + (thumbOut(landmarks) ? 1 : 0);
}

/** 比「6」（只伸大拇指和小指）。這不是 1～5 的手勢，形狀維持不變。 */
export function isSixSign(landmarks) {
  if (!valid(landmarks)) return false;
  const [i, m, r, p] = fourFingers(landmarks);
  return p && !i && !m && !r && (thumbOut(landmarks) || thumbLoose(landmarks));
}

/** 特殊手勢代碼（6～10），不是特殊手勢就回傳一般的手指數 0～5。
   單手：6＝大拇指＋小指｜7＝大拇指＋食指｜8＝大拇指＋食指＋中指｜9＝除了小指都伸出
   雙手（兩手靠近，手腕左右距離 < spreadGap）：9＝一手張開＋一手比 4｜10＝兩手都張開
   兩手拉很開時不算 9／10，留給「雙手張開放煙火」。 */
export function gestureCode(hands, spreadGap = 0.5) {
  if (!Array.isArray(hands) || !hands.length) return null;
  const [a, b] = hands;
  if (valid(a) && valid(b) && Math.abs(a[0].x - b[0].x) < spreadGap) {
    const ca = countFingers(a), cb = countFingers(b);
    if (ca === 5 && cb === 5) return 10;
    if ((ca === 5 && cb === 4) || (ca === 4 && cb === 5)) return 9;
  }
  if (!valid(a)) return null;
  if (isSixSign(a)) return 6;
  const [i, m, r, p] = fourFingers(a), th = thumbOut(a);
  // 比 3 的兩種比法：食指＋中指＋無名指，或中指＋無名指＋小指（大拇指收起來或圈住另一根手指）
  if (m && r && ((i && !p) || (!i && p)) && !th) return 3;
  if (!i && m && r && p) return 3;
  if (th) {
    if (p && !i && !m && !r) return 6;
    if (i && !m && !r && !p) return 7;
    if (i && m && !r && !p) return 8;
    if (i && m && r && !p) return 9;
  }
  return countFingers(a);
}

/** 雙手張開：看到兩隻手、都是張開的手掌（4 根以上），而且兩手腕左右距離超過畫面寬度的一半。 */
export function armsSpread(hands, minGap = 0.5) {
  if (!Array.isArray(hands) || hands.length < 2) return false;
  const [a, b] = hands;
  if (!valid(a) || !valid(b)) return false;
  return countFingers(a) >= 4 && countFingers(b) >= 4 && Math.abs(a[0].x - b[0].x) >= minGap;
}

/** 最近幾格多數決，避免只閃一格的手勢造成形狀亂跳。 */
export class GestureSmoother {
  constructor(size = 5) { this.size = Math.max(1, Math.floor(size) || 1); this.buf = []; }
  add(n) {
    if (n === null || n === undefined || !Number.isFinite(n)) return;
    this.buf.push(n);
    if (this.buf.length > this.size) this.buf.shift();
  }
  reset() { this.buf = []; }
  get value() {
    if (!this.buf.length) return null;
    const count = new Map();
    let best = null, bestCount = 0;
    // 由新到舊走，同票數時以最近出現的為準
    for (let i = this.buf.length - 1; i >= 0; i--) {
      const v = this.buf[i], c = (count.get(v) || 0) + 1;
      count.set(v, c);
      if (c > bestCount) { best = v; bestCount = c; }
    }
    return best;
  }
}

/** 握拳計時：握滿秒數的那一格回傳 true；握著不放不會再觸發，放開後才能再觸發。 */
export class FistHold {
  constructor(seconds = 0.5) { this.seconds = seconds; this.start = null; this.fired = false; }
  update(t, isFist) {
    if (!isFist) { this.start = null; this.fired = false; return false; }
    if (this.start === null) this.start = t;
    if (!this.fired && t - this.start >= this.seconds - 1e-9) { this.fired = true; return true; }
    return false;
  }
  reset() { this.start = null; this.fired = false; }
}

/** 手指數對應到設定的形狀；0、null、小數、超出範圍都回傳 null。 */
export function shapeFor(fingers, table) {
  if (!Array.isArray(table) || !Number.isInteger(fingers)) return null;
  if (fingers < 1 || fingers > table.length) return null;
  return table[fingers - 1];
}
