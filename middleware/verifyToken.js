import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.token;
  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Παίρνουμε το token μετά το "Bearer"
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json("Το Token δεν είναι έγκυρο!");
      req.user = user; // Προσθέτουμε τα στοιχεία του χρήστη στο request
      next();
    });
  } else {
    return res.status(401).json("Δεν είστε εξουσιοδοτημένος (No Token)!");
  }
};