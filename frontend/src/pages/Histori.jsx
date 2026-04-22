import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Card from '../components/UI/Card'

export default function Histori({ onLogout }) {
  const navigate = useNavigate()
  const [historyData, setHistoryData] = useState([])
  const [allDates, setAllDates] = useState([])
  const [selectedDate, setSelectedDate] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [previewItem, setPreviewItem] = useState(null)
  const itemsPerPage = 5

  // Filter data berdasarkan tanggal yang dipilih
  const filteredData = selectedDate === 'all' ? historyData : historyData.filter(item => {
    if (item.tanggal) {
      const itemDate = new Date(item.tanggal).toISOString().split('T')[0]
      return itemDate === selectedDate
    }
    return false
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Fetch history data
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, '');
        const res = await fetch(`${API_URL}/api/histori`)
        if (!res.ok) throw new Error('Failed to fetch history')
        
        const data = await res.json()
        const normalized = (data.data || []).map(item => ({
          ...item,
          djTerberat: item.djTerberat || item.dj || 0,
          levelPelayanan: item.levelPelayanan || '-',
          lajur: item.lajur || '-',
        }))
        setHistoryData(normalized)

        // Extract unique dates
        const uniqueDates = [...new Set(normalized.map(item => {
          if (item.tanggal) {
            return new Date(item.tanggal).toISOString().split('T')[0]
          }
          return null
        }).filter(Boolean))].sort().reverse()
        setAllDates(uniqueDates)
      } catch (err) {
        console.error('Error fetching history:', err)
      }
    }
    fetchHistory()
  }, [])

  // Reset pagination when selectedDate changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDate])

  // Export PDF for single lane
  const handleExportPDFLane = (item) => {
    if (!item) return
    
    const doc = new jsPDF('p', 'mm', 'a4')
    const laneLabel = item.lajur || 'Unknown'
    const mobil = item.mobil || 0
    const bus = item.bus || 0
    const truk = item.truk || 0
    const volume = item.volume || (mobil + bus * 1.6 + truk * 2)
    const dj = item.dj || 0
    const los = item.levelPelayanan || '-'
    const kategori = item.kategori || '-'

    // Header
    doc.setFontSize(16)
    doc.text('LAPORAN ANALISIS LALU LINTAS', 105, 15, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(`Metodologi PKJI 2023 - ${laneLabel}`, 105, 25, { align: 'center' })
    
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date(item.tanggal).toLocaleDateString('id-ID')}`, 105, 32, { align: 'center' })

    // Info table
    const infoData = [
      ['Nama Ruas Jalan', item.namaRuas || '-'],
      ['Tipe Jalan', item.tipeJalan || '-'],
      ['Interval Waktu', item.intervalWaktu || '-'],
      ['Lajur', laneLabel],
    ]

    autoTable(doc, {
      head: [['Parameter', 'Nilai']],
      body: infoData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [200, 200, 200], textColor: 0 },
    })

    // Vehicle data table
    const vehicleData = [
      ['Mobil', mobil, '1.0', mobil],
      ['Bus', bus, '1.6', Math.round(bus * 1.6)],
      ['Truk', truk, '2.0', Math.round(truk * 2)],
      ['TOTAL (Q)', '', '', Math.round(volume)],
    ]

    autoTable(doc, {
      head: [['Jenis', 'Jumlah', 'EMP', 'SMP']],
      body: vehicleData,
      startY: doc.lastAutoTable.finalY + 5,
      theme: 'grid',
      headStyles: { fillColor: [200, 200, 200], textColor: 0 },
    })

    // Results table
    const resultsData = [
      ['Volume (Q)', `${Math.round(volume)} smp/jam`],
      ['Kapasitas (C)', '5000 smp/jam'],
      ['DJ', dj.toFixed(3)],
      ['LOS', `${los} - ${kategori}`],
    ]

    autoTable(doc, {
      head: [['Parameter', 'Nilai']],
      body: resultsData,
      startY: doc.lastAutoTable.finalY + 5,
      theme: 'grid',
      headStyles: { fillColor: [200, 200, 200], textColor: 0 },
    })

    // Conclusion
    doc.setFontSize(10)
    doc.text('Kesimpulan:', 14, doc.lastAutoTable.finalY + 10)
    const wrappedText = doc.splitTextToSize(item.kesimpulan || 'N/A', 180)
    doc.text(wrappedText, 14, doc.lastAutoTable.finalY + 15)

    // Footer
    doc.setFontSize(8)
    doc.text(`© 2025 Kinerja Ruas Jalan | Printed on ${new Date().toLocaleString('id-ID')}`, 105, 285, { align: 'center' })

    doc.save(`Laporan-${laneLabel}-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Print preview
  const handlePrintPreviewLane = (item) => {
    if (!item) return
    setPreviewItem(item)
    setShowPrintPreview(true)
  }

  // Delete history
  const handleDeleteHistori = async (id, namaRuas) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data "${namaRuas}"?`)) return
    
    try {
        const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, '');
      const res = await fetch(`${API_URL}/api/histori/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!res.ok) throw new Error('Gagal menghapus data')
      
      // Remove from state
      setHistoryData(prev => prev.filter(item => item._id !== id))
      alert('Data berhasil dihapus!')
    } catch (err) {
      console.error('Error deleting histori:', err)
      alert('Gagal menghapus data: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
        <span>ℹ️</span>
        <p className="text-sm text-blue-900">Histori tersimpan otomatis setiap kali Anda melakukan analisis kinerja ruas jalan.</p>
      </div>

      {/* History Table */}
      <Card className="!p-0">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Riwayat Analisis</h3>
          <div className="flex gap-3">
            <button 
              onClick={() => setSelectedDate('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDate === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua Tanggal
            </button>
            <input
              type="date"
              value={selectedDate !== 'all' ? selectedDate : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value)
                  setCurrentPage(1)
                }
              }}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
              style={{ minWidth: '160px' }}
            />
          </div>
        </div>
        <div className="p-6">
          {historyData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Belum ada riwayat analisis</p>
              <p className="text-sm">Lakukan perhitungan kinerja ruas jalan di halaman Perhitungan untuk melihat histori di sini</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300 bg-gray-100">
                      <th className="px-4 py-3 text-left font-semibold">No</th>
                      <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                      <th className="px-4 py-3 text-left font-semibold">Nama Ruas</th>
                      <th className="px-4 py-3 text-left font-semibold">Tipe Jalan</th>
                      <th className="px-4 py-3 text-left font-semibold">Lajur</th>
                      <th className="px-4 py-3 text-center font-semibold">Waktu Rekaman</th>
                      <th className="px-4 py-3 text-center font-semibold">Durasi Video</th>
                      <th className="px-4 py-3 text-center font-semibold">DJ</th>
                      <th className="px-4 py-3 text-center font-semibold">LOS</th>
                      <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item, index) => (
                      <tr key={item.id || index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="px-4 py-3">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3">{item.namaRuas || '-'}</td>
                        <td className="px-4 py-3">{item.tipeJalan || '-'}</td>
                        <td className="px-4 py-3">{item.lajur}</td>
                        <td className="px-4 py-3 text-center">{item.intervalWaktu || '-'}</td>
                        <td className="px-4 py-3 text-center">{item.durasi || '-'}</td>
                        <td className="px-4 py-3 text-center">{(item.dj || 0).toFixed(3)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 rounded-lg font-semibold text-white bg-blue-600">
                            {item.levelPelayanan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handlePrintPreviewLane(item)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded font-semibold"
                              title="Preview"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleExportPDFLane(item)}
                              className="text-green-600 hover:text-green-800 hover:bg-green-100 p-2 rounded font-semibold"
                              title="Download PDF"
                            >
                              📥
                            </button>
                            <button
                              onClick={() => handleDeleteHistori(item._id, item.namaRuas)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded font-semibold"
                              title="Hapus Data"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ◀
                  </button>
                  <div className="flex items-center px-3 py-1.5 border border-blue-600 rounded-lg bg-blue-600 text-white">
                    {currentPage}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ▶
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Print Preview Modal */}
      {showPrintPreview && previewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl max-h-[90vh] overflow-auto p-8 relative">
            <button
              onClick={() => setShowPrintPreview(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
            
            <div style={{ fontFamily: 'Arial, sans-serif' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '20px' }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>LAPORAN ANALISIS LALU LINTAS</h2>
                <h3 style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>Metodologi PKJI 2023 - {previewItem.lajur}</h3>
                <p style={{ margin: '5px 0', fontSize: '11px', color: '#666' }}>
                  {new Date(previewItem.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', fontSize: '11px' }}>
                <div>
                  <p style={{ margin: '0', color: '#666', fontWeight: 'bold', fontSize: '10px' }}>Nama Ruas Jalan</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>{previewItem.namaRuas || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0', color: '#666', fontWeight: 'bold', fontSize: '10px' }}>Tipe Jalan</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>{previewItem.tipeJalan || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0', color: '#666', fontWeight: 'bold', fontSize: '10px' }}>Interval Waktu</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>{previewItem.intervalWaktu || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0', color: '#666', fontWeight: 'bold', fontSize: '10px' }}>Durasi</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>{previewItem.durasi || '-'}</p>
                </div>
              </div>

              {/* Lane Data */}
              <div style={{ marginBottom: '15px', border: '1px solid #ccc', padding: '10px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '11px' }}>DATA KENDARAAN</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e0e0e0' }}>
                      <th style={{ border: '1px solid #999', padding: '6px', textAlign: 'left' }}>Jenis</th>
                      <th style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>Jumlah</th>
                      <th style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>EMP</th>
                      <th style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>SMP</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #999', padding: '6px' }}>Mobil</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewItem.mobil || 0}</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>1.0</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewItem.mobil || 0}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #999', padding: '6px' }}>Bus</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewItem.bus || 0}</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>1.6</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{Math.round((previewItem.bus || 0) * 1.6)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #999', padding: '6px' }}>Truk</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewItem.truk || 0}</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>2.0</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{Math.round((previewItem.truk || 0) * 2.0)}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>
                      <td style={{ border: '1px solid #999', padding: '6px' }}>TOTAL (Q)</td>
                      <td colSpan="3" style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{Math.round(previewItem.volume || ((previewItem.mobil || 0) + (previewItem.bus || 0) * 1.6 + (previewItem.truk || 0) * 2))} smp/jam</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Results */}
              <div style={{ marginBottom: '15px', border: '1px solid #ccc', padding: '10px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '11px' }}>HASIL PERHITUNGAN</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e0e0e0' }}>
                      <th style={{ border: '1px solid #999', padding: '6px', textAlign: 'left' }}>Parameter</th>
                      <th style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #999', padding: '6px' }}>Volume (Q)</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{Math.round(previewItem.volume || ((previewItem.mobil || 0) + (previewItem.bus || 0) * 1.6 + (previewItem.truk || 0) * 2))} smp/jam</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #999', padding: '6px' }}>Kapasitas (C)</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>5000 smp/jam</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #999', padding: '6px' }}>DJ</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{(previewItem.dj || 0).toFixed(3)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #999', padding: '6px' }}>LOS</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewItem.levelPelayanan} - {previewItem.kategori}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Conclusion */}
              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '11px' }}>KESIMPULAN:</p>
                <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.6', color: '#333' }}>{previewItem.kesimpulan || 'N/A'}</p>
              </div>

              {/* Print Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank')
                    const printContent = document.querySelector('div[style*="fontFamily"]').outerHTML
                    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@media print{body{font-family:Arial}}</style></head><body>${printContent}</body></html>`)
                    printWindow.document.close()
                    setTimeout(() => { printWindow.print(); }, 500)
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                >
                  🖨️ Cetak
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                >
                  ✕ Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

Histori.propTypes = {
  onLogout: PropTypes.func,
}
