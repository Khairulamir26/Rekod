/* Menjana ikon aplikasi e-Dawam daripada fail ikon rasmi yang dibekalkan.

   Sumber: assets/ikon-dawam-asal.webp — ikon segi empat bucu bulat yang
   diberikan oleh pemilik jenama, disimpan seadanya. Tiada bahagian ikon
   dilukis semula di sini; skrip ini hanya memangkas, menjadikan kawasan di
   luar bentuk lut sinar, dan mengecilkannya kepada saiz yang diperlukan PWA.

   Tiga fail dihasilkan:
     ikon-192.png       ikon biasa 192x192, bucu lut sinar
     ikon-512.png       ikon biasa 512x512, bucu lut sinar
     ikon-maskable.png  512x512 penuh tanpa lut sinar. Ikon dikecilkan kepada
                        ZON_SELAMAT supaya pil "e-Dawam" kekal di dalam
                        bulatan selamat apabila Android memangkas ikon, dan
                        ruang tepi diisi dengan warna latar ikon itu sendiri.

   Guna: node tools/buat-ikon.mjs
*/

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const SUMBER = join(akar, 'assets', 'ikon-dawam-asal.webp');
const uri = 'data:image/webp;base64,' + readFileSync(SUMBER).toString('base64');

/* Pecahan lebar kanvas yang diisi oleh ikon dalam versi maskable. Pada 0.81
   penjuru terjauh pil putih masih berada di dalam bulatan selamat 80%. */
const ZON_SELAMAT = 0.81;

const pelayar = await chromium.launch();
const halaman = await (await pelayar.newContext()).newPage();
await halaman.setContent('<body style="margin:0"></body>');

