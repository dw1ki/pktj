import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

export default function LOSDonutChart() {
  const data = [
    { name: 'A', value: 15, color: '#10B981' },
    { name: 'B', value: 25, color: '#3B82F6' },
    { name: 'C', value: 20, color: '#F59E0B' },
    { name: 'D', value: 20, color: '#EF4444' },
    { name: 'E', value: 15, color: '#8B5CF6' },
    { name: 'F', value: 5, color: '#6B7280' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-80">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">LOS Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
