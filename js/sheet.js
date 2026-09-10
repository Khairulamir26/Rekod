/* e-Dawam — eksport ke Google Sheet.

   e-Dawam ialah aplikasi statik tanpa pelayan, jadi ia tidak boleh menulis ke
   Google Sheet secara terus. Sebaliknya, satu skrip kecil (Apps Script) dipasang
   pada spreadsheet itu sendiri dan diterbitkan sebagai Web App. Aplikasi
   menghantar data kepada pautan itu, dan skrip itulah yang menulis ke dalam
   helaian. Kebaikannya:

   - Tiada kunci API atau kata kunci di dalam kod aplikasi. Pautan Web App
     dimasukkan oleh guru sendiri dan disimpan pada perantinya sahaja.
   - Skrip berjalan sebagai pemilik spreadsheet, jadi kebenaran Google tidak
     perlu diminta daripada setiap guru.
   - Skrip hanya menulis sel data yang dinamakan. Tajuk, formula, susunan dan
     reka bentuk helaian tidak pernah disentuh.

   Fail skrip itu ada dalam tools/apps-script-edawam.gs. */

window.CT = window.CT || {};

(function () {
  'use strict';

  var u = CT.util;

  var JENIS = 'e-dawam-eksport';
  var VERSI_MUATAN = 1;

  /* Helaian membawa lajur M1 hingga M14 — satu bagi setiap minggu semester. */
  var MINGGU_MAKS = 14;

  /* ---------- Minggu semester ---------- */

  /* Minggu 1 bermula pada hari pertama semester. Guna aritmetik hari, bukan
     nombor minggu kalendar, supaya ia sejajar dengan lajur M1..M14 helaian. */
  function mingguUntuk(tarikh, mula) {
    mula = mula || CT.sukatan.tarikhMula();
    if (!u.sahKunci(tarikh) || !u.sahKunci(mula)) { return null; }
    var beza = CT.sukatan.bezaHari(mula, tarikh);
    if (beza < 0) { return null; }
    var n = Math.floor(beza / 7) + 1;
    return n > MINGGU_MAKS ? null : n;
  }

  /* Isnin hingga Ahad bagi minggu yang mengandungi tarikh diberi. */
  function mingguKalendar(tarikh) {
    var hari = u.hariMinggu(tarikh);
    var kePada = hari === 0 ? -6 : 1 - hari;      // Ahad dikira hujung minggu
    var isnin = u.tambahHari(tarikh, kePada);
    return { dari: isnin, hingga: u.tambahHari(isnin, 6) };
  }

  /* ---------- Pilihan tempoh ---------- */

  function tempoh(kunci, tarikh) {
    var hariIni = tarikh || u.hariIni();
    if (kunci === 'minggu-lepas') {
      var m = mingguKalendar(u.tambahHari(hariIni, -7));
      return { dari: m.dari, hingga: m.hingga, nama: 'Minggu lepas' };
    }
    if (kunci === 'semester') {
      return {
        dari: CT.sukatan.tarikhMula(),
        hingga: CT.sukatan.tarikhAkhir(),
        nama: 'Sepanjang semester'
      };
    }
    var ini = mingguKalendar(hariIni);
    return { dari: ini.dari, hingga: ini.hingga, nama: 'Minggu ini' };
  }

  /* ---------- Membina muatan ---------- */

  function helaianUntuk(m) {
    var program = CT.jadual.programMurid(m) === 'ijazah' ? 'DEGREE' : 'DIPLOMA';
    var kumpulan = m.kumpulan === 'banat' ? 'BANAT' : 'BANIN';
    return program + ' ' + kumpulan;
  }

  function dipDeg(m) {
    return CT.jadual.programMurid(m) === 'ijazah' ? 'DEG' : 'DIP';
  }

  /* Muka surat terkini bagi setiap minggu dalam julat: halaman tertinggi yang
     dicapai murid dalam minggu itu. Minggu tanpa rekod sengaja ditinggalkan —
     skrip helaian hanya menulis sel yang ada nilainya, jadi apa yang guru taip
     sendiri dalam helaian tidak akan dikosongkan. */
  function mingguMurid(muridId, dari, hingga, mula) {
    var rekod = CT.store.baca('rekod', {}) || {};
    var hasil = {};
    Object.keys(rekod).forEach(function (t) {
      if (t < dari || t > hingga) { return; }
      var r = (rekod[t] || {})[muridId];
      if (!r) { return; }
      var halaman = +r.mukaHabis || +r.mukaMula || 0;
      if (!halaman) { return; }
      var n = mingguUntuk(t, mula);
      if (!n) { return; }
      if (!hasil[n] || halaman > hasil[n]) { hasil[n] = halaman; }
    });
    return hasil;
  }

  /* Catatan hanya dihantar jika e-Dawam benar-benar mempunyai nota dalam julat
     itu. Kalau tidak, lajur CATATAN dalam helaian dibiarkan seperti asal. */
  function catatanMurid(muridId, dari, hingga) {
    var pilihan = null;
    CT.store.senaraiNota().forEach(function (n) {
      if (n.muridId !== muridId || n.sulit) { return; }
      if (!n.tarikh || n.tarikh < dari || n.tarikh > hingga) { return; }
      if (!pilihan || String(n.tarikh) > String(pilihan.tarikh)) { pilihan = n; }
    });
    return pilihan ? String(pilihan.teks || '').trim() : '';
  }

  function bina(pilihanTempoh) {
    var t = pilihanTempoh && pilihanTempoh.dari ? pilihanTempoh : tempoh(pilihanTempoh);
    var mula = CT.sukatan.tarikhMula();

    var murid = CT.store.senaraiMurid().map(function (m) {
      return {
        matrik: String(m.matrik || '').trim(),
        nama: String(m.nama || '').trim(),
        helaian: helaianUntuk(m),
        halaqah: String(m.halaqah || '').trim(),
        dipDeg: dipDeg(m),
        telefon: String(m.telefon || '').trim(),
        hifzq: CT.sukatan.namaTahap(CT.jadual.programMurid(m), m.hifz || ''),
        catatan: catatanMurid(m.id, t.dari, t.hingga),
        minggu: mingguMurid(m.id, t.dari, t.hingga, mula)
      };
    });

    return {
      aplikasi: 'e-Dawam',
      jenis: JENIS,
      versiMuatan: VERSI_MUATAN,
      versiAplikasi: CT.VERSI || '',
      dihantar: new Date().toISOString(),
      semesterMula: mula,
      mingguMaks: MINGGU_MAKS,
      julat: {
        dari: t.dari,
        hingga: t.hingga,
        nama: t.nama || '',
        mingguDari: mingguUntuk(t.dari, mula),
        mingguHingga: mingguUntuk(t.hingga, mula)
      },
      murid: murid
    };
  }

  /* Ringkasan untuk dipaparkan sebelum guru menekan hantar. */
  function pratonton(pilihanTempoh) {
    var muatan = bina(pilihanTempoh);
    var adaData = 0, tiadaHalaqah = 0, tiadaMatrik = 0, jumlahSel = 0;
    var minggu = {};

    muatan.murid.forEach(function (m) {
      var bil = Object.keys(m.minggu).length;
      if (bil) { adaData++; jumlahSel += bil; }
      Object.keys(m.minggu).forEach(function (n) { minggu[n] = true; });
      if (!m.halaqah) { tiadaHalaqah++; }
      if (!m.matrik) { tiadaMatrik++; }
    });

    return {
      muatan: muatan,
      julat: muatan.julat,
      murid: muatan.murid.length,
      adaData: adaData,
      jumlahSel: jumlahSel,
      minggu: Object.keys(minggu).map(Number).sort(function (a, b) { return a - b; }),
      tiadaHalaqah: tiadaHalaqah,
      tiadaMatrik: tiadaMatrik
    };
  }

  /* ---------- Pautan Apps Script ---------- */

  function pautan() {
    return String(CT.store.tetapan().sheetUrl || '').trim();
  }

  function pautanSah(url) {
    return /^https:\/\/script\.google(usercontent)?\.com\/macros\/s\/[\w-]+\/exec/.test(
      String(url || '').trim());
  }

  function simpanPautan(url) {
    var bersih = String(url || '').trim();
    if (bersih && !pautanSah(bersih)) {
      return { berjaya: false, sebab: 'Pautan itu bukan pautan Web App Apps Script. ' +
        'Ia sepatutnya berakhir dengan /exec.' };
    }
    CT.store.simpanTetapan({ sheetUrl: bersih });
    return { berjaya: true };
  }

  /* ---------- Menghantar ---------- */

  /* Ralat rangkaian datang dalam banyak bentuk. Guru hanya perlu tahu apa yang
     patut dibuat seterusnya, jadi setiap satu ditukar kepada satu ayat. */
  function ralatMudah(e) {
    if (!navigator.onLine) {
      return 'Tiada internet. Sambung ke internet, kemudian cuba semula.';
    }
    var mesej = String((e && e.message) || '');
    if (/Failed to fetch|NetworkError|Load failed|TypeError/i.test(mesej)) {
      return 'Tidak dapat menghubungi spreadsheet. Periksa pautan Apps Script ' +
        'dan pastikan ia diterbitkan untuk "sesiapa yang mempunyai pautan".';
    }
    return mesej || 'Eksport gagal. Sila cuba semula.';
  }

  function hantarMentah(muatan) {
    var url = pautan();
    if (!url) {
      return Promise.reject(new Error('Pautan spreadsheet belum ditetapkan.'));
    }
    /* text/plain digunakan dengan sengaja: ia mengelakkan permintaan preflight
       CORS, yang Apps Script tidak jawab. Skrip di sebelah sana menghurai
       badan permintaan sebagai JSON. */
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(muatan),
      redirect: 'follow'
    }).then(function (jawapan) {
      if (!jawapan.ok) {
        throw new Error('Google membalas ralat ' + jawapan.status + '. ' +
          'Terbitkan semula Apps Script, kemudian cuba lagi.');
      }
      return jawapan.text();
    }).then(function (teks) {
      var hasil;
      try { hasil = JSON.parse(teks); }
      catch (e) {
        throw new Error('Balasan tidak difahami. Pastikan pautan itu pautan ' +
          'Apps Script e-Dawam, bukan pautan spreadsheet biasa.');
      }
      if (!hasil.ok) {
        throw new Error(hasil.ralat || 'Spreadsheet menolak data ini.');
      }
      return hasil;
    });
  }

  function uji() {
    return hantarMentah({ aplikasi: 'e-Dawam', jenis: JENIS, ujian: true })
      .catch(function (e) { throw new Error(ralatMudah(e)); });
  }

  function eksport(pilihanTempoh) {
    var muatan = (pilihanTempoh && pilihanTempoh.murid) ? pilihanTempoh : bina(pilihanTempoh);
    return hantarMentah(muatan).then(function (hasil) {
      catat(muatan, hasil);
      return hasil;
    }, function (e) {
      throw new Error(ralatMudah(e));
    });
  }

  /* ---------- Eksport terakhir dan peringatan Jumaat ---------- */

  function catat(muatan, hasil) {
    CT.store.simpanTetapan({
      eksportTerakhir: new Date().toISOString(),
      eksportTerakhirJulat: muatan.julat ? (muatan.julat.dari + '..' + muatan.julat.hingga) : '',
      eksportTerakhirBil: (hasil && hasil.dikemaskini) || 0
    });
  }

  function status() {
    var t = CT.store.tetapan();
    var iso = t.eksportTerakhir || '';
    var hasil = {
      pernah: false, iso: '', teks: 'Belum pernah dieksport',
      julat: t.eksportTerakhirJulat || '', bil: +t.eksportTerakhirBil || 0,
      adaPautan: !!pautan()
    };
    if (!iso) { return hasil; }
    var d = new Date(iso);
    if (isNaN(d.getTime())) { return hasil; }
    hasil.pernah = true;
    hasil.iso = iso;
    hasil.teks = 'Eksport terakhir: ' + u.capMasa(iso);
    return hasil;
  }

  /* Sudah dieksport dalam minggu kalendar semasa? */
  function sudahEksportMingguIni(tarikh) {
    var iso = CT.store.tetapan().eksportTerakhir;
    if (!iso) { return false; }
    var d = new Date(iso);
    if (isNaN(d.getTime())) { return false; }
    var m = mingguKalendar(tarikh || u.hariIni());
    var kunci = u.kunciDari(d);
    return kunci >= m.dari && kunci <= m.hingga;
  }

  /* Peringatan hari Jumaat: ringkas, tidak menakutkan, dan boleh ditutup untuk
     hari itu. Ia tidak muncul jika guru sudah eksport minggu ini. */
  function perluPeringatan(tarikh) {
    var hariIni = tarikh || u.hariIni();
    if (u.hariMinggu(hariIni) !== 5) { return false; }
    if (CT.store.tetapan().eksportPeringatanTutup === hariIni) { return false; }
    if (!CT.store.senaraiMurid().length) { return false; }
    return !sudahEksportMingguIni(hariIni);
  }

  function tutupPeringatan(tarikh) {
    CT.store.simpanTetapan({ eksportPeringatanTutup: tarikh || u.hariIni() });
  }

  /* ---------- Salinan CSV mengikut susunan helaian ---------- */

  /* Untuk guru yang tidak mahu memasang Apps Script: fail CSV dengan lajur
     dalam susunan yang sama seperti helaian, sedia untuk ditampal. */
  function csvHelaian(pilihanTempoh) {
    var muatan = bina(pilihanTempoh);
    var tajuk = ['HELAIAN', 'HALAQAH', 'NO MATRIK', 'NAMA', 'DIP/DEG',
      'NO TELEFON', 'CATATAN', 'HIFZQ'];
    for (var i = 1; i <= MINGGU_MAKS; i++) { tajuk.push('M' + i); }

    var baris = [tajuk];
    muatan.murid.forEach(function (m) {
      var r = [m.helaian, m.halaqah, m.matrik, m.nama, m.dipDeg, m.telefon,
        m.catatan, m.hifzq];
      for (var i = 1; i <= MINGGU_MAKS; i++) {
        r.push(m.minggu[i] === undefined ? '' : m.minggu[i]);
      }
      baris.push(r);
    });
    return baris;
  }

  CT.sheet = {
    MINGGU_MAKS: MINGGU_MAKS,

    mingguUntuk: mingguUntuk,
    mingguKalendar: mingguKalendar,
    tempoh: tempoh,
    bina: bina,
    pratonton: pratonton,

    pautan: pautan,
    pautanSah: pautanSah,
    simpanPautan: simpanPautan,

    uji: uji,
    eksport: eksport,
    ralatMudah: ralatMudah,

    status: status,
    sudahEksportMingguIni: sudahEksportMingguIni,
    perluPeringatan: perluPeringatan,
    tutupPeringatan: tutupPeringatan,

    csvHelaian: csvHelaian
  };
})();
