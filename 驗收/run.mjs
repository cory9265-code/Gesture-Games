/* 終端機版驗收（只測手勢邏輯 13 項）：node 驗收/run.mjs
   其餘 6 項要用瀏覽器打開「驗收」頁才看得到。AI 不可以修改這個資料夾。 */
import { logicTests } from './tests.js';

let G, CONFIG;
try { G = await import('../js/gesture.js'); CONFIG = (await import('../js/config.js')).default; }
catch (e) { console.log('❌ 讀不到 js/gesture.js 或 js/config.js：' + e.message); process.exit(1); }
let bad = 0; const tests = logicTests(G, CONFIG);
for (const [name, fn] of tests) {
  try { await fn(); console.log('✅ ' + name); }
  catch (e) { bad++; console.log('❌ ' + name + '\n     ' + e.message); }
}
console.log(`\n手勢邏輯 ${tests.length - bad}/${tests.length} 通過` + (bad ? '' : '。再請使用者打開驗收頁，確認 19 項全部綠燈。'));
process.exit(bad ? 1 : 0);
