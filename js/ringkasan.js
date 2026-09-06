/* e-Dawam — ringkasan kehadiran sepanjang semester.

   Tiada data baharu disimpan di sini. Semua nombor dikira semula daripada
   rekod kehadiran harian yang sedia ada, jadi ia tidak boleh menjadi lari
   daripada apa yang guru betul-betul tanda setiap hari.

   Dua peraturan penting:

   1. Hanya hari yang kehadiran benar-benar diambil dikira. Kalau guru
      terlepas mengambil kehadiran pada satu hari, hari itu tidak dikira
      langsung — bukan dikira semua murid tidak hadir.
   2. Hanya hari murid itu ada kelas dikira (lihat js/jadual.js). Pelajar
      Ijazah berkelas sekali seminggu, jadi denominatornya lebih kecil dan
      satu ketidakhadiran memberi kesan yang jauh lebih besar. */

window.CT = window.CT || {};

(function () {
  'use strict';

  /* Julat semester datang daripada tab Sukatan, jadi ringkasan ini dan kiraan
     baki sukatan sentiasa merujuk semester yang sama. */
  function julat() {
    return { mula: CT.sukatan.tarikhMula(), akhir: CT.sukatan.tarikhAkhir() };
  }

  /* Tarikh yang kehadiran benar-benar diambil dalam julat semester. Tarikh
     yang disimpan tanpa seorang pun ditanda tidak dikira sebagai kelas. */
  function tarikhDiambil() {
    var j = julat();
    if (!j.mula) { return []; }
    return CT.store.tarikhAdaKehadiran().filter(function (t) {
      if (t < j.mula || t > j.akhir) { return false; }
      return Object.keys(CT.store.kehadiranTarikh(t)).length > 0;
    }).sort();
  }

  function untukMurid(murid, senaraiTarikh) {
    var tarikh = senaraiTarikh || tarikhDiambil();
    var hasil = {
      kelas: 0, hadir: 0, tidak: 0, belum: 0,
      dimaklum: 0, tidakDimaklum: 0, tarikhTidak: []
    };

    tarikh.forEach(function (t) {
      if (!CT.jadual.adaKelas(murid, t)) { return; }   // dia tiada kelas hari itu
      hasil.kelas++;

      var nilai = CT.store.kehadiranTarikh(t)[murid.id];
      if (nilai === 'hadir') { hasil.hadir++; return; }
      if (nilai !== 'tidak') { hasil.belum++; return; }

      hasil.tidak++;
      hasil.tarikhTidak.push(t);
      var b = CT.store.butiranMurid(t, murid.id) || {};
      if (b.maklum === 'dimaklum') { hasil.dimaklum++; }
      else if (b.maklum === 'tidak-dimaklum') { hasil.tidakDimaklum++; }
    });

    hasil.peratus = hasil.kelas ? Math.round((hasil.hadir / hasil.kelas) * 100) : 0;
    return hasil;
  }

  /* Semua murid, disusun supaya yang paling banyak tidak hadir berada di atas.
     Nama menjadi pemutus apabila bilangannya sama. */
  function semuaMurid() {
    var tarikh = tarikhDiambil();
    return CT.store.senaraiMurid().map(function (m) {
      var r = untukMurid(m, tarikh);
      r.murid = m;
      return r;
    }).sort(function (a, b) {
      if (b.tidak !== a.tidak) { return b.tidak - a.tidak; }
      return String(a.murid.nama || '').localeCompare(String(b.murid.nama || ''), 'ms');
    });
  }

  CT.ringkasan = {
    julat: julat,
    tarikhDiambil: tarikhDiambil,
    untukMurid: untukMurid,
    semuaMurid: semuaMurid
  };
})();
