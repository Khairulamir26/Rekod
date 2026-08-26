/* Tab Kalendar — kalendar bulanan aktif.
   Menggabungkan cuti Persekutuan + Kuala Lumpur + Selangor secara automatik
   (tiada pemilih negeri dipaparkan). Rekod murid tidak disenaraikan di sini
   kerana ia mempunyai tab sendiri. */

window.CT = window.CT || {};
CT.views = CT.views || {};

CT.views.kalendar = (function () {
  'use strict';

  var u = CT.util;
  var pilih = null;   // tarikh dipilih
  var lihat = null;   // { tahun, bulan }

  function pastikanKeadaan(param) {
    if (param && param.tarikh && u.sahKunci(param.tarikh)) { pilih = param.tarikh; }
    if (!pilih) { pilih = u.hariIni(); }
    var p = u.pecah(pilih);
    if (!lihat || (param && param.tarikh)) { lihat = { tahun: p.tahun, bulan: p.bulan }; }
  }

  function tukarBulan(langkah) {
    var bulan = lihat.bulan + langkah;
    var tahun = lihat.tahun;
    while (bulan > 12) { bulan -= 12; tahun++; }
    while (bulan < 1) { bulan += 12; tahun--; }
    lihat = { tahun: tahun, bulan: bulan };
    CT.app.segarSemula();
  }

  function tandaTarikh() {
    var tanda = {};
    CT.store.tarikhAdaRekod().forEach(function (t) {
      tanda[t] = tanda[t] || {};
      tanda[t].rekod = true;
    });
    CT.store.tarikhAdaAcara().forEach(function (t) {
      tanda[t] = tanda[t] || {};
      tanda[t].acara = true;
    });
    return tanda;
  }

  function gridBulan() {
    var kad = document.createElement('div');
    kad.className = 'kad';

    var kepala = document.createElement('div');
    kepala.className = 'kal-kepala';
    kepala.innerHTML =
      '<button class="butang-ikon" type="button" data-bulan-sebelum aria-label="Bulan sebelumnya">&lsaquo;</button>' +
      '<span class="kal-bulan">' + u.namaBulan(lihat.bulan) + ' ' + lihat.tahun + '</span>' +
      '<button class="butang-ikon" type="button" data-bulan-selepas aria-label="Bulan berikutnya">&rsaquo;</button>';
    kepala.querySelector('[data-bulan-sebelum]').addEventListener('click', function () { tukarBulan(-1); });
    kepala.querySelector('[data-bulan-selepas]').addEventListener('click', function () { tukarBulan(1); });
    kad.appendChild(kepala);

    var grid = document.createElement('div');
    grid.className = 'kal-grid';

    u.HARI_PENDEK.forEach(function (h) {
      var sel = document.createElement('div');
      sel.className = 'kal-nama';
      sel.textContent = h;
      grid.appendChild(sel);
    });

    var pertama = u.bina(lihat.tahun, lihat.bulan, 1);
    var mula = u.hariMinggu(pertama);
    var hariDalamBulan = new Date(Date.UTC(lihat.tahun, lihat.bulan, 0)).getUTCDate();
    var tanda = tandaTarikh();
    var ini = u.hariIni();

    for (var kosong = 0; kosong < mula; kosong++) {
      var lompang = document.createElement('div');
      lompang.className = 'kal-sel luar';
      grid.appendChild(lompang);
    }

    for (var hari = 1; hari <= hariDalamBulan; hari++) {
      (function (hari) {
        var kunci = u.bina(lihat.tahun, lihat.bulan, hari);
        var sel = document.createElement('button');
        sel.type = 'button';
        sel.className = 'kal-sel';
        if (kunci === ini) { sel.classList.add('hari-ini'); }
        if (kunci === pilih) { sel.classList.add('pilih'); }
        var adaCuti = CT.cuti.adaCuti(kunci);
        if (adaCuti) { sel.classList.add('cuti'); }

        var titik = '';
        if (tanda[kunci] && tanda[kunci].rekod) { titik += '<i class="t-rekod"></i>'; }
        if (tanda[kunci] && tanda[kunci].acara) { titik += '<i class="t-acara"></i>'; }
        if (adaCuti) { titik += '<i class="t-cuti"></i>'; }

        sel.innerHTML = '<span>' + hari + '</span><span class="kal-titik">' + titik + '</span>';
        sel.setAttribute('aria-label', u.tarikhPenuh(kunci));
        sel.addEventListener('click', function () {
          pilih = kunci;
          CT.app.segarSemula();
        });
        grid.appendChild(sel);
      })(hari);
    }

    kad.appendChild(grid);

    var petunjuk = document.createElement('div');
    petunjuk.className = 'petunjuk';
    petunjuk.innerHTML =
      '<span><i class="t-rekod"></i> Ada rekod murid</span>' +
      '<span><i class="t-acara"></i> Ada acara</span>' +
      '<span><i class="t-cuti"></i> Cuti umum</span>';
    kad.appendChild(petunjuk);

    return kad;
  }

  /* ---------- Borang acara ---------- */
  function borangAcara(sedia) {
    var a = sedia || {};
    var kotak = document.createElement('div');
    kotak.innerHTML =
      '<p class="kecil tebal" style="margin-bottom:12px">' + u.selamat(u.tarikhPenuh(pilih)) + '</p>' +
      '<div class="medan"><label for="a-tajuk">Tajuk acara</label>' +
      '<input id="a-tajuk" type="text" value="' + u.selamat(a.tajuk || '') +
      '" placeholder="Contoh: Ujian hafazan juz 1"></div>' +
      '<div class="medan-dua">' +
      '<div class="medan"><label for="a-jenis">Jenis</label><select id="a-jenis">' +
      ['Aktiviti kelas', 'Tugasan', 'Mesyuarat', 'Lain-lain'].map(function (j) {
        return '<option' + (a.jenis === j ? ' selected' : '') + '>' + j + '</option>';
      }).join('') + '</select></div>' +
      '<div class="medan"><label for="a-masa">Masa</label>' +
      '<input id="a-masa" type="time" value="' + u.selamat(a.masa || '08:00') + '"></div>' +
      '</div>' +
      '<div class="medan"><label for="a-catatan">Catatan</label>' +
      '<textarea id="a-catatan" placeholder="Butiran tambahan (pilihan)">' +
      u.selamat(a.catatan || '') + '</textarea></div>' +
      '<button class="butang butang-penuh" type="button" data-simpan>Simpan acara</button>' +
      (a.id ? '<button class="butang butang-bahaya butang-penuh jarak-atas" type="button" data-padam>Padam acara</button>' : '');

    kotak.querySelector('[data-simpan]').addEventListener('click', function () {
      var tajuk = kotak.querySelector('#a-tajuk').value.trim();
      if (!tajuk) { CT.ui.toast('Sila isi tajuk acara.'); return; }
      CT.store.simpanAcara(pilih, {
        id: a.id,
        tajuk: tajuk,
        jenis: kotak.querySelector('#a-jenis').value,
        masa: kotak.querySelector('#a-masa').value,
        catatan: kotak.querySelector('#a-catatan').value.trim()
      });
      CT.ui.tutupLapisan();
      CT.ui.toast('Acara disimpan.');
      CT.app.segarSemula();
    });

    if (a.id) {
      kotak.querySelector('[data-padam]').addEventListener('click', function () {
        CT.store.padamAcara(pilih, a.id);
        CT.ui.tutupLapisan();
        CT.ui.toast('Acara dipadam.');
        CT.app.segarSemula();
      });
    }
    return kotak;
  }

  /* ---------- Panel tarikh dipilih ---------- */
  function panelTarikh() {
    var kad = document.createElement('div');
    kad.className = 'kad jarak-atas';

    var kepala = document.createElement('div');
    kepala.className = 'baris-antara';
    kepala.innerHTML =
      '<span class="tumbuh"><span class="tebal">' + u.selamat(u.tarikhPenuh(pilih)) + '</span><br>' +
      '<span class="kecil">' + u.selamat(u.tarikhRingkas(pilih)) + '</span></span>' +
      '<button class="butang butang-lembut butang-kecil" type="button" data-hari-ini>Hari Ini</button>';
    kepala.querySelector('[data-hari-ini]').addEventListener('click', function () {
      pilih = u.hariIni();
      var p = u.pecah(pilih);
      lihat = { tahun: p.tahun, bulan: p.bulan };
      CT.app.segarSemula();
    });
    kad.appendChild(kepala);

    var cuti = CT.ui.notisCuti(pilih);
    if (cuti) { cuti.classList.add('jarak-atas'); kad.appendChild(cuti); }

    var acara = CT.store.acaraTarikh(pilih);
    var senarai = document.createElement('div');
    senarai.className = 'jarak-atas';

    if (!acara.length) {
      senarai.innerHTML = '<p class="kecil kosong">Tiada acara pada tarikh ini.</p>';
    } else {
      acara.forEach(function (a) {
        var baris = document.createElement('div');
        baris.className = 'acara-baris';
        baris.innerHTML =
          '<span class="acara-masa">' + u.selamat(u.masa12(a.masa) || '-') + '</span>' +
          '<span class="tumbuh"><span class="tebal">' + u.selamat(a.tajuk) + '</span><br>' +
          '<span class="lencana lencana-kelabu">' + u.selamat(a.jenis || 'Lain-lain') + '</span>' +
          (a.catatan ? '<br><span class="kecil">' + u.selamat(a.catatan) + '</span>' : '') +
          '</span>' +
          '<button class="butang butang-luar butang-kecil" type="button" data-sunting>Sunting</button>';
        baris.querySelector('[data-sunting]').addEventListener('click', function () {
          CT.ui.bukaLapisan('Sunting Acara', borangAcara(a));
        });
        senarai.appendChild(baris);
      });
    }
    kad.appendChild(senarai);

    var tambah = document.createElement('button');
    tambah.type = 'button';
    tambah.className = 'butang butang-penuh jarak-atas';
    tambah.textContent = '+ Tambah Acara';
    tambah.addEventListener('click', function () {
      CT.ui.bukaLapisan('Tambah Acara', borangAcara(null));
    });
    kad.appendChild(tambah);

    var kePeringkat = document.createElement('div');
    kePeringkat.className = 'baris-lipat jarak-atas';
    kePeringkat.innerHTML =
      '<button class="butang butang-lembut tumbuh" type="button" data-kehadiran>Kehadiran tarikh ini</button>' +
      '<button class="butang butang-lembut tumbuh" type="button" data-rekod>Rekod tarikh ini</button>';
    kePeringkat.children[0].addEventListener('click', function () {
      CT.app.pergi('kehadiran', { tarikh: pilih });
    });
    kePeringkat.children[1].addEventListener('click', function () {
      CT.app.pergi('rekod', { tarikh: pilih });
    });
    kad.appendChild(kePeringkat);

    return kad;
  }

  /* ---------- Bar penyegerakan ---------- */
  function barSegerak() {
    var kad = document.createElement('div');
    kad.className = 'kad kad-rapat jarak-atas';

    var status = CT.cuti.statusSegerak(lihat.tahun);
    var teks = status.sumber === 'segerak'
      ? 'Cuti umum disegerakkan pada ' + u.capMasa(status.masa)
      : 'Menggunakan data cuti luar talian.';

    kad.innerHTML =
      '<div class="baris-antara">' +
      '<span class="kecil tumbuh" data-status>' + u.selamat(teks) + '</span>' +
      '<button class="butang butang-luar butang-kecil" type="button" data-segerak>Segerak</button>' +
      '</div>';

    var butang = kad.querySelector('[data-segerak]');
    butang.addEventListener('click', function () {
      butang.disabled = true;
      butang.textContent = 'Menyegerak...';
      CT.cuti.segerak(lihat.tahun, true).then(function (hasil) {
        if (hasil.status === 'ok') {
          CT.ui.toast('Kalendar cuti dikemas kini (' + hasil.bilangan + ' cuti).');
          CT.app.segarSemula();
        } else if (hasil.status === 'luar-talian') {
          CT.ui.toast('Tiada internet. Data luar talian digunakan.');
          butang.disabled = false;
          butang.textContent = 'Segerak';
        } else {
          CT.ui.toast('Penyegerakan gagal. Data luar talian digunakan.');
          butang.disabled = false;
          butang.textContent = 'Segerak';
        }
      });
    });
    return kad;
  }

  function render(skrin, param) {
    pastikanKeadaan(param);
    skrin.appendChild(gridBulan());
    skrin.appendChild(panelTarikh());
    skrin.appendChild(barSegerak());

    // Cuba segerak senyap sekali bagi tahun yang dilihat.
    CT.cuti.segerak(lihat.tahun, false).then(function (hasil) {
      if (hasil.status === 'ok') { CT.app.segarSemula(); }
    });
  }

  return { tajuk: 'Kalendar', render: render };
})();
