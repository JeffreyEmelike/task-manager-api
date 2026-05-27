import Bull from "bull";
import { sendEmail, EmailPayload } from "../services/emailService";

// Create the queue - Bull connects to Redis automatically
export const emailQueue = new Bull<EmailPayload>("emails", {
  redis: process.env.REDIS_URL || "redis://localhost:6379",
});

// The processor - this function runs for every job in the queue
emailQueue.process(async (job) => {
  await sendEmail(job.data);
  console.log(`Email sent to ${job.data.to}`);
});

// Handle failures
emailQueue.on("failed", (job, err) => {
  console.log(`Email job failed for ${job.data.to}:`, err.message);
});
