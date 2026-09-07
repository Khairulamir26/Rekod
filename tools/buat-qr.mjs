/* Menjana kod QR dan poster edaran untuk e-Dawam.

   Dua fail dihasilkan dalam assets/:
     qr-edawam.png      kod QR sahaja, 1024x1024, latar putih
     poster-edawam.png  poster A4 (1240x1754 pada 150dpi) siap untuk dicetak

   Aras pembetulan ralat "H" (pulih 30%) dipilih kerana poster yang dicetak
   akan calar, terlipat dan dilekat pada dinding. Zon senyap 4 modul
   dikekalkan mengikut spesifikasi QR — memotongnya menyebabkan sebahagian
   pengimbas gagal membacanya.

   Guna:  npm install qrcode      (sekali sahaja; node_modules diabaikan git)
          node tools/buat-qr.mjs
*/

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Satu-satunya kebergantungan luar dalam repositori ini. Ia sengaja tidak
   dibenamkan: penjanaan QR hanya dijalankan oleh penyelenggara, bukan oleh
   aplikasi, jadi guru tidak pernah memerlukannya. */
let QRCode;
try {
  QRCode = (await import('qrcode')).default;
} catch (e) {
  console.error('Pakej "qrcode" tidak dijumpai. Jalankan dahulu:\n\n' +
    '    npm install qrcode\n');
  process.exit(1);
}

const ALAMAT = 'https://khairulamir26.github.io/Rekod/';

/* Hitam kehijauan gelap: sewarna dengan teks aplikasi, dan nisbah kontras
   terhadap putih masih jauh melebihi keperluan pengimbas. */
const GELAP = '#13241f';

const qrDataUrl = await QRCode.toDataURL(ALAMAT, {
  errorCorrectionLevel: 'H',
  margin: 4,
  width: 1024,
  color: { dark: GELAP, light: '#ffffff' }
});
writeFileSync(join(akar, 'assets', 'qr-edawam.png'),
  Buffer.from(qrDataUrl.split(',')[1], 'base64'));
console.log('Ditulis: qr-edawam.png');

const logo = 'data:image/png;base64,' +
  readFileSync(join(akar, 'assets', 'logo-dawam.png')).toString('base64');

const poster = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1240px; height: 1754px;
    font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
    color: #13241f; background: #f2f7f6;
    display: flex; flex-direction: column; align-items: center;
    padding: 64px 80px;
  }
  /* Fail logo membawa latar putihnya sendiri, jadi ia diletakkan di atas pil
     putih seperti dalam bar tajuk aplikasi. Tanpa pil itu, petak putih logo
     kelihatan sebagai kotak tergantung di atas latar off-white poster. */
  .pil {
    background: #fff; border-radius: 999px; padding: 16px 40px;
    box-shadow: 0 4px 18px rgba(14,44,38,.10);
  }
  .logo { display: block; height: 104px; width: auto; }
  h1 { font-size: 66px; letter-spacing: -.02em; margin-top: 38px; }
  .sub { font-size: 31px; color: #5a6b66; margin-top: 12px; text-align: center; line-height: 1.35; }
  .kad {
    background: #fff; border-radius: 40px; padding: 34px;
    margin-top: 38px; box-shadow: 0 10px 40px rgba(14,44,38,.10);
  }
  .kad img { display: block; width: 520px; height: 520px; }
  .alamat {
    margin-top: 28px; font-size: 30px; font-weight: 700;
    color: #14614f; word-break: break-all; text-align: center;
  }
  ol { margin-top: 42px; width: 100%; list-style: none; counter-reset: n; }
  li {
    counter-increment: n; position: relative;
    padding: 0 0 0 84px; min-height: 60px;
    font-size: 32px; line-height: 1.35;
  }
  li + li { margin-top: 26px; }
  li::before {
    content: counter(n);
    position: absolute; left: 0; top: -4px;
    width: 60px; height: 60px; border-radius: 50%;
    background: #1c7f6b; color: #fff;
    font-size: 32px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }
  li b { color: #14614f; }
  .amaran {
    margin-top: 38px; width: 100%;
    background: #fdf3d8; border: 3px solid #f0d99a; color: #6d4e00;
    border-radius: 24px; padding: 26px 30px; font-size: 28px; line-height: 1.4;
  }
  footer {
    margin-top: auto; padding-top: 32px;
    font-size: 24px; color: #5a6b66; text-align: center;
  }
</style></head><body>
  <div class="pil"><img class="logo" src="${logo}" alt="e-Dawam"></div>
  <h1>Imbas untuk mula</h1>
  <p class="sub">Aplikasi guru tahfiz &mdash; kehadiran, hafazan dan rekod murid<br>
     Universiti Islam Selangor</p>

  <div class="kad"><img src="${qrDataUrl}" alt="Kod QR e-Dawam"></div>
  <p class="alamat">${ALAMAT}</p>

  <ol>
    <li>Imbas kod QR ini dengan kamera telefon.</li>
    <li>Tekan <b>Share</b> (iPhone) atau menu <b>&#8942;</b> (Android),
        kemudian <b>Add to Home Screen</b>.</li>
    <li>Buka aplikasi daripada ikon di Home Screen selepas ini,
        bukan melalui pelayar.</li>
  </ol>

  <p class="amaran"><b>Langkah 2 wajib.</b> Rekod disimpan pada telefon anda
     sendiri. Jika aplikasi dibuka melalui pelayar sahaja, iPhone boleh
     memadam rekod itu selepas 7 hari tidak digunakan. Ikon di Home Screen
     melindunginya.</p>

  <footer>e-Dawam &middot; Hakcipta &copy; Abu Dawud 2026</footer>
</body></html>`;

const pelayar = await chromium.launch();
const halaman = await (await pelayar.newContext({
  viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1
})).newPage();
await halaman.setContent(poster, { waitUntil: 'load' });
await halaman.screenshot({ path: join(akar, 'assets', 'poster-edawam.png') });
await pelayar.close();
console.log('Ditulis: poster-edawam.png');
