import PropTypes from 'prop-types'
import Card from '../components/UI/Card'

const steps1 = [
  '1. Pergi ke halaman Deteksi.',
  '2. Klik tombol INPUT VIDEO untuk memulai proses analisis.',
  '3. Sistem akan secara otomatis mendeteksi dan menghitung jumlah volume kendaraan.',
  '4. Setelah proses selesai, hasil deteksi akan ditampilkan dalam bentuk tabel dan grafik pada halaman hasil.',
]

const steps2 = [
  '1. Pergi ke halaman Perhitungan.',
  '2. Klik tombol UPLOAD CSV atau PILIH HASIL YOLO untuk memulai proses analisis.',
  '3. Sistem akan secara otomatis menginput data dan menghitung rumus berdasarkan PKJI 2023.',
  '4. Klik tombol "HITUNG RUMUS" untuk mendapatkan hasil perhitungan dan kesimpulan otomatis.',
]

export default function PetunjukPenggunaan() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Section 1: YOLO Detection */}
      <Card className="border border-gray-300">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-1" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>Tata Cara Penggunaan Aplikasi YOLOv8</h3>
        <p className="text-gray-600 text-center mb-6" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500}}>Panduan lengkap menggunakan fitur deteksi video</p>
        
        <div className="space-y-3">
          {steps1.map((step, index) => (
            <div key={index} className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors" style={{backgroundColor: '#fafafa'}}>
              <p className="text-gray-900" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500}}>{step}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 2: Capacity Calculation */}
      <Card className="border border-gray-300">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-1" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>Tata Cara Penggunaan Perhitungan Kinerja Ruas Jalan</h3>
        <p className="text-gray-600 text-center mb-6" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500}}>Panduan lengkap menggunakan fitur perhitungan PKJI</p>
        
        <div className="space-y-3">
          {steps2.map((step, index) => (
            <div key={index} className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors" style={{backgroundColor: '#fafafa'}}>
              <p className="text-gray-900" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500}}>{step}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Additional Tips */}
      <Card className="bg-green-50 border border-green-200">
        <h3 className="text-lg font-bold text-green-900 mb-4" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>✅ Tips Penggunaan</h3>
        <ul className="space-y-2 text-green-800 text-sm">
          <li style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>• Gunakan video berkualitas HD untuk hasil deteksi yang lebih akurat</li>
          <li style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>• Durasi video minimal 1 menit untuk mendapatkan data volume yang representative</li>
          <li style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>• Posisikan kamera dengan sudut pandang yang jelas terhadap arus lalu lintas</li>
          <li style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>• Pastikan kondisi pencahayaan cukup untuk deteksi kendaraan yang optimal</li>
          <li style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>• File CSV harus mengikuti format yang telah ditentukan dalam sistem</li>
          <li style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>• Simpan hasil analisis secara rutin untuk keperluan dokumentasi dan pelaporan</li>
        </ul>
      </Card>

      {/* FAQ Section */}
      <Card className="border border-gray-300">
        <h3 className="text-lg font-bold text-gray-900 mb-4" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>❓ Pertanyaan Umum</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 600}}>Q: Berapa lama waktu yang dibutuhkan untuk proses analisis?</h4>
            <p className="text-gray-700 text-sm" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>A: Waktu proses tergantung durasi video. Rata-rata 1 menit video membutuhkan waktu 2-3 menit untuk dianalisis.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 600}}>Q: Format video apa yang didukung?</h4>
            <p className="text-gray-700 text-sm" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>A: Sistem mendukung format MP4, AVI, MOV dengan resolusi minimum 720p.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 600}}>Q: Bagaimana cara menghubungi administrator?</h4>
            <p className="text-gray-700 text-sm" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>A: Hubungi melalui WhatsApp ke nomor yang tercantum di halaman bantuan Login.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 600}}>Q: Apakah data saya aman?</h4>
            <p className="text-gray-700 text-sm" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>A: Ya, semua data dienkripsi dan disimpan dengan keamanan tingkat enterprise sesuai standar internasional.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

PetunjukPenggunaan.propTypes = {
}
