import nodemailer from 'nodemailer';

// Configuração do Transporter (Gmail, Outlook, Resend, etc.)
// No Vercel, adicione as variáveis: SMTP_HOST, SMTP_USER, SMTP_PASS
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com', // Default para Gmail
  port: 587,
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER, // Ex: seu.email@gmail.com
    pass: process.env.SMTP_PASS, // Ex: senha de aplicativo (App Password)
  },
});

export async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ SMTP não configurado. O email não será enviado real, apenas logado.");
    console.log(`[EMAIL MOCK] Para: ${to} | Assunto: ${subject}`);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"MeConta Financeiro" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Email enviado: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}