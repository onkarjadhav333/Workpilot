const { BrevoClient } = require('@getbrevo/brevo');

// ─── Initialize Brevo client ──────────────────────────────
const client = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY
});

// ─── Reusable send function ───────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  try {
    await client.transactionalEmails.sendTransacEmail({
      sender: {
        name: 'Workpilot',
        email: process.env.BREVO_SENDER_EMAIL
      },
      to: [{ email: to }],
      subject,
      htmlContent: html
    });

    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error('❌ Email failed:', err.message);
    throw err;
  }
};

module.exports = sendEmail;