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
// }

// export default sendOtpToEmail; 









// Filename: emailService.js
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config(); 


// ✅ Set your SendGrid API key from environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends a one-time password (OTP) to the specified email address using SendGrid.
 * @param {string} email - The recipient's email address.
 * @param {string} otp - The one-time password.
 */
const sendOtpToEmail = async (email, otp) => {
    console.log("Attempting to send OTP via SendGrid...");

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

    const msg = {
        to: email,
        from: {
            name: "WhatsApp Web Verification",
            email: process.env.SENDER_EMAIL, // must be verified in SendGrid
        },
        subject: "User WhatsApp Verification Code",
        html: html,
    };

    try {
        const response = await sgMail.send(msg);
        console.log("✅ OTP Email sent successfully via SendGrid!");
        console.log("Response status:", response[0].statusCode);
        return response;
    } catch (error) {
        console.error("❌ Failed to send email via SendGrid:", error.response?.body || error);
        throw new Error("Failed to send OTP email.");
    }
};

export default sendOtpToEmail;
