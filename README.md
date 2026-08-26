# ClassTrack — Universiti Islam Selangor

Aplikasi web progresif (PWA) untuk guru UIS: mengurus profil murid, mengambil
kehadiran, merekod hafazan Al-Quran, menulis nota murid, melihat rekod mengikut
tarikh, kalendar dengan cuti umum Malaysia, dan mushaf 30 juz secara luar talian.

Keseluruhan antara muka menggunakan **Bahasa Melayu**, tarikh format Malaysia
(DD/MM/YYYY), masa format 12 jam AM/PM, dan zon waktu **Asia/Kuala_Lumpur**.

---

## 1. Struktur fail

```
.
├── index.html                  Rangka aplikasi + navigasi 9 tab
├── manifest.webmanifest        Tetapan PWA (nama, ikon, warna, pintasan)
├── sw.js                       Service worker (cache luar talian, versi cache)
├── css/
│   └── styles.css              Reka bentuk mudah alih dahulu
├── js/
│   ├── util.js                 Tarikh/masa Malaysia, zon Asia/Kuala_Lumpur
│   ├── store.js                localStorage + IndexedDB + pub/sub
│   ├── cuti.js                 Cuti Persekutuan + KL + Selangor (segerak/sandaran)
│   ├── sukatan.js              Sukatan hafazan: juz -> muka surat, kiraan baki
│   ├── ui.js                   Toast, lapisan, pemilih tarikh, notis cuti
│   ├── app.js                  Navigasi tab, service worker, persediaan awal
│   └── views/
│       ├── utama.js            Logo UIS + butang "Ambil Kehadiran"
│       ├── murid.js            Senarai, carian, profil, tambah murid
│       ├── kehadiran.js        Hadir / Tidak hadir mengikut tarikh
│       ├── kalendar.js         Kalendar bulanan, acara, cuti, penyegerakan
│       ├── rekod.js            Rekod murid mengikut tarikh (juz, muka surat, nota)
│       ├── sukatan.js          Carta bar baki sukatan setiap murid
│       ├── quran.js            30 juz, PDF disimpan dalam IndexedDB
│       ├── nota.js             Nota mengikut kategori, sulit, dikongsi
│       └── pasukan.js          Guru jabatan, peranan, tahap akses
├── assets/
│   ├── BACA-SAYA-LOGO.txt      Cara meletakkan logo rasmi UIS
│   ├── ikon-192.png            Ikon aplikasi (bukan logo UIS)
│   ├── ikon-512.png
│   └── ikon-maskable.png
└── tools/
    ├── buat-ikon.mjs           Menjana semula ikon aplikasi (node)
    └── buat-satu-fail.mjs      Menjana classtrack-satu-fail.html untuk pratonton
```

## 2. Logo rasmi UIS

Logo rasmi adalah **tetap**. Ia dimuatkan daripada fail yang dihantar bersama
aplikasi sahaja — `assets/logo-uis.png` (atau `.jpg` / `.svg`), atau data yang
dibenamkan dalam binaan satu fail. **Tiada cara untuk pengguna aplikasi
menukar, memuat naik atau memadam logo**; hanya orang yang mempunyai akses
kepada repositori boleh menggantikan fail itu.

Logo dipaparkan pada halaman Utama sahaja, sebagai gambar yang **tidak boleh
ditekan** dan **tidak dipautkan** ke mana-mana laman web, dengan nisbah asal
dikekalkan. Jika fail belum ada, halaman Utama memaparkan nota ringkas
"Logo rasmi tiada" tanpa butang. Aplikasi ini tidak menjana semula logo UIS.

Selepas fail logo diletakkan, `node tools/buat-satu-fail.mjs` membenamkan logo
terus ke dalam `classtrack-satu-fail.html` sebagai data URI, jadi fail tunggal
itu membawa logo bersamanya.

## 3. Sukatan hafazan

Tab **Sukatan** mengira sendiri berapa banyak lagi setiap murid perlu hantar
untuk cukup sukatan semester, berdasarkan halaman terjauh yang direkodkan
dalam tab Rekod. Nombor muka surat yang dimasukkan guru ialah nombor halaman
**mutlak** dalam mushaf 604 halaman (bukan halaman dalam juz).

