/* 驗收測試（AI 不可以修改「驗收」資料夾）。
   前 13 項只測手勢邏輯（終端機也能跑）；後 6 項要在瀏覽器裡對真的網頁測。 */
import SAMPLES from './samples.js';

const SHAPE_NAMES = ['sphere', 'heart', 'star', 'galaxy', 'firework', 'spiral', 'snow', 'dna', 'butterfly', 'infinity', 'note'];
const hand = s => s.pts.map(([x, y]) => ({ x, y, z: 0 }));
const eq = (a, b, msg) => { if (a !== b) throw Error(`${msg}：應該是 ${JSON.stringify(b)}，實際是 ${JSON.stringify(a)}`); };
const yes = (c, msg) => { if (!c) throw Error(msg); };
const pick = n => SAMPLES.filter(s => s.answer === n);

export function logicTests(G, CONFIG) {
  const each = (n, label) => () => { yes(pick(n).length, '沒有樣本'); for (const s of pick(n)) eq(G.countFingers(hand(s)), n, `${label}（樣本 ${s.name}）`); };
  return [
    ['張開手掌要數到 5', each(5, '張開手掌')],
    ['握拳要數到 0', each(0, '握拳')],
    ['比 1 要數到 1', each(1, '比 1')],
    ['比 2、比 3、比 4 都要數對', () => { each(2, '比 2')(); each(3, '比 3')(); each(4, '比 4')(); }],
    ['手轉任何方向都要數對（倒過來、橫著）', () => {
      for (const s of SAMPLES) {
        const down = s.pts.map(([x, y]) => ({ x: 1 - x, y: 1 - y, z: 0 })), side = s.pts.map(([x, y]) => ({ x: y, y: 1 - x, z: 0 }));
        eq(G.countFingers(down), s.answer, `倒過來（樣本 ${s.name}）`); eq(G.countFingers(side), s.answer, `橫著（樣本 ${s.name}）`);
      }
    }],
    ['看不清楚的手回傳 null，不可以當機', () => {
      eq(G.countFingers(null), null, '沒有手'); eq(G.countFingers([]), null, '空的'); eq(G.countFingers(hand(SAMPLES[0]).slice(0, 10)), null, '只有 10 個點');
      eq(G.countFingers(Array.from({ length: 21 }, () => ({ x: NaN, y: NaN }))), null, '座標不是數字');
    }],
    ['只閃一格的手勢不算數（形狀才不會一直閃）', () => {
      const s = new G.GestureSmoother(5); [3, 3, 3, 3, 3].forEach(n => s.add(n)); s.add(5); eq(s.value, 3, '5 只出現一格');
      s.add(null); eq(s.value, 3, '看不清楚的那一格要略過');
    }],
    ['連續比同一個手勢就要換過去', () => { const s = new G.GestureSmoother(5); [3, 3, 3, 3, 3, 5, 5, 5, 5].forEach(n => s.add(n)); eq(s.value, 5, '連續 4 格的 5'); eq(new G.GestureSmoother(5).value, null, '還沒有資料'); }],
    ['握拳沒握夠久，不可以切換音樂', () => { const f = new G.FistHold(0.5); let hit = 0; for (let t = 0; t < 0.4; t += 0.05) hit += f.update(t, true) ? 1 : 0; hit += f.update(0.45, false) ? 1 : 0; eq(hit, 0, '握 0.4 秒就放開'); }],
    ['握拳握著不放，只切換一次', () => { const f = new G.FistHold(0.5); let hit = 0; for (let t = 0; t < 5; t += 0.05) hit += f.update(t, true) ? 1 : 0; eq(hit, 1, '握 5 秒'); }],
    ['放開再握，才可以切換第二次', () => {
      const f = new G.FistHold(0.5); let hit = 0;
      for (let t = 0; t < 1; t += 0.05) hit += f.update(t, true) ? 1 : 0; hit += f.update(1.05, false) ? 1 : 0; for (let t = 1.1; t < 2.1; t += 0.05) hit += f.update(t, true) ? 1 : 0;
      eq(hit, 2, '握、放、握');
    }],
    ['手指數要對應到設定的形狀；握拳與看不清楚不換形狀', () => {
      const t = ['star', 'heart', 'dna']; eq(G.shapeFor(1, t), 'star', '比 1'); eq(G.shapeFor(3, t), 'dna', '比 3');
      eq(G.shapeFor(0, t), null, '握拳'); eq(G.shapeFor(null, t), null, '看不清楚'); eq(G.shapeFor(4, t), null, '超出設定的數量'); eq(G.shapeFor(2.5, t), null, '不是整數');
    }],
    ['設定檔內容合理（標題、形狀、秒數）', () => {
      yes(typeof CONFIG.title === 'string' && CONFIG.title.trim().length > 0 && CONFIG.title.length <= 40, 'title 要有字，而且 40 字以內');
      yes(Array.isArray(CONFIG.shapes) && CONFIG.shapes.length >= 1 && CONFIG.shapes.length <= 5, 'shapes 要有 1～5 個');
      for (const s of CONFIG.shapes) yes(SHAPE_NAMES.includes(s), `shapes 裡的「${s}」不是可以用的形狀`);
      yes(CONFIG.fistSeconds >= 0.2 && CONFIG.fistSeconds <= 3, 'fistSeconds 要在 0.2～3 秒');
    }]
  ];
}

