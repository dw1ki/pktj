import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

// Fixed API endpoint paths: /auth -> /api/auth
export default function Login() {
  const navigate = useNavigate()
  const { login, error: authError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [buttonHover, setButtonHover] = useState(false)
  const [adminHover, setAdminHover] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email dan password wajib diisi')
      return
    }

    try {
      setLoading(true)
      const result = await login(email, password)

      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#f7f7f7] relative w-full h-screen overflow-hidden">
      <div className="flex h-screen w-full">
        {/* Left Section - Blue Gradient */}
        <div className="bg-gradient-to-r from-[#2563eb] to-[#1e3a8a] flex flex-1 flex-col justify-between items-center text-white" style={{ padding: '56px' }}>
          {/* Main Content */}
          <div className="flex flex-col w-full items-start">
            {/* Brand */}
            <div className="flex gap-4 items-center w-full" style={{ paddingBottom: '8px' }}>
              <img
                alt="Logo PKTJ"
                className="shrink-0"
                style={{ width: '61px', height: '61px', objectFit: 'cover' }}
                src="/assets/logo-login.png"
              />
              <h1 className="text-white font-bold" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '32px', fontWeight: 700, lineHeight: '1.2' }}>
                KINERJA RUAS JALAN
              </h1>
            </div>

            {/* Title Section */}
            <div className="flex flex-col w-full" style={{ gap: '24px', paddingTop: '72px', paddingBottom: '32px' }}>
              <h2 className="text-white font-bold" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '32px', fontWeight: 700, lineHeight: '1.2' }}>
                Cerdas Hitung Kendaraan<br/>pada Jalan Tol
              </h2>
              <p className="text-white font-medium" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: 500, lineHeight: '1.4' }}>
                Sistem Perhitungan untuk memantau jumlah<br/>kendaraan secara otomatis dan akurat.
              </p>
            </div>

            {/* Stats */}
            <div className="flex w-full" style={{ gap: '96px', paddingTop: '32px', paddingBottom: '32px' }}>
              <div className="flex flex-col">
                <p className="text-white font-bold" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '32px', fontWeight: 700, lineHeight: '1.2' }}>
                  YOLO V8
                </p>
                <p className="text-white font-medium" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: 500, lineHeight: '1.4' }}>
                  Teknologi Mutakhir
                </p>
              </div>
              <div className="flex flex-col">
                <p className="text-white font-bold" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '32px', fontWeight: 700, lineHeight: '1.2' }}>
                  99%
                </p>
                <p className="text-white font-medium" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: 500, lineHeight: '1.4' }}>
                  Uptime
                </p>
              </div>
              <div className="flex flex-col">
                <p className="text-white font-bold" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '32px', fontWeight: 700, lineHeight: '1.2' }}>
                  90%
                </p>
                <p className="text-white font-medium" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: 500, lineHeight: '1.4' }}>
                  Accurate
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex w-full" style={{ paddingTop: '56px', paddingBottom: '8px' }}>
            <p className="text-white font-regular" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '1.4', maxWidth: '560px' }}>
              © 2025 Politeknik Keselamatan Transportasi Jalan. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="bg-[#f7f7f7] flex flex-1 flex-col items-center justify-center" style={{ padding: '56px' }}>
          {/* Login Card */}
          <div className="bg-white rounded-[24px] flex flex-col items-center" style={{ padding: '40px 32px', boxShadow: '0px 4px 4px 0px rgba(0,0,0,0.25)', width: '100%', maxWidth: '456px' }}>
            {/* Header */}
            <div className="flex flex-col gap-2 items-center text-center w-full" style={{ paddingBottom: '8px' }}>
              <h2 className="text-black font-semibold" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px', fontWeight: 600, lineHeight: '1.2' }}>
                Selamat Datang!
              </h2>
              <p className="text-black font-regular" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '1.4' }}>
                Masuk ke akun Anda untuk melanjutkan
              </p>
            </div>

            {/* Error Message */}
            {(error || authError) && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 w-full rounded" style={{ marginTop: '16px' }}>
                <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>
                  {error || authError}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col w-full" style={{ gap: '8px', paddingTop: '8px' }}>
              {/* Email Field */}
              <div className="flex flex-col w-full" style={{ gap: '8px', paddingBottom: '8px' }}>
                <label className="text-black font-medium" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 500, lineHeight: '1.4' }}>
                  Email
                </label>
                <div
                  className="bg-white border-2 rounded-[8px] flex items-center relative w-full"
                  style={{
                    gap: '16px',
                    padding: '16px',
                    boxShadow: '0px 2px 2px 0px rgba(0,0,0,0.15)',
                    borderColor: emailFocused ? '#2563eb' : '#f7f7f7',
                    transition: 'border-color 0.3s ease',
                  }}
                >
                  <img alt="Email Icon" className="shrink-0" style={{ width: '15px', height: '15px', objectFit: 'cover' }} src="/assets/vector-decoration-1.svg" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="flex-1 bg-transparent text-black outline-none font-regular"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '1.4',
                      color: email ? '#000' : '#8a8a8a',
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col w-full" style={{ gap: '8px', paddingBottom: '8px' }}>
                <label className="text-black font-medium" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 500, lineHeight: '1.4' }}>
                  Password
                </label>
                <div
                  className="bg-white border-2 rounded-[8px] flex items-center relative w-full"
                  style={{
                    gap: '16px',
                    padding: '16px',
                    boxShadow: '0px 2px 2px 0px rgba(0,0,0,0.15)',
                    borderColor: passwordFocused ? '#2563eb' : '#f7f7f7',
                    transition: 'border-color 0.3s ease',
                  }}
                >
                  <img alt="Password Icon" className="shrink-0" style={{ width: '12px', height: '15px', objectFit: 'contain' }} src="/assets/vector-decoration-2.svg" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent text-black outline-none font-regular"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '1.4',
                      color: password ? '#000' : '#8a8a8a',
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="text-white text-center rounded-[8px] w-full border-0 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '1.4',
                  padding: '16px',
                  marginTop: '8px',
                  boxShadow: '0px 3px 3px 0px rgba(0,0,0,0.2)',
                  backgroundColor: buttonHover && !loading ? '#1d4ed8' : '#2563eb',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseEnter={() => setButtonHover(true)}
                onMouseLeave={() => setButtonHover(false)}
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

            {/* Footer Section */}
            <div className="flex flex-wrap gap-1 items-center justify-center w-full" style={{ paddingTop: '8px', marginTop: '8px', height: '32px' }}>
              <span className="text-black font-regular whitespace-nowrap" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '1.4' }}>
                Belum punya akun?
              </span>
              <span className="text-black font-regular whitespace-nowrap" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '1.4' }}>
                Lupa password?
              </span>
              <a
                href="https://wa.me/628811310300"
                className="flex gap-1 items-center"
                style={{ textDecoration: adminHover ? 'underline' : 'none', transition: 'text-decoration 0.3s ease', cursor: 'pointer' }}
                onMouseEnter={() => setAdminHover(true)}
                onMouseLeave={() => setAdminHover(false)}
              >
                <span className="font-regular whitespace-nowrap" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '1.4', color: '#10b981' }}>
                  Hubungi Admin
                </span>
                <img alt="Arrow Icon" className="shrink-0" style={{ width: '14px', height: '14px', objectFit: 'contain' }} src="/assets/vector-decoration-3.svg" />
              </a>
              <span className="text-black font-regular" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '1.4' }}>
                .
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

