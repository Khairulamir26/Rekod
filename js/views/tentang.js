/* Lapisan "Tentang & Sandaran".

   Dibuka dengan menekan baris versi di kaki tab Utama. Sengaja bukan tab:
   tab Utama mesti kekal ringkas, dan sandaran ialah kerja yang dibuat sekali
   seminggu, bukan setiap hari. */

window.CT = window.CT || {};

CT.tentang = (function () {
  'use strict';

  var u = CT.util;
  var s = CT.sandaran;

  var mesejHasil = null;      // notis sekali guna selepas sesuatu tindakan

  /* ---------- Bantuan kecil ---------- */

  function el(tag, kelas, teks) {
    var x = document.createElement(tag);
    if (kelas) { x.className = kelas; }
    if (teks !== undefined) { x.textContent = teks; }
    return x;
  }

  function butang(label, kelas, bila) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'butang ' + (kelas || 'butang-luar');
    b.textContent = label;
    b.addEventListener('click', bila);
    return b;
  }

  function seksyen(tajuk) {
    var kotak = el('div', 'kad');
    kotak.appendChild(el('p', 'tebal', tajuk));
    return kotak;
  }

  function tunjukHasil(jenis, teks) {
    mesejHasil = { jenis: jenis, teks: teks };
    segar();
  }

  /* ---------- Status sandaran ---------- */

  function kadStatus() {
    var st = s.status();
    var kotak = el('div', 'notis ' + (st.perlu ? 'notis-cuti' : 'notis-baik'));

    if (!st.pernah) {
      kotak.innerHTML = '<b>Belum pernah disandarkan.</b> Data e-Dawam hanya ' +
        'wujud dalam pelayar peranti ini. Buat sandaran pertama sekarang.';
    } else if (st.perlu) {
      kotak.innerHTML = '<b>Sandaran sudah lama.</b> Terakhir ' +
        u.selamat(u.capMasa(st.iso)) + ' (' + st.hari + ' hari lalu).';
    } else {
      kotak.innerHTML = '<b>' + u.selamat(st.teks) + '.</b> ' +
        u.selamat(u.capMasa(st.iso));
    }
    return kotak;
  }

  /* ---------- Membuat sandaran ---------- */

  function kadSandar() {
    var kotak = seksyen('Buat sandaran');
    var petikan = s.bina();
    var teksFail = JSON.stringify(petikan);
    var k = petikan.kiraan;

    var perinci = el('p', 'kecil');
    perinci.style.marginTop = '2px';
    perinci.innerHTML = u.selamat(s.namaFail()) + ' &middot; ' +
      u.selamat(s.saizTeks(teksFail)) + '<br>' +
      k.murid + ' murid &middot; ' + k.hariKehadiran + ' hari kehadiran &middot; ' +
      k.hariRekod + ' hari rekod bacaan &middot; ' + k.nota + ' nota';
    kotak.appendChild(perinci);

    var utama = butang('Muat turun fail sandaran', 'butang-penuh', function () {
      s.muatTurun(s.namaFail(), teksFail, 'application/json');
      s.catat('muat-turun');
      tunjukHasil('baik', 'Fail sandaran dimuat turun. Simpan salinannya di ' +
        'luar telefon ini — Google Drive, iCloud, e-mel atau WhatsApp kepada diri sendiri.');
    });
    utama.style.marginTop = '12px';
    kotak.appendChild(utama);

    var baris = el('div', 'baris-lipat jarak-atas');

    if (s.bolehKongsi()) {
      baris.appendChild(butang('Kongsi fail', 'butang-luar tumbuh', function () {
        s.kongsi().then(function () {
          s.catat('kongsi');
          tunjukHasil('baik', 'Fail sandaran dikongsi.');
        }, function (e) {
          // Pengguna membatalkan helaian perkongsian — bukan ralat.
          if (e && e.name === 'AbortError') { return; }
          CT.ui.toast('Perkongsian gagal. Cuba muat turun fail.');
        });
      }));
    }

    baris.appendChild(butang('Salin teks sandaran', 'butang-luar tumbuh', function () {
      s.salin(teksFail).then(function () {
        s.catat('salin');
        tunjukHasil('baik', 'Teks sandaran disalin. Tampalkannya ke dalam nota, ' +
          'e-mel atau mesej kepada diri sendiri.');
      }, function () {
        CT.ui.toast('Papan keratan tidak dibenarkan pada pelayar ini.');
      });
    }));

    kotak.appendChild(baris);

    var nota = el('p', 'kecil jarak-atas');
    nota.innerHTML = 'Fail disimpan ke folder muat turun peranti. Di iPhone ia ' +
      'masuk ke aplikasi <b>Fail</b>. Sandaran hanya selamat apabila salinannya ' +
      'berada di luar telefon ini.';
    kotak.appendChild(nota);

    kotak.appendChild(kawalanPeringatan());
    return kotak;
  }

  function kawalanPeringatan() {
    var st = s.status();
    var medan = el('div', 'medan jarak-atas');
    medan.style.marginBottom = '0';
    medan.innerHTML = '<label for="sd-tempoh">Peringatan sandaran</label>' +
      '<select id="sd-tempoh">' +
      [7, 14, 30].map(function (n) {
        return '<option value="' + n + '"' + (st.tempoh === n ? ' selected' : '') +
          '>Ingatkan selepas ' + n + ' hari</option>';
      }).join('') +
      '<option value="0"' + (st.tempoh === 0 ? ' selected' : '') +
      '>Jangan ingatkan</option></select>';

    medan.querySelector('select').addEventListener('change', function () {
      CT.store.simpanTetapan({ sandaranTempoh: +this.value });
      CT.ui.toast(+this.value ? 'Peringatan ditetapkan.' : 'Peringatan dimatikan.');
      segar();
    });
    return medan;
  }

  /* ---------- Eksport ke spreadsheet laporan ---------- */

  function kadSheet() {
    var st = CT.sheet.status();
    var kotak = seksyen('Eksport ke Sheet');
    var nota = el('p', 'kecil');
    nota.style.marginTop = '2px';
    nota.textContent = st.pernah ? st.teks
      : 'Hantar rekod bacaan mingguan terus ke dalam spreadsheet laporan halaqah.';
    kotak.appendChild(nota);

    var b = butang('Eksport ke Sheet', 'butang-lembut butang-penuh', function () {
      CT.eksport.buka();
    });
    b.style.marginTop = '12px';
    kotak.appendChild(b);
    return kotak;
  }

  /* ---------- Eksport CSV ---------- */

  function kadCsv() {
    var kotak = seksyen('Eksport untuk Excel');
    var nota = el('p', 'kecil');
    nota.style.marginTop = '2px';
    nota.textContent = 'Fail CSV untuk laporan dan simpanan jabatan. Ia boleh ' +
      'dibuka dalam Excel tetapi TIDAK boleh dipulihkan semula ke dalam ' +
      'aplikasi — gunakan fail sandaran JSON di atas untuk itu.';
    kotak.appendChild(nota);

    var baris = el('div', 'baris-lipat jarak-atas');
    [
      ['Ringkasan semester', 'ringkasan', s.csvRingkasan],
      ['Senarai murid', 'murid', s.csvMurid],
      ['Kehadiran penuh', 'kehadiran', s.csvKehadiran],
      ['Rekod bacaan', 'rekod', s.csvRekod]
    ].forEach(function (x) {
      baris.appendChild(butang(x[0], 'butang-luar butang-kecil tumbuh', function () {
        s.muatTurun('e-dawam-' + x[1] + '-' + u.hariIni() + '.csv', x[2](),
          'text/csv;charset=utf-8');
        CT.ui.toast('Fail CSV dimuat turun.');
      }));
    });
    kotak.appendChild(baris);
    return kotak;
  }

  /* ---------- Pemulihan ---------- */

  function kadPulih() {
    var kotak = seksyen('Pulih daripada sandaran');
    var nota = el('p', 'kecil');
    nota.style.marginTop = '2px';
    nota.textContent = 'Pilih fail sandaran e-Dawam. Aplikasi akan menunjukkan ' +
      'perbandingan dahulu — tiada apa-apa berubah sehingga anda mengesahkannya.';
    kotak.appendChild(nota);

    var pilihFail = document.createElement('input');
    pilihFail.type = 'file';
    pilihFail.accept = 'application/json,.json';
    pilihFail.className = 'tersembunyi';
    pilihFail.addEventListener('change', function () {
      var fail = this.files && this.files[0];
      if (!fail) { return; }
      s.bacaFail(fail).then(function (teks) { terimaTeks(teks); },
        function (e) { CT.ui.toast(e.message); });
    });
    kotak.appendChild(pilihFail);

    var butangFail = butang('Pilih fail sandaran', 'butang-lembut butang-penuh', function () {
      pilihFail.click();
    });
    butangFail.style.marginTop = '12px';
    kotak.appendChild(butangFail);

    /* Sesetengah guru menerima sandaran sebagai teks dalam WhatsApp, bukan
       sebagai fail. Laluan tampal ini menyelamatkan keadaan itu. */
    var panel = el('div', 'tersembunyi jarak-atas');
    panel.innerHTML =
      '<div class="medan" style="margin-bottom:8px">' +
      '<label for="sd-tampal">Teks sandaran</label>' +
      '<textarea id="sd-tampal" placeholder="Tampal teks sandaran di sini"></textarea></div>';
    panel.appendChild(butang('Semak teks', 'butang-lembut butang-penuh', function () {
      terimaTeks(panel.querySelector('#sd-tampal').value.trim());
    }));

    var togol = butang('Atau tampal teks sandaran', 'butang-luar butang-penuh butang-kecil',
      function () {
        panel.classList.toggle('tersembunyi');
        if (!panel.classList.contains('tersembunyi')) { panel.querySelector('textarea').focus(); }
      });
    togol.style.marginTop = '8px';
    kotak.appendChild(togol);
    kotak.appendChild(panel);

    return kotak;
  }

  function terimaTeks(teks) {
    if (!teks) { CT.ui.toast('Tiada teks untuk disemak.'); return; }
    var hurai = s.huraiTeks(teks);
    if (hurai.ralat) { CT.ui.toast(hurai.ralat); return; }
    var semak = s.periksa(hurai.objek);
    if (!semak.sah) { CT.ui.toast(semak.sebab); return; }
    paparPratonton(hurai.objek);
  }

  /* ---------- Pratonton sebelum memulihkan ---------- */

  function paparPratonton(objek) {
    var kotak = el('div');

    var kepala = el('div', 'kad');
    kepala.appendChild(el('p', 'tebal', 'Fail sandaran'));
    var perinci = el('p', 'kecil');
    perinci.style.marginTop = '2px';
    perinci.innerHTML = 'Dibuat ' + u.selamat(u.capMasa(objek.dicipta)) +
      '<br>Versi aplikasi ' + u.selamat(objek.versiAplikasi || '-');
    kepala.appendChild(perinci);

    var banding = el('div', 'banding');
    var tajuk = el('div', 'banding-baris banding-kepala');
    tajuk.innerHTML = '<span></span><span>Dalam fail</span><span>Peranti ini</span>';
    banding.appendChild(tajuk);

    s.banding(objek).forEach(function (b) {
      var baris = el('div', 'banding-baris');
      baris.innerHTML = '<span>' + u.selamat(b.label) + '</span>' +
        '<span class="banding-nilai">' + b.fail + '</span>' +
        '<span class="banding-nilai banding-kini">' + b.peranti + '</span>';
      banding.appendChild(baris);
    });
    kepala.appendChild(banding);
    kotak.appendChild(kepala);

    /* Ganti */
    var kadGanti = el('div', 'kad');
    kadGanti.appendChild(el('p', 'tebal', 'Pulih penuh'));
    var notaGanti = el('p', 'kecil');
    notaGanti.style.marginTop = '2px';
    notaGanti.textContent = 'Data pada peranti ini dibuang dan digantikan ' +
      'sepenuhnya dengan data dalam fail. Guna cara ini pada telefon baharu, ' +
      'atau selepas data hilang.';
    kadGanti.appendChild(notaGanti);

    var masaSah = null;
    var bGanti = butang('Ganti semua data', 'butang-bahaya butang-penuh', function () {
      if (!masaSah) {
        masaSah = setTimeout(function () {
          masaSah = null;
          bGanti.textContent = 'Ganti semua data';
        }, 5000);
        bGanti.textContent = 'Tekan sekali lagi untuk mengesahkan';
        return;
      }
      clearTimeout(masaSah);
      masaSah = null;
      jalankan(objek, 'ganti');
    });
    bGanti.style.marginTop = '12px';
    kadGanti.appendChild(bGanti);
    kotak.appendChild(kadGanti);

    /* Gabung */
    var kadGabung = el('div', 'kad');
    kadGabung.appendChild(el('p', 'tebal', 'Gabung'));
    var notaGabung = el('p', 'kecil');
    notaGabung.style.marginTop = '2px';
    notaGabung.textContent = 'Hanya perkara yang tiada pada peranti ini ' +
      'ditambah. Apa yang sudah ada di sini tidak pernah ditimpa. Guna cara ' +
      'ini apabila dua telefon masing-masing memegang sebahagian rekod.';
    kadGabung.appendChild(notaGabung);

    var bGabung = butang('Gabung — tambah yang tiada sahaja', 'butang-lembut butang-penuh',
      function () { jalankan(objek, 'gabung'); });
    bGabung.style.marginTop = '12px';
    kadGabung.appendChild(bGabung);
    kotak.appendChild(kadGabung);

    var batal = butang('Batal', 'butang-luar butang-penuh', segar);
    batal.style.marginTop = '10px';
    kotak.appendChild(batal);

    var bekas = document.getElementById('lapisan-kandungan');
    bekas.innerHTML = '';
    bekas.appendChild(kotak);
    bekas.scrollTop = 0;
  }

  function jalankan(objek, mod) {
    var hasil = s.pulih(objek, mod);
    if (!hasil.berjaya) { CT.ui.toast(hasil.sebab); return; }

    CT.app.segarSemula();

    if (mod === 'gabung') {
      var r = hasil.ringkasan;
      tunjukHasil('baik', 'Digabungkan: ' + r.murid + ' murid baharu, ' +
        r.entri + ' rekod harian ditambah dalam ' + r.hari + ' hari baharu, ' +
        r.nota + ' nota, ' + r.acara + ' acara. Tiada data sedia ada ditimpa.');
    } else {
      tunjukHasil('baik', 'Data dipulihkan sepenuhnya daripada fail sandaran.');
    }
  }

  /* ---------- Titik undur ---------- */

  function kadUndur() {
    var titik = s.titikUndur();
    if (!titik) { return null; }

    var kotak = seksyen('Batalkan pemulihan terakhir');
    var nota = el('p', 'kecil');
    nota.style.marginTop = '2px';
    nota.textContent = 'Keadaan data sebelum pemulihan pada ' +
      u.capMasa(titik.dicipta) + ' masih disimpan pada peranti ini.';
    kotak.appendChild(nota);

    var baris = el('div', 'baris-lipat jarak-atas');
    baris.appendChild(butang('Kembali ke keadaan sebelum itu', 'butang-bahaya tumbuh',
      function () {
        var hasil = s.undur();
        if (!hasil.berjaya) { CT.ui.toast(hasil.sebab); return; }
        CT.app.segarSemula();
        tunjukHasil('baik', 'Pemulihan dibatalkan. Data kembali seperti sebelum itu.');
      }));
    baris.appendChild(butang('Buang titik undur', 'butang-luar tumbuh', function () {
      s.buangUndur();
      tunjukHasil('baik', 'Titik undur dibuang.');
    }));
    kotak.appendChild(baris);
    return kotak;
  }

  /* ---------- Tentang ---------- */

  function kadTentang() {
    var kotak = seksyen('Tentang e-Dawam');
    var teks = el('p', 'kecil');
    teks.style.marginTop = '2px';
    teks.innerHTML =
      'Versi ' + u.selamat(CT.VERSI || '-') + '<br>' +
      'Hakcipta &copy; Abu Dawud 2026<br><br>' +
      'Semua data disimpan dalam pelayar peranti ini sahaja. Tiada pelayan, ' +
      'tiada awan, dan tiada sesiapa selain pengguna peranti ini boleh ' +
      'melihatnya. Itulah sebabnya sandaran penting.';
    kotak.appendChild(teks);

    var privasi = el('p', 'kecil jarak-atas');
    privasi.innerHTML = '<b>Privasi:</b> fail sandaran ialah teks biasa yang ' +
      'mengandungi nama penuh, nombor matrik dan nombor telefon murid. ' +
      'Simpan dan hantarkannya dengan cermat.';
    kotak.appendChild(privasi);
    return kotak;
  }

  /* ---------- Susunan ---------- */

  function bina() {
    var kotak = el('div');

    if (mesejHasil) {
      var notis = el('div', 'notis notis-baik');
      notis.innerHTML = '<b>' + u.selamat(mesejHasil.teks) + '</b>';
      kotak.appendChild(notis);
      mesejHasil = null;
    }
    kotak.appendChild(kadStatus());

    kotak.appendChild(kadSandar());
    var undur = kadUndur();
    if (undur) { kotak.appendChild(undur); }
    kotak.appendChild(kadPulih());
    kotak.appendChild(kadSheet());
    kotak.appendChild(kadCsv());
    kotak.appendChild(kadTentang());
    return kotak;
  }

  function segar() {
    var bekas = document.getElementById('lapisan-kandungan');
    if (!bekas) { return; }
    bekas.innerHTML = '';
    bekas.appendChild(bina());
    CT.ui.hiasSemua(bekas);
    bekas.scrollTop = 0;
  }

  function buka() {
    mesejHasil = null;
    CT.ui.bukaLapisan('Tentang & Sandaran', bina());
  }

  return { buka: buka };
})();
