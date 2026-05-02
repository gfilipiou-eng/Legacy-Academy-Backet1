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
        @keyframes fx-vaporize {
            0% { transform: scale(1); filter: blur(0px) brightness(1); }
            50% { transform: scale(1.02); filter: blur(2px) brightness(1.5); }
            100% { transform: scale(1); filter: blur(0px) brightness(1); }
        }
        .fx-vaporize-active {
            animation: fx-vaporize 0.4s ease-out both;
        }
    `;
    document.head.appendChild(style);
}

let audioCtx = null;
let hasInteracted = false;

const initAudio = () => {
    hasInteracted = true;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        const p = audioCtx.resume();
        if (p && p.catch) p.catch(() => { });
    }

    // Cleanup listeners
    window.removeEventListener('click', initAudio);
    window.removeEventListener('touchstart', initAudio);
    window.removeEventListener('keydown', initAudio);
};

if (typeof window !== 'undefined') {
    window.addEventListener('click', initAudio);
    window.addEventListener('touchstart', initAudio);
    window.addEventListener('keydown', initAudio);
}

const getCtx = () => {
    if (!hasInteracted) return null; // Safely prevent initialization prior to user gesture
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        const p = audioCtx.resume();
        if (p && p.catch) p.catch(() => { });
    }
    return audioCtx;
};

export const playSound = (type) => {
    if (typeof window === 'undefined' || !window.SOUND_ENABLED) return;

    const ctx = getCtx();
    if (!ctx) return;

    if (type === 'cyber_nav') {
        // High-end Cybernetic "Glass/Titanium Click"
        const osc = ctx.createOscillator();
        const fmOsc = ctx.createOscillator();
        const gain = ctx.createGain();
        const fmGain = ctx.createGain();

        // High frequency transient for crispness
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4000, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.05);

        // FM Modulation for metallic tone
        fmOsc.type = 'triangle';
        fmOsc.frequency.setValueAtTime(2000, ctx.currentTime);
        fmGain.gain.setValueAtTime(500, ctx.currentTime); // Frequency Mod depth

        fmOsc.connect(fmGain);
        fmGain.connect(osc.frequency);

        // Tight envelope
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        fmOsc.start(ctx.currentTime);
        osc.start(ctx.currentTime);
        fmOsc.stop(ctx.currentTime + 0.1);
        osc.stop(ctx.currentTime + 0.1);

    } else if (type === 'pop' || type === 'click' || type === 'tap') {
        // Premium "Mechanical Click" (Solid Switch)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle'; // More body

        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);

    } else if (type === 'sweep' || type === 'soft_tap') {
        // Soft Neural Drop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.03);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
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
        // Premium "Dissolve" Sound (Clean Sine Swipe Down)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        // Noise buffer removed
    } else if (type === 'cyber_scroll') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.005, ctx.currentTime);
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
        cg.gain.setValueAtTime(0.005, ctx.currentTime);
        cg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

        velvet.type = 'sine';
        velvet.frequency.setValueAtTime(100, ctx.currentTime);
        velvet.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.02);
        vg.gain.setValueAtTime(0.01, ctx.currentTime);
        vg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

        crystal.connect(cg);
        velvet.connect(vg);
        cg.connect(ctx.destination);
        vg.connect(ctx.destination);

        crystal.start();
        velvet.start();
        crystal.stop(ctx.currentTime + 0.03);
        velvet.stop(ctx.currentTime + 0.03);
    } else if (type === 'cyber_like') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'cyber_unlike') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'cyber_repost') {
        for (let i = 0; i < 2; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            const offset = i * 0.08;
            osc.frequency.setValueAtTime(600 + i * 400, ctx.currentTime + offset);
            osc.frequency.exponentialRampToValueAtTime(1400 + i * 400, ctx.currentTime + offset + 0.1);
            gain.gain.setValueAtTime(0, ctx.currentTime + offset);
            gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + offset + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.2);
            osc.start(ctx.currentTime + offset);
            osc.stop(ctx.currentTime + offset + 0.2);
        }
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
        // Short Static Interrupt (Lighter)
        const bufferSize = ctx.sampleRate * 0.05; // Very short (50ms)
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5; // White noise
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        noise.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
    } else if (type === 'cyber_comment') {
        // Premium "Glass Pop" (High-Tech & Crisp)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.02); // Quick chirp up

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01); // Soft attack
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); // Fast decay

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'cyber_open') {
        // High-end digital "Whoosh-Ping"
        const osc = ctx.createOscillator();
        const noiseGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.1);

        noiseGain.gain.setValueAtTime(0, ctx.currentTime);
        noiseGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.05);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

        osc.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'cyber_back' || type === 'cyber_close') {
        // Subtle futuristic "De-click"
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'notification_arrive') {
        // PREMIUM LUXURY: Crystal Chime Arrival — 3-note ascending arpeggio with warm harmonic pad
        const notes = [1318.5, 1661.2, 1975.5]; // E6, G#6, B6 — Major triad
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const harmonic = ctx.createOscillator();
            const oscGain = ctx.createGain();
            const harmGain = ctx.createGain();
            const t0 = ctx.currentTime + i * 0.09;

            // Primary crystal tone
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t0);
            oscGain.gain.setValueAtTime(0, t0);
            oscGain.gain.linearRampToValueAtTime(0.12, t0 + 0.01);
            oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);

            // Harmonic shimmer (octave above, quieter)
            harmonic.type = 'sine';
            harmonic.frequency.setValueAtTime(freq * 2, t0);
            harmGain.gain.setValueAtTime(0, t0);
            harmGain.gain.linearRampToValueAtTime(0.03, t0 + 0.01);
            harmGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);

            osc.connect(oscGain);
            harmonic.connect(harmGain);
            oscGain.connect(ctx.destination);
            harmGain.connect(ctx.destination);

            osc.start(t0);
            harmonic.start(t0);
            osc.stop(t0 + 0.5);
            harmonic.stop(t0 + 0.35);
        });

        // Warm sub-pad underneath
        const pad = ctx.createOscillator();
        const padGain = ctx.createGain();
        pad.type = 'sine';
        pad.frequency.setValueAtTime(330, ctx.currentTime); // E4 root
        padGain.gain.setValueAtTime(0, ctx.currentTime);
        padGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
        padGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        pad.connect(padGain);
        padGain.connect(ctx.destination);
        pad.start();
        pad.stop(ctx.currentTime + 0.7);
    } else if (type === 'premium_tap') {
        // Ultra-Premium "Thock" (Deep, minimal, luxurious mechanical switch feel)
        const thock = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const tGain = ctx.createGain();
        const sGain = ctx.createGain();

        // The "Thock" body (Very fast pitch drop in the low-mids)
        thock.type = 'sine';
        thock.frequency.setValueAtTime(400, ctx.currentTime);
        thock.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.02);

        tGain.gain.setValueAtTime(0.05, ctx.currentTime);
        tGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

        // Warm sub-resonance for heavy haptic weight
        sub.type = 'sine';
        sub.frequency.setValueAtTime(90, ctx.currentTime);
        sub.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.03);

        sGain.gain.setValueAtTime(0.07, ctx.currentTime);
        sGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

        thock.connect(tGain);
        sub.connect(sGain);

        // Low-pass filter to guarantee zero high-pitched noise/chirps (ultra smooth)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);

        tGain.connect(filter);
        sGain.connect(filter);
        filter.connect(ctx.destination);

        thock.start();
        sub.start();
        thock.stop(ctx.currentTime + 0.06);
        sub.stop(ctx.currentTime + 0.1);
    } else if (type === 'nav_click') {
        // Luxury "Nav Click" - Short, high-quality, muted pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle'; // Richer harmonic content
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'premium_logout') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    }
};

export const explodeEffect = () => {
    // Disabled for performance
};

export const cyberDeleteEffect = () => {
    // Disabled for performance
};
