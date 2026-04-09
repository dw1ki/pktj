import { useLocation } from "react-router-dom";

const imgLogoVector = "assets/vector.svg"

const pageNames = {
  "/dashboard": "Dashboard",
  "/deteksi": "Deteksi",
  "/perhitungan": "Perhitungan",
  "/realtime": "Real-time CCTV Monitoring",
  "/histori": "Histori",
  "/informasi": "Informasi Website",
  "/petunjuk": "Petunjuk Penggunaan",
  "/kelola-akun": "Kelola Akun",
  "/deteksi-video": "Deteksi Video",
};

export default function Header() {
  const location = useLocation();
  const pageName = pageNames[location.pathname] || "Dashboard";

  // Ambil nama user dari localStorage
  const userName = localStorage.getItem("userName") || "Pengguna";

  return (
    <header className="bg-white border-b border-[#e2e8f0] h-16 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Nama Halaman */}
      <h1
        className="text-black font-semibold"
        style={{
          fontFamily: "Poppins, sans-serif",
          fontWeight: 600,
          lineHeight: "1.2",
          fontSize: "20px",
        }}
      >
        {pageName}
      </h1>

      {/* Avatar + Nama User */}
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden">
          <img
            alt="User Avatar"
            className="w-full h-full object-cover"
            src={imgLogoVector}
          />
        </div>
        <div className="flex flex-col">
          <span
            className="text-black font-medium"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              lineHeight: "1.2",
              fontSize: "14px",
            }}
          >
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
