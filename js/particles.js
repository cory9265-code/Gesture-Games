/* 粒子：Canvas 2D 全螢幕畫布。只負責形狀與繪圖，不碰鏡頭與音樂。 */

export const SHAPE_LABELS = {
  sphere: '球體', heart: '愛心', star: '星星', galaxy: '銀河', firework: '煙火',
  spiral: '螺旋', snow: '雪花', dna: 'DNA', butterfly: '蝴蝶', infinity: '無限', note: '音符',
  castle: '城堡', castleShow: '城堡煙火', caution: '小心', beauty: '美女', missile: '響尾蛇飛彈', mountains: '群山', strike: '飛彈攻山'
};

/** 佔滿整個視窗的形狀（不跟手移動、不轉動）。 */
const FULLSCREEN = new Set(['mountains', 'strike']);
/** 固定在畫面中央、放大顯示的形狀（不跟手移動、不轉動），輪廓才看得清楚。 */
const CENTERED = new Set(['castle', 'castleShow', 'caution', 'beauty']);

export const THEMES = {
  space:    { bg: [3, 4, 14],   colors: ['#ffffff', '#9fd8ff', '#c9b0ff', '#7fb0ff', '#ffe7a6'], stars: true },
  ocean:    { bg: [1, 16, 28],  colors: ['#e8fdff', '#6ff0ff', '#3fb8ff', '#7dffd6', '#b8e6ff'], stars: false },
  neon:     { bg: [8, 2, 16],   colors: ['#ff5fd2', '#5ef6ff', '#b6ff5e', '#ffffff', '#b77bff'], stars: false },
  festival: { bg: [20, 4, 4],   colors: ['#ffd76a', '#ff6b5e', '#fff3c4', '#ff9f43', '#ffffff'], stars: true }
};

const TAU = Math.PI * 2;
const rnd = (a = -1, b = 1) => a + Math.random() * (b - a);

/* ---- 用矩形、三角形拼圖，再在裡面撒點（約 1/3 撒在邊線上，輪廓比較清楚） ---- */
function triArea(t) { return Math.abs((t[2] - t[0]) * (t[5] - t[1]) - (t[4] - t[0]) * (t[3] - t[1])) / 2; }
function samplePieces(pieces, holes, n, edgeRatio = 1 / 3) {
  const area = pieces.map(pc => pc.r ? (pc.r[2] - pc.r[0]) * (pc.r[3] - pc.r[1]) : triArea(pc.t));
  const total = area.reduce((a, b) => a + b, 0);
  const inHole = (x, y) => holes.some(h => x > h[0] && x < h[2] && y > h[1] && y < h[3]);
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 20) {
    let k = Math.random() * total, i = 0;
    while (k > area[i] && i < area.length - 1) k -= area[i++];
    const pc = pieces[i], edge = Math.random() < edgeRatio;
    let x, y;
    if (pc.r) {
      const [x0, y0, x1, y1] = pc.r;
      if (edge) { const side = (Math.random() * 4) | 0, u = Math.random();
        [x, y] = side === 0 ? [x0 + u * (x1 - x0), y0] : side === 1 ? [x0 + u * (x1 - x0), y1] : side === 2 ? [x0, y0 + u * (y1 - y0)] : [x1, y0 + u * (y1 - y0)];
      } else { x = rnd(x0, x1); y = rnd(y0, y1); }
    } else {
      const t = pc.t;
      if (edge) { const e = (Math.random() * 3) | 0, u = Math.random(), a = e * 2, b = ((e + 1) % 3) * 2;
        x = t[a] + u * (t[b] - t[a]); y = t[a + 1] + u * (t[b + 1] - t[a + 1]);
      } else { let u = Math.random(), v = Math.random(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
        x = t[0] + u * (t[2] - t[0]) + v * (t[4] - t[0]); y = t[1] + u * (t[3] - t[1]) + v * (t[5] - t[1]);
      }
    }
    if (inHole(x, y)) continue;
    out.push({ x, y, z: rnd(-0.08, 0.08) });
  }
  return out;
}