const hasil = await halaman.evaluate(async ({ uri, ZON_SELAMAT }) => {
  const imej = new Image();
  imej.src = uri;
  await imej.decode();

  const L = imej.naturalWidth, T = imej.naturalHeight;
  const k = document.createElement('canvas');
  k.width = L; k.height = T;
  const ktx = k.getContext('2d', { willReadFrequently: true });
  ktx.drawImage(imej, 0, 0);
  const gambar = ktx.getImageData(0, 0, L, T);
  const d = gambar.data;

  /* ---------- 1. Buang latar putih dan bayang di luar bentuk ikon ----------
     Isian banjir (flood fill) bermula dari tepi kanvas supaya hanya kawasan
     cerah yang bersambung ke luar dibuang. Pil putih di dalam ikon terkurung
     oleh bingkai biru, jadi ia tidak pernah tersentuh. */
  const cerah = (n) => {
    const r = d[n], g = d[n + 1], b = d[n + 2];
    const maks = Math.max(r, g, b), min = Math.min(r, g, b);
    return { terang: (r + g + b) / 3, tepu: maks - min };
  };
  const luar = new Uint8Array(L * T);
  const timbunan = [];
  for (let x = 0; x < L; x++) { timbunan.push(x, (T - 1) * L + x); }
  for (let y = 0; y < T; y++) { timbunan.push(y * L, y * L + L - 1); }

  while (timbunan.length) {
    const p = timbunan.pop();
    if (luar[p]) { continue; }
    const c = cerah(p * 4);
    if (c.terang < 200 || c.tepu > 30) { continue; }   // sudah masuk grafik
    luar[p] = 1;
    const x = p % L, y = (p - x) / L;
    if (x > 0) { timbunan.push(p - 1); }
    if (x < L - 1) { timbunan.push(p + 1); }
    if (y > 0) { timbunan.push(p - L); }
    if (y < T - 1) { timbunan.push(p + L); }
  }

  /* Alfa beransur pada jalur 200..240 supaya tepi bucu bulat kekal licin
     dan bukan bergerigi selepas dikecilkan. */
  for (let p = 0; p < L * T; p++) {
    if (!luar[p]) { continue; }
    const c = cerah(p * 4);
    const a = c.terang >= 240 ? 0 : Math.round(255 * (240 - c.terang) / 40);
    d[p * 4 + 3] = Math.min(d[p * 4 + 3], a);
  }
  ktx.putImageData(gambar, 0, 0);

  /* ---------- 2. Kotak sempadan ikon, dijadikan segi empat sama ---------- */
  let x0 = L, y0 = T, x1 = -1, y1 = -1;
  for (let y = 0; y < T; y++) {
    for (let x = 0; x < L; x++) {
      if (d[(y * L + x) * 4 + 3] > 24) {
        if (x < x0) { x0 = x; } if (x > x1) { x1 = x; }
        if (y < y0) { y0 = y; } if (y > y1) { y1 = y; }
      }
    }
  }
  const sisi = Math.max(x1 - x0 + 1, y1 - y0 + 1);
  const sx = Math.round((x0 + x1 + 1) / 2 - sisi / 2);
  const sy = Math.round((y0 + y1 + 1) / 2 - sisi / 2);

  const potong = document.createElement('canvas');
  potong.width = sisi; potong.height = sisi;
  potong.getContext('2d').drawImage(k, sx, sy, sisi, sisi, 0, 0, sisi, sisi);

  const lukis = (saiz) => {
    const c = document.createElement('canvas');
    c.width = saiz; c.height = saiz;
    const cx = c.getContext('2d');
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(potong, 0, 0, saiz, saiz);
    return c.toDataURL('image/png');
  };

  /* ---------- 3. Versi maskable ----------
     Latar penuh dibina daripada dua warna yang diambil terus dari ikon: satu
     dari kawasan biru di penjuru atas-kiri, satu dari kawasan hijau di
     penjuru bawah-kanan. Kecerunan pepenjuru antara kedua-duanya menyambung
     warna ikon hingga ke tepi kanvas, jadi ruang tepi tidak kelihatan sebagai
     bingkai yang berasingan. */
  const ptx = potong.getContext('2d', { willReadFrequently: true });
  const ambilWarna = (fx, fy) => {
    const q = ptx.getImageData(Math.round(sisi * fx), Math.round(sisi * fy), 1, 1).data;
    return 'rgb(' + q[0] + ',' + q[1] + ',' + q[2] + ')';
  };
  const warnaAtas = ambilWarna(0.50, 0.06);    // biru gelap di tepi atas
  const warnaBawah = ambilWarna(0.84, 0.90);   // hijau di penjuru bawah-kanan

  const lukisMaskable = (saiz) => {
    const c = document.createElement('canvas');
    c.width = saiz; c.height = saiz;
    const cx = c.getContext('2d');
    cx.imageSmoothingQuality = 'high';

    const ker = cx.createLinearGradient(0, 0, saiz, saiz);
    ker.addColorStop(0, warnaAtas);
    ker.addColorStop(0.62, warnaAtas);
    ker.addColorStop(1, warnaBawah);
    cx.fillStyle = ker;
    cx.fillRect(0, 0, saiz, saiz);

    const dalam = Math.round(saiz * ZON_SELAMAT);
    const jidar = Math.round((saiz - dalam) / 2);
    cx.drawImage(potong, jidar, jidar, dalam, dalam);
    return c.toDataURL('image/png');
  };

  return {
    sumber: L + 'x' + T,
    kotak: { x0, y0, x1, y1, sisi },
    ikon192: lukis(192),
    ikon512: lukis(512),
    maskable: lukisMaskable(512)
  };
}, { uri, ZON_SELAMAT });

const simpan = (nama, dataUrl) => {
  const bait = Buffer.from(dataUrl.split(',')[1], 'base64');
  writeFileSync(join(akar, 'assets', nama), bait);
  console.log('Ditulis:', nama, Math.round(bait.length / 1024) + ' KB');
};

console.log('Sumber :', hasil.sumber);
console.log('Kotak  :', JSON.stringify(hasil.kotak));
simpan('ikon-192.png', hasil.ikon192);
simpan('ikon-512.png', hasil.ikon512);
simpan('ikon-maskable.png', hasil.maskable);

await pelayar.close();
