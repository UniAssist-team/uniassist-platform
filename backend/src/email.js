import nodemailer from "nodemailer";

const SMTP_HOST = "sandbox.smtp.mailtrap.io";
const SMTP_PORT = 2525;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

export const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD
  }
});

/**
 * @param {string} to
 * @param {string} token
 */
export async function sendResetEmail(to, token) {
  await transport.sendMail({
    from: "noreply@uniassist.local",
    to,
    subject: "Reset your UniAssist password",
    text:
      `Use this token to reset your password: ${token}\n\n` +
      `It expires in 1 hour. If you didn't request a reset, ignore this email.`,
  });
}
