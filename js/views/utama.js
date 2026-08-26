/* Tab Utama — ringkas: logo rasmi UIS dan satu butang besar "Ambil Kehadiran". */

window.CT = window.CT || {};
CT.views = CT.views || {};

CT.views.utama = (function () {
  'use strict';

  var u = CT.util;

  /* Logo rasmi UIS adalah TETAP. Ia datang daripada fail yang dihantar bersama
     aplikasi sahaja — folder assets, atau data terbenam dalam binaan satu fail.
     Tiada cara untuk pengguna aplikasi menukar, memuat naik atau memadamnya.
     Hanya orang yang mempunyai akses kepada repositori boleh menggantikan fail. */
  var FAIL_LOGO = ['assets/logo-uis.png', 'assets/logo-uis.jpg', 'assets/logo-uis.svg'];

  function sumberLogo() {
    // Binaan satu fail membenamkan logo terus sebagai data URI.
    if (typeof window.CT_LOGO_TERBENAM === 'string' && window.CT_LOGO_TERBENAM) {
      return [window.CT_LOGO_TERBENAM];
    }
    return window.CT_TIADA_FAIL_LOGO ? [] : FAIL_LOGO;
  }

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

    var senarai = sumberLogo();
    var cubaan = 0;

    imej.addEventListener('error', function () {
      cubaan++;
      if (cubaan < senarai.length) {
        imej.src = senarai[cubaan];
        return;
      }
      bingkai.replaceWith(kotakLogoTiada());
    });

    if (senarai.length) { imej.src = senarai[0]; }
    else { return kotakLogoTiada(); }
    return bingkai;
  }

  /* Hanya muncul jika fail logo rasmi belum diletakkan dalam folder assets.
     Sengaja tiada butang: logo tidak boleh ditukar dari dalam aplikasi. */
  function kotakLogoTiada() {
    var kotak = document.createElement('div');
    kotak.className = 'logo-ganti';
    kotak.innerHTML =
      '<p class="tebal" style="color:var(--teks);margin-bottom:6px">Logo rasmi tiada</p>' +
      '<p class="kecil">Pentadbir perlu meletakkan fail logo rasmi UIS sebagai ' +
      '<code>assets/logo-uis.png</code> dalam projek.</p>';
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
