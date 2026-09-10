/* Lapisan "Eksport ke Sheet".

   Aliran yang guru lihat: pilih tempoh, lihat ringkasan apa yang akan dihantar,
   tekan sekali, dapat jawapan. Kegagalan sentiasa datang bersama butang
   "Cuba semula" — tiada jalan mati. */

window.CT = window.CT || {};

CT.eksport = (function () {
  'use strict';

  var u = CT.util;
  var s = CT.sheet;

  var tempohDipilih = 'minggu-ini';
  var tarikhDari = '';
  var tarikhHingga = '';
  var sedangHantar = false;
  var mesej = null;              // { jenis: 'baik'|'ralat', teks, perinci, cubaSemula }

  /* ---------- Bantuan ---------- */

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

  function kad(tajuk) {
    var kotak = el('div', 'kad');
    if (tajuk) { kotak.appendChild(el('p', 'tebal', tajuk)); }
    return kotak;
  }

  /* Tempoh yang sedang dipilih, dalam bentuk { dari, hingga, nama }. */
  function julatSemasa() {
    if (tempohDipilih === 'sendiri') {
      var dari = tarikhDari || s.tempoh('minggu-ini').dari;
      var hingga = tarikhHingga || s.tempoh('minggu-ini').hingga;
      if (dari > hingga) { var t = dari; dari = hingga; hingga = t; }
      return { dari: dari, hingga: hingga, nama: 'Tarikh pilihan' };
    }
    return s.tempoh(tempohDipilih);
  }

  /* ---------- Status eksport terakhir ---------- */

  function kadStatus() {
    var st = s.status();
    var kotak = el('div', 'notis ' + (st.pernah ? 'notis-baik' : 'notis-info'));
    if (!st.pernah) {
      kotak.innerHTML = '<b>Belum pernah dieksport.</b> Data e-Dawam belum ' +
        'pernah dihantar ke spreadsheet.';
    } else {
      kotak.innerHTML = '<b>' + u.selamat(st.teks) + '</b>' +
        (st.julat ? '<br>Tempoh: ' + u.selamat(u.tarikhRingkas(st.julat.split('..')[0])) +
          ' hingga ' + u.selamat(u.tarikhRingkas(st.julat.split('..')[1])) : '') +
        (st.bil ? '<br>' + st.bil + ' baris dikemas kini' : '');
    }
    return kotak;
  }

  /* ---------- Pilihan tempoh ---------- */

  function kadTempoh() {
    var kotak = kad('Tempoh data');
    var nota = el('p', 'kecil');
    nota.style.marginTop = '2px';
    nota.textContent = 'Pilih tempoh yang ingin dieksport sebelum menghantar.';
    kotak.appendChild(nota);

    var tapis = el('div', 'tapis jarak-atas');
    [
      ['minggu-ini', 'Minggu ini'],
      ['minggu-lepas', 'Minggu lepas'],
      ['semester', 'Semester'],
      ['sendiri', 'Pilih tarikh']
    ].forEach(function (x) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = x[1];
      if (tempohDipilih === x[0]) { b.classList.add('aktif'); }
      b.addEventListener('click', function () {
        tempohDipilih = x[0];
        mesej = null;
        segar();
      });
      tapis.appendChild(b);
    });
    kotak.appendChild(tapis);

    if (tempohDipilih === 'sendiri') {
      var lalai = s.tempoh('minggu-ini');
      var medan = el('div', 'medan-dua julat-medan jarak-atas');
      medan.innerHTML =
        '<div class="medan" style="margin-bottom:0">' +
        '<label for="ek-dari">Dari</label>' +
        '<input id="ek-dari" type="date" value="' +
        u.selamat(tarikhDari || lalai.dari) + '"></div>' +
        '<div class="medan" style="margin-bottom:0">' +
        '<label for="ek-hingga">Hingga</label>' +
        '<input id="ek-hingga" type="date" value="' +
        u.selamat(tarikhHingga || lalai.hingga) + '"></div>';
      medan.querySelector('#ek-dari').addEventListener('change', function () {
        tarikhDari = this.value; mesej = null; segar();
      });
      medan.querySelector('#ek-hingga').addEventListener('change', function () {
        tarikhHingga = this.value; mesej = null; segar();
      });
      kotak.appendChild(medan);
    }

    var julat = julatSemasa();
    var papar = el('p', 'kecil jarak-atas');
    papar.innerHTML = '<b>' + u.selamat(u.tarikhRingkas(julat.dari)) + '</b> hingga <b>' +
      u.selamat(u.tarikhRingkas(julat.hingga)) + '</b>';
    kotak.appendChild(papar);

    return kotak;
  }

  /* ---------- Ringkasan sebelum hantar ---------- */

  function kadPratonton() {
    var julat = julatSemasa();
    var p = s.pratonton(julat);
    var kotak = kad('Yang akan dihantar');

    var perinci = el('p', 'kecil');
    perinci.style.marginTop = '2px';
    perinci.innerHTML =
      '<b>' + p.murid + '</b> murid &middot; <b>' + p.adaData +
      '</b> ada rekod bacaan dalam tempoh ini<br>' +
      (p.minggu.length
        ? 'Lajur yang akan dikemas kini: <b>' +
          p.minggu.map(function (n) { return 'M' + n; }).join(', ') + '</b>' +
          ' (' + p.jumlahSel + ' sel)'
        : 'Tiada rekod bacaan dalam tempoh ini — tiada lajur M akan disentuh.');
    kotak.appendChild(perinci);

    if (p.tiadaMatrik || p.tiadaHalaqah) {
      var amaran = el('div', 'notis notis-cuti jarak-atas');
      var baris = [];
      if (p.tiadaMatrik) {
        baris.push('<b>' + p.tiadaMatrik + '</b> murid tiada nombor matrik. ' +
          'Baris dalam helaian dicari melalui nombor matrik, jadi mereka akan dilangkau.');
      }
      if (p.tiadaHalaqah) {
        baris.push('<b>' + p.tiadaHalaqah + '</b> murid belum ada halaqah. ' +
          'Kalau namanya belum ada dalam helaian, dia tidak dapat diletakkan.');
      }
      amaran.innerHTML = baris.join('<br><br>');
      kotak.appendChild(amaran);
    }

    var hantar = butang(sedangHantar ? 'Menghantar…' : 'Eksport ke Sheet',
      'butang-penuh', function () { jalankan(p.muatan); });
    hantar.style.marginTop = '12px';
    hantar.disabled = sedangHantar || !s.pautan();
    kotak.appendChild(hantar);

    if (!s.pautan()) {
      var perlu = el('p', 'kecil jarak-atas');
      perlu.textContent = 'Tetapkan pautan Apps Script di bawah dahulu.';
      kotak.appendChild(perlu);
    }

    var csv = butang('Muat turun CSV susunan helaian', 'butang-luar butang-penuh butang-kecil',
      function () {
        CT.sandaran.muatTurun('e-dawam-helaian-' + julat.dari + '-' + julat.hingga + '.csv',
          CT.sandaran.csvTeks(s.csvHelaian(julat)), 'text/csv;charset=utf-8');
        CT.ui.toast('CSV dimuat turun.');
      });
    csv.style.marginTop = '8px';
    kotak.appendChild(csv);

    return kotak;
  }

  /* ---------- Menjalankan eksport ---------- */

  function jalankan(muatan) {
    if (sedangHantar) { return; }
    sedangHantar = true;
    mesej = null;
    segar();

    s.eksport(muatan).then(function (hasil) {
      sedangHantar = false;
      var perinci = [];
      if (hasil.dikemaskini !== undefined) {
        perinci.push(hasil.dikemaskini + ' baris murid dikemas kini');
      }
      if (hasil.sel !== undefined) { perinci.push(hasil.sel + ' sel ditulis'); }
      if (hasil.tidakDijumpai && hasil.tidakDijumpai.length) {
        perinci.push('Tidak dijumpai dalam helaian: ' +
          hasil.tidakDijumpai.slice(0, 12).join(', ') +
          (hasil.tidakDijumpai.length > 12
            ? ' dan ' + (hasil.tidakDijumpai.length - 12) + ' lagi' : ''));
      }
      mesej = {
        jenis: 'baik',
        teks: 'Data berjaya dieksport ke sheet',
        perinci: perinci.join(' &middot; ')
      };
      segar();
    }, function (e) {
      sedangHantar = false;
      mesej = {
        jenis: 'ralat',
        teks: e.message,
        cubaSemula: function () { jalankan(muatan); }
      };
      segar();
    });
  }

  function kadMesej() {
    if (!mesej) { return null; }
    var kotak = el('div', 'notis ' + (mesej.jenis === 'baik' ? 'notis-baik' : 'notis-ralat'));
    kotak.innerHTML = '<b>' + u.selamat(mesej.teks) + '</b>' +
      (mesej.perinci ? '<br>' + mesej.perinci : '');
    if (mesej.cubaSemula) {
      var b = butang('Cuba semula', 'butang-luar butang-penuh butang-kecil', function () {
        var f = mesej.cubaSemula;
        mesej = null;
        f();
      });
      b.style.marginTop = '10px';
      kotak.appendChild(b);
    }
    return kotak;
  }

  /* ---------- Tetapan pautan ---------- */

  function kadTetapan() {
    var kotak = kad('Pautan spreadsheet');
    var nota = el('p', 'kecil');
    nota.style.marginTop = '2px';
    nota.innerHTML = 'Pautan Web App Apps Script yang dipasang pada spreadsheet ' +
      'laporan. Ia disimpan pada peranti ini sahaja.';
    kotak.appendChild(nota);

    var medan = el('div', 'medan jarak-atas');
    medan.style.marginBottom = '0';
    medan.innerHTML =
      '<label for="ek-pautan">Pautan Apps Script</label>' +
      '<input id="ek-pautan" type="url" inputmode="url" autocomplete="off" ' +
      'placeholder="https://script.google.com/macros/s/.../exec" value="' +
      u.selamat(s.pautan()) + '">';
    kotak.appendChild(medan);

    var baris = el('div', 'baris-lipat jarak-atas');
    baris.appendChild(butang('Simpan pautan', 'butang-lembut tumbuh', function () {
      var hasil = s.simpanPautan(kotak.querySelector('#ek-pautan').value);
      if (!hasil.berjaya) { CT.ui.toast(hasil.sebab); return; }
      CT.ui.toast('Pautan disimpan.');
      segar();
    }));
    baris.appendChild(butang('Uji sambungan', 'butang-luar tumbuh', function () {
      if (!s.pautan()) { CT.ui.toast('Simpan pautan dahulu.'); return; }
      CT.ui.toast('Menguji sambungan…');
      s.uji().then(function (hasil) {
        mesej = {
          jenis: 'baik',
          teks: 'Sambungan berjaya',
          perinci: hasil.helaian && hasil.helaian.length
            ? 'Helaian dijumpai: ' + hasil.helaian.join(', ')
            : ''
        };
        segar();
      }, function (e) {
        mesej = { jenis: 'ralat', teks: e.message };
        segar();
      });
    }));
    kotak.appendChild(baris);

    var panduan = el('p', 'kecil jarak-atas');
    panduan.innerHTML = 'Cara memasang: buka spreadsheet &rarr; ' +
      '<b>Extensions &rarr; Apps Script</b> &rarr; tampal fail ' +
      '<b>apps-script-edawam.gs</b> daripada projek e-Dawam &rarr; ' +
      '<b>Deploy &rarr; New deployment &rarr; Web app</b>, ' +
      'tetapkan <b>Execute as: Me</b> dan <b>Who has access: Anyone with the link</b>, ' +
      'kemudian salin pautan yang berakhir dengan <b>/exec</b>.';
    kotak.appendChild(panduan);

    return kotak;
  }

  /* ---------- Susunan ---------- */

  function bina() {
    var kotak = el('div');
    var m = kadMesej();
    if (m) { kotak.appendChild(m); }
    kotak.appendChild(kadStatus());
    kotak.appendChild(kadTempoh());
    kotak.appendChild(kadPratonton());
    kotak.appendChild(kadTetapan());
    return kotak;
  }

  function segar() {
    var bekas = document.getElementById('lapisan-kandungan');
    if (!bekas) { return; }
    var tatal = bekas.scrollTop;
    bekas.innerHTML = '';
    bekas.appendChild(bina());
    CT.ui.hiasSemua(bekas);
    bekas.scrollTop = tatal;
  }

  function buka(pilihanTempoh) {
    if (pilihanTempoh) { tempohDipilih = pilihanTempoh; }
    mesej = null;
    sedangHantar = false;
    CT.ui.bukaLapisan('Eksport ke Sheet', bina());
  }

  return { buka: buka };
})();
