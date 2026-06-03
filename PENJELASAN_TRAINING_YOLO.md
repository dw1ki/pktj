# Penjelasan Training Model Deteksi Kendaraan (YOLO)
## Versi Mudah Dipahami

---

## 1. Apa yang Kami Lakukan?

Kami melatih sebuah **model AI untuk mendeteksi kendaraan** di video/gambar.

### Data yang Digunakan:
- **Total foto kendaraan**: 977 gambar
  - **Untuk belajar** (training): 798 gambar
  - **Untuk ujian** (validation): 179 gambar
- **Tujuan**: Agar model bisa mengenali dan menandai kendaraan dengan akurat

### Hasil Utama:
- **Model terbaik tersimpan di**: `best.pt`
- **Log pencapaian**: `results.csv` (catatan nilai setiap iterasi)

---

## 2. Bagaimana Model Belajar? (Proses 100 Iterasi)

Model dilatih selama **100 iterasi (disebut epoch)**. Setiap iterasi ada dua tahap:

### Per Iterasi (Epoch):

**Tahap 1 - PEMBELAJARAN** (798 gambar training):
- Tunjukkan 798 gambar kepada model
- Model menebak ada kendaraan di mana
- Model bandingkan tebakannya dengan jawaban benar
- **Perbaiki model** berdasarkan kesalahan

**Tahap 2 - UJIAN** (179 gambar validation - gambar yang belum pernah dilihat):
- Tunjukkan 179 gambar baru kepada model
- Model menebak (tapi TIDAK diperbaiki di tahap ini)
- Lihat hasilnya akurat berapa persen
- **Simpan nilai ujian ke results.csv**
- **Jika nilai terbaik → simpan model ini sebagai best.pt**

### Analogi Sederhana:
```
Seperti siswa belajar:
├─ Pagi: Belajar dari 798 soal (pembelajaran)
├─ Siang: Ujian dengan 179 soal baru (evaluasi)
└─ Ulangi 100 hari sampai nilai ujian stabil/terbaik
```

### Hasil:
- Setelah 100 iterasi, kami punya **model terbaik (best.pt)** yang paling akurat mendeteksi kendaraan

---

## 3. Hasil Training - Apa Saja yang Dihasilkan?

Setelah training selesai, ada beberapa file output:

| File | Apa Isinya | Untuk Apa |
|------|-----------|----------|
| **best.pt** | Model terbaik | **GUNAKAN INI** untuk mendeteksi kendaraan di video/foto baru |
| **last.pt** | Model iterasi ke-100 | Biasanya kurang bagus, jangan gunakan |
| **results.csv** | Nilai ujian setiap iterasi | Data untuk analisis perkembangan training |
| **results.png** | Grafik perkembangan | Visualisasi kemajuan pembelajaran |
| **BoxF1_curve.png** | Kurva performa optimal | Menunjukkan performa terbaik model |

### Contoh hasil dari results.csv (100 baris):
```
Iterasi | Akurasi Precision | Akurasi Recall | Performa Keseluruhan
   1    |      0.89         |      0.82      |       0.55
   2    |      0.89         |      0.86      |       0.61
   ...
  100   |      0.90         |      0.92      |       0.72 ← Terbaik
```

- **Precision**: Dari semua yang model prediksi sebagai kendaraan, berapa persen yang benar?
- **Recall**: Dari semua kendaraan yang sebenarnya ada, berapa persen yang berhasil dideteksi?
- **Performa Keseluruhan (mAP)**: Kombinasi keduanya (semakin tinggi semakin baik)

---

## 4. Pertanyaan: Dari Mana Nilai "0.90 at 0.395"?

### Jawaban Singkat:
Nilai **0.395** TIDAK ada di `results.csv`! Ini dihitung **SETELAH training selesai**.

### Penjelasan Lengkap:

Setelah model dilatih dan mendapat nilai terbaik (best.pt), kami melakukan satu langkah tambahan:

**Eksperimen**: Jalankan model dengan "kepercayaan" yang berbeda-beda

```
Contoh:
├─ Jika model 50% yakin ada kendaraan → "Baik, saya terima"
├─ Jika model 60% yakin ada kendaraan → "Baik, saya terima"
├─ Jika model 39.5% yakin ada kendaraan → "Baik, saya terima" ← OPTIMAL
├─ Jika model 40% yakin ada kendaraan → "Baik, saya terima"
├─ Jika model 30% yakin ada kendaraan → "Tidak, terlalu tidak yakin"
```

### Prosesnya:
1. **Ambil model terbaik** (best.pt)
2. **Jalankan pada 179 gambar ujian**, tapi coba berbagai tingkat kepercayaan (0%-100%)
3. **Untuk setiap tingkat kepercayaan**, hitung:
   - **Precision**: Deteksi saya benar berapa persen?
   - **Recall**: Kendaraan yang ada, saya deteksi berapa persen?
   - **F1 Score**: Gabungan keduanya (nilai 0-1, semakin besar semakin baik)
