const Brevo = require('@getbrevo/brevo');

// ─── Initialize Brevo client ──────────────────────────────
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

// ─── Reusable send function ───────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: 'Workpilot',
      email: process.env.BREVO_SENDER_EMAIL // ← your email (any email you verify on Brevo)
    };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent to ${to}`);

  } catch (err) {
    console.error('❌ Email failed:', err.message);
    throw err;
  }
};

module.exports = sendEmail;