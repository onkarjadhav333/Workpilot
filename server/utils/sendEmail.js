const nodemailer = require('nodemailer');
const dns = require('dns');

// Force IPv4 for DNS lookups
dns.setDefaultResultOrder('ipv4first');

// ─── Create transporter (Gmail) ───────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS  // App Password
  }
});

// ─── Verify on startup ────────────────────────────────────
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
  console.log(`✅ Email sent to ${to}`);
};

module.exports = sendEmail;