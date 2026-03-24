// ─── Verification Email ───────────────────────────────────
const verificationEmail = (name, verifyUrl) => ({
  subject: 'Verify your Task Manager account',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #111827;">Hi ${name} 👋</h2>
      <p style="color: #4b5563;">Thanks for registering! Please verify your email to activate your account.</p>
      <a href="${verifyUrl}" 
         style="display: inline-block; margin-top: 16px; padding: 12px 24px; background-color: #4f46e5; color: white; border-radius: 6px; text-decoration: none; font-weight: bold;">
        Verify Email
      </a>
      <p style="margin-top: 24px; color: #9ca3af; font-size: 13px;">This link expires in 24 hours. If you didn't register, ignore this email.</p>
    </div>
  `
});

// ─── Task Assignment Email ────────────────────────────────
const taskAssignedEmail = (name, taskTitle, projectName, priority) => ({
  subject: `New Task Assigned: ${taskTitle}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #111827;">Hi ${name} 👋</h2>
      <p style="color: #4b5563;">A new task has been assigned to you:</p>
      <div style="margin-top: 16px; padding: 16px; background-color: #f9fafb; border-radius: 6px;">
        <p style="margin: 0;"><strong>Task:</strong> ${taskTitle}</p>
        <p style="margin: 8px 0 0;"><strong>Project:</strong> ${projectName}</p>
        <p style="margin: 8px 0 0;"><strong>Priority:</strong> 
          <span style="color: ${priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#22c55e'}">
            ${priority}
          </span>
        </p>
      </div>
      <p style="margin-top: 24px; color: #9ca3af; font-size: 13px;">Login to your Task Manager account to view the details.</p>
    </div>
  `
});


// ─── Forgot Password Email ────────────────────────────────
const forgotPasswordEmail = (name, resetUrl) => ({
  subject: 'Reset your Task Manager password',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #111827;">Hi ${name} 👋</h2>
      <p style="color: #4b5563;">We received a request to reset your password. Click the button below to set a new one.</p>
      <a href="${resetUrl}" 
         style="display: inline-block; margin-top: 16px; padding: 12px 24px; background-color: #4f46e5; color: white; border-radius: 6px; text-decoration: none; font-weight: bold;">
        Reset Password
      </a>
      <p style="margin-top: 24px; color: #9ca3af; font-size: 13px;">This link expires in 1 hour. If you didn't request a password reset, ignore this email — your password won't change.</p>
    </div>
  `
});

module.exports = { verificationEmail, taskAssignedEmail, forgotPasswordEmail };