/** 原創童話城堡：中央高塔、內側兩座塔、外側兩座塔、城牆垛口、拱門與窗戶。 */
function castlePoints(n) {
  const R = (x0, y0, x1, y1) => ({ r: [x0, y0, x1, y1] }), T = (...t) => ({ t });
  const pieces = [
    R(-0.8, -0.85, 0.8, -0.3),                                        // 城牆
    R(-0.98, -0.85, -0.72, 0.1), R(0.72, -0.85, 0.98, 0.1),          // 外側塔
    T(-1.03, 0.1, -0.67, 0.1, -0.85, 0.55), T(0.67, 0.1, 1.03, 0.1, 0.85, 0.55),
    R(-0.52, -0.3, -0.32, 0.3), R(0.32, -0.3, 0.52, 0.3),            // 內側塔
    T(-0.56, 0.3, -0.28, 0.3, -0.42, 0.72), T(0.28, 0.3, 0.56, 0.3, 0.42, 0.72),
    R(-0.2, -0.3, 0.2, 0.42),                                         // 中央高塔
    T(-0.26, 0.42, 0.26, 0.42, 0, 1.0),
    R(-0.008, 1.0, 0.008, 1.12), T(0.008, 1.12, 0.008, 1.04, 0.12, 1.08)   // 旗子
  ];
  for (let x = -0.78; x < 0.76; x += 0.13) pieces.push(R(x, -0.3, x + 0.07, -0.22));   // 垛口
  const holes = [
    [-0.13, -0.86, 0.13, -0.5],                                       // 城門
    [-0.06, 0.05, 0.06, 0.22], [-0.47, -0.05, -0.37, 0.1], [0.37, -0.05, 0.47, 0.1],
    [-0.9, -0.35, -0.8, -0.2], [0.8, -0.35, 0.9, -0.2]               // 窗戶
  ];
  const pts = samplePieces(pieces, holes, n, 0.7);   // 七成粒子在輪廓線上，城堡外形比較清楚
  for (const p of pts) { p.y -= 0.1; p.z = rnd(-0.02, 0.02); }
  return pts;
}

/** 飛彈（機頭朝右）：細長彈身、尖頭、前翼、尾翼、尾焰。 */
function missilePoints(n) {
  const R = (x0, y0, x1, y1) => ({ r: [x0, y0, x1, y1] }), T = (...t) => ({ t });
  const pieces = [
    R(-0.85, -0.055, 0.7, 0.055), T(0.7, -0.055, 0.7, 0.055, 0.98, 0),   // 彈身、彈頭
    T(0.42, 0.055, 0.56, 0.055, 0.5, 0.17), T(0.42, -0.055, 0.56, -0.055, 0.5, -0.17),   // 前翼
    T(-0.85, 0.055, -0.6, 0.055, -0.8, 0.27), T(-0.85, -0.055, -0.6, -0.055, -0.8, -0.27)  // 尾翼
  ];
  const body = samplePieces(pieces, [], Math.floor(n * 0.85));
  for (let i = body.length; i < n; i++) {                            // 尾焰：往後散開的錐形
    const u = Math.random();
    body.push({ x: -0.86 - u * 0.4, y: rnd(-1, 1) * (0.05 + u * 0.09), z: rnd(-0.05, 0.05) });
  }
  return body;
}

/** 在隱藏的畫布上畫圖，再從有顏色的像素裡隨機挑點（只在瀏覽器裡用）。 */
function canvasPoints(n, w, h, draw) {
  if (typeof document === 'undefined') return [];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  draw(g);
  const data = g.getImageData(0, 0, w, h).data, on = [];
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (data[(y * w + x) * 4 + 3] > 128) on.push(x, y);
  const pts = [], s = Math.max(w, h) / 2, cnt = on.length / 2;
  for (let i = 0; i < n && cnt; i++) {
    const k = ((Math.random() * cnt) | 0) * 2;
    pts.push({ x: (on[k] + rnd(-1, 1) - w / 2) / s, y: -(on[k + 1] + rnd(-1, 1) - h / 2) / s, z: rnd(-0.02, 0.02) });
  }
  return pts;
}

