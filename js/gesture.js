/* 手勢判斷：只做數學，不碰畫面與鏡頭（終端機也能 import）。 */

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const okPoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);

/** 回傳伸出幾根手指（0～5）；資料不完整回傳 null。用距離判斷，手轉任何方向都適用。 */
export function countFingers(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length !== 21) return null;
  if (!landmarks.every(okPoint)) return null;
  const wrist = landmarks[0];
  let n = 0;
  // 四指：指尖到手腕 > 第二關節到手腕 × 1.22
  for (const [tip, pip] of [[8, 6], [12, 10], [16, 14], [20, 18]]) {
    if (dist(landmarks[tip], wrist) > dist(landmarks[pip], wrist) * 1.22) n++;
  }
  // 拇指：指尖到小指根 > 拇指關節到小指根 × 1.05
  const pinkyBase = landmarks[17];
  if (dist(landmarks[4], pinkyBase) > dist(landmarks[3], pinkyBase) * 1.05) n++;
  return n;
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
