/* 把鏡頭、手勢、粒子、音樂接起來。鏡頭、滑鼠、驗收都走同一條 feed()。 */
import CONFIG from './config.js';
import { countFingers, GestureSmoother, FistHold, shapeFor } from './gesture.js';
import { ParticleField, SHAPE_LABELS } from './particles.js';
import { Music } from './music.js';
import { startCamera, explainCameraError } from './camera.js';

const $ = s => document.querySelector(s);
const TEST = new URLSearchParams(location.search).get('test') === '1';
const shapes = Array.isArray(CONFIG.shapes) && CONFIG.shapes.length ? CONFIG.shapes : ['sphere'];
const THEME_LABEL = { space: '星空', ocean: '海洋', neon: '霓虹', festival: '節慶' };

document.title = CONFIG.title;
document.body.dataset.theme = CONFIG.theme || 'space';
$('#title').textContent = CONFIG.title;
$('#startTitle').textContent = CONFIG.title;

/* ---------- 狀態 ---------- */
const field = new ParticleField($('#stage'), { count: CONFIG.particles, theme: CONFIG.theme, shape: shapes[0] });
const music = new Music(CONFIG.music);
const smoother = new GestureSmoother(CONFIG.smooth || 5);
const fist = new FistHold(CONFIG.fistSeconds || 0.5);
let mode = 'mouse', fingers = null, shape = shapes[0], lastT = null, cam = null, started = TEST;

/* ---------- 唯一的手勢處理路徑 ---------- */
function feed(t, raw, x, y) {
  if (lastT !== null && (t - lastT > 0.3 || t < lastT)) fist.reset();   // 中間斷掉太久就重新計時
  lastT = t;
  if (raw === null || raw === undefined || !Number.isFinite(raw)) {
    // 手離開畫面：形狀、音樂維持原樣；握拳計時歸零
    fist.update(t, false); smoother.reset(); fingers = null; render(); return;
  }
  smoother.add(raw);
  fingers = smoother.value;
  const s = shapeFor(fingers, shapes);
  if (s && s !== shape) { shape = s; field.setShape(s); }
  if (fist.update(t, raw === 0 && fingers === 0)) music.toggle();
  if (Number.isFinite(x) && Number.isFinite(y)) field.setTarget(x, y);
  render();
}

window.__show = {
  state: () => ({ mode, fingers, shape, playing: music.playing, particles: field.p.length, theme: CONFIG.theme, title: CONFIG.title }),
  feed: (t, f, x, y) => feed(t, f, x, y)
};

/* ---------- 畫面文字 ---------- */
const lbl = n => SHAPE_LABELS[n] || n;
$('#legend').innerHTML = shapes.map((s, i) =>
  `<li><button type="button" data-f="${i + 1}"><b>比 ${i + 1}</b><span>${lbl(s)}</span></button></li>`).join('') +
  `<li><button type="button" data-fist><b>握拳 ${CONFIG.fistSeconds} 秒</b><span>暫停／播放下一首</span></button></li>` +
  `<li class="static"><b>食指移動</b><span>粒子跟著走</span></li>` +
  `<li class="static"><b>兩手拉開</b><span>粒子放大</span></li>`;

let lastUi = '';
function render() {
  const fTxt = fingers === null ? '—' : String(fingers);
  const mTxt = music.playing ? `♪ 播放中：${music.trackName}` : '⏸ 已暫停';
  const key = [mode, fTxt, shape, mTxt, music.audible].join('|');
  if (key === lastUi) return; lastUi = key;
  $('#vFingers').textContent = fTxt;
  $('#vShape').textContent = lbl(shape);
  $('#vMusic').textContent = mTxt;
  $('#vMode').textContent = mode === 'camera' ? '鏡頭' : '滑鼠';
  $('#mouseHelp').hidden = mode !== 'mouse';
  $('#toCamera').hidden = mode !== 'mouse' || TEST;
  $('#toMouse').hidden = mode !== 'camera';
  $('#soundHint').hidden = !(started && music.playing && !music.audible) || TEST;
  document.querySelectorAll('#legend button[data-f]').forEach(b => b.classList.toggle('on', shapes[b.dataset.f - 1] === shape));
}
function setStatus(text, kind = '') { const el = $('#status'); el.textContent = text; el.className = kind; el.hidden = !text; }

