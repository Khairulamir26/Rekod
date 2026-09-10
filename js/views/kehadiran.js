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
  function bahagianProgram(kunci, ahli, kumpul, tarikh) {
    var kotak = document.createElement('div');
    kotak.className = 'kumpulan jarak-atas';

    var tajuk = document.createElement('p');
    tajuk.className = 'seksyen-tajuk';
    tajuk.textContent = CT.sukatan.program(kunci).nama + ' · ' + ahli.length + ' murid';
    kotak.appendChild(tajuk);

    /* Pelajar Ijazah berkelas sekali seminggu, jadi senarai hari ini hanya
       sebahagian daripada kumpulan itu. Baris ini menerangkan sebab hanya
       sebilangan nama muncul. Diploma tidak memerlukannya kerana mereka
       berkelas setiap hari Isnin hingga Jumaat. */
    if (kunci === 'ijazah') {
      var notaHari = document.createElement('p');
      notaHari.className = 'kecil';
      notaHari.style.marginBottom = '10px';
      notaHari.textContent = ahli.length + ' orang kelas pada hari ' +
        CT.jadual.namaHari(u.hariMinggu(tarikh)) + '.';
      kotak.appendChild(notaHari);
    }

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

    /* Peringatan eksport hari Jumaat. Diletakkan di sini kerana tab Kehadiran
       ialah tab yang guru buka setiap hari, manakala tab Utama mesti kekal
       ringkas. Ia hilang sebaik data minggu ini dieksport, dan boleh ditutup
       untuk hari itu. */
    var peringatan = peringatanEksport();
    if (peringatan) { skrin.appendChild(peringatan); }

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
      /* Pautan bawah tetap dipaparkan: ringkasan semester berguna pada
         hari cuti juga, dan guru sepatutnya tidak perlu menukar tarikh
         dahulu semata-mata untuk membukanya. */
      pautanBawah(skrin);
      return;
    }

    var kumpul = {
      baris: [],
      penyegar: [],
      segarSemua: function () { kumpul.penyegar.forEach(function (f) { f(); }); }
    };

    KUMPULAN.forEach(function (kunci) {
      var ahli = murid.filter(function (m) { return kunciProgram(m) === kunci; });
      if (!ahli.length) { return; }
      skrin.appendChild(bahagianProgram(kunci, ahli, kumpul, tarikh));
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

    pautanBawah(skrin);
  }

  /* Peringatan Jumaat: nada relaks, bukan amaran. Satu ayat dan satu butang. */
  function peringatanEksport() {
    if (!CT.sheet.perluPeringatan(u.hariIni())) { return null; }

    var kotak = document.createElement('div');
    kotak.className = 'notis notis-info notis-peringatan jarak-atas';

    var teks = document.createElement('span');
    teks.className = 'peringatan-teks';
    teks.innerHTML = '<b>Peringatan:</b> Sila eksport data minggu ini ke dalam ' +
      'spreadsheet.';
    kotak.appendChild(teks);

    var pergi = document.createElement('button');
    pergi.type = 'button';
    pergi.className = 'butang butang-kecil';
    pergi.textContent = 'Eksport Sekarang';
    pergi.addEventListener('click', function () { CT.eksport.buka('minggu-ini'); });
    kotak.appendChild(pergi);

    var tutup = document.createElement('button');
    tutup.type = 'button';
    tutup.className = 'butang butang-luar butang-kecil';
    tutup.textContent = 'Nanti';
    tutup.addEventListener('click', function () {
      CT.sheet.tutupPeringatan(u.hariIni());
      CT.app.segarSemula();
    });
    kotak.appendChild(tutup);

    return kotak;
  }

  /* Dua pautan di bawah tab, dipaparkan sama ada ada kelas pada hari itu
     atau tidak. */
  function pautanBawah(skrin) {
    var pautan = document.createElement('button');
    pautan.type = 'button';
    pautan.className = 'butang butang-lembut butang-penuh jarak-atas';
    pautan.textContent = 'Buka rekod murid untuk tarikh ini';
    pautan.addEventListener('click', function () {
      CT.app.pergi('rekod', { tarikh: tarikh });
    });
    skrin.appendChild(pautan);

    var pautanRingkas = document.createElement('button');
    pautanRingkas.type = 'button';
    pautanRingkas.className = 'butang butang-lembut butang-penuh jarak-atas';
    pautanRingkas.textContent = 'Jumlah tidak hadir sepanjang semester';
    pautanRingkas.addEventListener('click', bukaRingkasan);
    skrin.appendChild(pautanRingkas);

    var pautanEksport = document.createElement('button');
    pautanEksport.type = 'button';
    pautanEksport.className = 'butang butang-lembut butang-penuh jarak-atas';
    pautanEksport.textContent = 'Eksport ke Sheet';
    pautanEksport.addEventListener('click', function () { CT.eksport.buka(); });
    skrin.appendChild(pautanEksport);
  }

  /* ---------- Ringkasan ketidakhadiran sepanjang semester ---------- */
  function kadRingkasan(r) {
    var kad = document.createElement('div');
    kad.className = 'kad kad-rapat';

    var lencana = r.tidak
      ? '<span class="lencana lencana-merah">' + r.tidak + ' tidak hadir</span>'
      : '<span class="lencana">Kehadiran penuh</span>';

    /* Tarikh dipaparkan sebagai cip berasingan, bukan satu baris berkoma.
       Lima tarikh dalam satu ayat menjadi satu blok teks yang sukar diimbas;
       sebagai cip, setiap tarikh berdiri sendiri dan boleh dibilang dengan
       pandangan. Tahun digugurkan kerana julat semester sudah tertera di
       kepala senarai. Cip sengaja dibiarkan senyap: lencana kiraan di atas
       sudah membawa isyarat merah. */
    var tarikh = '';
    if (r.tidak) {
      tarikh =
        '<p class="kecil ringkas-label">Tarikh tidak hadir</p>' +
        '<div class="baris-lipat">' + r.tarikhTidak.map(function (t) {
          var p = u.pecah(t);
          return '<span class="lencana cip-tarikh">' +
            u.selamat(CT.jadual.namaHariPendek(u.hariMinggu(t))) + ' ' +
            u.selamat(('0' + p.hari).slice(-2) + '/' + ('0' + p.bulan).slice(-2)) +
            '</span>';
        }).join('') + '</div>';
    }

    var perinci = '';
    if (r.tidak) {
      perinci = '<b>' + r.tidakDimaklum + '</b> tidak dimaklum &middot; <b>' +
        r.dimaklum + '</b> dimaklum';
      var belumMaklum = r.tidak - r.dimaklum - r.tidakDimaklum;
      if (belumMaklum) {
        perinci += ' &middot; <b>' + belumMaklum + '</b> sebab belum ditanda';
      }
    }
    /* Hari yang kelas diambil tetapi murid ini langsung tidak ditanda. Ia
       bukan ketidakhadiran — ia rekod yang belum lengkap. */
    if (r.belum) {
      perinci += (perinci ? '<br>' : '') + '<b>' + r.belum +
        '</b> hari kelas belum ditanda kehadirannya.';
    }

    kad.innerHTML =
      '<div class="baris-antara ringkas-kepala">' +
      '<span class="tumbuh">' +
      '<span class="murid-nama">' + u.selamat(r.murid.nama) + '</span><br>' +
      '<span class="kecil">' + u.selamat(r.murid.matrik || 'Tiada matrik') +
      ' &middot; ' + r.kelas + ' kelas &middot; ' + r.peratus + '% hadir</span>' +
      '</span>' + lencana + '</div>' +
      tarikh +
      (perinci ? '<p class="kecil ringkas-perinci">' + perinci + '</p>' : '');
    return kad;
  }

  function bukaRingkasan() {
    var kotak = document.createElement('div');
    var j = CT.ringkasan.julat();
    var bilTarikh = CT.ringkasan.tarikhDiambil().length;

    if (!bilTarikh) {
      kotak.appendChild(CT.ui.kosong('Belum ada kehadiran direkod',
        'Ambil kehadiran sekurang-kurangnya sekali sebelum ringkasan semester ' +
        'boleh dikira.'));
      CT.ui.bukaLapisan('Ketidakhadiran Semester', kotak);
      return;
    }

    var julat = document.createElement('p');
    julat.className = 'kecil';
    julat.style.marginBottom = '14px';
    julat.innerHTML = u.selamat(u.tarikhRingkas(j.mula)) + ' hingga ' +
      u.selamat(u.tarikhRingkas(j.akhir)) + ' &middot; <b>' + bilTarikh +
      '</b> hari kehadiran diambil. Hari yang kehadiran tidak diambil tidak dikira.';
    kotak.appendChild(julat);

    var semua = CT.ringkasan.semuaMurid();

    KUMPULAN.forEach(function (kunci) {
      var ahli = semua.filter(function (r) { return kunciProgram(r.murid) === kunci; });
      if (!ahli.length) { return; }

      var kumpulan = document.createElement('div');
      kumpulan.className = 'kumpulan';

      var jumlahTidak = ahli.reduce(function (n, r) { return n + r.tidak; }, 0);
      var tajuk = document.createElement('p');
      tajuk.className = 'seksyen-tajuk';
      tajuk.textContent = CT.sukatan.program(kunci).nama + ' · ' +
        jumlahTidak + ' ketidakhadiran';
      kumpulan.appendChild(tajuk);

      var senarai = document.createElement('div');
      senarai.className = 'senarai';
      ahli.forEach(function (r) { senarai.appendChild(kadRingkasan(r)); });
      kumpulan.appendChild(senarai);

      kotak.appendChild(kumpulan);
    });

    CT.ui.bukaLapisan('Ketidakhadiran Semester', kotak);
  }

  function tetapTarikh(baru) {
    if (u.sahKunci(baru)) { tarikh = baru; muatDraf(); }
  }

  return { tajuk: 'Kehadiran', render: render, tetapTarikh: tetapTarikh };
})();