4. **Cari yang terbaik**: Tingkat kepercayaan mana yang menghasilkan F1 Score tertinggi?

### Hasilnya:
- **F1 Score tertinggi: 0.90** (dari skala 0-1)
- **Diperoleh pada tingkat kepercayaan: 39.5%** (0.395)

### Analogi:
```
Seperti mencari persentase diskon yang paling menguntungkan:
├─ Diskon 30% → Untung tapi banyak yang salah deteksi
├─ Diskon 39.5% → TERBAIK (untung optimal)
├─ Diskon 50% → Untung tapi terlalu ketat, banyak terlewat
```

### Grafik Visualnya:
```
Akurasi Kombinasi (F1 Score)
         │
      1.0├─────────────────────────────────
         │
      0.9├─────────────┐ PUNCAK ← F1 = 0.90 at 39.5%
         │             │
      0.8├─────────────┴──────────────────
         │
      0.0└─┬──────┬──────┬──────┬──────► Tingkat Kepercayaan (%)
         10%   30%   39.5%  50%   70%
```

---

## 5. Hubungan best.pt dengan Semua Kurva

```
best.pt (Model Terbaik)
    │
    ├─ Validation metrics di epoch terbaik:
    │  ├─ Precision = ~0.90 (di default threshold 0.5)
    │  ├─ Recall = ~0.92
    │  └─ mAP50-95 = ~0.72
    │
    └─ Digunakan untuk generate Curves:
       ├─ BoxF1_curve.png
       ├─ BoxP_curve.png
       ├─ BoxR_curve.png
       └─ Confidence Matrix
```

Semua kurva digenerate dari **model yang sama (best.pt)**, hanya dengan **confidence threshold berbeda**:
- F1 curve: Menunjukkan F1 score optimal
- Precision curve: Menunjukkan trade-off precision vs threshold
- Recall curve: Menunjukkan trade-off recall vs threshold

---

## 5. Kenapa Ada Training Set dan Validation Set?

### Training Set (798 gambar):
- **Fungsi**: Untuk model BELAJAR
- **Yang terjadi**: Model melihat gambar + jawaban benar, lalu perbaiki dirinya sendiri
- **Analogi**: Seperti siswa belajar dari buku dan mengerjakan soal

### Validation Set (179 gambar):
- **Fungsi**: Untuk UJIAN model (gambar yang belum pernah dilihat)
- **Yang terjadi**: Model memberi jawaban, tapi tidak belajar dari kesalahan (model tidak diperbaiki)
- **Analogi**: Seperti siswa mengikuti ujian tanpa bisa melihat jawaban

### Kenapa Dipisah?
```
Jika hanya pakai training set:
└─ Model bisa "menghafal" gambar training
   └─ Nilainya bagus di training set
   └─ Tapi jelek di gambar baru (seperti siswa yang hanya hafal soal ujian)

Jika pakai validation set:
└─ Bisa ketahuan apakah model benar-benar mengerti atau hanya menghafal
└─ Otomatis simpan model terbaik di validation set
└─ Model bisa menggunakan skill ke gambar baru (generalisasi)
```

### Hubungannya dengan best.pt:
```
Setelah 100 iterasi:
├─ Iterasi 1:   Nilai ujian = 0.554
├─ Iterasi 2:   Nilai ujian = 0.613
├─ Iterasi 28:  Nilai ujian = 0.706 ← TERBAIK (simpan sebagai best.pt)
├─ Iterasi 50:  Nilai ujian = 0.700 (lebih jelek, tidak simpan)
└─ Iterasi 100: Nilai ujian = 0.695 (terus menurun, menandakan overfitting)
```

---

## 6. Kesimpulan & Rekomendasi

### Ringkasan Singkat:
1. ✅ **Training berjalan 100 iterasi** dengan kedua set data (training + ujian)
2. ✅ **Semua hasil akurat tersimpan dalam results.csv** (nilai setiap iterasi)
3. ✅ **Model terbaik dipilih otomatis** sebagai `best.pt`
4. ✅ **Nilai 0.395 dihitung setelah training** dengan mencoba berbagai tingkat kepercayaan
5. ✅ **F1 Score 0.90 adalah hasil optimal** di tingkat kepercayaan 39.5%

### Rekomendasi Penggunaan:
```python
# Untuk mendeteksi kendaraan di foto/video baru:
from ultralytics import YOLO

model = YOLO('best.pt')
hasil = model.predict(source='video.mp4', conf=0.395)
```

### Performa Model:
- **Precision**: ~0.90 → Dari semua yang dideteksi sebagai kendaraan, 90% benar
- **Recall**: ~0.92 → Dari semua kendaraan yang ada, 92% berhasil dideteksi
- **F1 Score Optimal**: 0.90 (skala 0-1)
- **Waktu training**: ~9.6 jam
