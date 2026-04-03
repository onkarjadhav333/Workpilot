require("dotenv").config(); 

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// Tells Express to trust the X-Forwarded-For header from Render's proxy
app.set('trust proxy', 1);

// ─── 1. Connect to MongoDB ────────────────────────────────
connectDB();

// ─── 2. Middleware ────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// ─── 3. General Rate Limiter ──────────────────────────────
// Applies to ALL routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:100,
  message: { msg: "Too many requests. Please try again later." },
  standardHeaders: true,  // sends X-RateLimit headers in response
  legacyHeaders: false
});

app.use(generalLimiter);

// ─── 4. Routes ────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);

// ─── 5. Test Route ────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("🚀 Task management API is running...");
});

// ─── 6. Start Server ──────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
});