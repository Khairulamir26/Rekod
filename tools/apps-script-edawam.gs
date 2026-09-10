/**
 * e-Dawam — skrip penerima eksport untuk spreadsheet laporan halaqah.
 *
 * PASANG SEKALI SAHAJA:
 *   1. Buka spreadsheet laporan → Extensions → Apps Script.
 *   2. Padam kod contoh, tampal SEMUA fail ini, kemudian Save.
 *   3. Deploy → New deployment → pilih jenis "Web app".
 *        Execute as     : Me (pemilik spreadsheet)
 *        Who has access : Anyone with the link
 *   4. Salin pautan yang berakhir dengan /exec, tampal ke dalam e-Dawam
 *      (Utama → baris versi → Eksport ke Sheet → Pautan spreadsheet).
 *
 * JAMINAN REKA BENTUK
 *   - Skrip TIDAK PERNAH menambah, membuang atau menyusun semula baris,
 *     lajur atau helaian. Ia hanya menulis ke dalam sel yang sudah ada.
 *   - Sel yang mengandungi formula sentiasa dilangkau, tidak pernah ditimpa.
 *   - Baris dicari melalui NO MATRIK. Murid yang sama pada tarikh yang sama
 *     mengemas kini baris yang sama — tiada baris pendua dicipta.
 *   - Lajur M1..M14 hanya ditulis untuk minggu yang benar-benar ada rekod.
 *     Minggu lain dibiarkan seperti yang guru taip sendiri.
 *   - Tajuk, warna, gabungan sel dan lebar lajur tidak disentuh sama sekali.
 */

/* ----------------------------- Tetapan ----------------------------- */

/** Tulis lajur CATATAN daripada nota e-Dawam apabila ada nota. */
var TULIS_CATATAN = true;

/** Isi NAMA / DIP-DEG / NO TELEFON / HIFZQ hanya apabila sel itu masih kosong. */
var TULIS_PROFIL_JIKA_KOSONG = true;

/** Bilangan lajur mingguan dalam helaian (M1..M14). */
var MINGGU_MAKS = 14;

/* --------------------------- Titik masuk --------------------------- */

function doGet() {
  return jawab({
    ok: true,
    mesej: 'Penerima eksport e-Dawam sedia. Hantar data melalui POST.',
    helaian: namaHelaian()
  });
}

function doPost(e) {
  var kunci = LockService.getScriptLock();
  try {
    kunci.waitLock(30000);
  } catch (ralat) {
    return jawab({ ok: false, ralat: 'Spreadsheet sedang sibuk. Cuba semula sebentar lagi.' });
  }

  try {
    var muatan = huraiBadan(e);
    if (!muatan) {
      return jawab({ ok: false, ralat: 'Badan permintaan bukan JSON yang sah.' });
    }
    if (muatan.jenis !== 'e-dawam-eksport') {
      return jawab({ ok: false, ralat: 'Data ini bukan eksport e-Dawam.' });
    }
    if (muatan.ujian) {
      return jawab({ ok: true, ujian: true, helaian: namaHelaian() });
    }
    if (!muatan.murid || !muatan.murid.length) {
      return jawab({ ok: false, ralat: 'Tiada data murid dalam eksport ini.' });
    }
    return jawab(tulisSemua(muatan));
  } catch (ralat) {
    return jawab({ ok: false, ralat: String(ralat && ralat.message ? ralat.message : ralat) });
  } finally {
    kunci.releaseLock();
  }
}

function huraiBadan(e) {
  try {
    var teks = e && e.postData && e.postData.contents;
    return teks ? JSON.parse(teks) : null;
  } catch (ralat) {
    return null;
  }
}

