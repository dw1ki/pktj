import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

export default function TrafficLineChart() {
  const data = [
    { time: '00:00', volume: 150 },
    { time: '01:00', volume: 120 },
    { time: '02:00', volume: 100 },
    { time: '03:00', volume: 90 },
    { time: '04:00', volume: 110 },
    { time: '05:00', volume: 200 },
    { time: '06:00', volume: 350 },
    { time: '07:00', volume: 580 },
    { time: '08:00', volume: 620 },
    { time: '09:00', volume: 520 },
    { time: '10:00', volume: 450 },
    { time: '11:00', volume: 480 },
    { time: '12:00', volume: 510 },
    { time: '13:00', volume: 490 },
    { time: '14:00', volume: 470 },
    { time: '15:00', volume: 520 },
    { time: '16:00', volume: 600 },
    { time: '17:00', volume: 680 },
    { time: '18:00', volume: 720 },
    { time: '19:00', volume: 650 },
    { time: '20:00', volume: 520 },
    { time: '21:00', volume: 380 },
    { time: '22:00', volume: 250 },
    { time: '23:00', volume: 180 },
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">24-Hour Traffic Volume</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis label={{ value: 'Volume (smp/jam)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value) => `${value} smp/jam`} />
          <Legend />
          <ReferenceLine y={500} stroke="#ccc" strokeDasharray="5 5" label="Capacity" />
          <Line
            type="monotone"
            dataKey="volume"
            stroke="#2563EB"
            dot={false}
            strokeWidth={2}
            name="Traffic Volume"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
