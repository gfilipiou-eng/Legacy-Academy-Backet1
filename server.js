import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Load environment variables FIRST!
// Load environment variables FIRST!
dotenv.config();

// Auto-enable request dump on startup for quick debugging when explicitly opted-in.
// Set REQUEST_DUMP_AUTO=true (e.g., in Render env) and the server will enable
// REQUEST_DUMP=true and default REQUEST_DUMP_TTL_MINUTES=5 (unless you set a different TTL).
if (process.env.REQUEST_DUMP_AUTO === 'true') {
  if (!process.env.REQUEST_DUMP) process.env.REQUEST_DUMP = 'true';
  if (!process.env.REQUEST_DUMP_TTL_MINUTES && !process.env.REQUEST_DUMP_EXPIRES_AT) process.env.REQUEST_DUMP_TTL_MINUTES = '5';
  console.warn(`🔧 REQUEST_DUMP_AUTO enabled: REQUEST_DUMP=true, TTL=${process.env.REQUEST_DUMP_TTL_MINUTES} minute(s)`);
}

console.log("🟢 Server initialization started...");
console.log("Environment: ", process.env.NODE_ENV || 'production');
console.log("Port: ", process.env.PORT || 5000);

// Verify Cloudinary Config
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("⚠️  WARNING: Cloudinary configuration is missing in .env. Falling back to local storage.");
}

import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import userRoutes from "./routes/users.js";
import resetPasswordRoutes from "./routes/resetPassword.js";

// Import email service AFTER dotenv.config() - non-critical
console.log("Loading email service...");
import "./config/email.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CACHE CONTROL - Prevent Cloudflare caching of API responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Test Route
app.get("/", (req, res) => {
  res.status(200).json({ status: "Backend is ALIVE ✅", timestamp: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", deployed: "v4-final-fix" });
});

// DIAGNOSTIC LOGGING - All requests logged for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  // Simple request-id for correlation
  try {
    req.requestId = crypto.randomBytes(6).toString('hex');
  } catch (e) {
    req.requestId = (Date.now()).toString(36);
  }
  res.set('X-Request-Id', req.requestId);
  console.log(`📡 [${timestamp}] [${req.requestId}] ${req.method} ${req.originalUrl} - V4 DEPLOY`);
  if (req.method !== 'GET') {
    console.log(`   [${req.requestId}] Headers:`, {
      auth: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type'],
      origin: req.headers.origin
    });
  }
  next();
});

// TEMP: Request dump middleware (short-lived). Enable with env var REQUEST_DUMP=true or set header X-Debug-Requests: 1
// Use with care - may log PII. Will be removed after debugging.
app.use((req, res, next) => {
  // Initialize cached expiry on first invocation (so TTL is calculated at startup/runtime set)
  if (typeof global.__reqDumpExpiry === 'undefined') {
    if (process.env.REQUEST_DUMP_TTL_MINUTES) {
      const mins = parseInt(process.env.REQUEST_DUMP_TTL_MINUTES, 10);
      global.__reqDumpExpiry = isNaN(mins) ? null : Date.now() + mins * 60000;
      if (global.__reqDumpExpiry) console.warn(`🔒 Request dump enabled for ${mins} minute(s); will expire at ${new Date(global.__reqDumpExpiry).toISOString()}`);
    } else if (process.env.REQUEST_DUMP_EXPIRES_AT) {
      const t = Date.parse(process.env.REQUEST_DUMP_EXPIRES_AT);
      global.__reqDumpExpiry = isNaN(t) ? null : t;
      if (global.__reqDumpExpiry) console.warn(`🔒 Request dump will expire at ${new Date(global.__reqDumpExpiry).toISOString()}`);
    } else {
      global.__reqDumpExpiry = null; // no expiry configured
      if (process.env.REQUEST_DUMP === 'true') console.warn('🔒 Request dump enabled indefinitely (no TTL configured)');
    }
  }

  const headerEnabled = req.headers['x-debug-requests'] === '1';
  const envEnabled = process.env.REQUEST_DUMP === 'true';
  const now = Date.now();

  // If TTL expired, turn off env flag for runtime (but allow header override)
  if (global.__reqDumpExpiry && now > global.__reqDumpExpiry) {
    if (envEnabled) {
      console.warn(`🔒 Request dump expired at ${new Date(global.__reqDumpExpiry).toISOString()}; disabling env flag for runtime.`);
      process.env.REQUEST_DUMP = 'false';
    }
    if (!headerEnabled) return next();
  }

  const enabled = envEnabled || headerEnabled;
  if (!enabled) return next();

  const reqId = req.requestId || (Date.now()).toString(36);

  // Mask sensitive headers
  const safeHeaders = { ...req.headers };
  if (safeHeaders.authorization) {
    safeHeaders.authorization = String(safeHeaders.authorization).replace(/(Bearer\s+)(.+)/i, '$1[REDACTED]');
  }

  console.warn(`🔍 [${reqId}] REQUEST DUMP -> ${req.method} ${req.originalUrl}`);
  console.warn(`🔍 [${reqId}] Headers:`, safeHeaders);

  if (req.body) {
    try {
      const preview = typeof req.body === 'object' ? JSON.stringify(req.body, null, 2).slice(0, 2000) : String(req.body).slice(0,2000);
      console.warn(`🔍 [${reqId}] Body Preview:`, preview);
    } catch (e) {
      console.warn(`🔍 [${reqId}] Body serialize failed:`, e && e.message);
    }
  }

  if (global.__reqDumpExpiry) res.set('X-Debug-Expires', new Date(global.__reqDumpExpiry).toISOString());
  res.set('X-Debug-Dumped', '1');
  next();
});


