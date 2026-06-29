import axios from "axios";

export const getSafeToken = () => {
    let t = window.__AUTH_TOKEN__;
    if (!t || t === "undefined" || t === "null") {
        try { t = localStorage.getItem("token"); } catch(e) {}
    }
    if (!t || t === "undefined" || t === "null") {
        const match = document.cookie.match(/(^| )legacy_token=([^;]+)/);
        if (match) t = match[2];
    }
    if (t === "undefined" || t === "null") t = null;
    window.__AUTH_TOKEN__ = t;
    return t;
};

export const setSafeToken = (token) => {
    window.__AUTH_TOKEN__ = token;
    try { document.cookie = `legacy_token=${token}; path=/; max-age=31536000`; } catch(e) {}
    try { localStorage.setItem("token", token); } catch(e) {
            try {
                localStorage.removeItem('cached_posts');
                localStorage.removeItem('cached_messages');
                localStorage.removeItem('cached_users');
                localStorage.setItem("token", token);
            } catch(err) {}
    }
};

export const removeSafeToken = () => {
    window.__AUTH_TOKEN__ = null;
    try { document.cookie = `legacy_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`; } catch(e) {}
    try { localStorage.removeItem("token"); } catch(e) {}
};

const API = axios.create({
    baseURL: "https://legacy-academy-backet1.onrender.com/api",
});

API.interceptors.request.use((config) => {
    const token = getSafeToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
