import axios from "axios";

/**
 * Super-Intelligent Translation Engine (GTX Powered)
 * Optimized for High-Frequency Academy Intelligence
 */
export const translateText = async (text, targetLang = 'en') => {
    if (!text || text.trim().length === 0) return text;

    try {
        // Robust Language Mapping (Normalization)
        let target = (targetLang || 'en').toLowerCase().split('-')[0];
        if (target === 'cy') target = 'el'; // Cypriot to Greek

        // Google Translate API - Clients5 Endpoint (Bypasses IP Blocks more reliably)
        const url = `https://clients5.google.com/translate_a/t`;

        const params = {
            client: 'dict-chrome-ex',
            sl: 'auto',
            tl: target,
            q: text
        };

        const res = await axios.get(url, {
            params,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });

        // The dict-chrome-ex endpoint returns an array where the first element is the full translated string
        if (res.data && Array.isArray(res.data) && typeof res.data[0] === 'string') {
            const translatedFull = res.data[0];
            if (translatedFull) {
                console.log(`🌍 [NEURAL_TRANS] Decryption Successful (${text.length} chars) -> Target: ${target}`);
                return translatedFull;
            }
        }

        return text;
    } catch (err) {
        console.error("🌍 [NEURAL_TRANS] Critical Error:", err.message);
        return text; // High-frequency fallback
    }
};
