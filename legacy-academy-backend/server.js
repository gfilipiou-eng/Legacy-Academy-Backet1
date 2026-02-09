import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoute from "./routes/users.js";
import authRoute from "./routes/auth.js";
import postRoute from "./routes/posts.js";
import messageRoute from "./routes/messages.js"; // New route file needed
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Load env vars
dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json()); // Essential for parsing JSON bodies
app.use(cors());

// DB Connection
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));

// Routes
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/messages", messageRoute);

// Serve static assets if in production
// app.use(express.static(path.join(__dirname, "/client/build")));
// app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "/client/build", "index.html"));
// });

app.listen(process.env.PORT || 8800, () => {
    console.log("Backend server is running! V5-LEGACY-SYNC");
});
