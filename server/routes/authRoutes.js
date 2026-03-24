const express = require("express");
const router = express.Router();
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const auth = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');
const { verificationEmail, forgotPasswordEmail } = require('../utils/emailTemplates');

// ─── Cookie Config ────────────────────────────────────────
// Switches automatically based on NODE_ENV
const cookieConfig = {
  httpOnly: true,  // JS can never read this cookie (XSS protection)
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure:   process.env.NODE_ENV === 'production' ? true   : false,
};

// ─── Rate Limiters ────────────────────────────────────────

// Login: track by EMAIL so VPN switching doesn't help attacker
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // relaxed in dev
  skipSuccessfulRequests: true, // only count failed attempts
  keyGenerator: (req) => req.body.email || ipKeyGenerator(req), // track by email, fallback to IPv6-safe IP
  message: { msg: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

// Register: track by IP — emails can be faked endlessly
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 15 : 100, // relaxed in dev
  message: { msg: "Too many accounts created. Please try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false
});

// ─── Validation Rules ─────────────────────────────────────
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),

  body('password')
    .notEmpty().withMessage('Password is required')
];

// ─── Validation Helper ────────────────────────────────────
// Call this at the top of any route to check validation results
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return first error message only — clean UX
    return res.status(400).json({ msg: errors.array()[0].msg });
  }
  return null;
};

// ─── OAUTH TRIGGERS ───────────────────────────────────────

router.get("/google", (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.BACKEND_URL}/auth/google/callback&response_type=code&scope=profile email`;
  res.redirect(url);
});

router.get("/github", (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.BACKEND_URL}/auth/github/callback&scope=user:email`;
  res.redirect(url);
});

router.get("/facebook", (req, res) => {
  const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${process.env.BACKEND_URL}/auth/facebook/callback&scope=email`;
  res.redirect(url);
});

// ─── OAUTH CALLBACKS ──────────────────────────────────────
// OAuth users skip verification — provider already confirmed email

router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.BACKEND_URL}/auth/google/callback`
    });

    const { access_token } = tokenRes.data;
    const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { email, name, picture, id } = userRes.data;
    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) { user.googleId = id; user.avatar = picture; await user.save(); }
    } else {
      user = await User.create({ name, email, googleId: id, avatar: picture, role: 'employee', isVerified: true });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, cookieConfig); // ✅ using cookieConfig
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (err) {
    res.status(500).send("Google Login Failed");
  }
});

router.get("/github/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const tokenRes = await axios.post("https://github.com/login/oauth/access_token", {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    }, { headers: { Accept: "application/json" } });

    const accessToken = tokenRes.data.access_token;
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const { id, login, avatar_url, email } = userRes.data;
    const userEmail = email || `${login}@github.user`;

    let user = await User.findOne({ email: userEmail });
    if (user) {
      if (!user.githubId) { user.githubId = id; user.avatar = avatar_url; await user.save(); }
    } else {
      user = await User.create({ name: login, email: userEmail, githubId: id, avatar: avatar_url, role: 'employee', isVerified: true });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, cookieConfig); // ✅ using cookieConfig
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (err) {
    res.status(500).send("GitHub Login Failed");
  }
});

router.get("/facebook/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const tokenRes = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        client_id: process.env.FACEBOOK_CLIENT_ID,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET,
        redirect_uri: `${process.env.BACKEND_URL}/auth/facebook/callback`,
        code
      }
    });

    const accessToken = tokenRes.data.access_token;
    const userRes = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);

    const { id, name, email, picture } = userRes.data;
    let user = await User.findOne({ email });

    if (user) {
      if (!user.facebookId) { user.facebookId = id; user.avatar = picture?.data?.url; await user.save(); }
    } else {
      user = await User.create({ name, email, facebookId: id, avatar: picture?.data?.url, role: 'employee', isVerified: true });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, cookieConfig); // ✅ using cookieConfig
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (err) {
    res.status(500).send("Facebook Login Failed");
  }
});

