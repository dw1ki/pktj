import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import html2pdf from 'html2pdf.js'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'
import { performTrafficCalculation } from '../utils/trafficCalculations'
import { EMP_FACTORS, BASE_CAPACITY, calculateSMP, calculateVolume, getEMPFactors } from '../utils/empFactors'

const imgCsvUpload = 'assets/csv.svg'
const imgUploadIcon = 'assets/upload.svg'
const imgPdfIcon = 'assets/pdf.svg'

const API_URL = import.meta.env.VITE_API_URL;

const getTodayDateInput = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const losColors = {
  'A': 'bg-violet-600 text-white',
  'B': 'bg-blue-100 text-blue-800',
  'C': 'bg-green-100 text-green-800',
  'D': 'bg-yellow-100 text-yellow-800',
  'E': 'bg-orange-100 text-orange-800',
  'F': 'bg-red-100 text-red-800',
}

const getLosFromDj = (dj) => {
  if (dj <= 0.20) {
    return {
      los: 'A',
      category: 'Lancar',
      description: 'Arus lalu lintas dengan kecepatan tinggi. Pengemudi memiliki kebebasan penuh dalam memilih kecepatan.',
    }
  }

  if (dj <= 0.44) {
    return {
      los: 'B',
      category: 'Lancar',
      description: 'Kecepatan sedikit terganggu, namun masih memuaskan. Pengemudi masih memiliki kebebasan memilih kecepatan.',
    }
  }

  if (dj <= 0.74) {
    return {
      los: 'C',
      category: 'Stabil',
      description: 'Kecepatan dipengaruhi lalu lintas lain, tetapi masih dapat ditolerir.',
    }
  }

  if (dj <= 0.85) {
    return {
      los: 'D',
      category: 'Mulai Jenuh',
      description: 'Kecepatan turun drastis. Kemampuan manuver sangat terbatas.',
    }
  }

  if (dj <= 1.00) {
    return {
      los: 'E',
      category: 'Jenuh',
      description: 'Arus pada kapasitas penuh. Kemacetan terjadi.',
    }
  }

  return {
    los: 'F',
    category: 'Sangat Macet',
    description: 'Arus terhambat, kemacetan terjadi. Kecepatan mendekati nol.',
  }
}

