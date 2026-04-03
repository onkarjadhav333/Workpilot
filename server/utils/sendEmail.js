const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  const { error } = await resend.emails.send({
    from: 'Workpilot <onboarding@resend.dev>', // ← use this until you verify a domain
    to,
    subject,
    html
  });

  if (error) {
    console.error('❌ Email failed:', error);
    throw new Error(error.message);
  }

  console.log(`✅ Email sent to ${to}`);
};

module.exports = sendEmail;