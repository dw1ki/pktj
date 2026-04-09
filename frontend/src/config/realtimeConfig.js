/**
 * Real-time CCTV Configuration
 * Configuration untuk berbagai CCTV Jasa Marga
 */

export const CCTV_PRESETS = {
  // Template default untuk CCTV Jasa Marga
  DEFAULT: {
    name: 'Custom CCTV',
    rtsp_template: 'rtsp://username:password@ip_address:port/stream_path',
    port: 554,
    fps: 30,
    resolution: '1920x1080',
    codec: 'H.264',
    confidence: 0.5,
    lane_mapping: { kiri: 0, kanan: 1 }
  },

  // CCTV di Gerbang Tol
  GERBANG_TOL_MASUK_KIRI: {
    name: 'Gerbang Tol - Masuk Kiri',
    rtsp_url: 'rtsp://admin:password@192.168.1.100:554/stream1',
    fps: 30,
    resolution: '1920x1080',
    codec: 'H.264',
    confidence: 0.5,
    lane_mapping: { utama: 0, cepat: 1, arteri: 2 }
  },

  GERBANG_TOL_MASUK_KANAN: {
    name: 'Gerbang Tol - Masuk Kanan',
    rtsp_url: 'rtsp://admin:password@192.168.1.101:554/stream1',
    fps: 30,
    resolution: '1920x1080',
    codec: 'H.264',
    confidence: 0.5,
    lane_mapping: { utama: 0, cepat: 1, arteri: 2 }
  },

  // CCTV di Area Jalan Tol
  RUAS_TENGAH_KIRI: {
    name: 'Ruas Tengah - Lane Kiri',
    rtsp_url: 'rtsp://admin:password@192.168.1.102:554/stream1',
    fps: 30,
    resolution: '1920x1080',
    codec: 'H.264',
    confidence: 0.5,
    lane_mapping: { kiri: 0 }
  },

  RUAS_TENGAH_KANAN: {
    name: 'Ruas Tengah - Lane Kanan',
    rtsp_url: 'rtsp://admin:password@192.168.1.103:554/stream1',
    fps: 30,
    resolution: '1920x1080',
    codec: 'H.264',
    confidence: 0.5,
    lane_mapping: { kanan: 1 }
  },

  RUAS_TENGAH_SHOULDER: {
    name: 'Ruas Tengah - Shoulder',
    rtsp_url: 'rtsp://admin:password@192.168.1.104:554/stream1',
    fps: 30,
    resolution: '1920x1080',
    codec: 'H.264',
    confidence: 0.5,
    lane_mapping: { shoulder: 2 }
  },

  // CCTV di Keluar Tol
  GERBANG_KELUAR_KIRI: {
    name: 'Gerbang Keluar - Kiri',
    rtsp_url: 'rtsp://admin:password@192.168.1.105:554/stream1',
    fps: 30,
    resolution: '1920x1080',
    codec: 'H.264',
    confidence: 0.5,
    lane_mapping: { utama: 0, cepat: 1, arteri: 2 }
  },

  GERBANG_KELUAR_KANAN: {
    name: 'Gerbang Keluar - Kanan',
    rtsp_url: 'rtsp://admin:password@192.168.1.106:554/stream1',
    fps: 30,
    resolution: '1920x1080',
    codec: 'H.264',
    confidence: 0.5,
    lane_mapping: { utama: 0, cepat: 1, arteri: 2 }
  }
}

/**
 * Vehicle Type Classifications
 * Sesuai dengan YOLO model training
 */
export const VEHICLE_TYPES = {
  MOBIL: {
    id: 0,
    name: 'mobil',
    display: 'Mobil Penumpang',
    color: '#00ff00', // Green
    emoji: '🚗'
  },
  BUS: {
    id: 1,
    name: 'bus',
    display: 'Bus',
    color: '#0000ff', // Blue
    emoji: '🚌'
  },
  TRUK: {
    id: 2,
    name: 'truk',
    display: 'Truk',
    color: '#00a5ff', // Orange
    emoji: '🚚'
  },
  MOTOR: {
    id: 3,
    name: 'motor',
    display: 'Motor',
    color: '#ffff00', // Cyan
    emoji: '🏍️'
  }
}

