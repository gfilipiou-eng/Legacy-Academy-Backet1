import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Reset Password Page - Beautiful Premium Design
router.get("/", async (req, res) => {
  const { token } = req.query;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - Legacy</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/framer-motion@10/dist/framer-motion.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0a0a0f;
      color: white;
      min-height: 100vh;
      overflow-x: hidden;
    }
    
    .bg-grid {
      position: fixed;
      inset: 0;
      background-image: 
        linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
    }
    
    .floating-orb {
      position: fixed;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.4;
      animation: float 20s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      25% { transform: translate(50px, -30px) scale(1.1); }
      50% { transform: translate(-30px, 50px) scale(0.9); }
      75% { transform: translate(-50px, -20px) scale(1.05); }
    }
    
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    
    .glass-card {
      background: linear-gradient(135deg, 
        rgba(255,255,255,0.1) 0%, 
        rgba(255,255,255,0.05) 50%,
        rgba(255,255,255,0.1) 100%);
      backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 32px;
      box-shadow: 
        0 25px 50px -12px rgba(0,0,0,0.5),
        0 0 0 1px rgba(255,255,255,0.05) inset,
        0 -20px 40px -20px rgba(139,92,246,0.15) inset;
    }
    
    .input-field {
      width: 100%;
      padding: 18px 24px;
      background: rgba(255,255,255,0.03);
      border: 2px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      color: white;
      font-size: 16px;
      transition: all 0.3s ease;
      outline: none;
    }
    
    .input-field:focus {
      border-color: rgba(139,92,246,0.6);
      background: rgba(139,92,246,0.05);
      box-shadow: 0 0 30px rgba(139,92,246,0.2);
    }
    
    .input-field::placeholder {
      color: rgba(255,255,255,0.3);
    }
    
    .btn-primary {
      width: 100%;
      padding: 18px;
      background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
      border: none;
      border-radius: 16px;
      color: white;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .btn-primary::before {
      content: '';
      position: absolute;
      inset: -2px;
      background: linear-gradient(135deg, #8B5CF6, #EC4899, #8B5CF6);
      border-radius: 18px;
      z-index: -1;
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .btn-primary:hover::before {
      opacity: 1;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 40px rgba(139,92,246,0.4);
    }
    
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    
    .logo-text {
      font-size: 4rem;
      font-weight: 900;
      font-style: italic;
      background: linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #F97316 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 0 80px rgba(168,85,247,0.5);
      letter-spacing: -2px;
    }
    
    .password-strength {
      height: 4px;
      background: rgba(255,255,255,0.1);
      border-radius: 2px;
      margin-top: 8px;
      overflow: hidden;
    }
    
    .password-strength-bar {
      height: 100%;
      border-radius: 2px;
      transition: all 0.3s ease;
    }
    
    .success-icon {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1));
      border: 2px solid rgba(34,197,94,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
      50% { transform: scale(1.05); box-shadow: 0 0 40px 10px rgba(34,197,94,0.2); }
    }
    
    .lock-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(139,92,246,0.3);
    }
  </style>
</head>
<body>
<div class="bg-grid"></div>
<div class="floating-orb" style="width:600px;height:600px;background:radial-gradient(circle,rgba(139,92,246,0.3),transparent 70%);top:-200px;left:-200px;"></div>
<div class="floating-orb" style="width:500px;height:500px;background:radial-gradient(circle,rgba(236,72,153,0.3),transparent 70%);bottom:-150px;right:-150px;animation-delay:-10s;"></div>
<div class="floating-orb" style="width:400px;height:400px;background:radial-gradient(circle,rgba(249,115,22,0.2),transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);animation-delay:-5s;"></div>

<div id="root"></div>
<script type="text/babel">
const { useState, useEffect } = React;
const { motion, AnimatePresence } = window.Motion;
const API = location.hostname === "localhost" ? "http://localhost:5000/api" : "https://legacy-academy-backet1.onrender.com/api";

const LockIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#lockGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs><linearGradient id="lockGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A855F7"/><stop offset="100%" stopColor="#EC4899"/></linearGradient></defs>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const EyeIcon = ({ open }) => open ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);
  
  const token = new URLSearchParams(window.location.search).get('token');
  
  const getPasswordStrength = () => {
    if (!password) return { width: '0%', color: 'transparent', text: '' };
    if (password.length < 6) return { width: '25%', color: '#EF4444', text: 'Weak' };
    if (password.length < 8) return { width: '50%', color: '#F59E0B', text: 'Fair' };
    if (password.length < 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) 
      return { width: '75%', color: '#3B82F6', text: 'Good' };
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password))
      return { width: '100%', color: '#22C55E', text: 'Strong' };
    return { width: '50%', color: '#F59E0B', text: 'Fair' };
  };
  
  useEffect(() => {
    if (success) {
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timer);
            window.location.href = '/';
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [success]);
  
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
      await axios.post(API + '/auth/reset-password', { token, newPassword: password });
      
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#EC4899', '#22C55E', '#3B82F6']
      });
      
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may be expired.');
    }
    
    setLoading(false);
  };
  
  const strength = getPasswordStrength();
  
  if (success) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
        <motion.div 
          initial={{opacity:0,scale:0.8,y:30}} 
          animate={{opacity:1,scale:1,y:0}}
          transition={{type:'spring',damping:15}}
          className="glass-card"
          style={{padding:'48px',maxWidth:'440px',width:'100%',textAlign:'center'}}
        >
          <motion.div 
            className="success-icon"
            initial={{scale:0}}
            animate={{scale:1}}
            transition={{delay:0.2,type:'spring',damping:10}}
          >
            <CheckIcon />
          </motion.div>
          
          <motion.h1 
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            transition={{delay:0.3}}
            style={{fontSize:'2rem',fontWeight:800,marginBottom:'12px',background:'linear-gradient(135deg,#22C55E,#10B981)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}
          >
            Password Reset!
          </motion.h1>
          
          <motion.p
            initial={{opacity:0}}
            animate={{opacity:1}}
            transition={{delay:0.4}}
            style={{color:'rgba(255,255,255,0.7)',marginBottom:'24px',fontSize:'1.1rem'}}
          >
            Your password has been successfully changed.
          </motion.p>
          
          <motion.div
            initial={{opacity:0}}
            animate={{opacity:1}}
            transition={{delay:0.5}}
            style={{padding:'16px',background:'rgba(34,197,94,0.1)',borderRadius:'12px',border:'1px solid rgba(34,197,94,0.2)'}}
          >
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:'14px'}}>
              Redirecting to login in <span style={{color:'#22C55E',fontWeight:700,fontSize:'18px'}}>{countdown}</span> seconds...
            </p>
          </motion.div>
          
          <motion.a
            href="/"
            initial={{opacity:0}}
            animate={{opacity:1}}
            transition={{delay:0.6}}
            style={{display:'inline-block',marginTop:'24px',color:'#A855F7',textDecoration:'none',fontWeight:600}}
          >
            Go to Login Now →
          </motion.a>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',position:'relative'}}>
      <motion.div 
        initial={{opacity:0,y:40}} 
        animate={{opacity:1,y:0}}
        transition={{duration:0.6,ease:'easeOut'}}
        className="glass-card"
        style={{padding:'48px',maxWidth:'460px',width:'100%'}}
      >
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <div className="lock-icon">
            <LockIcon />
          </div>
          <h1 className="logo-text">LEGACY</h1>
          <p style={{color:'rgba(255,255,255,0.5)',marginTop:'8px',fontSize:'1.1rem'}}>Reset Your Password</p>
        </div>
        
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{opacity:0,height:0,marginBottom:0}}
              animate={{opacity:1,height:'auto',marginBottom:20}}
              exit={{opacity:0,height:0,marginBottom:0}}
              style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'12px',padding:'16px',color:'#F87171',fontSize:'14px'}}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'14px',fontWeight:600,marginBottom:'8px',color:'rgba(255,255,255,0.8)'}}>
              New Password
            </label>
            <div style={{position:'relative'}}>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="input-field"
                required
                minLength={6}
                style={{paddingRight:'50px'}}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{position:'absolute',right:'16px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer'}}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            
            {password && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <div className="password-strength">
                  <motion.div 
                    className="password-strength-bar"
                    initial={{width:0}}
                    animate={{width:strength.width,backgroundColor:strength.color}}
                  />
                </div>
                <p style={{fontSize:'12px',marginTop:'6px',color:strength.color}}>{strength.text}</p>
              </motion.div>
            )}
          </div>
          
          <div style={{marginBottom:'24px'}}>
            <label style={{display:'block',fontSize:'14px',fontWeight:600,marginBottom:'8px',color:'rgba(255,255,255,0.8)'}}>
              Confirm Password
            </label>
            <div style={{position:'relative'}}>
              <input 
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="input-field"
                required
                minLength={6}
                style={{paddingRight:'50px',borderColor: confirmPassword && password !== confirmPassword ? 'rgba(239,68,68,0.5)' : confirmPassword && password === confirmPassword ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{position:'absolute',right:'16px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer'}}
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <motion.p initial={{opacity:0}} animate={{opacity:1}} style={{fontSize:'12px',marginTop:'6px',color:'#EF4444'}}>
                Passwords don't match
              </motion.p>
            )}
            {confirmPassword && password === confirmPassword && (
              <motion.p initial={{opacity:0}} animate={{opacity:1}} style={{fontSize:'12px',marginTop:'6px',color:'#22C55E'}}>
                ✓ Passwords match
              </motion.p>
            )}
          </div>
          
          <motion.button 
            type="submit"
            disabled={loading || password.length < 6 || password !== confirmPassword}
            className="btn-primary"
            whileHover={{scale: loading ? 1 : 1.02}}
            whileTap={{scale: loading ? 1 : 0.98}}
          >
            {loading ? (
              <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                <motion.span 
                  animate={{rotate:360}}
                  transition={{repeat:Infinity,duration:1,ease:'linear'}}
                  style={{display:'inline-block',width:'20px',height:'20px',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%'}}
                />
                Resetting...
              </span>
            ) : (
              '🔐 Reset Password'
            )}
          </motion.button>
        </form>
        
        <div style={{textAlign:'center',marginTop:'32px'}}>
          <a href="/" style={{color:'rgba(255,255,255,0.5)',textDecoration:'none',fontSize:'14px',transition:'color 0.2s'}}>
            ← Back to Login
          </a>
        </div>
        
        <div style={{marginTop:'32px',padding:'16px',background:'rgba(139,92,246,0.05)',borderRadius:'12px',border:'1px solid rgba(139,92,246,0.1)'}}>
          <p style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',textAlign:'center'}}>
            🔒 Your password is encrypted and secured using industry-standard protocols.
          </p>
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
