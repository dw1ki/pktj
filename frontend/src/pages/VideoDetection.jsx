import { useState } from "react";
import axios from "axios";

const YOLO_API = import.meta.env.VITE_YOLO_API_URL || "http://127.0.0.1:8000";

export default function VideoDetection() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPath, setVideoPath] = useState("");
  const [jobResult, setJobResult] = useState(null);
  const [capacityResult, setCapacityResult] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", videoFile);
    const res = await axios.post(`${YOLO_API}/upload`, formData);
    setVideoPath(res.data.video_path);
  };

  const handleDetect = async () => {
    const res = await axios.post(`${YOLO_API}/detect`, { video_path: videoPath });
    setJobResult(res.data);
  };

  const handleExportCSV = async () => {
    const res = await axios.post(`${YOLO_API}/export_csv`, { video_path: videoPath });
    window.open(`${YOLO_API}/video/${res.data.csv_file.split("/").pop()}`);
  };

  const handleCalculate = async () => {
    const res = await axios.post(`${YOLO_API}/calculate`, {
      kiri_total: jobResult.result.kiri.total,
      kanan_total: jobResult.result.kanan.total,
      n_lanes: 2, // contoh jumlah lajur
      c0: 1800,   // kapasitas dasar
      fcle: 1.0,  // faktor koreksi
    });
    setCapacityResult(res.data);
  };

  return (
    <div>
      <h2>Deteksi Video</h2>
      <input type="file" onChange={(e) => setVideoFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>

      {videoPath && (
        <div>
          <video src={`${YOLO_API}/video/${videoPath.split("/").pop()}`} controls width={600} />
          <button onClick={handleDetect}>Proses Deteksi</button>
        </div>
      )}

      {jobResult && jobResult.status === "done" && (
        <div>
          <h3>Hasil Counting</h3>
          <pre>{JSON.stringify(jobResult.result, null, 2)}</pre>
          <button onClick={handleExportCSV}>Export CSV</button>
          <button onClick={handleCalculate}>Hitung Kapasitas</button>
        </div>
      )}

      {capacityResult && (
        <div>
          <h3>Hasil Kapasitas</h3>
          <pre>{JSON.stringify(capacityResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
