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

  /* ---------- Borang kemas kini seorang murid ---------- */
  function borang(murid) {
    var r = CT.store.rekodMurid(tarikh, murid.id) || {};
    var hadir = CT.store.kehadiranTarikh(tarikh)[murid.id] || '';
    var nota = CT.store.notaHarian(tarikh, murid.id);

    var kotak = document.createElement('div');
    kotak.innerHTML =
      '<p class="kecil tebal" style="margin-bottom:4px">' + u.selamat(murid.nama) + '</p>' +
      '<p class="kecil" style="margin-bottom:14px">' + u.selamat(u.tarikhPenuh(tarikh)) + '</p>' +

      '<div class="medan"><label>Kehadiran</label>' +
      '<div class="segmen">' +
      '<button type="button" data-hadir="hadir">Hadir</button>' +
      '<button type="button" data-hadir="tidak">Tidak hadir</button>' +
      '</div></div>' +

      '<div class="medan"><label for="r-juz">Juz</label><select id="r-juz">' +
      '<option value="">Juz belum direkod</option>' +
      CT.ui.pilihanNombor(1, 30, r.juz) + '</select></div>' +

      '<div class="medan-dua">' +
      '<div class="medan"><label for="r-mula">Muka surat hafazan mula</label>' +
      '<input id="r-mula" type="number" min="1" max="604" inputmode="numeric" value="' +
      u.selamat(r.mukaMula || '') + '" placeholder="Contoh: 12"></div>' +
      '<div class="medan"><label for="r-habis">Muka surat hafazan habis</label>' +
      '<input id="r-habis" type="number" min="1" max="604" inputmode="numeric" value="' +
      u.selamat(r.mukaHabis || '') + '" placeholder="Contoh: 14"></div>' +
      '</div>' +

      '<div class="medan"><label for="r-nota">Nota harian</label>' +
      '<textarea id="r-nota" placeholder="Catatan guru untuk tarikh ini">' +
      u.selamat(nota ? nota.teks : '') + '</textarea></div>' +

      '<div class="semak"><input type="checkbox" id="r-kongsi"' +
      (nota && nota.kongsi ? ' checked' : '') + '>' +
      '<label for="r-kongsi">Kongsi nota ini dengan jabatan</label></div>' +

      '<button class="butang butang-penuh" type="button" data-simpan>Simpan rekod</button>';

    var pilihanHadir = hadir;
    var butang = kotak.querySelectorAll('[data-hadir]');

    function segarHadir() {
      Array.prototype.forEach.call(butang, function (b) {
        var nilai = b.getAttribute('data-hadir');
        b.classList.toggle('pilih-hadir', pilihanHadir === 'hadir' && nilai === 'hadir');
        b.classList.toggle('pilih-tidak', pilihanHadir === 'tidak' && nilai === 'tidak');
      });
    }
    Array.prototype.forEach.call(butang, function (b) {
      b.addEventListener('click', function () {
        var nilai = b.getAttribute('data-hadir');
        pilihanHadir = pilihanHadir === nilai ? '' : nilai;
        segarHadir();
      });
    });
    segarHadir();

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
    var nota = CT.store.notaHarian(tarikh, murid.id);

    var kad = document.createElement('div');
    kad.className = 'rekod-kad';
    kad.innerHTML =
      '<div class="baris">' +
      '<span class="avatar">' + u.selamat(u.huruf(murid.nama)) + '</span>' +
      '<span class="tumbuh"><span class="murid-nama">' + u.selamat(murid.nama) + '</span><br>' +
      '<span class="kecil">' + u.selamat(murid.matrik || 'Tiada matrik') + '</span></span>' +
      labelKehadiran(hadir) +
      '</div>' +
      '<div class="rekod-medan">' +
      '<div><b>Juz</b>' + (r.juz ? 'Juz ' + r.juz : '<span class="kosong">Juz belum direkod</span>') + '</div>' +
      '<div><b>Muka surat hafazan</b>' +
      (r.mukaMula || r.mukaHabis
        ? u.selamat((r.mukaMula || '?') + ' - ' + (r.mukaHabis || '?'))
        : '<span class="kosong">Muka surat belum direkod</span>') + '</div>' +
      '</div>' +
      '<div style="margin-top:8px"><span class="kecil tebal">Nota harian</span><br>' +
      (nota
        ? '<span class="kecil">' + u.selamat(nota.teks) + '</span>' +
          (nota.kongsi ? ' <span class="lencana lencana-biru">Dikongsi</span>' : '')
        : '<span class="kecil kosong">Belum direkod</span>') +
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
