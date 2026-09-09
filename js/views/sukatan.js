/* Tab Sukatan — berapa banyak lagi setiap murid perlu hantar untuk cukup
   sukatan semester, dipaparkan sebagai carta bar mendatar.

   Bar dilukis pada skala halaman yang sama bagi semua murid, jadi panjang bar
   boleh dibandingkan terus antara murid. */

window.CT = window.CT || {};
CT.views = CT.views || {};

CT.views.sukatan = (function () {
  'use strict';

  var u = CT.util;
  /* Diploma menjadi tapisan lalai kerana ia kumpulan terbesar. Pilihan guru
     kekal sepanjang sesi selepas dia menukarnya. */
  var tapisProgram = 'diploma';
  var paparJadual = false;
  var paparGraf = false;

  function lencanaStatus(status) {
    var kelas = {
      cukup: 'lencana',
      ikut: 'lencana',
      kejar: 'lencana lencana-merah',
      genting: 'lencana lencana-merah',
      tamat: 'lencana lencana-kelabu',
      belum: 'lencana lencana-kelabu'
    }[status.kunci] || 'lencana lencana-kelabu';
    return '<span class="' + kelas + '">' + u.selamat(status.teks) + '</span>';
  }

  function nombor(n, titik) {
    if (n === null || n === undefined) { return '-'; }
    return (Math.round(n * Math.pow(10, titik || 0)) / Math.pow(10, titik || 0)).toString();
  }

  /* ---------- Butiran seorang murid ---------- */
  function bukaButiran(d) {
    var kotak = document.createElement('div');
    kotak.innerHTML =
      '<p class="tebal" style="margin-bottom:4px">' + u.selamat(d.nama) + '</p>' +
      '<p class="kecil" style="margin-bottom:14px">' +
      u.selamat(d.namaProgram + ' — ' + d.namaTahap) + '</p>' +
      '<div class="rekod-medan">' +
      '<div><b>Sukatan</b>Juz ' + d.juzMula + ' &ndash; Juz ' + d.juzHabis + '</div>' +
      '<div><b>Muka surat</b>' + d.halamanMula + ' &ndash; ' + d.halamanHabis + '</div>' +
      '<div><b>Jumlah sukatan</b>' + d.jumlah + ' halaman</div>' +
      '<div><b>Sudah dihantar</b>' + d.sudah + ' halaman</div>' +
      '<div><b>Baki sukatan</b>' + d.baki + ' halaman</div>' +
      '<div><b>Halaman terakhir</b>' + (d.halamanDihantar || '-') +
      (d.tarikhDihantar ? ' (' + u.tarikhRingkas(d.tarikhDihantar) + ')' : '') + '</div>' +
      '<div><b>Baki hari</b>' + d.hariBaki + ' hari</div>' +
      '<div><b>Kadar semasa</b>' + (d.kadarSemasa === null
        ? 'Belum cukup data (' + (d.hariRekod || 0) + ' hari rekod)'
        : nombor(d.kadarSemasa, 2) + ' halaman/hari') + '</div>' +
      '<div><b>Status</b>' + u.selamat(d.status.teks) + '</div>' +
      '</div>' +
      /* Bacaan dalam julat tarikh disembunyikan sehingga guru memintanya.
         Kebanyakan kali dia membuka butiran ini untuk melihat baki sukatan,
         bukan untuk menyoal julat tarikh, jadi dua medan tarikh dan satu kad
         hasil di situ hanya menambah panjang skrol. */
      '<button class="butang butang-lembut butang-penuh jarak-atas" type="button" data-togol-julat>' +
      'Bacaan dalam julat tarikh</button>' +
      '<div data-panel-julat class="tersembunyi">' +
      '<div class="medan-dua jarak-atas">' +
      '<div class="medan"><label for="jb-dari">Dari</label>' +
      '<input type="date" id="jb-dari" value="' + u.selamat(CT.sukatan.tarikhMula()) +
      '" aria-label="Tarikh mula julat"></div>' +
      '<div class="medan"><label for="jb-hingga">Hingga</label>' +
      '<input type="date" id="jb-hingga" value="' + u.selamat(u.hariIni()) +
      '" aria-label="Tarikh akhir julat"></div>' +
      '</div>' +
      '<div class="kad kad-rapat" data-julat-hasil></div>' +
      '</div>' +

      '<button class="butang butang-lembut butang-penuh jarak-atas" type="button" data-rekod>' +
      'Buka Rekod hari ini</button>';

    var medanDari = kotak.querySelector('#jb-dari');
    var medanHingga = kotak.querySelector('#jb-hingga');
    var hasilJulat = kotak.querySelector('[data-julat-hasil]');

    function lukisJulat() {
      var j = CT.sukatan.julatBacaan(d.muridId, medanDari.value, medanHingga.value);
      if (!j) {
        hasilJulat.innerHTML = '<p class="kecil">Pilih kedua-dua tarikh.</p>';
        return;
      }
      if (!j.bilangan) {
        hasilJulat.innerHTML = '<p class="kecil">Tiada rekod muka surat antara ' +
          u.selamat(u.tarikhRingkas(j.dari)) + ' dan ' +
          u.selamat(u.tarikhRingkas(j.hingga)) + '.</p>';
        return;
      }
      hasilJulat.innerHTML =
        '<p class="julat-besar"><b>' + j.bilangan + '</b> muka surat</p>' +
        '<p class="kecil">Muka surat ' + j.halamanTerendah + ' hingga ' +
        j.halamanTertinggi + ' &middot; ' + j.hari + ' hari ada rekod</p>';
    }

    /* Medan tarikh dalam lapisan dihias dengan format Malaysia oleh
       CT.ui.bukaLapisan, jadi ia hanya perlu didengar di sini. */
    medanDari.addEventListener('change', lukisJulat);
    medanHingga.addEventListener('change', lukisJulat);

    var togolJulat = kotak.querySelector('[data-togol-julat]');
    var panelJulat = kotak.querySelector('[data-panel-julat]');
    togolJulat.addEventListener('click', function () {
      var tersembunyi = panelJulat.classList.toggle('tersembunyi');
      togolJulat.textContent = tersembunyi
        ? 'Bacaan dalam julat tarikh'
        : 'Sembunyikan julat tarikh';
      /* Hasil dikira hanya apabila panel dibuka, bukan setiap kali butiran
         murid dipaparkan. */
      if (!tersembunyi) { lukisJulat(); }
    });

    kotak.querySelector('[data-rekod]').addEventListener('click', function () {
      CT.ui.tutupLapisan();
      CT.app.pergi('rekod', { tarikh: u.hariIni() });
    });
    CT.ui.bukaLapisan('Butiran Sukatan', kotak);
  }

  /* ---------- Satu bar ---------- */
  function barMurid(d, skalaMaks) {
    var baris = document.createElement('button');
    baris.type = 'button';
    baris.className = 'sk-baris';

    var lebarBar = Math.max(6, (d.jumlah / skalaMaks) * 100);
    var bahagianSudah = d.jumlah ? (d.sudah / d.jumlah) * 100 : 0;

    // Segmen berukuran sifar ditinggalkan supaya hujung bar kekal kemas.
    var segmen = '';
    if (bahagianSudah > 0) {
      segmen += '<span class="sk-sudah" style="width:' + bahagianSudah.toFixed(2) + '%"></span>';
    }
    if (d.baki > 0) { segmen += '<span class="sk-baki"></span>'; }

    baris.innerHTML =
      '<span class="sk-kepala">' +
      '<span class="tumbuh"><span class="murid-nama">' + u.selamat(d.nama) + '</span> ' +
      '<span class="kecil">' + u.selamat(d.namaTahap) + '</span></span>' +
      lencanaStatus(d.status) +
      '</span>' +
      '<span class="sk-trek" style="width:' + lebarBar.toFixed(2) + '%">' + segmen + '</span>' +
      '<span class="sk-angka">' +
      '<span><b>' + d.baki + '</b> halaman lagi</span>' +
      '<span>' + d.sudah + ' / ' + d.jumlah + ' halaman &middot; ' + d.peratus + '%</span>' +
      '</span>';

    baris.setAttribute('aria-label', d.nama + ', ' + d.namaTahap + ': sudah ' +
      d.sudah + ' halaman daripada ' + d.jumlah + ', baki ' + d.baki + ' halaman.');
    baris.addEventListener('click', function () { bukaButiran(d); });
    return baris;
  }

  /* ---------- Graf prestasi: habis lawan belum habis ----------
     Satu bar berkadar, bukan carta pai: perbandingan panjang lebih mudah
     dibaca daripada perbandingan sudut, dan satu bar muat pada telefon tanpa
     mengecilkan apa-apa. "Habis" bermaksud baki sifar, definisi yang sama
     dengan petak "Belum cukup" di atas, jadi graf ini tidak boleh bercanggah
     dengan angka itu. */
  function graf(senarai) {
    var jumlah = senarai.length;
    var habis = senarai.filter(function (d) { return d.baki <= 0; }).length;
    var belum = jumlah - habis;

    /* Peratus kedua dikira daripada yang pertama supaya kedua-duanya
       sentiasa berjumlah 100 walaupun selepas pembundaran. */
    var peratusHabis = jumlah ? Math.round((habis / jumlah) * 100) : 0;
    var peratusBelum = jumlah ? 100 - peratusHabis : 0;

    var kotak = document.createElement('div');
    kotak.className = 'kad jarak-atas';

    /* Segmen berukuran sifar ditinggalkan supaya tiada jalur nipis tergantung
       pada hujung bar apabila semua murid berada di satu pihak. */
    var bar = '';
    if (habis) {
      bar += '<span class="graf-segmen graf-habis" style="flex:' + habis + '"></span>';
    }
    if (belum) {
      bar += '<span class="graf-segmen graf-belum" style="flex:' + belum + '"></span>';
    }

    function baris(kelas, nama, bilangan, peratus) {
      return '<div class="graf-baris">' +
        '<i class="graf-tanda ' + kelas + '"></i>' +
        '<span class="graf-nama">' + nama + '</span>' +
        '<span class="graf-nilai">' + bilangan + ' murid &middot; ' + peratus + '%</span>' +
        '</div>';
    }

    kotak.innerHTML =
      '<p class="seksyen-tajuk">Prestasi sukatan</p>' +
      '<div class="graf-bar" role="img" aria-label="' +
      u.selamat(habis + ' daripada ' + jumlah + ' murid sudah habis sukatan (' +
        peratusHabis + '%), ' + belum + ' murid belum habis (' + peratusBelum + '%).') +
      '">' + bar + '</div>' +
      baris('graf-habis', 'Habis sukatan', habis, peratusHabis) +
      baris('graf-belum', 'Belum habis', belum, peratusBelum);

    return kotak;
  }

  /* ---------- Jadual data ---------- */
  function jadual(senarai) {
    var kotak = document.createElement('div');
    kotak.className = 'kad jadual-kotak jarak-atas';
    kotak.innerHTML =
      '<table class="jadual"><thead><tr>' +
      '<th>Murid</th><th>Tahap</th><th class="angka">Sukatan</th>' +
      '<th class="angka">Sudah</th><th class="angka">Baki</th>' +
      '</tr></thead><tbody>' +
      senarai.map(function (d) {
        return '<tr><td>' + u.selamat(d.nama) + '</td><td>' + u.selamat(d.namaTahap) + '</td>' +
          '<td class="angka">' + d.jumlah + '</td>' +
          '<td class="angka">' + d.sudah + '</td>' +
          '<td class="angka">' + d.baki + '</td></tr>';
      }).join('') +
      '</tbody></table>';
    return kotak;
  }

  /* ---------- Halaman ---------- */
  function render(skrin) {
    var hariIni = u.hariIni();
    var akhir = CT.sukatan.tarikhAkhir();
    var hariBaki = Math.max(0, CT.sukatan.bezaHari(hariIni, akhir));

    /* Tetapan semester */
    var kadSemester = document.createElement('div');
    kadSemester.className = 'kad';
    /* Hari pertama menentukan julat kiraan ketidakhadiran semester dalam tab
       Kehadiran; hari terakhir menentukan baki masa sukatan. */
    var mula = CT.sukatan.tarikhMula();
    /* Panjang semester dikira secara inklusif: hari pertama dan hari terakhir
       kedua-duanya termasuk. Minggu dibundarkan ke atas kerana minggu yang
       tidak penuh tetap minggu pengajaran. */
    var panjang = CT.sukatan.bezaHari(mula, akhir) + 1;
    var minggu = Math.ceil(panjang / 7);

    kadSemester.innerHTML =
      '<p class="seksyen-tajuk">Hari pertama semester</p>' +
      '<div class="medan" style="margin-bottom:8px">' +
      '<input type="date" id="sk-mula" value="' + u.selamat(mula) + '" aria-label="Hari pertama semester">' +
      '</div>' +
      '<p class="kecil">' + u.selamat(u.tarikhPenuh(mula)) + '</p>' +

      '<p class="seksyen-tajuk" style="margin-top:16px">Hari terakhir semester</p>' +
      '<div class="medan" style="margin-bottom:8px">' +
      '<input type="date" id="sk-akhir" value="' + u.selamat(akhir) + '" aria-label="Hari terakhir semester">' +
      '</div>' +
      '<p class="kecil">' + u.selamat(u.tarikhPenuh(akhir)) + ' &middot; <b>' +
      hariBaki + ' hari lagi</b> dari ' + u.selamat(u.tarikhRingkas(hariIni)) + '</p>' +

      '<p class="kecil" style="margin-top:10px">Semester ini <b>' + minggu +
      ' minggu</b> &middot; ' + panjang + ' hari. Julat ini digunakan untuk ' +
      'kiraan ketidakhadiran semester dalam tab Kehadiran.</p>';

    var medanMula = kadSemester.querySelector('#sk-mula');
    CT.ui.hiasTarikh(medanMula);       // paparkan format tarikh Malaysia
    medanMula.addEventListener('change', function () {
      if (!u.sahKunci(medanMula.value)) { return; }
      if (medanMula.value > CT.sukatan.tarikhAkhir()) {
        CT.ui.toast('Hari pertama tidak boleh selepas hari terakhir semester.');
        medanMula.value = mula;
        return;
      }
      CT.store.simpanTetapan({ tarikhMulaSemester: medanMula.value });
      CT.ui.toast('Hari pertama semester dikemas kini.');
      CT.app.segarSemula();
    });

    var medanAkhir = kadSemester.querySelector('#sk-akhir');
    CT.ui.hiasTarikh(medanAkhir);
    medanAkhir.addEventListener('change', function () {
      if (!u.sahKunci(medanAkhir.value)) { return; }
      if (medanAkhir.value < CT.sukatan.tarikhMula()) {
        CT.ui.toast('Hari terakhir tidak boleh sebelum hari pertama semester.');
        medanAkhir.value = akhir;
        return;
      }
      CT.store.simpanTetapan({ tarikhAkhirSemester: medanAkhir.value });
      CT.ui.toast('Hari terakhir semester dikemas kini.');
      CT.app.segarSemula();
    });
    skrin.appendChild(kadSemester);

    /* Tapis program */
    var tapis = document.createElement('div');
    tapis.className = 'tapis jarak-atas';
    /* Diploma dahulu, kemudian Ijazah, dan "Semua program" di hujung — sama
       susunan dengan senarai murid dalam tab Murid, Kehadiran dan Rekod. */
    [['diploma', 'Diploma'], ['ijazah', 'Ijazah'], ['semua', 'Semua program']].forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = p[1];
      b.className = tapisProgram === p[0] ? 'aktif' : '';
      b.addEventListener('click', function () {
        tapisProgram = p[0];
        CT.app.segarSemula();
      });
      tapis.appendChild(b);
    });
    skrin.appendChild(tapis);

    /* Data */
    var semua = CT.sukatan.kiraSemua(hariIni);
    var senarai = semua.filter(function (d) {
      return d.adaSukatan && (tapisProgram === 'semua' || d.program === tapisProgram);
    }).sort(function (a, b) { return b.baki - a.baki; });

    var tiadaSukatan = semua.filter(function (d) { return !d.adaSukatan; });

    if (!semua.length) {
      var kosong = CT.ui.kosong('Belum ada murid',
        'Tambah murid dalam tab Murid untuk melihat kemajuan sukatan.');
      kosong.classList.add('jarak-atas');
      skrin.appendChild(kosong);
      return;
    }

    /* Ringkasan */
    var belumCukup = senarai.filter(function (d) { return d.baki > 0; });

    var statistik = document.createElement('div');
    statistik.className = 'statistik statistik-dua jarak-atas';
    statistik.innerHTML =
      '<div class="stat"><b>' + senarai.length + '</b><span>Murid</span></div>' +
      '<div class="stat"><b style="color:var(--merah)">' + belumCukup.length +
      '</b><span>Belum cukup</span></div>';
    skrin.appendChild(statistik);

    if (!senarai.length) {
      var takde = CT.ui.kosong('Tiada murid dalam tapisan ini',
        'Tukar tapisan program untuk melihat murid lain.');
      takde.classList.add('jarak-atas');
      skrin.appendChild(takde);
      return;
    }

    /* Carta */
    var skalaMaks = senarai.reduce(function (n, d) { return Math.max(n, d.jumlah); }, 1);

    var carta = document.createElement('div');
    carta.className = 'kad jarak-atas';
    carta.innerHTML =
      '<p class="seksyen-tajuk">Baki sukatan setiap murid</p>' +
      '<div class="sk-petunjuk">' +
      '<span><i class="sk-warna-sudah"></i> Sudah dihantar</span>' +
      '<span><i class="sk-warna-baki"></i> Baki sukatan</span>' +
      '</div>';

    var senaraiBar = document.createElement('div');
    senaraiBar.className = 'sk-senarai';
    senarai.forEach(function (d) { senaraiBar.appendChild(barMurid(d, skalaMaks)); });
    carta.appendChild(senaraiBar);

    var skala = document.createElement('p');
    skala.className = 'kecil sk-skala';
    skala.innerHTML = '<span>0</span><span>Skala halaman &middot; bar penuh = ' +
      skalaMaks + ' halaman</span>';
    carta.appendChild(skala);

    var barisTogol = document.createElement('div');
    barisTogol.className = 'baris-lipat jarak-atas';

    var togol = document.createElement('button');
    togol.type = 'button';
    togol.className = 'butang butang-luar butang-kecil';
    togol.textContent = paparJadual ? 'Sembunyikan jadual' : 'Lihat jadual';
    togol.addEventListener('click', function () {
      paparJadual = !paparJadual;
      CT.app.segarSemula();
    });
    barisTogol.appendChild(togol);

    var togolGraf = document.createElement('button');
    togolGraf.type = 'button';
    togolGraf.className = 'butang butang-luar butang-kecil';
    togolGraf.textContent = paparGraf ? 'Sembunyikan graf' : 'Lihat graf';
    togolGraf.addEventListener('click', function () {
      paparGraf = !paparGraf;
      CT.app.segarSemula();
    });
    barisTogol.appendChild(togolGraf);

    carta.appendChild(barisTogol);

    skrin.appendChild(carta);

    if (paparGraf) { skrin.appendChild(graf(senarai)); }
    if (paparJadual) { skrin.appendChild(jadual(senarai)); }

    if (tiadaSukatan.length) {
      var notis = document.createElement('div');
      notis.className = 'notis notis-info jarak-atas';
      notis.innerHTML = '<b>' + tiadaSukatan.length + ' murid tiada sukatan:</b> ' +
        tiadaSukatan.map(function (d) {
          return u.selamat(d.nama) + ' (' + u.selamat(d.namaProgram + ' ' + d.namaTahap) + ')';
        }).join(', ') +
        '. Program Diploma mempunyai Hifz 1 hingga 6 sahaja. Semak program dan tahap ' +
        'dalam profil murid.';
      skrin.appendChild(notis);
    }
  }

  return { tajuk: 'Sukatan', render: render };
})();
