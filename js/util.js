/* e-Dawam — fungsi bantuan tarikh, masa dan format Malaysia.
   Semua pengiraan tarikh menggunakan zon waktu Asia/Kuala_Lumpur. */

window.CT = window.CT || {};

(function () {
  'use strict';

  var ZON = 'Asia/Kuala_Lumpur';

  var BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
  var BULAN_PENDEK = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
  var HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  var HARI_PENDEK = ['Ah', 'Is', 'Se', 'Ra', 'Kh', 'Ju', 'Sa'];

  // en-CA menghasilkan format YYYY-MM-DD.
  var fmtKunci = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZON, year: 'numeric', month: '2-digit', day: '2-digit'
  });
  var fmtJam = new Intl.DateTimeFormat('en-US', {
    timeZone: ZON, hour: 'numeric', minute: '2-digit', hour12: true
  });

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* Kunci tarikh "YYYY-MM-DD" mengikut waktu Malaysia. */
  function kunciDari(d) {
    return fmtKunci.format(d || new Date());
  }

  function hariIni() { return kunciDari(new Date()); }

  /* Pecahkan kunci kepada nombor tahun, bulan (1-12) dan hari. */
  function pecah(kunci) {
    var b = String(kunci || '').split('-');
    return { tahun: +b[0], bulan: +b[1], hari: +b[2] };
  }

  function bina(tahun, bulan, hari) {
    return tahun + '-' + pad(bulan) + '-' + pad(hari);
  }

  /* Guna UTC supaya penambahan hari tidak terjejas oleh zon waktu pelayar. */
  function tarikhUTC(kunci) {
    var p = pecah(kunci);
    return new Date(Date.UTC(p.tahun, p.bulan - 1, p.hari));
  }

  function tambahHari(kunci, jumlah) {
    var d = tarikhUTC(kunci);
    d.setUTCDate(d.getUTCDate() + jumlah);
    return bina(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  function hariMinggu(kunci) { return tarikhUTC(kunci).getUTCDay(); }

  function sahKunci(kunci) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(kunci || ''));
  }

  /* "Rabu, 26 Ogos 2026" */
  function tarikhPenuh(kunci) {
    if (!sahKunci(kunci)) { return '-'; }
    var p = pecah(kunci);
    return HARI[hariMinggu(kunci)] + ', ' + p.hari + ' ' + BULAN[p.bulan - 1] + ' ' + p.tahun;
  }

  /* "26/08/2026" — format tarikh Malaysia */
  function tarikhRingkas(kunci) {
    if (!sahKunci(kunci)) { return '-'; }
    var p = pecah(kunci);
    return pad(p.hari) + '/' + pad(p.bulan) + '/' + p.tahun;
  }

  /* "26 Ogo 2026" */
  function tarikhSederhana(kunci) {
    if (!sahKunci(kunci)) { return '-'; }
    var p = pecah(kunci);
    return p.hari + ' ' + BULAN_PENDEK[p.bulan - 1] + ' ' + p.tahun;
  }

  function namaBulan(bulan) { return BULAN[bulan - 1] || ''; }

  /* "14:05" -> "2:05 PM" */
  function masa12(hhmm) {
    var b = String(hhmm || '').split(':');
    var jam = parseInt(b[0], 10);
    var minit = parseInt(b[1], 10);
    if (isNaN(jam) || isNaN(minit)) { return ''; }
    var tanda = jam >= 12 ? 'PM' : 'AM';
    var j12 = jam % 12;
    if (j12 === 0) { j12 = 12; }
    return j12 + ':' + pad(minit) + ' ' + tanda;
  }

  /* Masa semasa di Malaysia dalam format 12 jam, cth "3:42 PM". */
  function masaSekarang() {
    return fmtJam.format(new Date()).replace(/[\u202f\u00a0]/g, ' ');
  }

  function capMasa(iso) {
    if (!iso) { return ''; }
    var d = new Date(iso);
    if (isNaN(d.getTime())) { return ''; }
    return tarikhRingkas(kunciDari(d)) + ', ' + fmtJam.format(d).replace(/[\u202f\u00a0]/g, ' ');
  }

  function id(awalan) {
    return (awalan || 'id') + '-' + Date.now().toString(36) + '-' +
      Math.random().toString(36).slice(2, 8);
  }

  function selamat(teks) {
    return String(teks === null || teks === undefined ? '' : teks)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function peratus(atas, bawah) {
    if (!bawah) { return 0; }
    return Math.round((atas / bawah) * 100);
  }

  CT.util = {
    ZON: ZON,
    BULAN: BULAN,
    HARI: HARI,
    HARI_PENDEK: HARI_PENDEK,
    pad: pad,
    kunciDari: kunciDari,
    hariIni: hariIni,
    pecah: pecah,
    bina: bina,
    tambahHari: tambahHari,
    hariMinggu: hariMinggu,
    sahKunci: sahKunci,
    tarikhPenuh: tarikhPenuh,
    tarikhRingkas: tarikhRingkas,
    tarikhSederhana: tarikhSederhana,
    namaBulan: namaBulan,
    masa12: masa12,
    masaSekarang: masaSekarang,
    capMasa: capMasa,
    id: id,
    selamat: selamat,
    peratus: peratus
  };
})();
