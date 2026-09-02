/* Tab Rekod — lihat dan kemas kini rekod setiap murid mengikut tarikh dipilih.
   Setiap tarikh disimpan berasingan: mengubah rekod satu tarikh tidak menyentuh
   rekod tarikh lain. */

window.CT = window.CT || {};
CT.views = CT.views || {};

CT.views.rekod = (function () {
  'use strict';

  var u = CT.util;
  var tarikh = null;

  function labelKehadiran(nilai) {
    if (nilai === 'hadir') { return '<span class="lencana">Hadir</span>'; }
    if (nilai === 'tidak') { return '<span class="lencana lencana-merah">Tidak hadir</span>'; }
    return '<span class="lencana lencana-kelabu">Belum direkod</span>';
  }

  function labelMaklum(maklum) {
    if (maklum === 'dimaklum') { return '<span class="lencana">Dimaklum</span>'; }
    if (maklum === 'tidak-dimaklum') { return '<span class="lencana lencana-merah">Tidak dimaklum</span>'; }
    return '<span class="lencana lencana-kelabu">Maklum belum ditanda</span>';
  }

  /* ---------- Borang kemas kini seorang murid ---------- */
  function borang(murid) {
    var r = CT.store.rekodMurid(tarikh, murid.id) || {};
    var hadir = CT.store.kehadiranTarikh(tarikh)[murid.id] || '';
    var nota = CT.store.notaHarian(tarikh, murid.id);

    /* Sambungan hafazan: jika belum ada muka surat direkod pada tarikh ini,
       teruskan daripada muka surat habis kali terakhir sebelum tarikh ini.
       Contoh: habis 487 pada 28/08 -> mula 488 pada rekod berikutnya. */
    var sambung = null;
    if (!r.mukaMula && !r.mukaHabis) {
      sambung = CT.sukatan.cadanganSambungan(murid.id, tarikh);
    }
    var nilaiMula = r.mukaMula || (sambung ? sambung.mula : '');
    // Juz sentiasa mengikut muka surat mula apabila muka surat itu ada.
    var nilaiJuz = CT.sukatan.juzUntukHalaman(nilaiMula) || r.juz || '';

    var kotak = document.createElement('div');
    kotak.innerHTML =
      '<p class="kecil tebal" style="margin-bottom:4px">' + u.selamat(murid.nama) + '</p>' +
      '<p class="kecil" style="margin-bottom:14px">' + u.selamat(u.tarikhPenuh(tarikh)) + '</p>' +

      '<div class="medan"><label>Kehadiran</label>' +
      '<div class="segmen">' +
      '<button type="button" data-hadir="hadir">Hadir</button>' +
      '<button type="button" data-hadir="tidak">Tidak hadir</button>' +
      '</div>' +
      '<div class="hadir-butiran tersembunyi" data-butiran>' +
      '<span class="segmen segmen-maklum">' +
      '<button type="button" data-maklum="dimaklum">Dimaklum</button>' +
      '<button type="button" data-maklum="tidak-dimaklum">Tidak dimaklum</button>' +
      '</span>' +
      '<input type="text" class="nota-tidak-hadir" id="r-nota-tidak" maxlength="200" ' +
      'placeholder="Nota ketidakhadiran (pilihan)" aria-label="Nota ketidakhadiran">' +
      '</div></div>' +

      '<div class="medan-dua">' +
      '<div class="medan"><label for="r-mula">Muka surat hafazan mula</label>' +
      '<input id="r-mula" type="number" min="1" max="604" inputmode="numeric" value="' +
      u.selamat(nilaiMula) + '" placeholder="Contoh: 12"></div>' +
      '<div class="medan"><label for="r-habis">Muka surat hafazan habis</label>' +
      '<input id="r-habis" type="number" min="1" max="604" inputmode="numeric" value="' +
      u.selamat(r.mukaHabis || '') + '" placeholder="Contoh: 14"></div>' +
      '</div>' +

      /* Juz diletakkan selepas muka surat kerana ia dikira daripada
         nombor muka surat, bukan dipilih dahulu. */
      '<div class="medan"><label for="r-juz">Juz</label><select id="r-juz">' +
      '<option value="">Juz belum direkod</option>' +
      CT.ui.pilihanNombor(1, 30, nilaiJuz) + '</select>' +
      '<p class="kecil" data-juz-nota style="margin-top:6px"></p></div>' +

      (sambung
        ? '<div class="notis notis-info" style="margin-bottom:12px">' +
          'Sambungan automatik: kali terakhir habis di muka surat <b>' +
          sambung.dariHalaman + '</b> pada ' + u.selamat(u.tarikhRingkas(sambung.dariTarikh)) +
          ', jadi mula diletakkan di <b>' + sambung.mula + '</b>' +
          (sambung.juz ? ' (Juz ' + sambung.juz + ')' : '') +
          '. Boleh diubah jika perlu.</div>'
        : '') +

      '<div class="medan"><label for="r-nota">Nota harian</label>' +
      '<textarea id="r-nota" placeholder="Catatan guru untuk tarikh ini">' +
      u.selamat(nota ? nota.teks : '') + '</textarea></div>' +

      '<div class="semak"><input type="checkbox" id="r-kongsi"' +
      (nota && nota.kongsi ? ' checked' : '') + '>' +
      '<label for="r-kongsi">Kongsi nota ini dengan jabatan</label></div>' +

      '<button class="butang butang-penuh" type="button" data-simpan>Simpan rekod</button>';

    var pilihanHadir = hadir;
    var butang = kotak.querySelectorAll('[data-hadir]');
    var butiranSedia = CT.store.butiranMurid(tarikh, murid.id) || {};
    var pilihanMaklum = butiranSedia.maklum || '';
    var kotakButiran = kotak.querySelector('[data-butiran]');
    var butangMaklum = kotak.querySelectorAll('[data-maklum]');
    var medanNotaTidak = kotak.querySelector('#r-nota-tidak');
    medanNotaTidak.value = butiranSedia.nota || '';

    function segarHadir() {
      Array.prototype.forEach.call(butang, function (b) {
        var nilai = b.getAttribute('data-hadir');
        b.classList.toggle('pilih-hadir', pilihanHadir === 'hadir' && nilai === 'hadir');
        b.classList.toggle('pilih-tidak', pilihanHadir === 'tidak' && nilai === 'tidak');
      });
      kotakButiran.classList.toggle('tersembunyi', pilihanHadir !== 'tidak');
      Array.prototype.forEach.call(butangMaklum, function (x) {
        x.classList.toggle('pilih-maklum', pilihanMaklum === x.getAttribute('data-maklum'));
      });
    }
    Array.prototype.forEach.call(butang, function (b) {
      b.addEventListener('click', function () {
        var nilai = b.getAttribute('data-hadir');
        pilihanHadir = pilihanHadir === nilai ? '' : nilai;
        segarHadir();
      });
    });
    Array.prototype.forEach.call(butangMaklum, function (x) {
      x.addEventListener('click', function () {
        var nilai = x.getAttribute('data-maklum');
        pilihanMaklum = pilihanMaklum === nilai ? '' : nilai;
        segarHadir();
      });
    });
    segarHadir();

    /* Juz dikira automatik daripada nombor muka surat: halaman 24 -> Juz 2,
       halaman 179 -> Juz 9. Guru masih boleh menukarnya secara manual selepas
       itu; ia hanya dikira semula apabila nombor muka surat diubah. */
    var medanMula = kotak.querySelector('#r-mula');
    var medanHabis = kotak.querySelector('#r-habis');
    var medanJuz = kotak.querySelector('#r-juz');
    var notaJuz = kotak.querySelector('[data-juz-nota]');

    function kiraJuz() {
      var mula = +medanMula.value;
      var habis = +medanHabis.value;
      var juzMula = CT.sukatan.juzUntukHalaman(mula);
      var juzHabis = CT.sukatan.juzUntukHalaman(habis);

      if (juzMula) { medanJuz.value = String(juzMula); }
      else if (juzHabis) { medanJuz.value = String(juzHabis); }

      if (!juzMula && !juzHabis) {
        notaJuz.textContent = 'Dikira automatik apabila muka surat diisi.';
      } else if (juzHabis && juzMula && juzHabis !== juzMula) {
        notaJuz.textContent = 'Bacaan ini merentasi Juz ' + juzMula + ' hingga Juz ' +
          juzHabis + '. Juz direkod sebagai ' + medanJuz.value + '.';
      } else {
        notaJuz.textContent = 'Dikira automatik daripada muka surat ' +
          (mula || habis) + '.';
      }
    }

    medanMula.addEventListener('input', kiraJuz);
    medanHabis.addEventListener('input', kiraJuz);
    medanJuz.addEventListener('change', function () {
      notaJuz.textContent = medanJuz.value
        ? 'Ditetapkan manual kepada Juz ' + medanJuz.value + '.'
        : 'Dikira automatik apabila muka surat diisi.';
    });
    kiraJuz();

    kotak.querySelector('[data-simpan]').addEventListener('click', function () {
      var mula = kotak.querySelector('#r-mula').value.trim();
      var habis = kotak.querySelector('#r-habis').value.trim();

      if (mula && habis && +habis < +mula) {
        CT.ui.toast('Muka surat habis mesti sama atau lebih besar daripada muka surat mula.');
        return;
      }

      // Kehadiran: hanya murid ini pada tarikh ini disentuh.
      var peta = Object.assign({}, CT.store.kehadiranTarikh(tarikh));
      if (pilihanHadir) { peta[murid.id] = pilihanHadir; }
      else { delete peta[murid.id]; }
      CT.store.simpanKehadiran(tarikh, peta);

      // Butiran dimaklum/nota hanya disimpan untuk murid yang tidak hadir.
      var notaTidak = medanNotaTidak.value.trim();
      if (pilihanHadir === 'tidak' && (pilihanMaklum || notaTidak)) {
        var simpanButiran = {};
        if (pilihanMaklum) { simpanButiran.maklum = pilihanMaklum; }
        if (notaTidak) { simpanButiran.nota = notaTidak; }
        CT.store.simpanButiranMurid(tarikh, murid.id, simpanButiran);
      } else {
        CT.store.simpanButiranMurid(tarikh, murid.id, null);
      }

      CT.store.simpanRekodMurid(tarikh, murid.id, {
        juz: kotak.querySelector('#r-juz').value ? +kotak.querySelector('#r-juz').value : null,
        mukaMula: mula ? +mula : null,
        mukaHabis: habis ? +habis : null
      });

      var guru = CT.store.guruAktif();
      CT.store.simpanNotaHarian(tarikh, murid.id,
        kotak.querySelector('#r-nota').value,
        kotak.querySelector('#r-kongsi').checked,
        guru ? guru.id : null);

      CT.ui.tutupLapisan();
      CT.ui.toast('Rekod ' + u.tarikhRingkas(tarikh) + ' disimpan.');
      CT.app.segarSemula();
    });

    return kotak;
  }

  function kadRekod(murid) {
    var r = CT.store.rekodMurid(tarikh, murid.id) || {};
    var hadir = CT.store.kehadiranTarikh(tarikh)[murid.id] || '';
    var butiran = CT.store.butiranMurid(tarikh, murid.id) || {};
    // Nota harian sengaja tidak dipaparkan di sini; ia hanya dalam borang
    // "Kemas kini" dan dalam tab Nota.
    var sambungKad = (!r.mukaMula && !r.mukaHabis)
      ? CT.sukatan.cadanganSambungan(murid.id, tarikh)
      : null;

    var kad = document.createElement('div');
    kad.className = 'rekod-kad';
    kad.innerHTML =
      '<div class="baris">' +
      '<span class="tumbuh"><span class="murid-nama">' + u.selamat(murid.nama) + '</span><br>' +
      '<span class="kecil">' + u.selamat(murid.matrik || 'Tiada matrik') + '</span></span>' +
      labelKehadiran(hadir) +
      '</div>' +
      (hadir === 'tidak'
        ? '<div class="baris-lipat" style="margin-top:8px">' + labelMaklum(butiran.maklum) +
          (butiran.nota
            ? '<span class="kecil">' + u.selamat(butiran.nota) + '</span>'
            : '') + '</div>'
        : '') +
      '<div class="rekod-medan">' +
      '<div><b>Juz</b>' +
      (r.juz
        ? 'Juz ' + r.juz
        : '<span class="kosong">Juz belum direkod</span>' +
          (sambungKad && sambungKad.juz
            ? '<br><span class="kecil">Sambung Juz ' + sambungKad.juz + '</span>'
            : '')) +
      '</div>' +
      '<div><b>Muka surat hafazan</b>' +
      (r.mukaMula || r.mukaHabis
        ? u.selamat((r.mukaMula || '?') + ' - ' + (r.mukaHabis || '?'))
        : '<span class="kosong">Muka surat belum direkod</span>' +
          (sambungKad ? '<br><span class="kecil">Sambung dari ' + sambungKad.mula + '</span>' : '')) +
      '</div>' +
      '</div>' +
      '<button class="butang butang-luar butang-penuh jarak-atas" type="button" data-kemaskini>' +
      'Kemas kini</button>';

    kad.querySelector('[data-kemaskini]').addEventListener('click', function () {
      CT.ui.bukaLapisan('Kemas Kini Rekod', borang(murid));
    });
    return kad;
  }

  function render(skrin, param) {
    if (param && param.tarikh && u.sahKunci(param.tarikh)) { tarikh = param.tarikh; }
    if (!tarikh) { tarikh = u.hariIni(); }

    skrin.appendChild(CT.ui.pemilihTarikh(tarikh, function (baru) {
      tarikh = baru;
      CT.app.segarSemula();
    }));

    var cuti = CT.ui.notisCuti(tarikh);
    if (cuti) { cuti.classList.add('jarak-atas'); skrin.appendChild(cuti); }

    var kePeringkat = document.createElement('button');
    kePeringkat.type = 'button';
    kePeringkat.className = 'butang butang-lembut butang-penuh jarak-atas';
    kePeringkat.textContent = 'Buka Kehadiran untuk tarikh ini';
    kePeringkat.addEventListener('click', function () {
      CT.app.pergi('kehadiran', { tarikh: tarikh });
    });
    skrin.appendChild(kePeringkat);

    var murid = CT.store.senaraiMurid();
    if (!murid.length) {
      var kosong = CT.ui.kosong('Belum ada murid',
        'Tambah murid dalam tab Murid untuk mula merekod.');
      kosong.classList.add('jarak-atas');
      skrin.appendChild(kosong);
      return;
    }

    var tajuk = document.createElement('p');
    tajuk.className = 'seksyen-tajuk jarak-atas';
    tajuk.textContent = 'Rekod ' + murid.length + ' murid';
    skrin.appendChild(tajuk);

    var senarai = document.createElement('div');
    senarai.className = 'senarai';
    murid.forEach(function (m) { senarai.appendChild(kadRekod(m)); });
    skrin.appendChild(senarai);
  }

  return { tajuk: 'Rekod', render: render };
})();