// ─── REGISTER ─────────────────────────────────────────────
router.post("/register",
  registerLimiter,       // ✅ rate limit first
  registerValidation,    // ✅ then validate inputs
  async (req, res) => {
    // Check validation result
    const error = validate(req, res);
    if (error) return;

    const { name, email, password } = req.body;
    try {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ msg: "User already exists" });

      const verificationToken = crypto.randomBytes(32).toString('hex');

      const user = new User({
        name,
        email,
        role: 'employee', // ✅ always employee — never from frontend
        isVerified: false,
        verificationToken,
        verificationTokenExpiry: Date.now() + 24 * 60 * 60 * 1000
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      const verifyUrl = `${process.env.BACKEND_URL}/auth/verify/${verificationToken}`;
      const { subject, html } = verificationEmail(name, verifyUrl);
      await sendEmail({ to: email, subject, html });

      res.status(201).json({ msg: "Registration successful! Please check your email to verify your account." });
    } catch (err) {
      console.error("Register error:", err.message);
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

// ─── VERIFY EMAIL ─────────────────────────────────────────
router.get("/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.redirect(`${process.env.CLIENT_URL}/?verified=false`);

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    res.redirect(`${process.env.CLIENT_URL}/?verified=true`);
  } catch (err) {
    console.error("Verify error:", err.message);
    res.redirect(`${process.env.CLIENT_URL}/?verified=false`);
  }
});

// ─── LOGIN ────────────────────────────────────────────────
router.post("/login",
  loginLimiter,       // ✅ rate limit first
  loginValidation,    // ✅ then validate inputs
  async (req, res) => {
    // Check validation result
    const error = validate(req, res);
    if (error) return;

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user || !user.password) return res.status(400).json({ msg: "Invalid Credentials" });

      if (!user.isVerified) return res.status(403).json({ msg: "Please verify your email before logging in." });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.cookie("token", token, cookieConfig); // ✅ using cookieConfig
      res.json({ user: { id: user._id, name: user.name, role: user.role } });
    } catch (err) {
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

// ─── GET CURRENT USER ─────────────────────────────────────
router.get("/me", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ msg: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password -verificationToken -verificationTokenExpiry");
    res.json({ user });
  } catch (err) {
    res.status(401).json({ msg: "Invalid Token" });
  }
});

// ─── LOGOUT ───────────────────────────────────────────────
router.get("/logout", (req, res) => {
  res.clearCookie("token", cookieConfig); // ✅ must use same config to clear
  res.json({ msg: "Logged out" });
});

// ─── GET ALL USERS (Admin only) ───────────────────────────
router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ msg: "Access denied" });
    const users = await User.find().select('name email _id role');
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});

// ─── PROMOTE USER ROLE (Admin only) ──────────────────────
router.put('/users/:id/role', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ msg: "Access denied. Admins only." });

    const { role } = req.body;

    if (!['admin', 'employee'].includes(role))
      return res.status(400).json({ msg: "Invalid role." });

    if (req.user.id === req.params.id)
      return res.status(400).json({ msg: "You cannot change your own role." });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { returnDocument: 'after' }
    ).select('name email role');

    if (!user) return res.status(404).json({ msg: "User not found." });

    res.json({ msg: `${user.name} is now ${role}`, user });
  } catch (err) {
    console.error("Promote user error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

// ─── FORGOT PASSWORD ──────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    // Always return success even if email not found
    // prevents email enumeration attack
    if (!user) return res.json({ msg: "If that email exists, a reset link has been sent." });

    // Generate reset token — same pattern as email verification
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const { subject, html } = forgotPasswordEmail(user.name, resetUrl);
    await sendEmail({ to: email, subject, html });

    res.json({ msg: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

// ─── RESET PASSWORD ───────────────────────────────────────
router.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;
  try {
    // Validate password length
    if (!password || password.length < 6)
      return res.status(400).json({ msg: "Password must be at least 6 characters" });

    // Find user with valid unexpired token
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ msg: "Invalid or expired reset link." });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clean up reset token fields
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ msg: "Password reset successful! You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;