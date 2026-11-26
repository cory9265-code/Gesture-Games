/* 音樂：用 Web Audio 直接合成，不用任何外部音檔。
   瀏覽器規定要使用者點過才能出聲，所以 unlock() 一定要在按鈕／點擊事件裡呼叫。 */

const hz = m => 440 * Math.pow(2, (m - 69) / 12);

const STYLES = {
  dream: { bpm: 72, pad: 0.11, bell: 0.16, drums: false, bass: false, delay: 0.38, every: 1 },
  pulse: { bpm: 112, pad: 0.06, bell: 0.12, drums: true, bass: true, delay: 0.22, every: 1 },
  calm:  { bpm: 58, pad: 0.12, bell: 0.13, drums: false, bass: false, delay: 0.3, every: 2 }
};

const TRACKS = [
  { name: '星塵', chords: [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 55, 59]], arp: [0, 1, 2, 3, 2, 1, 3, 2] },
  { name: '月光', chords: [[50, 57, 60, 65], [46, 53, 57, 62], [41, 48, 53, 57], [48, 55, 60, 64]], arp: [0, 2, 1, 3, 0, 3, 2, 1] },
  { name: '極光', chords: [[51, 58, 62, 67], [48, 55, 58, 63], [44, 51, 55, 60], [46, 53, 58, 62]], arp: [3, 2, 1, 0, 1, 2, 3, 2] }
];

export class Music {
  constructor(style = 'dream') {
    this.style = STYLES[style] || STYLES.dream;
    this.ctx = null; this.playing = false; this.index = 0; this.track = null; this.timer = null;
  }
  get trackName() { return TRACKS[this.index].name; }
  get audible() { return !!this.ctx && this.ctx.state === 'running'; }

  /** 必須在使用者點擊時呼叫：建立／喚醒 AudioContext。 */
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain(); this.master.gain.value = 0.8;
        const comp = this.ctx.createDynamicsCompressor();
        this.master.connect(comp); comp.connect(this.ctx.destination);
        this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state !== 'running') this.ctx.resume();
      if (this.playing && !this.track) this.startTrack();
    } catch (e) { /* 沒有聲音也不影響粒子 */ }
  }

  play() { this.playing = true; if (this.ctx) this.startTrack(); }
  pause() { this.playing = false; this.stopTrack(); }
  next() { this.index = (this.index + 1) % TRACKS.length; if (this.playing && this.ctx) this.startTrack(); }
  /** 握拳：播放中→暫停；暫停中→換下一首並播放。 */
  toggle() { if (this.playing) this.pause(); else { this.next(); this.play(); } }

  stopTrack() {
    clearInterval(this.timer); this.timer = null;
    const tr = this.track; this.track = null;
    if (tr && this.ctx) {
      const now = this.ctx.currentTime;
      tr.out.gain.cancelScheduledValues(now); tr.out.gain.setValueAtTime(tr.out.gain.value, now);
      tr.out.gain.linearRampToValueAtTime(0, now + 0.2);
      setTimeout(() => { try { tr.out.disconnect(); } catch (e) {} }, 400);
    }
  }

  startTrack() {
    this.stopTrack();                         // 先把上一首收掉，兩首不會疊在一起
    const ctx = this.ctx, S = this.style;
    const input = ctx.createGain(), out = ctx.createGain(), delay = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2600;
    delay.delayTime.value = 60 / S.bpm * 0.75; fb.gain.value = S.delay;
    input.connect(lp); lp.connect(out); lp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(out);
    out.gain.value = 0; out.connect(this.master);
    const start = ctx.currentTime + 0.25;      // 等上一首淡出完再開始
    out.gain.setValueAtTime(0, start); out.gain.linearRampToValueAtTime(1, start + 0.6);
    this.track = { input, out, step: 0, next: start, song: TRACKS[this.index] };
    const tick = () => {
      const tr = this.track; if (!tr) return;
      const stepDur = 60 / S.bpm / 2;
      while (tr.next < ctx.currentTime + 0.3) { this.schedule(tr, tr.step, tr.next, stepDur); tr.next += stepDur; tr.step++; }
    };
    tick(); this.timer = setInterval(tick, 60);
  }

  schedule(tr, step, t, dur) {
    const S = this.style, song = tr.song, bar = Math.floor(step / 8) % song.chords.length, chord = song.chords[bar], inBar = step % 8;
    if (inBar === 0) this.pad(tr.input, t, chord, dur * 8, S.pad);
    if (step % S.every === 0) {
      const n = chord[song.arp[inBar]] + 12 + (inBar === 7 && bar % 2 ? 12 : 0);
      this.bell(tr.input, t, n, S.bell);
      if (step % 16 === 5) this.bell(tr.input, t + dur * 0.5, chord[3] + 24, S.bell * 0.5);
    }
    if (S.bass && inBar % 2 === 0) this.bassNote(tr.input, t, chord[0] - 12, dur * 1.6);
    if (S.drums) { if (inBar % 2 === 0) this.kick(tr.input, t); else this.hat(tr.input, t); }
  }

  env(dest, t, a, peak, rel) {
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + rel);
    g.connect(dest); return g;
  }
  osc(type, f, dest, t, len, detune = 0) {
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune;
    o.connect(dest); o.start(t); o.stop(t + len + 0.05); return o;
  }
  pad(dest, t, chord, len, vol) {
    for (const m of chord) {
      const g = this.env(dest, t, len * 0.35, vol / chord.length, len * 0.75);
      this.osc('triangle', hz(m), g, t, len * 1.1, -6); this.osc('sine', hz(m), g, t, len * 1.1, 7);
    }
  }
  bell(dest, t, m, vol) {
    const g = this.env(dest, t, 0.01, vol, 1.6); this.osc('sine', hz(m), g, t, 1.7);
    const g2 = this.env(dest, t, 0.005, vol * 0.25, 0.5); this.osc('sine', hz(m) * 2.01, g2, t, 0.6);
  }
  bassNote(dest, t, m, len) { const g = this.env(dest, t, 0.02, 0.18, len); this.osc('triangle', hz(m), g, t, len + 0.05); }
  kick(dest, t) {
    const g = this.env(dest, t, 0.003, 0.5, 0.3), o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.25);
    o.connect(g); o.start(t); o.stop(t + 0.35);
  }
  hat(dest, t) {
    const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.env(dest, t, 0.002, 0.06, 0.06);
    f.type = 'highpass'; f.frequency.value = 7000; s.buffer = this.noise; s.connect(f); f.connect(g); s.start(t); s.stop(t + 0.1);
  }
}
