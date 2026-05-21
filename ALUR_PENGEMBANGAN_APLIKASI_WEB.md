# Alur Pembuatan Aplikasi Web Deteksi Kendaraan

Dokumen ini merangkum urutan pembuatan aplikasi web fullstack ini dari awal pengembangan lokal sampai deployment produksi.

## Ringkasan Arsitektur

Aplikasi ini terdiri dari 3 bagian utama:

1. Frontend: React.js
2. Backend: Node.js
3. AI Detection Service: YOLOv8n + FastAPI

Alur besar sistem:

```text
User -> Frontend React -> Backend Node.js -> FastAPI YOLOv8n -> Hasil deteksi
```

Untuk deployment:

- Frontend -> Vercel
- Backend -> Railway
- YOLOv8n FastAPI -> Cloudflare Tunnel

## Urutan Pengerjaan

### 1. Mulai dari folder Python / YOLO dulu

Tahap awal dikerjakan di folder Python YOLO secara manual.

Langkah yang dilakukan:

1. Membuat folder proyek YOLO secara manual.
2. Menyiapkan struktur data dataset.
3. Mengekstrak video menjadi frame.
4. Melabeli data secara manual menggunakan LabelImg.
5. Menyusun file dataset YOLO seperti `images/`, `labels/`, dan `data.yaml`.
6. Training model YOLOv8n dari terminal VS Code.
7. Melakukan testing lokal sampai hasil deteksi stabil.

Contoh alur dataset:

```text
video -> frame -> label -> train/val -> training YOLOv8n -> best.pt
```

### 2. Persiapan dan Training Model YOLO

Setelah dataset siap, model dilatih secara lokal.

Hal yang biasanya dilakukan:

- Menjalankan training YOLOv8n dari terminal VS Code.
- Mengecek hasil training di folder `runs/`.
- Mengevaluasi akurasi deteksi.
- Mengulangi labeling atau training jika hasil belum bagus.

Output yang diharapkan:

- Model terbaik: `best.pt`
- Hasil evaluasi
- Video hasil deteksi
- Log training

### 3. Buat FastAPI untuk servis model

Setelah model siap, dibuat API Python dengan FastAPI untuk menerima request dari backend.

Tugas API ini:

- Menerima file video.
- Menjalankan inferensi YOLOv8n.
- Mengembalikan hasil deteksi dalam format JSON.
- Menyediakan endpoint health check.

Dengan cara ini, model AI dipisahkan dari backend utama supaya lebih mudah dipelihara.

### 4. Bangun Backend Node.js

Setelah sisi YOLO siap, backend Node.js dibuat sebagai penghubung antara frontend dan service AI.

Fungsi backend:

- Menerima request dari frontend.
- Menyimpan data hasil deteksi.
- Mengatur autentikasi, routing, dan logika aplikasi.
- Menghubungkan frontend ke FastAPI YOLO.

Backend ini menjadi lapisan tengah agar frontend tidak langsung berkomunikasi ke service AI.

### 5. Bangun Frontend React.js

Frontend dibuat setelah backend dan AI service mulai terbentuk.

Fokus frontend:

- Menampilkan login dan dashboard.
- Menyediakan halaman upload video.
- Menampilkan hasil deteksi kendaraan.
- Menampilkan histori dan detail analisis.
- Mengintegrasikan semua API dari backend.

### 6. Integrasi API

Setelah frontend, backend, dan YOLO siap, semua bagian dihubungkan.

Urutan integrasi:

1. Frontend mengirim request ke backend.
2. Backend meneruskan proses ke FastAPI YOLO.
3. YOLO memproses video dan mengembalikan hasil.
4. Backend menyimpan atau meneruskan hasil ke frontend.
5. Frontend menampilkan status dan output ke pengguna.

## Alur Pengembangan Lokal

Sebelum deployment, semua komponen dijalankan di lokal terlebih dahulu.

### Tahap Lokal

- Jalankan YOLO FastAPI di lokal.
- Jalankan backend Node.js di lokal.
- Jalankan frontend React di lokal.
- Test alur upload video dari frontend sampai hasil keluar.

### Tujuan testing lokal

- Memastikan endpoint berjalan.
- Memastikan model YOLO bisa membaca video.
- Memastikan backend bisa meneruskan request.
- Memastikan frontend bisa menampilkan hasil.

## Deployment

Setelah semua stabil di lokal, deployment dilakukan per bagian.

### Frontend ke Vercel

Frontend React di-deploy ke Vercel karena cocok untuk aplikasi statis/SPA.

Langkah umum:

- Build frontend.
- Set environment variable jika ada.
- Push atau connect repo ke Vercel.
- Deploy otomatis.

### Backend ke Railway

Backend Node.js di-deploy ke Railway agar API utama berjalan online.

Langkah umum:

- Pastikan backend bisa jalan tanpa dependency lokal.
- Tambahkan konfigurasi environment.
- Deploy backend dari repository.
- Cek endpoint publik backend.

### YOLOv8n FastAPI via Cloudflare Tunnel

Service YOLOv8n FastAPI dijalankan dengan Cloudflare Tunnel supaya API Python lokal bisa diakses dari luar.

Kenapa pakai tunnel:

- Model dan proses inference bisa tetap dijalankan terpisah.
- Lebih mudah saat pengujian dan integrasi.
- Tidak perlu expose server lokal secara langsung.

## Alur Besar Pengerjaan yang Disarankan

```text
1. Siapkan folder YOLO
2. Ekstrak video jadi frame
3. Label data manual dengan LabelImg
4. Training YOLOv8n di terminal VS Code
5. Buat FastAPI untuk inference
6. Buat backend Node.js
7. Buat frontend React.js
8. Integrasikan API antar service
9. Test lokal end-to-end
10. Deploy frontend ke Vercel
11. Deploy backend ke Railway
12. Jalankan YOLOv8n via Cloudflare Tunnel
```

## Struktur Folder Secara Konseptual

```text
project/
├── frontend/        -> React.js
├── backend/         -> Node.js
└── backend/yolo/    -> YOLOv8n + FastAPI + training assets
```

## Catatan Penting

- Mulai dari YOLO dulu karena model AI adalah inti dari hasil deteksi.
- Lakukan semua testing di lokal sebelum deploy.
- Pastikan format response API konsisten agar frontend mudah membaca hasil.
- Deployment dipisah supaya setiap komponen lebih mudah dikelola.

## Kesimpulan

Urutan pembangunan aplikasi ini adalah:

1. Kerjakan folder YOLO secara manual.
2. Ekstrak frame dari video dan label data.
3. Train YOLOv8n di terminal VS Code.
4. Buat FastAPI untuk inference.
5. Bangun backend Node.js.
6. Bangun frontend React.js.
7. Integrasikan semua API.
8. Test lokal sampai stabil.
9. Deploy frontend ke Vercel.
10. Deploy backend ke Railway.
11. Jalankan YOLOv8n FastAPI melalui Cloudflare Tunnel.

Jika diperlukan, file ini bisa dijadikan dasar untuk README, dokumentasi tugas akhir, atau panduan instalasi proyek.