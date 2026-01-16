import nodemailer from "nodemailer";
import crypto from "crypto";

export async function sendVerificationEmail(name, email) {

  const token = crypto.randomBytes(32).toString("hex");
  const verifyUrl = `${process.env.CLIENT_URL}/auth/verify-email/${token}`;

  // 3. Create transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // 4. Send mail
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Verify Your Job Hunting Account",
    html: `
      <p>Hello ${name},</p>
      <p>Please verify your account:</p>
      <a href="${verifyUrl}">Verify Email</a>
    `,
  });

  return token;
}

