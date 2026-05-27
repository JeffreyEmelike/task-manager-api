import nodemailer from "nodemailer";

//Create reusable transporter using Resend SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 465,
  secure: true,
  auth: {
    user: "resend",
    pass: process.env.RESEND_API_KEY,
  },
});

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (payload: EmailPayload): Promise<void> => {
  await transporter.sendMail({
    from: "TaskManager <noreply@yourdomain.com>",
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
};
