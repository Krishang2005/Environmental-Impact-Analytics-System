import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgba(15, 23, 42, 0.92)',
          color: '#e2e8f0',
          border: '1px solid rgba(125, 211, 252, 0.35)',
          borderRadius: '12px',
          fontSize: '13px',
          fontFamily: 'Space Grotesk, sans-serif',
          backdropFilter: 'blur(8px)',
        },
        success: {
          iconTheme: { primary: '#22d3ee', secondary: '#020617' },
          duration: 3500,
        },
        error: {
          iconTheme: { primary: '#f87171', secondary: '#020617' },
          duration: 4500,
        },
      }}
    />
  </React.StrictMode>,
)