| Diploma | Juz | Muka surat | Jumlah |
|---|---|---|---|
| Hifz 1 | 1 – 4 | 1 – 81 | 81 |
| Hifz 2 | 5 – 9 | 82 – 181 | 100 |
| Hifz 3 | 10 – 14 | 182 – 281 | 100 |
| Hifz 4 | 15 – 20 | 282 – 401 | 120 |
| Hifz 5 | 21 – 25 | 402 – 501 | 100 |
| Hifz 6 | 26 – 30 | 502 – 604 | 103 |

| Ijazah | Juz | Muka surat | Jumlah |
|---|---|---|---|
| I'adah 1 | 1 – 4 | 1 – 81 | 81 |
| I'adah 2 | 5 – 8 | 82 – 161 | 80 |
| I'adah 3 | 9 – 12 | 162 – 241 | 80 |
| I'adah 4 | 13 – 16 | 242 – 321 | 80 |
| I'adah 5 | 17 – 20 | 322 – 401 | 80 |
| I'adah 6 | 21 – 24 | 402 – 481 | 80 |
| I'adah 7 | 25 – 26 | 482 – 521 | 40 |
| I'adah 8 | 27 – 30 | 522 – 604 | 83 |

Kedua-dua program meliputi kesemua 604 halaman tanpa jurang atau pertindihan.

Status murid ditentukan oleh kadar yang diperlukan bagi baki hari semester:
**Ikut jadual** (1 halaman sehari atau kurang), **Perlu dipantau** (sehingga
2 halaman sehari), **Perlu dikejar** (lebih daripada itu). Hari terakhir
semester boleh ditukar dalam tab Sukatan; nilai lalai ialah 25/09/2026.

Program murid (Diploma atau Ijazah) ditetapkan dalam profil murid. Tahap
Hifz/I'adah kekal pilihan 1 hingga 8; Diploma hanya mempunyai sukatan sehingga
Hifz 6, dan murid di luar julat itu disenaraikan sebagai "tiada sukatan".

## 4. Cara membuka aplikasi pada komputer

Semua ciri (kecuali service worker) berfungsi dengan hanya membuka
`index.html` melalui pelayar. Untuk pengalaman PWA penuh, jalankan pelayan
tempatan:

```bash
# Pilihan A — Node.js
npx http-server -p 8080 -c-1 .

# Pilihan B — Python
python3 -m http.server 8080
```

Kemudian buka `http://localhost:8080/index.html`.
Service worker hanya berdaftar pada `http://localhost` atau `https://`,
bukan pada `file://`.

## 5. Cara memasang pada telefon

1. Hoskan folder ini pada mana-mana pelayan **HTTPS** (contoh: GitHub Pages,
   Netlify, Vercel, atau pelayan universiti).
2. Buka pautan tersebut pada telefon.
3. **Android (Chrome):** menu ⋮ → *Add to Home screen* / *Install app*.
4. **iPhone (Safari):** butang Kongsi → *Add to Home Screen*.
5. Aplikasi akan dibuka skrin penuh dan boleh digunakan tanpa internet
   selepas kali pertama dimuatkan.

Untuk ujian pantas dalam rangkaian Wi-Fi yang sama, jalankan pelayan tempatan
seperti di atas dan buka `http://<alamat-IP-komputer>:8080` pada telefon.
(Pemasangan PWA memerlukan HTTPS; `http://` hanya sesuai untuk ujian paparan.)

## 6. Penyimpanan data

| Data | Tempat simpan | Kunci |
|---|---|---|
| Murid, kehadiran, rekod, nota, acara, pasukan, tetapan | `localStorage` (awalan `classtrack.v1.`) | tarikh `YYYY-MM-DD` untuk kehadiran & rekod |
| Cache cuti umum | `localStorage` | `classtrack.v1.cuti.<tahun>` |
| PDF juz Al-Quran | `IndexedDB` (`classtrack-fail`) | `juz-1` … `juz-30` |

