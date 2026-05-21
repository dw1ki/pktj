/**
 * Tabel EMP DINAMIS berdasarkan Arus (Q) per arah
 * Sumber: PKJI 2023 - Tabel 2-6 EMP untuk JBD (Jalan Bebas Hambatan Divisi)
 * 
 * Arus per arah (smp/jam) → EMP factors
 */
export const DYNAMIC_EMP_FACTORS = {
  // ≤ 1250 smp/jam
  range1: {
    min: 0,
    max: 1250,
    KS: 1.0,    // Mobil Penumpang
    BB: 1.2,    // Bus
    TB: 1.6,    // Truk
  },
  // 1251 - 2250 smp/jam
  range2: {
    min: 1251,
    max: 2250,
    KS: 1.0,
    BB: 1.4,
    TB: 2.0,
  },
  // 2251 - 2800 smp/jam
  range3: {
    min: 2251,
    max: 2800,
    KS: 1.0,
    BB: 1.7,
    TB: 2.5,
  },
  // > 2800 smp/jam
  range4: {
    min: 2801,
    max: Infinity,
    KS: 1.0,
    BB: 1.6,
    TB: 3.5,
  },
};

/**
 * Get EMP factors berdasarkan flow rate (Q)
 * @param {Number} flowRate - Arus lalu lintas per arah (smp/jam)
 * @returns {Object} EMP factors {KS, BB, TB}
 */
export function getDynamicEMPFactors(flowRate) {
  if (flowRate <= 1250) return DYNAMIC_EMP_FACTORS.range1;
  if (flowRate <= 2250) return DYNAMIC_EMP_FACTORS.range2;
  if (flowRate <= 2800) return DYNAMIC_EMP_FACTORS.range3;
  return DYNAMIC_EMP_FACTORS.range4;
}

/**
 * Tabel EMP STATIS (berdasarkan tipe alinemen dan tipe jalan)
 * Sumber: PKJI 2023
 */
export const EMP_FACTORS = {
  // TIPE ALINEMEN: DATAR
  datar: {
    '2/2 UD': {
      KS: 1.2,    // Mobil Penumpang
      BB: 1.2,    // Bus
      TB: 1.6,    // Truk
    },
    '4/2': {
      KS: 1.2,
      BB: 1.4,
      TB: 2.0,
    },
    '6/2': {
      KS: 1.2,
      BB: 1.4,
      TB: 2.0,
    },
  },
  
  // TIPE ALINEMEN: BUKIT
  bukit: {
    '2/2 UD': {
      KS: 1.8,
      BB: 1.6,
      TB: 4.8,
    },
    '4/2': {
      KS: 1.8,
      BB: 2.0,
      TB: 4.9,
    },
    '6/2': {
      KS: 2.2,
      BB: 2.3,
      TB: 4.5,
    },
  },
  
  // TIPE ALINEMEN: GUNUNG
  gunung: {
    '2/2 UD': {
      KS: 3.0,
      BB: 2.2,
      TB: 5.0,
    },
    '4/2': {
      KS: 2.9,
      BB: 2.6,
      TB: 5.1,
    },
    '6/2': {
      KS: 2.6,
      BB: 2.9,
      TB: 4.8,
    },
  },
};

/**
 * Kapasitas Dasar (C0) untuk setiap tipe jalan - PKJI 2023
 */
export const BASE_CAPACITY = {
  '2/2 UD': 1550,  // smp/jam per lajur, × 2 = 3100
  '4/2': 2500,   // smp/jam per lajur, × 2 = 5000
  '6/2': 1667,   // smp/jam per lajur, × 3 = 5000
};

/**
 * Hitung SMP total dari vehicle counts menggunakan EMP factors
 * Mendukung 2 mode: STATIS (berdasarkan alinemen+jalan) atau DINAMIS (berdasarkan Q)
 * 
 * @param {Object} vehicles - { mobil, bus, truk }
 * @param {String} alinemen - 'datar', 'bukit', 'gunung' (untuk mode statis)
 * @param {String} tipeJalan - '2/2 UD', '4/2', '6/2' (untuk mode statis)
 * @param {Number} flowRatePerDirection - Q per arah (smp/jam) - untuk mode dinamis (optional)
 * @returns {Number} Total SMP
 */
export function calculateSMP(vehicles, alinemen, tipeJalan, flowRatePerDirection = null) {
  let factors;
  
  // Mode DINAMIS: gunakan EMP factors berdasarkan Q per arah
  if (flowRatePerDirection !== null && flowRatePerDirection > 0) {
    factors = getDynamicEMPFactors(flowRatePerDirection);
    console.log(`📊 Menggunakan EMP DINAMIS untuk Q=${flowRatePerDirection.toFixed(0)} smp/jam:`, factors);
  } else {
    // Mode STATIS: gunakan EMP factors berdasarkan alinemen + jalan
    factors = EMP_FACTORS[alinemen]?.[tipeJalan];
    console.log(`📊 Menggunakan EMP STATIS untuk ${alinemen} + ${tipeJalan}:`, factors);
  }
  
  if (!factors) {
    console.warn(`⚠️ EMP factors tidak ditemukan`);
    return 0;
  }
  
  const smp =
    (vehicles.mobil || 0) * factors.KS +
    (vehicles.bus || 0) * factors.BB +
    (vehicles.truk || 0) * factors.TB;
  
  return Math.round(smp);
}

/**
 * Hitung Q (Volume dalam smp/jam) dari total SMP
 * @param {Number} totalSMP - Total SMP
 * @param {Number} durationMinutes - Durasi pengamatan dalam menit
 * @returns {Number} Q (smp/jam)
 */
export function calculateVolume(totalSMP, durationMinutes) {
  if (!durationMinutes || durationMinutes <= 0) return 0;
  const hours = durationMinutes / 60;
  return Math.round(totalSMP / hours);
}

/**
 * Get EMP factors untuk display
 */
export function getEMPFactors(alinemen, tipeJalan) {
  return EMP_FACTORS[alinemen]?.[tipeJalan] || null;
}