function jawab(objek) {
  return ContentService.createTextOutput(JSON.stringify(objek))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------- Bantuan umum --------------------------- */

function normal(nilai) {
  return String(nilai === null || nilai === undefined ? '' : nilai)
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/** Nombor matrik dibandingkan tanpa ruang, sengkang atau garis bawah. */
function kunciMatrik(nilai) {
  return normal(nilai).replace(/[^A-Z0-9]/g, '');
}

function namaHelaian() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets().map(function (h) {
    return h.getName();
  });
}

function cariHelaian(nama) {
  var mahu = normal(nama);
  if (!mahu) { return null; }
  var semua = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  var i;
  for (i = 0; i < semua.length; i++) {
    if (normal(semua[i].getName()) === mahu) { return semua[i]; }
  }
  // Nama helaian kadangkala membawa teks tambahan, contoh "DIPLOMA BANIN 2026".
  for (i = 0; i < semua.length; i++) {
    if (normal(semua[i].getName()).indexOf(mahu) === 0) { return semua[i]; }
  }
  return null;
}

/* ---------------------- Membaca struktur helaian ------------------- */

/**
 * Mengesan setiap blok halaqah dalam satu helaian dengan membaca tajuknya,
 * bukan dengan nombor baris tetap. Ini bermakna guru boleh menambah atau
 * mengalihkan blok dalam spreadsheet tanpa perlu mengubah skrip ini.
 */
function petaHelaian(helaian) {
  var barisAkhir = helaian.getLastRow();
  var lajurAkhir = Math.max(helaian.getLastColumn(), 8);
  if (barisAkhir < 2) { return { blok: [], ikutMatrik: {} }; }

  var nilai = helaian.getRange(1, 1, barisAkhir, lajurAkhir).getDisplayValues();

  var blok = [];
  var r;
  for (r = 0; r < nilai.length; r++) {
    if (indeksLajur(nilai[r], 'NO MATRIK') === -1) { continue; }

    var lajur = petaLajur(nilai[r], r > 0 ? nilai[r - 1] : []);
    if (lajur.matrik === -1) { continue; }

    blok.push({
      halaqah: namaHalaqah(nilai, r, lajur),
      barisTajuk: r + 1,               // 1-indeks seperti dalam spreadsheet
      barisPertama: r + 2,
      barisAkhir: null,                // diisi selepas blok berikutnya diketahui
      lajur: lajur
    });
  }

  // Setiap blok berakhir tepat sebelum tajuk blok berikutnya.
  for (r = 0; r < blok.length; r++) {
    blok[r].barisAkhir = (r + 1 < blok.length)
      ? blok[r + 1].barisTajuk - 1
      : barisAkhir;
  }

  var ikutMatrik = {};
  blok.forEach(function (b) {
    b.kosong = [];
    for (var baris = b.barisPertama; baris <= b.barisAkhir; baris++) {
      var sel = nilai[baris - 1];
      if (!sel) { continue; }
      var matrik = kunciMatrik(sel[b.lajur.matrik]);
      if (matrik) {
        if (!ikutMatrik[matrik]) { ikutMatrik[matrik] = { blok: b, baris: baris }; }
      } else if (normal(sel[b.lajur.nama]) === '') {
        b.kosong.push(baris);          // slot terbuka dalam blok ini
      }
    }
  });

  return { blok: blok, ikutMatrik: ikutMatrik };
}

function indeksLajur(baris, label) {
  var mahu = normal(label);
  for (var c = 0; c < baris.length; c++) {
    if (normal(baris[c]) === mahu) { return c; }
  }
  return -1;
}

/**
 * Lajur dibaca daripada baris tajuk. DIP/DEG, NO TELEFON dan CATATAN sering
 * digabungkan menegak merentasi dua baris tajuk, jadi baris di atas dibaca
 * juga sebagai sandaran.
 */
function petaLajur(barisTajuk, barisAtas) {
  function cari(label) {
    var i = indeksLajur(barisTajuk, label);
    if (i !== -1) { return i; }
    return indeksLajur(barisAtas || [], label);
  }

  var lajur = {
    bil: cari('BIL'),
    matrik: cari('NO MATRIK'),
    nama: cari('NAMA'),
    dipDeg: cari('DIP/DEG'),
    telefon: cari('NO TELEFON'),
    catatan: cari('CATATAN'),
    hifzq: cari('HIFZQ'),
    minggu: {}
  };

  for (var n = 1; n <= MINGGU_MAKS; n++) {
    var i = cari('M' + n);
    if (i !== -1) { lajur.minggu[n] = i; }
  }
  return lajur;
}

/** Nama halaqah biasanya berada dalam baris tajuk atau baris di atasnya. */
function namaHalaqah(nilai, indeksTajuk, lajur) {
  var calon = [];
  if (indeksTajuk > 0) { calon.push(nilai[indeksTajuk - 1]); }
  calon.push(nilai[indeksTajuk]);

  for (var i = 0; i < calon.length; i++) {
    var baris = calon[i] || [];
    for (var c = 0; c < baris.length; c++) {
      var teks = normal(baris[c]);
      if (teks.indexOf('HALAQAH') !== -1) { return teks; }
    }
  }
  return '';
}

/* --------------------------- Menulis data -------------------------- */

function tulisSemua(muatan) {
  var cache = {};
  var dikemaskini = 0;
  var sel = 0;
  var dilangkauFormula = 0;
  var tidakDijumpai = [];
  var helaianTiada = {};

  muatan.murid.forEach(function (m) {
    var adaMinggu = m.minggu && Object.keys(m.minggu).length > 0;
    var adaCatatan = TULIS_CATATAN && m.catatan;
    if (!adaMinggu && !adaCatatan) { return; }        // tiada apa untuk ditulis

    var matrik = kunciMatrik(m.matrik);
    if (!matrik) { tidakDijumpai.push(m.nama + ' (tiada matrik)'); return; }

    var helaian = cache[m.helaian];
    if (helaian === undefined) {
      var h = cariHelaian(m.helaian);
      cache[m.helaian] = helaian = h ? { helaian: h, peta: petaHelaian(h) } : null;
    }
    if (!helaian) {
      helaianTiada[m.helaian] = true;
      tidakDijumpai.push(m.nama + ' (helaian ' + m.helaian + ' tiada)');
      return;
    }

    var sasaran = helaian.peta.ikutMatrik[matrik] || slotBaharu(helaian, m, matrik);
    if (!sasaran) { tidakDijumpai.push(m.nama); return; }

    var hasil = tulisBaris(helaian.helaian, sasaran, m);
    if (hasil.sel > 0) { dikemaskini++; }
    sel += hasil.sel;
    dilangkauFormula += hasil.formula;
  });

  var jawapan = {
    ok: true,
    dikemaskini: dikemaskini,
    sel: sel,
    tidakDijumpai: tidakDijumpai
  };
  if (dilangkauFormula) { jawapan.dilangkauFormula = dilangkauFormula; }
  if (Object.keys(helaianTiada).length) {
    jawapan.helaianTiada = Object.keys(helaianTiada);
    jawapan.helaian = namaHelaian();
  }
  return jawapan;
}

/**
 * Murid yang belum ada dalam helaian diletakkan pada slot kosong dalam blok
 * halaqahnya sendiri. Jika halaqah tidak dinyatakan atau blok itu penuh, murid
 * itu dilaporkan balik kepada guru — skrip tidak pernah meneka tempat.
 */
function slotBaharu(helaian, m, matrik) {
  var mahu = normal(m.halaqah);
  if (!mahu) { return null; }

  for (var i = 0; i < helaian.peta.blok.length; i++) {
    var b = helaian.peta.blok[i];
    if (b.halaqah.indexOf(mahu) === -1 && mahu.indexOf(b.halaqah) === -1) { continue; }
    if (!b.kosong.length) { return null; }

    var baris = b.kosong.shift();
    var sasaran = { blok: b, baris: baris, baharu: true };
    helaian.peta.ikutMatrik[matrik] = sasaran;

    tulisSel(helaian.helaian, baris, b.lajur.matrik, m.matrik, true);
    return sasaran;
  }
  return null;
}

/** Menulis satu sel, kecuali jika ia mengandungi formula. */
function tulisSel(helaian, baris, lajur, nilai, hanyaJikaKosong) {
  if (lajur === undefined || lajur === -1) { return 0; }
  var julat = helaian.getRange(baris, lajur + 1);
  if (julat.getFormula()) { return -1; }
  if (hanyaJikaKosong && String(julat.getDisplayValue()).trim() !== '') { return 0; }
  julat.setValue(nilai);
  return 1;
}

function tulisBaris(helaian, sasaran, m) {
  var lajur = sasaran.blok.lajur;
  var sel = 0;
  var formula = 0;

  function catat(hasil) {
    if (hasil === -1) { formula++; } else { sel += hasil; }
  }

  if (TULIS_PROFIL_JIKA_KOSONG) {
    catat(tulisSel(helaian, sasaran.baris, lajur.nama, m.nama, true));
    catat(tulisSel(helaian, sasaran.baris, lajur.dipDeg, m.dipDeg, true));
    catat(tulisSel(helaian, sasaran.baris, lajur.telefon, m.telefon, true));
    catat(tulisSel(helaian, sasaran.baris, lajur.hifzq, m.hifzq, true));
  }

  if (TULIS_CATATAN && m.catatan) {
    catat(tulisSel(helaian, sasaran.baris, lajur.catatan, m.catatan, false));
  }

  catat(tulisMinggu(helaian, sasaran.baris, lajur, m.minggu));

  return { sel: sel, formula: formula };
}

/**
 * Lajur M1..M14 ditulis dalam satu operasi: baca julat sekali, tukar hanya
 * minggu yang ada rekod, kekalkan yang lain, kemudian tulis balik. Sel formula
 * dikekalkan sebagai formulanya sendiri.
 */
function tulisMinggu(helaian, baris, lajur, minggu) {
  if (!minggu) { return 0; }

  var nombor = Object.keys(minggu).filter(function (n) {
    return lajur.minggu[n] !== undefined;
  });
  if (!nombor.length) { return 0; }

  var indeks = [];
  Object.keys(lajur.minggu).forEach(function (n) { indeks.push(lajur.minggu[n]); });
  var mula = Math.min.apply(null, indeks);
  var akhir = Math.max.apply(null, indeks);

  var julat = helaian.getRange(baris, mula + 1, 1, akhir - mula + 1);
  var nilai = julat.getValues()[0];
  var formula = julat.getFormulas()[0];

  var ditulis = 0;
  nombor.forEach(function (n) {
    var kedudukan = lajur.minggu[n] - mula;
    if (formula[kedudukan]) { return; }              // formula tidak disentuh
    nilai[kedudukan] = minggu[n];
    ditulis++;
  });
  if (!ditulis) { return 0; }

  // Sel berformula dikembalikan sebagai formula supaya tiada yang hilang.
  for (var i = 0; i < nilai.length; i++) {
    if (formula[i]) { nilai[i] = formula[i]; }
  }

  julat.setValues([nilai]);
  return ditulis;
}
