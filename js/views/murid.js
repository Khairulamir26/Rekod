/* Tab Murid — senarai murid, carian, tambah murid dan profil murid.
   Profil hanya mengandungi: nama penuh, nombor matrik, nombor telefon,
   semester (1-8) dan Hifz/I'adah (1-8). Juz dan muka surat direkodkan
   dalam tab Rekod, bukan di sini. */

window.CT = window.CT || {};
CT.views = CT.views || {};

CT.views.murid = (function () {
  'use strict';

  var u = CT.util;
  var carian = '';

  function tapis(senarai) {
    var cari = carian.trim().toLowerCase();
    if (!cari) { return senarai; }
    return senarai.filter(function (m) {
      return String(m.nama || '').toLowerCase().indexOf(cari) !== -1 ||
        String(m.matrik || '').toLowerCase().indexOf(cari) !== -1 ||
        String(m.telefon || '').toLowerCase().indexOf(cari) !== -1;
    });
  }

  function kadMurid(m) {
    var butang = document.createElement('button');
    butang.type = 'button';
    butang.className = 'murid-kad';
    butang.innerHTML =
      '<span class="avatar">' + u.selamat(u.huruf(m.nama)) + '</span>' +
      '<span class="tumbuh">' +
      '<span class="murid-nama">' + u.selamat(m.nama) + '</span><br>' +
      '<span class="kecil">' + u.selamat(m.matrik || 'Tiada nombor matrik') + '</span>' +
      '</span>' +
      '<span class="baris-lipat" style="flex:0 0 auto;justify-content:flex-end">' +
      '<span class="lencana">Sem ' + u.selamat(m.semester || '-') + '</span>' +
      '<span class="lencana lencana-biru">Hifz ' + u.selamat(m.hifz || '-') + '</span>' +
      '</span>';
    butang.addEventListener('click', function () { bukaProfil(m.id); });
    return butang;
  }

  /* ---------- Borang tambah / sunting ---------- */
  function borang(sedia) {
    var m = sedia || {};
    var kotak = document.createElement('div');
    kotak.innerHTML =
      '<div class="medan"><label for="m-nama">Nama penuh</label>' +
      '<input id="m-nama" type="text" value="' + u.selamat(m.nama || '') +
      '" placeholder="Nama penuh murid" autocomplete="off"></div>' +

      '<div class="medan"><label for="m-matrik">Nombor matrik</label>' +
      '<input id="m-matrik" type="text" value="' + u.selamat(m.matrik || '') +
      '" placeholder="Contoh: UIS2026001" autocomplete="off"></div>' +

      '<div class="medan"><label for="m-telefon">Nombor telefon</label>' +
      '<input id="m-telefon" type="tel" value="' + u.selamat(m.telefon || '') +
      '" placeholder="Contoh: 012-3456789" autocomplete="off"></div>' +

      '<div class="medan-dua">' +
      '<div class="medan"><label for="m-semester">Semester</label>' +
      '<select id="m-semester">' + CT.ui.pilihanNombor(1, 8, m.semester || 1) + '</select></div>' +
      '<div class="medan"><label for="m-hifz">Hifz / I\'adah</label>' +
      '<select id="m-hifz">' + CT.ui.pilihanNombor(1, 8, m.hifz || 1) + '</select></div>' +
      '</div>' +

      '<button class="butang butang-penuh" type="button" data-simpan>Simpan murid</button>';

    kotak.querySelector('[data-simpan]').addEventListener('click', function () {
      var nama = kotak.querySelector('#m-nama').value.trim();
      if (!nama) { CT.ui.toast('Sila isi nama penuh murid.'); return; }

      CT.store.simpanMurid({
        id: m.id,
        dicipta: m.dicipta,
        nama: nama,
        matrik: kotak.querySelector('#m-matrik').value.trim(),
        telefon: kotak.querySelector('#m-telefon').value.trim(),
        semester: +kotak.querySelector('#m-semester').value,
        hifz: +kotak.querySelector('#m-hifz').value
      });
      CT.ui.tutupLapisan();
      CT.ui.toast(m.id ? 'Profil murid dikemas kini.' : 'Murid baharu ditambah.');
      CT.app.segarSemula();
    });

    return kotak;
  }

  function bukaBorang(sedia) {
    CT.ui.bukaLapisan(sedia ? 'Sunting Profil Murid' : 'Tambah Murid', borang(sedia));
  }

  /* ---------- Profil ---------- */
  function bukaProfil(id) {
    var m = CT.store.ambilMurid(id);
    if (!m) { return; }

    var kotak = document.createElement('div');
    kotak.innerHTML =
      '<div class="kad">' +
      '<div class="baris"><span class="avatar">' + u.selamat(u.huruf(m.nama)) + '</span>' +
      '<span class="tumbuh"><span class="murid-nama">' + u.selamat(m.nama) + '</span></span></div>' +
      '<div class="rekod-medan">' +
      '<div><b>Nombor matrik</b>' + u.selamat(m.matrik || 'Tiada') + '</div>' +
      '<div><b>Nombor telefon</b>' + u.selamat(m.telefon || 'Tiada') + '</div>' +
      '<div><b>Semester</b>' + u.selamat(m.semester || '-') + '</div>' +
      '<div><b>Hifz / I\'adah</b>' + u.selamat(m.hifz || '-') + '</div>' +
      '</div></div>' +

      '<div class="baris-lipat jarak-atas">' +
      '<button class="butang tumbuh" type="button" data-sunting>Sunting profil</button>' +
      '<button class="butang butang-luar tumbuh" type="button" data-rekod>Lihat rekod hari ini</button>' +
      '</div>' +
      '<button class="butang butang-bahaya butang-penuh jarak-atas" type="button" data-padam>' +
      'Padam murid</button>';

    kotak.querySelector('[data-sunting]').addEventListener('click', function () {
      bukaBorang(m);
    });
    kotak.querySelector('[data-rekod]').addEventListener('click', function () {
      CT.ui.tutupLapisan();
      CT.app.pergi('rekod', { tarikh: u.hariIni() });
    });
    kotak.querySelector('[data-padam]').addEventListener('click', function () {
      CT.ui.sahkan('Padam murid',
        'Padam ' + m.nama + ' bersama semua kehadiran, rekod dan nota murid ini? ' +
        'Tindakan ini tidak boleh dibatalkan.',
        function () {
          CT.store.padamMurid(m.id);
          CT.ui.toast('Murid dipadam.');
          CT.app.segarSemula();
        }, 'Ya, padam');
    });

    CT.ui.bukaLapisan('Profil Murid', kotak);
  }

  /* ---------- Data contoh (pilihan guru) ---------- */
  function muatContoh() {
    var contoh = [
      { nama: 'Ahmad Danial bin Rosli', matrik: 'UIS2026001', telefon: '012-3456789', semester: 1, hifz: 1 },
      { nama: 'Nur Aisyah binti Kamal', matrik: 'UIS2026002', telefon: '013-2233445', semester: 2, hifz: 3 },
      { nama: 'Muhammad Haziq bin Zainal', matrik: 'UIS2026003', telefon: '011-98765432', semester: 3, hifz: 2 },
      { nama: 'Siti Khadijah binti Anuar', matrik: 'UIS2026004', telefon: '019-7766554', semester: 4, hifz: 5 },
      { nama: 'Amir Hamzah bin Ibrahim', matrik: 'UIS2026005', telefon: '017-4455667', semester: 5, hifz: 4 }
    ];
    contoh.forEach(function (m) { CT.store.simpanMurid(m); });
    CT.ui.toast('5 murid contoh ditambah.');
    CT.app.segarSemula();
  }

  function render(skrin) {
    var semua = CT.store.senaraiMurid();

    var kepala = document.createElement('div');
    kepala.className = 'seksyen';
    kepala.innerHTML =
      '<div class="medan" style="margin-bottom:10px">' +
      '<input type="search" id="cari-murid" placeholder="Cari nama, matrik atau telefon" ' +
      'value="' + u.selamat(carian) + '" aria-label="Cari murid"></div>' +
      '<button class="butang butang-penuh" type="button" data-tambah>+ Tambah Murid</button>';
    kepala.querySelector('[data-tambah]').addEventListener('click', function () { bukaBorang(null); });

    var medanCari = kepala.querySelector('#cari-murid');
    medanCari.addEventListener('input', function () {
      carian = medanCari.value;
      lukisSenarai();
    });
    skrin.appendChild(kepala);

    var seksyen = document.createElement('div');
    seksyen.className = 'seksyen';
    skrin.appendChild(seksyen);

    function lukisSenarai() {
      seksyen.innerHTML = '';
      if (!semua.length) {
        var butang = document.createElement('button');
        butang.type = 'button';
        butang.className = 'butang butang-luar butang-kecil jarak-atas';
        butang.textContent = 'Muat 5 murid contoh';
        butang.addEventListener('click', muatContoh);
        seksyen.appendChild(CT.ui.kosong('Belum ada murid',
          'Tekan "Tambah Murid" untuk memasukkan murid pertama anda.', butang));
        return;
      }

      var ditapis = tapis(semua);
      var kira = document.createElement('p');
      kira.className = 'seksyen-tajuk';
      kira.textContent = ditapis.length + ' daripada ' + semua.length + ' murid';
      seksyen.appendChild(kira);

      if (!ditapis.length) {
        seksyen.appendChild(CT.ui.kosong('Tiada padanan',
          'Tiada murid sepadan dengan carian "' + carian + '".'));
        return;
      }

      var senarai = document.createElement('div');
      senarai.className = 'senarai';
      ditapis.forEach(function (m) { senarai.appendChild(kadMurid(m)); });
      seksyen.appendChild(senarai);
    }

    lukisSenarai();
  }

  return { tajuk: 'Murid', render: render, bukaBorang: bukaBorang };
})();
