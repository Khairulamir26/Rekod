/* Menjana ikon aplikasi e-Dawam daripada logo jenama.

   Simbol "e" hijau dikeluarkan terus daripada fail logo yang dibekalkan
   (tiada lukisan semula), kemudian diletakkan di tengah kanvas segi empat
   berlatar putih. Ikon "maskable" menggunakan zon selamat yang lebih kecil
   supaya simbol tidak terpotong apabila Android memangkasnya menjadi bulatan.

   Guna: node tools/buat-ikon.mjs
*/

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const SUMBER = join(akar, 'assets', 'logo-dawam.png');
const uri = 'data:image/png;base64,' + readFileSync(SUMBER).toString('base64');

const pelayar = await chromium.launch();
const halaman = await (await pelayar.newContext()).newPage();
await halaman.setContent('<body style="margin:0"></body>');

const hasil = await halaman.evaluate(async ({ uri }) => {
  const imej = new Image();
  imej.src = uri;
  await imej.decode();

  const k = document.createElement('canvas');
  k.width = imej.naturalWidth;
  k.height = imej.naturalHeight;
  const ktx = k.getContext('2d', { willReadFrequently: true });
  ktx.drawImage(imej, 0, 0);
  const d = ktx.getImageData(0, 0, k.width, k.height).data;

  /* Tandakan piksel hijau, kemudian kumpulkan yang bersambung. Simbol "e"
     ialah kelompok hijau yang paling besar; titik hijau kecil di bawah huruf
     dan palang hijau pada bingkai pil menjadi kelompok berasingan. */
  const adalahHijau = (n) => {
    const r = d[n], g = d[n + 1], b = d[n + 2], a = d[n + 3];
    return a > 200 && g > 90 && g - r > 40 && g - b > 40;
  };

  const label = new Int32Array(k.width * k.height).fill(-1);
  const kelompok = [];

  for (let mula = 0; mula < k.width * k.height; mula++) {
    if (label[mula] !== -1 || !adalahHijau(mula * 4)) { continue; }
    const id = kelompok.length;
    const kotak = { kiri: k.width, atas: k.height, kanan: -1, bawah: -1, luas: 0 };
    const barisan = [mula];
    label[mula] = id;

    while (barisan.length) {
      const p = barisan.pop();
      const x = p % k.width;
      const y = (p - x) / k.width;
      kotak.luas++;
      if (x < kotak.kiri) { kotak.kiri = x; }
      if (x > kotak.kanan) { kotak.kanan = x; }
      if (y < kotak.atas) { kotak.atas = y; }
      if (y > kotak.bawah) { kotak.bawah = y; }

      const jiran = [];
      if (x > 0) { jiran.push(p - 1); }
      if (x < k.width - 1) { jiran.push(p + 1); }
      if (y > 0) { jiran.push(p - k.width); }
      if (y < k.height - 1) { jiran.push(p + k.width); }
      for (const j of jiran) {
        if (label[j] === -1 && adalahHijau(j * 4)) { label[j] = id; barisan.push(j); }
      }
    }
    kelompok.push(kotak);
  }

  kelompok.sort((a, b) => b.luas - a.luas);
  const terbesar = kelompok[0];

  return {
    lebar: k.width,
    tinggi: k.height,
    bilanganKelompok: kelompok.length,
    tigaTerbesar: kelompok.slice(0, 3).map((c) =>
      c.luas + 'px @ ' + (c.kanan - c.kiri + 1) + 'x' + (c.bawah - c.atas + 1)),
    kotak: { kiri: terbesar.kiri, atas: terbesar.atas, kanan: terbesar.kanan, bawah: terbesar.bawah }
  };
}, { uri });

console.log('Logo sumber :', hasil.lebar + 'x' + hasil.tinggi);
console.log('Kelompok    :', hasil.bilanganKelompok, '| tiga terbesar:', hasil.tigaTerbesar.join(' | '));
console.log('Kotak "e"   :', hasil.kotak,
  '->', (hasil.kotak.kanan - hasil.kotak.kiri + 1) + 'x' + (hasil.kotak.bawah - hasil.kotak.atas + 1));

/* Lukis ikon: simbol di tengah, latar putih. */
async function jana(saiz, bahagianSimbol, nama) {
  const png = await halaman.evaluate(async ({ uri, kotak, saiz, bahagian }) => {
    const imej = new Image();
    imej.src = uri;
    await imej.decode();

    const k = document.createElement('canvas');
    k.width = saiz;
    k.height = saiz;
    const c = k.getContext('2d');
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';

    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, saiz, saiz);

    const lebarSumber = kotak.kanan - kotak.kiri + 1;
    const tinggiSumber = kotak.bawah - kotak.atas + 1;
    const muat = saiz * bahagian;
    const skala = Math.min(muat / lebarSumber, muat / tinggiSumber);
    const lebarLukis = lebarSumber * skala;
    const tinggiLukis = tinggiSumber * skala;

    c.drawImage(imej, kotak.kiri, kotak.atas, lebarSumber, tinggiSumber,
      (saiz - lebarLukis) / 2, (saiz - tinggiLukis) / 2, lebarLukis, tinggiLukis);

    return k.toDataURL('image/png');
  }, { uri, kotak: hasil.kotak, saiz, bahagian: bahagianSimbol });

  const laluan = join(akar, 'assets', nama);
  writeFileSync(laluan, Buffer.from(png.split(',')[1], 'base64'));
  console.log('Ditulis     :', nama, saiz + 'x' + saiz,
    '| simbol ' + Math.round(bahagianSimbol * 100) + '% daripada kanvas');
}

await jana(192, 0.66, 'ikon-192.png');
await jana(512, 0.66, 'ikon-512.png');
// Zon selamat maskable: simbol dikecilkan supaya kekal penuh dalam bulatan.
await jana(512, 0.50, 'ikon-maskable.png');

await pelayar.close();
