import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Analytics } from "@vercel/analytics/react"
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import './i18n'

if (import.meta.env.PROD || process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
    console.log = () => { };
    console.info = () => { };
    console.warn = () => { };
    console.debug = () => { };
    console.error = () => { };
} else {
    // Hide specific uncatchable console errors from external libs
    const originalConsoleError = console.error;
    console.error = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('Cross-Origin-Opener-Policy')) return;
        originalConsoleError(...args);
    };
}

// Ensure you replace this with your actual Google Client ID from Google Cloud Console
// It should look like: 93245251788-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "93245251788-a0299sb30oru85jkdo5kiuajq6278qvh.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <App />
        </GoogleOAuthProvider>
        <Analytics />
    </React.StrictMode>,
)
