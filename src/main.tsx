import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import eruda from 'eruda'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker
registerSW({ immediate: true })

if (import.meta.env.DEV) {
  eruda.init()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
