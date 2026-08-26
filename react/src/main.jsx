import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted Font Awesome: only the core + the two styles actually used
// (solid, brands) — Vite hashes the woff2 files into the bundle.
import '@fortawesome/fontawesome-free/css/fontawesome.min.css'
import '@fortawesome/fontawesome-free/css/solid.min.css'
import '@fortawesome/fontawesome-free/css/brands.min.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
