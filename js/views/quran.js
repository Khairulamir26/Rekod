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

  var ASAS = 'https://app.quranflash.com/book/Tajweed?en';
  var juzSemasa = 1;

  /* Nombor dalam laluan #/reader/chapter/N ialah nombor muka surat mushaf.
     Muka surat pertama setiap juz diambil daripada jadual yang sama seperti
     tab Sukatan dan Rekod, jadi ketiga-tiganya tidak boleh terpesong. */
  function alamatJuz(nombor) {
    var halaman = CT.sukatan.JUZ_MULA[nombor] || 1;
    return ASAS + '#/reader/chapter/' + halaman;
  }

  function render(skrin) {
    /* Kawalan: pilih juz dan buka dalam pelayar. */
    var kawalan = document.createElement('div');
    kawalan.className = 'quran-kawalan';
    kawalan.innerHTML =
      '<div class="medan tumbuh" style="margin-bottom:0">' +
      '<select id="q-juz" aria-label="Pilih juz">' +
      CT.ui.pilihanNombor(1, 30, juzSemasa, 'Juz ') + '</select></div>' +
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

      /* Elemen bingkai dicipta semula setiap kali juz ditukar. Menukar hanya
         bahagian hash pada src sedia ada tidak memuatkan semula halaman
         merentas asal. */
      var frem = document.createElement('iframe');
      frem.className = 'quran-frem';
      frem.title = 'Mushaf QuranFlash';
      frem.setAttribute('loading', 'lazy');
      frem.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      frem.setAttribute('allow', 'fullscreen');
      frem.src = alamatJuz(juzSemasa);

      var sudahMuat = false;
      frem.addEventListener('load', function () { sudahMuat = true; });
      /* Penyekatan iframe tidak menimbulkan ralat yang boleh ditangkap, jadi
         amaran ditunjukkan apabila tiada isyarat muat langsung selepas 6 saat. */
      pemasa = setTimeout(function () {
        if (!sudahMuat) { amaran.classList.remove('tersembunyi'); }
      }, 6000);

      bingkai.appendChild(frem);
    }

    var pilihJuz = kawalan.querySelector('#q-juz');
    pilihJuz.addEventListener('change', function () {
      juzSemasa = +pilihJuz.value || 1;
      lukisBingkai();
    });

    kawalan.querySelector('[data-luar]').addEventListener('click', function () {
      window.open(alamatJuz(juzSemasa), '_blank', 'noopener');
    });

    lukisBingkai();
  }

  return { tajuk: 'Al-Quran', render: render };
})();
