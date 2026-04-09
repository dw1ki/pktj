import React from 'react'

export default function Debug() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#f0f0f0',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      color: '#333'
    }}>
      <h1>✅ React App Loaded Successfully</h1>
      <p style={{ marginTop: '20px', fontSize: '16px' }}>
        If you see this, the React app is rendering correctly.
      </p>
      <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Check browser console for any errors.
      </p>
      <div style={{ marginTop: '30px', padding: '20px', background: 'white', borderRadius: '8px', maxWidth: '600px' }}>
        <h3>System Info:</h3>
        <ul style={{ textAlign: 'left' }}>
          <li>React Version: {React.version}</li>
          <li>Current URL: {window.location.href}</li>
          <li>Timestamp: {new Date().toLocaleString()}</li>
        </ul>
      </div>
    </div>
  )
}
