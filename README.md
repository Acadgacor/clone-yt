# 🎬 CineView: Professional Web Theater

CineView adalah bioskop web minimalis dengan performa tinggi yang dirancang untuk pengalaman menonton yang imersif. Dilengkapi dengan antarmuka kustom YouTube bergaya "Liquid Glass" yang dioptimalkan untuk konten kurasi dan siaran langsung profesional.

## ✨ Fitur Unggulan

- **Liquid Glass UI**: Estetika premium ala iPhone menggunakan *backdrop blur* intensitas tinggi (`backdrop-blur-2xl`), lapisan transparan, dan tepian kaca tipis yang elegan.
- **Resolution Locker**: Pemilih resolusi kelas profesional (144p hingga 4K) yang secara teknis memaksakan (*forced*) kualitas pilihan Anda, mencegah sistem otomatis YouTube menurunkan kualitas secara sepihak.
- **Live Stream Experience**: 
    - **Live Badge**: Indikator animasi berdenyut merah untuk siaran waktu nyata yang hanya muncul pada konten Live.
    - **Manual Sync-to-Live**: Tombol "Liquid Crystal" khusus untuk mengejar titik terbaru siaran langsung jika terjadi buffering.
- **Cinema Mode**: Kontrol yang menyembunyi otomatis saat tidak digunakan untuk tampilan tanpa gangguan, dilengkapi efek "Cinema Glow" pada latar belakang.
- **Firebase Real-time Config**: Halaman pengaturan khusus (`/admin`) untuk memperbarui URL video dan judul secara instan melalui Firestore.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS dengan Glassmorphism kustom.
- **Components**: ShadCN UI & Lucide Icons.
- **Database**: Firebase Firestore (untuk konfigurasi teater).
- **Video API**: YouTube IFrame API dengan integrasi resolusi manual.

## 🚀 Cara Menjalankan

### 1. Prasyarat
- Pastikan Anda memiliki akun [Firebase](https://console.firebase.google.com/).
- Buat proyek Firestore dan buat dokumen di: `settings/theater`.

### 2. Instalasi
```bash
# Clone repositori
git clone https://github.com/Acadgacor/clone-yt.git

# Masuk ke direktori
cd clone-yt

# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev
```

## 🛠️ Troubleshooting Git (PENTING)

Jika Anda mendapatkan error saat melakukan `git push`, berikut adalah solusinya:

### 1. Error: `rejected (fetch first)`
Ini terjadi karena GitHub memiliki perubahan yang belum ada di lokal Anda. Jalankan perintah ini:
```bash
# Gabungkan perubahan dari remote dengan rebase
git pull origin main --rebase

# Kemudian push kembali
git push origin main
```

### 2. Error: `Authentication failed (Password not supported)`
GitHub memerlukan **Personal Access Token (PAT)** sebagai pengganti password.
1. Buat Token di: `Settings > Developer Settings > Personal Access Tokens > Tokens (classic)`.
2. Berikan izin `repo`.
3. Gunakan perintah ini untuk memasukkan token ke URL remote Anda:
```bash
git remote set-url origin https://USERNAME:TOKEN_ANDA@github.com/Acadgacor/clone-yt.git
git push -u origin main
```

---

&copy; 2024 CineView Labs • Dibuat untuk pengalaman sinematik terbaik.