/**
 * Lane Types
 */
export const LANE_TYPES = {
  KIRI: {
    id: 0,
    name: 'kiri',
    display: 'Lane Kiri'
  },
  KANAN: {
    id: 1,
    name: 'kanan',
    display: 'Lane Kanan'
  },
  TENGAH: {
    id: 2,
    name: 'tengah',
    display: 'Lane Tengah'
  },
  SHOULDER: {
    id: 3,
    name: 'shoulder',
    display: 'Shoulder'
  }
}

/**
 * Detection Confidence Levels
 */
export const CONFIDENCE_LEVELS = [
  { value: 0.3, label: 'Low (30%) - Semua deteksi' },
  { value: 0.5, label: 'Medium (50%) - Default' },
  { value: 0.7, label: 'High (70%) - Akurat' },
  { value: 0.9, label: 'Very High (90%) - Sangat ketat' }
]

/**
 * Performance Presets
 */
export const PERFORMANCE_PRESETS = {
  LOW_LATENCY: {
    name: 'Latency Rendah',
    description: 'Prioritas latency, FPS lebih rendah',
    batch_size: 1,
    compression_quality: 90,
    frame_skip: 0,
    confidence: 0.5
  },
  BALANCED: {
    name: 'Seimbang',
    description: 'Balance antara latency dan throughput',
    batch_size: 2,
    compression_quality: 70,
    frame_skip: 0,
    confidence: 0.5
  },
  HIGH_THROUGHPUT: {
    name: 'Throughput Tinggi',
    description: 'Prioritas FPS tinggi, latency lebih tinggi',
    batch_size: 4,
    compression_quality: 50,
    frame_skip: 1,
    confidence: 0.6
  },
  POWER_SAVING: {
    name: 'Hemat Daya',
    description: 'Minimal processing, latency tinggi',
    batch_size: 8,
    compression_quality: 30,
    frame_skip: 5,
    confidence: 0.7
  }
}

/**
 * Alert Thresholds
 */
export const ALERT_THRESHOLDS = {
  HIGH_CONGESTION: 100,        // vehicles per minute
  VEHICLE_QUEUE: 50,           // consecutive frames
  UNUSUAL_VEHICLE_TYPE: 5,     // minimum detections to flag
  LOW_FPS: 10,                 // minimum acceptable FPS
  HIGH_LATENCY: 1000           // milliseconds
}

/**
 * Recording Options
 */
export const RECORDING_OPTIONS = {
  DISABLED: {
    id: 0,
    name: 'disabled',
    display: 'Tidak Merekam'
  },
  DETECTIONS_ONLY: {
    id: 1,
    name: 'detections_only',
    display: 'Hanya saat ada deteksi'
  },
  CONTINUOUS: {
    id: 2,
    name: 'continuous',
    display: 'Rekam terus-menerus'
  },
  ALERTS_ONLY: {
    id: 3,
    name: 'alerts_only',
    display: 'Hanya saat alert'
  }
}

/**
 * Database Storage Configuration
 */
export const STORAGE_CONFIG = {
  RETENTION_DAYS: 30,           // Simpan data 30 hari
  BATCH_INSERT_SIZE: 100,       // Insert 100 records sekaligus
  CLEANUP_INTERVAL: 3600,       // Cleanup setiap 1 jam
  ARCHIVE_THRESHOLD: 7          // Archive data > 7 hari
}

export default {
  CCTV_PRESETS,
  VEHICLE_TYPES,
  LANE_TYPES,
  CONFIDENCE_LEVELS,
  PERFORMANCE_PRESETS,
  ALERT_THRESHOLDS,
  RECORDING_OPTIONS,
  STORAGE_CONFIG
}
