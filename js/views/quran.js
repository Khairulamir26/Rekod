/* Tab Al-Quran — 30 juz.
   Aplikasi ini TIDAK disertakan dengan kandungan mushaf. Guru memasukkan sendiri
   fail PDF setiap juz; fail disimpan pada peranti (IndexedDB) dan boleh dibuka
   tanpa sambungan internet. */

window.CT = window.CT || {};
CT.views = CT.views || {};

CT.views.quran = (function () {
  'use strict';

  var u = CT.util;
  var adaFail = {};      // "juz-1" -> { nama, saiz }
  var dimuat = false;
  var urlPembaca = null;

  function kunciJuz(n) { return 'juz-' + n; }

  function saizMesra(bait) {
    if (!bait) { return ''; }
    if (bait < 1024) { return bait + ' bait'; }
    if (bait < 1024 * 1024) { return Math.max(1, Math.round(bait / 1024)) + ' KB'; }
    return (bait / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function muatStatus() {
    return CT.store.infoFail().then(function (semua) {
      adaFail = {};
      semua.forEach(function (f) { adaFail[f.kunci] = f; });
      dimuat = true;
    }).catch(function () { dimuat = true; });
  }

  /* ---------- Pembaca mushaf ---------- */
  function bukaMushaf(nombor) {
    CT.store.ambilFail(kunciJuz(nombor)).then(function (rekod) {
      if (!rekod || !rekod.blob) {
        CT.ui.toast('Juz ' + nombor + ' belum dimasukkan.');
        return;
      }
      if (urlPembaca) { URL.revokeObjectURL(urlPembaca); }
      urlPembaca = URL.createObjectURL(rekod.blob);

      var pembaca = document.createElement('div');
      pembaca.className = 'pembaca';
      pembaca.innerHTML =
        '<div class="pembaca-kepala">' +
        '<span class="tebal">Juz ' + nombor + '</span>' +
        '<span class="baris">' +
        '<button class="butang butang-luar butang-kecil" type="button" data-tetingkap>Tetingkap baharu</button>' +
        '<button class="butang-ikon" type="button" data-tutup aria-label="Tutup">&times;</button>' +
        '</span></div>' +
        '<iframe title="Mushaf Juz ' + nombor + '" src="' + urlPembaca + '"></iframe>';

      pembaca.querySelector('[data-tutup]').addEventListener('click', function () {
        pembaca.remove();
        if (urlPembaca) { URL.revokeObjectURL(urlPembaca); urlPembaca = null; }
      });
      pembaca.querySelector('[data-tetingkap]').addEventListener('click', function () {
        window.open(urlPembaca, '_blank');
      });
      document.body.appendChild(pembaca);
    });
  }

  function masukkanFail(nombor, fail) {
    if (!fail) { return; }
    if (fail.type && fail.type.indexOf('pdf') === -1) {
      CT.ui.toast('Sila pilih fail PDF.');
      return;
    }
    CT.store.simpanFail(kunciJuz(nombor), fail, { nama: fail.name }).then(function () {
      CT.ui.toast('Juz ' + nombor + ' disimpan untuk kegunaan luar talian.');
      return muatStatus();
    }).then(function () {
      CT.app.segarSemula();
    }).catch(function (e) {
      console.error(e);
      CT.ui.toast('Fail tidak dapat disimpan pada peranti.');
    });
  }

  function kadJuz(nombor) {
    var info = adaFail[kunciJuz(nombor)];
    var kad = document.createElement('div');
    kad.className = 'juz-kad';
    kad.innerHTML =
      '<div class="baris-antara">' +
      '<span class="juz-nombor">Juz ' + nombor + '</span>' +
      (info ? '<span class="lencana">Luar talian</span>'
        : '<span class="lencana lencana-kelabu">Belum ada</span>') +
      '</div>' +
      '<p class="kecil">' + (info
        ? u.selamat(info.nama || 'Fail PDF') + '<br>' + saizMesra(info.saiz)
        : 'PDF belum dimasukkan.') + '</p>' +
      '<button class="butang butang-kecil" type="button" data-buka' +
      (info ? '' : ' disabled') + '>Buka mushaf</button>' +
      '<label class="butang butang-luar butang-kecil" style="cursor:pointer">' +
      (info ? 'Ganti PDF' : 'Masukkan PDF') +
      '<input type="file" accept="application/pdf,.pdf" hidden></label>' +
      (info ? '<button class="butang butang-bahaya butang-kecil" type="button" data-padam>Padam fail</button>' : '');

    kad.querySelector('[data-buka]').addEventListener('click', function () {
      bukaMushaf(nombor);
    });
    kad.querySelector('input[type="file"]').addEventListener('change', function (e) {
      masukkanFail(nombor, e.target.files && e.target.files[0]);
    });
    if (info) {
      kad.querySelector('[data-padam]').addEventListener('click', function () {
        CT.ui.sahkan('Padam fail juz', 'Padam fail PDF Juz ' + nombor + ' daripada peranti ini?',
          function () {
            CT.store.padamFail(kunciJuz(nombor)).then(muatStatus).then(function () {
              CT.ui.toast('Fail Juz ' + nombor + ' dipadam.');
              CT.app.segarSemula();
            });
          }, 'Ya, padam');
      });
    }
    return kad;
  }

  function render(skrin) {
    var kepala = document.createElement('div');
    kepala.className = 'kad';
    kepala.innerHTML =
      '<p class="tebal">Mushaf Dar Al-Ma\'rifah, Syria</p>' +
      '<p class="arab">&#1583;&#1575;&#1585; &#1575;&#1604;&#1605;&#1593;&#1585;&#1601;&#1577;</p>' +
      '<p class="kecil jarak-atas">Aplikasi ini tidak disertakan dengan kandungan mushaf. ' +
      'Guru perlu memasukkan sendiri fail PDF bagi setiap juz. Setelah dimasukkan, ' +
      'fail disimpan pada peranti dan boleh dibuka tanpa internet.</p>' +
      '<p class="kecil jarak-atas">Gunakan hanya salinan yang sah. Sumber rasmi mushaf digital: ' +
      '<a href="https://qurancomplex.gov.sa/" target="_blank" rel="noopener noreferrer">' +
      'Kompleks Percetakan Al-Quran Raja Fahd (qurancomplex.gov.sa)</a>.</p>';
    skrin.appendChild(kepala);

    var jumlah = Object.keys(adaFail).filter(function (k) {
      return k.indexOf('juz-') === 0;
    }).length;

    var ringkas = document.createElement('p');
    ringkas.className = 'seksyen-tajuk jarak-atas';
    ringkas.textContent = dimuat
      ? jumlah + ' daripada 30 juz tersedia di luar talian'
      : 'Memuatkan status fail...';
    skrin.appendChild(ringkas);

    var grid = document.createElement('div');
    grid.className = 'quran-grid';
    for (var i = 1; i <= 30; i++) { grid.appendChild(kadJuz(i)); }
    skrin.appendChild(grid);

    if (!dimuat) {
      muatStatus().then(function () { CT.app.segarSemula(); });
    }
  }

  function segarStatus() { return muatStatus(); }

  return { tajuk: 'Al-Quran', render: render, segarStatus: segarStatus };
})();
