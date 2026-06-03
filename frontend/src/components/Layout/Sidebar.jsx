import { NavLink, useLocation, useNavigate } from 'react-router-dom'

const imgLogoPktjSmall = '/assets/logo-pktj-sidebar.png'
const imgDashboard = '/assets/dashboard.svg'
const imgDeteksi = '/assets/search.svg'
const imgPerhitungan = '/assets/calc.svg'
const imgHistori = '/assets/history.svg'
const imgInformasi = '/assets/info.svg'
const imgPetunjuk = '/assets/book.svg'
const imgKelolaAkun = '/assets/account.svg'
const imgLogout = '/assets/logout.svg'
const imgRealtime = '/assets/cctv.svg'


/**
 * KONFIGURASI MENU BERDASARKAN ROLE
 */
const menuItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: imgDashboard,
    roles: ['admin', 'user'],
  },
  {
    name: 'Deteksi',
    path: '/deteksi',
    icon: imgDeteksi,
    roles: ['admin', 'user'],
  },
  {
    name: 'Perhitungan',
    path: '/perhitungan',
    icon: imgPerhitungan,
    roles: ['admin', 'user'],
  },
  {
    name: 'Real-time CCTV',
    path: '/realtime',
    icon: imgRealtime,
    roles: ['admin', 'user'],
  },
  {
    name: 'Histori',
    path: '/histori',
    icon: imgHistori,
    roles: ['admin', 'user'],
  },
  {
    name: 'Informasi Website',
    path: '/informasi',
    icon: imgInformasi,
    roles: ['admin', 'user'],
  },
  {
    name: 'Petunjuk',
    path: '/petunjuk',
    icon: imgPetunjuk,
    roles: ['admin', 'user'],
  },
  {
    name: 'Kelola Akun',
    path: '/kelola-akun',
    icon: imgKelolaAkun,
    roles: ['admin'],
  },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  // Ambil user dari localStorage
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="bg-white flex flex-col items-center w-[320px] h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Brand */}
      <div className="flex gap-2 items-center justify-center px-8 py-4 w-full shrink-0">
        <img
          alt="Logo PKTJ"
          className="w-[35px] h-[35px] object-contain"
          src={imgLogoPktjSmall}
        />
        <h1
          className="text-black font-semibold whitespace-nowrap"
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '20px',
          }}
        >
          Kinerja Ruas Jalan
        </h1>
      </div>

      {/* Menu */}
      <nav className="flex flex-col items-center p-6 w-full gap-1">
        {menuItems
          .filter(item => item.roles.includes(user?.role))
          .map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex gap-2 items-center p-4 rounded-lg w-[240px] transition-all ${
                  isActive ? 'bg-[#2563eb]' : 'hover:bg-gray-100'
                }`
              }
              style={({ isActive }) => ({
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 500,
                fontSize: '16px',
                color: isActive ? '#ffffff' : '#000000',
              })}
            >
              {({ isActive }) => (
                <>
                  <img
                    alt={item.name}
                    className="w-6 h-6 object-contain"
                    src={item.icon}
                    style={{
                      filter: isActive
                        ? 'brightness(0) invert(1)'
                        : 'brightness(0.6)',
                    }}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
      </nav>

      {/* Logout */}
      <div className="flex flex-col items-center p-6 w-full mt-auto border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex gap-2 items-center p-4 rounded-lg w-[240px] text-white transition-all"
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '16px',
            backgroundColor: '#dc2626',
          }}
        >
          <img
            alt="Logout"
            className="w-6 h-6"
            src={imgLogout}
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