/** 隱藏版 1：粒子排出「小心」 */
function cautionPoints(n) {
  return canvasPoints(n, 640, 320, g => {
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 230px "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';
    g.fillText('小心', 320, 165);
  }).map(p => ({ ...p, x: p.x * 1.15, y: p.y * 1.15 }));
}

/** 隱藏版 2：原創的女生肖像線條畫（長髮、五官、耳環、髮上的花） */
function beautyPoints(n) {
  return canvasPoints(n, 400, 420, g => {
    g.translate(200, 200); g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
    const path = d => g.stroke(new Path2D(d));
    path('M -70 -40 C -72 40, -35 95, 0 100 C 35 95, 72 40, 70 -40');                         // 臉
    path('M 0 -138 C -115 -138, -122 -40, -106 60 C -96 140, -128 175, -150 205');             // 頭髮外側
    path('M 0 -138 C 115 -138, 122 -40, 106 60 C 96 140, 128 175, 150 205');
    path('M -70 -40 C -62 -105, 25 -118, 72 -45');                                             // 瀏海
    path('M -45 -98 C -25 -60, 15 -72, 60 -60');
    path('M -88 30 C -80 100, -95 150, -110 190'); path('M 88 30 C 80 100, 95 150, 110 190');   // 髮絲
    for (const s of [-1, 1]) {
      path(`M ${s * 47} -20 Q ${s * 29} -36 ${s * 11} -20 Q ${s * 29} -11 ${s * 47} -20`);       // 眼睛
      g.beginPath(); g.arc(s * 29, -21, 6, 0, Math.PI * 2); g.fill();
      path(`M ${s * 47} -21 L ${s * 54} -27 M ${s * 42} -27 L ${s * 46} -34 M ${s * 35} -30 L ${s * 37} -38`);   // 睫毛
      path(`M ${s * 52} -42 Q ${s * 32} -54 ${s * 12} -45`);                                     // 眉毛
      path(`M ${s * 25} 95 L ${s * 28} 140 C ${s * 60} 150, ${s * 110} 160, ${s * 140} 205`);    // 脖子、肩膀
    }
    path('M 0 -8 Q -6 15 -8 22 Q 0 27 7 22');                                                  // 鼻子
    path('M -21 50 Q -8 41 0 45 Q 8 41 21 50 Q 0 64 -21 50 M -21 50 Q 0 54 21 50');            // 嘴唇
    g.beginPath(); g.arc(-73, 26, 6, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(73, 26, 6, 0, Math.PI * 2); g.stroke();   // 耳環
    for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; g.beginPath(); g.arc(-72 + Math.cos(a) * 11, -100 + Math.sin(a) * 11, 8, 0, Math.PI * 2); g.stroke(); }   // 花
    g.beginPath(); g.arc(-72, -100, 4, 0, Math.PI * 2); g.fill();
  }).map(p => ({ ...p, x: p.x * 1.1, y: p.y * 1.1 + 0.05 }));
}