Logo rasmi **tidak** disimpan sebagai data pengguna — ia sebahagian daripada
fail aplikasi, jadi ia sama bagi semua guru dan tidak boleh diubah dari dalam
aplikasi.

Setiap tarikh disimpan berasingan — mengemas kini rekod satu tarikh tidak
menyentuh tarikh lain. Data kekal selepas halaman dimuat semula dan tidak
dipadam semasa kod dikemas kini.

## 7. Bahagian yang masih menggunakan data prototaip

- **Pasukan / jabatan** — senarai guru, peranan dan tahap akses disimpan pada
  peranti ini sahaja. "Guru aktif" menggantikan log masuk sebenar.
- **Perkongsian nota** — tanda "Dikongsi dengan jabatan" direkodkan tetapi
  tidak dihantar ke mana-mana pelayan.
- **Jemputan guru** — direkodkan sebagai status "Jemputan belum diterima";
  tiada e-mel dihantar.
- **Cuti umum** — senarai sandaran dalam `js/cuti.js` digunakan apabila
  penyegerakan gagal. Tarikh berasaskan kalendar Hijrah/Cina/Tamil ditanda
  *anggaran* sehingga disegerakkan, kerana ia tertakluk kepada pengumuman
  rasmi kerajaan.
- **Mushaf** — tiada kandungan Al-Quran disertakan. Guru memasukkan sendiri
  fail PDF setiap juz.
- **Murid contoh** — butang "Muat 5 murid contoh" hanya muncul apabila senarai
  murid kosong.

## 8. Langkah ke arah aplikasi sebenar (akaun + pangkalan data awan)

1. **Log masuk guru** — sambungkan pembekal identiti universiti (SSO/Google
   Workspace) atau e-mel + kata laluan. Ganti pemilih "Guru aktif" dalam tab
   Pasukan dengan sesi pengguna sebenar. Simpan rahsia melalui pemboleh ubah
   persekitaran, bukan dalam kod.
2. **Pangkalan data awan** — cadangan jadual:
   `guru`, `jabatan`, `murid`, `kehadiran(tarikh, murid_id, status)`,
   `rekod(tarikh, murid_id, juz, muka_mula, muka_habis)`,
   `nota(murid_id, tarikh, kategori, sulit, kongsi, penulis_id)`,
   `acara(tarikh, tajuk, jenis, masa)`.
   Kunci `(tarikh, murid_id)` sudah sama dengan struktur tempatan sekarang.
3. **Penyegerakan antara peranti** — kekalkan `js/store.js` sebagai satu-satunya
   lapisan data, tambah baris gilir "tulis luar talian" dan segerak apabila
   dalam talian (last-write-wins berdasarkan cap masa `dikemaskini`).
4. **Kawalan akses jabatan** — kuatkuasakan "Akses penuh / Boleh sunting /
   Boleh lihat" di pihak pelayan; nota sulit hanya boleh dibaca oleh penulis.
5. **Rekod audit** — log siapa mengubah rekod mana dan bila (guru_id, tindakan,
   tarikh rekod, cap masa).
6. **Eksport laporan** — jana CSV/PDF kehadiran bulanan dan kemajuan hafazan
   setiap murid.
7. **Perlindungan data murid** — HTTPS wajib, penyulitan semasa rehat, dasar
   simpanan data, dan kebenaran penjaga selaras PDPA Malaysia.

## 9. Nota penyelenggaraan

- Setiap kali fail aplikasi diubah, naikkan `VERSI` dalam `sw.js`
  (contoh: `classtrack-v1.0.0` → `classtrack-v1.0.1`) supaya cache lama
  digantikan pada peranti guru. Data guru tidak disentuh.
- Ikon aplikasi boleh dijana semula: `node tools/buat-ikon.mjs`.
- Fail pratonton satu fail dijana semula: `node tools/buat-satu-fail.mjs`.
- Penyegerakan cuti menggunakan API awam `date.nager.at` dan menapis cuti
  Persekutuan, Kuala Lumpur dan Selangor sahaja. Jika penyegerakan gagal,
  aplikasi terus menggunakan data luar talian.
