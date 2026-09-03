/* e-Dawam — penyimpanan data.
   Data teks : localStorage (murid, kehadiran, rekod, nota, acara, pasukan, tetapan).
   Fail besar: IndexedDB (PDF juz Al-Quran dan logo rasmi).
   Rekod kehadiran dan rekod murid menggunakan tarikh "YYYY-MM-DD" sebagai kunci. */

window.CT = window.CT || {};

(function () {
  'use strict';

  /* Awalan simpanan sengaja dikekalkan walaupun aplikasi dinamakan semula
     kepada e-Dawam. Menukarnya akan menyebabkan semua data guru yang sedia
     ada tidak lagi dijumpai. */
  var AWALAN = 'classtrack.v1.';
  var pendengar = {};

  /* ---------- Pub/sub ringkas supaya semua tab sentiasa terkini ---------- */
  function dengar(peristiwa, fungsi) {
    (pendengar[peristiwa] = pendengar[peristiwa] || []).push(fungsi);
  }
  function lapor(peristiwa, data) {
    (pendengar[peristiwa] || []).forEach(function (f) {
      try { f(data); } catch (e) { console.error(e); }
    });
    (pendengar['*'] || []).forEach(function (f) {
      try { f(peristiwa, data); } catch (e) { console.error(e); }
    });
  }

  /* ---------- localStorage ---------- */
  function baca(kunci, ganti) {
    try {
      var mentah = localStorage.getItem(AWALAN + kunci);
      if (mentah === null) { return ganti; }
      return JSON.parse(mentah);
    } catch (e) {
      console.warn('Gagal membaca', kunci, e);
      return ganti;
    }
  }

  function tulis(kunci, nilai) {
    try {
      localStorage.setItem(AWALAN + kunci, JSON.stringify(nilai));
      return true;
    } catch (e) {
      console.error('Gagal menyimpan', kunci, e);
      CT.ui && CT.ui.toast('Ruang simpanan penuh. Data tidak dapat disimpan.');
      return false;
    }
  }

  /* ---------- Murid ---------- */
  function senaraiMurid() {
    var senarai = baca('murid', []);
    return senarai.slice().sort(function (a, b) {
      return String(a.nama || '').localeCompare(String(b.nama || ''), 'ms');
    });
  }

  function ambilMurid(id) {
    var senarai = baca('murid', []);
    for (var i = 0; i < senarai.length; i++) {
      if (senarai[i].id === id) { return senarai[i]; }
    }
    return null;
  }

  function simpanMurid(murid) {
    var senarai = baca('murid', []);
    var jumpa = false;
    for (var i = 0; i < senarai.length; i++) {
      if (senarai[i].id === murid.id) { senarai[i] = murid; jumpa = true; break; }
    }
    if (!jumpa) {
      murid.id = murid.id || CT.util.id('murid');
      murid.dicipta = murid.dicipta || new Date().toISOString();
      senarai.push(murid);
    }
    tulis('murid', senarai);
    lapor('murid');
    return murid;
  }

  function padamMurid(id) {
    tulis('murid', baca('murid', []).filter(function (m) { return m.id !== id; }));

    // Buang juga rekod berkaitan supaya tiada data yatim.
    var kehadiran = baca('kehadiran', {});
    Object.keys(kehadiran).forEach(function (t) { delete kehadiran[t][id]; });
    tulis('kehadiran', kehadiran);

    var butiran = baca('hadirButiran', {});
    Object.keys(butiran).forEach(function (t) { delete butiran[t][id]; });
    tulis('hadirButiran', butiran);

    var rekod = baca('rekod', {});
    Object.keys(rekod).forEach(function (t) { delete rekod[t][id]; });
    tulis('rekod', rekod);

    tulis('nota', baca('nota', []).filter(function (n) { return n.muridId !== id; }));

    lapor('murid');
    lapor('kehadiran');
    lapor('rekod');
    lapor('nota');
  }

  /* ---------- Kehadiran (kunci: tarikh) ---------- */
  function kehadiranTarikh(tarikh) {
    var semua = baca('kehadiran', {});
    return semua[tarikh] || {};
  }

  function simpanKehadiran(tarikh, peta) {
    var semua = baca('kehadiran', {});
    semua[tarikh] = peta;               // hanya tarikh ini disentuh
    tulis('kehadiran', semua);
    lapor('kehadiran', tarikh);
  }

  function tarikhAdaKehadiran() {
    return Object.keys(baca('kehadiran', {}));
  }

  /* Butiran tambahan bagi murid yang tidak hadir: sama ada ketidakhadiran
     itu dimaklumkan, dan nota ringkas guru. Disimpan berasingan daripada
     status hadir/tidak supaya rekod lama kekal sah. */
  function butiranKehadiran(tarikh) {
    var semua = baca('hadirButiran', {});
    return semua[tarikh] || {};
  }

  function butiranMurid(tarikh, muridId) {
    return butiranKehadiran(tarikh)[muridId] || null;
  }

  function simpanButiranKehadiran(tarikh, peta) {
    var semua = baca('hadirButiran', {});
    if (peta && Object.keys(peta).length) { semua[tarikh] = peta; }
    else { delete semua[tarikh]; }
    tulis('hadirButiran', semua);
    lapor('kehadiran', tarikh);
  }

  function simpanButiranMurid(tarikh, muridId, butiran) {
    var peta = Object.assign({}, butiranKehadiran(tarikh));
    if (butiran) { peta[muridId] = butiran; }
    else { delete peta[muridId]; }
    simpanButiranKehadiran(tarikh, peta);
  }

  /* ---------- Rekod murid mengikut tarikh ---------- */
  function rekodTarikh(tarikh) {
    var semua = baca('rekod', {});
    return semua[tarikh] || {};
  }

  function rekodMurid(tarikh, muridId) {
    return rekodTarikh(tarikh)[muridId] || null;
  }

  function simpanRekodMurid(tarikh, muridId, data) {
    var semua = baca('rekod', {});
    if (!semua[tarikh]) { semua[tarikh] = {}; }
    semua[tarikh][muridId] = Object.assign({}, semua[tarikh][muridId], data, {
      dikemaskini: new Date().toISOString()
    });
    tulis('rekod', semua);
    lapor('rekod', tarikh);
  }

  function tarikhAdaRekod() {
    var set = {};
    Object.keys(baca('kehadiran', {})).forEach(function (t) { set[t] = true; });
    var rekod = baca('rekod', {});
    Object.keys(rekod).forEach(function (t) {
      if (Object.keys(rekod[t] || {}).length) { set[t] = true; }
    });
    return Object.keys(set);
  }

  /* ---------- Nota ---------- */
  function senaraiNota() {
    return baca('nota', []).slice().sort(function (a, b) {
      return String(b.tarikh || '').localeCompare(String(a.tarikh || '')) ||
        String(b.dicipta || '').localeCompare(String(a.dicipta || ''));
    });
  }

  function simpanNota(nota) {
    var senarai = baca('nota', []);
    var jumpa = false;
    for (var i = 0; i < senarai.length; i++) {
      if (senarai[i].id === nota.id) { senarai[i] = nota; jumpa = true; break; }
    }
    if (!jumpa) {
      nota.id = nota.id || CT.util.id('nota');
      nota.dicipta = nota.dicipta || new Date().toISOString();
      senarai.push(nota);
    }
    tulis('nota', senarai);
    lapor('nota');
    return nota;
  }

  /* Nota harian daripada tab Rekod: satu nota bagi setiap murid + tarikh. */
  function notaHarian(tarikh, muridId) {
    var senarai = baca('nota', []);
    for (var i = 0; i < senarai.length; i++) {
      if (senarai[i].sumber === 'rekod' && senarai[i].tarikh === tarikh &&
        senarai[i].muridId === muridId) { return senarai[i]; }
    }
    return null;
  }

  function simpanNotaHarian(tarikh, muridId, teks, kongsi, penulisId) {
    var sedia = notaHarian(tarikh, muridId);
    var bersih = String(teks || '').trim();

    if (!bersih) {
      if (sedia) { padamNota(sedia.id); }
      return null;
    }
    var nota = sedia || {
      id: CT.util.id('nota'),
      sumber: 'rekod',
      tarikh: tarikh,
      muridId: muridId,
      kategori: 'umum',
      sulit: false,
      dicipta: new Date().toISOString()
    };
    nota.teks = bersih;
    nota.kongsi = !!kongsi;
    nota.penulisId = nota.penulisId || penulisId;
    nota.dikemaskini = new Date().toISOString();
    return simpanNota(nota);
  }

  function padamNota(id) {
    tulis('nota', baca('nota', []).filter(function (n) { return n.id !== id; }));
    lapor('nota');
  }

  /* ---------- Acara kalendar ---------- */
  function acaraTarikh(tarikh) {
    var semua = baca('acara', {});
    return (semua[tarikh] || []).slice().sort(function (a, b) {
      return String(a.masa || '').localeCompare(String(b.masa || ''));
    });
  }

  function simpanAcara(tarikh, acara) {
    var semua = baca('acara', {});
    if (!semua[tarikh]) { semua[tarikh] = []; }
    acara.id = acara.id || CT.util.id('acara');
    var jumpa = false;
    for (var i = 0; i < semua[tarikh].length; i++) {
      if (semua[tarikh][i].id === acara.id) { semua[tarikh][i] = acara; jumpa = true; break; }
    }
    if (!jumpa) { semua[tarikh].push(acara); }
    tulis('acara', semua);
    lapor('acara', tarikh);
  }

  function padamAcara(tarikh, id) {
    var semua = baca('acara', {});
    semua[tarikh] = (semua[tarikh] || []).filter(function (a) { return a.id !== id; });
    if (!semua[tarikh].length) { delete semua[tarikh]; }
    tulis('acara', semua);
    lapor('acara', tarikh);
  }

  function tarikhAdaAcara() { return Object.keys(baca('acara', {})); }

  /* ---------- Pasukan / jabatan ---------- */
  function senaraiPasukan() { return baca('pasukan', []); }

  function simpanAhli(ahli) {
    var senarai = baca('pasukan', []);
    var jumpa = false;
    for (var i = 0; i < senarai.length; i++) {
      if (senarai[i].id === ahli.id) { senarai[i] = ahli; jumpa = true; break; }
    }
    if (!jumpa) {
      ahli.id = ahli.id || CT.util.id('guru');
      ahli.dicipta = ahli.dicipta || new Date().toISOString();
      senarai.push(ahli);
    }
    tulis('pasukan', senarai);
    lapor('pasukan');
    return ahli;
  }

  function padamAhli(id) {
    tulis('pasukan', baca('pasukan', []).filter(function (a) { return a.id !== id; }));
    lapor('pasukan');
  }

  function tetapan() {
    return baca('tetapan', {});
  }

  function simpanTetapan(ubah) {
    var t = Object.assign({}, tetapan(), ubah);
    tulis('tetapan', t);
    lapor('tetapan');
    return t;
  }

  function guruAktif() {
    var senarai = senaraiPasukan();
    var t = tetapan();
    for (var i = 0; i < senarai.length; i++) {
      if (senarai[i].id === t.guruAktifId) { return senarai[i]; }
    }
    return senarai[0] || null;
  }

  /* ---------- IndexedDB untuk fail ---------- */
  var DB_NAMA = 'classtrack-fail';
  var DB_KEDAI = 'fail';
  var dbJanji = null;

  function db() {
    if (dbJanji) { return dbJanji; }
    dbJanji = new Promise(function (terima, tolak) {
      if (!window.indexedDB) { tolak(new Error('IndexedDB tidak disokong')); return; }
      var permintaan = indexedDB.open(DB_NAMA, 1);
      permintaan.onupgradeneeded = function () {
        var pangkalan = permintaan.result;
        if (!pangkalan.objectStoreNames.contains(DB_KEDAI)) {
          pangkalan.createObjectStore(DB_KEDAI, { keyPath: 'kunci' });
        }
      };
      permintaan.onsuccess = function () { terima(permintaan.result); };
      permintaan.onerror = function () { tolak(permintaan.error); };
    });
    return dbJanji;
  }

  function urusNiaga(mod, kerja) {
    return db().then(function (pangkalan) {
      return new Promise(function (terima, tolak) {
        var tx = pangkalan.transaction(DB_KEDAI, mod);
        var kedai = tx.objectStore(DB_KEDAI);
        var hasil;
        try { hasil = kerja(kedai); } catch (e) { tolak(e); return; }
        tx.oncomplete = function () {
          terima(hasil && hasil.result !== undefined ? hasil.result : hasil);
        };
        tx.onerror = function () { tolak(tx.error); };
        tx.onabort = function () { tolak(tx.error); };
      });
    });
  }

  function simpanFail(kunci, blob, meta) {
    return urusNiaga('readwrite', function (kedai) {
      return kedai.put({
        kunci: kunci,
        blob: blob,
        nama: (meta && meta.nama) || '',
        saiz: blob.size,
        jenis: blob.type || 'application/pdf',
        disimpan: new Date().toISOString()
      });
    }).then(function () { lapor('fail', kunci); });
  }

  function ambilFail(kunci) {
    return urusNiaga('readonly', function (kedai) { return kedai.get(kunci); });
  }

  function padamFail(kunci) {
    return urusNiaga('readwrite', function (kedai) { return kedai.delete(kunci); })
      .then(function () { lapor('fail', kunci); });
  }

  function senaraiFail() {
    return urusNiaga('readonly', function (kedai) { return kedai.getAllKeys(); })
      .then(function (kunci) { return kunci || []; });
  }

  function infoFail() {
    return urusNiaga('readonly', function (kedai) { return kedai.getAll(); })
      .then(function (semua) {
        return (semua || []).map(function (f) {
          return { kunci: f.kunci, nama: f.nama, saiz: f.saiz, disimpan: f.disimpan };
        });
      });
  }

  CT.store = {
    dengar: dengar,
    lapor: lapor,
    baca: baca,
    tulis: tulis,

    senaraiMurid: senaraiMurid,
    ambilMurid: ambilMurid,
    simpanMurid: simpanMurid,
    padamMurid: padamMurid,

    kehadiranTarikh: kehadiranTarikh,
    simpanKehadiran: simpanKehadiran,
    tarikhAdaKehadiran: tarikhAdaKehadiran,
    butiranKehadiran: butiranKehadiran,
    butiranMurid: butiranMurid,
    simpanButiranKehadiran: simpanButiranKehadiran,
    simpanButiranMurid: simpanButiranMurid,

    rekodTarikh: rekodTarikh,
    rekodMurid: rekodMurid,
    simpanRekodMurid: simpanRekodMurid,
    tarikhAdaRekod: tarikhAdaRekod,

    senaraiNota: senaraiNota,
    simpanNota: simpanNota,
    padamNota: padamNota,
    notaHarian: notaHarian,
    simpanNotaHarian: simpanNotaHarian,

    acaraTarikh: acaraTarikh,
    simpanAcara: simpanAcara,
    padamAcara: padamAcara,
    tarikhAdaAcara: tarikhAdaAcara,

    senaraiPasukan: senaraiPasukan,
    simpanAhli: simpanAhli,
    padamAhli: padamAhli,
    guruAktif: guruAktif,

    tetapan: tetapan,
    simpanTetapan: simpanTetapan,

    simpanFail: simpanFail,
    ambilFail: ambilFail,
    padamFail: padamFail,
    senaraiFail: senaraiFail,
    infoFail: infoFail
  };
})();
