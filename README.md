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
├── index.html                  Rangka aplikasi + navigasi 8 tab
├── manifest.webmanifest        Tetapan PWA (nama, ikon, warna, pintasan)
├── sw.js                       Service worker (cache luar talian, versi cache)
├── css/
│   └── styles.css              Reka bentuk mudah alih dahulu
├── js/
│   ├── util.js                 Tarikh/masa Malaysia, zon Asia/Kuala_Lumpur
│   ├── store.js                localStorage + IndexedDB + pub/sub
│   ├── cuti.js                 Cuti Persekutuan + KL + Selangor (segerak/sandaran)
│   ├── ui.js                   Toast, lapisan, pemilih tarikh, notis cuti
│   ├── app.js                  Navigasi tab, service worker, persediaan awal
│   └── views/
│       ├── utama.js            Logo UIS + butang "Ambil Kehadiran"
│       ├── murid.js            Senarai, carian, profil, tambah murid
│       ├── kehadiran.js        Hadir / Tidak hadir mengikut tarikh
│       ├── kalendar.js         Kalendar bulanan, acara, cuti, penyegerakan
│       ├── rekod.js            Rekod murid mengikut tarikh (juz, muka surat, nota)
│       ├── quran.js            30 juz, PDF disimpan dalam IndexedDB
│       ├── nota.js             Nota mengikut kategori, sulit, dikongsi
│       └── pasukan.js          Guru jabatan, peranan, tahap akses
├── assets/
│   ├── BACA-SAYA-LOGO.txt      Cara meletakkan logo rasmi UIS
│   ├── ikon-192.png            Ikon aplikasi (bukan logo UIS)
│   ├── ikon-512.png
│   └── ikon-maskable.png
└── tools/
    └── buat-ikon.mjs           Menjana semula ikon aplikasi (node)
```

## 2. Logo rasmi UIS

Letakkan fail logo rasmi sebagai `assets/logo-uis.png` (atau `.jpg` / `.svg`).
Logo dipaparkan pada halaman Utama sahaja, sebagai gambar yang **tidak boleh
ditekan** dan **tidak dipautkan** ke mana-mana laman web, dengan nisbah asal
dikekalkan. Jika fail belum ada, halaman Utama memaparkan kotak "Logo rasmi
belum dimasukkan" berserta butang untuk memasukkan fail terus daripada telefon
(disimpan dalam IndexedDB peranti). Aplikasi ini tidak menjana semula logo UIS.

## 3. Cara membuka aplikasi pada komputer

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

## 4. Cara memasang pada telefon

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

## 5. Penyimpanan data

| Data | Tempat simpan | Kunci |
|---|---|---|
| Murid, kehadiran, rekod, nota, acara, pasukan, tetapan | `localStorage` (awalan `classtrack.v1.`) | tarikh `YYYY-MM-DD` untuk kehadiran & rekod |
| Cache cuti umum | `localStorage` | `classtrack.v1.cuti.<tahun>` |
| PDF juz Al-Quran, logo | `IndexedDB` (`classtrack-fail`) | `juz-1` … `juz-30`, `logo` |

Setiap tarikh disimpan berasingan — mengemas kini rekod satu tarikh tidak
menyentuh tarikh lain. Data kekal selepas halaman dimuat semula dan tidak
dipadam semasa kod dikemas kini.

## 6. Bahagian yang masih menggunakan data prototaip

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

## 7. Langkah ke arah aplikasi sebenar (akaun + pangkalan data awan)

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

## 8. Nota penyelenggaraan

- Setiap kali fail aplikasi diubah, naikkan `VERSI` dalam `sw.js`
  (contoh: `classtrack-v1.0.0` → `classtrack-v1.0.1`) supaya cache lama
  digantikan pada peranti guru. Data guru tidak disentuh.
- Ikon aplikasi boleh dijana semula: `node tools/buat-ikon.mjs`.
- Penyegerakan cuti menggunakan API awam `date.nager.at` dan menapis cuti
  Persekutuan, Kuala Lumpur dan Selangor sahaja. Jika penyegerakan gagal,
  aplikasi terus menggunakan data luar talian.
