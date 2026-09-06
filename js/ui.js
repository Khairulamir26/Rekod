/* e-Dawam — komponen antara muka yang dikongsi (toast, lapisan, pemilih tarikh). */

window.CT = window.CT || {};

(function () {
  'use strict';

  var u = CT.util;
  var masaToast = null;

  function toast(mesej) {
    var kotak = document.getElementById('toast');
    if (!kotak) { return; }
    kotak.textContent = mesej;
    kotak.classList.remove('tersembunyi');
    clearTimeout(masaToast);
    masaToast = setTimeout(function () { kotak.classList.add('tersembunyi'); }, 2600);
  }

  /* ---------- Lapisan (tetingkap bertindan) ---------- */
  var tutupTerakhir = null;

  function bukaLapisan(tajuk, kandungan, bilaTutup) {
    var lapisan = document.getElementById('lapisan');
    document.getElementById('lapisan-tajuk').textContent = tajuk;
    var kotak = document.getElementById('lapisan-kandungan');
    kotak.innerHTML = '';
    if (typeof kandungan === 'string') { kotak.innerHTML = kandungan; }
    else if (kandungan) { kotak.appendChild(kandungan); }
    hiasSemua(kotak);
    lapisan.classList.remove('tersembunyi');
    tutupTerakhir = bilaTutup || null;
    kotak.scrollTop = 0;
    return kotak;
  }

  function tutupLapisan() {
    document.getElementById('lapisan').classList.add('tersembunyi');
    document.getElementById('lapisan-kandungan').innerHTML = '';
    if (tutupTerakhir) { var f = tutupTerakhir; tutupTerakhir = null; f(); }
  }

  function sahkan(tajuk, mesej, bilaSetuju, labelSetuju) {
    var kotak = document.createElement('div');
    kotak.innerHTML =
      '<p class="kecil" style="margin-bottom:16px">' + u.selamat(mesej) + '</p>' +
      '<div class="baris-lipat">' +
      '<button class="butang butang-bahaya tumbuh" data-ya>' +
      u.selamat(labelSetuju || 'Ya, teruskan') + '</button>' +
      '<button class="butang butang-luar tumbuh" data-tidak>Batal</button>' +
      '</div>';
    kotak.querySelector('[data-ya]').addEventListener('click', function () {
      tutupLapisan();
      bilaSetuju();
    });
    kotak.querySelector('[data-tidak]').addEventListener('click', tutupLapisan);
    bukaLapisan(tajuk, kotak);
  }

  /* Pelayar memaparkan <input type="date"> dan <input type="time"> mengikut
     tetapan tempatan peranti (kadangkala MM/DD/YYYY atau 24 jam). Lapisan ini
     menutup paparan asal dengan format Malaysia — tarikh DD/MM/YYYY dan masa
     12 jam AM/PM — sambil mengekalkan pemilih asli peranti. */
  function hiasMedan(medan, format, kosongTeks) {
    var bekas = document.createElement('span');
    bekas.className = 'medan-hias';
    medan.parentNode.insertBefore(bekas, medan);
    bekas.appendChild(medan);

    var papar = document.createElement('span');
    papar.className = 'medan-papar';
    bekas.appendChild(papar);

    function segar() {
      papar.textContent = medan.value ? format(medan.value) : (kosongTeks || 'Pilih');
    }
    medan.addEventListener('change', segar);
    medan.addEventListener('input', segar);
    segar();
    medan.segarPaparan = segar;
    return bekas;
  }

  function hiasTarikh(medan) {
    return hiasMedan(medan, u.tarikhRingkas, 'Pilih tarikh');
  }

  function hiasMasa(medan) {
    return hiasMedan(medan, u.masa12, 'Pilih masa');
  }

  /* Hias semua medan tarikh/masa dalam sesuatu bekas. */
  function hiasSemua(bekas) {
    bekas.querySelectorAll('input[type="date"]').forEach(hiasTarikh);
    bekas.querySelectorAll('input[type="time"]').forEach(hiasMasa);
    return bekas;
  }

  /* ---------- Pemilih tarikh dengan butang hari sebelum / berikutnya ---------- */
  function pemilihTarikh(tarikh, bilaTukar, pilihan) {
    pilihan = pilihan || {};
    var kotak = document.createElement('div');
    kotak.className = 'kad';
    kotak.innerHTML =
      '<div class="pilih-tarikh">' +
      '<button class="butang-ikon" type="button" data-sebelum aria-label="Hari sebelumnya">&lsaquo;</button>' +
      '<input type="date" value="' + u.selamat(tarikh) + '" aria-label="Pilih tarikh">' +
      '<button class="butang-ikon" type="button" data-selepas aria-label="Hari berikutnya">&rsaquo;</button>' +
      '</div>' +
      '<div class="baris-antara jarak-atas">' +
      '<p class="kecil tebal" data-teks-tarikh>' + u.selamat(u.tarikhPenuh(tarikh)) + '</p>' +
      '<button class="butang butang-lembut butang-kecil" type="button" data-hari-ini>Hari Ini</button>' +
      '</div>' +
      (pilihan.tambahan || '');

    var medan = kotak.querySelector('input[type="date"]');
    hiasTarikh(medan);

    function tukar(baru) {
      if (!u.sahKunci(baru)) { return; }
      medan.value = baru;
      if (medan.segarPaparan) { medan.segarPaparan(); }
      kotak.querySelector('[data-teks-tarikh]').textContent = u.tarikhPenuh(baru);
      bilaTukar(baru);
    }

    kotak.querySelector('[data-sebelum]').addEventListener('click', function () {
      tukar(u.tambahHari(medan.value || u.hariIni(), -1));
    });
    kotak.querySelector('[data-selepas]').addEventListener('click', function () {
      tukar(u.tambahHari(medan.value || u.hariIni(), 1));
    });
    kotak.querySelector('[data-hari-ini]').addEventListener('click', function () {
      tukar(u.hariIni());
    });
    medan.addEventListener('change', function () {
      if (u.sahKunci(medan.value)) { tukar(medan.value); }
      else { medan.value = tarikh; }
    });

    return kotak;
  }

  /* ---------- Notis cuti ---------- */
  function notisCuti(tarikh) {
    var senarai = CT.cuti.cutiPada(tarikh);
    if (!senarai.length) { return null; }
    var kotak = document.createElement('div');
    kotak.className = 'notis notis-cuti';
    kotak.innerHTML = '<b>Cuti umum:</b> ' + senarai.map(function (c) {
      return u.selamat(c.nama) + (c.anggaran ? ' <span class="lencana lencana-emas">anggaran</span>' : '');
    }).join(', ');
    return kotak;
  }

  function kosong(tajuk, mesej, butang) {
    var kotak = document.createElement('div');
    kotak.className = 'kosong-kotak';
    kotak.innerHTML = '<b>' + u.selamat(tajuk) + '</b><span class="kecil">' +
      u.selamat(mesej) + '</span>';
    if (butang) { kotak.appendChild(butang); }
    return kotak;
  }

  function pilihanNombor(dari, hingga, nilai) {
    var html = '';
    for (var i = dari; i <= hingga; i++) {
      html += '<option value="' + i + '"' + (String(nilai) === String(i) ? ' selected' : '') +
        '>' + i + '</option>';
    }
    return html;
  }

  function el(html) {
    var bekas = document.createElement('div');
    bekas.innerHTML = html.trim();
    return bekas.firstElementChild;
  }

  CT.ui = {
    toast: toast,
    bukaLapisan: bukaLapisan,
    tutupLapisan: tutupLapisan,
    sahkan: sahkan,
    hiasTarikh: hiasTarikh,
    hiasMasa: hiasMasa,
    hiasSemua: hiasSemua,
    pemilihTarikh: pemilihTarikh,
    notisCuti: notisCuti,
    kosong: kosong,
    pilihanNombor: pilihanNombor,
    el: el
  };
})();
