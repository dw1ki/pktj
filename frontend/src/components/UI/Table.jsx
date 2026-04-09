import PropTypes from 'prop-types'

export default function Table({ columns, data, striped = true }) {
  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="w-full">
        <thead className="bg-gray-100 border-b border-gray-300">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                striped && rowIndex % 2 === 0 ? 'bg-white' : striped ? 'bg-gray-50' : ''
              }`}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 text-sm text-gray-700">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      render: PropTypes.func,
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  striped: PropTypes.bool,
}
