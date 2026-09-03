/* Tab Kehadiran — dua pilihan sahaja bagi setiap murid: Hadir atau Tidak hadir.
   Bagi murid yang tidak hadir, guru boleh menanda sama ada ketidakhadiran itu
   Dimaklum atau Tidak dimaklum, dan menulis nota ringkas.

   Hanya murid yang benar-benar ada kelas pada tarikh itu disenaraikan (lihat
   js/jadual.js): Diploma Isnin hingga Jumaat, Ijazah pada hari mingguannya
   sahaja. Murid yang tiada kelas tidak muncul langsung, jadi dia tidak pernah
   dikira sebagai tidak hadir atau belum ditanda pada hari itu.

   Setiap program mempunyai senarai dan ringkasannya sendiri supaya peratus
   kehadiran Diploma dan Ijazah tidak bercampur.

   Rekod disimpan mengikut tarikh dan terus dipaparkan dalam tab Kalendar dan Rekod. */

window.CT = window.CT || {};
CT.views = CT.views || {};

CT.views.kehadiran = (function () {
  'use strict';

  var u = CT.util;
  var tarikh = null;
  var draf = {};
  var drafButiran = {};
  var belumSimpan = false;

  var KUMPULAN = ['diploma', 'ijazah'];

  function kunciProgram(m) {
    return m.program === 'ijazah' ? 'ijazah' : 'diploma';
  }

  function muatDraf() {
    draf = Object.assign({}, CT.store.kehadiranTarikh(tarikh));
    drafButiran = {};
    var simpan = CT.store.butiranKehadiran(tarikh);
    Object.keys(simpan).forEach(function (id) {
      drafButiran[id] = Object.assign({}, simpan[id]);
    });
    belumSimpan = false;
  }

  function kiraan(murid) {
    var hadir = 0, tidak = 0, dimaklum = 0, tidakDimaklum = 0;
    murid.forEach(function (m) {
      if (draf[m.id] === 'hadir') { hadir++; return; }
      if (draf[m.id] !== 'tidak') { return; }
      tidak++;
      var b = drafButiran[m.id];
      if (b && b.maklum === 'dimaklum') { dimaklum++; }
      else if (b && b.maklum === 'tidak-dimaklum') { tidakDimaklum++; }
    });
    return {
      hadir: hadir, tidak: tidak, jumlah: murid.length,
      belum: murid.length - hadir - tidak,
      dimaklum: dimaklum, tidakDimaklum: tidakDimaklum,
      belumDitanda: tidak - dimaklum - tidakDimaklum
    };
  }

  /* Satu baris murid dengan segmen Hadir/Tidak dan panel butiran. */
  function barisMurid(m, selepasUbah) {
    var baris = document.createElement('div');
    baris.className = 'hadir-baris';
    baris.innerHTML =
      '<div class="hadir-atas">' +
      '<span class="tumbuh"><span class="murid-nama">' + u.selamat(m.nama) + '</span><br>' +
      '<span class="kecil">' + u.selamat(m.matrik || 'Tiada matrik') + '</span></span>' +
      '<span class="segmen">' +
      '<button type="button" data-nilai="hadir">Hadir</button>' +
      '<button type="button" data-nilai="tidak">Tidak</button>' +
      '</span>' +
      '</div>' +
      '<div class="hadir-butiran tersembunyi">' +
      '<span class="segmen segmen-maklum">' +
      '<button type="button" data-maklum="dimaklum">Dimaklum</button>' +
      '<button type="button" data-maklum="tidak-dimaklum">Tidak dimaklum</button>' +
      '</span>' +
      '<input type="text" class="nota-tidak-hadir" maxlength="200" ' +
      'placeholder="Nota ringkas (pilihan)" aria-label="Nota ketidakhadiran">' +
      '</div>';

    var butangHadir = baris.querySelector('[data-nilai="hadir"]');
    var butangTidak = baris.querySelector('[data-nilai="tidak"]');
    var butiran = baris.querySelector('.hadir-butiran');
    var butangMaklum = baris.querySelectorAll('[data-maklum]');
    var medanNota = baris.querySelector('.nota-tidak-hadir');

    function segar() {
      var tidakHadir = draf[m.id] === 'tidak';
      butangHadir.classList.toggle('pilih-hadir', draf[m.id] === 'hadir');
      butangTidak.classList.toggle('pilih-tidak', tidakHadir);
      butiran.classList.toggle('tersembunyi', !tidakHadir);

      var b = drafButiran[m.id] || {};
      Array.prototype.forEach.call(butangMaklum, function (x) {
        x.classList.toggle('pilih-maklum', b.maklum === x.getAttribute('data-maklum'));
      });
      if (medanNota.value !== (b.nota || '')) { medanNota.value = b.nota || ''; }
    }

    function pilih(nilai) {
      draf[m.id] = draf[m.id] === nilai ? undefined : nilai;
      if (!draf[m.id]) { delete draf[m.id]; }
      // Butiran hanya bermakna untuk murid yang tidak hadir.
      if (draf[m.id] !== 'tidak') { delete drafButiran[m.id]; }
      belumSimpan = true;
      segar();
      selepasUbah();
    }

    butangHadir.addEventListener('click', function () { pilih('hadir'); });
    butangTidak.addEventListener('click', function () { pilih('tidak'); });

    Array.prototype.forEach.call(butangMaklum, function (x) {
      x.addEventListener('click', function () {
        var nilai = x.getAttribute('data-maklum');
        var b = drafButiran[m.id] || {};
        b.maklum = b.maklum === nilai ? '' : nilai;
        if (!b.maklum) { delete b.maklum; }
        drafButiran[m.id] = b;
        belumSimpan = true;
        segar();
        selepasUbah();
      });
    });

    medanNota.addEventListener('input', function () {
      var b = drafButiran[m.id] || {};
      b.nota = medanNota.value;
      drafButiran[m.id] = b;
      belumSimpan = true;
    });

    baris.segar = segar;
    segar();
    return baris;
  }

  /* Satu kumpulan program: tajuk, statistik sendiri, kemudian senarai murid. */
  function bahagianProgram(kunci, ahli, kumpul) {
    var kotak = document.createElement('div');
    kotak.className = 'kumpulan jarak-atas';

    var tajuk = document.createElement('p');
    tajuk.className = 'seksyen-tajuk';
    tajuk.textContent = CT.sukatan.program(kunci).nama + ' · ' + ahli.length + ' murid';
    kotak.appendChild(tajuk);

    var statistik = document.createElement('div');
    statistik.className = 'statistik';
    kotak.appendChild(statistik);

    var ringkasTidak = document.createElement('p');
    ringkasTidak.className = 'kecil jarak-atas';
    kotak.appendChild(ringkasTidak);

    function lukisStatistik() {
      var k = kiraan(ahli);
      statistik.innerHTML =
        '<div class="stat"><b style="color:var(--hijau)">' + k.hadir + '</b><span>Hadir</span></div>' +
        '<div class="stat"><b style="color:var(--merah)">' + k.tidak + '</b><span>Tidak hadir</span></div>' +
        '<div class="stat"><b>' + u.peratus(k.hadir, k.jumlah) + '%</b><span>Peratus kehadiran</span></div>';

      if (k.tidak) {
        ringkasTidak.innerHTML = 'Tidak hadir: <b>' + k.dimaklum + '</b> dimaklum &middot; <b>' +
          k.tidakDimaklum + '</b> tidak dimaklum' +
          (k.belumDitanda ? ' &middot; <b>' + k.belumDitanda + '</b> belum ditanda' : '');
      } else {
        ringkasTidak.textContent = '';
      }
    }
    kumpul.penyegar.push(lukisStatistik);

    var senarai = document.createElement('div');
    senarai.className = 'senarai jarak-atas';
    ahli.forEach(function (m) {
      var baris = barisMurid(m, kumpul.segarSemua);
      kumpul.baris.push(baris);
      senarai.appendChild(baris);
    });
    kotak.appendChild(senarai);

    lukisStatistik();
    return kotak;
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

    var semua = CT.store.senaraiMurid();
    var murid = CT.jadual.muridUntuk(tarikh, semua);

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

    if (!semua.length) {
      var kosong = CT.ui.kosong('Belum ada murid',
        'Tambah murid dalam tab Murid sebelum mengambil kehadiran.');
      kosong.classList.add('jarak-atas');
      skrin.appendChild(kosong);
      return;
    }

    /* Amaran: pelajar Ijazah tanpa hari kelas muncul setiap hari Isnin-Jumaat
       supaya dia tidak tercicir. Guru perlu tahu sebabnya. */
    var perluHari = semua.filter(function (m) { return CT.jadual.perluHari(m); });
    if (perluHari.length) {
      var amaran = document.createElement('p');
      amaran.className = 'notis notis-info jarak-atas';
      amaran.innerHTML = '<b>' + perluHari.length + '</b> pelajar Ijazah belum ada hari ' +
        'kelas. Mereka muncul setiap hari sehingga harinya ditetapkan dalam tab Murid.';
      skrin.appendChild(amaran);
    }

    if (!murid.length) {
      var tiadaKelas = CT.ui.kosong(
        'Tiada kelas pada hari ' + CT.jadual.namaHari(u.hariMinggu(tarikh)),
        'Tiada murid berjadual pada tarikh ini, jadi tiada kehadiran perlu diambil.');
      tiadaKelas.classList.add('jarak-atas');
      skrin.appendChild(tiadaKelas);
      return;
    }

    /* Nota berapa murid tidak berjadual hari ini, supaya guru yakin tiada
       sesiapa tertinggal secara senyap. */
    if (murid.length < semua.length) {
      var nota = document.createElement('p');
      nota.className = 'kecil jarak-atas';
      nota.textContent = (semua.length - murid.length) +
        ' murid lain tiada kelas pada hari ' + CT.jadual.namaHari(u.hariMinggu(tarikh)) + '.';
      skrin.appendChild(nota);
    }

    var kumpul = {
      baris: [],
      penyegar: [],
      segarSemua: function () { kumpul.penyegar.forEach(function (f) { f(); }); }
    };

    KUMPULAN.forEach(function (kunci) {
      var ahli = murid.filter(function (m) { return kunciProgram(m) === kunci; });
      if (!ahli.length) { return; }
      skrin.appendChild(bahagianProgram(kunci, ahli, kumpul));
    });

    /* Butang tindakan */
    var bar = document.createElement('div');
    bar.className = 'bar-tindakan';
    bar.innerHTML =
      '<button class="butang butang-luar tumbuh" type="button" data-semua>Semua hadir</button>' +
      '<button class="butang tumbuh" type="button" data-simpan>Simpan kehadiran</button>';

    bar.querySelector('[data-semua]').addEventListener('click', function () {
      // Hanya murid yang berjadual hari ini disentuh.
      murid.forEach(function (m) {
        draf[m.id] = 'hadir';
        delete drafButiran[m.id];
      });
      kumpul.baris.forEach(function (b) { b.segar(); });
      belumSimpan = true;
      kumpul.segarSemua();
      CT.ui.toast('Semua murid ditanda hadir. Tekan "Simpan kehadiran".');
    });

    bar.querySelector('[data-simpan]').addEventListener('click', function () {
      var bersih = {};
      var bersihButiran = {};

      /* Draf mengandungi juga tandaan murid yang pernah berjadual pada tarikh
         ini sebelum harinya ditukar. Ia dikekalkan supaya rekod lama tidak
         terpadam apabila guru menyimpan semula. */
      Object.keys(draf).forEach(function (id) {
        if (draf[id] !== 'hadir' && draf[id] !== 'tidak') { return; }
        bersih[id] = draf[id];
        if (draf[id] !== 'tidak') { return; }

        var b = drafButiran[id] || {};
        var nota = String(b.nota || '').trim();
        if (b.maklum || nota) {
          bersihButiran[id] = {};
          if (b.maklum) { bersihButiran[id].maklum = b.maklum; }
          if (nota) { bersihButiran[id].nota = nota; }
        }
      });

      CT.store.simpanKehadiran(tarikh, bersih);
      CT.store.simpanButiranKehadiran(tarikh, bersihButiran);
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
