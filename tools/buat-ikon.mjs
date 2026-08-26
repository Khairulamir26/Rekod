/* Menjana ikon PWA ClassTrack (PNG) tanpa pustaka luar.
   Jalankan: node tools/buat-ikon.mjs
   Ikon ini ialah ikon aplikasi ClassTrack sahaja — bukan logo rasmi UIS. */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(akar, 'assets');
mkdirSync(assets, { recursive: true });

const HIJAU = [11, 93, 42];
const HIJAU_GELAP = [8, 69, 33];
const PUTIH = [255, 255, 255];
const EMAS = [245, 179, 1];

function campur(bawah, atas, a) {
  return [
    Math.round(bawah[0] * (1 - a) + atas[0] * a),
    Math.round(bawah[1] * (1 - a) + atas[1] * a),
    Math.round(bawah[2] * (1 - a) + atas[2] * a)
  ];
}

/* Jarak bertanda: segi empat bucu bulat berpusat (0.5, 0.5). */
function sdRoundRect(x, y, separuh, r) {
  const dx = Math.abs(x - 0.5) - (separuh - r);
  const dy = Math.abs(y - 0.5) - (separuh - r);
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(ax, ay) - r;
}

/* Jarak bertanda: kapsul (garis tebal berhujung bulat). */
function sdCapsule(x, y, ax, ay, bx, by, r) {
  const pax = x - ax, pay = y - ay;
  const bax = bx - ax, bay = by - ay;
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  return Math.hypot(pax - bax * h, pay - bay * h) - r;
}

function liputan(sd, skala) {
  // Kelebaran tepi kira-kira satu piksel supaya tepi licin.
  return Math.min(1, Math.max(0, 0.5 - sd * skala));
}

function lukis(saiz, maskable) {
  const data = Buffer.alloc(saiz * saiz * 4);
  const skala = saiz;                       // 1 unit = saiz piksel
  const separuh = maskable ? 0.5 : 0.5;
  const jejari = maskable ? 0.5 : 0.22;     // maskable: bulatan penuh
  const kecil = maskable ? 0.74 : 1;        // kandungan dalam zon selamat

  function petakan(v) { return 0.5 + (v - 0.5) * kecil; }

  for (let y = 0; y < saiz; y++) {
    for (let x = 0; x < saiz; x++) {
      const px = (x + 0.5) / saiz;
      const py = (y + 0.5) / saiz;

      // Latar belakang dengan kecerunan lembut.
      const campuranLatar = Math.min(1, Math.max(0, (px + py) / 2));
      let warna = campur(HIJAU, HIJAU_GELAP, campuranLatar);
      let alfa = liputan(sdRoundRect(px, py, separuh, jejari), skala);

      // Tanda semak putih.
      const semak = Math.min(
        sdCapsule(px, py, petakan(0.30), petakan(0.52), petakan(0.44), petakan(0.66), 0.052 * kecil),
        sdCapsule(px, py, petakan(0.44), petakan(0.66), petakan(0.72), petakan(0.34), 0.052 * kecil)
      );
      const aSemak = liputan(semak, skala);
      if (aSemak > 0) { warna = campur(warna, PUTIH, aSemak); }

      // Bar emas di bawah tanda semak.
      const bar = sdCapsule(px, py, petakan(0.33), petakan(0.78), petakan(0.67), petakan(0.78), 0.030 * kecil);
      const aBar = liputan(bar, skala);
      if (aBar > 0) { warna = campur(warna, EMAS, aBar); }

      const i = (y * saiz + x) * 4;
      data[i] = warna[0];
      data[i + 1] = warna[1];
      data[i + 2] = warna[2];
      data[i + 3] = Math.round(alfa * 255);
    }
  }
  return data;
}

function png(saiz, rgba) {
  const baris = Buffer.alloc((saiz * 4 + 1) * saiz);
  for (let y = 0; y < saiz; y++) {
    baris[y * (saiz * 4 + 1)] = 0;                       // penapis "None"
    rgba.copy(baris, y * (saiz * 4 + 1) + 1, y * saiz * 4, (y + 1) * saiz * 4);
  }

  function ketulan(jenis, kandungan) {
    const panjang = Buffer.alloc(4);
    panjang.writeUInt32BE(kandungan.length);
    const badan = Buffer.concat([Buffer.from(jenis, 'ascii'), kandungan]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(badan) >>> 0);
    return Buffer.concat([panjang, badan, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(saiz, 0);
  ihdr.writeUInt32BE(saiz, 4);
  ihdr[8] = 8;    // kedalaman bit
  ihdr[9] = 6;    // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ketulan('IHDR', ihdr),
    ketulan('IDAT', deflateSync(baris, { level: 9 })),
    ketulan('IEND', Buffer.alloc(0))
  ]);
}

const jadualCrc = (() => {
  const jadual = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) { c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; }
    jadual[n] = c;
  }
  return jadual;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) { c = jadualCrc[(c ^ buf[i]) & 0xff] ^ (c >>> 8); }
  return c ^ -1;
}

const keluaran = [
  ['ikon-192.png', 192, false],
  ['ikon-512.png', 512, false],
  ['ikon-maskable.png', 512, true]
];

for (const [nama, saiz, maskable] of keluaran) {
  writeFileSync(join(assets, nama), png(saiz, lukis(saiz, maskable)));
  console.log('Ditulis:', nama, saiz + 'x' + saiz);
}
