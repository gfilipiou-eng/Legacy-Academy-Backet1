import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
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

    // Fallback for FormData with user object
    let user = req.body.user;
    if (user) {
        if (typeof user === 'string') {
            try { user = JSON.parse(user); } catch (e) { }
        }
        req.user = {
            id: user._id || user.id || user.userId,
            userId: user._id || user.id || user.userId,
            username: user.username,
            role: user.role || 'User'
        };
        return next();
    }

    // Allow GET requests without auth
    if (req.method === "GET") return next();

    res.status(401).json({ message: "You are not authenticated!" });
};
