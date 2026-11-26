/* 我的粒子秀設定：改完存檔、重新整理網頁就生效。 */
export default {
  title: "我的手勢音樂粒子秀",
  theme: 'space',          // space 星空｜ocean 海洋｜neon 霓虹｜festival 節慶
  shapes: ['sphere', 'heart', 'star', 'galaxy', 'firework'],   // 比 1、2、3、4、5 各變成什麼形狀
  fistSeconds: 0.5,                // 握拳握多久才切換音樂（秒）
  smooth: 5,                       // 最近幾格多數決
  particles: 1400,                 // 粒子數量
  music: 'dream'                   // dream 夢幻｜pulse 律動｜calm 平靜
};
