import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");

        if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            try {
                const verified = jwt.verify(token, process.env.JWT_SECRET || 'legacysecret123');
                req.user = {
                    id: verified.id,
                    userId: verified.id,
                    username: verified.username,
                    role: verified.role || 'User'
                };
                return next();
            } catch (err) {
                console.error("JWT verification failed:", err.message);
            }
        }

        // Fallback for FormData with user object - use optional chaining for safety
        let user = req.body?.user;
        if (user) {
            if (typeof user === 'string') {
                try { user = JSON.parse(user); } catch (e) { }
            }
            const id = user?._id || user?.id || user?.userId;
            if (id) {
                req.user = {
                    id: id,
                    userId: id,
                    username: user.username,
                    role: user.role || 'User'
                };
                return next();
            }
        }

        // If we reach here and it's not a GET request, it's definitely unauthorized
        if (req.method !== "GET") {
            return res.status(401).json({ message: "You are not authenticated!" });
        }

        // For GET requests, if no user was found, we still call next() 
        // BUT we need to be careful in the routes.
        // Actually, the best way is to let the route decide.
        next();
    } catch (error) {
        console.error("🔥 Global Auth Exception:", error.message);
        res.status(401).json({ message: "Auth interface error" });
    }
};
