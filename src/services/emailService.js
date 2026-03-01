import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: false, // true for 465, false for 587
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Send a 6-digit OTP email.
 * @param {string} to   — recipient email
 * @param {string} otp  — the 6-digit code
 * @param {"signup"|"login"} purpose
 */
export async function sendOtpEmail(to, otp, purpose = "signup") {
  const subject =
    purpose === "signup"
      ? "Verify your email — Vybe"
      : "Your login OTP — Vybe";

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:36px;background:linear-gradient(135deg,#f8fafc,#eef2ff);border-radius:18px;color:#1e293b;box-shadow:0 15px 40px rgba(99,102,241,0.08);">
      
  <div style="text-align:center;margin-bottom:28px;">
    <h1 style="margin:0;font-size:30px;font-weight:700;background:linear-gradient(135deg,#6366f1,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
      Vybe ✨
    </h1>
  </div>

  <p style="font-size:15px;color:#475569;margin-bottom:16px;text-align:center;line-height:1.6;">
    ${purpose === "signup" ? "Welcome! Use this code to verify your email:" : "Use this code to sign in:"}
  </p>

  <div style="text-align:center;margin:30px 0;">
    <span style="display:inline-block;font-size:38px;font-weight:800;letter-spacing:14px;padding:18px 40px;background:#ffffff;border:2px solid #e0e7ff;border-radius:14px;color:#4f46e5;box-shadow:0 8px 25px rgba(99,102,241,0.15);">
      ${otp}
    </span>
  </div>

  <p style="font-size:13px;color:#64748b;margin-top:24px;text-align:center;line-height:1.6;">
    This code expires in <strong style="color:#111827;">10 minutes</strong>. If you didn't request this, ignore this email.
  </p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />

  <p style="font-size:12px;color:#94a3b8;text-align:center;letter-spacing:0.4px;">
    Vybe — Where your conversations come alive
  </p>

</div>
  `;

  const info = await transporter.sendMail({
    from: `"Vybe" <no-reply@vybechat.com>`,
    to,
    subject,
    html,
  });

  console.log(`📧 OTP email sent to ${to}: ${info.messageId}`);
  return info;
}
