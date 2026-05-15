import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { DisplaySettingsProvider } from './state/DisplaySettingsContext'
import { GlossaryProvider } from './state/GlossaryContext'
import { AuthProvider } from './state/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <DisplaySettingsProvider>
        <GlossaryProvider>
          <App />
        </GlossaryProvider>
      </DisplaySettingsProvider>
    </AuthProvider>
  </React.StrictMode>,
)
