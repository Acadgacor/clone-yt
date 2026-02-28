# 🎬 CineView: Professional Web Theater

CineView adalah bioskop web minimalis dengan performa tinggi yang dirancang untuk pengalaman menonton yang imersif. Dilengkapi dengan antarmuka kustom YouTube bergaya "Liquid Glass" yang dioptimalkan untuk konten kurasi dan siaran langsung profesional.

## ✨ Fitur Unggulan

- **Liquid Glass UI**: Estetika premium ala iPhone menggunakan *backdrop blur* intensitas tinggi (`backdrop-blur-2xl`), lapisan transparan, dan tepian kaca tipis yang elegan untuk pengalaman visual yang mewah.
- **Resolution Locker (4K Support)**: Pemilih resolusi kelas profesional (144p hingga 4K) yang secara teknis memaksakan (*forced*) kualitas pilihan Anda. Fitur ini mencegah sistem otomatis YouTube menurunkan kualitas secara sepihak saat buffering.
- **Advanced Live Stream Experience**: 
    - **Live Badge**: Indikator animasi berdenyut merah yang cerdas, hanya muncul pada konten siaran langsung.
    - **Manual Sync-to-Live**: Tombol "Liquid Crystal" khusus untuk mengejar titik terbaru siaran langsung jika terjadi keterlambatan transmisi.
- **Cinema Mode Controls**: Kontrol yang menyembunyi otomatis (*auto-hide*) saat tidak digunakan untuk tampilan tanpa gangguan, dilengkapi efek "Cinema Glow" pada latar belakang untuk meningkatkan kontras.
- **Real-time Firestore Config**: Halaman pengaturan khusus (`/admin`) untuk memperbarui URL video, judul, dan deskripsi secara instan tanpa perlu melakukan deployment ulang.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) dengan teknik Glassmorphism kustom.
- **Components**: [ShadCN UI](https://ui.shadcn.com/) & [Lucide Icons](https://lucide.dev/).
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore) untuk sinkronisasi konfigurasi teater secara real-time.
- **Video Integration**: YouTube IFrame API dengan sistem *state-locking* kualitas video.

## 🚀 Panduan Instalasi Lokal

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/Acadgacor/clone-yt.git
   cd clone-yt
   ```

2. **Instalasi Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Firebase**:
   Pastikan Anda memiliki proyek Firebase yang aktif. Konfigurasi sudah tersedia di `src/firebase/config.ts`. Pastikan koleksi `settings` dengan dokumen `theater` sudah ada di Firestore Anda.

4. **Jalankan Server**:
   ```bash
   npm run dev
   ```
   Akses di `http://localhost:9002`.

## 🛠️ Solusi Masalah Git (Troubleshooting)

Jika Anda mengalami kendala saat melakukan pengiriman kode (*push*) ke GitHub, berikut adalah solusinya:

### 1. Error: `Authentication failed` (Password Not Supported)
GitHub kini mewajibkan **Personal Access Token (PAT)** sebagai pengganti password.
1. Masuk ke GitHub: **Settings > Developer Settings > Personal Access Tokens > Tokens (classic)**.
2. Buat token baru dengan izin `repo`.
3. Masukkan token tersebut ke dalam URL remote Anda:
   ```bash
   git remote set-url origin https://USERNAME:TOKEN_ANDA@github.com/Acadgacor/clone-yt.git
   git push -u origin main
   ```

### 2. Error: `rejected (fetch first)`
Ini terjadi karena ada file di GitHub yang belum ada di komputer Anda.
```bash
# Ambil perubahan dari GitHub dan gabungkan
git pull origin main --rebase

# Setelah bersih, lakukan push kembali
git push origin main
```

---

&copy; 2024 **CineView Labs** • Dirancang untuk pengalaman sinematik tanpa batas.