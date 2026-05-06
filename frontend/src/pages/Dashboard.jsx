import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getDashboard } from '../services/dashboardService'


const imgImage = 'https://www.figma.com/api/mcp/asset/b95c3451-d796-4d94-a410-d003a2bb8d9f'
const imgImage1 = 'https://www.figma.com/api/mcp/asset/7d8fb77f-5356-493b-9748-c3846bf7c228'
const imgEllipse1 = 'https://www.figma.com/api/mcp/asset/feb77404-aec5-4e18-851c-bb2fde2b41fa'
const imgLine2 = 'https://www.figma.com/api/mcp/asset/aa717fc7-88ef-4017-8e21-978b11d231dd'
const imgGroup = 'https://www.figma.com/api/mcp/asset/431e208d-42bf-437c-a8f2-88cfd6e3f029'
const imgGroup1 = 'https://www.figma.com/api/mcp/asset/10d2579c-4db9-480e-82cd-a5d141cf9173'
const imgGroup2 = 'https://www.figma.com/api/mcp/asset/8e9ebec2-0990-4c6b-842b-b493be5ebd3d'
const imgGroup3 = 'https://www.figma.com/api/mcp/asset/47b7c3b6-ac26-4283-9b47-1ce77ea35d85'
const imgGroup4 = 'https://www.figma.com/api/mcp/asset/33045c8c-cf60-416a-b288-ce1d33e57b22'

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [hasData, setHasData] = useState(false)
  const [losChartData, setLosChartData] = useState([])
  const [lineChartData, setLineChartData] = useState([])
  const [volumeChartData, setVolumeChartData] = useState([])
  const [allRoads, setAllRoads] = useState([])
  const [selectedRoad, setSelectedRoad] = useState('')
  const [totalVehicles, setTotalVehicles] = useState(0)
  const [highestLos, setHighestLos] = useState('-')
  const [avgDj, setAvgDj] = useState(0)
  const [totalAnalysis, setTotalAnalysis] = useState(0)
  const [allDates, setAllDates] = useState([])
  const [selectedDate, setSelectedDate] = useState('all')

  useEffect(() => {
    getDashboard().then((data) => {
      console.log('Dashboard data loaded:', data)
      setDashboardData(data)
      setHasData(true)
    })

    // Fetch history data for charts
    const fetchHistoryData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, '');
        const res = await fetch(`${API_URL}/api/histori`)
        if (!res.ok) throw new Error('Failed to fetch history')
        
        const data = await res.json()
        const historyData = data.data || []

        // DEBUG: Log sample data
        console.log('Raw history data:', historyData)
        if (historyData.length > 0) {
          console.log('Sample data item:', historyData[0])
        }

        // Extract unique dates from history data
        const uniqueDates = [...new Set(historyData.map(item => {
          if (item.createdAt) {
            return new Date(item.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')
          }
          return null
        }).filter(Boolean))].sort().reverse()
        
        setAllDates(uniqueDates)

        // Filter data based on selected date
        let filteredData = historyData
        if (selectedDate !== 'all' && selectedDate) {
          filteredData = historyData.filter(item => {
            if (item.createdAt) {
              const itemDate = new Date(item.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')
              return itemDate === selectedDate
            }
            return false
          })
        }

        // Filter data based on selected road
        if (selectedRoad && selectedRoad !== '') {
          filteredData = filteredData.filter(item => item.namaRuas === selectedRoad)
        }

        // Set total analysis count
        setTotalAnalysis(filteredData.length)

        // Calculate total vehicles
        const total = filteredData.reduce((sum, item) => sum + (item.mobil || 0) + (item.bus || 0) + (item.truk || 0), 0)
        setTotalVehicles(total)

        // Calculate average DJ
        const avgDJ = filteredData.length > 0 
          ? (filteredData.reduce((sum, item) => sum + (item.dj || 0), 0) / filteredData.length).toFixed(3)
          : 0
        setAvgDj(avgDJ)

        // Get unique roads
        const uniqueRoads = [...new Set(filteredData.map(item => item.namaRuas).filter(Boolean))]
        setAllRoads(uniqueRoads)
        if (uniqueRoads.length > 0 && !selectedRoad) {
          setSelectedRoad(uniqueRoads[0])
        }

        // Process LOS count for pie chart
        const losCount = {}
        const losTimeline = {}
        const losPriority = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5 }
        
        filteredData.forEach(item => {
          const los = item.levelPelayanan || '-'
          losCount[los] = (losCount[los] || 0) + 1

          // Group by time for timeline
          const time = item.intervalWaktu ? item.intervalWaktu.split('-')[0] : '00:00'
          if (!losTimeline[time]) {
            losTimeline[time] = []
          }
          losTimeline[time].push({ los, dj: item.dj || 0 })
        })

        // Get highest LOS (worst)
        const highestLosByPriority = Object.keys(losCount).sort((a, b) => 
          (losPriority[b] || 99) - (losPriority[a] || 99)
        )[0]
        setHighestLos(highestLosByPriority || '-')

        // Create pie chart data
        const losColors = { 'A': '#8b5cf6', 'B': '#60a5fa', 'C': '#059669', 'D': '#eab308', 'E': '#fb923c', 'F': '#ef4444' }
        const pieData = Object.entries(losCount).map(([los, count]) => ({
          name: `LOS ${los}`,
          value: count,
          fill: losColors[los] || '#999'
        }))
        setLosChartData(pieData)

        // Create line chart data - highest LOS per time slot
        const timelineData = Object.entries(losTimeline)
          .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
          .map(([time, items]) => {
            // Get highest priority (worst) LOS for this time
            const worstLos = items.reduce((prev, curr) => 
              losPriority[curr.los] > losPriority[prev.los] ? curr : prev
            )
            return {
              time,
              los: worstLos.los,
              dj: (items.reduce((sum, i) => sum + i.dj, 0) / items.length).toFixed(3)
            }
          })
        setLineChartData(timelineData)

        // Create volume kendaraan chart data grouped by time with separate lanes
        const volumeByTime = {}
        let kiriTotal = 0, kananTotal = 0, kiriCount = 0, kananCount = 0
        
        filteredData.forEach((item, idx) => {
          const time = item.intervalWaktu || 'Unknown'
          const lajur = (item.lajur || 'Kiri').trim() // Trim whitespace
          const dj = parseFloat(item.dj) || 0
          const volume = parseInt(item.volume) || 0
          
          // DEBUG
          if (idx < 3) console.log(`Item ${idx}:`, { time, lajur, dj, volume })
          
          if (!volumeByTime[time]) {
            volumeByTime[time] = { time, djKiri: 0, djKanan: 0, volumeKiri: 0, volumeKanan: 0, kiriCount: 0, kananCount: 0 }
          }
          
          if (lajur === 'Kiri') {
            volumeByTime[time].djKiri += dj
            volumeByTime[time].volumeKiri += volume
            volumeByTime[time].kiriCount += 1
            kiriTotal += dj
            kiriCount += 1
          } else if (lajur === 'Kanan') {
            volumeByTime[time].djKanan += dj
            volumeByTime[time].volumeKanan += volume
            volumeByTime[time].kananCount += 1
            kananTotal += dj
            kananCount += 1
          }
        })
        
        console.log('Summary - Kiri total DJ:', kiriTotal, 'count:', kiriCount, 'avg:', kiriCount > 0 ? (kiriTotal/kiriCount).toFixed(3) : 0)
        console.log('Summary - Kanan total DJ:', kananTotal, 'count:', kananCount, 'avg:', kananCount > 0 ? (kananTotal/kananCount).toFixed(3) : 0)
        
        // Average the DJ values
        const volumeData = Object.values(volumeByTime).map(item => ({
          time: item.time,
          djKiri: item.kiriCount > 0 ? parseFloat((item.djKiri / item.kiriCount).toFixed(3)) : 0,
          djKanan: item.kananCount > 0 ? parseFloat((item.djKanan / item.kananCount).toFixed(3)) : 0,
          volumeKiri: item.volumeKiri,
          volumeKanan: item.volumeKanan
        })).sort((a, b) => a.time.localeCompare(b.time))
        
        console.log('Volume by time grouped:', volumeByTime)
        console.log('Final volume chart data:', volumeData)
        console.log('Filtered data length:', filteredData.length)
        
        setVolumeChartData(volumeData)
      } catch (err) {
        console.error('Error fetching history:', err)
      }
    }

    fetchHistoryData()
  }, [selectedRoad, selectedDate])

  return (
    <div className="flex flex-col gap-6 items-start justify-start relative w-full">
      {/* Date Filter Section */}
      <div className="w-full flex justify-end gap-3">
        <button 
          onClick={() => setSelectedDate('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedDate === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Semua Tanggal
        </button>
        <input
          type="date"
          value={selectedDate !== 'all' ? selectedDate : ''}
          onChange={(e) => {
            if (e.target.value) {
              setSelectedDate(e.target.value)
            }
          }}
          className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
          style={{ minWidth: '160px' }}
        />
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-3 gap-6 relative w-full">
        {/* Card 1: Total Kinerja Ruas */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-10 flex flex-col items-start justify-start relative h-[360px]">
          <div className="flex items-center justify-between relative w-full">
            <div className="flex flex-col gap-1 items-start">
              <p className="text-sm font-medium text-gray-500" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '1.4' }}>
                Total Kinerja Ruas
              </p>
              <p className="text-4xl font-bold text-black">
                {allRoads.length}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <img alt="Traffic Icon" src="assets/ruas.svg" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            </div>
          </div>
        </div>

        {/* Card 2: Total Traffic Counter */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-10 flex flex-col items-start justify-start relative h-[360px]">
          <div className="flex items-center justify-between relative w-full">
            <div className="flex flex-col gap-1 items-start">
              <p className="text-sm font-medium text-gray-500" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '1.4' }}>
                Total Traffic Counter
              </p>
              <p className="text-4xl font-bold text-black">
                {totalVehicles}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <img alt="Traffic Icon" src="assets/traffic.svg" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            </div>
          </div>
        </div>

        {/* Card 3: Data LOS Donut Chart */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-10 flex flex-col gap-3 items-center justify-between relative h-[360px] overflow-visible">
          <div className="flex items-center justify-center relative w-full">
            <p className="text-xl font-semibold text-gray-600" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '20px', lineHeight: '1.2' }}>
              Data LOS
            </p>
          </div>

          {/* Pie Chart with percentages inside */}
          <div className="flex items-center justify-center relative w-full flex-1">
            {losChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
                  <Pie
                    data={losChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={100}
                    paddingAngle={1}
                    dataKey="value"
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                      // Jika hanya ada 1 data (100%), taruh label di dalam lingkaran atas
                      if (losChartData.length === 1) {
                        return (
                          <text 
                            x={cx} 
                            y={cy - 10} 
                            textAnchor="middle" 
                            dominantBaseline="central"
                            style={{ 
                              fontSize: '14px', 
                              fontWeight: '700',
                              fill: '#374151'
                            }}
                          >
                            100.0%
                          </text>
                        );
                      }
                      // Jika data terbagi, taruh label di tengah setiap segmen
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text 
                          x={x} 
                          y={y} 
                          textAnchor="middle" 
                          dominantBaseline="central"
                          style={{ 
                            fontSize: '12px', 
                            fontWeight: '700',
                            fill: '#ffffff'
                          }}
                        >
                          {`${(percent * 100).toFixed(1)}%`}
                        </text>
                      );
                    }}
                  >
                    {losChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm">No data</p>
            )}
          </div>

          {/* LOS Scale A-F */}
          <div className="w-full pt-1">
            <div className="flex gap-1.5 items-center justify-center flex-wrap">
              <div className="flex gap-0.5 items-center">
                <div style={{ width: '12px', height: '12px', backgroundColor: '#8b5cf6', borderRadius: '2px' }} />
                <span className="text-xs text-gray-600">A</span>
              </div>
              <div className="flex gap-0.5 items-center">
                <div style={{ width: '12px', height: '12px', backgroundColor: '#60a5fa', borderRadius: '2px' }} />
                <span className="text-xs text-gray-600">B</span>
              </div>
              <div className="flex gap-0.5 items-center">
                <div style={{ width: '12px', height: '12px', backgroundColor: '#059669', borderRadius: '2px' }} />
                <span className="text-xs text-gray-600">C</span>
              </div>
              <div className="flex gap-0.5 items-center">
                <div style={{ width: '12px', height: '12px', backgroundColor: '#eab308', borderRadius: '2px' }} />
                <span className="text-xs text-gray-600">D</span>
              </div>
              <div className="flex gap-0.5 items-center">
                <div style={{ width: '12px', height: '12px', backgroundColor: '#fb923c', borderRadius: '2px' }} />
                <span className="text-xs text-gray-600">E</span>
              </div>
              <div className="flex gap-0.5 items-center">
                <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '2px' }} />
                <span className="text-xs text-gray-600">F</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Volume Kendaraan Chart Section */}
      {hasData && (
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-8 relative w-full">
          <h3 className="text-xl font-bold text-black mb-6" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '20px', lineHeight: '1.2' }}>
            Volume Kendaraan
          </h3>

          {/* Dropdown untuk pilih jalan */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 block mb-2">Pilih Jalan:</label>
            <select 
              value={selectedRoad} 
              onChange={(e) => setSelectedRoad(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-blue-500"
            >
              {allRoads.map(road => (
                <option key={road} value={road}>{road || 'Unknown'}</option>
              ))}
            </select>
          </div>
          
          {volumeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={volumeChartData} margin={{ top: 5, right: 30, left: 60, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time"
                  label={{ value: 'Data Kendaraan', position: 'bottom', offset: 20, style: { fontSize: '14px', fontWeight: 500 } }}
                />
                <YAxis 
                  label={{ value: 'Jumlah Kendaraan', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: '14px', fontWeight: 500, textAnchor: 'middle' } }}
                />
                <Tooltip formatter={(value) => typeof value === 'number' ? value.toFixed(0) : value} />
                <Legend wrapperStyle={{ paddingTop: '50px', display: 'flex', justifyContent: 'center', width: '100%' }} align="center" verticalAlign="bottom" height={36} />
                <Line 
                  type="monotone" 
                  dataKey="djKiri" 
                  stroke="#3b82f6" 
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Dj Kiri"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="djKanan" 
                  stroke="#10b981" 
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Dj Kanan"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="volumeKiri" 
                  stroke="#f59e0b" 
                  dot={{ fill: '#f59e0b', r: 4 }}
                  name="Volume Kiri"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="volumeKanan" 
                  stroke="#ef4444" 
                  dot={{ fill: '#ef4444', r: 4 }}
                  name="Volume Kanan"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-400 font-medium">Tidak ada data volume untuk ditampilkan</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
