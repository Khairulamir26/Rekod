/* e-Dawam — jadual hari kelas.

   Pelajar Diploma berkelas Isnin hingga Jumaat. Pelajar Ijazah berkelas
   sekali seminggu, pada hari yang ditetapkan dalam profil masing-masing.

   Peraturan itu ditulis di sini sahaja supaya tab Kehadiran dan tab Rekod
   sentiasa memaparkan senarai murid yang sama bagi sesuatu tarikh, dan murid
   yang tiada kelas pada hari itu tidak pernah dikira sebagai belum ditanda
   atau tidak hadir. */

window.CT = window.CT || {};

(function () {
  'use strict';

  /* Indeks sepadan dengan Date.getUTCDay(): 0 = Ahad. */
  var NAMA_HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

  var HARI_DIPLOMA = [1, 2, 3, 4, 5];      // Isnin hingga Jumaat

  function namaHari(n) {
    return NAMA_HARI[n] === undefined ? '-' : NAMA_HARI[n];
  }

  function programMurid(m) {
    return m && m.program === 'ijazah' ? 'ijazah' : 'diploma';
  }

  /* Hari kelas Ijazah yang sah ialah 0-6. Apa-apa nilai lain (termasuk profil
     lama yang dibuat sebelum medan ini wujud) bermakna guru belum
     menetapkannya. */
  function hariIjazah(m) {
    var n = parseInt(m && m.hariKelas, 10);
    return (n >= 0 && n <= 6) ? n : null;
  }

  function perluHari(m) {
    return programMurid(m) === 'ijazah' && hariIjazah(m) === null;
  }

  /* Senarai hari kelas seorang murid. Pelajar Ijazah yang belum ditetapkan
     harinya dikembalikan sebagai Isnin-Jumaat, bukan senarai kosong, supaya
     dia tidak hilang daripada senarai kehadiran sebelum guru sempat memilih
     harinya. Lebih baik muncul terlalu kerap daripada tercicir tanpa disedari. */
  function hariKelas(m) {
    if (programMurid(m) === 'diploma') { return HARI_DIPLOMA.slice(); }
    var h = hariIjazah(m);
    return h === null ? HARI_DIPLOMA.slice() : [h];
  }

  function adaKelas(m, tarikh) {
    return hariKelas(m).indexOf(CT.util.hariMinggu(tarikh)) !== -1;
  }

  /* Teks pendek untuk kad dan profil murid. */
  function teksHari(m) {
    if (programMurid(m) === 'diploma') { return 'Isnin - Jumaat'; }
    var h = hariIjazah(m);
    return h === null ? 'Belum ditetapkan' : 'Setiap ' + namaHari(h);
  }

  function muridUntuk(tarikh, senarai) {
    senarai = senarai || CT.store.senaraiMurid();
    return senarai.filter(function (m) { return adaKelas(m, tarikh); });
  }

  CT.jadual = {
    NAMA_HARI: NAMA_HARI,
    HARI_DIPLOMA: HARI_DIPLOMA,
    namaHari: namaHari,
    hariIjazah: hariIjazah,
    perluHari: perluHari,
    hariKelas: hariKelas,
    adaKelas: adaKelas,
    teksHari: teksHari,
    muridUntuk: muridUntuk
  };
})();
