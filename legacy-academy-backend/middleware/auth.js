import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET || "default_Legacy_Academy_Secret", (err, user) => {
            if (err) {
                console.error("[AUTH] Invalid Token:", token.substring(0, 10) + "...");
                return res.status(403).json("Token is not valid!");
            }
            req.user = user;
            next();
        });
    } else {
        return res.status(401).json("You are not authenticated!");
    }
};

export const verifyTokenAndAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'Admin' || req.user.role === 'Founder') {
            next();
        } else {
            res.status(403).json("You are not allowed to do that!");
        }
    });
};