/* ---------- 滑鼠模式 ---------- */
let mx = 0.5, my = 0.5, mouseFingers = 1, fistDown = false;
addEventListener('pointermove', e => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; });
addEventListener('keydown', e => {
  if (e.key >= '1' && e.key <= '5') mouseFingers = +e.key;
  if (e.code === 'Space') { fistDown = true; e.preventDefault(); }
  if (e.key === 'n' || e.key === 'N') music.next();
});
addEventListener('keyup', e => { if (e.code === 'Space') fistDown = false; });
addEventListener('wheel', e => { if (mode === 'mouse') field.setScale(field.scaleTarget * (e.deltaY < 0 ? 1.08 : 0.93)); }, { passive: true });
$('#legend').addEventListener('click', e => { const b = e.target.closest('button[data-f]'); if (b) mouseFingers = +b.dataset.f; });
const fb = $('#legend button[data-fist]');
fb.addEventListener('pointerdown', e => { fistDown = true; e.stopPropagation(); });
addEventListener('pointerup', () => { fistDown = false; });
// 任何點擊都順便喚醒聲音（瀏覽器規定）
addEventListener('pointerdown', () => { if (started) { music.unlock(); render(); } });

/* ---------- 鏡頭模式 ---------- */
async function useCamera() {
  mode = 'mouse'; render();
  try {
    cam = await startCamera($('#video'), msg => setStatus(msg + ' 這段時間滑鼠照樣能玩。', 'info'));
    mode = 'camera'; $('#preview').hidden = false;
    setStatus('鏡頭已開啟：伸出食指移動看看，比 1～5 換形狀。', 'ok');
    setTimeout(() => { if (mode === 'camera') setStatus(''); }, 5000);
  } catch (e) {
    cam = null; mode = 'mouse'; $('#preview').hidden = true;
    setStatus(explainCameraError(e) + '。已自動改成滑鼠模式：移動滑鼠＝食指，按 1～5 換形狀，按住空白鍵＝握拳。', 'warn');
  }
  render();
}
function useMouse() {
  if (cam) { cam.stop(); cam = null; }
  mode = 'mouse'; $('#preview').hidden = true; setStatus('現在是滑鼠模式：移動滑鼠＝食指，按 1～5 換形狀，按住空白鍵＝握拳。', 'info'); render();
}
$('#toCamera').addEventListener('click', () => useCamera());
$('#toMouse').addEventListener('click', () => useMouse());

/* ---------- 開始畫面 ---------- */
function begin(withCamera) {
  started = true; $('#start').hidden = true;
  music.unlock(); music.play();
  if (withCamera) useCamera(); else useMouse();
}
$('#btnCamera').addEventListener('click', () => begin(true));
$('#btnMouse').addEventListener('click', () => begin(false));
if (TEST) $('#start').hidden = true;

/* ---------- 主迴圈 ---------- */
function loop(ms) {
  const t = ms / 1000;
  if (!TEST && started) {
    if (mode === 'camera' && cam) {
      const hands = cam.detect();
      if (hands.length) {
        const h = hands[0], tip = h[8];
        feed(t, countFingers(h), 1 - tip.x, tip.y);          // 鏡像：手往右，粒子也往右
        if (hands.length >= 2) {
          const a = hands[0][8], b = hands[1][8];
          field.setScale(0.7 + Math.hypot(a.x - b.x, a.y - b.y) * 2.4);
        } else field.setScale(1);
      } else feed(t, null);
    } else if (mode === 'mouse') {
      feed(t, fistDown ? 0 : mouseFingers, mx, my);
    }
  }
  field.frame(t);
  render();
  requestAnimationFrame(loop);
}
render();
requestAnimationFrame(loop);
