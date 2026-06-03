import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import PrivateRoute from './components/PrivateRoute'
import { AuthProvider } from './context/AuthContext'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Deteksi from './pages/Deteksi'
import Perhitungan from './pages/Perhitungan'
import Histori from './pages/Histori'
import HistoriDetail from './pages/HistoriDetail'
import InformasiWebsite from './pages/InformasiWebsite'
import PetunjukPenggunaan from './pages/PetunjukPenggunaan'
import VideoDetection from "./pages/VideoDetection"
import RealtimeMonitoring from './pages/RealtimeMonitoring'
import KelolaAkun from './pages/KelolaAkun'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />

        {/* Semua halaman dengan layout */}
        <Route path="/dashboard" element={
          <PrivateRoute allowedRoles={["admin", "user"]}>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/deteksi" element={
          <PrivateRoute allowedRoles={["admin", "user"]}>
            <Layout><Deteksi /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/perhitungan" element={
          <PrivateRoute allowedRoles={["admin", "user"]}>
            <Layout><Perhitungan /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/histori" element={
          <PrivateRoute allowedRoles={["admin", "user"]}>
            <Layout><Histori /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/histori/:id" element={
          <PrivateRoute allowedRoles={["admin", "user"]}>
            <Layout><HistoriDetail /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/informasi" element={
          <PrivateRoute allowedRoles={["admin", "user"]}>
            <Layout><InformasiWebsite /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/petunjuk" element={
          <PrivateRoute allowedRoles={["admin", "user"]}>
            <Layout><PetunjukPenggunaan /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/deteksi-video" element={
          <PrivateRoute allowedRoles={["admin", "user"]}>
            <Layout><VideoDetection /></Layout>
          </PrivateRoute>
        } />

        <Route path="/realtime" element={
          <PrivateRoute allowedRoles={["admin", "user"]}>
            <Layout><RealtimeMonitoring /></Layout>
          </PrivateRoute>
        } />

        {/* Hanya admin bisa akses Kelola Akun */}
        <Route path="/kelola-akun" element={
          <PrivateRoute allowedRoles={["admin"]}>
            <Layout><KelolaAkun /></Layout>
          </PrivateRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}

// Force rebuild Tue 13 Jan 2026 11:34:41 PM WIB
