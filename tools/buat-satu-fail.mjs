/* Membina versi SATU FAIL ClassTrack untuk pratonton dan perkongsian pantas.
   Jalankan: node tools/buat-satu-fail.mjs
   Keluaran : classtrack-satu-fail.html (CSS + JS diselitkan ke dalam HTML)

   Versi satu fail ini untuk semakan sahaja. Versi penuh (index.html + sw.js +
   manifest) tetap yang perlu dihoskan untuk pemasangan PWA pada telefon. */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const baca = (p) => readFileSync(join(akar, p), 'utf8');

const html = baca('index.html');
const css = baca('css/styles.css');

// Ambil senarai skrip mengikut susunan dalam index.html.
const skrip = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
if (!skrip.length) { throw new Error('Tiada <script src> dijumpai dalam index.html'); }

// Ambil kandungan <body> tanpa tag skrip.
const badan = html
  .slice(html.indexOf('<body>') + '<body>'.length, html.lastIndexOf('</body>'))
  .replace(/<script src="[^"]+"><\/script>\s*/g, '')
  .trim();

const bahagian = [
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
  '<title>ClassTrack UIS</title>',
  '<style>\n' + css + '\n</style>',
  badan,
  '<script>\n' +
  '// Penanda binaan satu fail: langkau service worker dan fail logo luaran.\n' +
  'window.CT_SATU_FAIL = true;\n' +
  'window.CT_TIADA_FAIL_LOGO = true;\n' +
  '</script>'
];

for (const fail of skrip) {
  bahagian.push('<script>\n/* ' + fail + ' */\n' + baca(fail) + '\n</script>');
}

const keluaran = bahagian.join('\n\n') + '\n';
writeFileSync(join(akar, 'classtrack-satu-fail.html'), keluaran);

console.log('Ditulis: classtrack-satu-fail.html');
console.log('Skrip diselitkan:', skrip.length);
console.log('Saiz:', Math.round(keluaran.length / 1024) + ' KB');
