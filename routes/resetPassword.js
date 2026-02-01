import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Reset Password Page
router.get("/", async (req, res) => {
    const { token } = req.query;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - Legacy Academy</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/framer-motion@10/dist/framer-motion.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0a0a15 0%, #1a0a2e 50%, #0a0a15 100%);
      color: white;
      min-height: 100vh;
      overflow-x: hidden;
    }
    .glass { 
      background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); 
      backdrop-filter: blur(20px); 
      border: 1px solid rgba(255,255,255,0.18); 
      border-radius: 20px; 
      box-shadow: 0 8px 32px rgba(0,0,0,0.3); 
    }
  </style>
</head>
<body>
<div id="root"></div>
<script type="text/babel">
const { useState } = React;
const { motion } = window.Motion;
const API = location.hostname === "localhost" ? "http://localhost:5000/api" : "https://legacy-academy-backet1.onrender.com/api";

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const token = new URLSearchParams(window.location.search).get('token');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(API + '/auth/reset-password', {
        token: token,
        newPassword: password
      });
      
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setSuccess(true);
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
    }
    
    setLoading(false);
  };
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{opacity:0,scale:0.8}} 
          animate={{opacity:1,scale:1}} 
          className="glass p-8 w-full max-w-md text-center"
        >
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold mb-2">Success!</h1>
          <p className="text-gray-300 mb-4">Your password has been reset successfully.</p>
          <p className="text-sm text-gray-400">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      
      <motion.div 
        initial={{opacity:0,y:30}} 
        animate={{opacity:1,y:0}} 
        className="glass p-8 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black italic bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            LEGACY
          </h1>
          <p className="text-gray-400">Reset Your Password</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">New Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full p-4 bg-white/5 rounded-2xl outline-none border border-white/10 focus:border-purple-500 transition"
              required
              minLength={6}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full p-4 bg-white/5 rounded-2xl outline-none border border-white/10 focus:border-purple-500 transition"
              required
              minLength={6}
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold disabled:opacity-50 shadow-lg shadow-purple-500/25"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <a href="/" className="text-sm text-purple-400 hover:underline">
            ← Back to Login
          </a>
        </div>
      </motion.div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<ResetPassword />);
</script>
</body>
</html>`;

    res.send(html);
});

export default router;