/** 佔滿視窗的群山（x、y 都是 -1～1 對應整個視窗）。前排深、後排淺。 */
const ridge = (x, peaks, base) => base + Math.max(...peaks.map(([c, h, w]) => h * Math.max(0, 1 - Math.abs(x - c) / w))) + 0.02 * Math.sin(x * 23) + 0.015 * Math.sin(x * 51);
const FRONT = [[-0.8, 0.4, 0.4], [-0.32, 0.6, 0.42], [0.12, 0.3, 0.32], [0.55, 0.65, 0.4], [0.95, 0.35, 0.35]];
const BACK = [[-0.6, 0.8, 0.5], [0.0, 1.0, 0.55], [0.72, 0.85, 0.5]];
function mountainPoints(n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = rnd(-1.02, 1.02), k = i % 10;
    if (k < 4) pts.push({ x, y: ridge(x, FRONT, -0.6) + rnd(-0.01, 0.01), z: 0 });                // 前排稜線
    else if (k < 7) { const top = ridge(x, FRONT, -0.6); pts.push({ x, y: top - (top + 1) * Math.pow(Math.random(), 1.8), z: 0 }); }   // 前排山體
    else if (k < 9) pts.push({ x, y: ridge(x, BACK, -0.45) + rnd(-0.01, 0.01), z: 0.4 });         // 後排稜線
    else { const top = ridge(x, BACK, -0.45); pts.push({ x, y: top - Math.pow(Math.random(), 2.5) * 0.35, z: 0.4 }); }   // 後排山體
  }
  return pts;
}

/** 產生某個形狀的 n 個目標點（大約在 -1～1 的立體空間，y 向上）。 */
function shapePoints(name, n) {
  if (name === 'castle' || name === 'castleShow') return shuffle(castlePoints(n));
  if (name === 'missile') return shuffle(missilePoints(n));
  if (name === 'caution') return shuffle(cautionPoints(n));
  if (name === 'beauty') return shuffle(beautyPoints(n));
  if (name === 'mountains' || name === 'strike') return shuffle(mountainPoints(n));
  const pts = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, r1 = Math.random(), r2 = Math.random();
    let x = 0, y = 0, z = 0;
    switch (name) {
      case 'heart': {
        const t = r1 * TAU, s = i % 3 === 0 ? Math.sqrt(r2) : 1;
        x = 16 * Math.sin(t) ** 3 / 17 * s;
        y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 * s + 0.15;
        z = rnd(-0.12, 0.12); break;
      }
      case 'star': {
        const a = r1 * TAU, seg = TAU / 5, k = ((a + Math.PI / 2) % seg) / seg;
        const edge = 1 - Math.abs(k - 0.5) * 2;                 // 0 在凹點，1 在尖端
        const rad = 0.42 + edge * 0.58, s = i % 3 === 0 ? Math.sqrt(r2) : 1;
        x = Math.cos(a) * rad * s; y = Math.sin(a) * rad * s; z = rnd(-0.1, 0.1); break;
      }
      case 'galaxy': {
        const arm = i % 3, r = Math.pow(r1, 0.65), a = arm * TAU / 3 + r * 4.2 + rnd(-0.35, 0.35) * (1 - r * 0.5);
        x = Math.cos(a) * r; z = Math.sin(a) * r; y = rnd(-0.06, 0.06) * (1.2 - r); break;
      }
      case 'firework': {
        const rays = 48, ray = i % rays, phi = Math.acos(1 - 2 * ((ray + 0.5) / rays)), th = ray * 2.399963;
        const r = 0.15 + Math.pow(r1, 0.6) * 0.85;
        x = Math.sin(phi) * Math.cos(th) * r; y = Math.cos(phi) * r; z = Math.sin(phi) * Math.sin(th) * r; break;
      }
      case 'spiral': {
        const t = u * 6 * Math.PI, r = 0.1 + u * 0.9;
        x = Math.cos(t) * r + rnd(-0.03, 0.03); y = Math.sin(t) * r + rnd(-0.03, 0.03); z = (u - 0.5) * 0.6; break;
      }
      case 'snow': {
        const arm = i % 6, a = arm * TAU / 6 + Math.PI / 2, t = r1;
        let px = t, py = 0;
        if (i % 4 === 1 && t > 0.3) { const b = (r2 * 0.3) * (1 - t * 0.6); px = t; py = (i % 8 === 1 ? 1 : -1) * b; px -= b * 0.4; }
        x = Math.cos(a) * px - Math.sin(a) * py; y = Math.sin(a) * px + Math.cos(a) * py; z = rnd(-0.05, 0.05); break;
      }
      case 'dna': {
        const yy = u * 2 - 1, a = yy * 3 * Math.PI;
        if (i % 5 === 0) { const k = rnd(-1, 1); x = Math.cos(a) * 0.4 * k; z = Math.sin(a) * 0.4 * k; }
        else { const st = i % 2 ? Math.PI : 0; x = Math.cos(a + st) * 0.4; z = Math.sin(a + st) * 0.4; }
        y = yy * 0.95; break;
      }
      case 'butterfly': {
        const t = r1 * 12 * Math.PI, rr = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) + Math.sin(t / 12) ** 5, s = i % 3 === 0 ? Math.sqrt(r2) : 1;
        x = Math.sin(t) * rr / 3.2 * s; y = Math.cos(t) * rr / 3.2 * s; z = rnd(-0.08, 0.08); break;
      }
      case 'infinity': {
        const t = r1 * TAU, d = 1 + Math.sin(t) ** 2;
        x = Math.cos(t) / d * 1.05 + rnd(-0.04, 0.04); y = Math.sin(t) * Math.cos(t) / d * 1.05 + rnd(-0.04, 0.04); z = rnd(-0.08, 0.08); break;
      }
      case 'note': {
        const pick = i % 10;
        if (pick < 5) { const a = r1 * TAU, s = Math.sqrt(r2); x = -0.32 + Math.cos(a) * 0.3 * s; y = -0.62 + Math.sin(a) * 0.2 * s; const c = Math.cos(-0.4), si = Math.sin(-0.4); const dx = x + 0.32, dy = y + 0.62; x = -0.32 + dx * c - dy * si; y = -0.62 + dx * si + dy * c; }
        else if (pick < 8) { x = -0.04 + rnd(-0.025, 0.025); y = -0.6 + r1 * 1.5; }
        else { const t = r1; x = -0.04 + t * 0.45; y = 0.9 - t * 0.55 - Math.sin(t * Math.PI) * 0.12; }
        z = rnd(-0.06, 0.06); break;
      }
      default: { // sphere
        const phi = Math.acos(1 - 2 * u), th = i * 2.399963;
        x = Math.sin(phi) * Math.cos(th); y = Math.cos(phi); z = Math.sin(phi) * Math.sin(th);
      }
    }
    pts.push({ x, y, z });
  }
  return shuffle(pts);
}

