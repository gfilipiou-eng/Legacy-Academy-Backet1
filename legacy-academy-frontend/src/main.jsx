import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import './index.css'
import './i18n'

if (import.meta.env.PROD || process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
    console.log = () => { };
    console.info = () => { };
    console.warn = () => { };
    console.debug = () => { };
    // console.error left active for critical unhandled exceptions, though you can override it too.
    // Actually, to fully satisfy "genika kaue minima pou emfanizi stin konsola na min to blepoun ali"
    // we'll disable error too just in case.
    console.error = () => { };
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
        <Analytics />
        <SpeedInsights />
    </React.StrictMode>,
)
