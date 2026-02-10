import axios from "axios";

const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const BASE_URL = isLocal ? "http://localhost:5000/api" : "https://legacy-academy-backet1.onrender.com/api";

const API = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
