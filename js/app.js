/* ClassTrack — pemula aplikasi, navigasi tab dan pendaftaran service worker. */

window.CT = window.CT || {};

(function () {
  'use strict';

  var u = CT.util;
  var TAB = ['utama', 'murid', 'kehadiran', 'kalendar', 'rekod', 'quran', 'nota', 'pasukan'];
  var tabSemasa = 'utama';
  var paramSemasa = null;

  var skrin, tajukHalaman;

  /* ---------- Persediaan kali pertama ---------- */
  function siapkanData() {
    if (!CT.store.senaraiPasukan().length) {
      var guru = CT.store.simpanAhli({
        nama: 'Guru Utama',
        peranan: 'Guru Tahfiz',
        emel: '',
        akses: 'Akses penuh',
        status: 'aktif'
      });
      CT.store.simpanTetapan({ guruAktifId: guru.id });
    }
    if (!CT.store.tetapan().guruAktifId) {
      var senarai = CT.store.senaraiPasukan();
      if (senarai.length) { CT.store.simpanTetapan({ guruAktifId: senarai[0].id }); }
    }
  }

  /* ---------- Navigasi ---------- */
  function lukis(kekalkanTatal) {
    var tatal = window.scrollY;
    var papar = CT.views[tabSemasa] || CT.views.utama;

    skrin.innerHTML = '';
    tajukHalaman.textContent = papar.tajuk;
    document.querySelectorAll('.nav-butang').forEach(function (b) {
      b.classList.toggle('aktif', b.getAttribute('data-tab') === tabSemasa);
    });

    try {
      papar.render(skrin, paramSemasa);
    } catch (ralat) {
      console.error('Ralat memaparkan tab', tabSemasa, ralat);
      skrin.appendChild(CT.ui.kosong('Ralat paparan',
        'Tab ini tidak dapat dipaparkan. Sila cuba lagi.'));
    }
    paramSemasa = null;

    if (kekalkanTatal) { window.scrollTo(0, tatal); }
    else { window.scrollTo(0, 0); }
  }

  var abaiHash = false;

  function pergi(tab, param) {
    if (TAB.indexOf(tab) === -1) { tab = 'utama'; }
    tabSemasa = tab;
    paramSemasa = param || null;
    var hashBaru = '#/' + tab;
    if (location.hash !== hashBaru) {
      abaiHash = true;             // elak lukisan berganda daripada hashchange
      location.hash = hashBaru;
    }
    lukis(false);
  }

  function segarSemula() { lukis(true); }

  function daripadaHash() {
    var tab = String(location.hash || '').replace('#/', '');
    return TAB.indexOf(tab) !== -1 ? tab : 'utama';
  }

  /* ---------- Penunjuk rangkaian ---------- */
  function segarRangkaian() {
    var penunjuk = document.getElementById('penunjuk-rangkaian');
    if (!penunjuk) { return; }
    if (navigator.onLine) {
      penunjuk.textContent = 'Dalam talian';
    } else {
      penunjuk.textContent = 'Luar talian';
    }
  }

  /* ---------- Service worker ---------- */
  function daftarServiceWorker() {
    if (window.CT_SATU_FAIL) { return; }   // versi pratonton satu fail
    if (!('serviceWorker' in navigator)) { return; }
    if (location.protocol === 'file:') {
      console.info('Service worker memerlukan http/https. Buka melalui pelayan tempatan.');
      return;
    }
    navigator.serviceWorker.register('sw.js').catch(function (e) {
      console.warn('Service worker tidak didaftarkan:', e.message);
    });
  }

  function mula() {
    skrin = document.getElementById('skrin');
    tajukHalaman = document.getElementById('tajuk-halaman');

    siapkanData();

    document.querySelectorAll('.nav-butang').forEach(function (b) {
      b.addEventListener('click', function () { pergi(b.getAttribute('data-tab')); });
    });

    document.getElementById('lapisan-tutup').addEventListener('click', CT.ui.tutupLapisan);
    document.getElementById('lapisan').addEventListener('click', function (e) {
      if (e.target.id === 'lapisan') { CT.ui.tutupLapisan(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { CT.ui.tutupLapisan(); }
    });

    window.addEventListener('hashchange', function () {
      if (abaiHash) { abaiHash = false; return; }
      tabSemasa = daripadaHash();
      lukis(false);
    });
    window.addEventListener('online', segarRangkaian);
    window.addEventListener('offline', segarRangkaian);

    tabSemasa = daripadaHash();
    segarRangkaian();
    lukis(false);
    daftarServiceWorker();

    // Segerak cuti secara senyap bagi tahun semasa.
    CT.cuti.segerak(u.pecah(u.hariIni()).tahun, false);
  }

  CT.app = { pergi: pergi, segarSemula: segarSemula, TAB: TAB };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mula);
  } else {
    mula();
  }
})();
