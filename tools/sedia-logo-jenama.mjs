/* Menyediakan fail logo jenama untuk bar tajuk aplikasi.

   Imej sumber (PNG/WebP/JPEG) dinyahkod menggunakan Chromium, ruang kosong di
   tepi dipotong, dan hasilnya disimpan sebagai PNG pada ketinggian yang sesuai
   untuk paparan. Warna logo tidak diubah.

   Guna: node tools/sedia-logo-jenama.mjs <masuk> <keluar.png> [tinggiPiksel]
*/

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';

const [, , failMasuk, failKeluar, tinggiArg] = process.argv;
if (!failMasuk || !failKeluar) {
  console.error('Guna: node tools/sedia-logo-jenama.mjs <masuk> <keluar.png> [tinggiPiksel]');
  process.exit(1);
}
const TINGGI_SASAR = Number(tinggiArg || 240);

const jenis = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
const mime = jenis[extname(failMasuk).toLowerCase()] || 'image/png';
const dataUri = 'data:' + mime + ';base64,' + readFileSync(failMasuk).toString('base64');

const pelayar = await chromium.launch();
const halaman = await (await pelayar.newContext()).newPage();
await halaman.setContent('<body style="margin:0"></body>');

const hasil = await halaman.evaluate(async ({ uri, tinggiSasar }) => {
  const imej = new Image();
  imej.src = uri;
  await imej.decode();

  const kanvas = document.createElement('canvas');
  kanvas.width = imej.naturalWidth;
  kanvas.height = imej.naturalHeight;
  const ktx = kanvas.getContext('2d', { willReadFrequently: true });
  ktx.drawImage(imej, 0, 0);
  const data = ktx.getImageData(0, 0, kanvas.width, kanvas.height).data;

  // Kotak sempadan kandungan: abaikan piksel telus atau hampir putih.
  const AMBANG = 244;
  let kiri = kanvas.width, kanan = -1, atas = kanvas.height, bawah = -1;
  let adaTelus = false;
  for (let y = 0; y < kanvas.height; y++) {
    for (let x = 0; x < kanvas.width; x++) {
      const n = (y * kanvas.width + x) * 4;
      const a = data[n + 3];
      if (a < 250) { adaTelus = true; }
      const latar = a < 8 || (data[n] > AMBANG && data[n + 1] > AMBANG && data[n + 2] > AMBANG);
      if (latar) { continue; }
      if (x < kiri) { kiri = x; }
      if (x > kanan) { kanan = x; }
      if (y < atas) { atas = y; }
      if (y > bawah) { bawah = y; }
    }
  }

  const lebarPotong = kanan - kiri + 1;
  const tinggiPotong = bawah - atas + 1;
  const nisbah = lebarPotong / tinggiPotong;

  const keluarTinggi = Math.min(tinggiSasar, tinggiPotong);
  const keluarLebar = Math.round(keluarTinggi * nisbah);

  const kanvas2 = document.createElement('canvas');
  kanvas2.width = keluarLebar;
  kanvas2.height = keluarTinggi;
  const k2 = kanvas2.getContext('2d');
  k2.imageSmoothingEnabled = true;
  k2.imageSmoothingQuality = 'high';
  k2.drawImage(imej, kiri, atas, lebarPotong, tinggiPotong, 0, 0, keluarLebar, keluarTinggi);

  return {
    asal: [imej.naturalWidth, imej.naturalHeight],
    adaTelus: adaTelus,
    kotak: [kiri, atas, kanan, bawah],
    potong: [lebarPotong, tinggiPotong],
    keluar: [keluarLebar, keluarTinggi],
    nisbah: nisbah,
    png: kanvas2.toDataURL('image/png')
  };
}, { uri: dataUri, tinggiSasar: TINGGI_SASAR });

await pelayar.close();

writeFileSync(failKeluar, Buffer.from(hasil.png.split(',')[1], 'base64'));

console.log('Saiz asal      :', hasil.asal.join('x'), '| ada telus:', hasil.adaTelus);
console.log('Kotak kandungan:', hasil.kotak.join(', '), '->', hasil.potong.join('x'));
console.log('Ditulis        :', failKeluar, hasil.keluar.join('x'),
  '| nisbah lebar:tinggi =', hasil.nisbah.toFixed(3));
