/* Tab Nota — nota murid mengikut kategori.
   Nota sulit hanya kelihatan kepada guru yang menulisnya.
   Nota yang ditulis melalui tab Rekod turut muncul di sini pada tarikh
   dan murid yang betul. */

window.CT = window.CT || {};
CT.views = CT.views || {};

CT.views.nota = (function () {
  'use strict';

  var u = CT.util;
  var KATEGORI = ['umum', 'pencapaian', 'kebimbangan'];
  var LABEL = { umum: 'Umum', pencapaian: 'Pencapaian', kebimbangan: 'Kebimbangan' };
  var tapisan = 'semua';

  function namaMurid(id) {
    var m = CT.store.ambilMurid(id);
    return m ? m.nama : 'Murid dipadam';
  }

  function namaGuru(id) {
    var senarai = CT.store.senaraiPasukan();
    for (var i = 0; i < senarai.length; i++) {
      if (senarai[i].id === id) { return senarai[i].nama; }
    }
    return 'Guru';
  }

  function bolehLihat(nota, guru) {
    if (!nota.sulit) { return true; }
    return !!guru && nota.penulisId === guru.id;
  }

  function lencanaKategori(kategori) {
    var kelas = kategori === 'pencapaian' ? 'lencana'
      : kategori === 'kebimbangan' ? 'lencana lencana-merah' : 'lencana lencana-kelabu';
    return '<span class="' + kelas + '">' + u.selamat(LABEL[kategori] || 'Umum') + '</span>';
  }

  /* ---------- Borang nota ---------- */
  function borang(sedia) {
    var n = sedia || {};
    var murid = CT.store.senaraiMurid();
    var guru = CT.store.guruAktif();

    var kotak = document.createElement('div');
    if (!murid.length) {
      kotak.appendChild(CT.ui.kosong('Belum ada murid',
        'Tambah murid dalam tab Murid sebelum menulis nota.'));
      return kotak;
    }

    kotak.innerHTML =
      '<div class="medan"><label for="n-murid">Murid</label><select id="n-murid">' +
      murid.map(function (m) {
        return '<option value="' + u.selamat(m.id) + '"' +
          (n.muridId === m.id ? ' selected' : '') + '>' + u.selamat(m.nama) + '</option>';
      }).join('') + '</select></div>' +

      '<div class="medan-dua">' +
      '<div class="medan"><label for="n-kategori">Kategori</label><select id="n-kategori">' +
      KATEGORI.map(function (k) {
        return '<option value="' + k + '"' + (n.kategori === k ? ' selected' : '') + '>' +
          LABEL[k] + '</option>';
      }).join('') + '</select></div>' +
      '<div class="medan"><label for="n-tarikh">Tarikh</label>' +
      '<input id="n-tarikh" type="date" value="' + u.selamat(n.tarikh || u.hariIni()) + '"></div>' +
      '</div>' +

      '<div class="medan"><label for="n-teks">Nota</label>' +
      '<textarea id="n-teks" placeholder="Tulis nota murid di sini">' +
      u.selamat(n.teks || '') + '</textarea></div>' +

      '<div class="semak"><input type="checkbox" id="n-sulit"' + (n.sulit ? ' checked' : '') + '>' +
      '<label for="n-sulit">Tandakan sebagai sulit (hanya penulis boleh lihat)</label></div>' +
      '<div class="semak"><input type="checkbox" id="n-kongsi"' + (n.kongsi ? ' checked' : '') + '>' +
      '<label for="n-kongsi">Kongsi dengan jabatan</label></div>' +

      '<button class="butang butang-penuh" type="button" data-simpan>Simpan nota</button>' +
      (n.id ? '<button class="butang butang-bahaya butang-penuh jarak-atas" type="button" data-padam>Padam nota</button>' : '');

    var sulit = kotak.querySelector('#n-sulit');
    var kongsi = kotak.querySelector('#n-kongsi');
    sulit.addEventListener('change', function () {
      if (sulit.checked) { kongsi.checked = false; }
      kongsi.disabled = sulit.checked;
    });
    kongsi.disabled = sulit.checked;

    kotak.querySelector('[data-simpan]').addEventListener('click', function () {
      var teks = kotak.querySelector('#n-teks').value.trim();
      if (!teks) { CT.ui.toast('Sila tulis kandungan nota.'); return; }

      CT.store.simpanNota({
        id: n.id,
        dicipta: n.dicipta,
        sumber: n.sumber || 'nota',
        muridId: kotak.querySelector('#n-murid').value,
        kategori: kotak.querySelector('#n-kategori').value,
        tarikh: kotak.querySelector('#n-tarikh').value || u.hariIni(),
        teks: teks,
        sulit: sulit.checked,
        kongsi: sulit.checked ? false : kongsi.checked,
        penulisId: n.penulisId || (guru ? guru.id : null),
        dikemaskini: new Date().toISOString()
      });
      CT.ui.tutupLapisan();
      CT.ui.toast(n.id ? 'Nota dikemas kini.' : 'Nota disimpan.');
      CT.app.segarSemula();
    });

    if (n.id) {
      kotak.querySelector('[data-padam]').addEventListener('click', function () {
        CT.ui.sahkan('Padam nota', 'Padam nota ini secara kekal?', function () {
          CT.store.padamNota(n.id);
          CT.ui.toast('Nota dipadam.');
          CT.app.segarSemula();
        }, 'Ya, padam');
      });
    }
    return kotak;
  }

  function kadNota(n, guru) {
    var kad = document.createElement('div');
    kad.className = 'nota-kad';
    kad.innerHTML =
      '<div class="baris-antara">' +
      '<span class="tumbuh"><span class="tebal">' + u.selamat(namaMurid(n.muridId)) + '</span><br>' +
      '<span class="kecil">' + u.selamat(u.tarikhRingkas(n.tarikh)) + ' &middot; ' +
      u.selamat(namaGuru(n.penulisId)) + '</span></span>' +
      lencanaKategori(n.kategori) +
      '</div>' +
      '<p class="nota-teks">' + u.selamat(n.teks) + '</p>' +
      '<div class="baris-lipat jarak-atas">' +
      (n.sulit ? '<span class="lencana lencana-merah">Sulit</span>' : '') +
      (n.kongsi ? '<span class="lencana lencana-biru">Dikongsi dengan jabatan</span>' : '') +
      (n.sumber === 'rekod' ? '<span class="lencana lencana-kelabu">Daripada Rekod</span>' : '') +
      '</div>' +
      '<button class="butang butang-luar butang-kecil jarak-atas" type="button" data-sunting>Sunting</button>';

    kad.querySelector('[data-sunting]').addEventListener('click', function () {
      if (n.penulisId && guru && n.penulisId !== guru.id && n.sulit) {
        CT.ui.toast('Nota sulit hanya boleh disunting oleh penulisnya.');
        return;
      }
      CT.ui.bukaLapisan('Sunting Nota', borang(n));
    });
    return kad;
  }

  function render(skrin) {
    var guru = CT.store.guruAktif();

    var tambah = document.createElement('button');
    tambah.type = 'button';
    tambah.className = 'butang butang-penuh';
    tambah.textContent = '+ Tambah Nota';
    tambah.addEventListener('click', function () {
      CT.ui.bukaLapisan('Tambah Nota', borang(null));
    });
    skrin.appendChild(tambah);

    var tapis = document.createElement('div');
    tapis.className = 'tapis jarak-atas';
    ['semua'].concat(KATEGORI).forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = k === 'semua' ? 'Semua' : LABEL[k];
      b.className = tapisan === k ? 'aktif' : '';
      b.addEventListener('click', function () {
        tapisan = k;
        CT.app.segarSemula();
      });
      tapis.appendChild(b);
    });
    skrin.appendChild(tapis);

    var semua = CT.store.senaraiNota().filter(function (n) { return bolehLihat(n, guru); });
    var ditapis = tapisan === 'semua'
      ? semua
      : semua.filter(function (n) { return (n.kategori || 'umum') === tapisan; });

    var tajuk = document.createElement('p');
    tajuk.className = 'seksyen-tajuk jarak-atas';
    tajuk.textContent = ditapis.length + ' nota' +
      (guru ? ' — dilihat sebagai ' + guru.nama : '');
    skrin.appendChild(tajuk);

    if (!ditapis.length) {
      skrin.appendChild(CT.ui.kosong('Tiada nota',
        'Nota yang anda tambah di sini atau melalui tab Rekod akan dipaparkan di sini.'));
      return;
    }

    var senarai = document.createElement('div');
    senarai.className = 'senarai';
    ditapis.forEach(function (n) { senarai.appendChild(kadNota(n, guru)); });
    skrin.appendChild(senarai);
  }

  return { tajuk: 'Nota', render: render };
})();
