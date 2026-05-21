import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';

const Perhitungan = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const detectionId = searchParams.get('detectionId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detection, setDetection] = useState(null);

  // MANUAL INPUT PARAMETERS
  const [roadParams, setRoadParams] = useState({
    roadName: 'MBZ',
    roadType: '4/2',
    numLanes: 4,
    baseCapacity: 5000,
    laneWidth: 3.5,
    baseSpeed: 88,
    effectiveWidthFactor: 1.0,
  });

  // CALCULATION RESULTS
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (detectionId) {
      fetchDetectionData();
    }
  }, [detectionId]);

  const fetchDetectionData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/detect/results/${detectionId}`);
      const data = response.data.data;

      setDetection(data);

      // Auto-fill road parameters
      if (data.roadParameters) {
        setRoadParams(data.roadParameters);
      }

      // Auto-fill calculation results if available
      if (data.calculations && data.calculations.capacity > 0) {
        setResults(data.calculations);
        setShowResults(true);
      }
    } catch (err) {
      setError('Gagal memuat data detection');
      console.error('Error fetching detection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRoadParams((prev) => ({
      ...prev,
      [name]: name === 'roadName' || name === 'roadType' ? value : parseFloat(value) || 0,
    }));
  };

  const handleSaveParameters = async () => {
    try {
      setLoading(true);
      await api.put(`/detect/${detectionId}/parameters`, {
        roadParameters: roadParams,
      });
      setError('');
    } catch (err) {
      setError('Gagal menyimpan parameter');
      console.error('Error saving parameters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    try {
      setLoading(true);
      setError('');

      // Save parameters first
      await handleSaveParameters();

      // Perform calculation
      const response = await api.post(`/detect/${detectionId}/calculate`);

      if (response.data.success) {
        setResults(response.data.data);
        setShowResults(true);
        
        // Fetch updated detection data
        await fetchDetectionData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal melakukan perhitungan');
      console.error('Error calculating:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/histori/${detectionId}`);
  };

  if (loading && !detection) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!detection) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>Detection tidak ditemukan</p>
        </div>
      </div>
    );
  }

  // Check if YOLO processing is complete
  if (detection.status === 'draft') {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p>Silakan proses video dengan YOLO API terlebih dahulu di halaman Deteksi</p>
        </div>
        <button
          onClick={() => navigate('/deteksi')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Kembali ke Deteksi
        </button>
      </div>
    );
  }

  if (detection.status === 'processing') {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
          <p>Video sedang diproses oleh YOLO API. Silakan tunggu...</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  if (detection.status === 'failed') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>Gagal memproses video: {detection.error}</p>
        </div>
        <button
          onClick={() => navigate('/deteksi')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Coba Upload Video Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            <span>←</span> Kembali
          </button>
          <h1 className="text-3xl font-bold">Perhitungan Kapasitas Jalan</h1>
          <p className="text-gray-600 mt-2">
            Tanggal Upload: {new Date(detection.createdAt).toLocaleDateString('id-ID')}
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN: INPUT PARAMETERS */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Informasi Ruas Jalan</h2>

            <div className="space-y-4">
              {/* Nama Ruas Jalan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Ruas Jalan
                </label>
                <input
                  type="text"
                  name="roadName"
                  value={roadParams.roadName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Contoh: MBZ, Cikampek, dll"
                />
              </div>

              {/* Tipe Jalan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipe Jalan
                </label>
                <input
                  type="text"
                  name="roadType"
                  value={roadParams.roadType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Contoh: 4/2"
                />
              </div>

              {/* FORMULA SECTION */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 my-4">
                <h3 className="font-bold text-blue-900 mb-2">
                  Formula: C = n × C₀ × FCLE
                </h3>
                <p className="text-sm text-blue-800">
                  Keterangan:
                </p>
                <ul className="text-xs text-blue-700 mt-2 space-y-1">
                  <li>• C = Kapasitas (smp/jam)</li>
                  <li>• n = Jumlah lajur</li>
                  <li>• C₀ = Kapasitas dasar (5000 smp/jam)</li>
                  <li>• FCLE = Faktor Lebar Efektif</li>
                </ul>
              </div>

              {/* Jumlah Lajur */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jumlah Lajur (n)
                </label>
                <input
                  type="number"
                  name="numLanes"
                  min="1"
                  step="1"
                  value={roadParams.numLanes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Kapasitas Dasar */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kapasitas Dasar (C₀) - smp/jam per lajur
                </label>
                <input
                  type="number"
                  name="baseCapacity"
                  min="1000"
                  step="100"
                  value={roadParams.baseCapacity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default untuk jalan tol: 5000 smp/jam
                </p>
              </div>

              {/* Lebar Lajur */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lebar Lajur (m)
                </label>
                <input
                  type="number"
                  name="laneWidth"
                  min="0"
                  step="0.1"
                  value={roadParams.laneWidth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Kecepatan Dasar */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kecepatan Dasar (km/jam)
                </label>
                <input
                  type="number"
                  name="baseSpeed"
                  min="0"
                  step="1"
                  value={roadParams.baseSpeed}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Faktor Lebar Efektif */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Faktor Lebar Efektif (FCLE)
                </label>
                <input
                  type="number"
                  name="effectiveWidthFactor"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={roadParams.effectiveWidthFactor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: 1.0 (tidak ada penyesuaian)
                </p>
              </div>

              {/* CALCULATE BUTTON */}
              <button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition duration-200"
              >
                {loading ? 'Menghitung...' : 'Hitung Kinerja Jalan'}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: YOLO DATA & RESULTS */}
          <div className="space-y-6">
            {/* YOLO RESULTS CARD */}
            {detection.yoloResults && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">
                  Hasil Deteksi YOLO
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-gray-600 text-sm">Total Kendaraan</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {detection.yoloResults.totalVehicles || 0}
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded">
                    <p className="text-gray-600 text-sm">Total SMP</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(detection.yoloResults.volumeSMP || 0)}
                    </p>
                  </div>
                </div>

                {/* VEHICLE BREAKDOWN */}
                <div className="mt-4">
                  <p className="font-semibold text-gray-700 mb-3">
                    Rincian Tipe Kendaraan:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between bg-gray-50 p-2 rounded">
                      <span>Mobil Penumpang (×1.0)</span>
                      <span className="font-semibold">
                        {detection.yoloResults.vehicleTypes.mobilPenumpang || 0} unit
                      </span>
                    </div>
                    <div className="flex justify-between bg-gray-50 p-2 rounded">
                      <span>Truck Ringan (×1.2)</span>
                      <span className="font-semibold">
                        {detection.yoloResults.vehicleTypes.truckRingan || 0} unit
                      </span>
                    </div>
                    <div className="flex justify-between bg-gray-50 p-2 rounded">
                      <span>Truck Berat (×2.0)</span>
                      <span className="font-semibold">
                        {detection.yoloResults.vehicleTypes.truckBerat || 0} unit
                      </span>
                    </div>
                    <div className="flex justify-between bg-gray-50 p-2 rounded">
                      <span>Bus (×1.3)</span>
                      <span className="font-semibold">
                        {detection.yoloResults.vehicleTypes.bus || 0} unit
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CALCULATION RESULTS CARD */}
            {showResults && results && (
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                <h2 className="text-xl font-bold mb-4 border-b pb-2 flex items-center">
                  <span className="text-green-600 mr-2">✓</span> Hasil Perhitungan
                </h2>

                {/* LOS STATUS */}
                <div className={`p-4 rounded-lg mb-4 text-white text-center ${
                  results.los === 'A' ? 'bg-green-600' :
                  results.los === 'B' ? 'bg-green-500' :
                  results.los === 'C' ? 'bg-yellow-500' :
                  results.los === 'D' ? 'bg-orange-500' :
                  results.los === 'E' ? 'bg-red-600' :
                  'bg-red-700'
                }`}>
                  <p className="text-sm font-semibold">Level of Service</p>
                  <p className="text-4xl font-bold">{results.los}</p>
                  <p className="text-sm mt-1">{results.losCategory}</p>
                </div>

                {/* CALCULATION SUMMARY */}
                <div className="space-y-3">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">Kapasitas (C)</span>
                    <span className="font-bold text-lg">
                      {results.capacity.toLocaleString()} smp/jam
                    </span>
                  </div>

                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">Volume (Q)</span>
                    <span className="font-bold text-lg">
                      {Math.round(results.volume).toLocaleString()} smp/jam
                    </span>
                  </div>

                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">Derajat Kejenuhan (DJ)</span>
                    <span className="font-bold text-lg text-orange-600">
                      {results.degree.toFixed(3)}
                    </span>
                  </div>
                </div>

                {/* FORMULA DISPLAY */}
                {results.formula && (
                  <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-xs text-gray-600 mb-1">Formula Kapasitas:</p>
                    <p className="font-mono text-sm text-blue-900">
                      {results.formula.equation}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">Formula Derajat Kejenuhan:</p>
                    <p className="font-mono text-sm text-blue-900">
                      {results.degreeFormula}
                    </p>
                  </div>
                )}

                {/* DESCRIPTION */}
                {results.losDescription && (
                  <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                    <p className="text-sm text-yellow-900">
                      <strong>Penjelasan:</strong> {results.losDescription}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CONCLUSION SECTION */}
        {detection.conclusion && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Kesimpulan</h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              {detection.conclusion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Perhitungan;
