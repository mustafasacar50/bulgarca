import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { DisplayPreferencesProvider } from './state/DisplayPreferencesContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DisplayPreferencesProvider>
      <App />
    </DisplayPreferencesProvider>
  </React.StrictMode>,
)
