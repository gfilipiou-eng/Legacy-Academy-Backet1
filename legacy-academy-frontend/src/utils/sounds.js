import confetti from 'canvas-confetti';

// Initialize sound enabled from localStorage
if (typeof window !== 'undefined') {
    window.SOUND_ENABLED = localStorage.getItem('soundEnabled') !== 'false';
}

export const playSound = (type) => {
    if (typeof window === 'undefined' || !window.SOUND_ENABLED) return;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    if (type === 'pop' || type === 'click' || type === 'tap') {
        // High-end "taptic" feedback - clean sine, ultra-fast decay
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
        // Soft focus tap for navigation
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
        // Refined organic swipe
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
    } else if (type === 'delete' || type === 'strike') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'premium_delete') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc1.type = 'sawtooth';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(420, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.22);
        osc2.frequency.setValueAtTime(1200, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.18);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.24);
        osc2.stop(ctx.currentTime + 0.2);
    } else if (type === 'cyber_delete' || type === 'digital_shatter') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const noise = ctx.createBufferSource();
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize / 4));

        noise.buffer = buffer;
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(400, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(120, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

        noise.connect(gain);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.2);
        osc2.stop(ctx.currentTime + 0.2);
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
        // LUXURY PREMIUM TAP: Two layers - Crystal chime + Velvet sub
        const crystal = ctx.createOscillator();
        const velvet = ctx.createOscillator();
        const cg = ctx.createGain();
        const vg = ctx.createGain();

        // Crystal layer (High frequency precision)
        crystal.type = 'sine';
        crystal.frequency.setValueAtTime(3200, ctx.currentTime);
        crystal.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.02);
        cg.gain.setValueAtTime(0.04, ctx.currentTime);
        cg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

        // Velvet layer (Deep luxury body)
        velvet.type = 'sine';
        velvet.frequency.setValueAtTime(80, ctx.currentTime);
        velvet.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.04);
        vg.gain.setValueAtTime(0.06, ctx.currentTime);
        vg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        crystal.connect(cg);
        velvet.connect(vg);
        cg.connect(ctx.destination);
        vg.connect(ctx.destination);

        crystal.start();
        velvet.start();
        crystal.stop(ctx.currentTime + 0.05);
        velvet.stop(ctx.currentTime + 0.05);
    } else if (type === 'magic' || type === 'success') {
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
    } else if (type === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.setValueAtTime(100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'mic_start') {
        // Professional digital "comms on" chirp
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
        // Soft mechanical "comms off" thud
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

        // Tiny mechanical click
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
    }
};

export const explodeEffect = () => confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#ff0000', '#ffffff', '#222222'],
    gravity: 2,
    scalar: 0.7,
    shapes: ['square'],
    ticks: 150
});

export const cyberDeleteEffect = () => {
    confetti({
        particleCount: 150,
        spread: 180,
        origin: { y: 0.5 },
        colors: ['#ff0000', '#000000', '#ffffff'],
        gravity: 0.8,
        scalar: 1.2,
        shapes: ['square'],
        ticks: 60,
        disableForReducedMotion: true
    });
};
