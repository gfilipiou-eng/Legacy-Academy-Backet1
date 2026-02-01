import axios from "axios";

// Αν τρέχεις το site στο PC σου, μιλάει στο localhost.
// Αν το ανοίγεις από το Internet, μιλάει στο Live API του Render!
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const API = axios.create({
    baseURL: isLocalhost
        ? "http://localhost:5000/api"
        : "https://legacy-academy-backet1.onrender.com/api",
});

// Αυτό το κομμάτι στέλνει το Token σου αυτόματα σε κάθε αίτημα
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
