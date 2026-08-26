/* Tab Kehadiran — dua pilihan sahaja bagi setiap murid: Hadir atau Tidak hadir.
   Rekod disimpan mengikut tarikh dan terus dipaparkan dalam tab Kalendar dan Rekod. */

window.CT = window.CT || {};
CT.views = CT.views || {};

CT.views.kehadiran = (function () {
  'use strict';

  var u = CT.util;
  var tarikh = null;
  var draf = {};
  var belumSimpan = false;

  function muatDraf() {
    draf = Object.assign({}, CT.store.kehadiranTarikh(tarikh));
    belumSimpan = false;
  }

  function kiraan(murid) {
    var hadir = 0, tidak = 0;
    murid.forEach(function (m) {
      if (draf[m.id] === 'hadir') { hadir++; }
      else if (draf[m.id] === 'tidak') { tidak++; }
    });
    return { hadir: hadir, tidak: tidak, jumlah: murid.length, belum: murid.length - hadir - tidak };
  }

  function render(skrin, param) {
    if (param && param.tarikh && u.sahKunci(param.tarikh)) {
      tarikh = param.tarikh;
      muatDraf();
    } else if (!tarikh) {
      tarikh = u.hariIni();
      muatDraf();
    } else if (!belumSimpan) {
      muatDraf();
    }

    var murid = CT.store.senaraiMurid();

    /* Pemilih tarikh */
    skrin.appendChild(CT.ui.pemilihTarikh(tarikh, function (baru) {
      tarikh = baru;
      muatDraf();
      CT.app.segarSemula();
    }));

    /* Notis cuti umum */
    var cuti = CT.ui.notisCuti(tarikh);
    if (cuti) {
      cuti.classList.add('jarak-atas');
      skrin.appendChild(cuti);
    }

    if (!murid.length) {
      var kosong = CT.ui.kosong('Belum ada murid',
        'Tambah murid dalam tab Murid sebelum mengambil kehadiran.');
      kosong.classList.add('jarak-atas');
      skrin.appendChild(kosong);
      return;
    }

    /* Statistik */
    var statistik = document.createElement('div');
    statistik.className = 'statistik jarak-atas';
    skrin.appendChild(statistik);

    function lukisStatistik() {
      var k = kiraan(murid);
      statistik.innerHTML =
        '<div class="stat"><b style="color:var(--hijau)">' + k.hadir + '</b><span>Hadir</span></div>' +
        '<div class="stat"><b style="color:var(--merah)">' + k.tidak + '</b><span>Tidak hadir</span></div>' +
        '<div class="stat"><b>' + u.peratus(k.hadir, k.jumlah) + '%</b><span>Peratus kehadiran</span></div>';
    }

    /* Senarai murid */
    var senarai = document.createElement('div');
    senarai.className = 'senarai jarak-atas';
    skrin.appendChild(senarai);

    murid.forEach(function (m) {
      var baris = document.createElement('div');
      baris.className = 'hadir-baris';
      baris.innerHTML =
        '<span class="avatar">' + u.selamat(u.huruf(m.nama)) + '</span>' +
        '<span class="tumbuh"><span class="murid-nama">' + u.selamat(m.nama) + '</span><br>' +
        '<span class="kecil">' + u.selamat(m.matrik || 'Tiada matrik') + '</span></span>' +
        '<span class="segmen">' +
        '<button type="button" data-nilai="hadir">Hadir</button>' +
        '<button type="button" data-nilai="tidak">Tidak</button>' +
        '</span>';

      var butangHadir = baris.querySelector('[data-nilai="hadir"]');
      var butangTidak = baris.querySelector('[data-nilai="tidak"]');

      function segar() {
        butangHadir.classList.toggle('pilih-hadir', draf[m.id] === 'hadir');
        butangTidak.classList.toggle('pilih-tidak', draf[m.id] === 'tidak');
      }

      function pilih(nilai) {
        draf[m.id] = draf[m.id] === nilai ? undefined : nilai;
        if (!draf[m.id]) { delete draf[m.id]; }
        belumSimpan = true;
        segar();
        lukisStatistik();
      }

      butangHadir.addEventListener('click', function () { pilih('hadir'); });
      butangTidak.addEventListener('click', function () { pilih('tidak'); });
      baris.segar = segar;
      segar();
      senarai.appendChild(baris);
    });

    lukisStatistik();

    /* Butang tindakan */
    var bar = document.createElement('div');
    bar.className = 'bar-tindakan';
    bar.innerHTML =
      '<button class="butang butang-luar tumbuh" type="button" data-semua>Semua hadir</button>' +
      '<button class="butang tumbuh" type="button" data-simpan>Simpan kehadiran</button>';

    bar.querySelector('[data-semua]').addEventListener('click', function () {
      murid.forEach(function (m) { draf[m.id] = 'hadir'; });
      belumSimpan = true;
      Array.prototype.forEach.call(senarai.children, function (b) { b.segar && b.segar(); });
      lukisStatistik();
      CT.ui.toast('Semua murid ditanda hadir. Tekan "Simpan kehadiran".');
    });

    bar.querySelector('[data-simpan]').addEventListener('click', function () {
      var bersih = {};
      Object.keys(draf).forEach(function (id) {
        if (draf[id] === 'hadir' || draf[id] === 'tidak') { bersih[id] = draf[id]; }
      });
      CT.store.simpanKehadiran(tarikh, bersih);
      belumSimpan = false;
      var k = kiraan(murid);
      CT.ui.toast('Kehadiran ' + u.tarikhRingkas(tarikh) + ' disimpan (' +
        k.hadir + ' hadir, ' + k.tidak + ' tidak hadir).');
    });

    skrin.appendChild(bar);

    var pautan = document.createElement('button');
    pautan.type = 'button';
    pautan.className = 'butang butang-lembut butang-penuh jarak-atas';
    pautan.textContent = 'Buka rekod murid untuk tarikh ini';
    pautan.addEventListener('click', function () {
      CT.app.pergi('rekod', { tarikh: tarikh });
    });
    skrin.appendChild(pautan);
  }

  function tetapTarikh(baru) {
    if (u.sahKunci(baru)) { tarikh = baru; muatDraf(); }
  }

  return { tajuk: 'Kehadiran', render: render, tetapTarikh: tetapTarikh };
})();
