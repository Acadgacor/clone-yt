# 🎬 CineView: Professional Web Theater

CineView adalah bioskop web minimalis dengan performa tinggi yang dirancang untuk pengalaman menonton yang imersif. Dilengkapi dengan antarmuka kustom YouTube bergaya "Liquid Glass" yang dioptimalkan untuk konten kurasi dan siaran langsung profesional.

## ✨ Fitur Unggulan

- **Liquid Glass UI**: Estetika premium ala iPhone menggunakan *backdrop blur* intensitas tinggi, lapisan transparan, dan tepian ultra-tipis.
- **Dukungan Live Stream Canggih**: 
    - **Live Badge**: Indikator animasi berdenyut untuk siaran waktu nyata.
    - **Manual Sync-to-Live**: Tombol kristal cair khusus untuk mengejar titik terbaru siaran langsung setelah buffering.
- **Forced Resolution Control**: Pemilih resolusi kelas profesional (144p hingga 4K) yang "mengunci" kualitas pilihan Anda, mencegah sistem otomatis YouTube menurunkan kualitas secara sepihak.
- **Cinema Mode Experience**: 
    - Kontrol yang menyembunyi otomatis untuk tampilan tanpa gangguan.
    - Efek "Cinema Glow" pada latar belakang untuk kedalaman visual.
    - Tata letak responsif untuk Desktop, Tablet, dan Mobile.
- **Instant Administration**: Halaman pengaturan khusus untuk memperbarui URL video dan judul secara waktu nyata melalui Firebase Firestore.

## 🚀 Cara Menjalankan

### 1. Konfigurasi Firebase
Perbarui `src/firebase/config.ts` dengan kredensial Firebase Anda. Pastikan aturan Firestore mengizinkan akses baca pada koleksi `settings/theater`.

### 2. Instalasi & Pengembangan
```bash
npm install
npm run dev
```

## 🛠️ Panduan Push ke GitHub (Solusi Authentication Error)

Jika Anda mendapatkan error `Invalid username or token`, ikuti langkah ini:

1. **Buat Personal Access Token (PAT)**:
   - Masuk ke GitHub -> Settings -> Developer Settings -> Personal Access Tokens -> Tokens (classic).
   - Klik "Generate new token". Pilih scope `repo`.
   - Salin token tersebut (ini adalah "kata sandi" baru Anda).

2. **Perbarui Remote URL di Terminal**:
   Ganti `<YOUR_TOKEN>` dengan token yang baru saja Anda buat:
   ```bash
   git remote set-url origin https://<YOUR_TOKEN>@github.com/Acadgacor/clone-yt.git
   ```

3. **Push Kembali**:
   ```bash
   git push -u origin main
   ```

## 📄 Lisensi
Proyek ini dibangun untuk tujuan demonstrasi portofolio. Built with ❤️ for the art of cinema.
