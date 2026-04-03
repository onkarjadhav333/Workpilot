const nodemailer = require('nodemailer');

// ─── Create transporter (Gmail) ───────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  //Force IPv4 — Render doesn't support IPv6 outbound
  family: 4,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
});

// ─── Verify connection on startup ─────────────────────────
transporter.verify((error) => {
  if (error) {
    console.error('❌ Gmail connection failed:', error.message);
  } else {
    console.log('✅ Gmail ready to send emails');
  }
});

// ─── Reusable send function ───────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"Workpilot" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;