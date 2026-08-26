/* ClassTrack — cuti umum.
   Gabungan automatik: cuti Persekutuan + Wilayah Persekutuan Kuala Lumpur + Selangor.
   Tiada pemilih negeri dipaparkan; gabungan ini digunakan di belakang tabir.

   Sumber langsung : API awam Nager.Date (https://date.nager.at) apabila internet ada.
   Sumber sandaran : senarai terbina di bawah, disimpan dalam fail ini.
   Cache          : localStorage, supaya kalendar kekal berfungsi tanpa internet. */

window.CT = window.CT || {};

(function () {
  'use strict';

  var WILAYAH = { PERSEKUTUAN: 'MY', KL: 'MY-14', SELANGOR: 'MY-10' };

  /* Senarai sandaran. Tarikh berasaskan kalendar Hijrah/Cina/Tamil ditanda
     "anggaran" kerana ia tertakluk kepada pengumuman rasmi kerajaan. */
  var SANDARAN = {
    2025: [
      ['2025-01-01', 'Tahun Baharu', false],
      ['2025-01-29', 'Tahun Baharu Cina', false],
      ['2025-01-30', 'Tahun Baharu Cina (Hari Kedua)', false],
      ['2025-02-01', 'Hari Wilayah Persekutuan', false],
      ['2025-02-11', 'Thaipusam', false],
      ['2025-03-02', 'Awal Ramadan', false],
      ['2025-03-18', 'Nuzul Al-Quran', false],
      ['2025-03-31', 'Hari Raya Aidilfitri', false],
      ['2025-04-01', 'Hari Raya Aidilfitri (Hari Kedua)', false],
      ['2025-05-01', 'Hari Pekerja', false],
      ['2025-05-12', 'Hari Wesak', false],
      ['2025-06-02', 'Hari Keputeraan Yang di-Pertuan Agong', false],
      ['2025-06-07', 'Hari Raya Aidiladha', false],
      ['2025-06-27', 'Awal Muharram', false],
      ['2025-08-31', 'Hari Kebangsaan', false],
      ['2025-09-05', 'Maulidur Rasul', false],
      ['2025-09-16', 'Hari Malaysia', false],
      ['2025-10-20', 'Deepavali', false],
      ['2025-12-11', 'Hari Keputeraan Sultan Selangor', false],
      ['2025-12-25', 'Hari Krismas', false]
    ],
    2026: [
      ['2026-01-01', 'Tahun Baharu', false],
      ['2026-02-01', 'Hari Wilayah Persekutuan', false],
      ['2026-02-01', 'Thaipusam', true],
      ['2026-02-17', 'Tahun Baharu Cina', true],
      ['2026-02-18', 'Tahun Baharu Cina (Hari Kedua)', true],
      ['2026-02-19', 'Awal Ramadan', true],
      ['2026-03-07', 'Nuzul Al-Quran', true],
      ['2026-03-20', 'Hari Raya Aidilfitri', true],
      ['2026-03-21', 'Hari Raya Aidilfitri (Hari Kedua)', true],
      ['2026-05-01', 'Hari Pekerja', false],
      ['2026-05-27', 'Hari Raya Aidiladha', true],
      ['2026-05-31', 'Hari Wesak', true],
      ['2026-06-01', 'Hari Keputeraan Yang di-Pertuan Agong', false],
      ['2026-06-16', 'Awal Muharram', true],
      ['2026-08-25', 'Maulidur Rasul', true],
      ['2026-08-31', 'Hari Kebangsaan', false],
      ['2026-09-16', 'Hari Malaysia', false],
      ['2026-11-08', 'Deepavali', true],
      ['2026-12-11', 'Hari Keputeraan Sultan Selangor', false],
      ['2026-12-25', 'Hari Krismas', false]
    ],
    2027: [
      ['2027-01-01', 'Tahun Baharu', false],
      ['2027-02-01', 'Hari Wilayah Persekutuan', false],
      ['2027-05-01', 'Hari Pekerja', false],
      ['2027-06-07', 'Hari Keputeraan Yang di-Pertuan Agong', false],
      ['2027-08-31', 'Hari Kebangsaan', false],
      ['2027-09-16', 'Hari Malaysia', false],
      ['2027-12-11', 'Hari Keputeraan Sultan Selangor', false],
      ['2027-12-25', 'Hari Krismas', false]
    ]
  };

  var cacheMemori = {};   // tahun -> { peta, sumber, masa }

  function daripadaSandaran(tahun) {
    return (SANDARAN[tahun] || []).map(function (b) {
      return { tarikh: b[0], nama: b[1], anggaran: !!b[2] };
    });
  }

  function kunciCache(tahun) { return 'cuti.' + tahun; }

  function bacaCache(tahun) {
    return CT.store.baca(kunciCache(tahun), null);
  }

  function tulisCache(tahun, senarai) {
    CT.store.tulis(kunciCache(tahun), {
      tahun: tahun,
      senarai: senarai,
      disegerak: new Date().toISOString()
    });
  }

  function petakan(senarai) {
    var peta = {};
    senarai.forEach(function (c) {
      if (!peta[c.tarikh]) { peta[c.tarikh] = []; }
      var ulang = peta[c.tarikh].some(function (a) { return a.nama === c.nama; });
      if (!ulang) { peta[c.tarikh].push(c); }
    });
    return peta;
  }

  /* Kembalikan data segera (cache atau sandaran) tanpa menunggu rangkaian. */
  function tahunSegera(tahun) {
    if (cacheMemori[tahun]) { return cacheMemori[tahun]; }

    var simpan = bacaCache(tahun);
    var hasil;
    if (simpan && simpan.senarai && simpan.senarai.length) {
      hasil = { peta: petakan(simpan.senarai), sumber: 'segerak', masa: simpan.disegerak };
    } else {
      hasil = { peta: petakan(daripadaSandaran(tahun)), sumber: 'sandaran', masa: null };
    }
    cacheMemori[tahun] = hasil;
    return hasil;
  }

  function cutiPada(tarikh) {
    if (!CT.util.sahKunci(tarikh)) { return []; }
    var tahun = CT.util.pecah(tarikh).tahun;
    return tahunSegera(tahun).peta[tarikh] || [];
  }

  function adaCuti(tarikh) { return cutiPada(tarikh).length > 0; }

  function statusSegerak(tahun) {
    var d = tahunSegera(tahun);
    return { sumber: d.sumber, masa: d.masa };
  }

  /* Penyegerakan langsung. Jika gagal, data luar talian terus digunakan. */
  function segerak(tahun, paksa) {
    var simpan = bacaCache(tahun);
    if (!paksa && simpan && simpan.disegerak) {
      var umur = Date.now() - new Date(simpan.disegerak).getTime();
      if (umur < 7 * 24 * 60 * 60 * 1000) {
        return Promise.resolve({ status: 'cache', bilangan: simpan.senarai.length });
      }
    }
    if (!navigator.onLine) {
      return Promise.resolve({ status: 'luar-talian', bilangan: 0 });
    }

    var url = 'https://date.nager.at/api/v3/PublicHolidays/' + tahun + '/MY';
    var pembatal = new AbortController();
    var masaTamat = setTimeout(function () { pembatal.abort(); }, 12000);

    return fetch(url, { signal: pembatal.signal, cache: 'no-store' })
      .then(function (jawapan) {
        if (!jawapan.ok) { throw new Error('HTTP ' + jawapan.status); }
        return jawapan.json();
      })
      .then(function (data) {
        clearTimeout(masaTamat);
        if (!Array.isArray(data) || !data.length) { throw new Error('Data kosong'); }

        var ditapis = data.filter(function (c) {
          if (c.global || !c.counties || !c.counties.length) { return true; }
          return c.counties.indexOf(WILAYAH.KL) !== -1 ||
            c.counties.indexOf(WILAYAH.SELANGOR) !== -1;
        }).map(function (c) {
          return { tarikh: c.date, nama: c.localName || c.name, anggaran: false };
        });

        if (!ditapis.length) { throw new Error('Tiada cuti berkaitan'); }

        tulisCache(tahun, ditapis);
        cacheMemori[tahun] = {
          peta: petakan(ditapis), sumber: 'segerak', masa: new Date().toISOString()
        };
        CT.store.lapor('cuti', tahun);
        return { status: 'ok', bilangan: ditapis.length };
      })
      .catch(function (ralat) {
        clearTimeout(masaTamat);
        console.warn('Penyegerakan cuti gagal:', ralat.message);
        return { status: 'gagal', ralat: ralat.message, bilangan: 0 };
      });
  }

  CT.cuti = {
    cutiPada: cutiPada,
    adaCuti: adaCuti,
    tahunSegera: tahunSegera,
    statusSegerak: statusSegerak,
    segerak: segerak
  };
})();
