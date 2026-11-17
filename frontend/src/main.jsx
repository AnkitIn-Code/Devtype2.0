// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/ui-polish.css'
import './styles/features.css'
import App from './App.jsx'
import { cleanLegacyMockData } from './services/srsService.js'

// Clean legacy mock SRS data on startup
cleanLegacyMockData();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
