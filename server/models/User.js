const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId && !this.githubId && !this.facebookId;
    }
  },
  googleId:   String,
  githubId:   String,
  facebookId: String,
  avatar:     String,

  role: {
    type: String,
    enum: ['admin', 'employee'],
    default: 'employee'
  },

  // ─── Email Verification ───────────────────────────────
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpiry: {
    type: Date,
    default: null
  },

  // ─── Password Reset ───────────────────────────────────
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiry: {
    type: Date,
    default: null   // expires in 1 hour
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);