export default function Perhitungan() {
  const [dataSource, setDataSource] = useState(null) // 'csv' or 'yolo'
  const [csvUploaded, setCsvUploaded] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showYoloModal, setShowYoloModal] = useState(false)
  const [yoloDetections, setYoloDetections] = useState([])
  const [loadingYolo, setLoadingYolo] = useState(false)
  const [selectedDetection, setSelectedDetection] = useState(null)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [previewLane, setPreviewLane] = useState(null) // 'kiri' atau 'kanan'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [formData, setFormData] = useState({
    namaRuas: '',
    tipeAlinemen: 'datar',
    tipeJalan: '4/2 D',
    tanggal: getTodayDateInput(),
    jumlahLajur: '',
    kapasitas: '',
    kecepatan: '',
    faktor: '',
    lebar: '',
    kiri: { mobil: 0, bus: 0, truk: 0 },
    kanan: { mobil: 0, bus: 0, truk: 0 },
    volume: '',
    durasi: '',
    waktuMulai: '',
    waktuSelesai: '',
    dataSourceLabel: '',
    volumeKiri: 0,
    volumeKanan: 0,
  })

  const [calculation, setCalculation] = useState(null)

  // ================== CALCULATE WAKTU SELESAI FROM DURASI VIDEO ==================
  useEffect(() => {
    // Hanya update waktuSelesai jika waktuMulai ada dan durasi ada
    if (formData.waktuMulai && formData.durasi) {
      try {
        // Parse waktuMulai format HH:MM:SS
        const mulaiParts = formData.waktuMulai.split(':')
        const mulaiHour = parseInt(mulaiParts[0])
        const mulaiMin = parseInt(mulaiParts[1])
        const mulaiSec = mulaiParts[2] ? parseInt(mulaiParts[2]) : 0

        // Parse durasi format HH:MM:SS
        const durasiParts = formData.durasi.split(':')
        const durasiHour = parseInt(durasiParts[0])
        const durasiMin = parseInt(durasiParts[1])
        const durasiSec = durasiParts[2] ? parseInt(durasiParts[2]) : 0

        let mulaiTotalSeconds = mulaiHour * 3600 + mulaiMin * 60 + mulaiSec
        const durationTotalSeconds = durasiHour * 3600 + durasiMin * 60 + durasiSec

        let selesaiTotalSeconds = mulaiTotalSeconds + durationTotalSeconds

        // Handle crossing midnight
        let selesaiHour = Math.floor(selesaiTotalSeconds / 3600) % 24
        let selesaiMin = Math.floor((selesaiTotalSeconds % 3600) / 60)
        let selesaiSec = selesaiTotalSeconds % 60

        const waktuSelesaiFormatted = `${String(selesaiHour).padStart(2, '0')}:${String(selesaiMin).padStart(2, '0')}:${String(selesaiSec).padStart(2, '0')}`
        setFormData(prev => ({
          ...prev,
          waktuSelesai: waktuSelesaiFormatted
        }))
      } catch (err) {
        console.log('Invalid time or duration format')
      }
    }
  }, [formData.waktuMulai, formData.durasi])

  // ================== FETCH YOLO DETECTIONS ==================
  const fetchYoloDetections = async () => {
    try {
      setLoadingYolo(true)
      const token = localStorage.getItem('accessToken')
      
      if (!token) {
        alert('❌ Token tidak ditemukan! Silakan login terlebih dahulu.')
        return
      }
      
      console.log('🔑 Token:', `${token.substring(0, 20)}...`)
      console.log('📡 Fetching from:', `${API_URL}/api/detect/history`)
      
      const res = await axios.get(`${API_URL}/api/detect/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit: 50,
        },
      })

      console.log('✅ YOLO detections fetched:', res.data)
      if (res.data.success && res.data.data) {
        setYoloDetections(res.data.data)
        console.log(`✅ Found ${res.data.data.length} YOLO detections`)
      }
    } catch (err) {
      console.error('❌ Error fetching YOLO detections:')
      console.error('   Status:', err.response?.status)
      console.error('   Message:', err.response?.data?.message || err.message)
      console.error('   URL:', err.config?.url)
      
      let errorMsg = `${err.response?.status || 'Error'}`
      if (err.response?.data?.message) {
        errorMsg += ` - ${err.response.data.message}`
      } else if (err.message) {
        errorMsg += ` - ${err.message}`
      }
      
      alert(`Gagal mengambil data YOLO: ${errorMsg}`)
    } finally {
      setLoadingYolo(false)
    }
  }

  // ================== DELETE YOLO DETECTION ==================
  const handleDeleteDetection = async (detectionId) => {
    try {
      setDeletingId(detectionId)
      const token = localStorage.getItem('accessToken')
      
      if (!token) {
        alert('❌ Token tidak ditemukan! Silakan login terlebih dahulu.')
        return
      }
      
      const res = await axios.delete(`${API_URL}/api/detect/${detectionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (res.data.success) {
        console.log('✅ Deteksi berhasil dihapus')
        // Refresh list
        await fetchYoloDetections()
        setShowDeleteConfirm(false)
        setDeleteTargetId(null)
      }
    } catch (err) {
      console.error('❌ Error deleting detection:', err)
      alert(`Gagal menghapus deteksi: ${err.response?.data?.message || err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  // ================== SELECT YOLO DETECTION ==================
  const handleSelectYoloDetection = (detection) => {
    console.log('🔍 [Perhitungan] handleSelectYoloDetection called with:', detection)
    
    setSelectedDetection(detection)
    setDataSource('yolo')

    // Extract vehicle data per arah dari YOLO detection
    // NEW: Try multiple source paths for per-lane data
    let vehiclesKiri = {
      mobil: 0,
      bus: 0,
      truk: 0,
    }
    let vehiclesKanan = {
      mobil: 0,
      bus: 0,
      truk: 0,
    }

    // Try path 1: yoloResults.leftLane / rightLane (new format)
    console.log('📊 [Perhitungan] yoloResults:', detection.yoloResults)
    if (detection.yoloResults?.leftLane) {
      vehiclesKiri = detection.yoloResults.leftLane
      console.log('✅ [Perhitungan] Found leftLane:', vehiclesKiri)
    } else if (detection.yoloResults?.kiri) {
      vehiclesKiri = detection.yoloResults.kiri
      console.log('✅ [Perhitungan] Found kiri:', vehiclesKiri)
    }

    if (detection.yoloResults?.rightLane) {
      vehiclesKanan = detection.yoloResults.rightLane
      console.log('✅ [Perhitungan] Found rightLane:', vehiclesKanan)
    } else if (detection.yoloResults?.kanan) {
      vehiclesKanan = detection.yoloResults.kanan
      console.log('✅ [Perhitungan] Found kanan:', vehiclesKanan)
    }

    console.log('📋 [Perhitungan] Final extracted:', { vehiclesKiri, vehiclesKanan })

    // Extract time interval jika ada, atau default ke 00:00:00 - 01:00:00
    let waktuMulai = '00:00:00'
    let waktuSelesai = '01:00:00'
    if (detection.recordingInterval) {
      const parts = detection.recordingInterval.split('-')
      if (parts.length === 2) {
        waktuMulai = parts[0].trim()
        waktuSelesai = parts[1].trim()
      }
    }

    // Fill form data TANPA melakukan calculation - biarkan user isi form dulu
    const newFormData = {
      namaRuas: detection.fileName || 'Tidak diketahui',
      tipeAlinemen: 'datar', // Default datar
      tipeJalan: '4/2 D', // Default 4/2 D
      jumlahLajur: '',
      kapasitas: '',
      kecepatan: detection.roadParameters?.baseSpeed || '88',
      faktor: detection.roadParameters?.effectiveWidthFactor?.toFixed(2) || '1.00',
      lebar: detection.roadParameters?.laneWidth || '3.5',
      tanggal: getTodayDateInput(),
      kiri: {
        mobil: vehiclesKiri.mobil || 0,
        bus: vehiclesKiri.bus || 0,
        truk: vehiclesKiri.truk || 0,
      },
      kanan: {
        mobil: vehiclesKanan.mobil || 0,
        bus: vehiclesKanan.bus || 0,
        truk: vehiclesKanan.truk || 0,
      },
      volume: '0',
      durasi: detection.videoDuration ? (() => {
        const totalSeconds = Math.round(detection.videoDuration)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      })() : '00:00:00',
      waktuMulai,
      waktuSelesai,
      dataSourceLabel: `Sumber Data: YOLO Detection (Video: ${detection.fileName})`,
    }
    
    console.log('✅ [Perhitungan] Setting formData:', newFormData)
    setFormData(newFormData)

    // PENTING: Jangan langsung tampil hasil - biarkan user isi form & klik button Hitung
    setCalculation(null)
    setShowResults(false)
    setShowYoloModal(false)
  }

  // ================== CSV UPLOAD ==================
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
          reader.onload = (event) => {
            try {
              const text = event.target.result
              const lines = text.split('\n').filter(line => line.trim())
              
              if (lines.length < 2) {
                alert('File CSV kosong atau format tidak valid')
                return
              }
              
              // Parse CSV properly - handle quoted values
              const parseCSVLine = (line) => {
                const result = []
                let current = ''
                let inQuotes = false
                
                for (let i = 0; i < line.length; i++) {
                  const char = line[i]
                  if (char === '"') {
                    inQuotes = !inQuotes
                  } else if (char === ',' && !inQuotes) {
                    result.push(current.trim())
                    current = ''
                  } else {
                    current += char
                  }
                }
                result.push(current.trim())
                return result
              }
              
              const headers = parseCSVLine(lines[0])
              const dataLine = parseCSVLine(lines[1])
              
              // Map CSV columns to data object
              const csvData = {}
              headers.forEach((header, index) => {
                csvData[header] = dataLine[index] || ''
              })
              
              console.log('📄 Parsed CSV:', csvData)
              
              // Extract per-lane data
              const leftLaneMobil = parseInt(csvData['Lajur Kiri Mobil'] || 0)
              const leftLaneBus = parseInt(csvData['Lajur Kiri Bus'] || 0)
              const leftLaneTruk = parseInt(csvData['Lajur Kiri Truk'] || 0)
              const rightLaneMobil = parseInt(csvData['Lajur Kanan Mobil'] || 0)
              const rightLaneBus = parseInt(csvData['Lajur Kanan Bus'] || 0)
              const rightLaneTruk = parseInt(csvData['Lajur Kanan Truk'] || 0)
              
              const totalVehicles = parseInt(csvData['Total Kendaraan'] || 0)
              const durationSeconds = parseInt(csvData['Durasi (detik)'] || 60)
              const durationFormatted = csvData['Durasi (HH:MM:SS)'] || '00:01:00'
              const intervalWaktu = csvData['Interval Waktu'] || '00:00:00-00:01:00'
              
              setCsvUploaded(true)
              setDataSource('csv')
              
              // Set form data with per-lane vehicle breakdown
              setFormData({
                namaRuas: csvData['Nama Ruas'] || 'MBZ',
                tipeAlinemen: 'datar',
                tipeJalan: '4/2 D',
                tanggal: getTodayDateInput(),
                jumlahLajur: '4',
                kapasitas: '5000',
                kecepatan: '88',
                faktor: '1.00',
                lebar: '3.5',
                volume: totalVehicles.toString(),
                durasi: durationFormatted,
                waktuMulai: intervalWaktu.split('-')[0]?.trim() || '00:00:00',
                waktuSelesai: intervalWaktu.split('-')[1]?.trim() || '00:01:00',
                dataSourceLabel: `Sumber Data: CSV Upload (${csvData['Nama Video']})`,
                kiri: {
                  mobil: Number.isFinite(leftLaneMobil) ? leftLaneMobil : 0,
                  bus: Number.isFinite(leftLaneBus) ? leftLaneBus : 0,
                  truk: Number.isFinite(leftLaneTruk) ? leftLaneTruk : 0
                },
                kanan: {
                  mobil: Number.isFinite(rightLaneMobil) ? rightLaneMobil : 0,
                  bus: Number.isFinite(rightLaneBus) ? rightLaneBus : 0,
                  truk: Number.isFinite(rightLaneTruk) ? rightLaneTruk : 0
                },
                volumeKiri: 0,
                volumeKanan: 0,
              })
              
              setCalculation(null)
              setShowResults(false)
              
              alert(`✅ CSV berhasil di-import!\n\nLajur Kiri: ${leftLaneMobil + leftLaneBus + leftLaneTruk} kendaraan\n- Mobil: ${leftLaneMobil}\n- Bus: ${leftLaneBus}\n- Truk: ${leftLaneTruk}\n\nLajur Kanan: ${rightLaneMobil + rightLaneBus + rightLaneTruk} kendaraan\n- Mobil: ${rightLaneMobil}\n- Bus: ${rightLaneBus}\n- Truk: ${rightLaneTruk}`)
              
            } catch (err) {
              console.error('❌ CSV Parse Error:', err)
              alert('Gagal membaca file CSV. Pastikan format file benar.')
            }
          }
      reader.readAsText(file)
    }
  }

  // ================== CALCULATE ==================
  const handleCalculate = () => {
    // Tidak digunakan lagi, proses otomatis setelah upload CSV
    // (fungsi kosong, tidak perlu return di luar function)
  }

// Fungsi perhitungan otomatis setelah upload CSV dan tombol hitung
const handleHitungRumusCSV = (autoFormData, durationSeconds) => {
  // Data Kiri
  const vehiclesKiri = autoFormData.kiri
  // Data Kanan
  const vehiclesKanan = autoFormData.kanan
  // Durasi dalam menit
  const durationMinutes = durationSeconds / 60
  // Q = total mobil saja (tanpa faktor EMP)
  let volumeQKiri = vehiclesKiri.mobil
  let volumeQKanan = vehiclesKanan.mobil
  // Hitung SMP dengan EMP dinamis (berdasarkan Q per arah)
  let smpKiri = calculateSMP(vehiclesKiri, autoFormData.tipeAlinemen, autoFormData.tipeJalan, volumeQKiri)
  let smpKanan = calculateSMP(vehiclesKanan, autoFormData.tipeAlinemen, autoFormData.tipeJalan, volumeQKanan)
  // Kapasitas
  const baseCapacity = BASE_CAPACITY[autoFormData.tipeJalan] || 5000
  let numLanes = 1
  if (autoFormData.tipeJalan === '4/2 D') numLanes = 2
  else if (autoFormData.tipeJalan === '6/2 D') numLanes = 3
  const capacityPerArah = baseCapacity * numLanes
  // DJ
  const djKiri = volumeQKiri / capacityPerArah
  const djKanan = volumeQKanan / capacityPerArah
  const djKeseluruhan = Math.max(djKiri, djKanan)
  const losKiri = getLosFromDj(djKiri)
  const losKanan = getLosFromDj(djKanan)
  const losKeseluruhan = getLosFromDj(djKeseluruhan)
  const result = {
    kiri: { ...vehiclesKiri, totalSMP: smpKiri, volume: volumeQKiri, capacity: capacityPerArah, dj: djKiri, ...losKiri },
    kanan: { ...vehiclesKanan, totalSMP: smpKanan, volume: volumeQKanan, capacity: capacityPerArah, dj: djKanan, ...losKanan },
    totalSMP: smpKiri + smpKanan,
    hourlyVolume: volumeQKiri + volumeQKanan,
    capacity: capacityPerArah,
    capacityFormula: `${numLanes} × ${baseCapacity} = ${capacityPerArah}`,
    degree: djKeseluruhan,
    degreeFormula: `DJ Max(${djKiri.toFixed(3)}, ${djKanan.toFixed(3)}) = ${djKeseluruhan.toFixed(3)}`,
    los: losKeseluruhan.los,
    category: losKeseluruhan.category,
    description: losKeseluruhan.description,
    conclusion: `Kondisi lalu lintas berada pada Level of Service ${losKeseluruhan.los} (${losKeseluruhan.category}). DJ Kiri = ${djKiri.toFixed(3)}, DJ Kanan = ${djKanan.toFixed(3)}.`,
    conclusionKiri: `Kondisi lalu lintas berada pada Level of Service ${losKiri.los} (${losKiri.category}). DJ Kiri = ${djKiri.toFixed(3)}.`,
    conclusionKanan: `Kondisi lalu lintas berada pada Level of Service ${losKanan.los} (${losKanan.category}). DJ Kanan = ${djKanan.toFixed(3)}.`,
    videoDurationFormatted: autoFormData.durasi,
    framesCounted: 0,
  }
  setCalculation(result)
  setFormData({
    ...autoFormData,
    volumeKiri: Math.round(volumeQKiri),
    volumeKanan: Math.round(volumeQKanan),
  })
  setShowResults(true)
}

  // ================== CALCULATE RUMUS (NEW) ==================
  const handleHitungRumus = async () => {
    if (!dataSource) {
      alert('Silakan upload CSV atau pilih YOLO Detection terlebih dahulu')
      return
    }

    // Validate required fields
    if (!formData.namaRuas) {
      alert('Nama Ruas Jalan harus diisi')
      return
    }

    if (!formData.waktuMulai || !formData.waktuSelesai) {
      alert('Waktu interval harus diisi lengkap')
      return
    }

    if (!formData.tanggal) {
      alert('Tanggal analisis harus diisi')
      return
    }

    // Tidak perlu validasi tipeAlinemen dan tipeJalan, sudah otomatis

    if (dataSource === 'yolo' && selectedDetection) {
      try {
        // Extract vehicle data from formData (filled by YOLO)
        const vehicles = {
          mobil: formData.mobilPenumpang || 0,
          bus: formData.bus || 0,
          truk: formData.truckRingan + formData.truckBerat || 0,
        }

        // Calculate duration in seconds from time interval (HH:MM:SS format)
        const mulaiParts = formData.waktuMulai.split(':')
        const mulaiHour = parseInt(mulaiParts[0])
        const mulaiMin = parseInt(mulaiParts[1])
        const mulaiSec = mulaiParts[2] ? parseInt(mulaiParts[2]) : 0

        const selesaiParts = formData.waktuSelesai.split(':')
        const selesaiHour = parseInt(selesaiParts[0])
        const selesaiMin = parseInt(selesaiParts[1])
        const selesaiSec = selesaiParts[2] ? parseInt(selesaiParts[2]) : 0

        let mulaiTotalSeconds = mulaiHour * 3600 + mulaiMin * 60 + mulaiSec
        let selesaiTotalSeconds = selesaiHour * 3600 + selesaiMin * 60 + selesaiSec

        if (selesaiTotalSeconds <= mulaiTotalSeconds) {
          selesaiTotalSeconds += 24 * 3600 // Handle next day
        }

        const durationSeconds = selesaiTotalSeconds - mulaiTotalSeconds
        const durationMinutes = durationSeconds / 60

        console.log(`📊 Duration: ${durationSeconds} seconds (${durationMinutes} minutes)`)

        // ============ PERHITUNGAN PER ARAH (KIRI DAN KANAN) ============

        // Data Kiri
        const vehiclesKiri = {
          mobil: formData.kiri?.mobil || 0,
          bus: formData.kiri?.bus || 0,
          truk: formData.kiri?.truk || 0,
        }

        // Data Kanan
        const vehiclesKanan = {
          mobil: formData.kanan?.mobil || 0,
          bus: formData.kanan?.bus || 0,
          truk: formData.kanan?.truk || 0,
        }

        // Q = total mobil saja (tanpa faktor EMP)
        const volumeQKiri = vehiclesKiri.mobil
        const volumeQKanan = vehiclesKanan.mobil
        console.log(`✅ Kiri - Volume Q: ${volumeQKiri} kendaraan`)
        console.log(`✅ Kanan - Volume Q: ${volumeQKanan} kendaraan`)

        // Calculate SMP dengan dynamic EMP factors
        const smpKiri = calculateSMP(vehiclesKiri, formData.tipeAlinemen, formData.tipeJalan, volumeQKiri)
        const smpKanan = calculateSMP(vehiclesKanan, formData.tipeAlinemen, formData.tipeJalan, volumeQKanan)
        console.log(`✅ Kiri - SMP: ${smpKiri}`)
        console.log(`✅ Kanan - SMP: ${smpKanan}`)

        // Get EMP factors untuk display
        const empFactors = getEMPFactors(formData.tipeAlinemen, formData.tipeJalan)
        console.log(`✅ EMP Factors:`, empFactors)

        // Calculate capacity per arah based on road type
        const baseCapacity = BASE_CAPACITY[formData.tipeJalan] || 5000
        // Determine number of lanes per direction
        let numLanes = 1
        if (formData.tipeJalan === '4/2 D') numLanes = 2
        else if (formData.tipeJalan === '6/2 D') numLanes = 3
        
        // Capacity per arah = base capacity per lane × number of lanes
        const capacityPerArah = baseCapacity * numLanes
        console.log(`✅ Capacity per arah: ${capacityPerArah} smp/jam`)

        // Calculate DJ per arah
        const djKiri = volumeQKiri / capacityPerArah
        const djKanan = volumeQKanan / capacityPerArah
        console.log(`✅ DJ Kiri: ${djKiri.toFixed(3)}, DJ Kanan: ${djKanan.toFixed(3)}`)

        // Determine LOS berdasarkan DJ terberat (untuk hasil keseluruhan)
        const djKeseluruhan = Math.max(djKiri, djKanan)
        const losKiri = getLosFromDj(djKiri)
        const losKanan = getLosFromDj(djKanan)
        const losKeseluruhan = getLosFromDj(djKeseluruhan)

        const result = {
          // Per arah
          kiri: {
            mobil: vehiclesKiri.mobil,
            bus: vehiclesKiri.bus,
            truk: vehiclesKiri.truk,
            totalSMP: smpKiri,
            volume: volumeQKiri,
            capacity: capacityPerArah,
            dj: djKiri,
            ...losKiri,
          },
          kanan: {
            mobil: vehiclesKanan.mobil,
            bus: vehiclesKanan.bus,
            truk: vehiclesKanan.truk,
            totalSMP: smpKanan,
            volume: volumeQKanan,
            capacity: capacityPerArah,
            dj: djKanan,
            ...losKanan,
          },
          // Total/keseluruhan
          totalSMP: smpKiri + smpKanan,
          hourlyVolume: volumeQKiri + volumeQKanan,
          capacity: capacityPerArah,
          capacityFormula: `${numLanes} × ${baseCapacity} = ${capacityPerArah}`,
          degree: djKeseluruhan,
          degreeFormula: `DJ Max(${djKiri.toFixed(3)}, ${djKanan.toFixed(3)}) = ${djKeseluruhan.toFixed(3)}`,
          los: losKeseluruhan.los,
          category: losKeseluruhan.category,
          description: losKeseluruhan.description,
          conclusion: `Kondisi lalu lintas berada pada Level of Service ${losKeseluruhan.los} (${losKeseluruhan.category}). DJ Kiri = ${djKiri.toFixed(3)}, DJ Kanan = ${djKanan.toFixed(3)}.`,
          conclusionKiri: `Kondisi lalu lintas berada pada Level of Service ${losKiri.los} (${losKiri.category}). DJ Kiri = ${djKiri.toFixed(3)}.`,
          conclusionKanan: `Kondisi lalu lintas berada pada Level of Service ${losKanan.los} (${losKanan.category}). DJ Kanan = ${djKanan.toFixed(3)}.`,
          videoDurationFormatted: `${Math.floor(durationMinutes / 60)}:${String(durationMinutes % 60).padStart(2, '0')}`,
          framesCounted: selectedDetection.yoloResults?.totalFrames || 0,
          empFactors: {
            KS: empFactors?.KS || 0,
            BB: empFactors?.BB || 0,
            TB: empFactors?.TB || 0,
          },
        }

        // UPDATE FORM DATA dengan hasil perhitungan
        const displayHours = Math.floor(durationSeconds / 3600)
        const displayMinutes = Math.floor((durationSeconds % 3600) / 60)
        const displaySeconds = durationSeconds % 60

        setFormData({
          ...formData,
          volumeKiri: Math.round(volumeQKiri),
          volumeKanan: Math.round(volumeQKanan),
          durasi: `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`
        })

        setCalculation(result)
        setShowResults(true)
      } catch (error) {
        console.error('❌ Error:', error)
        alert(`Error: ${error.message}`)
      }
    } else if (dataSource === 'csv') {
      // Hitung ulang dari formData CSV
      // Hitung durasi detik dari waktuMulai dan waktuSelesai
      const mulaiParts = (formData.waktuMulai || '00:00:00').split(':')
      const selesaiParts = (formData.waktuSelesai || '00:00:00').split(':')
      const mulaiSec = parseInt(mulaiParts[0] || 0) * 3600 + parseInt(mulaiParts[1] || 0) * 60 + parseInt(mulaiParts[2] || 0)
      const selesaiSec = parseInt(selesaiParts[0] || 0) * 3600 + parseInt(selesaiParts[1] || 0) * 60 + parseInt(selesaiParts[2] || 0)
      let durationSeconds = selesaiSec - mulaiSec
      if (durationSeconds <= 0) durationSeconds += 24 * 3600
      handleHitungRumusCSV(formData, durationSeconds)
    }
  }

  // ================== SAVE RESULT TO DATABASE ==================
  const handleSimpanHasil = async () => {
    if (!calculation) return

    try {
      const token = localStorage.getItem('accessToken')
      
      // Create 2 payloads - one for each lane
      const basePayload = {
        namaRuas: formData.namaRuas,
        tipeAlinemen: formData.tipeAlinemen,
        tipeJalan: formData.tipeJalan,
        intervalWaktu: `${formData.waktuMulai}-${formData.waktuSelesai}`,
        durasi: formData.durasi,
        tanggal: new Date(`${formData.tanggal}T00:00:00`).toISOString(),
        totalVolume: Math.round(calculation.kiri.volume + calculation.kanan.volume),
        capacity: calculation.capacity,
        djTerberat: calculation.degree,
      }

      // Payload untuk Lajur Kiri
      const payloadKiri = {
        ...basePayload,
        lajur: 'Kiri',
        mobil: calculation.kiri.mobil,
        bus: calculation.kiri.bus,
        truk: calculation.kiri.truk,
        smp: calculation.kiri.totalSMP,
        volume: Math.round(calculation.kiri.volume),
        capacity: calculation.kiri.capacity,
        dj: calculation.kiri.dj,
        levelPelayanan: calculation.kiri.los,
        kategori: calculation.kiri.category,
        deskripsi: calculation.kiri.description,
        kesimpulan: calculation.conclusionKiri,
      }

      // Payload untuk Lajur Kanan
      const payloadKanan = {
        ...basePayload,
        lajur: 'Kanan',
        mobil: calculation.kanan.mobil,
        bus: calculation.kanan.bus,
        truk: calculation.kanan.truk,
        smp: calculation.kanan.totalSMP,
        volume: Math.round(calculation.kanan.volume),
        capacity: calculation.kanan.capacity,
        dj: calculation.kanan.dj,
        levelPelayanan: calculation.kanan.los,
        kategori: calculation.kanan.category,
        deskripsi: calculation.kanan.description,
        kesimpulan: calculation.conclusionKanan,
      }

      // Save both records
      const resBoth = await Promise.all([
        axios.post(`${API_URL}/api/perhitungan/save`, payloadKiri, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.post(`${API_URL}/api/perhitungan/save`, payloadKanan, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ])

      if (resBoth[0].data.success && resBoth[1].data.success) {
        alert('✅ Hasil perhitungan berhasil disimpan! (Lajur Kiri & Kanan) Silahkan lihat di halaman Histori.')
        // Reset form
        setShowResults(false)
        setCalculation(null)
        setFormData({
          namaRuas: '',
          tipeAlinemen: 'datar',
          tipeJalan: '4/2 D',
          tanggal: getTodayDateInput(),
          jumlahLajur: '',
          kapasitas: '',
          kecepatan: '88',
          faktor: '1.00',
          lebar: '3.5',
          kiri: { mobil: 0, bus: 0, truk: 0 },
          kanan: { mobil: 0, bus: 0, truk: 0 },
          durasi: '00:00:00',
          waktuMulai: '00:00:00',
          waktuSelesai: '01:00:00',
        })
      }
    } catch (error) {
      console.error('❌ Error:', error)
      alert(`Gagal menyimpan: ${error.message}`)
    }
  }

  // ================== PRINT PREVIEW ==================
  const handlePrintPreview = () => {
    if (!calculation) return
    setShowPrintPreview(true)
  }

  // ================== EXPORT PDF ==================
  const handleExportPDF = async () => {
    if (!calculation) {
      alert('Tidak ada hasil perhitungan untuk di-export')
      return
    }
    
    try {
      // Trigger modal terbuka terlebih dahulu jika belum terbuka
      if (!showPrintPreview) {
        setShowPrintPreview(true)
        // Tunggu modal render
        setTimeout(() => {
          exportPDFContent()
        }, 500)
      } else {
        exportPDFContent()
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Gagal mengekspor PDF: ' + error.message)
    }
  }

  const exportPDFContent = () => {
    const element = document.getElementById('print-content')
    if (!element) {
      alert('Konten untuk export tidak ditemukan. Silahkan buka preview terlebih dahulu.')
      setShowPrintPreview(true)
      return
    }

    try {
      const opt = {
        margin: 10,
        filename: `hasil-perhitungan-${formData.namaRuas || 'traffic'}-${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      }

      html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error('Error in exportPDFContent:', error)
      alert('Gagal mengekspor PDF: ' + error.message)
    }
  }

  // ================== LANE-SPECIFIC PDF FUNCTIONS ==================
  const handlePrintPreviewLane = (lane) => {
    if (!calculation) return
    setPreviewLane(lane)
    setShowPrintPreview(true)
  }

  const handleExportPDFLane = async (lane) => {
    if (!calculation) {
      alert('Tidak ada hasil perhitungan untuk di-export')
      return
    }
    
    try {
      // Langsung export dari element yang akan digunakan
      exportPDFFromElement(lane)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Gagal mengekspor PDF: ' + error.message)
    }
  }

  const exportPDFFromElement = (lane) => {
    const laneLabel = lane === 'kiri' ? 'Lajur Kiri' : 'Lajur Kanan'
    const laneData = lane === 'kiri' ? calculation.kiri : calculation.kanan
    const conclusionText = lane === 'kiri' ? calculation.conclusionKiri : calculation.conclusionKanan
    
    try {
      // Create PDF in portrait
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      let yPosition = 15
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 15
      const contentWidth = pageWidth - 2 * margin
      
      // Title
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text('LAPORAN ANALISIS LALU LINTAS', margin + contentWidth / 2, yPosition, { align: 'center' })
      
      yPosition += 8
      doc.setFontSize(12)
      doc.text(laneLabel + ' - Metodologi PKJI 2023', margin + contentWidth / 2, yPosition, { align: 'center' })
      
      yPosition += 8
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), margin + contentWidth / 2, yPosition, { align: 'center' })
      
      yPosition += 12
      doc.setDrawColor(0)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 5
      
      // Info section
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text('INFORMASI RUAS JALAN:', margin, yPosition)
      
      yPosition += 6
      doc.setFontSize(9)
      doc.setFont(undefined, 'normal')
      const infoData = [
        ['Nama Ruas Jalan', formData.namaRuas || '-'],
        ['Tipe Jalan', '4/2 D'],
        ['Interval Waktu', formData.waktuMulai && formData.waktuSelesai ? `${formData.waktuMulai} - ${formData.waktuSelesai}` : '-'],
        ['Lajur', lane === 'kiri' ? 'Kiri' : 'Kanan']
      ]
      
      infoData.forEach(([label, value]) => {
        doc.text(label + ':', margin, yPosition)
        doc.setFont(undefined, 'bold')
        doc.text(value, margin + 60, yPosition)
        doc.setFont(undefined, 'normal')
        yPosition += 5
      })
      
      yPosition += 5
      
      // Data Kendaraan Table
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text('DATA KENDARAAN & PERHITUNGAN:', margin, yPosition)
      yPosition += 5
      
      autoTable(doc, {
        startY: yPosition,
        margin: { left: margin, right: margin },
        head: [['Jenis Kendaraan', 'Jumlah', 'EMP', 'SMP']],
        body: [
          ['Mobil Penumpang', laneData.mobil.toString(), '1.0', laneData.mobil.toString()],
          ['Bus', laneData.bus.toString(), '1.6', (laneData.bus * 1.6).toFixed(0)],
          ['Truk', laneData.truk.toString(), '2.0', (laneData.truk * 2.0).toFixed(0)],
          ['TOTAL VOLUME (Q)', '', '', Math.round(laneData.volume) + ' smp/jam']
        ],
        bodyStyles: { fontSize: 9 },
        headStyles: { fontSize: 9, fontStyle: 'bold', fillColor: [224, 224, 224] },
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } }
      })
      
      yPosition = doc.lastAutoTable.finalY + 8
      
      // Hasil Perhitungan Section
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text('HASIL PERHITUNGAN:', margin, yPosition)
      yPosition += 5
      
      const resultData = [
        ['Volume (Q)', Math.round(laneData.volume) + ' smp/jam'],
        ['Kapasitas (C)', '5000 smp/jam (2 × 2500)'],
        ['DJ', laneData.dj.toFixed(3)],
        ['Level of Service (LOS)', laneData.los + ' - ' + laneData.category]
      ]
      
      autoTable(doc, {
        startY: yPosition,
        margin: { left: margin, right: margin },
        head: [['Parameter', 'Nilai']],
        body: resultData,
        bodyStyles: { fontSize: 9 },
        headStyles: { fontSize: 9, fontStyle: 'bold', fillColor: [224, 224, 224] },
        columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 'auto' } }
      })
      
      yPosition = doc.lastAutoTable.finalY + 8
      
      // Analisis
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text('ANALISIS:', margin, yPosition)
      
      yPosition += 5
      doc.setFontSize(9)
      doc.setFont(undefined, 'normal')
      const analysisLines = doc.splitTextToSize(laneData.description, contentWidth)
      doc.text(analysisLines, margin, yPosition)
      yPosition += analysisLines.length * 4 + 5
      
      // Kesimpulan
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text('KESIMPULAN:', margin, yPosition)
      
      yPosition += 5
      doc.setFontSize(9)
      doc.setFont(undefined, 'normal')
      const conclusionLines = doc.splitTextToSize(conclusionText, contentWidth)
      doc.text(conclusionLines, margin, yPosition)
      
      // Footer
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('© 2025 Kinerja Ruas Jalan | Generated on ' + new Date().toLocaleString('id-ID'), margin + contentWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })
      
      // Save PDF
      const filename = `hasil-perhitungan-${formData.namaRuas || 'traffic'}-${laneLabel}-${new Date().getTime()}.pdf`
      doc.save(filename)
      
    } catch (error) {
      console.error('PDF Export error:', error)
      alert('Gagal membuat PDF: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Data Source Selection Buttons */}
      <div className="flex justify-center gap-4">
        {/* CSV Upload */}
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
          <div
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            style={{ display: 'inline-flex' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
          >
            <img alt="Upload" className="w-6 h-6" src={imgUploadIcon} style={{ filter: 'brightness(0) invert(1)' }} />
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: '14px' }}>UPLOAD CSV</span>
          </div>
        </label>

        {/* YOLO Selection */}
        <button
          onClick={() => {
            setShowYoloModal(true)
            fetchYoloDetections()
          }}
          className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
        >
          <span>🎥</span>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: '14px' }}>PILIH HASIL YOLO</span>
        </button>
      </div>

      {/* YOLO Selection Modal */}
      {showYoloModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Pilih Hasil Deteksi YOLO</h2>
              <button
                onClick={() => setShowYoloModal(false)}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {loadingYolo ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Memuat data deteksi...</p>
              </div>
            ) : yoloDetections.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Tidak ada deteksi YOLO yang disimpan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {yoloDetections.map((detection) => (
                  <div
                    key={detection._id}
                    onClick={() => handleSelectYoloDetection(detection)}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-colors group relative"
                  >
                    {/* Delete Button - Muncul saat hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTargetId(detection._id)
                        setShowDeleteConfirm(true)
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-100 hover:bg-red-500 text-red-700 hover:text-white rounded-full p-2 transition duration-200"
                      title="Hapus deteksi"
                    >
                      ✕
                    </button>

                    <div className="flex justify-between items-start mb-2 pr-8">
                      <h3 className="font-semibold text-gray-900">{detection.fileName}</h3>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        {detection.yoloResults?.totalVehicles || 0} kendaraan
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <span className="font-semibold">Durasi:</span> {detection.videoDuration}s
                      </div>
                      <div>
                        <span className="font-semibold">Confidence:</span> {(detection.yoloResults?.avgConfidence * 100).toFixed(1)}%
                      </div>
                      <div>
                        <span className="font-semibold">Tanggal:</span> {new Date(detection.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    
                    {/* NEW: Show per-lane breakdown */}
                    {detection.yoloResults?.leftLane && detection.yoloResults?.rightLane && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-blue-50 p-2 rounded border border-blue-200">
                          <div className="font-semibold text-blue-900 mb-1">🚗 Lajur Kiri</div>
                          <div className="text-blue-700">
                            Mobil: {detection.yoloResults.leftLane.mobil}, Bus: {detection.yoloResults.leftLane.bus}, Truk: {detection.yoloResults.leftLane.truk}
                          </div>
                        </div>
                        <div className="bg-orange-50 p-2 rounded border border-orange-200">
                          <div className="font-semibold text-orange-900 mb-1">🚗 Lajur Kanan</div>
                          <div className="text-orange-700">
                            Mobil: {detection.yoloResults.rightLane.mobil}, Bus: {detection.yoloResults.rightLane.bus}, Truk: {detection.yoloResults.rightLane.truk}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteTargetId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Hapus Deteksi YOLO?</h3>
            <p className="text-gray-600 mb-6">
              Data hasil deteksi YOLO akan dihapus dari database. Aksi ini <span className="font-semibold">tidak dapat dibatalkan</span>.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteTargetId(null)
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={deletingId === deleteTargetId}
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteDetection(deleteTargetId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deletingId === deleteTargetId}
              >
                {deletingId === deleteTargetId ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!dataSource ? (
        <Card className="!p-12 text-center">
          <p className="text-gray-500 text-lg mb-2">Belum ada data</p>
          <p className="text-gray-400">Upload file CSV atau pilih hasil deteksi YOLO untuk melanjutkan perhitungan</p>
        </Card>
      ) : (
        <>
          {/* Data Source Label */}
          {formData.dataSourceLabel && (
            <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium">
              📊 {formData.dataSourceLabel}
            </div>
          )}

          {/* Calculation Form & Results */}
          <Card className="!p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Rumus Perhitungan PKJI 2023</h3>
            </div>

            <div className="p-6 grid grid-cols-2 gap-8">
              {/* Left Section - Form */}
              <div className="space-y-6">
                {/* Road Parameters */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Informasi Ruas Jalan</h4>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm text-gray-700 font-semibold mb-1">Nama Ruas Jalan</label>
                      <input
                        type="text"
                        value={formData.namaRuas}
                        onChange={(e) => setFormData({ ...formData, namaRuas: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="Contoh: Jalan Ahmad Yani"
                      />
                    </div>

                    {/* Tipe Alinemen - FIXED */}
                    <div>
                      <label className="block text-sm text-gray-700 font-semibold mb-1">Tipe Alinemen</label>
                      <input
                        type="text"
                        value="Datar"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        disabled
                      />
                    </div>

                    {/* Tipe Jalan - FIXED */}
                    <div>
                      <label className="block text-sm text-gray-700 font-semibold mb-1">Tipe Jalan</label>
                      <input
                        type="text"
                        value="4/2 D"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 font-semibold mb-1">Jumlah Lajur (n) <span className="text-xs text-gray-500">otomatis dari tipe jalan</span></label>
                      <input
                        type="text"
                        value={formData.tipeJalan === '2/2 UD' ? '1' : formData.tipeJalan === '4/2 D' ? '2' : '3'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 font-semibold mb-1">Kapasitas Dasar (C₀) <span className="text-xs text-gray-500">smp/jam per lajur</span></label>
                      <input
                        type="text"
                        value="2500"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 font-semibold mb-1">Kecepatan Dasar (MP)</label>
                      <input
                        type="text"
                        value={formData.kecepatan}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        disabled
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 font-semibold mb-1">Lebar Lajur (m)</label>
                        <input
                          type="text"
                          value={formData.lebar}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 font-semibold mb-1">
                          Faktor Lebar (FC<span style={{fontSize: '0.75em'}}>LE</span>)                         
                        </label>
                        <input
                          type="text"
                          value={formData.faktor}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Volume Data - Per Lajur */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Data Lalu Lintas</h4>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    {/* Volume Q Per Lajur */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 font-semibold mb-1">Volume (Q) Lajur Kiri - smp/jam</label>
                        <input
                          type="text"
                          value={formData.volumeKiri || 0}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 font-semibold mb-1">Volume (Q) Lajur Kanan - smp/jam</label>
                        <input
                          type="text"
                          value={formData.volumeKanan || 0}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                          disabled
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 font-semibold mb-1">Tanggal Analisis</label>
                      <input
                        type="date"
                        value={formData.tanggal}
                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 font-semibold mb-1">Durasi Video / Survei</label>
                      <input
                        type="text"
                        value={formData.durasi}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        disabled
                      />
                    </div>
                      <div>
                        <label className="block text-sm text-gray-700 font-semibold mb-1">Interval Waktu Pengamatan (24 Jam)</label>
                        <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                          <input
                            type="text"
                            placeholder="13:00:00"
                            value={formData.waktuMulai}
                            onChange={(e) => {
                              let val = e.target.value.trim()
                              // Normalize format: "13.00.00" or "13:00:00" or "130000" → "13:00:00"
                              if (val.includes('.')) val = val.replaceAll('.', ':')
                              if (val.length === 6 && !val.includes(':')) {
                                val = `${val.substring(0, 2)}:${val.substring(2, 4)}:${val.substring(4, 6)}`
                              }
                              setFormData({ ...formData, waktuMulai: val })
                            }}
                            maxLength="8"
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-center"
                          />
                          <span className="text-gray-500 font-semibold text-lg">s/d</span>
                          <input
                            type="text"
                            placeholder="14:00:00"
                            value={formData.waktuSelesai}
                            onChange={(e) => {
                              let val = e.target.value.trim()
                              // Normalize format: "14.00.00" or "14:00:00" or "140000" → "14:00:00"
                              if (val.includes('.')) val = val.replaceAll('.', ':')
                              if (val.length === 6 && !val.includes(':')) {
                                val = `${val.substring(0, 2)}:${val.substring(2, 4)}:${val.substring(4, 6)}`
                              }
                              setFormData({ ...formData, waktuSelesai: val })
                            }}
                            maxLength="8"
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-center"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Format: HH:MM:SS atau HH.MM.SS (contoh: 13:00:00 atau 13.00.00 atau 130000)</p>
                      </div>
                  </div>
                </div>
              </div>

              {/* Right Section - Formula & Results */}
              <div className="space-y-6">
                {/* Vehicle Count - Per Arah */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Data Kendaraan (Per Arah)</h4>
                  <div className="space-y-3">
                    {/* Lajur Kiri */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="font-semibold text-blue-900 mb-3">🚗 Lajur Kiri</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white p-2 rounded">
                          <label className="text-xs text-gray-600">Mobil</label>
                          <input
                            type="number"
                            value={formData.kiri?.mobil || 0}
                            onChange={(e) => setFormData({ ...formData, kiri: { ...formData.kiri, mobil: parseInt(e.target.value) || 0 } })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="bg-white p-2 rounded">
                          <label className="text-xs text-gray-600">Bus</label>
                          <input
                            type="number"
                            value={formData.kiri?.bus || 0}
                            onChange={(e) => setFormData({ ...formData, kiri: { ...formData.kiri, bus: parseInt(e.target.value) || 0 } })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="bg-white p-2 rounded">
                          <label className="text-xs text-gray-600">Truk</label>
                          <input
                            type="number"
                            value={formData.kiri?.truk || 0}
                            onChange={(e) => setFormData({ ...formData, kiri: { ...formData.kiri, truk: parseInt(e.target.value) || 0 } })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Total: {(formData.kiri?.mobil || 0) + (formData.kiri?.bus || 0) + (formData.kiri?.truk || 0)} unit</p>
                    </div>

                    {/* Lajur Kanan */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="font-semibold text-green-900 mb-3">🚗 Lajur Kanan</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white p-2 rounded">
                          <label className="text-xs text-gray-600">Mobil</label>
                          <input
                            type="number"
                            value={formData.kanan?.mobil || 0}
                            onChange={(e) => setFormData({ ...formData, kanan: { ...formData.kanan, mobil: parseInt(e.target.value) || 0 } })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="bg-white p-2 rounded">
                          <label className="text-xs text-gray-600">Bus</label>
                          <input
                            type="number"
                            value={formData.kanan?.bus || 0}
                            onChange={(e) => setFormData({ ...formData, kanan: { ...formData.kanan, bus: parseInt(e.target.value) || 0 } })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="bg-white p-2 rounded">
                          <label className="text-xs text-gray-600">Truk</label>
                          <input
                            type="number"
                            value={formData.kanan?.truk || 0}
                            onChange={(e) => setFormData({ ...formData, kanan: { ...formData.kanan, truk: parseInt(e.target.value) || 0 } })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Total: {(formData.kanan?.mobil || 0) + (formData.kanan?.bus || 0) + (formData.kanan?.truk || 0)} unit</p>
                    </div>
                  </div>
                </div>

                {/* Capacity Formula */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Rumus Perhitungan PKJI</h4>
                  <div className="bg-blue-50 rounded-lg p-4 mb-4 space-y-2">
                    <p className="text-center text-base font-mono text-blue-900">
                      <strong>C = n × C₀ × FC<span style={{fontSize: '0.75em'}}>LE</span></strong>
                    </p>
                    <p className="text-center text-sm font-mono text-blue-900">
                      <strong>DJ = Q / C</strong>
                    </p>
                    <p className="text-xs text-blue-600 text-center">Dihitung otomatis berdasarkan PKJI 2023</p>
                  </div>
                </div>

                {/* Results - Per Arah */}
                {showResults && calculation && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Hasil Perhitungan (Per Arah)</h4>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      {/* Perhitungan Kapasitas (C) */}
                      <div className="bg-white border-l-4 border-purple-500 p-3 rounded">
                        <p className="text-sm font-semibold text-gray-900 mb-1">Kapasitas Jalan (C):</p>
                        <p className="text-lg font-bold text-purple-900 mb-1">{calculation.kiri.capacity} smp/jam</p>
                        <p className="text-xs text-gray-600">{formData.tipeJalan === '4/2 D' ? 2 : formData.tipeJalan === '6/2 D' ? 3 : 1} × {calculation.kiri.capacity / (formData.tipeJalan === '4/2 D' ? 2 : formData.tipeJalan === '6/2 D' ? 3 : 1)} = {calculation.kiri.capacity}</p>
                      </div>

                      <hr className="my-2" />
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left p-2 bg-gray-200">Arah</th>
                            <th className="text-center p-2 bg-gray-200">Mobil</th>
                            <th className="text-center p-2 bg-gray-200">Bus</th>
                            <th className="text-center p-2 bg-gray-200">Truk</th>
                            <th className="text-center p-2 bg-gray-200">Q (smp/jam)</th>
                            <th className="text-center p-2 bg-gray-200">C (smp/jam)</th>
                            <th className="text-center p-2 bg-gray-200">DJ</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-300 bg-blue-100">
                            <td className="p-2 font-semibold text-blue-900">Lajur Kiri</td>
                            <td className="text-center p-2">{calculation.kiri.mobil}</td>
                            <td className="text-center p-2">{calculation.kiri.bus}</td>
                            <td className="text-center p-2">{calculation.kiri.truk}</td>
                            <td className="text-center p-2 font-bold">{calculation.kiri.volume.toFixed(0)}</td>
                            <td className="text-center p-2">5000</td>
                            <td className="text-center p-2 font-bold text-orange-600">{calculation.kiri.dj.toFixed(3)}</td>
                          </tr>
                          <tr className="border-b border-gray-300 bg-green-100">
                            <td className="p-2 font-semibold text-green-900">Lajur Kanan</td>
                            <td className="text-center p-2">{calculation.kanan.mobil}</td>
                            <td className="text-center p-2">{calculation.kanan.bus}</td>
                            <td className="text-center p-2">{calculation.kanan.truk}</td>
                            <td className="text-center p-2 font-bold">{calculation.kanan.volume.toFixed(0)}</td>
                            <td className="text-center p-2">5000</td>
                            <td className="text-center p-2 font-bold text-orange-600">{calculation.kanan.dj.toFixed(3)}</td>
                          </tr>
                        </tbody>
                      </table>

                      <hr className="my-2" />

                      {/* Detail C dan Q Per Lajur */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Lajur Kiri */}
                        <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                          <h5 className="font-semibold text-blue-900 mb-2">🚗 Lajur Kiri</h5>
                          <div className="space-y-1 text-xs text-gray-700">
                            <p><strong>Volume (Q):</strong> {calculation.kiri.volume.toFixed(0)} smp/jam</p>
                            <p className="text-xs text-gray-600">({calculation.kiri.mobil} mobil + {calculation.kiri.bus} bus + {calculation.kiri.truk} truk)</p>
                            <p className="mt-2"><strong>Kapasitas Jalan (C):</strong> 5000 smp/jam</p>
                            <p className="text-xs text-gray-600">= 2 × 2500 smp/jam</p>
                            <p className="mt-2"><strong>Derajat Kejenuhan (DJ):</strong> <span className="font-bold text-orange-600">{calculation.kiri.dj.toFixed(3)}</span></p>
                            <p className="text-xs text-gray-600">= {calculation.kiri.volume.toFixed(0)} / 2500</p>
                          </div>
                        </div>

                        {/* Lajur Kanan */}
                        <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                          <h5 className="font-semibold text-green-900 mb-2">🚗 Lajur Kanan</h5>
                          <div className="space-y-1 text-xs text-gray-700">
                            <p><strong>Volume (Q):</strong> {calculation.kanan.volume.toFixed(0)} smp/jam</p>
                            <p className="text-xs text-gray-600">({calculation.kanan.mobil} mobil + {calculation.kanan.bus} bus + {calculation.kanan.truk} truk)</p>
                            <p className="mt-2"><strong>Kapasitas Jalan (C):</strong> 5000 smp/jam</p>
                            <p className="text-xs text-gray-600">= 2 × 2500 smp/jam</p>
                            <p className="mt-2"><strong>Derajat Kejenuhan (DJ):</strong> <span className="font-bold text-orange-600">{calculation.kanan.dj.toFixed(3)}</span></p>
                            <p className="text-xs text-gray-600">= {calculation.kanan.volume.toFixed(0)} / 2500</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* Calculate/Save Button */}
                {dataSource && (
                  <div className="space-y-2">
                    {!showResults ? (
                      <button
                        onClick={handleHitungRumus}
                        className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors hover:bg-green-700"
                      >
                        📋 Hitung Rumus PKJI
                      </button>
                    ) : (
                      <button
                        onClick={handleSimpanHasil}
                        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors hover:bg-blue-700"
                      >
                        💾 Simpan Hasil
                      </button>
                    )}                  
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Conclusion Card - Split by Lane - Side by Side */}
          {showResults && calculation && (
            <div className="grid grid-cols-2 gap-6">
              {/* Lajur Kiri Card */}
              <Card className="border-l-4 border-blue-400 bg-blue-50">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🚗</span>
                  <h3 className="text-lg font-semibold text-blue-900">Hasil Analisis & Kesimpulan - Lajur Kiri</h3>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 text-center border-l-4 border-blue-500">
                    <p className="text-sm text-gray-600 mb-1">Volume (Q)</p>
                    <p className="text-3xl font-bold text-blue-600">{Math.round(calculation.kiri.volume)}</p>
                    <p className="text-xs text-gray-600 mt-1">smp/jam</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border-l-4 border-orange-500">
                    <p className="text-sm text-gray-600 mb-1">DJ</p>
                    <p className="text-3xl font-bold text-orange-600">{calculation.kiri.dj.toFixed(3)}</p>
                    <p className="text-xs text-gray-600 mt-1">= {Math.round(calculation.kiri.volume)} / 2500</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border-l-4 border-green-500">
                    <p className="text-sm text-gray-600 mb-1">Kapasitas (C)</p>
                    <p className="text-3xl font-bold text-green-600">5000</p>
                    <p className="text-xs text-gray-500 mt-1">smp/jam</p>
                    <p className="text-xs text-gray-500 mt-1">2 × 2500 = 5000</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-purple-500">
                  <p className="text-sm text-gray-600 mb-1">Level of Service (LOS)</p>
                  <p className={`text-4xl font-bold rounded-lg py-2 px-3 inline-block ${losColors[calculation.kiri.los]}`}>
                    {calculation.kiri.los}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">{calculation.kiri.category}</p>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                  <h4 className="font-semibold text-gray-900 mb-2">📝 Analisis:</h4>
                  <p className="text-gray-700 leading-relaxed text-sm">{calculation.kiri.description}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border-l-4 border-green-500 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">💡 Kesimpulan:</h4>
                  <p className="text-gray-700 leading-relaxed text-sm">{calculation.conclusionKiri}</p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleExportPDFLane('kiri')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 hover:bg-blue-700"
                  >
                    📥 Download PDF
                  </button>
                  <button
                    onClick={() => handlePrintPreviewLane('kiri')}
                    className="border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-semibold transition-colors hover:bg-blue-50"
                  >
                    👁️ Lihat Detail
                  </button>
                </div>
              </Card>

              {/* Lajur Kanan Card */}
              <Card className="border-l-4 border-green-400 bg-green-50">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🚗</span>
                  <h3 className="text-lg font-semibold text-green-900">Hasil Analisis & Kesimpulan - Lajur Kanan</h3>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 text-center border-l-4 border-blue-500">
                    <p className="text-sm text-gray-600 mb-1">Volume (Q)</p>
                    <p className="text-3xl font-bold text-green-600">{Math.round(calculation.kanan.volume)}</p>
                    <p className="text-xs text-gray-600 mt-1">smp/jam</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border-l-4 border-orange-500">
                    <p className="text-sm text-gray-600 mb-1">DJ</p>
                    <p className="text-3xl font-bold text-orange-600">{calculation.kanan.dj.toFixed(3)}</p>
                    <p className="text-xs text-gray-600 mt-1">= {Math.round(calculation.kanan.volume)} / 2500</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border-l-4 border-green-500">
                    <p className="text-sm text-gray-600 mb-1">Kapasitas (C)</p>
                    <p className="text-3xl font-bold text-green-600">5000</p>
                    <p className="text-xs text-gray-500 mt-1">smp/jam</p>
                    <p className="text-xs text-gray-500 mt-1">2 × 2500 = 5000</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-purple-500">
                  <p className="text-sm text-gray-600 mb-1">Level of Service (LOS)</p>
                  <p className={`text-4xl font-bold rounded-lg py-2 px-3 inline-block ${losColors[calculation.kanan.los]}`}>
                    {calculation.kanan.los}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">{calculation.kanan.category}</p>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                  <h4 className="font-semibold text-gray-900 mb-2">📝 Analisis:</h4>
                  <p className="text-gray-700 leading-relaxed text-sm">{calculation.kanan.description}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border-l-4 border-green-500 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">💡 Kesimpulan:</h4>
                  <p className="text-gray-700 leading-relaxed text-sm">{calculation.conclusionKanan}</p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleExportPDFLane('kanan')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 hover:bg-green-700"
                  >
                    📥 Download PDF
                  </button>
                  <button
                    onClick={() => handlePrintPreviewLane('kanan')}
                    className="border-2 border-green-600 text-green-600 px-6 py-2 rounded-lg font-semibold transition-colors hover:bg-green-50"
                  >
                    👁️ Lihat Detail
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* Info Box - LOS Reference */}
          <Card className="bg-blue-50 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              ℹ️ Referensi Tingkat Pelayanan (LOS) - PKJI 2023
            </h4>
            
            {/* LOS Grades with DJ Range */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="border rounded-lg p-3 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-violet-600 text-white px-3 py-1 rounded font-bold">A</div>
                  <span className="font-semibold text-gray-800">Lancar</span>
                </div>
                <p className="text-sm text-gray-600"><strong>DJ:</strong> 0,00 - 0,20</p>
                <p className="text-xs text-gray-500 mt-1">Arus lalu lintas dengan kecepatan tinggi</p>
              </div>
              
              <div className="border rounded-lg p-3 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-sky-400 text-white px-3 py-1 rounded font-bold">B</div>
                  <span className="font-semibold text-gray-800">Lancar Stabil</span>
                </div>
                <p className="text-sm text-gray-600"><strong>DJ:</strong> 0,20 - 0,44</p>
                <p className="text-xs text-gray-500 mt-1">Kecepatan arus mulai menurun</p>
              </div>
              
              <div className="border rounded-lg p-3 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-green-700 text-white px-3 py-1 rounded font-bold">C</div>
                  <span className="font-semibold text-gray-800">Stabil</span>
                </div>
                <p className="text-sm text-gray-600"><strong>DJ:</strong> 0,44 - 0,74</p>
                <p className="text-xs text-gray-500 mt-1">Pengemudi mulai merasakan hambatan</p>
              </div>
              
              <div className="border rounded-lg p-3 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-yellow-400 text-gray-900 px-3 py-1 rounded font-bold">D</div>
                  <span className="font-semibold text-gray-800">Tidak Stabil</span>
                </div>
                <p className="text-sm text-gray-600"><strong>DJ:</strong> 0,74 - 0,85</p>
                <p className="text-xs text-gray-500 mt-1">Kecepatan rendah, perubahan tiba-tiba</p>
              </div>
              
              <div className="border rounded-lg p-3 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-orange-500 text-white px-3 py-1 rounded font-bold">E</div>
                  <span className="font-semibold text-gray-800">Macet</span>
                </div>
                <p className="text-sm text-gray-600"><strong>DJ:</strong> 0,85 - 1,00</p>
                <p className="text-xs text-gray-500 mt-1">Arus pada kapasitas penuh</p>
              </div>
              
              <div className="border rounded-lg p-3 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-red-600 text-white px-3 py-1 rounded font-bold">F</div>
                  <span className="font-semibold text-gray-800">Sangat Macet</span>
                </div>
                <p className="text-sm text-gray-600"><strong>DJ:</strong> &gt; 1,00</p>
                <p className="text-xs text-gray-500 mt-1">Arus terhambat, kemacetan</p>
              </div>
            </div>
            
            {/* Methodology Note */}
            <div className="mt-6 pt-4 border-t border-blue-200 bg-blue-100 rounded p-3">
              <p className="text-sm text-blue-900 mb-2">
                <strong>📋 Catatan Metodologi PKJI 2023:</strong>
              </p>
              <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                <li><strong>n (Jumlah Lajur):</strong> Dihitung otomatis dari tipe jalan per arah</li>
                <li><strong>C₀ (Kapasitas Dasar):</strong> Standar 2.500 smp/jam per lajur untuk jalan 4/2D</li>
                <li><strong>FCLE (Faktor Lebar Lajur):</strong> Ditetapkan dari Tabel PKJI 2023 berdasarkan lebar lajur aktual</li>
                <li><strong>C (Kapasitas Jalan):</strong> Hasil perkalian n × C₀ × FCLE sesuai rumus PKJI 2023</li>
                <li><strong>DJ (Derajat Kejenuhan):</strong> Rasio volume terhadap kapasitas, menunjukkan tingkat kepadatan arus</li>
              </ul>
            </div>
          </Card>

          {/* Print Preview Modal */}
          {showPrintPreview && calculation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 overflow-auto">
              <div className="bg-white rounded-lg w-full max-w-4xl">
                {/* Modal Header - Sticky */}
                <div className="sticky top-0 bg-blue-600 text-white px-4 py-3 flex justify-between items-center z-10">
                  <h2 className="text-lg font-bold">Print Preview - {previewLane === 'kiri' ? 'Lajur Kiri' : previewLane === 'kanan' ? 'Lajur Kanan' : 'Analisis Lalu Lintas'}</h2>
                  <button
                    onClick={() => {
                      setShowPrintPreview(false)
                      setPreviewLane(null)
                    }}
                    className="text-white text-2xl cursor-pointer hover:opacity-80"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
                {/* Modal Content - Lane Specific */}
                <div id={`print-content-${previewLane}`} className="p-6 space-y-3 bg-white" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  {/* Header */}
                  <div className="text-center border-b-2 border-gray-300 pb-3 mb-3">
                    <h2 className="text-xl font-bold text-gray-900">LAPORAN ANALISIS LALU LINTAS</h2>
                    <p className="text-xs text-gray-600">{previewLane === 'kiri' ? 'LAJUR KIRI' : 'LAJUR KANAN'} - Metodologi PKJI 2023</p>
                    <p className="text-xs text-gray-600 mt-1">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>

                  {/* Info Jalan */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Nama Ruas Jalan</p>
                      <p className="text-sm font-bold">{formData.namaRuas || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Tipe Jalan</p>
                      <p className="text-sm font-bold">{formData.tipeJalan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Interval Waktu</p>
                      <p className="text-sm font-bold">{formData.waktuMulai && formData.waktuSelesai ? `${formData.waktuMulai} - ${formData.waktuSelesai}` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Lajur</p>
                      <p className="text-sm font-bold">{previewLane === 'kiri' ? 'Kiri' : 'Kanan'}</p>
                    </div>
                  </div>

                  {/* Data Kendaraan untuk Lane Specific */}
                  <div className="border border-gray-300 rounded p-2 mb-3">
                    <p className="text-xs font-bold text-gray-900 mb-2">DATA KENDARAAN & PERHITUNGAN</p>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-200 border border-gray-300">
                          <th className="border border-gray-300 px-1 py-1 text-left">Jenis Kendaraan</th>
                          <th className="border border-gray-300 px-1 py-1 text-center">Jumlah</th>
                          <th className="border border-gray-300 px-1 py-1 text-center">EMP</th>
                          <th className="border border-gray-300 px-1 py-1 text-center">SMP</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border border-gray-300">
                          <td className="border border-gray-300 px-1 py-1">Mobil Penumpang</td>
                          <td className="border border-gray-300 px-1 py-1 text-center">{previewLane === 'kiri' ? calculation.kiri.mobil : calculation.kanan.mobil}</td>
                          <td className="border border-gray-300 px-1 py-1 text-center">1.0</td>
                          <td className="border border-gray-300 px-1 py-1 text-center">{previewLane === 'kiri' ? calculation.kiri.mobil : calculation.kanan.mobil}</td>
                        </tr>
                        <tr className="border border-gray-300">
                          <td className="border border-gray-300 px-1 py-1">Bus</td>
                          <td className="border border-gray-300 px-1 py-1 text-center">{previewLane === 'kiri' ? calculation.kiri.bus : calculation.kanan.bus}</td>
                          <td className="border border-gray-300 px-1 py-1 text-center">1.6</td>
                          <td className="border border-gray-300 px-1 py-1 text-center">{((previewLane === 'kiri' ? calculation.kiri.bus : calculation.kanan.bus) * 1.6).toFixed(0)}</td>
                        </tr>
                        <tr className="border border-gray-300">
                          <td className="border border-gray-300 px-1 py-1">Truk</td>
                          <td className="border border-gray-300 px-1 py-1 text-center">{previewLane === 'kiri' ? calculation.kiri.truk : calculation.kanan.truk}</td>
                          <td className="border border-gray-300 px-1 py-1 text-center">2.0</td>
                          <td className="border border-gray-300 px-1 py-1 text-center">{((previewLane === 'kiri' ? calculation.kiri.truk : calculation.kanan.truk) * 2.0).toFixed(0)}</td>
                        </tr>
                        <tr className="bg-gray-100 border border-gray-300 font-bold">
                          <td className="border border-gray-300 px-1 py-1">TOTAL VOLUME (Q)</td>
                          <td colSpan="3" className="border border-gray-300 px-1 py-1 text-center">{(previewLane === 'kiri' ? calculation.kiri.volume : calculation.kanan.volume).toFixed(0)} smp/jam</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Hasil Perhitungan */}
                  <div className="border border-gray-300 rounded p-2 mb-3">
                    <p className="text-xs font-bold text-gray-900 mb-2">HASIL PERHITUNGAN</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="border border-gray-300 p-2">
                        <p className="text-xs text-gray-600">Volume (Q)</p>
                        <p className="text-sm font-bold">{(previewLane === 'kiri' ? calculation.kiri.volume : calculation.kanan.volume).toFixed(0)}</p>
                        <p className="text-xs text-gray-600">smp/jam</p>
                      </div>
                      <div className="border border-gray-300 p-2">
                        <p className="text-xs text-gray-600">Kapasitas (C)</p>
                        <p className="text-sm font-bold">5000</p>
                        <p className="text-xs text-gray-600">2 × 2500</p>
                      </div>
                      <div className="border border-gray-300 p-2">
                        <p className="text-xs text-gray-600">DJ</p>
                        <p className="text-sm font-bold">{(previewLane === 'kiri' ? calculation.kiri.dj : calculation.kanan.dj).toFixed(3)}</p>
                        <p className="text-xs text-gray-600">= Q / C₀</p>
                      </div>
                    </div>
                  </div>

                  {/* LOS */}
                  <div className="border border-gray-300 rounded p-2 mb-3 bg-yellow-50">
                    <p className="text-xs text-gray-600 font-semibold mb-1">LEVEL OF SERVICE (LOS)</p>
                    <p className="text-2xl font-bold">{previewLane === 'kiri' ? calculation.kiri.los : calculation.kanan.los} - {previewLane === 'kiri' ? calculation.kiri.category : calculation.kanan.category}</p>
                  </div>

                  {/* Analisis & Kesimpulan */}
                  <div className="mb-3">
                    <p className="text-xs font-bold text-gray-900 mb-1">ANALISIS:</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{previewLane === 'kiri' ? calculation.kiri.description : calculation.kanan.description}</p>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-bold text-gray-900 mb-1">KESIMPULAN:</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{previewLane === 'kiri' ? calculation.conclusionKiri : calculation.conclusionKanan}</p>
                  </div>

                  <div className="text-center text-xs text-gray-500 border-t pt-2 mt-4">
                    <p>© 2025 Kinerja Ruas Jalan. All rights reserved.</p>
                  </div>
                </div>
                </div>

                {/* Modal Footer - Sticky */}
                <div className="sticky bottom-0 bg-gray-100 px-4 py-3 flex justify-between items-center border-t border-gray-300">
                  <button
                    onClick={() => {
                      // Open print window dengan content dari modal
                      const printWindow = window.open('', '', 'width=900,height=1200')
                      const printDoc = printWindow.document
                      const laneTitle = previewLane === 'kiri' ? 'LAJUR KIRI' : 'LAJUR KANAN'
                      
                      printDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Laporan Analisis Lalu Lintas - ${laneTitle}</title>
  <style>
    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: Arial, sans-serif;
        font-size: 11px;
        line-height: 1.5;
        color: #000;
      }
      h2, h3, h4 {
        margin-top: 10px;
        margin-bottom: 5px;
      }
      h2 {
        font-size: 16px;
        text-align: center;
      }
      h3 {
        font-size: 12px;
        text-align: center;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
      }
      th, td {
        border: 1px solid #000;
        padding: 6px;
        text-align: left;
      }
      th {
        background-color: #e0e0e0;
        font-weight: bold;
      }
      .section {
        margin: 15px 0;
        border: 1px solid #000;
        padding: 10px;
      }
      .section-title {
        font-weight: bold;
        font-size: 11px;
        background-color: #e0e0e0;
        margin: -10px -10px 10px -10px;
        padding: 5px 10px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin: 10px 0;
        font-size: 11px;
      }
      .info-item {
        page-break-inside: avoid;
      }
      .info-label {
        font-size: 10px;
        color: #666;
        font-weight: bold;
      }
      .info-value {
        font-size: 12px;
        font-weight: bold;
        margin-top: 3px;
      }
      .results-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
        margin: 10px 0;
      }
      .result-box {
        border: 1px solid #000;
        padding: 10px;
        text-align: center;
      }
      .result-label {
        font-size: 10px;
        color: #666;
      }
      .result-value {
        font-size: 16px;
        font-weight: bold;
        margin: 5px 0;
      }
      .los-box {
        background-color: #fffacd;
        border: 1px solid #000;
        padding: 10px;
        margin: 10px 0;
      }
      .los-title {
        font-size: 10px;
        color: #666;
        font-weight: bold;
      }
      .los-value {
        font-size: 18px;
        font-weight: bold;
        margin-top: 5px;
      }
      .analysis-section {
        margin: 10px 0;
      }
      .analysis-title {
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 5px;
      }
      .analysis-text {
        font-size: 11px;
        line-height: 1.6;
        text-align: justify;
      }
      .footer {
        text-align: center;
        border-top: 1px solid #000;
        margin-top: 15px;
        padding-top: 10px;
        font-size: 9px;
        color: #999;
      }
      p {
        margin: 0;
        padding: 0;
      }
  </style>
</head>
<body>
`)

                      // Get the modal content and extract text
                      const printContent = document.getElementById(`print-content-${previewLane}`)
                      if (printContent) {
                        // Extract data from calculation for better formatting
                        const laneData = previewLane === 'kiri' ? calculation.kiri : calculation.kanan
                        const conclusionText = previewLane === 'kiri' ? calculation.conclusionKiri : calculation.conclusionKanan
                        
                        printDoc.write(`
  <div style="max-width: 210mm; margin: 0 auto;">
    <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
      <h2>LAPORAN ANALISIS LALU LINTAS</h2>
      <h3>${laneTitle} - Metodologi PKJI 2023</h3>
      <p style="margin-top: 5px; font-size: 10px;">${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nama Ruas Jalan</div>
        <div class="info-value">${formData.namaRuas || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Tipe Jalan</div>
        <div class="info-value">4/2 D</div>
      </div>
      <div class="info-item">
        <div class="info-label">Interval Waktu</div>
        <div class="info-value">${formData.waktuMulai && formData.waktuSelesai ? `${formData.waktuMulai} - ${formData.waktuSelesai}` : '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Lajur</div>
        <div class="info-value">${previewLane === 'kiri' ? 'Kiri' : 'Kanan'}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">DATA KENDARAAN & PERHITUNGAN</div>
      <table>
        <thead>
          <tr>
            <th>Jenis Kendaraan</th>
            <th style="text-align: center;">Jumlah</th>
            <th style="text-align: center;">EMP</th>
            <th style="text-align: center;">SMP</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Mobil Penumpang</td>
            <td style="text-align: center;">${laneData.mobil}</td>
            <td style="text-align: center;">1.0</td>
            <td style="text-align: center;">${laneData.mobil}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td>Bus</td>
            <td style="text-align: center;">${laneData.bus}</td>
            <td style="text-align: center;">1.6</td>
            <td style="text-align: center;">${(laneData.bus * 1.6).toFixed(0)}</td>
          </tr>
          <tr>
            <td>Truk</td>
            <td style="text-align: center;">${laneData.truk}</td>
            <td style="text-align: center;">2.0</td>
            <td style="text-align: center;">${(laneData.truk * 2.0).toFixed(0)}</td>
          </tr>
          <tr style="background-color: #e8e8e8; font-weight: bold;">
            <td>TOTAL VOLUME (Q)</td>
            <td colspan="3" style="text-align: center;">${Math.round(laneData.volume)} smp/jam</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">HASIL PERHITUNGAN</div>
      <div class="results-grid">
        <div class="result-box">
          <div class="result-label">Volume (Q)</div>
          <div class="result-value">${Math.round(laneData.volume)}</div>
          <div class="result-label">smp/jam</div>
        </div>
        <div class="result-box">
          <div class="result-label">Kapasitas (C)</div>
          <div class="result-value">5000</div>
          <div class="result-label">2 × 2500</div>
        </div>
        <div class="result-box">
          <div class="result-label">DJ</div>
          <div class="result-value">${laneData.dj.toFixed(3)}</div>
          <div class="result-label">= Q / C₀</div>
        </div>
      </div>
    </div>

    <div class="los-box">
      <div class="los-title">LEVEL OF SERVICE (LOS)</div>
      <div class="los-value">${laneData.los} - ${laneData.category}</div>
    </div>

    <div class="analysis-section">
      <div class="analysis-title">ANALISIS:</div>
      <div class="analysis-text">${laneData.description}</div>
    </div>

    <div class="analysis-section">
      <div class="analysis-title">KESIMPULAN:</div>
      <div class="analysis-text">${conclusionText}</div>
    </div>

    <div class="footer">
      © 2025 Kinerja Ruas Jalan | Printed on ${new Date().toLocaleString('id-ID')}
    </div>
  </div>
`)
                      }

                      printDoc.write(`
</body>
</html>
`)
                      printDoc.close()
                      
                      setTimeout(() => {
                        printWindow.print()
                      }, 500)
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                  >
                    🖨️ Cetak Sekarang
                  </button>
                  <button
                    onClick={() => {
                      setShowPrintPreview(false)
                      setPreviewLane(null)
                    }}
                    className="border-2 border-gray-400 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