app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/reset-password", resetPasswordRoutes);

// Static Uploads Serving (For Local Storage Fallback)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'))); // Alias for compatibility

// Global Error Handler
app.use((err, req, res, next) => {
  const reqId = req?.requestId || 'no-id';
  console.error(`🔥 SERVER ERROR [${reqId}]:`, (err && (err.stack || err.message)) || err);
  if (err && err.message && err.message.includes('Cloudinary')) {
    res.set('X-Request-Id', reqId);
    return res.status(500).json({ message: 'System Error: Image upload service not configured.', requestId: reqId });
  }
  res.set('X-Request-Id', reqId);
  res.status(500).json({
    message: err.message || "An unexpected system error occurred",
    requestId: reqId,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// MongoDB Connection
const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    console.warn("⚠️ WARNING: MONGO_URL is not set. Database connection skipped.");
    return;
  }

  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.warn("⚠️ MongoDB Connection Error (non-fatal):", err.message);
    console.warn("   Server will still run without database connection");
  }
};

// Start connection but don't block server startup
connectDB().catch(err => console.warn("DB connection error:", err.message));

// Start Server
const PORT = process.env.PORT || 5000;

console.log("🟡 Starting Express server on port", PORT);

try {
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT} 🚀`);
    console.log(`📍 Backend URL: https://legacy-academy-backet1.onrender.com`);
    console.log(`🌐 Server started - accepting connections`);
    console.log(`📌 Test: curl http://localhost:${PORT}/api/health`);

    // KEEP-ALIVE: Self-ping every 10 minutes to prevent Render from sleeping
    // Delayed by 5 seconds to avoid early startup issues
    setTimeout(() => {
      setInterval(() => {
        try {
          const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
          axios.get(baseUrl, { timeout: 5000 })
            .then(() => console.log("⚡ Keep-Alive: Server is awake"))
            .catch(() => { }); // Silently fail if server is down
        } catch (err) {
          // Silently fail
        }
      }, 600000); // 600,000ms = 10 minutes
    }, 5000);
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error("🔥 Server error:", (err && (err.stack || err)) || err);
    process.exit(1);
  });

  // Process-level handlers to capture unexpected failures
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 UNHANDLED REJECTION:', reason && (reason.stack || reason));
  });
  process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', err && (err.stack || err));
    // Note: consider exiting process to allow a restart in production
  });
} catch (err) {
  console.error("🔴 Failed to start server:", err.message);
  console.error(err.stack);
  process.exit(1);
}
