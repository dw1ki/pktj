import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

const RealtimeMonitoring = () => {
  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [rtspUrl, setRtspUrl] = useState('rtsp://admin:password@192.168.1.100:554/stream1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Stream state
  const [frameData, setFrameData] = useState(null)
  const [detections, setDetections] = useState([])
  const [metrics, setMetrics] = useState(null)
  
  // WebSocket
  const wsRef = useRef(null)
  const canvasRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5000'

  /**
   * Connect to real-time CCTV stream
   */
  const handleConnect = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      if (!rtspUrl.trim()) {
        throw new Error('RTSP URL tidak boleh kosong')
      }

      // Generate unique session ID
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)

      // Call backend endpoint
      const response = await fetch(`${API_URL}/api/realtime/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rtsp_url: rtspUrl,
          session_id: newSessionId,
          confidence: 0.5,
          lane_mapping: { kiri: 0, kanan: 1 }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal terhubung ke stream')
      }

      setSuccess(`Terhubung ke stream: ${newSessionId}`)
      setIsConnected(true)

      // Connect to WebSocket
      connectWebSocket(newSessionId, data.websocket_url)

    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  /**
   * Connect to WebSocket server
   */
  const connectWebSocket = (sessionId, wsUrl) => {
    try {
      // Use provided URL or construct default
      const url = wsUrl || `ws://localhost:3001/${sessionId}`
      
      // Replace http/https with ws/wss
      const wsUrlFixed = url.replace(/^http/, 'ws')

      console.log(`Connecting to WebSocket: ${wsUrlFixed}`)
      wsRef.current = new WebSocket(wsUrlFixed)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        reconnectAttemptsRef.current = 0
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          if (message.type === 'detection') {
            setDetections(message.detections || [])
            setMetrics(message.metrics || null)
            
            if (message.frame) {
              setFrameData(message.frame)
              drawFrame(message.frame, message.detections || [])
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('Koneksi WebSocket gagal')
      }

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        
        // Auto-reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1
          console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current})`)
          setTimeout(() => connectWebSocket(sessionId, wsUrl), 3000)
        }
      }
    } catch (err) {
      console.error('WebSocket connection error:', err)
      setError('Gagal menghubungkan ke WebSocket')
    }
  }

  /**
   * Draw frame and detections on canvas
   */
  const drawFrame = (frameBase64, detectionsList) => {
    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Set canvas size to image size
        canvas.width = img.width
        canvas.height = img.height

        // Draw image
        ctx.drawImage(img, 0, 0)

        // Draw detection boxes
        detectionsList.forEach((detection) => {
          const { bbox, class: className, confidence, lane } = detection
          const { x1, y1, x2, y2 } = bbox

          // Colors
          const colors = {
            mobil: '#00ff00',      // Green
            bus: '#0000ff',        // Blue
            truk: '#00a5ff',       // Orange
            motor: '#ffff00'       // Cyan
          }

          const color = colors[className] || '#ffffff'

          // Draw rectangle
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)

          // Draw label
          const label = `${className} (${(confidence * 100).toFixed(0)}%)`
          const textMetrics = ctx.measureText(label)
          const textHeight = 20

          ctx.fillStyle = color
          ctx.fillRect(x1, y1 - textHeight, textMetrics.width + 10, textHeight)

          ctx.fillStyle = '#000000'
          ctx.font = 'bold 12px Arial'
          ctx.fillText(label, x1 + 5, y1 - 5)

          // Draw lane indicator
          ctx.fillStyle = color
          ctx.font = '10px Arial'
          ctx.fillText(`Lane: ${lane}`, x1, y2 + 15)
        })
      }

      img.src = `data:image/jpeg;base64,${frameBase64}`
    } catch (err) {
      console.error('Error drawing frame:', err)
    }
  }

  /**
   * Disconnect from stream
   */
  const handleDisconnect = async () => {
    try {
      setLoading(true)

      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.close()
      }

      // Call backend endpoint
      const response = await fetch(`${API_URL}/api/realtime/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memutuskan koneksi')
      }

      setSuccess('Disconnected dari stream')
      setIsConnected(false)
      setSessionId('')
      setDetections([])
      setMetrics(null)
      setFrameData(null)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return (
    <div className="space-y-6">      

      {/* Connection Control */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Koneksi Stream</h2>

        <div className="space-y-4">
          {/* RTSP URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RTSP URL
            </label>
            <input
              type="text"
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              placeholder="rtsp://username:password@ip:port/stream"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isConnected}
            />
            <p className="text-xs text-gray-500 mt-1">
              Contoh: rtsp://admin:password@192.168.1.100:554/stream1
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm font-medium text-gray-700">
              Status: {isConnected ? 'Terhubung' : 'Terputus'}
            </span>
            {sessionId && (
              <span className="text-xs text-gray-500 ml-2">
                Session ID: {sessionId}
              </span>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleConnect}
              disabled={isConnected || loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Menghubungkan...' : 'Connect'}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={!isConnected || loading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Memutuskan...' : 'Disconnect'}
            </button>
          </div>
        </div>
      </div>

      {/* Video Stream */}
      <div className="grid grid-cols-3 gap-6">
        {/* Video Canvas */}
        <div className="col-span-2 bg-gray-900 rounded-lg overflow-hidden shadow-lg">
          <canvas
            ref={canvasRef}
            className="w-full h-auto bg-black"
            style={{ minHeight: '480px' }}
          />
          {!isConnected && (
            <div className="flex items-center justify-center h-96 bg-gray-900 text-gray-500">
              <p>Koneksikan ke stream CCTV untuk melihat video</p>
            </div>
          )}
        </div>

        {/* Metrics Panel */}
        <div className="space-y-4">
          {/* Real-time Metrics */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Metrik Real-time</h3>

            {metrics ? (
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Total Kendaraan</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.total_vehicles}</p>
                </div>

                <div className="bg-green-50 p-3 rounded">
                  <p className="text-xs text-gray-600">FPS</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.fps?.toFixed(1)}</p>
                </div>

                <div className="bg-orange-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Kendaraan/Menit</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {metrics.vehicles_per_minute?.toFixed(0)}
                  </p>
                </div>

                <div className="bg-purple-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Uptime</p>
                  <p className="text-lg font-bold text-purple-600">
                    {metrics.uptime_seconds}s
                  </p>
                </div>

                {/* Lane Distribution */}
                <div className="bg-gray-50 p-3 rounded mt-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Distribusi Lane</p>
                  {Object.entries(metrics.lane_counts || {}).map(([lane, count]) => (
                    <div key={lane} className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 capitalize">{lane}</span>
                      <span className="font-semibold text-gray-800">{count}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  Total Frame: {metrics.total_frames} | Deteksi: {metrics.total_detections}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                Menunggu data metrics...
              </p>
            )}
          </div>

          {/* Detection List */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Deteksi Terakhir</h3>

            {detections.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {detections.slice(0, 10).map((detection, idx) => (
                  <div
                    key={idx}
                    className="text-sm p-2 bg-gray-50 rounded border-l-4 border-blue-500"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium capitalize">{detection.class}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {(detection.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Lane: <span className="font-semibold capitalize">{detection.lane}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                Belum ada deteksi
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Connection Info */}
      {isConnected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Informasi Koneksi</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p className="text-xs text-blue-600">Session ID</p>
              <p className="font-mono">{sessionId}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600">RTSP URL</p>
              <p className="font-mono text-xs truncate">{rtspUrl}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600">WebSocket</p>
              <p className="font-mono text-xs">ws://localhost:3001/{sessionId}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RealtimeMonitoring
