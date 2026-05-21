import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'

const imgPdfIcon = 'https://www.figma.com/api/mcp/asset/76415445-0e50-4f59-b9d3-1912365f7819'
const imgCsvIcon = 'https://www.figma.com/api/mcp/asset/ab2b1ed0-2311-4573-a6dc-fc2b667490aa'

export default function HistoriDetail() {
  const navigate = useNavigate()
  const [hasData, setHasData] = useState(false)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="text-center py-16 max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tidak Ada Data Detail</h2>
          <p className="text-gray-600 mb-6">Silahkan pilih riwayat analisis dari halaman Riwayat untuk melihat detail hasil perhitungan.</p>
          <Button variant="primary" size="md" onClick={() => navigate('/histori')} className="flex items-center gap-2 justify-center w-full">
            ← Kembali ke Riwayat
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="!p-0">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Detail Analisis Kinerja Ruas Jalan</h2>
          <div className="flex gap-6 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>🛣️</span>
              <span>Ruas MBZ</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>15 Desember 2024</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⏰</span>
              <span>08:00 - 09:00 WIB</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <button className="bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}>
          <img alt="PDF" src={imgPdfIcon} style={{ width: '18px', height: '18px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          Export PDF
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
        >
          <img alt="CSV" src={imgCsvIcon} style={{ width: '18px', height: '18px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          Export CSV
        </button>
        <Button variant="primary" size="md" onClick={() => navigate('/histori')} className="flex items-center gap-2">
          ← Kembali ke Riwayat
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="text-center">
          <p className="text-5xl font-bold text-blue-600 mb-2">B</p>
          <p className="text-sm text-gray-600">Level of Service</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-orange-600 mb-2">0,72</p>
          <p className="text-sm text-gray-600">Derajat Kejenuhan</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-gray-900 mb-2">3.600</p>
          <p className="text-sm text-gray-600">Volume (smp/jam)</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-gray-900 mb-2">5.000</p>
          <p className="text-sm text-gray-600">Kapasitas (smp/jam)</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-gray-900 mb-2">60</p>
          <p className="text-sm text-gray-600">Durasi (menit)</p>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* YOLO Detection Results */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Hasil Deteksi YOLO</h3>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                Auto Generated
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-700">Total Mobil Penumpang</span>
                <span className="font-bold text-gray-900">3.600 unit</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-700">Durasi Video</span>
                <span className="font-bold text-gray-900">60 menit</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-700">Interval Waktu Rekaman</span>
                <span className="font-bold text-gray-900">08:00 - 09:00 WIB</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-700">Volume Lalu Lintas (Q)</span>
                <span className="font-bold text-gray-900">3.600 smp/jam</span>
              </div>
            </div>
          </Card>

          {/* Capacity Calculation */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Perhitungan Kapasitas (C)</h3>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-center text-lg font-mono font-bold text-gray-900 mb-2">C = n × C₀ × FCₗₑ</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900 mb-1">4</p>
                <p className="text-xs text-gray-600">n (lajur)</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900 mb-1">1.250</p>
                <p className="text-xs text-gray-600">C₀ (smp/jam)</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900 mb-1">1,00</p>
                <p className="text-xs text-gray-600">FCₗₑ</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-700">5.000</p>
              <p className="text-sm text-gray-600">Kapasitas Jalan (C) smp/jam</p>
            </div>
          </Card>

          {/* Level of Service */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Level of Service</h3>
            <div className="text-center mb-6">
              <p className="text-8xl font-bold text-blue-600 mb-4">B</p>
            </div>
            <div className="text-center">
              <h4 className="text-xl font-bold text-gray-900 mb-2">Level of Service B</h4>
              <p className="text-sm text-gray-600">Kondisi lalu lintas stabil dengan kecepatan mulai dibatasi</p>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Road Parameters */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Parameter Ruas Jalan</h3>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                FIXED
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-700">Nama Ruas</span>
                <span className="font-bold text-gray-900">MBZ</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-700">Klasifikasi Jalan</span>
                <span className="font-bold text-gray-900">Jalan Tol</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-700">Tipe Jalan</span>
                <span className="font-bold text-gray-900">4/2</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-700">Jumlah Lajur</span>
                <span className="font-bold text-gray-900">4 lajur</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-700">Lebar Lajur</span>
                <span className="font-bold text-gray-900">3,5 m</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-700">Kecepatan Dasar MP</span>
                <span className="font-bold text-gray-900">88 km/jam</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Parameter tetap berdasarkan standar jalan tol & PKJI</p>
          </Card>

          {/* DJ Calculation */}
          <Card className="bg-orange-50 border border-orange-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Perhitungan DJ</h3>
            <div className="space-y-4 text-center">
              <div className="font-mono font-semibold text-gray-900 text-lg">DJ = Q / C</div>
              <div className="font-mono font-semibold text-gray-900 text-lg">DJ = 3,600 / 5,000</div>
              <div className="font-mono font-bold text-orange-700 text-4xl">DJ = 0.72</div>
            </div>
          </Card>

          {/* Conclusion */}
          <Card className="bg-blue-50 border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Kesimpulan Otomatis</h3>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                Auto Generated
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Berdasarkan hasil analisis kinerja lalu lintas pada Ruas MBZ yang dilakukan pada tanggal 15 Desember 2024 pukul 08:00-09:00 WIB, diperoleh nilai Derajat Kejenuhan (DJ) sebesar 0,72.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed mt-3">
              Dengan volume lalu lintas sebesar 3.600 smp/jam dan kapasitas jalan 5.000 smp/jam, ruas jalan ini memiliki Level of Service B, yang menunjukkan kondisi lalu lintas dalam keadaan stabil dengan kecepatan yang mulai dibatasi oleh kondisi lalu lintas.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed mt-3">
              Kondisi ini masih dalam kategori layanan yang baik dan belum memerlukan intervensi khusus untuk pengelolaan lalu lintas.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

HistoriDetail.propTypes = {
}
