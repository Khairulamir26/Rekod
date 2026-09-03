/* e-Dawam — service worker.
   PENTING: naikkan VERSI setiap kali fail aplikasi diubah supaya cache lama
   digantikan. Data guru (localStorage / IndexedDB) tidak pernah disentuh di sini. */

var VERSI = 'edawam-v1.7.1';

var FAIL_TERAS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/util.js',
  './js/store.js',
  './js/cuti.js',
  './js/sukatan.js',
  './js/jadual.js',
  './js/ui.js',
  './js/app.js',
  './js/views/utama.js',
  './js/views/murid.js',
  './js/views/kehadiran.js',
  './js/views/kalendar.js',
  './js/views/rekod.js',
  './js/views/sukatan.js',
  './js/views/quran.js',
  './js/views/nota.js',
  './js/views/pasukan.js',
  './assets/logo-dawam.png',
  './assets/ikon-192.png',
  './assets/ikon-512.png',
  './assets/ikon-maskable.png'
];

self.addEventListener('install', function (peristiwa) {
  peristiwa.waitUntil(
    caches.open(VERSI).then(function (cache) {
      // Fail pilihan (contoh: logo rasmi) tidak boleh menggagalkan pemasangan.
      return Promise.all(FAIL_TERAS.map(function (fail) {
        return cache.add(fail).catch(function (e) {
          console.warn('Tidak dapat cache', fail, e.message);
        });
      })).then(function () {
        return cache.add('./assets/logo-uis.png').catch(function () { });
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (peristiwa) {
  peristiwa.waitUntil(
    caches.keys().then(function (kunci) {
      return Promise.all(kunci.map(function (k) {
        if (k !== VERSI) { return caches.delete(k); }
        return null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (peristiwa) {
  var permintaan = peristiwa.request;
  if (permintaan.method !== 'GET') { return; }

  var url = new URL(permintaan.url);

  // Permintaan luar (contoh: API cuti umum) diserahkan kepada rangkaian.
  // Aplikasi sendiri akan beralih kepada data luar talian jika gagal.
  if (url.origin !== self.location.origin) { return; }

  // Halaman: cuba rangkaian dahulu supaya kemas kini kod cepat diterima.
  if (permintaan.mode === 'navigate') {
    peristiwa.respondWith(
      fetch(permintaan).then(function (jawapan) {
        var salinan = jawapan.clone();
        caches.open(VERSI).then(function (c) { c.put('./index.html', salinan); });
        return jawapan;
      }).catch(function () {
        return caches.match('./index.html').then(function (j) {
          return j || caches.match('./');
        });
      })
    );
    return;
  }

  /* Kod aplikasi (JS, CSS, manifest): rangkaian dahulu.
     Ini memastikan guru terus mendapat versi terbaharu sebaik ada internet,
     tanpa perlu muat semula dua kali. Jika tiada internet, salinan cache
     digunakan seperti biasa. */
  if (/\.(?:js|css|webmanifest)$/i.test(url.pathname)) {
    peristiwa.respondWith(
      fetch(permintaan).then(function (jawapan) {
        if (jawapan && jawapan.status === 200 && jawapan.type === 'basic') {
          var salinan = jawapan.clone();
          caches.open(VERSI).then(function (c) { c.put(permintaan, salinan); });
        }
        return jawapan;
      }).catch(function () {
        return caches.match(permintaan);
      })
    );
    return;
  }

  // Aset lain (ikon, logo, gambar): cache dahulu, kemas kini di latar belakang.
  peristiwa.respondWith(
    caches.match(permintaan).then(function (dicache) {
      var rangkaian = fetch(permintaan).then(function (jawapan) {
        if (jawapan && jawapan.status === 200 && jawapan.type === 'basic') {
          var salinan = jawapan.clone();
          caches.open(VERSI).then(function (c) { c.put(permintaan, salinan); });
        }
        return jawapan;
      }).catch(function () { return dicache; });
      return dicache || rangkaian;
    })
  );
});
