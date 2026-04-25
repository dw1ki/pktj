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
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [sortConfig, setSortConfig] = useState({ key: 'tanggal', direction: 'desc' })

  // Filter data berdasarkan tanggal yang dipilih
  const filteredData = selectedDate === 'all' ? historyData : historyData.filter(item => {
    if (item.tanggal) {
      const itemDate = new Date(item.tanggal).toISOString().split('T')[0]
      return itemDate === selectedDate
    }
    return false
  })

  // Sort data
  const getSortedData = () => {
    const sorted = [...filteredData].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      // Handle date
      if (sortConfig.key === 'tanggal') {
        aValue = new Date(a.tanggal)
        bValue = new Date(b.tanggal)
      }

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Handle string values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return 0
    })

    return sorted
  }

  const sortedData = getSortedData()
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

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

  // Export PDF for all filtered history
  const handleExportPDFAll = () => {
    if (sortedData.length === 0) {
      alert('Tidak ada data untuk diunduh')
      return
    }

    const doc = new jsPDF('l', 'mm', 'a4')
    const dateLabel = selectedDate === 'all' ? 'Semua Tanggal' : new Date(selectedDate).toLocaleDateString('id-ID')

    // Header
    doc.setFontSize(16)
    doc.text('LAPORAN RIWAYAT ANALISIS LALU LINTAS', 148, 15, { align: 'center' })
    
    doc.setFontSize(11)
    doc.text(`Periode: ${dateLabel}`, 148, 22, { align: 'center' })
    
    doc.setFontSize(9)
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 148, 28, { align: 'center' })

    // Prepare table data
    const tableHead = [
      ['No', 'Tanggal', 'Nama Ruas', 'Tipe Jalan', 'Lajur', 'Waktu Rekaman', 'Durasi', 'Vol. (kend/jam)', 'Vol. (smp/jam)', 'Kapasitas (C)', 'DJ', 'LOS']
    ]

    const tableBody = sortedData.map((item, index) => [
      index + 1,
      new Date(item.tanggal).toLocaleDateString('id-ID'),
      item.namaRuas || '-',
      item.tipeJalan || '-',
      item.lajur || '-',
      item.intervalWaktu || '-',
      item.durasi || '-',
      (item.mobil || 0) + (item.bus || 0) + (item.truk || 0),
      Math.round(item.volume || ((item.mobil || 0) + (item.bus || 0) * 1.6 + (item.truk || 0) * 2)),
      '5000',
      (item.dj || 0).toFixed(3),
      item.levelPelayanan || '-'
    ])

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [64, 64, 64], textColor: [255, 255, 255], fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' },
        8: { halign: 'center' },
        9: { halign: 'center' },
        10: { halign: 'center' },
        11: { halign: 'center' }
      },
      margin: { left: 10, right: 10 }
    })

    // Footer
    doc.setFontSize(8)
    doc.text(`Total Data: ${sortedData.length} | © 2025 Kinerja Ruas Jalan`, 148, doc.internal.pageSize.height - 10, { align: 'center' })

    const filename = selectedDate === 'all' 
      ? `Laporan-Histori-${new Date().toISOString().split('T')[0]}.pdf`
      : `Laporan-Histori-${selectedDate}.pdf`
    
    doc.save(filename)
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
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Riwayat Analisis</h3>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setSelectedDate('all')
                  setCurrentPage(1)
                }}
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

          {/* Download All Button */}
          <button
            onClick={handleExportPDFAll}
            disabled={historyData.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            📥 Download Semua Hasil Histori
          </button>
        </div>
        <div className="p-6">
          {historyData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Belum ada riwayat analisis</p>
              <p className="text-sm">Lakukan perhitungan kinerja ruas jalan di halaman Perhitungan untuk melihat histori di sini</p>
            </div>
          ) : (
            <>
              <div className="w-full">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300 bg-gray-100">
                      <th className="px-2 py-2 text-left font-semibold whitespace-nowrap min-w-max">No</th>
                      <th className="px-2 py-2 text-left font-semibold whitespace-nowrap min-w-max">Tgl</th>
                      <th className="px-2 py-2 text-left font-semibold whitespace-nowrap min-w-max">Nama Ruas</th>
                      <th className="px-2 py-2 text-left font-semibold whitespace-nowrap min-w-max">Tipe</th>
                      <th className="px-2 py-2 text-left font-semibold whitespace-nowrap min-w-max">Lajur</th>
                      <th className="px-2 py-2 text-center font-semibold whitespace-nowrap min-w-max">
                        <button onClick={() => handleSort('intervalWaktu')} className="flex items-center gap-0.5 hover:text-blue-600 justify-center w-full text-xs">
                          Waktu <span className="text-xs">⬍</span>
                        </button>
                      </th>
                      <th className="px-2 py-2 text-center font-semibold whitespace-nowrap min-w-max">Durasi</th>
                      <th className="px-2 py-2 text-center font-semibold whitespace-nowrap min-w-max">
                        <button onClick={() => handleSort('kendaraan')} className="flex items-center gap-0.5 hover:text-blue-600 justify-center w-full text-xs">
                          Vol. <br/>Kend. <span className="text-xs">⬍</span>
                        </button>
                      </th>
                      <th className="px-2 py-2 text-center font-semibold whitespace-nowrap min-w-max">
                        <button onClick={() => handleSort('volume')} className="flex items-center gap-0.5 hover:text-blue-600 justify-center w-full text-xs">
                          Vol. <br/>SMP <span className="text-xs">⬍</span>
                        </button>
                      </th>
                      <th className="px-2 py-2 text-center font-semibold whitespace-nowrap min-w-max">Kap. <br/>Jalan</th>
                      <th className="px-2 py-2 text-center font-semibold whitespace-nowrap min-w-max">
                        <button onClick={() => handleSort('dj')} className="flex items-center gap-0.5 hover:text-blue-600 justify-center w-full text-xs">
                          DJ <span className="text-xs">⬍</span>
                        </button>
                      </th>
                      <th className="px-2 py-2 text-center font-semibold whitespace-nowrap min-w-max">
                        <button onClick={() => handleSort('levelPelayanan')} className="flex items-center gap-0.5 hover:text-blue-600 justify-center w-full text-xs">
                          LOS <span className="text-xs">⬍</span>
                        </button>
                      </th>
                      <th className="px-2 py-2 text-center font-semibold whitespace-nowrap min-w-max">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item, index) => {
                      const volumeKendaraan = (item.mobil || 0) + (item.bus || 0) + (item.truk || 0)
                      const volumeSmp = Math.round(item.volume || ((item.mobil || 0) + (item.bus || 0) * 1.6 + (item.truk || 0) * 2))
                      return (
                        <tr key={item._id || index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-2 py-2 text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                          <td className="px-2 py-2 text-xs whitespace-nowrap">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                          <td className="px-2 py-2 text-xs truncate max-w-xs">{item.namaRuas || '-'}</td>
                          <td className="px-2 py-2 text-xs">{item.tipeJalan || '-'}</td>
                          <td className="px-2 py-2 text-xs text-center">{item.lajur}</td>
                          <td className="px-2 py-2 text-xs text-center whitespace-nowrap">{item.intervalWaktu || '-'}</td>
                          <td className="px-2 py-2 text-xs text-center">{item.durasi || '-'}</td>
                          <td className="px-2 py-2 text-xs text-center">{volumeKendaraan}</td>
                          <td className="px-2 py-2 text-xs text-center">{volumeSmp}</td>
                          <td className="px-2 py-2 text-xs text-center">5000</td>
                          <td className="px-2 py-2 text-xs text-center">{(item.dj || 0).toFixed(3)}</td>
                          <td className="px-2 py-2 text-xs text-center">
                            <span className="px-1.5 py-0.5 rounded text-xs font-semibold text-white bg-blue-600 whitespace-nowrap inline-block">
                              {item.levelPelayanan}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => handlePrintPreviewLane(item)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-1 rounded text-sm"
                                title="Preview"
                              >
                                👁️
                              </button>
                              <button
                                onClick={() => handleExportPDFLane(item)}
                                className="text-green-600 hover:text-green-800 hover:bg-green-100 p-1 rounded text-sm"
                                title="Download PDF"
                              >
                                📥
                              </button>
                              <button
                                onClick={() => handleDeleteHistori(item._id, item.namaRuas)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded text-sm"
                                title="Hapus Data"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Menampilkan data per halaman:</label>
                  <select
                    value={itemsPerPage === sortedData.length ? 'all' : itemsPerPage}
                    onChange={(e) => {
                      if (e.target.value === 'all') {
                        setItemsPerPage(sortedData.length)
                      } else {
                        setItemsPerPage(parseInt(e.target.value))
                      }
                      setCurrentPage(1)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="all">Semua</option>
                  </select>
                </div>

                <p className="text-sm text-gray-600">
                  Menampilkan {sortedData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} dari {sortedData.length}
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
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || sortedData.length === 0}
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

              {/* Summary Stats */}
              <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
                <div style={{ border: '1px solid #ccc', padding: '10px', backgroundColor: '#f9f9f9' }}>
                  <p style={{ margin: '0', color: '#666', fontWeight: 'bold' }}>Volume Kendaraan</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>{(previewItem.mobil || 0) + (previewItem.bus || 0) + (previewItem.truk || 0)} kend/jam</p>
                </div>
                <div style={{ border: '1px solid #ccc', padding: '10px', backgroundColor: '#f9f9f9' }}>
                  <p style={{ margin: '0', color: '#666', fontWeight: 'bold' }}>Kapasitas Jalan</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>5000 smp/jam</p>
                </div>
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
                      <td style={{ border: '1px solid #999', padding: '6px' }}>Volume Kendaraan (kend/jam)</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{(previewItem.mobil || 0) + (previewItem.bus || 0) + (previewItem.truk || 0)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #999', padding: '6px' }}>Volume (smp/jam)</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{Math.round(previewItem.volume || ((previewItem.mobil || 0) + (previewItem.bus || 0) * 1.6 + (previewItem.truk || 0) * 2))}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #999', padding: '6px' }}>Kapasitas (C)</td>
                      <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>5000</td>
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
