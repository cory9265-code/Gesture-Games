/* 粒子：Canvas 2D 全螢幕畫布。只負責形狀與繪圖，不碰鏡頭與音樂。 */

export const SHAPE_LABELS = {
  sphere: '球體', heart: '愛心', star: '星星', galaxy: '銀河', firework: '煙火',
  spiral: '螺旋', snow: '雪花', dna: 'DNA', butterfly: '蝴蝶', infinity: '無限', note: '音符'
};

export const THEMES = {
  space:    { bg: [3, 4, 14],   colors: ['#ffffff', '#9fd8ff', '#c9b0ff', '#7fb0ff', '#ffe7a6'], stars: true },
  ocean:    { bg: [1, 16, 28],  colors: ['#e8fdff', '#6ff0ff', '#3fb8ff', '#7dffd6', '#b8e6ff'], stars: false },
  neon:     { bg: [8, 2, 16],   colors: ['#ff5fd2', '#5ef6ff', '#b6ff5e', '#ffffff', '#b77bff'], stars: false },
  festival: { bg: [20, 4, 4],   colors: ['#ffd76a', '#ff6b5e', '#fff3c4', '#ff9f43', '#ffffff'], stars: true }
};

const TAU = Math.PI * 2;
const rnd = (a = -1, b = 1) => a + Math.random() * (b - a);

/** 產生某個形狀的 n 個目標點（大約在 -1～1 的立體空間，y 向上）。 */
function shapePoints(name, n) {
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
  // 打亂順序，換形狀時粒子會從各處飛過去
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
    this.resize(); this.first = true;
    addEventListener('resize', () => this.resize());
  }
  pointsFor(name) { if (!this.cache.has(name)) this.cache.set(name, shapePoints(name, this.count)); return this.cache.get(name); }
  setShape(name) {
    if (name === this.shape) return;
    this.shape = name; this.target = this.pointsFor(name);
    // 換形狀時給一點爆開的感覺
    for (const q of this.p) { q.x *= 1.25; q.y *= 1.25; q.z *= 1.25; }
  }
  setTarget(x, y) { this.tx = Math.min(1, Math.max(0, x)); this.ty = Math.min(1, Math.max(0, y)); }
  setScale(s) { this.scaleTarget = Math.min(2.6, Math.max(0.5, s)); }
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
    const base = Math.min(W, H) * 0.3 * this.scale, ox = this.cx * W, oy = this.cy * H;
    const shape = this.shape;
    const spin = (shape === 'sphere' || shape === 'dna' || shape === 'firework' || shape === 'galaxy') ? t * 0.45 : Math.sin(t * 0.5) * 0.6;
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
      const sx = ox + x * base * persp, sy = oy - y * base * persp;
      const r = pr * persp * (0.8 + 0.4 * Math.sin(t * 3 + q.tw));
      paths[q.c].moveTo(sx + r, sy); paths[q.c].arc(sx, sy, r, 0, TAU);
    }
    theme.colors.forEach((c, i) => { ctx.fillStyle = c; ctx.fill(paths[i]); });
    ctx.globalCompositeOperation = 'source-over';
  }
}
