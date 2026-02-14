import { io } from "socket.io-client";

const SOCKET_URL = "https://legacy-academy-backet1.onrender.com";

const socket = io(SOCKET_URL, {
    transports: ["polling", "websocket"],
    upgrade: true,
    pingInterval: 20000,
    pingTimeout: 10000,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5
});

// Debug logs
socket.on("connect", () => {
    console.log("🔌 [SOCKET] Connected to server:", socket.id);
});

socket.on("disconnect", (reason) => {
    console.log("🔌 [SOCKET] Disconnected:", reason);
});

socket.on("connect_error", (error) => {
    console.error("🔌 [SOCKET] Connection Error:", error);
});

export default socket;
