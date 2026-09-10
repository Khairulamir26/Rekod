/* e-Dawam — sandaran (backup) dan pemulihan (restore).

   Semua data e-Dawam tinggal di dalam pelayar peranti ini sahaja: tiada
   pelayan, tiada awan, tiada salinan di tempat lain. Jika telefon hilang,
   pelayar dipadam, atau iOS membuang simpanan tapak selepas tujuh hari tidak
   digunakan, data itu hilang bersama. Fail sandaran ialah satu-satunya
   salinan yang boleh dibawa keluar daripada peranti.

   Modul ini hanya membina dan menulis data — ia tidak pernah memadam apa-apa
   secara senyap. Setiap pemulihan menyimpan titik undur terlebih dahulu,
   supaya guru sentiasa boleh kembali kepada keadaan sebelum pemulihan. */

window.CT = window.CT || {};

(function () {
  'use strict';

  var u = CT.util;

  /* Lapan kunci ini ialah keseluruhan data guru. Fail besar (PDF, logo) dalam
     IndexedDB sengaja tidak disertakan: logo datang daripada aplikasi, dan
     PDF boleh dimuat semula — kedua-duanya bukan hasil kerja guru. */
  var KUNCI_DATA = ['murid', 'kehadiran', 'hadirButiran', 'rekod', 'nota',
    'acara', 'pasukan', 'tetapan'];

  var KUNCI_UNDUR = 'pulihBalik';
  var JENIS = 'e-dawam-sandaran';
  var VERSI_FAIL = 1;
  var TEMPOH_LALAI = 7;              // hari sebelum peringatan sandaran muncul

  /* ---------- Membina fail sandaran ---------- */

  function ambilData() {
    var data = {};
    KUNCI_DATA.forEach(function (k) { data[k] = CT.store.baca(k, null); });
    return data;
  }

  function bilPeta(peta) {
    if (!peta || typeof peta !== 'object') { return 0; }
    return Object.keys(peta).filter(function (t) {
      var isi = peta[t];
      if (Array.isArray(isi)) { return isi.length > 0; }
      return isi && Object.keys(isi).length > 0;
    }).length;
  }

  function kiraan(data) {
    data = data || {};
    return {
      murid: (data.murid || []).length,
      hariKehadiran: bilPeta(data.kehadiran),
      hariRekod: bilPeta(data.rekod),
      nota: (data.nota || []).length,
      hariAcara: bilPeta(data.acara)
    };
  }

  function bina() {
    var data = ambilData();
    return {
      aplikasi: 'e-Dawam',
      jenis: JENIS,
      versiFail: VERSI_FAIL,
      versiAplikasi: CT.VERSI || '',
      dicipta: new Date().toISOString(),
      tarikh: u.hariIni(),
      kiraan: kiraan(data),
      data: data
    };
  }

  function teks() { return JSON.stringify(bina()); }

  function namaFail() { return 'e-dawam-sandaran-' + u.hariIni() + '.json'; }

  /* Anggaran saiz sandaran dalam bentuk yang boleh dibaca guru. */
  function saizTeks(rentetan) {
    var bait = rentetan.length;
    try { bait = new Blob([rentetan]).size; } catch (e) { /* anggaran cukup */ }
    if (bait < 1024) { return bait + ' bait'; }
    if (bait < 1024 * 1024) { return Math.round(bait / 1024) + ' KB'; }
    return (bait / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /* ---------- Memeriksa fail sebelum digunakan ---------- */

  function huraiTeks(rentetan) {
    try { return { objek: JSON.parse(rentetan) }; }
    catch (e) { return { ralat: 'Fail ini bukan JSON yang sah. Pastikan fail tidak diubah selepas dimuat turun.' }; }
  }

  function petaSah(nilai) {
    return nilai === null || nilai === undefined ||
      (typeof nilai === 'object' && !Array.isArray(nilai));
  }

  function periksa(objek) {
    if (!objek || typeof objek !== 'object' || Array.isArray(objek)) {
      return { sah: false, sebab: 'Fail ini tidak berbentuk fail sandaran.' };
    }
    if (objek.jenis !== JENIS) {
      return { sah: false, sebab: 'Fail ini bukan fail sandaran e-Dawam.' };
    }
    if (+objek.versiFail > VERSI_FAIL) {
      return {
        sah: false,
        sebab: 'Fail ini daripada versi e-Dawam yang lebih baharu. Kemas kini ' +
          'aplikasi dahulu sebelum memulihkannya.'
      };
    }
    var d = objek.data;
    if (!d || typeof d !== 'object' || Array.isArray(d)) {
      return { sah: false, sebab: 'Fail sandaran ini tidak mengandungi data.' };
    }
    if (d.murid !== null && d.murid !== undefined && !Array.isArray(d.murid)) {
      return { sah: false, sebab: 'Senarai murid dalam fail ini rosak.' };
    }
    var rosak = ['kehadiran', 'hadirButiran', 'rekod', 'acara'].filter(function (k) {
      return !petaSah(d[k]);
    });
    if (rosak.length) {
      return { sah: false, sebab: 'Bahagian ' + rosak.join(', ') + ' dalam fail ini rosak.' };
    }
    return { sah: true };
  }

  /* ---------- Perbandingan fail lawan peranti ---------- */

  function banding(objek) {
    var fail = kiraan(objek && objek.data);
    var kini = kiraan(ambilData());
    return [
      { label: 'Murid', fail: fail.murid, peranti: kini.murid },
      { label: 'Hari kehadiran', fail: fail.hariKehadiran, peranti: kini.hariKehadiran },
      { label: 'Hari rekod bacaan', fail: fail.hariRekod, peranti: kini.hariRekod },
      { label: 'Nota', fail: fail.nota, peranti: kini.nota },
      { label: 'Hari acara', fail: fail.hariAcara, peranti: kini.hariAcara }
    ];
  }

  /* ---------- Menulis semula data ---------- */

  function laporSemua() {
    ['murid', 'kehadiran', 'rekod', 'nota', 'acara', 'pasukan', 'tetapan']
      .forEach(function (p) { CT.store.lapor(p); });
  }

  /* Ganti: data peranti diganti dengan data fail.
     Kunci yang tiada dalam fail dibiarkan seperti sedia ada — kecuali semasa
     mengundurkan pemulihan, di mana kunci yang memang tidak wujud dahulu
     mesti dibuang semula (buangYangTiada). */
  function tulisGanti(data, buangYangTiada) {
    KUNCI_DATA.forEach(function (k) {
      var nilai = data[k];
      if (nilai === null || nilai === undefined) {
        if (buangYangTiada) { CT.store.buang(k); }
        return;
      }
      if (k === 'tetapan') {
        // logoDikunci ialah keadaan peranti ini, bukan data guru.
        var sedia = CT.store.tetapan();
        nilai = Object.assign({}, nilai);
        if (sedia.logoDikunci) { nilai.logoDikunci = true; }
      }
      CT.store.tulis(k, nilai);
    });
    return null;
  }

  /* ---------- Gabung: tambah sahaja, tidak pernah menimpa ---------- */

  function kunciMatrik(m) {
    return String((m && m.matrik) || '').trim().toLowerCase();
  }
  function kunciNama(m) {
    return String((m && m.nama) || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /* Dua peranti yang mendaftarkan murid yang sama menghasilkan dua id berbeza.
     Tanpa pemetaan ini, kehadiran daripada fail akan tergantung pada id yang
     tiada muridnya — data hantu yang tidak pernah kelihatan di mana-mana. */
  function petakanMurid(senaraiFail, senaraiPeranti) {
    var peta = {};
    var ikutId = {}, ikutMatrik = {}, ikutNama = {};
    (senaraiPeranti || []).forEach(function (m) {
      ikutId[m.id] = m;
      var k = kunciMatrik(m);
      if (k) { ikutMatrik[k] = m; }
      var n = kunciNama(m);
      if (n) { ikutNama[n] = m; }
    });

    var baharu = [];
    (senaraiFail || []).forEach(function (m) {
      if (!m || !m.id) { return; }
      if (ikutId[m.id]) { peta[m.id] = m.id; return; }
      var k = kunciMatrik(m);
      var sama = (k && ikutMatrik[k]) || ikutNama[kunciNama(m)] || null;
      if (sama) { peta[m.id] = sama.id; return; }
      peta[m.id] = m.id;
      baharu.push(m);
    });
    return { peta: peta, baharu: baharu };
  }

  function gabungPetaMurid(kunci, dariFail, petaId, kira) {
    var sedia = CT.store.baca(kunci, {}) || {};
    var hasil = {};
    Object.keys(sedia).forEach(function (t) { hasil[t] = Object.assign({}, sedia[t]); });

    Object.keys(dariFail || {}).forEach(function (tarikh) {
      var isiFail = dariFail[tarikh] || {};
      if (!hasil[tarikh]) { hasil[tarikh] = {}; }
      var hariBaharu = !sedia[tarikh];
      var ditambah = 0;
      Object.keys(isiFail).forEach(function (idFail) {
        var id = petaId[idFail] || idFail;
        if (hasil[tarikh][id] === undefined) {
          hasil[tarikh][id] = isiFail[idFail];
          ditambah++;
        }
      });
      if (!Object.keys(hasil[tarikh]).length) { delete hasil[tarikh]; return; }
      if (ditambah && hariBaharu) { kira.hari++; }
      kira.entri += ditambah;
    });

    CT.store.tulis(kunci, hasil);
  }

  function gabungAcara(dariFail, kira) {
    var sedia = CT.store.baca('acara', {}) || {};
    var hasil = {};
    Object.keys(sedia).forEach(function (t) { hasil[t] = (sedia[t] || []).slice(); });

    Object.keys(dariFail || {}).forEach(function (tarikh) {
      var senarai = dariFail[tarikh] || [];
      if (!hasil[tarikh]) { hasil[tarikh] = []; }
      var adaId = {};
      hasil[tarikh].forEach(function (a) { adaId[a.id] = true; });
      senarai.forEach(function (a) {
        if (!a || adaId[a.id]) { return; }
        hasil[tarikh].push(a);
        adaId[a.id] = true;
        kira.acara++;
      });
      if (!hasil[tarikh].length) { delete hasil[tarikh]; }
    });

    CT.store.tulis('acara', hasil);
  }

  function gabungSenarai(kunci, dariFail, petaId, kira, medanKira) {
    var sedia = CT.store.baca(kunci, []) || [];
    var adaId = {};
    sedia.forEach(function (x) { adaId[x.id] = true; });
    var hasil = sedia.slice();

    (dariFail || []).forEach(function (x) {
      if (!x || !x.id || adaId[x.id]) { return; }
      var salinan = Object.assign({}, x);
      if (salinan.muridId && petaId[salinan.muridId]) {
        salinan.muridId = petaId[salinan.muridId];
      }
      hasil.push(salinan);
      adaId[x.id] = true;
      kira[medanKira]++;
    });

    CT.store.tulis(kunci, hasil);
  }

  function tulisGabung(data) {
    var kira = { murid: 0, hari: 0, entri: 0, nota: 0, acara: 0, ahli: 0 };

    var padan = petakanMurid(data.murid || [], CT.store.baca('murid', []) || []);
    if (padan.baharu.length) {
      CT.store.tulis('murid', (CT.store.baca('murid', []) || []).concat(padan.baharu));
      kira.murid = padan.baharu.length;
    }

    gabungPetaMurid('kehadiran', data.kehadiran, padan.peta, kira);
    gabungPetaMurid('hadirButiran', data.hadirButiran, padan.peta, kira);
    gabungPetaMurid('rekod', data.rekod, padan.peta, kira);
    gabungAcara(data.acara, kira);
    gabungSenarai('nota', data.nota, padan.peta, kira, 'nota');
    gabungSenarai('pasukan', data.pasukan, padan.peta, kira, 'ahli');

    // Tetapan peranti ini menang; hanya tetapan yang belum wujud diisi.
    if (data.tetapan && typeof data.tetapan === 'object') {
      var sedia = CT.store.tetapan();
      var tambah = {};
      Object.keys(data.tetapan).forEach(function (k) {
        if (sedia[k] === undefined) { tambah[k] = data.tetapan[k]; }
      });
      if (Object.keys(tambah).length) { CT.store.simpanTetapan(tambah); }
    }

    return kira;
  }

  /* ---------- Titik undur ---------- */

  function simpanUndur(petikan) {
    return CT.store.tulis(KUNCI_UNDUR, {
      dicipta: new Date().toISOString(),
      data: petikan.data
    });
  }

  function titikUndur() {
    var s = CT.store.baca(KUNCI_UNDUR, null);
    return s && s.data ? s : null;
  }

  function undur() {
    var s = titikUndur();
    if (!s) { return { berjaya: false, sebab: 'Tiada titik undur tersimpan.' }; }
    tulisGanti(s.data, true);
    CT.store.buang(KUNCI_UNDUR);
    laporSemua();
    return { berjaya: true };
  }

  function buangUndur() { CT.store.buang(KUNCI_UNDUR); }

  /* ---------- Pemulihan ---------- */

  function pulih(objek, mod) {
    var semak = periksa(objek);
    if (!semak.sah) { return { berjaya: false, sebab: semak.sebab }; }

    // Titik undur disimpan DAHULU, sebelum sebarang data disentuh.
    var adaUndur = simpanUndur(bina());

    var ringkasan;
    try {
      if (mod === 'gabung') { ringkasan = tulisGabung(objek.data); }
      else { tulisGanti(objek.data, false); }
    } catch (e) {
      console.error('Pemulihan gagal', e);
      return { berjaya: false, sebab: 'Pemulihan gagal: ' + e.message };
    }

    laporSemua();
    return { berjaya: true, mod: mod || 'ganti', ringkasan: ringkasan, adaUndur: adaUndur };
  }

  /* ---------- Status dan peringatan ---------- */

  function catat(kaedah) {
    CT.store.simpanTetapan({
      sandaranTerakhir: new Date().toISOString(),
      sandaranKaedah: kaedah || ''
    });
  }

  function status() {
    var t = CT.store.tetapan();
    var iso = t.sandaranTerakhir || '';
    var tempoh = t.sandaranTempoh === undefined ? TEMPOH_LALAI : +t.sandaranTempoh;
    var hasil = { pernah: false, iso: '', hari: null, tempoh: tempoh, perlu: false, teks: '' };

    var adaData = (CT.store.baca('murid', []) || []).length > 0;

    if (!iso) {
      hasil.teks = 'Belum pernah disandarkan';
      hasil.perlu = tempoh > 0 && adaData;
      return hasil;
    }

    var d = new Date(iso);
    if (isNaN(d.getTime())) { hasil.teks = 'Belum pernah disandarkan'; return hasil; }

    hasil.pernah = true;
    hasil.iso = iso;
    hasil.hari = CT.sukatan.bezaHari(u.kunciDari(d), u.hariIni());
    hasil.perlu = tempoh > 0 && adaData && hasil.hari >= tempoh;
    hasil.teks = hasil.hari <= 0 ? 'Disandarkan hari ini'
      : hasil.hari === 1 ? 'Disandarkan semalam'
        : 'Disandarkan ' + hasil.hari + ' hari lalu';
    return hasil;
  }

  /* ---------- Muat turun, kongsi, salin ---------- */

  function muatTurun(nama, kandungan, jenisMime) {
    var blob = new Blob([kandungan], { type: jenisMime || 'application/json' });
    var url = URL.createObjectURL(blob);
    var pautan = document.createElement('a');
    pautan.href = url;
    pautan.download = nama;
    pautan.style.display = 'none';
    document.body.appendChild(pautan);
    pautan.click();
    setTimeout(function () {
      pautan.remove();
      URL.revokeObjectURL(url);
    }, 4000);
  }

  /* Kongsi fail hanya wujud pada sebahagian pelayar telefon. Diuji dengan fail
     contoh supaya butang tidak dipaparkan pada peranti yang akan gagal. */
  function bolehKongsi() {
    try {
      if (!navigator.share || !navigator.canShare || typeof File !== 'function') { return false; }
      return navigator.canShare({
        files: [new File(['{}'], 'ujian.json', { type: 'application/json' })]
      });
    } catch (e) { return false; }
  }

  function kongsi() {
    return new Promise(function (terima, tolak) {
      if (!bolehKongsi()) { tolak(new Error('Peranti ini tidak menyokong perkongsian fail.')); return; }
      var fail = new File([teks()], namaFail(), { type: 'application/json' });
      navigator.share({
        files: [fail],
        title: 'Sandaran e-Dawam',
        text: 'Sandaran data e-Dawam ' + u.tarikhRingkas(u.hariIni())
      }).then(terima, tolak);
    });
  }

  function salin(kandungan) {
    return new Promise(function (terima, tolak) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(kandungan).then(terima, cubaCaraLama);
      } else { cubaCaraLama(); }

      function cubaCaraLama() {
        try {
          var kotak = document.createElement('textarea');
          kotak.value = kandungan;
          kotak.setAttribute('readonly', 'readonly');
          kotak.style.position = 'fixed';
          kotak.style.opacity = '0';
          document.body.appendChild(kotak);
          kotak.select();
          var ok = document.execCommand('copy');
          kotak.remove();
          if (ok) { terima(); } else { tolak(new Error('Salinan tidak dibenarkan.')); }
        } catch (e) { tolak(e); }
      }
    });
  }

  function bacaFail(fail) {
    return new Promise(function (terima, tolak) {
      var pembaca = new FileReader();
      pembaca.onload = function () { terima(String(pembaca.result || '')); };
      pembaca.onerror = function () { tolak(new Error('Fail tidak dapat dibaca.')); };
      pembaca.readAsText(fail);
    });
  }

  /* ---------- Eksport CSV untuk Excel ---------- */

  function petikCsv(nilai) {
    var s = String(nilai === null || nilai === undefined ? '' : nilai);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  /* BOM di hadapan supaya Excel membaca huruf Melayu dengan betul. */
  function csv(baris) {
    return '\uFEFF' + baris.map(function (b) {
      return b.map(petikCsv).join(',');
    }).join('\r\n') + '\r\n';
  }

  function namaProgram(m) {
    return CT.sukatan.program(CT.jadual.programMurid(m)).nama;
  }

  function csvMurid() {
    var baris = [['Nama', 'No. Matrik', 'No. Telefon', 'Program', 'Kumpulan',
      'Halaqah', 'Semester', 'Tahap', 'Hari kelas']];
    CT.store.senaraiMurid().forEach(function (m) {
      baris.push([
        m.nama || '', m.matrik || '', m.telefon || '', namaProgram(m),
        m.kumpulan === 'banat' ? 'Banat' : 'Banin', m.halaqah || '',
        m.semester || '', CT.sukatan.namaTahap(CT.jadual.programMurid(m), m.hifz || ''),
        CT.jadual.teksHari(m)
      ]);
    });
    return csv(baris);
  }

  function csvKehadiran() {
    var baris = [['Tarikh', 'Hari', 'Nama', 'No. Matrik', 'Program', 'Status',
      'Ketidakhadiran', 'Sebab']];
    var murid = CT.store.senaraiMurid();
    CT.store.tarikhAdaKehadiran().sort().forEach(function (t) {
      var peta = CT.store.kehadiranTarikh(t);
      murid.forEach(function (m) {
        var nilai = peta[m.id];
        if (nilai !== 'hadir' && nilai !== 'tidak') { return; }
        var b = (nilai === 'tidak' && CT.store.butiranMurid(t, m.id)) || {};
        baris.push([
          u.tarikhRingkas(t),
          CT.jadual.namaHari(u.hariMinggu(t)),
          m.nama || '', m.matrik || '', namaProgram(m),
          nilai === 'hadir' ? 'Hadir' : 'Tidak hadir',
          b.maklum === 'dimaklum' ? 'Dimaklum'
            : b.maklum === 'tidak-dimaklum' ? 'Tidak dimaklum' : '',
          b.nota || ''
        ]);
      });
    });
    return csv(baris);
  }

  function csvRekod() {
    var baris = [['Tarikh', 'Nama', 'No. Matrik', 'Juz', 'Muka mula',
      'Muka habis', 'Bilangan muka']];
    var murid = CT.store.senaraiMurid();
    Object.keys(CT.store.baca('rekod', {}) || {}).sort().forEach(function (t) {
      var peta = CT.store.rekodTarikh(t);
      murid.forEach(function (m) {
        var r = peta[m.id];
        if (!r || (!r.mukaMula && !r.mukaHabis)) { return; }
        var a = +r.mukaMula || +r.mukaHabis || 0;
        var b = +r.mukaHabis || +r.mukaMula || 0;
        if (a > b) { var s = a; a = b; b = s; }
        baris.push([
          u.tarikhRingkas(t), m.nama || '', m.matrik || '', r.juz || '',
          r.mukaMula || '', r.mukaHabis || '', (b - a + 1)
        ]);
      });
    });
    return csv(baris);
  }

  function csvRingkasan() {
    var j = CT.ringkasan.julat();
    var baris = [
      ['Ringkasan kehadiran semester'],
      ['Dari', u.tarikhRingkas(j.mula), 'Hingga', u.tarikhRingkas(j.akhir)],
      [],
      ['Nama', 'No. Matrik', 'Program', 'Hari kelas', 'Hari kelas direkod',
        'Hadir', 'Tidak hadir', 'Dimaklum', 'Tidak dimaklum', 'Belum ditanda',
        'Peratus hadir']
    ];
    CT.ringkasan.semuaMurid().forEach(function (r) {
      baris.push([
        r.murid.nama || '', r.murid.matrik || '', namaProgram(r.murid),
        CT.jadual.teksHari(r.murid), r.kelas, r.hadir, r.tidak, r.dimaklum,
        r.tidakDimaklum, r.belum, r.peratus + '%'
      ]);
    });
    return csv(baris);
  }

  CT.sandaran = {
    KUNCI_DATA: KUNCI_DATA,
    TEMPOH_LALAI: TEMPOH_LALAI,

    bina: bina,
    teks: teks,
    namaFail: namaFail,
    saizTeks: saizTeks,
    kiraan: kiraan,

    huraiTeks: huraiTeks,
    periksa: periksa,
    banding: banding,
    pulih: pulih,

    titikUndur: titikUndur,
    undur: undur,
    buangUndur: buangUndur,

    catat: catat,
    status: status,

    muatTurun: muatTurun,
    bolehKongsi: bolehKongsi,
    kongsi: kongsi,
    salin: salin,
    bacaFail: bacaFail,

    csvTeks: csv,
    csvMurid: csvMurid,
    csvKehadiran: csvKehadiran,
    csvRekod: csvRekod,
    csvRingkasan: csvRingkasan
  };
})();