/** 打亂順序，換形狀時粒子會從各處飛過去 */
function shuffle(pts) {
  for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
  return pts;
}

export class ParticleField {
  constructor(canvas, { count = 1400, theme = 'space', shape = 'sphere' } = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.theme = THEMES[theme] || THEMES.space;
    this.count = Math.max(100, Math.min(6000, Math.floor(count) || 1400));
    this.cache = new Map();
    this.shape = shape;
    const target = this.pointsFor(shape);
    this.p = target.map(t => ({ x: t.x, y: t.y, z: t.z, c: (Math.random() * this.theme.colors.length) | 0, tw: Math.random() * TAU }));
    this.target = target;
    this.cx = 0.5; this.cy = 0.5; this.tx = 0.5; this.ty = 0.5;
    this.scale = 1; this.scaleTarget = 1;
    this.bgStars = Array.from({ length: 160 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + 0.3, tw: Math.random() * TAU }));
    this.missiles = []; this.rings = []; this.strikeNext = 0; this.shake = 0;   // 飛彈攻山
    this.rockets = []; this.sparks = []; this.fxUntil = -1; this.fxNext = 0; this.lastT = null;   // 全螢幕煙火
    this.resize(); this.first = true;
    addEventListener('resize', () => this.resize());
  }
  pointsFor(name) { if (!this.cache.has(name)) this.cache.set(name, shapePoints(name, this.count)); return this.cache.get(name); }
  setShape(name) {
    if (name === this.shape) return;
    this.shapeStart = null;   // 下一格記下換形狀的時間
    this.shape = name; this.target = this.pointsFor(name);
    // 換形狀時給一點爆開的感覺
    for (const q of this.p) { q.x *= 1.25; q.y *= 1.25; q.z *= 1.25; }
  }
  setTarget(x, y) { this.tx = Math.min(1, Math.max(0, x)); this.ty = Math.min(1, Math.max(0, y)); }
  setScale(s) { this.scaleTarget = Math.min(2.6, Math.max(0.5, s)); }
  /** 全螢幕放煙火，持續到 t + seconds（重複呼叫會延長）。 */
  celebrate(t, seconds = 3) { this.fxUntil = Math.max(this.fxUntil, t + seconds); }
  get celebrating() { return this.rockets.length > 0 || this.sparks.length > 0; }
  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.floor(innerWidth * dpr));
    this.canvas.height = Math.max(1, Math.floor(innerHeight * dpr));
    this.first = true;
  }
  frame(t) {
    const { ctx, canvas, theme } = this, W = canvas.width, H = canvas.height, [br, bg, bb] = theme.bg;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = this.first ? `rgb(${br},${bg},${bb})` : `rgba(${br},${bg},${bb},0.3)`;
    ctx.fillRect(0, 0, W, H); this.first = false;

    ctx.globalCompositeOperation = 'lighter';
    if (theme.stars) {
      ctx.fillStyle = '#ffffff';
      for (const s of this.bgStars) {
        ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 1.3 + s.tw);
        ctx.fillRect(s.x * W, s.y * H, s.r * this.dpr, s.r * this.dpr);
      }
      ctx.globalAlpha = 1;
    }

    this.cx += (this.tx - this.cx) * 0.14; this.cy += (this.ty - this.cy) * 0.14;
    this.scale += (this.scaleTarget - this.scale) * 0.1;
    const shape = this.shape, full = FULLSCREEN.has(shape), centered = CENTERED.has(shape);
    const shx = this.shake > 0 ? rnd(-1, 1) * this.shake : 0, shy = this.shake > 0 ? rnd(-1, 1) * this.shake : 0;
    this.shake = Math.max(0, this.shake * 0.88 - 0.05);
    const base = centered ? Math.min(W * 0.4, H * 0.36) : Math.min(W, H) * 0.3 * this.scale;
    const ox = (centered ? W / 2 : this.cx * W) + shx, oy = (centered ? H * 0.58 : this.cy * H) + shy;
    const spin = full || centered ? 0 : (shape === 'sphere' || shape === 'dna' || shape === 'firework' || shape === 'galaxy') ? t * 0.45
      : shape === 'missile' ? Math.sin(t * 0.7) * 0.25 : Math.sin(t * 0.5) * 0.6;
    const cs = Math.cos(spin), sn = Math.sin(spin);
    const tilt = shape === 'galaxy' ? 1.1 : 0, ct = Math.cos(tilt), st = Math.sin(tilt);
    const boom = shape === 'firework' ? 0.55 + 0.6 * (1 - Math.pow(1 - ((t * 0.55) % 1), 3)) : 1;
    const pr = Math.max(1.4, Math.min(W, H) / 420) ;
    const paths = theme.colors.map(() => new Path2D());

    for (let i = 0; i < this.p.length; i++) {
      const q = this.p[i], g = this.target[i];
      const k = 0.07;
      q.x += (g.x * boom - q.x) * k + rnd(-0.002, 0.002);
      q.y += (g.y * boom - q.y) * k + rnd(-0.002, 0.002);
      q.z += (g.z * boom - q.z) * k;
      // 轉動：先繞 Y 軸，再繞 X 軸傾斜
      let x = q.x * cs + q.z * sn, z = -q.x * sn + q.z * cs, y = q.y;
      const y2 = y * ct - z * st; z = y * st + z * ct; y = y2;
      const persp = 1 / (1 + z * 0.35);
      const sx = full ? W / 2 + shx + x * W / 2 : ox + x * base * persp, sy = full ? H / 2 + shy - y * H / 2 : oy - y * base * persp;
      const r = pr * persp * (0.8 + 0.4 * Math.sin(t * 3 + q.tw));
      paths[q.c].moveTo(sx + r, sy); paths[q.c].arc(sx, sy, r, 0, TAU);
    }
    theme.colors.forEach((c, i) => { ctx.fillStyle = c; ctx.fill(paths[i]); });
    if (shape === 'strike') this.drawStrike(t, W, H);
    else { this.missiles.length = 0; this.rings.length = 0; }
    this.drawFireworks(t, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  /** 飛彈攻山：飛彈從天空兩側射向山上，命中就爆炸，附近的粒子被炸開後慢慢回到原位。 */
  drawStrike(t, W, H) {
    const ctx = this.ctx, u = Math.max(1, Math.min(W, H) / 500), dt = this.lastT === null ? 0 : Math.min(0.05, Math.max(0, t - this.lastT));
    if (this.shapeStart === null || this.shapeStart === undefined) this.shapeStart = t;
    // 先讓群山聚合成形，1.5 秒後才開始發射飛彈
    if (t - this.shapeStart >= 1.5 && t >= this.strikeNext) {
      const g = this.target[(Math.random() * this.target.length) | 0];
      const tx = W / 2 + g.x * W / 2, ty = H / 2 - g.y * H / 2, fromLeft = Math.random() < 0.5;
      const x = fromLeft ? rnd(-0.1, 0.3) * W : rnd(0.7, 1.1) * W, y = -0.08 * H;
      this.missiles.push({ x, y, tx, ty, v: Math.hypot(W, H) * rnd(0.45, 0.65) });
      this.strikeNext = t + rnd(0.25, 0.6);
    }
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i], dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy) || 1, step = m.v * dt;
      const ux = dx / d, uy = dy / d;
      if (step >= d) { this.missiles.splice(i, 1); this.explode(m.tx, m.ty, W, H); continue; }
      m.x += ux * step; m.y += uy * step;
      const L = 22 * u;
      // 尾焰與煙
      const fl = ctx.createLinearGradient(m.x, m.y, m.x - ux * L * 3, m.y - uy * L * 3);
      fl.addColorStop(0, 'rgba(255,220,120,0.95)'); fl.addColorStop(0.3, 'rgba(255,120,40,0.6)'); fl.addColorStop(1, 'rgba(120,120,140,0)');
      ctx.strokeStyle = fl; ctx.lineWidth = 4 * u;
      ctx.beginPath(); ctx.moveTo(m.x - ux * L, m.y - uy * L); ctx.lineTo(m.x - ux * L * 4, m.y - uy * L * 4); ctx.stroke();
      // 彈身與彈翼
      ctx.strokeStyle = '#e8edf5'; ctx.lineWidth = 3 * u;
      ctx.beginPath(); ctx.moveTo(m.x - ux * L, m.y - uy * L); ctx.lineTo(m.x + ux * L * 0.4, m.y + uy * L * 0.4); ctx.stroke();
      ctx.lineWidth = 1.6 * u;
      for (const s of [1, -1]) {
        ctx.beginPath(); ctx.moveTo(m.x - ux * L * 0.9, m.y - uy * L * 0.9); ctx.lineTo(m.x - ux * L * 1.1 - uy * s * 7 * u, m.y - uy * L * 1.1 + ux * s * 7 * u); ctx.stroke();
      }
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {             // 衝擊波
      const r = this.rings[i]; r.life -= dt * 1.6; r.r += dt * Math.min(W, H) * 0.5;
      if (r.life <= 0) { this.rings.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(255,200,140,${r.life * 0.7})`; ctx.lineWidth = 3 * u * r.life;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
    }
  }

  /** 爆炸：閃光、衝擊波、火花，並把附近的山粒子炸開。 */
  explode(x, y, W, H) {
    const ctx = this.ctx, R = Math.min(W, H) * 0.16;
    const flash = ctx.createRadialGradient(x, y, 0, x, y, R);
    flash.addColorStop(0, 'rgba(255,250,220,0.95)'); flash.addColorStop(0.4, 'rgba(255,150,50,0.6)'); flash.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = flash; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    this.rings.push({ x, y, r: R * 0.2, life: 1 });
    const count = 60 + ((Math.random() * 40) | 0), speed = Math.min(W, H) * 0.4;
    for (let k = 0; k < count; k++) {
      const a = Math.random() * TAU, v = speed * rnd(0.2, 1);
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.3, life: 1, decay: rnd(0.6, 1.1), hue: rnd(10, 50) });
    }
    for (const q of this.p) {                                        // 炸開附近的粒子（之後會自己飛回去）
      const px = W / 2 + q.x * W / 2, py = H / 2 - q.y * H / 2, dx = px - x, dy = py - y, d = Math.hypot(dx, dy);
      if (d < R && d > 0) { const f = (1 - d / R) * R * 0.9; q.x += dx / d * f * 2 / W; q.y -= dy / d * f * 2 / H; }
    }
    this.shake = Math.min(14, this.shake + 7);
  }

  /** 全螢幕煙火：從底部發射，升到高處後炸開，火花受重力往下掉、慢慢變暗。 */
  drawFireworks(t, W, H) {
    const dt = this.lastT === null ? 0 : Math.min(0.05, Math.max(0, t - this.lastT));
    this.lastT = t;
    if (t < this.fxUntil && t >= this.fxNext) {
      const n = Math.random() < 0.3 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const x = W * rnd(0.08, 0.92);
        const sky = CENTERED.has(this.shape);   // 城堡煙火：只在城堡上方的天空炸開，不蓋住城堡
        this.rockets.push({ x: sky ? W * (Math.random() < 0.5 ? rnd(0.05, 0.3) : rnd(0.7, 0.95)) : x, y: H + 10, vx: rnd(-0.04, 0.04) * W, vy: -H * rnd(1.1, 1.5), ty: H * (sky ? rnd(0.1, 0.28) : rnd(0.12, 0.5)), hue: Math.random() * 360 });
      }
      this.fxNext = t + (CENTERED.has(this.shape) ? rnd(0.35, 0.7) : rnd(0.15, 0.4));
    }
    if (!this.rockets.length && !this.sparks.length) return;
    const ctx = this.ctx, g = H * 0.35, u = Math.max(1, Math.min(W, H) / 500);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    // 火箭
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      const px = r.x, py = r.y;
      r.x += r.vx * dt; r.y += r.vy * dt; r.vy += g * 0.5 * dt;
      ctx.strokeStyle = `hsla(${r.hue},100%,80%,0.9)`; ctx.lineWidth = 2.2 * u;
      ctx.beginPath(); ctx.moveTo(px, py + 12 * u); ctx.lineTo(r.x, r.y); ctx.stroke();
      if (r.y <= r.ty || r.vy >= 0) {
        this.rockets.splice(i, 1);
        const count = 70 + ((Math.random() * 50) | 0), speed = Math.min(W, H) * rnd(0.35, 0.55), twoTone = Math.random() < 0.4;
        for (let k = 0; k < count; k++) {
          const a = (k / count) * TAU + rnd(-0.05, 0.05), v = speed * rnd(0.55, 1);
          const hue = twoTone && k % 2 ? (r.hue + 140) % 360 : r.hue + rnd(-15, 15);
          this.sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, decay: rnd(0.45, 0.75), hue });
        }
      }
    }
    // 火花
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      const px = s.x, py = s.y;
      s.vx *= Math.pow(0.35, dt); s.vy = s.vy * Math.pow(0.35, dt) + g * dt;
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= s.decay * dt;
      if (s.life <= 0) { this.sparks.splice(i, 1); continue; }
      ctx.strokeStyle = `hsla(${s.hue},100%,${60 + s.life * 25}%,${Math.min(1, s.life * 1.4)})`;
      ctx.lineWidth = (1 + s.life * 1.8) * u;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(s.x, s.y); ctx.stroke();
    }
  }
}
