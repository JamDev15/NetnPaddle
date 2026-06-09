import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Toaster position="top-right" toastOptions={{
      style: { fontFamily: 'Poppins, sans-serif', fontSize: '14px' },
      success: { iconTheme: { primary: '#E91E8C', secondary: 'white' } },
    }} />
    <App />
  </React.StrictMode>
)
