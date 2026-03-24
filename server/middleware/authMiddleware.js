const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // ─── Step 1: Find token (header or cookie) ──────────────
  const token = req.header('x-auth-token') || req.cookies?.token;

  if (!token)
    return res.status(401).json({ msg: 'Access denied. No token provided.' });

  // ─── Step 2: Verify token ────────────────────────────────
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role } now available in all route handlers
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Session expired. Please log in again.'
      : 'Invalid token. Authorization denied.';

    res.status(401).json({ msg });
  }
};