/* 以下只有瀏覽器能跑：把真的網頁用測試模式（?test=1）開在隱藏框裡，照使用者的操作送手勢進去。 */
export function pageTests(frame, CONFIG) {
  const win = () => frame.contentWindow, show = () => win().__show, st = () => show().state();
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const feed = (t0, n, fingers) => { for (let i = 0; i < n; i++) show().feed(t0 + i * 0.05, fingers, 0.5, 0.5); };
  return [
    ['網頁打得開，沒有錯誤訊息，畫面上有粒子', async () => {
      yes(show() && typeof show().state === 'function' && typeof show().feed === 'function', '找不到 window.__show（state、feed）');
      yes(!win().__errors.length, '網頁有錯誤：' + win().__errors.join('｜')); yes(st().particles >= 100, '粒子少於 100 顆');
    }],
    ['標題是設定檔寫的標題', () => { eq(st().title, CONFIG.title, 'state().title'); yes(win().document.body.innerText.includes(CONFIG.title), '畫面上看不到標題文字'); }],
    ['比出手勢，形狀照設定檔變', () => {
      const n = CONFIG.shapes.length; feed(10, 8, n); eq(st().shape, CONFIG.shapes[n - 1], `比 ${n}`);
      feed(11, 8, 1); eq(st().shape, CONFIG.shapes[0], '比 1'); feed(12, 1, n); eq(st().shape, CONFIG.shapes[0], '只閃一格');
    }],
    ['握拳夠久切換音樂一次，握著不放不會連續切', () => {
      feed(20, 4, 1); const was = st().playing; feed(21, 4, 0); eq(st().playing, was, '握得不夠久');
      feed(22, 4, 1); feed(23, Math.ceil(CONFIG.fistSeconds / 0.05) + 40, 0); eq(st().playing, !was, '握夠久之後'); eq(st().shape, CONFIG.shapes[0], '握拳時形狀不可以變');
    }],
    ['沒有鏡頭也能玩，不是黑畫面', async () => {
      yes(['mouse', 'camera'].includes(st().mode), `state().mode 是「${st().mode}」`); await wait(700);
      const cv = [...win().document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0]; yes(cv, '找不到畫布');
      const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let lit = 0;
      for (let i = 0; i < d.length; i += 4 * 97) if (d[i] + d[i + 1] + d[i + 2] > 240) lit++;
      yes(lit >= 20, '畫布上幾乎沒有亮點，粒子沒有畫出來');
    }],
    ['不連到外面的網站（離線可用，影像不外傳）', () => {
      const out = win().performance.getEntriesByType('resource').map(e => e.name).filter(u => /^https?:/.test(u) && new URL(u).origin !== win().location.origin);
      yes(!out.length, '網頁連到外部：' + out.slice(0, 3).join('、'));
    }]
  ];
}
