/**
 * Traffic Engineering Calculations - PKJI 2023
 * Perhitungan Kapasitas dan Derajat Kejenuhan Jalan
 */

// ===== SMP FACTORS (Satuan Mobil Penumpang) =====
const SMP_FACTORS = {
  mobilPenumpang: 1.0, // Mobil penumpang
  bus: 1.3, // Bus
  truckRingan: 1.2, // Truk ringan
  truckBerat: 2.0, // Truk berat
};

/**
 * Calculate total SMP (Satuan Mobil Penumpang) from vehicle counts
 * @param {Object} vehicles - Vehicle counts {mobilPenumpang, bus, truckRingan, truckBerat}
 * @returns {number} Total SMP
 */
export const calculateTotalSMP = (vehicles = {}) => {
  const {
    mobilPenumpang = 0,
    bus = 0,
    truckRingan = 0,
    truckBerat = 0,
  } = vehicles;

  const totalSMP =
    mobilPenumpang * SMP_FACTORS.mobilPenumpang +
    bus * SMP_FACTORS.bus +
    truckRingan * SMP_FACTORS.truckRingan +
    truckBerat * SMP_FACTORS.truckBerat;

  return parseFloat(totalSMP.toFixed(2));
};

/**
 * Calculate hourly volume from frame count and video duration
 * Assumes uniform distribution of vehicles throughout the hour
 * @param {number} totalSMP - Total SMP vehicles
 * @param {number} durationSeconds - Video duration in seconds
 * @returns {number} Hourly volume in SMP/jam
 */
export const calculateHourlyVolume = (totalSMP = 0, durationSeconds = 1) => {
  if (!durationSeconds || durationSeconds <= 0) return 0;
  
  const durationHours = durationSeconds / 3600;
  const hourlyVolume = totalSMP / durationHours;
  
  return parseFloat(hourlyVolume.toFixed(2));
};

/**
 * Calculate road capacity using PKJI 2023 formula:
 * C = n × C0 × FCLE
 * Where:
 *   n = number of lanes
 *   C0 = base capacity per lane (default 5000 smp/jam)
 *   FCLE = effective lane width factor
 * @returns {Object} {capacity, formula}
 */
export const calculateCapacity = ({
  numLanes = 4,
  baseCapacity = 5000,
  effectiveWidthFactor = 1.0,
} = {}) => {
  const capacity = numLanes * baseCapacity * effectiveWidthFactor;
  const formula = `${numLanes} × ${baseCapacity} × ${effectiveWidthFactor} = ${Math.round(capacity)}`;

  return {
    capacity: Math.round(capacity),
    formula,
  };
};

/**
 * Calculate Degree of Saturation (Derajat Kejenuhan)
 * DJ = Q / C
 * Where:
 *   Q = volume (smp/jam)
 *   C = capacity (smp/jam)
 * @returns {Object} {degree, formula}
 */
export const calculateDegreeOfSaturation = (volume = 0, capacity = 1) => {
  if (capacity <= 0) capacity = 1;
  
  const degree = volume / capacity;
  const formula = `${Math.round(volume)} / ${Math.round(capacity)} = ${degree.toFixed(3)}`;

  return {
    degree: parseFloat(degree.toFixed(3)),
    formula,
  };
};

/**
 * Determine Level of Service (LOS) and category based on DJ
 * PKJI 2023 Classification:
 *   A: DJ ≤ 0.60 → Lancar (Free flow)
 *   B: 0.60 < DJ ≤ 0.70 → Lancar Stabil (Stable flow)
 *   C: 0.70 < DJ ≤ 0.80 → Stabil (Stable)
 *   D: DJ > 0.80 → Tidak Stabil (Unstable)
 *   E: DJ > 1.00 → Macet (Congested)
 *   F: DJ > 1.20 → Sangat Macet (Severe congestion)
 * @returns {Object} {los, category, description}
 */
