import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './Components/App/App'
import '@fontsource/jetbrains-mono' // ✅ Подключение шрифта

createRoot(document.getElementById('root')!).render(<App />)
