// import twillo from "twilio"

// // twillo credentials: 
// const TWILLO_AUTH_TOKEN = process.env.TWILLO_AUTH_TOKEN
// const TWILLO_SERVICE_SID = process.env.TWILLO_SERVICE_SID
// const TWILLO_ACC_SID = process.env.TWILLO_ACC_SID

// // // to check twillo account credentials:
// // console.log("TWILLO_ACC_SID set:", !!process.env.TWILLO_ACC_SID);
// // console.log("TWILLO_AUTH_TOKEN set:", !!process.env.TWILLO_AUTH_TOKEN);
// // console.log("TWILLO_SERVICE_SID set:", !!process.env.TWILLO_SERVICE_SID);



// const client = twillo(TWILLO_ACC_SID, TWILLO_AUTH_TOKEN)

// export const sendOtpToPhoneNumber = async (phoneNumber) => {
//     try {
//         console.log(`otp sending to this phone number: ${phoneNumber}`);
//         if (!phoneNumber) {
//             throw new Error("phoneNumber is required.")
//         }

//         const response = await client.verify.v2.services(TWILLO_SERVICE_SID).verifications.create({
//             to: phoneNumber,
//             channel: "sms"
//         })
//         console.log("this is my otp response:", response);
//         // console.log(response);
//         return response;
//     } catch (error) {
//         console.error(error.message);
//         throw new Error("failed to send otp.");
//     }
// }

// export const verifyOtp = async (phoneNumber, otp) => {
//     try {
//         console.log(`this is my phone number: ${phoneNumber}`);
//         console.log(`this is my otp : ${otp}`);
//         if (!phoneNumber) {
//             throw new Error("phoneNumber is required.")
//         }

//         const response = await client.verify.v2.services(TWILLO_SERVICE_SID).verificationChecks.create({
//             to: phoneNumber,
//             code: otp
//         })
//         console.log("this is my otp response: ", response);
//         return response;
//     } catch (error) {
//         console.error(error);
//         throw new Error("otp is failed.");
//     }
// }
// // export default { sendOtpToPhoneNumber, verifyOtp }





















// services/twilloService.js
import twilio from "twilio";

const TWILLO_AUTH_TOKEN = process.env.TWILLO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
const TWILLO_SERVICE_SID = process.env.TWILLO_SERVICE_SID || process.env.TWILIO_SERVICE_SID;
const TWILLO_ACC_SID = process.env.TWILLO_ACC_SID || process.env.TWILIO_ACC_SID;

if (!TWILLO_ACC_SID || !TWILLO_AUTH_TOKEN || !TWILLO_SERVICE_SID) {
    // fail fast: throw at startup or at least log clearly
    console.error("Twilio credentials are missing. Make sure TWILLO_ACC_SID, TWILLO_AUTH_TOKEN, TWILLO_SERVICE_SID are set in your .env");
    // optionally: throw new Error("Twilio credentials missing");
}

console.log(
    TWILLO_ACC_SID,
    TWILLO_AUTH_TOKEN,
    TWILLO_SERVICE_SID
)

const client = twilio(TWILLO_ACC_SID, TWILLO_AUTH_TOKEN);

export const sendOtpToPhoneNumber = async (phoneNumber) => {
    try {
        if (!phoneNumber) {
            throw new Error("phoneNumber is required.");
        }
        console.log(`otppp sending to this phone number: ${phoneNumber}`);
        const response = await client.verify.v2
            .services(TWILLO_SERVICE_SID)
            .verifications.create({ to: phoneNumber, channel: "sms" });

        console.log("twilio verify response:", response);
        return response;
    } catch (error) {
        // Twilio error objects have useful fields: status, code, moreInfo, message
        console.error("Twilio sendOtp error:", {
            message: error?.message,
            status: error?.status,
            code: error?.code,
            moreInfo: error?.moreInfo,
            raw: error,
        });
        // rethrow full error so controller can inspect .status/.message etc
        throw error;
    }
};

export const verifyOtp = async (phoneNumber, otp) => {
    try {
        if (!phoneNumber) throw new Error("phoneNumber is required.");
        if (!otp) throw new Error("otp is required.");

        const response = await client.verify.v2
            .services(TWILLO_SERVICE_SID)
            .verificationChecks.create({ to: phoneNumber, code: otp });

        console.log("twilio verify-check response:", response);
        return response;
    } catch (error) {
        console.error("Twilio verifyOtp error:", {
            message: error?.message,
            status: error?.status,
            code: error?.code,
            moreInfo: error?.moreInfo,
            raw: error,
        });
        throw error;
    }
};