export const determineLOS = (degreeOfSaturation = 0) => {
  let los, category, description;

  if (degreeOfSaturation <= 0.6) {
    los = "A";
    category = "Lancar";
    description =
      "Kondisi lalu lintas lancar, pengemudi memiliki kebebasan penuh dalam memilih kecepatan dan manuver.";
  } else if (degreeOfSaturation <= 0.7) {
    los = "B";
    category = "Lancar Stabil";
    description =
      "Arus lalu lintas masih lancar dan stabil, namun pengemudi mulai merasakan batasan kecepatan.";
  } else if (degreeOfSaturation <= 0.8) {
    los = "C";
    category = "Stabil";
    description =
      "Arus masih stabil namun volume kendaraan mendekati kapasitas jalan. Pengemudi memiliki kebebasan terbatas dalam memilih kecepatan dan manuver.";
  } else if (degreeOfSaturation <= 1.0) {
    los = "D";
    category = "Tidak Stabil";
    description =
      "Arus lalu lintas tidak stabil dan cenderung terganggu. Kemampuan pengemudi untuk manuver sangat terbatas.";
  } else if (degreeOfSaturation <= 1.2) {
    los = "E";
    category = "Macet";
    description =
      "Arus lalu lintas macet, pergerakan kendaraan sangat terbatas. Kemacetan dapat terjadi kapan saja.";
  } else {
    los = "F";
    category = "Sangat Macet";
    description =
      "Arus lalu lintas sangat macet, kecepatan rendah dan sering terjadi kemacetan total.";
  }

  return { los, category, description };
};

/**
 * Generate comprehensive traffic analysis conclusion
 */
export const generateConclusion = ({
  los,
  category,
  degreeOfSaturation,
  volume,
  capacity,
  recommendations = [],
} = {}) => {
  let baseConclusion = `Kondisi lalu lintas berada pada Level of Service ${los} (${category}). `;

  if (degreeOfSaturation <= 0.6) {
    baseConclusion +=
      "Kapasitas jalan masih sangat mencukupi dengan volume kendaraan yang rendah. Tidak diperlukan tindakan khusus.";
  } else if (degreeOfSaturation <= 0.8) {
    baseConclusion +=
      "Kapasitas jalan masih cukup tetapi volume kendaraan sudah cukup tinggi. Diperlukan monitoring berkelanjutan.";
  } else {
    baseConclusion +=
      "Kapasitas jalan sudah terlampaui atau mendekati kapasitas maksimal. Diperlukan tindakan untuk meningkatkan kapasitas atau mengurangi volume lalu lintas.";
  }

  if (recommendations.length > 0) {
    baseConclusion += ` Rekomendasi: ${recommendations.join("; ")}.`;
  }

  return baseConclusion;
};

/**
 * Format duration from seconds to MM:SS format
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "00:00";
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

/**
 * Complete traffic calculation workflow
 * Takes YOLO detection data and returns full calculation results
 */
export const performTrafficCalculation = ({
  // From YOLO Detection
  vehicles = {},
  videoDurationSeconds = 60,
  framesCounted = 0,
  
  // Road parameters
  numLanes = 4,
  baseCapacity = 5000,
  effectiveWidthFactor = 1.0,
} = {}) => {
  // Step 1: Calculate total SMP from vehicles
  const totalSMP = calculateTotalSMP(vehicles);

  // Step 2: Calculate hourly volume
  const hourlyVolume = calculateHourlyVolume(totalSMP, videoDurationSeconds);

  // Step 3: Calculate capacity
  const { capacity, formula: capacityFormula } = calculateCapacity({
    numLanes,
    baseCapacity,
    effectiveWidthFactor,
  });

  // Step 4: Calculate degree of saturation
  const { degree, formula: degreeFormula } = calculateDegreeOfSaturation(
    hourlyVolume,
    capacity
  );

  // Step 5: Determine LOS
  const { los, category, description } = determineLOS(degree);

  // Step 6: Generate conclusion
  const conclusion = generateConclusion({
    los,
    category,
    degreeOfSaturation: degree,
    volume: hourlyVolume,
    capacity,
  });

  return {
    totalSMP,
    hourlyVolume,
    capacity,
    capacityFormula,
    degree,
    degreeFormula,
    los,
    category,
    description,
    conclusion,
    framesCounted,
    videoDurationSeconds,
    videoDurationFormatted: formatDuration(videoDurationSeconds),
  };
};

export default {
  calculateTotalSMP,
  calculateHourlyVolume,
  calculateCapacity,
  calculateDegreeOfSaturation,
  determineLOS,
  generateConclusion,
  formatDuration,
  performTrafficCalculation,
  SMP_FACTORS,
};
