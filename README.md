# Kalkulator Modern & Ilmiah

Aplikasi kalkulator berbasis web (Single File HTML) yang interaktif, modern, dan kaya fitur dengan dukungan mode Standar & Ilmiah, riwayat perhitungan, efek suara Web Audio API, fungsi memori, serta tema yang dapat disesuaikan.

## 🚀 Fitur Utama
- **Desain Modern Glassmorphism**: Tampilan futuristik dengan ambient glow dan pilihan tema (Deep Dark, Cyber Neon, Sunset Amber, Clean Light).
- **Sinkronisasi Riwayat Cloud Real-time**: Riwayat perhitungan otomatis tersimpan ke **Firebase Cloud Firestore**, sehingga riwayat langsung sinkron di semua perangkat (laptop, ponsel, tablet) secara real-time.
- **Batas Otomatis Maksimal 10 Riwayat**: Hanya 10 riwayat perhitungan terbaru yang disimpan (riwayat lama otomatis dihapus dari Cloud dan lokal).
- **Mode Ilmiah Lengkap**: Trigonometri (sin, cos, tan), sudut DEG/RAD, pangkat (x², xʸ), akar (√x), logaritma (log, ln), faktorial (x!), konstanta (π, e), dan kebalikan (1/x).
- **Fungsi Memori**: MC, MR, M+, M-, dan MS dengan indikator status.
- **Efek Suara Native**: Disintesis dengan HTML5 Web Audio API (100% offline tanpa file audio eksternal).
- **Dukungan Keyboard Penuh**: Gunakan keyboard langsung untuk mengetik angka dan operasi matematika.
- **Copy to Clipboard**: Klik layar kalkulator untuk langsung menyalin hasil perhitungan.

## 📦 Menjalankan Proyek
Buka langsung file `index.html` di browser favorit Anda:
```bash
# Atau jalankan local server
npm start
```

## 🔥 Setup & Deploy ke Firebase Hosting
Project ini telah terhubung ke Firebase Project ID: `mycalculator-d4709`.

1. Login ke Firebase (cukup sekali):
   ```bash
   npm run login
   # atau: npx firebase login
   ```
2. Deploy ke Firebase Hosting:
   ```bash
   npm run deploy
   # atau: npm run deploy:hosting
   ```

## 🔗 Repository
[https://github.com/jolynnjolie/app-calculator-mb2.git](https://github.com/jolynnjolie/app-calculator-mb2.git)
