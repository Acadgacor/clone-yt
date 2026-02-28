# CineView - Professional Web Theater

A high-end, minimalist YouTube cinema experience built with Next.js, Genkit, and Firebase.

## 🛠️ Cara Memperbaiki Error Git Push

Jika Anda melihat pesan `remote: Invalid username or token`, itu karena GitHub memerlukan **Personal Access Token (PAT)**, bukan kata sandi akun Anda.

### Langkah 1: Buat Personal Access Token (PAT)
1. Pergi ke **Settings** di GitHub Anda.
2. Klik **Developer settings** (paling bawah di sidebar kiri).
3. Klik **Personal access tokens** -> **Tokens (classic)**.
4. Klik **Generate new token (classic)**.
5. Beri nama (misal: "Studio Push"), centang scope `repo`, lalu klik **Generate token**.
6. **Penting:** Salin token tersebut dan simpan, karena Anda tidak akan bisa melihatnya lagi.

### Langkah 2: Update URL Remote di Terminal
Hapus remote yang salah dan tambahkan yang baru dengan token Anda agar tidak perlu memasukkan kata sandi lagi:

```bash
# Hapus remote origin yang sudah ada
git remote remove origin

# Tambahkan kembali menggunakan format token
# Ganti <TOKEN> dengan token yang Anda salin tadi
git remote add origin https://<TOKEN>@github.com/Acadgacor/ytclone.git

# Push kembali
git push -u origin main
```

## Fitur Utama CineView
- **Liquid Glass UI**: Antarmuka berbasis Glassmorphism ala iOS.
- **Hard Quality Lock**: Memaksa resolusi tetap tinggi (1080p/4K) meskipun video di-buffer.
- **Live Stream Ready**: Deteksi otomatis siaran langsung dengan tombol sinkronisasi manual.
- **Cinema Glow**: Efek pendaran cahaya dinamis di belakang player.
