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

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API = axios.create({
    baseURL: isLocal ? "http://localhost:5000/api" : "https://legacy-academy-backet1.onrender.com/api",
});

API.interceptors.request.use((config) => {
    const token = getSafeToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            const url = error.config?.url || '';
            if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
                console.warn('[AUTH] Session expired or invalid token. Logging out...');
                removeSafeToken();
                try { localStorage.removeItem('user'); } catch(e) {}
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);
export const fetchBubbles = async () => {
    const response = await API.get("/bubbles");
    return response.data;
};

export const createBubble = async (text, imageFile) => {
    if (imageFile) {
        const formData = new FormData();
        formData.append("text", text);
        formData.append("image", imageFile);
        const response = await API.post("/bubbles", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    } else {
        const response = await API.post("/bubbles", { text });
        return response.data;
    }
};

export const deleteBubble = async (id) => {
    const response = await API.delete(`/bubbles/${id}`);
    return response.data;
};

export default API;
