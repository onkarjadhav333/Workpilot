const nodemailer = require('nodemailer');

// ─── Brevo SMTP Relay ─────────────────────────────────────
// Uses Brevo's own SMTP server (not Gmail)
// Brevo's SMTP relay works on Render ✅
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',   // ← Brevo's SMTP server
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,  // a73ba1001@smtp-brevo.com
    pass: process.env.BREVO_SMTP_KEY     // the SMTP key you generate
  }
});

// ─── Verify on startup ────────────────────────────────────
transporter.verify((error) => {
  if (error) {
    console.error('❌ Brevo SMTP failed:', error.message);
  } else {
    console.log('✅ Brevo SMTP ready to send emails');
  }
});

// ─── Reusable send function ───────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"Workpilot" <${process.env.BREVO_SENDER_EMAIL}>`,
    to,
    subject,
    html
  };
  await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent to ${to}`);
};

module.exports = sendEmail;