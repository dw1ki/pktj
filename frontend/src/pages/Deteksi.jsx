import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";

import Card from "../components/UI/Card";
import Table from "../components/UI/Table";

// ================= ICONS =================
const imgIconUpload =
  "upload.svg";
const imgIconPlay =
  "assets/icon-play.svg";

// ================= API URLs =================
const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, '');
const YOLO_API = API_URL.replace('backendyolo', 'yoloapi');

// ================= TABLE (defined in component) =================

export default function Deteksi() {
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(""); // Status message
  const [processingFrame, setProcessingFrame] = useState(null); // YOLO processing frame
  const [rows, setRows] = useState([]);
  const fileInputRef = useRef(null);
  const lastLoggedVideoUrlRef = useRef("");

  const latestRow = rows.length > 0 ? rows[rows.length - 1] : null;
  const processedVideoUrl = useMemo(() => {
    if (!latestRow?.outputVideoUrl) return null;

    const rawUrl = latestRow.outputVideoUrl;
    if (rawUrl.startsWith("http")) {
      return rawUrl;
    }

    if (rawUrl.startsWith("/")) {
      return `${API_URL}${rawUrl}`;
    }

    return `${API_URL}/${rawUrl}`;
  }, [latestRow?.outputVideoUrl]);

  useEffect(() => {
    if (!processedVideoUrl || lastLoggedVideoUrlRef.current === processedVideoUrl) return;
    console.log("📹 Final video URL to play:", processedVideoUrl);
    lastLoggedVideoUrlRef.current = processedVideoUrl;
  }, [processedVideoUrl]);

  // ================= SAVE TO DATABASE =================
  const handleSaveToDb = async (row) => {
    try {
      const token = localStorage.getItem("accessToken");
      const saveData = {
        video_url: row.cloudinaryUrl || `https://via-mock/${row.name}.mp4`,
        output_video_url: row.outputVideoUrl,
        video_name: row.name,
        total_vehicles: row.vehicles,
        avg_confidence: parseFloat(row.avgConfidence),
        duration: row.duration,
        frames: row.frames,
        detections: row.detections,
        // NEW: Per-lane vehicle breakdown
        summary: {
          totalVehicles: row.summary?.totalVehicles || row.vehicles || 0,
          carCount: row.summary?.carCount || 0,
          busCount: row.summary?.busCount || 0,
          truckCount: row.summary?.truckCount || 0,
          leftLaneCount: row.summary?.leftLaneCount || 0,
          rightLaneCount: row.summary?.rightLaneCount || 0,
          // NEW: Per-lane vehicle types
          leftLane: row.summary?.leftLane || { mobil: 0, bus: 0, truk: 0 },
          rightLane: row.summary?.rightLane || { mobil: 0, bus: 0, truk: 0 },
        }
      };

      console.log("💾 Saving to backend:", saveData);
        const res = await axios.post(
          `${API_URL}/api/detect`,
          saveData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            timeout: 10000
        }
      );

      console.log("✅ Data saved:", res.data);
      alert("✅ Data tersimpan! Bisa digunakan di halaman Perhitungan");
    } catch (err) {
      console.error("❌ Save error:", err.response?.data || err.message);
      alert(`Gagal menyimpan: ${err.response?.data?.message || err.message}`);
    }
  };

  // ================= TABLE COLUMNS =================
  const columns = [
    { key: "name", label: "Nama Video" },
    { key: "time", label: "Waktu Proses" },
    { key: "vehicles", label: "Total Kendaraan" },
    {
      key: "avgConfidence",
      label: "Avg Confidence",
      render: (v) => {
        const num = parseFloat(v) * 100;
        return `${num.toFixed(0)}%`;
      },
    },
    {
      key: "duration",
      label: "Durasi Video",
      render: (v) => {
        if (!v) return "0 menit";
        const minutes = Math.floor(v / 60);
        const seconds = v % 60;
        return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
      },
    },
    {
      key: "frames",
      label: "Total Frame",
      render: (v) => v || 0,
    },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
          {v}
        </span>
      ),
    },
    {
      key: "action",
      label: "Aksi",
      render: (_, row) => (
        <button
          onClick={() => handleSaveToDb(row)}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
        >
          Simpan
        </button>
      ),
    },
  ];

  // ================= UPLOAD TO BACKEND (LOCAL STORAGE) =================
  const uploadToCloudinary = async (file, token) => {
    try {
      console.log("📤 Uploading video to backend (local storage)...");
      
      const formData = new FormData();
      formData.append("video", file);
      
      const res = await axios.post(
        `${API_URL}/api/detect/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 600000, // 10 min for large videos
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const uploadProgress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setProgress(uploadProgress);
              if (uploadProgress % 10 === 0) {
                console.log(`📤 Upload progress: ${uploadProgress}%`);
              }
            }
          }
        }
      );
      
      console.log("✅ Upload successful, response:", res.data);
      return {
        cloudinaryUrl: res.data.data.videoUrl, // Local path from backend
        detectionId: res.data.data.id
      };
    } catch (err) {
      console.error("❌ Backend upload failed:", err.message);
      throw new Error(`Backend upload failed: ${err.message}`);
    }
  };

  // ================= GET VIDEO DURATION FROM METADATA =================
  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          const durationInSeconds = Math.round(video.duration);
          console.log("✅ Video duration from metadata:", durationInSeconds, "seconds");
          window.URL.revokeObjectURL(video.src);
          resolve(durationInSeconds);
        };
        video.onerror = () => {
          console.warn("⚠️ Could not read video duration, using fallback");
          window.URL.revokeObjectURL(video.src);
          resolve(0);
        };
        video.src = URL.createObjectURL(file);
      } catch (err) {
        console.warn("⚠️ Error getting video duration:", err.message);
        resolve(0);
      }
    });
  };

  // ================= PROCESS WITH YOLO =================
  const processWithYOLO = async (videoFile, fileName) => {
    try {
      console.log("🔄 Processing video dengan YOLO via job queue...");
      
      const token = localStorage.getItem("accessToken");
      console.log("🔑 Token from localStorage:", token ? `${token.substring(0, 20)}...` : "MISSING");
      if (!token) throw new Error("No authentication token - please login first");
      
      // ===== GET VIDEO DURATION FIRST =====
      setMessage("⏳ Reading video metadata...");
      const videoDuration = await getVideoDuration(videoFile);
      console.log("🎥 Video duration:", videoDuration, "seconds");
      
      // ===== PHASE 1: UPLOAD VIDEO (DIRECT) =====
      setProgress(0);
      setMessage("⏳ Uploading video...");
      
      let uploadRes;
      try {
        uploadRes = await uploadToCloudinary(videoFile, token);
      } catch (uploadErr) {
        console.error("❌ Upload failed:", uploadErr.message);
        throw new Error(`Upload failed: ${uploadErr.message}`);
      }
      
      console.log("✅ Upload successful, response:", uploadRes);
      
      // ===== PHASE 1.5: PROCESS WITH BACKEND =====
      setMessage("⏳ Starting YOLO processing...");
      
      let jobId;
      try {
        const processRes = await axios.post(
          `${API_URL}/api/detect/process`,
          {
            detectionId: uploadRes.detectionId,
            recordingInterval: "00:00:00",
            videoDuration: videoDuration || 0
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 120000  // ⭐ 2 minutes for job creation
          }
        );
        jobId = processRes.data.data?.id || processRes.data.jobId;
        console.log("✅ Processing started, jobId =", jobId);
      } catch (jobErr) {
        console.error("❌ Failed to start processing:", jobErr.message);
        throw new Error(`Failed to start processing: ${jobErr.message}`);
      }
      
      if (!jobId) {
        throw new Error("Backend did not return jobId");
      }
      
      // ===== PHASE 2: YOLO PROCESSING (0-100%) via Job Queue =====
      setProgress(0);
      setMessage("⏳ Processing with YOLO (may take several minutes)...");
      console.log(`📊 Job ID: ${jobId}, polling for result...`);
      
      // Poll job progress directly (SSE not supported by some browsers)
      const jobResult = await pollJobDirect(jobId, token);
      
      if (jobResult.status === 'failed') {
        const jobFailureMessage =
          jobResult.error ||
          jobResult.message ||
          jobResult.result?.error ||
          'Unknown error from backend';
        throw new Error(`YOLO job failed: ${jobFailureMessage}`);
      }

      if (jobResult.status !== 'completed') {
        throw new Error(`Unexpected job status: ${jobResult.status}`);
      }

      console.log("✅ YOLO Job complete! Result:", jobResult);
      
      // ⭐ DEBUG: Trace outputVideoUrl through response structure
      console.log("🔍 DEBUG jobResult structure:", {
        result_outputVideoUrl: jobResult.result?.outputVideoUrl,
        yoloResults_outputVideoUrl: jobResult.yoloResults?.outputVideoUrl,
        top_level_outputVideoUrl: jobResult.outputVideoUrl,
        result_keys: Object.keys(jobResult.result || {}),
      });
      
      // ===== PARSE JOB RESULT WITH SAFE TYPE CONVERSION =====
      const result = jobResult.result;
      if (!result) {
        throw new Error("Job completed but no result data");
      }
      
      // CRITICAL: Safe numeric conversion - handle strings, undefined, NaN
      const toNumber = (val, defaultVal = 0) => {
        if (val === null || val === undefined) return defaultVal;
        const num = Number(val);
        return isNaN(num) ? defaultVal : num;
      };
      
      const toFixed = (val, decimals = 2) => {
        return toNumber(val, 0).toFixed(decimals);
      };
      
      // 🔴 CRITICAL FIX: Use vehicle_count (NOT frames or total detections)
      // Normalize response - check multiple response formats
      let totalVehicles = 0;
      let framesProcessed = 0;
      let leftLaneCount = 0;
      let rightLaneCount = 0;
      
      // Format 1: New normalized format (preferred)
      if (result.vehicle_count !== undefined && result.frames_processed !== undefined) {
        totalVehicles = toNumber(result.vehicle_count, 0);
        framesProcessed = toNumber(result.frames_processed, 0);
        leftLaneCount = toNumber(result.lane?.kiri?.total, 0);
        rightLaneCount = toNumber(result.lane?.kanan?.total, 0);
        
        console.log(`✅ Using NEW format: ${totalVehicles} vehicles in ${framesProcessed} frames`);
      }
      // Format 2: Legacy format with summary
      else if (result.summary?.totalVehicles !== undefined) {
        totalVehicles = toNumber(result.summary.totalVehicles, 0);
        framesProcessed = toNumber(result.frames, 0);
        leftLaneCount = toNumber(result.summary.leftLaneCount, 0);
        rightLaneCount = toNumber(result.summary.rightLaneCount, 0);
        
        console.log(`✅ Using LEGACY format: ${totalVehicles} vehicles`);
      }
      // Format 3: Direct fields (from current backend)
      else {
        totalVehicles = toNumber(result.totalVehicles || result.vehicles || result.total, 0);
        framesProcessed = toNumber(result.frames, 0);
        leftLaneCount = toNumber(result.leftLaneCount || result.leftLane?.total, 0);
        rightLaneCount = toNumber(result.rightLaneCount || result.rightLane?.total, 0);
        
        console.log(`✅ Using DIRECT format: ${totalVehicles} vehicles`);
      }
      
      // 🔴 VALIDATION: Ensure vehicle_count !== frames
      if (totalVehicles === framesProcessed && framesProcessed > 100) {
        console.error(`❌ ERROR: totalVehicles (${totalVehicles}) === framesProcessed (${framesProcessed})`);
        console.error("This indicates a mapping error - vehicle_count was confused with frame count!");
        throw new Error(`Invalid mapping: vehicle_count should not equal frame count (${totalVehicles})`);
      }
      
      console.log(`📊 Final: ${totalVehicles} vehicles, ${framesProcessed} frames processed`);
      
      // Parse vehicle breakdown by type and lane
      let carCount = toNumber(result.carCount || result.summary?.carCount || result.lane?.kiri?.mobil || result.leftLane?.mobil || 0);
      let truckCount = toNumber(result.truckCount || result.summary?.truckCount || result.lane?.kiri?.truk || result.leftLane?.truk || 0);
      let busCount = toNumber(result.busCount || result.summary?.busCount || result.lane?.kiri?.bus || result.leftLane?.bus || 0);
      let confidence = toNumber(result.confidence || result.avgConfidence || result.summary?.confidence, 0.85);
      
      // NEW: Extract per-lane vehicle breakdown
      // Try multiple source formats
      let leftLaneMobil = toNumber(result.lane?.kiri?.mobil || result.leftLane?.mobil || result.leftLaneVehicles?.mobil || 0);
      let leftLaneBus = toNumber(result.lane?.kiri?.bus || result.leftLane?.bus || result.leftLaneVehicles?.bus || 0);
      let leftLaneTruk = toNumber(result.lane?.kiri?.truk || result.leftLane?.truk || result.leftLaneVehicles?.truk || 0);
      
      let rightLaneMobil = toNumber(result.lane?.kanan?.mobil || result.rightLane?.mobil || result.rightLaneVehicles?.mobil || 0);
      let rightLaneBus = toNumber(result.lane?.kanan?.bus || result.rightLane?.bus || result.rightLaneVehicles?.bus || 0);
      let rightLaneTruk = toNumber(result.lane?.kanan?.truk || result.rightLane?.truk || result.rightLaneVehicles?.truk || 0);
      
      // If no specific per-lane breakdown available, estimate from totals and lane counts
      if ((leftLaneMobil + leftLaneBus + leftLaneTruk === 0) && leftLaneCount > 0 && (carCount + busCount + truckCount) > 0) {
        const totalByType = carCount + busCount + truckCount;
        const ratioLeft = leftLaneCount / totalVehicles;
        leftLaneMobil = Math.round(carCount * ratioLeft);
        leftLaneBus = Math.round(busCount * ratioLeft);
        leftLaneTruk = Math.round(truckCount * ratioLeft);
        
        rightLaneMobil = carCount - leftLaneMobil;
        rightLaneBus = busCount - leftLaneBus;
        rightLaneTruk = truckCount - leftLaneTruk;
      }
      
      // If no specific counts, estimate from total
      if (carCount === 0 && busCount === 0 && truckCount === 0 && totalVehicles > 0) {
        carCount = Math.round(totalVehicles * 0.8);
        truckCount = Math.round(totalVehicles * 0.15);
        busCount = Math.round(totalVehicles * 0.05);
      }
      
      // If lanes not available, split by 50/50
      if (leftLaneCount === 0 && rightLaneCount === 0 && totalVehicles > 0) {
        leftLaneCount = Math.round(totalVehicles / 2);
        rightLaneCount = totalVehicles - leftLaneCount;
      }
      
      // CRITICAL FIX: Calculate total vehicles from lane counts, not from result.vehicle_count
      // Use actual lane data which is more reliable
      const correctTotalVehicles = leftLaneCount + rightLaneCount;
      console.log(`🔧 CORRECTED: Total vehicles = ${leftLaneCount} (left) + ${rightLaneCount} (right) = ${correctTotalVehicles}`);
      
      setProgress(100);
      setMessage("✅ Detection complete!");
      setProcessingFrame(null);
      
      return {
        name: fileName.replace(/\.[^/.]+$/, ""),
        cloudinaryUrl: uploadRes.cloudinaryUrl || result.videoUrl,
        outputVideoUrl: jobResult.outputVideoUrl || jobResult.result?.outputVideoUrl,  // ⭐ FIX: Use top-level outputVideoUrl
        vehicles: correctTotalVehicles,  // Use corrected total from lane counts!
        avgConfidence: toFixed(confidence, 2),
        duration: videoDuration || toNumber(result.duration, 0),  // Use actual video duration from metadata
        frames: framesProcessed,  // Total frames processed
        detections: [
          { 
            type: "Car", 
            count: carCount, 
            confidence: toFixed(confidence, 2)
          },
          { 
            type: "Truck", 
            count: truckCount, 
            confidence: toFixed(confidence, 2)
          },
          { 
            type: "Bus", 
            count: busCount, 
            confidence: toFixed(confidence, 2)
          }
        ],
        status: "Selesai",
        summary: {
          totalVehicles: correctTotalVehicles,  // Use corrected total from lane counts!
          carCount,
          truckCount,
          busCount,
          leftLaneCount,
          rightLaneCount,
          // NEW: Per-lane vehicle breakdown
          leftLane: {
            mobil: leftLaneMobil,
            bus: leftLaneBus,
            truk: leftLaneTruk,
          },
          rightLane: {
            mobil: rightLaneMobil,
            bus: rightLaneBus,
            truk: rightLaneTruk,
          }
        }
      };
      
    } catch (err) {
      console.error("❌ YOLO processing failed:", {
        message: err.message,
        status: err.response?.status,
        code: err.code,
        url: err.config?.url,
        method: err.config?.method,
        data: err.response?.data,
      });
      
      setProgress(100);
      
      let errorMsg = err.message;
      if (err.response?.data?.details) {
        errorMsg = err.response.data.details;
      }
      if (!errorMsg || /undefined/i.test(errorMsg)) {
        errorMsg = err.response?.data?.message || "YOLO processing failed";
      }
      
      console.error("🔴 Error to display:", errorMsg);
      throw new Error(errorMsg);
    }
  };

  // ================= POLL JOB PROGRESS =================
  /**
   * Poll job progress via HTTP GET dengan adaptive interval + keep-alive
   * ⭐ FIXED: For long-running jobs (1+ hour)
   * - Connection: keep-alive prevents ngrok tunnel from dropping
   * - Adaptive polling: starts at 1s, increases to 10s (reduces load)
   * - Retry logic: exponential backoff on network errors
   */
  const pollJobDirect = async (jobId, token) => {
    let lastProgress = 0;
    const maxAttempts = 7200; // 2 hours
    const maxPollingTime = 60 * 60 * 1000; // ⭐ INCREASED: 60 minute max total timeout (80MB video ~23% progress at 9min, needs ~40+ min total)
    const startTime = Date.now();
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 15; // Give up after 15 consecutive errors
    let pollingInterval = 2000; // ⭐ OPTIMIZED: Start at 2 seconds (from 1s) - first result usually takes 10+ seconds anyway

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // ⭐ NEW: Check total elapsed time
      const elapsedMs = Date.now() - startTime;
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      if (elapsedMs > maxPollingTime) {
        console.error(`🔴 POLLING TIMEOUT: Exceeded maximum polling time of ${maxPollingTime / 60000} minutes`);
        throw new Error(
          `Polling timeout: Video processing took longer than ${maxPollingTime / 60000} minutes. ` +
          `Job may still be processing. Job ID: ${jobId}`
        );
      }

      try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          consecutiveErrors++;
          setMessage("⚠️ Koneksi internet terputus, menunggu reconnect...");
          await sleep(3000);
          continue;
        }

        // Note: Connection: keep-alive is managed by browser/server automatically
        // Browsers refuse to set these headers directly via JavaScript (security policy)
        // Backend (server.js) sets socket.setKeepAlive(true) at transport level
        const res = await axios.get(
          `${API_URL}/api/detect/${jobId}/status`,
          {
            headers: { 
              Authorization: `Bearer ${token}`
            },
            timeout: 600000  // ← INCREASED: 10 minutes per request (large 360MB responses need time)
          }
        );

        const job = res.data;
        consecutiveErrors = 0; // Reset error counter on success

        // Update progress
        if (job.progress !== lastProgress) {
          setProgress(job.progress);
          setMessage(`⏳ ${job.message || 'Processing...'}`);
          lastProgress = job.progress;
          console.log(`📊 Poll ${attempt + 1} (${elapsedMinutes}m ${Math.floor((elapsedMs % 60000) / 1000)}s): ${job.progress}% - ${job.message}`);
        }

        // Check if done
        if (job.status !== 'processing') {
          console.log(`✅ Job ${job.status}:`, job);
          return job;
        }

        // ⭐ ADAPTIVE POLLING: Increase interval for long-running jobs
        // Start at 2s, gradually increase to 15s to reduce load on server/tunnel (from 10s max)
        const elapsedSeconds = attempt * (pollingInterval / 1000);
        if (elapsedSeconds > 300 && pollingInterval < 15000) { // After 5 min
          pollingInterval = Math.min(pollingInterval + 500, 15000); // Increase by 0.5s, max 15s
        }

        await sleep(pollingInterval);

      } catch (err) {
        consecutiveErrors++;
        const errorMsg = err.response?.status === 404 
          ? 'Job not found (404)'
          : err.code === 'ECONNABORTED'
          ? 'Request timeout'
          : err.message;

        // ⭐ NEW: Handle 503 (Service Unavailable) with special message
        if (err.response?.status === 503) {
          console.warn(
            `⚠️ YOLO API unavailable (503). Job might not have started. ` +
            `Retrying in backoff...`
          );
        }

        // Log every error for debugging
        console.warn(
          `⚠️ Poll attempt ${attempt + 1} failed (${consecutiveErrors}/${maxConsecutiveErrors}): ${errorMsg}`
        );

        // Give up after too many consecutive errors
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error(
            `🔴 Too many consecutive polling errors (${consecutiveErrors}). `
            + `Job might be stuck or backend unreachable.`
          );
          throw new Error(`Polling failed: ${consecutiveErrors} consecutive errors - ${errorMsg}`);
        }

        // ⭐ EXPONENTIAL BACKOFF: Wait longer after errors
        // 1st error: 2s, 2nd: 3s, 3rd: 4s, etc (up to 30s max)
        const backoffDelay = Math.min(1000 + (consecutiveErrors * 1000), 30000);
        console.log(`  ⏳ Retrying in ${backoffDelay}ms... (${elapsedMinutes}m elapsed)`);
        await sleep(backoffDelay);
      }
    }

    throw new Error(`Job polling timeout: Exceeded ${maxAttempts} attempts (>2 hours)`);
  };

  // ================= HANDLE VIDEO UPLOAD =================
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 500 * 1024 * 1024) { // 500MB
      alert("File terlalu besar. Maksimal 500MB");
      return;
    }

    // Validate file type
    const validTypes = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo"];
    if (!validTypes.includes(file.type)) {
      alert("Format video tidak didukung. Gunakan MP4, MPEG, MOV, atau AVI");
      return;
    }

    // Set preview immediately
    setVideoPreview(URL.createObjectURL(file));
    setVideoFile(file);
    setLoading(true);
    setProgress(10);

    try {
      // 1️⃣ Process dengan YOLO Railway API (direct file upload)
      setProgress(20);
      console.log("🔄 Processing dengan YOLO Railway API...");
      const result = await processWithYOLO(file, file.name);
      // Progress akan di-update oleh processWithYOLO (50-100)

      // 2️⃣ Add ke table
      setRows((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...result,
          time: new Date().toLocaleString(),
        },
      ]);

      console.log("✅ Detection complete! Result:", result);

      // Reset
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 1000);
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert(err.message);
      setLoading(false);
      setProgress(0);
    }
  };

  // ================= EXPORT CSV =================
  const handleExportCSV = () => {
    if (rows.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const headers = [
      "Nama Video", 
      "Waktu Proses", 
      "Total Kendaraan", 
      "Avg Confidence", 
      "Durasi (detik)", 
      "Durasi (HH:MM:SS)",
      "Interval Waktu",
      "Frame", 
      "Status",
      "Lajur Kiri Total",
      "Lajur Kiri Mobil",
      "Lajur Kiri Bus",
      "Lajur Kiri Truk",
      "Lajur Kanan Total",
      "Lajur Kanan Mobil",
      "Lajur Kanan Bus",
      "Lajur Kanan Truk"
    ];
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => {
        const summary = row.summary || {};
        const leftLane = summary.leftLane || { mobil: 0, bus: 0, truk: 0 };
        const rightLane = summary.rightLane || { mobil: 0, bus: 0, truk: 0 };
        
        // Format durasi ke HH:MM:SS
        const duration = parseInt(row.duration) || 0;
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        const durationFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Generate interval waktu (misal dari 00:00:00 ke durasi)
        const intervalWaktu = `00:00:00-${durationFormatted}`;
        
        return [
          row.name,
          row.time,
          row.vehicles,
          row.avgConfidence,
          duration,
          durationFormatted,
          intervalWaktu,
          row.frames,
          row.status,
          summary.leftLaneCount || 0,
          leftLane.mobil || 0,
          leftLane.bus || 0,
          leftLane.truk || 0,
          summary.rightLaneCount || 0,
          rightLane.mobil || 0,
          rightLane.bus || 0,
          rightLane.truk || 0
        ]
          .map((v) => `"${v}"`)
          .join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deteksi_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ================= UI =================
  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <div className="flex justify-center">
        <label className="cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
            disabled={loading}
          />
          <div className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors duration-200 cursor-pointer">
            <img src="assets/upload.svg" alt="Upload Icon" />
            UPLOAD VIDEO
          </div>
        </label>
      </div>

      {/* Progress */}
      {loading && (
        <div className="max-w-md mx-auto bg-white border border-blue-200 rounded-lg p-6">
          <p className="text-center text-sm text-gray-600 mb-3 font-semibold">
            ⏳ {message || "Processing..."}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">{progress}%</p>
        </div>
      )}

      {/* Video Review Section - Upload + Processed */}
      <Card className="!p-0">
        <div className="p-6 border-b">
          <h3 className="font-semibold">🎬 Video Review</h3>
        </div>
        <div className="p-6 bg-gray-50 grid grid-cols-2 gap-6">
          {/* Left: Original Upload */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">📹 Video Upload</h4>
            {videoPreview ? (
              <video
                src={videoPreview}
                controls
                className="w-full h-80 bg-black rounded-lg object-cover"
              />
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-gray-400 gap-2 border-2 border-dashed rounded-lg">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>Belum ada video</p>
              </div>
            )}
          </div>
          
          {/* Right: Processed Video with Annotations */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">✨ Video Deteksi (dengan Anotasi)</h4>
            {processedVideoUrl ? (
              <div>
                {/* Backend video streaming (local storage) */}
                <>
                  <video
                    key={processedVideoUrl}
                    src={processedVideoUrl}
                    controls
                    controlsList="nodownload"
                    className="w-full h-80 bg-black rounded-lg"
                    style={{ objectFit: 'contain' }}
                    onError={(e) => {
                      console.error("❌ Video load error:", {
                        url: processedVideoUrl,
                        error: e.target?.error,
                      });
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1 break-all">URL: {processedVideoUrl}</p>
                </>
              </div>
            ) : processingFrame ? (
              <div>
                <img 
                  src={processingFrame} 
                  alt="YOLO processing frame" 
                  className="w-full h-80 bg-black rounded-lg object-cover"
                  onError={() => setProcessingFrame(null)}
                />
                <p className="text-xs text-blue-600 mt-2 font-semibold">📸 Live Processing...</p>
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-gray-400 gap-2 border-2 border-dashed rounded-lg">
                <p>Belum ada hasil deteksi</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Summary Results (Latest Detection) */}
      {rows.length > 0 && (
        <Card className="!p-0 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="p-6 border-b border-blue-200">
            <h3 className="font-semibold text-blue-900">📊 Ringkasan Hasil Terakhir</h3>
          </div>
          <div className="p-6">
            {(() => {
              const latest = rows[rows.length - 1];
              const summary = latest.summary || {
                totalVehicles: latest.vehicles || 0,
                carCount: 0,
                busCount: 0,
                truckCount: 0,
                leftLaneCount: 0,
                rightLaneCount: 0,
                leftLane: { mobil: 0, bus: 0, truk: 0 },
                rightLane: { mobil: 0, bus: 0, truk: 0 }
              };
              
              // ⭐ FIX: Recalculate totalVehicles from lane counts to ensure correctness
              // This overrides any incorrect value from API/database
              const correctTotalVehicles = (summary?.leftLaneCount || 0) + (summary?.rightLaneCount || 0);
              
              return (
                <div className="space-y-4">
                  {/* Top Row: Total, Left Lane, Right Lane */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded p-4 border-2 border-blue-300">
                      <p className="text-xs text-gray-600 font-semibold">Total Kendaraan</p>
                      <p className="text-3xl font-bold text-blue-600">{correctTotalVehicles}</p>
                    </div>
                    
                    <div className="bg-white rounded p-4 border-2 border-purple-300">
                      <p className="text-xs text-gray-600 font-semibold">Lajur Kiri</p>
                      <p className="text-3xl font-bold text-purple-600">{summary.leftLaneCount || 0}</p>
                    </div>
                    
                    <div className="bg-white rounded p-4 border-2 border-orange-300">
                      <p className="text-xs text-gray-600 font-semibold">Lajur Kanan</p>
                      <p className="text-3xl font-bold text-orange-600">{summary.rightLaneCount || 0}</p>
                    </div>
                  </div>
                  
                  {/* Per-Lane Vehicle Breakdown */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Lajur Kiri */}
                    <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-300">
                      <h4 className="font-semibold text-purple-900 mb-3">🚗 Lajur Kiri</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Mobil</span>
                          <span className="font-semibold text-green-600">{summary.leftLane?.mobil || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Bus</span>
                          <span className="font-semibold text-red-600">{summary.leftLane?.bus || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Truk</span>
                          <span className="font-semibold text-yellow-600">{summary.leftLane?.truk || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Lajur Kanan */}
                    <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-300">
                      <h4 className="font-semibold text-orange-900 mb-3">🚗 Lajur Kanan</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Mobil</span>
                          <span className="font-semibold text-green-600">{summary.rightLane?.mobil || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Bus</span>
                          <span className="font-semibold text-red-600">{summary.rightLane?.bus || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Truk</span>
                          <span className="font-semibold text-yellow-600">{summary.rightLane?.truk || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </Card>
      )}

      {/* Result Table */}
      <Card className="!p-0">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="font-semibold">Hasil Deteksi</h3>
          {rows.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <img src="assets/csv.svg" alt="CSV Icon" className="w-5 h-5" /> Export CSV
            </button>
          )}
        </div>
        <div className="p-6">
          {rows.length === 0 ? (
            <p className="text-center text-gray-500">Belum ada hasil deteksi</p>
          ) : (
            <Table columns={columns} data={rows} />
          )}
        </div>
      </Card>
    </div>
  );
}

Deteksi.propTypes = {
  onLogout: PropTypes.func,
};
