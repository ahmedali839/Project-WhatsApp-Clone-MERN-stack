// import nodemailer from "nodemailer"
// import dotenv from "dotenv"
// dotenv.config()



// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     host: 'localhost:5173',
//     port: 587,
//     auth: {
//         user: process.env.EMAIL_NAME,
//         pass: process.env.EMAIL_PASS
//     }
// })

// transporter.verify((error, success) => {
//     if (error) {
//         console.log("Gmail services connection failed...");
//     } else {
//         console.log("Gmail services connection Successfully working");
//     }
// });

// const sendOtpToEmail = async (email, otp) => {
//     console.log("running before inside sentotptoemail")

//     const html = `
//     <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
//       <h2 style="color: #075e54;">🔐 WhatsApp Web Verification</h2>

//       <p>Hi there,</p>

//       <p>Your one-time password (OTP) to verify your WhatsApp Web account is:</p>

//       <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">
//         ${otp}
//       </h1>

//       <p><strong>This OTP is valid for the next 5 minutes.</strong> Please do not share this code with anyone.</p>

//       <p>If you didn’t request this OTP, please ignore this email.</p>

//       <p style="margin-top: 20px;">Thanks & Regards,<br/>WhatsApp Web Security Team</p>

//       <hr style="margin: 30px 0;" />

//       <small style="color: #777;">This is an automated message. Please do not reply.</small>
//     </div>
//   `;
//     await transporter.sendMail({
//         from: `whatsapp with ${process.env.EMAIL_NAME}`,
//         to: email,
//         subject: "User Whatsapp verification code",
//         html
//     })
//     console.log("running after inside sentotptoemail")

// }

// export default sendOtpToEmail; 















// Filename: emailService.js (or similar)

import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// --- Nodemailer Transporter Configuration ---
// This configuration connects to the standard Gmail SMTP server over Port 587 (STARTTLS).
const transporter = nodemailer.createTransport({
    // Using 'service' can sometimes simplify configuration, but using 'host' and 'port' is often more explicit and reliable.
    // We'll replace 'service: "gmail"' with the specific host for better control.
    host: 'smtp.gmail.com', // ⬅️ CORRECTED: Use the actual SMTP server for sending emails
    port: 587,              // ⬅️ CORRECTED: Standard port for STARTTLS
    secure: false,          // ⬅️ CRUCIAL: Must be false for port 587 (uses STARTTLS)
    auth: {
        user: process.env.EMAIL_NAME,
        // Remember to use an App Password if you have 2FA enabled on your Google account!
        pass: process.env.EMAIL_PASS
    },
    // Adding a timeout can help prevent endless waiting, though ETIMEDOUT usually means a firewall issue.
    // Optional: timeout: 10000 
});

// Verification to check if the connection to the SMTP server is successful
transporter.verify((error, success) => {
    if (error) {
        // This will now log if the connection fails due to auth or network issues.
        console.error("Gmail services connection failed:", error.message);
    } else {
        console.log("Gmail services connection Successfully working (Ready to send emails)");
    }
});

/**
 * Sends a one-time password (OTP) to the specified email address.
 * @param {string} email - The recipient's email address.
 * @param {string} otp - The one-time password.
 */
const sendOtpToEmail = async (email, otp) => {
    console.log("Attempting to send OTP via email...");

    const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #075e54;">🔐 WhatsApp Web Verification</h2>
      <p>Hi there,</p>
      <p>Your one-time password (OTP) to verify your WhatsApp Web account is:</p>
      <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">
        ${otp}
      </h1>
      <p><strong>This OTP is valid for the next 5 minutes.</strong> Please do not share this code with anyone.</p>
      <p>If you didn’t request this OTP, please ignore this email.</p>
      <p style="margin-top: 20px;">Thanks & Regards,<br/>WhatsApp Web Security Team</p>
      <hr style="margin: 30px 0;" />
      <small style="color: #777;">This is an automated message. Please do not reply.</small>
    </div>
  `;

    try {
        const info = await transporter.sendMail({
            from: `WhatsApp Security <${process.env.EMAIL_NAME}>`, // Improved 'from' field format
            to: email,
            subject: "User WhatsApp Verification Code",
            html: html
        });
        console.log("OTP Email sent successfully. Message ID:", info.messageId);
    } catch (error) {
        // Log the actual error when sending fails
        console.error("Server error: Failed to send email.", error);
        // Important: Re-throw the error so the calling function can handle it
        throw new Error("Failed to send OTP email.");
    }
};

export default sendOtpToEmail;