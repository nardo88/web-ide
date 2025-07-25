import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './Components/App/App'
import '@fontsource/jetbrains-mono' 

createRoot(document.getElementById('root')!).render(<App />)
