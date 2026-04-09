import PropTypes from 'prop-types'
import Card from '../components/UI/Card'

export default function InformasiWebsite() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Website Information */}
      <Card className="border border-gray-300">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-1" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>Informasi Website</h2>
        <p className="text-xl text-gray-600 text-center mb-6" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500}}>Website Kinerja Ruas Jalan Indonesia</p>
        <p className="text-gray-700 leading-relaxed" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>
          Website kinerja ruas jalan Indonesia adalah aplikasi web untuk menentukan tingkat pelayanan jalan yang berpedoman pada Pedoman Kapasitas Jalan Indonesia (PKJI) 2023. Sistem ini menggunakan teknologi deteksi YOLO terkini untuk menghitung volume kendaraan secara otomatis dari rekaman video, kemudian menghitung derajat kejenuhan dan level of service sesuai dengan standar nasional Indonesia.
        </p>
      </Card>

      {/* Developer Information */}
      <Card className="border border-gray-300">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-8" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>Developer Website</h3>
        <div className="flex items-center gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-200 to-blue-400 rounded-full flex items-center justify-center text-6xl shadow-lg">
              👨‍💻
            </div>
          </div>
          
          {/* Developer Info */}
          <div className="flex-1">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 600}}>Nama:</p>
                <p className="text-lg font-bold text-gray-900" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>Yunindra Eka Ariffansyah</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 600}}>Instansi:</p>
                <p className="text-lg font-bold text-gray-900" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>PKTJ Tegal Angkatan XXXIII</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Information */}
      <Card className="bg-blue-50 border border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-4" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>ℹ️ Tentang Teknologi</h3>
        <ul className="space-y-3 text-blue-900 text-sm">
          <li style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500}}>• <span className="font-semibold">Deteksi Kendaraan:</span> YOLOv8 (Real-time Object Detection)</li>
          <li style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500}}>• <span className="font-semibold">Backend:</span> Python dengan FastAPI</li>
          <li style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500}}>• <span className="font-semibold">Frontend:</span> React 18 dengan Tailwind CSS</li>
          <li style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500}}>• <span className="font-semibold">Database:</span> MongoDB Atlas</li>
          <li style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500}}>• <span className="font-semibold">Versi PKJI:</span> 2023 (Indonesian Highway Capacity Manual)</li>
        </ul>
      </Card>

      {/* Version & License */}
      <Card className="bg-gray-100 border border-gray-300 text-center py-8">
        <p className="text-gray-700 mb-2" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 500}}>Kinerja Ruas Jalan Indonesia v1.0.0</p>
        <p className="text-sm text-gray-600" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>© 2024 All Rights Reserved</p>
        <p className="text-xs text-gray-500 mt-4" style={{fontFamily: 'Poppins, sans-serif', fontWeight: 400}}>Aplikasi ini dikembangkan untuk keperluan analisis kinerja ruas jalan Indonesia berdasarkan standar PKJI 2023</p>
      </Card>
    </div>
  )
}

InformasiWebsite.propTypes = {
}
