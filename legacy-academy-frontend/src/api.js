import axios from "axios";

// FORCE LIVE CONNECTION
// Πλέον συνδέεται ΠΑΝΤΑ στο Render για να μην έχεις θέματα με Localhost.
const API = axios.create({
    baseURL: "https://legacy-academy-backet1.onrender.com/api",
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
