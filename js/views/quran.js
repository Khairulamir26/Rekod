/* Tab Al-Quran — pembaca mushaf QuranFlash dibenamkan terus dalam tab.

   PENTING: aplikasi ini tidak mengandungi atau mengedar apa-apa kandungan
   mushaf. Halaman dimuatkan terus daripada pelayan QuranFlash, dengan jenama
   dan kawalan mereka sendiri kekal seperti asal. Mushaf Tajweed itu terbitan
   Dar Al-Ma'rifah, Syria.

   Tab ini memerlukan sambungan internet. Semua tab lain kekal berfungsi
   sepenuhnya di luar talian.

   Jika QuranFlash menyekat pembenaman (X-Frame-Options / frame-ancestors),
   bingkai akan kosong. Kerana penyekatan itu berlaku secara senyap dan tidak
   boleh dikesan daripada JavaScript merentas asal, tab ini sentiasa memaparkan
   butang "Buka dalam pelayar" sebagai jalan keluar. */

window.CT = window.CT || {};
CT.views = CT.views || {};

CT.views.quran = (function () {
  'use strict';

  /* Pembaca QuranFlash membawa navigasi juz dan muka suratnya sendiri, jadi
     tab ini tidak menambah kawalan sendiri di atasnya. */
  var ASAS = 'https://app.quranflash.com/book/Tajweed?en';

  function render(skrin) {
    var kawalan = document.createElement('div');
    kawalan.className = 'quran-kawalan';
    kawalan.innerHTML =
      '<button class="butang butang-luar butang-kecil" type="button" data-luar>' +
      'Buka dalam pelayar</button>';
    skrin.appendChild(kawalan);

    var bingkai = document.createElement('div');
    bingkai.className = 'quran-bingkai';
    skrin.appendChild(bingkai);

    var nota = document.createElement('p');
    nota.className = 'kecil jarak-atas';
    nota.textContent = 'Mushaf Tajweed (Dar Al-Ma\'rifah) daripada QuranFlash. ' +
      'Tab ini memerlukan internet.';
    skrin.appendChild(nota);

    var amaran = document.createElement('p');
    amaran.className = 'notis notis-cuti jarak-atas tersembunyi';
    amaran.innerHTML = 'Mushaf masih belum muncul. QuranFlash mungkin tidak ' +
      'membenarkan paparan dalam aplikasi lain. Tekan <b>Buka dalam pelayar</b> ' +
      'di atas untuk membacanya.';
    skrin.appendChild(amaran);

    var pemasa = null;

    function lukisBingkai() {
      if (pemasa) { clearTimeout(pemasa); pemasa = null; }
      bingkai.innerHTML = '';
      amaran.classList.add('tersembunyi');

      if (!navigator.onLine) {
        var luarTalian = CT.ui.kosong('Tiada sambungan internet',
          'Mushaf dimuatkan terus daripada QuranFlash, jadi tab ini memerlukan ' +
          'talian. Tab lain kekal berfungsi seperti biasa.');
        bingkai.appendChild(luarTalian);
        return;
      }

      var frem = document.createElement('iframe');
      frem.className = 'quran-frem';
      frem.title = 'Mushaf QuranFlash';
      frem.setAttribute('loading', 'lazy');
      frem.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      frem.setAttribute('allow', 'fullscreen');
      frem.src = ASAS;

      var sudahMuat = false;
      frem.addEventListener('load', function () { sudahMuat = true; });
      /* Penyekatan iframe tidak menimbulkan ralat yang boleh ditangkap, jadi
         amaran ditunjukkan apabila tiada isyarat muat langsung selepas 6 saat. */
      pemasa = setTimeout(function () {
        if (!sudahMuat) { amaran.classList.remove('tersembunyi'); }
      }, 6000);

      bingkai.appendChild(frem);
    }

    kawalan.querySelector('[data-luar]').addEventListener('click', function () {
      window.open(ASAS, '_blank', 'noopener');
    });

    lukisBingkai();
  }

  return { tajuk: 'Al-Quran', render: render };
})();
