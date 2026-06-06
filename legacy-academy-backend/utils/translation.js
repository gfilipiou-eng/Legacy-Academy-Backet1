import axios from "axios";

/**
 * Translation Engine - Uses Google Translate unofficial API with multiple fallback endpoints
 */
const URL_PLACEHOLDER_PREFIX = "ZXQURLTOKEN";
const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

const protectUrls = (text) => {
    const preservedUrls = [];
    const protectedText = String(text || "").replace(urlRegex, (match) => {
        const token = `${URL_PLACEHOLDER_PREFIX}${preservedUrls.length}END`;
        preservedUrls.push(match);
        return token;
    });

    return { protectedText, preservedUrls };
};

const restoreUrls = (text, preservedUrls) => {
    let restoredText = String(text || "");
    preservedUrls.forEach((url, index) => {
        const token = `${URL_PLACEHOLDER_PREFIX}${index}END`;
        restoredText = restoredText.replaceAll(token, url);
    });
    return restoredText;
};

export const translateText = async (text, targetLang = 'en') => {
    if (!text || text.trim().length === 0) return text;

    // Normalize language code
    let target = (targetLang || 'en').toLowerCase().split('-')[0];
    if (target === 'cy') target = 'el'; // Cypriot → Greek
    const { protectedText, preservedUrls } = protectUrls(text);

    // Try multiple Google Translate endpoints for reliability
    const attempts = [
        // Endpoint 1: translate_a/single (most reliable for full text)
        async () => {
            const res = await axios.get('https://translate.googleapis.com/translate_a/single', {
                params: {
                    client: 'gtx',
                    sl: 'auto',
                    tl: target,
                    dt: 't',
                    q: protectedText
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });
            // Response: [[[translated, original, ...], ...], ...]
            const data = res.data;
            if (Array.isArray(data) && Array.isArray(data[0])) {
                const parts = data[0]
                    .filter(item => Array.isArray(item) && typeof item[0] === 'string')
                    .map(item => item[0]);
                const result = parts.join('');
                if (result) return result;
            }
            return null;
        },
        // Endpoint 2: clients5 dict endpoint (fallback)
        async () => {
            const res = await axios.get('https://clients5.google.com/translate_a/t', {
                params: { client: 'dict-chrome-ex', sl: 'auto', tl: target, q: protectedText },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });
            const data = res.data;
            if (Array.isArray(data) && data.length > 0) {
                if (Array.isArray(data[0]) && typeof data[0][0] === 'string') return data[0][0];
                if (typeof data[0] === 'string') return data[0];
            }
            return null;
        }
    ];

    for (const attempt of attempts) {
        try {
            const result = await attempt();
            if (result) {
                const restored = restoreUrls(result, preservedUrls);
                console.log(`🌍 [TRANS] OK (${text.length} chars) -> ${target}: "${restored.substring(0, 60)}"`);
                return restored;
            }
        } catch (err) {
            console.warn(`🌍 [TRANS] Attempt failed: ${err.message}`);
        }
    }

    console.error(`🌍 [TRANS] All endpoints failed for target: ${target}`);
    return text; // Return original as last resort
};
