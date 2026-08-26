/* Membina versi SATU FAIL ClassTrack untuk pratonton dan perkongsian pantas.
   Jalankan: node tools/buat-satu-fail.mjs
   Keluaran : classtrack-satu-fail.html (CSS + JS diselitkan ke dalam HTML)

   Versi satu fail ini untuk semakan sahaja. Versi penuh (index.html + sw.js +
   manifest) tetap yang perlu dihoskan untuk pemasangan PWA pada telefon. */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const baca = (p) => readFileSync(join(akar, p), 'utf8');

/* Logo rasmi dibenamkan terus sebagai data URI supaya fail tunggal ini
   membawa logo bersamanya dan logo itu kekal — tiada siapa boleh menukarnya
   daripada dalam aplikasi. */
const JENIS_LOGO = { '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

function logoTerbenam() {
  for (const sambungan of Object.keys(JENIS_LOGO)) {
    const laluan = join(akar, 'assets', 'logo-uis' + sambungan);
    if (existsSync(laluan)) {
      const data = readFileSync(laluan).toString('base64');
      return {
        nama: 'assets/logo-uis' + sambungan,
        uri: 'data:' + JENIS_LOGO[sambungan] + ';base64,' + data
      };
    }
  }
  return null;
}

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

const logo = logoTerbenam();

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
  (logo ? 'window.CT_LOGO_TERBENAM = "' + logo.uri + '";\n' : '') +
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
