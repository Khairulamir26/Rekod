/* Tab Utama — ringkas: logo rasmi UIS dan satu butang besar "Ambil Kehadiran". */

window.CT = window.CT || {};
CT.views = CT.views || {};

CT.views.utama = (function () {
  'use strict';

  var u = CT.util;
  // Fail logo rasmi dicari mengikut susunan ini di dalam folder assets.
  var FAIL_LOGO = ['assets/logo-uis.png', 'assets/logo-uis.jpg', 'assets/logo-uis.svg'];
  var urlLogo = null;

  function bingkaiLogo() {
    var bingkai = document.createElement('div');
    bingkai.className = 'logo-bingkai';

    var imej = document.createElement('img');
    imej.className = 'logo-uis';
    imej.alt = 'Logo Universiti Islam Selangor';
    imej.draggable = false;
    imej.decoding = 'async';
    bingkai.appendChild(imej);

    // Logo hanya paparan: tiada pautan, tiada tindakan apabila ditekan.
    imej.addEventListener('click', function (e) { e.preventDefault(); });
    imej.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    // Versi satu fail (pratonton) tiada folder assets — terus cuba simpanan peranti.
    var senarai = window.CT_TIADA_FAIL_LOGO ? [] : FAIL_LOGO;
    var cubaan = 0;
    var cubaBlob = false;

    // Logo yang disimpan pada peranti oleh guru.
    function cubaLogoPeranti() {
      if (cubaBlob) { bingkai.replaceWith(kotakMasukLogo()); return; }
      cubaBlob = true;
      CT.store.ambilFail('logo').then(function (rekod) {
        if (rekod && rekod.blob) {
          if (urlLogo) { URL.revokeObjectURL(urlLogo); }
          urlLogo = URL.createObjectURL(rekod.blob);
          imej.src = urlLogo;
        } else {
          bingkai.replaceWith(kotakMasukLogo());
        }
      }).catch(function () {
        bingkai.replaceWith(kotakMasukLogo());
      });
    }

    imej.addEventListener('error', function () {
      cubaan++;
      if (cubaan < senarai.length) {
        imej.src = senarai[cubaan];
        return;
      }
      cubaLogoPeranti();
    });

    if (senarai.length) { imej.src = senarai[0]; }
    else { cubaLogoPeranti(); }
    return bingkai;
  }

  /* Dipaparkan hanya jika fail logo rasmi belum diletakkan dalam folder assets.
     Logo tidak dijana semula; guru memasukkan fail rasmi sendiri. */
  function kotakMasukLogo() {
    var kotak = document.createElement('div');
    kotak.className = 'logo-ganti';
    kotak.innerHTML =
      '<p class="tebal" style="color:var(--teks);margin-bottom:6px">Logo rasmi belum dimasukkan</p>' +
      '<p class="kecil" style="margin-bottom:12px">Letakkan fail logo rasmi UIS sebagai ' +
      '<code>assets/logo-uis.png</code>, atau masukkan fail itu di sini sekali sahaja.</p>' +
      '<label class="butang butang-luar butang-kecil" style="cursor:pointer">' +
      'Masukkan fail logo<input type="file" accept="image/*" hidden></label>';

    kotak.querySelector('input[type="file"]').addEventListener('change', function (e) {
      var fail = e.target.files && e.target.files[0];
      if (!fail) { return; }
      CT.store.simpanFail('logo', fail, { nama: fail.name }).then(function () {
        CT.ui.toast('Logo disimpan pada peranti.');
        CT.app.pergi('utama');
      }).catch(function () {
        CT.ui.toast('Logo tidak dapat disimpan.');
      });
    });
    return kotak;
  }

  function render(skrin) {
    var kotak = document.createElement('div');
    kotak.className = 'utama-kotak';

    kotak.appendChild(bingkaiLogo());

    var tarikh = document.createElement('p');
    tarikh.className = 'kecil tebal';
    tarikh.textContent = u.tarikhPenuh(u.hariIni());
    kotak.appendChild(tarikh);

    var butang = document.createElement('button');
    butang.type = 'button';
    butang.className = 'butang butang-besar';
    butang.textContent = 'Ambil Kehadiran';
    butang.addEventListener('click', function () {
      CT.app.pergi('kehadiran', { tarikh: u.hariIni() });
    });
    kotak.appendChild(butang);

    skrin.appendChild(kotak);
  }

  return { tajuk: 'Utama', render: render };
})();
