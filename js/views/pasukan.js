/* Tab Pasukan — kerjasama jabatan.
   Prototaip ini menyimpan senarai guru pada peranti sahaja. Struktur data
   ("id", "peranan", "akses") sudah disediakan supaya log masuk dan pangkalan
   data awan boleh ditambah kemudian tanpa mengubah antara muka. */

window.CT = window.CT || {};
CT.views = CT.views || {};

CT.views.pasukan = (function () {
  'use strict';

  var u = CT.util;
  var AKSES = ['Akses penuh', 'Boleh sunting', 'Boleh lihat'];

  function lencanaAkses(akses) {
    var kelas = akses === 'Akses penuh' ? 'lencana'
      : akses === 'Boleh sunting' ? 'lencana lencana-biru' : 'lencana lencana-kelabu';
    return '<span class="' + kelas + '">' + u.selamat(akses) + '</span>';
  }

  function borang(sedia) {
    var a = sedia || {};
    var kotak = document.createElement('div');
    kotak.innerHTML =
      '<div class="medan"><label for="p-nama">Nama guru</label>' +
      '<input id="p-nama" type="text" value="' + u.selamat(a.nama || '') +
      '" placeholder="Nama penuh guru"></div>' +
      '<div class="medan"><label for="p-peranan">Peranan</label>' +
      '<input id="p-peranan" type="text" value="' + u.selamat(a.peranan || '') +
      '" placeholder="Contoh: Guru Tahfiz"></div>' +
      '<div class="medan"><label for="p-emel">E-mel</label>' +
      '<input id="p-emel" type="email" value="' + u.selamat(a.emel || '') +
      '" placeholder="nama@uis.edu.my"></div>' +
      '<div class="medan"><label for="p-akses">Tahap akses</label><select id="p-akses">' +
      AKSES.map(function (k) {
        return '<option' + (a.akses === k ? ' selected' : '') + '>' + k + '</option>';
      }).join('') + '</select></div>' +
      '<button class="butang butang-penuh" type="button" data-simpan>' +
      (a.id ? 'Simpan perubahan' : 'Hantar jemputan') + '</button>' +
      (a.id ? '<button class="butang butang-bahaya butang-penuh jarak-atas" type="button" data-buang>Buang daripada pasukan</button>' : '');

    kotak.querySelector('[data-simpan]').addEventListener('click', function () {
      var nama = kotak.querySelector('#p-nama').value.trim();
      if (!nama) { CT.ui.toast('Sila isi nama guru.'); return; }
      CT.store.simpanAhli({
        id: a.id,
        dicipta: a.dicipta,
        nama: nama,
        peranan: kotak.querySelector('#p-peranan').value.trim() || 'Guru',
        emel: kotak.querySelector('#p-emel').value.trim(),
        akses: kotak.querySelector('#p-akses').value,
        status: a.status || (a.id ? 'aktif' : 'dijemput')
      });
      CT.ui.tutupLapisan();
      CT.ui.toast(a.id ? 'Maklumat guru dikemas kini.' : 'Jemputan direkodkan.');
      CT.app.segarSemula();
    });

    if (a.id) {
      kotak.querySelector('[data-buang]').addEventListener('click', function () {
        if (CT.store.senaraiPasukan().length <= 1) {
          CT.ui.toast('Sekurang-kurangnya seorang guru mesti kekal dalam pasukan.');
          return;
        }
        CT.ui.sahkan('Buang guru', 'Buang ' + a.nama + ' daripada pasukan jabatan?',
          function () {
            var tetapan = CT.store.tetapan();
            CT.store.padamAhli(a.id);
            if (tetapan.guruAktifId === a.id) {
              var baki = CT.store.senaraiPasukan();
              CT.store.simpanTetapan({ guruAktifId: baki.length ? baki[0].id : null });
            }
            CT.ui.toast('Guru dibuang daripada pasukan.');
            CT.app.segarSemula();
          }, 'Ya, buang');
      });
    }
    return kotak;
  }

  function render(skrin) {
    var senarai = CT.store.senaraiPasukan();
    var aktif = CT.store.guruAktif();

    /* Guru yang sedang menggunakan aplikasi (menggantikan log masuk buat sementara) */
    var kotakAktif = document.createElement('div');
    kotakAktif.className = 'kad';
    kotakAktif.innerHTML =
      '<p class="seksyen-tajuk">Guru aktif</p>' +
      '<div class="medan" style="margin-bottom:0"><select id="guru-aktif">' +
      senarai.map(function (g) {
        return '<option value="' + u.selamat(g.id) + '"' +
          (aktif && aktif.id === g.id ? ' selected' : '') + '>' +
          u.selamat(g.nama) + ' — ' + u.selamat(g.peranan || 'Guru') + '</option>';
      }).join('') + '</select></div>' +
      '<p class="kecil jarak-atas">Nota sulit yang ditulis oleh guru lain tidak dipaparkan ' +
      'kepada guru aktif. Bahagian ini akan digantikan dengan log masuk sebenar.</p>';

    kotakAktif.querySelector('#guru-aktif').addEventListener('change', function (e) {
      CT.store.simpanTetapan({ guruAktifId: e.target.value });
      CT.ui.toast('Guru aktif ditukar.');
      CT.app.segarSemula();
    });
    skrin.appendChild(kotakAktif);

    var jemput = document.createElement('button');
    jemput.type = 'button';
    jemput.className = 'butang butang-penuh jarak-atas';
    jemput.textContent = '+ Jemput Guru';
    jemput.addEventListener('click', function () {
      CT.ui.bukaLapisan('Jemput Guru', borang(null));
    });
    skrin.appendChild(jemput);

    var tajuk = document.createElement('p');
    tajuk.className = 'seksyen-tajuk jarak-atas';
    tajuk.textContent = senarai.length + ' guru dalam jabatan';
    skrin.appendChild(tajuk);

    var kotakSenarai = document.createElement('div');
    kotakSenarai.className = 'senarai';
    senarai.forEach(function (g) {
      var kad = document.createElement('div');
      kad.className = 'kad kad-rapat';
      kad.innerHTML =
        '<div class="baris">' +
        '<span class="tumbuh"><span class="murid-nama">' + u.selamat(g.nama) + '</span><br>' +
        '<span class="kecil">' + u.selamat(g.peranan || 'Guru') +
        (g.emel ? ' &middot; ' + u.selamat(g.emel) : '') + '</span></span>' +
        '</div>' +
        '<div class="baris-lipat jarak-atas">' + lencanaAkses(g.akses || 'Boleh lihat') +
        (g.status === 'dijemput' ? '<span class="lencana lencana-emas">Jemputan belum diterima</span>' : '') +
        '<button class="butang butang-luar butang-kecil" type="button" data-sunting>Sunting</button>' +
        '</div>';
      kad.querySelector('[data-sunting]').addEventListener('click', function () {
        CT.ui.bukaLapisan('Sunting Guru', borang(g));
      });
      kotakSenarai.appendChild(kad);
    });
    skrin.appendChild(kotakSenarai);

    var notis = document.createElement('div');
    notis.className = 'notis notis-info jarak-atas';
    notis.innerHTML = '<b>Prototaip:</b> senarai pasukan dan nota dikongsi disimpan pada ' +
      'peranti ini sahaja. Perkongsian sebenar antara guru memerlukan log masuk dan ' +
      'pangkalan data awan.';
    skrin.appendChild(notis);

    /* Nombor versi memudahkan pengesahan sama ada peranti sudah mendapat
       kemas kini terkini. */
    var versi = document.createElement('p');
    versi.className = 'kecil tengah jarak-atas';
    versi.textContent = 'e-Dawam versi ' + (CT.VERSI || '-');
    skrin.appendChild(versi);
  }

  return { tajuk: 'Pasukan', render: render };
})();
