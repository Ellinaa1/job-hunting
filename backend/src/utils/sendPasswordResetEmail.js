import nodemailer from "nodemailer";
import crypto from "crypto";

export async function sendPasswordResetEmail(name, email) {
  const token = crypto.randomBytes(32).toString("hex");
  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password/${token}`;

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Send mail
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Reset Your Job Hunting Password",
      html: `
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the link below:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });
    console.log(`Password reset email sent to ${email}`);
  } catch (err) {
    console.error(`Failed to send email to ${email}:`, err.message);
    throw err;
  }

  return token;
}
