import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const verified = jwt.verify(token, process.env.JWT_SECRET || 'legacysecret123');

            // Check if user is banned (Real-time enforcement)
            const user = await User.findById(verified.id).select('isBanned banExpires');
            if (user?.isBanned && user.banExpires && new Date() < user.banExpires) {
                return res.status(403).json({ message: "MISSION ABORTED: Your access is suspended." });
            }

            req.user = {
                id: verified.id,
                userId: verified.id,
                username: verified.username,
                role: verified.role || 'User'
            };
            return next();
        }

        // Fallback for FormData / Body with optional chaining
        const userObj = req.body?.user;
        if (userObj) {
            let user = userObj;
            if (typeof user === 'string') {
                try { user = JSON.parse(user); } catch (e) { }
            }
            const id = user?._id || user?.id || user?.userId;
            if (id) {
                req.user = { id, userId: id, username: user?.username, role: user?.role || 'User' };
                return next();
            }
        }

        if (req.method !== "GET") {
            return res.status(401).json({ message: "Neural handshake failed. Please login." });
        }
        next();
    } catch (err) {
        if (req.method === "GET") return next();
        console.error("🔥 AUTH ERROR:", err.message);
        res.status(401).json({ message: "Authentication expired or invalid." });
    }
};
