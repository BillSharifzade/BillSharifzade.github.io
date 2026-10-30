import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './fonts.css'
import './index.css'
import App from './App.jsx'

const root = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// The build writes the first frame into #root (scripts/prerender.mjs), so the
// page paints before this script runs and React only has to take it over. The
// dev server serves the root empty.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
