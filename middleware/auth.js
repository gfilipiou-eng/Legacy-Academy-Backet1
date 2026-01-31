import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    // 1. Check for real JWT first (Future proof)
    const token = req.header("Authorization");
    if (token) {
        try {
            const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET || "testsecret");
            req.user = verified;
            return next();
        } catch (err) {
            // Invalid token, fall through to check body
        }
    }

    // 2. Fallback: Check for "Frontend Mock" user object in body (For our Monster UI)
    // Our frontend sends 'user' as a JSON string inside FormData or direct JSON
    let user = req.body.user;

    if (user) {
        if (typeof user === 'string') {
            try { user = JSON.parse(user); } catch (e) { }
        }
        req.user = {
            id: user.userId,
            username: user.username,
            role: user.role
        };
        return next();
    }

    // If neither, forbid (unless it's a GET request which might be public)
    if (req.method === "GET") return next();

    res.status(401).json("You are not authenticated!");
};
