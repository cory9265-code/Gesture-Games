/* 鏡頭與手部辨識：只用本機 vendor 資料夾，不連外部網站。
   影像只在這台電腦的瀏覽器裡處理，不存檔、不上傳。 */

const here = p => new URL(p, import.meta.url).href;

/** 把鏡頭錯誤翻成白話。 */
export function explainCameraError(e) {
  const n = e && e.name;
  if (n === 'NotAllowedError' || n === 'SecurityError') return '你按了「拒絕」或瀏覽器擋住了鏡頭權限';
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return '這台電腦找不到鏡頭';
  if (n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError') return '鏡頭正被別的程式使用（例如視訊會議），請先關掉它';
  if (n === 'NoMediaDevices') return '這個瀏覽器不支援鏡頭，或網址不是 127.0.0.1／localhost';
  if (n === 'ModelError') return '手部辨識模型載入失敗';
  return '鏡頭開不起來（' + (e && (e.message || n) || '原因不明') + '）';
}

/** 開鏡頭並載入 HandLandmarker。onStatus(文字) 會回報目前進度。 */
export async function startCamera(video, onStatus) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const e = new Error('no mediaDevices'); e.name = 'NoMediaDevices'; throw e;
  }
  onStatus('鏡頭準備中…如果瀏覽器跳出詢問，請按「允許」。');
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false });
  video.srcObject = stream; video.muted = true; video.playsInline = true;
  await video.play().catch(() => {});

  onStatus('鏡頭開好了，正在載入手部辨識（第一次約需幾秒）…');
  let landmarker;
  try {
    const { FilesetResolver, HandLandmarker } = await import('../vendor/vision_bundle.mjs');
    const fileset = await FilesetResolver.forVisionTasks(here('../vendor/wasm'));
    const opts = delegate => ({ baseOptions: { modelAssetPath: here('../vendor/hand_landmarker.task'), delegate }, runningMode: 'VIDEO', numHands: 2 });
    try { landmarker = await HandLandmarker.createFromOptions(fileset, opts('GPU')); }
    catch (e) { landmarker = await HandLandmarker.createFromOptions(fileset, opts('CPU')); }
  } catch (e) {
    stream.getTracks().forEach(t => t.stop());
    const err = new Error(e && e.message || 'model'); err.name = 'ModelError'; throw err;
  }

  let lastTime = -1, last = [];
  return {
    /** 每一格呼叫一次，回傳看到的手（每隻手 21 個點的陣列）。 */
    detect() {
      if (video.readyState < 2) return last;
      if (video.currentTime === lastTime) return last;
      lastTime = video.currentTime;
      try { last = landmarker.detectForVideo(video, performance.now()).landmarks || []; } catch (e) { last = []; }
      return last;
    },
    stop() { stream.getTracks().forEach(t => t.stop()); try { landmarker.close(); } catch (e) {} video.srcObject = null; }
  };
}
