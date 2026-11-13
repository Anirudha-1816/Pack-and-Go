import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import App from './App.jsx'
import { useThemeStore } from './Sources/themeStore'

// Initialize theme store
useThemeStore.getState().initialize();

createRoot(document.getElementById('root')).render(

  <BrowserRouter>
    <App />
  </BrowserRouter>
)
