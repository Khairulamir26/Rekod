/* ClassTrack — sukatan hafazan mengikut program dan tahap.

   Muka surat mengikut susun atur mushaf 604 halaman (Madani / Dar Al-Ma'rifah).
   Nombor halaman yang direkodkan guru dalam tab Rekod ialah nombor halaman
   MUTLAK dalam mushaf (1-604), bukan halaman dalam juz. */

window.CT = window.CT || {};

(function () {
  'use strict';

  var JUMLAH_HALAMAN = 604;

  /* Halaman pertama bagi setiap juz. */
  var JUZ_MULA = {
    1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 121, 8: 142, 9: 162, 10: 182,
    11: 201, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302, 17: 322, 18: 342,
    19: 362, 20: 382, 21: 402, 22: 422, 23: 442, 24: 462, 25: 482, 26: 502,
    27: 522, 28: 542, 29: 562, 30: 582
  };

  var PROGRAM = {
    diploma: {
      nama: 'Diploma',
      label: 'Hifz',
      tahap: {
        1: [1, 4], 2: [5, 9], 3: [10, 14], 4: [15, 20], 5: [21, 25], 6: [26, 30]
      }
    },
    ijazah: {
      nama: 'Ijazah',
      label: "I'adah",
      tahap: {
        1: [1, 4], 2: [5, 8], 3: [9, 12], 4: [13, 16],
        5: [17, 20], 6: [21, 24], 7: [25, 26], 8: [27, 30]
      }
    }
  };

  var TARIKH_AKHIR_LALAI = '2026-09-25';

  function program(kunci) {
    return PROGRAM[kunci] || PROGRAM.diploma;
  }

  function namaTahap(kunciProgram, tahap) {
    return program(kunciProgram).label + ' ' + tahap;
  }

  /* Julat juz bagi tahap tertentu, atau null jika tahap itu tiada sukatan. */
  function julatJuz(kunciProgram, tahap) {
    var julat = program(kunciProgram).tahap[tahap];
    if (!julat) { return null; }
    return { mula: julat[0], habis: julat[1] };
  }

  /* Julat halaman mutlak bagi tahap tertentu. */
  function julatHalaman(kunciProgram, tahap) {
    var juz = julatJuz(kunciProgram, tahap);
    if (!juz) { return null; }
    var mula = JUZ_MULA[juz.mula];
    var habis = juz.habis >= 30 ? JUMLAH_HALAMAN : JUZ_MULA[juz.habis + 1] - 1;
    return {
      juzMula: juz.mula,
      juzHabis: juz.habis,
      mula: mula,
      habis: habis,
      jumlah: habis - mula + 1
    };
  }

  /* Halaman terjauh yang pernah dihantar murid, berserta tarikh rekod pertama. */
  function rekodHafazan(muridId) {
    var semua = CT.store.baca('rekod', {});
    var terjauh = 0;
    var tarikhTerjauh = null;
    var tarikhPertama = null;
    var bilanganHari = 0;

    Object.keys(semua).forEach(function (tarikh) {
      var r = semua[tarikh][muridId];
      if (!r) { return; }
      var halaman = Math.max(+r.mukaHabis || 0, +r.mukaMula || 0);
      if (!halaman) { return; }

      bilanganHari++;
      if (!tarikhPertama || tarikh < tarikhPertama) { tarikhPertama = tarikh; }
      if (halaman > terjauh) { terjauh = halaman; tarikhTerjauh = tarikh; }
    });

    return {
      halaman: terjauh,
      tarikh: tarikhTerjauh,
      tarikhPertama: tarikhPertama,
      bilanganHari: bilanganHari
    };
  }

  /* Rekod hafazan terakhir SEBELUM tarikh yang diberi.
     Digunakan untuk menyambung muka surat: jika kali terakhir murid habis di
     halaman 487, rekod berikutnya bermula di halaman 488. */
  function rekodTerakhirSebelum(muridId, tarikh) {
    var semua = CT.store.baca('rekod', {});
    var terkini = null;

    Object.keys(semua).forEach(function (t) {
      if (t >= tarikh) { return; }          // kunci "YYYY-MM-DD" boleh dibanding terus
      var r = semua[t][muridId];
      if (!r) { return; }
      var halaman = Math.max(+r.mukaHabis || 0, +r.mukaMula || 0);
      if (!halaman) { return; }
      if (!terkini || t > terkini.tarikh) {
        terkini = { tarikh: t, halaman: halaman, juz: r.juz || null };
      }
    });

    return terkini;
  }

  /* Juz bagi sesuatu nombor halaman mushaf. */
  function juzUntukHalaman(halaman) {
    var n = +halaman;
    if (!n || n < 1 || n > JUMLAH_HALAMAN) { return null; }
    for (var juz = 30; juz >= 1; juz--) {
      if (n >= JUZ_MULA[juz]) { return juz; }
    }
    return null;
  }

  /* Cadangan permulaan bagi rekod baharu pada tarikh tertentu. */
  function cadanganSambungan(muridId, tarikh) {
    var lepas = rekodTerakhirSebelum(muridId, tarikh);
    if (!lepas || lepas.halaman >= JUMLAH_HALAMAN) { return null; }
    var mula = lepas.halaman + 1;
    return {
      mula: mula,
      juz: juzUntukHalaman(mula),
      dariHalaman: lepas.halaman,
      dariTarikh: lepas.tarikh
    };
  }

  function bezaHari(dari, hingga) {
    if (!CT.util.sahKunci(dari) || !CT.util.sahKunci(hingga)) { return 0; }
    var a = CT.util.pecah(dari);
    var b = CT.util.pecah(hingga);
    var ms = Date.UTC(b.tahun, b.bulan - 1, b.hari) - Date.UTC(a.tahun, a.bulan - 1, a.hari);
    return Math.round(ms / 86400000);
  }

  function tarikhAkhir() {
    return CT.store.tetapan().tarikhAkhirSemester || TARIKH_AKHIR_LALAI;
  }

  /* Kiraan penuh sukatan bagi seorang murid. */
  function kira(murid, hariIni) {
    hariIni = hariIni || CT.util.hariIni();

    var kunciProgram = murid.program || 'diploma';
    var tahap = +murid.hifz || 0;
    var halaman = julatHalaman(kunciProgram, tahap);

    var hasil = {
      muridId: murid.id,
      nama: murid.nama,
      program: kunciProgram,
      namaProgram: program(kunciProgram).nama,
      tahap: tahap,
      namaTahap: namaTahap(kunciProgram, tahap),
      adaSukatan: !!halaman,
      hariBaki: Math.max(0, bezaHari(hariIni, tarikhAkhir())),
      semesterTamat: bezaHari(hariIni, tarikhAkhir()) < 0
    };

    if (!halaman) { return hasil; }

    var rekod = rekodHafazan(murid.id);
    var dihantar = Math.min(Math.max(rekod.halaman, halaman.mula - 1), halaman.habis);
    var sudah = Math.max(0, dihantar - halaman.mula + 1);

    hasil.juzMula = halaman.juzMula;
    hasil.juzHabis = halaman.juzHabis;
    hasil.halamanMula = halaman.mula;
    hasil.halamanHabis = halaman.habis;
    hasil.jumlah = halaman.jumlah;
    hasil.halamanDihantar = rekod.halaman;
    hasil.tarikhDihantar = rekod.tarikh;
    hasil.sudah = sudah;
    hasil.baki = halaman.jumlah - sudah;
    hasil.peratus = CT.util.peratus(sudah, halaman.jumlah);
    hasil.luarJulat = rekod.halaman > 0 &&
      (rekod.halaman < halaman.mula || rekod.halaman > halaman.habis);

    // Kadar diperlukan bagi baki hari.
    hasil.kadarPerlu = hasil.hariBaki > 0 ? hasil.baki / hasil.hariBaki : null;

    /* Kadar sebenar setakat ini. Hanya bermakna apabila murid mempunyai
       sekurang-kurangnya dua hari rekod berlainan — satu hari sahaja akan
       memberi angka yang mengelirukan. */
    var hariBerlalu = rekod.tarikhPertama ? bezaHari(rekod.tarikhPertama, hariIni) + 1 : 0;
    hasil.hariRekod = rekod.bilanganHari;
    hasil.hariBerlalu = hariBerlalu;
    hasil.kadarSemasa = (rekod.bilanganHari >= 2 && hariBerlalu > 1 && sudah > 0)
      ? sudah / hariBerlalu
      : null;

    hasil.status = nilaiStatus(hasil);
    return hasil;
  }

  /* Ambang kadar: 1 halaman sehari dianggap kadar biasa hafazan harian.
     Lebih daripada itu bermakna murid perlu dikejar. */
  var AMBANG_SELESA = 1;

  function nilaiStatus(d) {
    if (d.baki <= 0) { return { kunci: 'cukup', teks: 'Sukatan cukup' }; }
    if (d.semesterTamat) { return { kunci: 'tamat', teks: 'Semester tamat' }; }
    if (d.hariBaki <= 0) { return { kunci: 'genting', teks: 'Hari terakhir' }; }
    if (d.kadarPerlu <= AMBANG_SELESA) { return { kunci: 'ikut', teks: 'Ikut jadual' }; }
    return { kunci: 'kejar', teks: 'Perlu dikejar' };
  }

  function kiraSemua(hariIni) {
    return CT.store.senaraiMurid().map(function (m) { return kira(m, hariIni); });
  }

  CT.sukatan = {
    JUMLAH_HALAMAN: JUMLAH_HALAMAN,
    JUZ_MULA: JUZ_MULA,
    PROGRAM: PROGRAM,
    TARIKH_AKHIR_LALAI: TARIKH_AKHIR_LALAI,
    program: program,
    namaTahap: namaTahap,
    julatJuz: julatJuz,
    julatHalaman: julatHalaman,
    rekodHafazan: rekodHafazan,
    rekodTerakhirSebelum: rekodTerakhirSebelum,
    juzUntukHalaman: juzUntukHalaman,
    cadanganSambungan: cadanganSambungan,
    bezaHari: bezaHari,
    tarikhAkhir: tarikhAkhir,
    kira: kira,
    kiraSemua: kiraSemua
  };
})();
