// Remove confetti import
// import confetti from 'canvas-confetti';

// Initialize sound enabled from localStorage
if (typeof window !== 'undefined') {
    window.SOUND_ENABLED = localStorage.getItem('soundEnabled') !== 'false';

    // Inject Custom FX Styles
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fx-flash-gold {
            0% { opacity: 0; }
            10% { opacity: 0.15; background-color: var(--gold-primary); }
            100% { opacity: 0; }
        }
        @keyframes fx-flash-red {
            0% { opacity: 0; }
            10% { opacity: 0.15; background-color: #ef4444; }
            100% { opacity: 0; }
        }
        .fx-overlay-gold {
            position: fixed;
            inset: 0;
            z-index: 99999;
            pointer-events: none;
            animation: fx-flash-gold 0.5s ease-out;
        }
        .fx-overlay-red {
            position: fixed;
            inset: 0;
            z-index: 99999;
            pointer-events: none;
            animation: fx-flash-red 0.5s ease-out;
        }
        @keyframes fx-shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .fx-shake-active {
            animation: fx-shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
    `;
    document.head.appendChild(style);
}

// Shared AudioContext to avoid overhead and limit issues
let audioCtx = null;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Mobile/Modern browsers require resume() on user gesture
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

export const playSound = (type) => {
    if (typeof window === 'undefined' || !window.SOUND_ENABLED) return;

    const ctx = getCtx();

    if (type === 'pop' || type === 'click' || type === 'tap') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.03);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
    } else if (type === 'sweep' || type === 'soft_tap') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'whoosh' || type === 'swipe') {
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
        noise.start();
    } else if (type === 'delete' || type === 'strike' || type === 'cyber_delete' || type === 'premium_delete') {
        // Premium "Glitch Digital" dissolve sound
        const osc = ctx.createOscillator();
        const glitch = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.2);

        glitch.type = 'square';
        glitch.frequency.setValueAtTime(2000, ctx.currentTime);
        glitch.frequency.setValueAtTime(100, ctx.currentTime + 0.05);
        glitch.frequency.setValueAtTime(1500, ctx.currentTime + 0.1);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        filter.Q.setValueAtTime(15, ctx.currentTime);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

        osc.connect(filter);
        glitch.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        glitch.start();
        osc.stop(ctx.currentTime + 0.2);
        glitch.stop(ctx.currentTime + 0.2);
    } else if (type === 'cyber_scroll') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'cyber_click') {
        const crystal = ctx.createOscillator();
        const velvet = ctx.createOscillator();
        const cg = ctx.createGain();
        const vg = ctx.createGain();

        crystal.type = 'sine';
        crystal.frequency.setValueAtTime(3500, ctx.currentTime);
        crystal.frequency.exponentialRampToValueAtTime(2800, ctx.currentTime + 0.015);
        cg.gain.setValueAtTime(0.035, ctx.currentTime);
        cg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

        velvet.type = 'sine';
        velvet.frequency.setValueAtTime(100, ctx.currentTime);
        velvet.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.02);
        vg.gain.setValueAtTime(0.05, ctx.currentTime);
        vg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

        crystal.connect(cg);
        velvet.connect(vg);
        cg.connect(ctx.destination);
        vg.connect(ctx.destination);

        crystal.start();
        velvet.start();
        crystal.stop(ctx.currentTime + 0.03);
        velvet.stop(ctx.currentTime + 0.03);
    } else if (type === 'magic' || type === 'success' || type === 'cyber_success') {
        // Ethereal chime pulse
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000 + i * 500, ctx.currentTime + i * 0.05);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.2);
            osc.start(ctx.currentTime + i * 0.05);
            osc.stop(ctx.currentTime + i * 0.05 + 0.2);
        }
    } else if (type === 'error' || type === 'cyber_error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'mic_start') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.05);
        osc2.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.1);
    } else if (type === 'mic_stop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);

        const tick = ctx.createOscillator();
        tick.type = 'triangle';
        tick.frequency.setValueAtTime(2000, ctx.currentTime);
        const tg = ctx.createGain();
        tg.gain.setValueAtTime(0.01, ctx.currentTime);
        tg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
        tick.connect(tg);
        tg.connect(ctx.destination);
        tick.start();
        tick.stop(ctx.currentTime + 0.02);
    } else if (type === 'cyber_notification') {
        // Futuristic notification: High-pitched digital chirp + pad
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // Layer 1: The Chirp
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1200, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1);
        osc1.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.2);

        // Layer 2: The Pad
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(400, ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.5);
        osc2.stop(ctx.currentTime + 0.5);
    } else if (type === 'cyber_like') {
        // Satisfying "Charge Up" sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'cyber_dislike') {
        // "Power Down" sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }
};

export const explodeEffect = () => {
    if (typeof document === 'undefined') return;

    // REPLACEMENT: Subtle Gold Flash Screen
    const flash = document.createElement('div');
    flash.className = 'fx-overlay-gold';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);
};

export const cyberDeleteEffect = () => {
    if (typeof document === 'undefined') return;

    // REPLACEMENT: Gold Wave Ripple (Kima)
    const ripple = document.createElement('div');
    ripple.className = 'fx-ripple-gold';
    document.body.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 800);
};
