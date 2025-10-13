import otpGenerator from "../utlis/optGenerator.js";
import generateToken from "../utlis/generateToken.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import response from "../utlis/responseHandler.js";
import sendOtpToEmail from "../services/emailService.js";
import { sendOtpToPhoneNumber, verifyOtp } from "../services/twilloService.js"
import { uploadFileToCloudinary } from "../config/cloudinaryConfig.js";


// step 1: send Otp
export const sendOtp = async (req, res) => {
    const { phoneNumber, phoneSuffix, email } = req.body;
    const otp = otpGenerator();
    const expiry = new Date(Date.now() + 5 * 60 * 1000)
    let user;
    try {
        if (email) {
            user = await User.findOne({ email })

            if (!user) {
                user = new User({ email })
            }
            user.emailOtp = otp;
            user.emailOtpExpiry = expiry;
            await user.save();
            await sendOtpToEmail(email, otp);
            console.log("running after sentotptoemail")

            return response(res, 200, `otp sent successfully to your email: ${email}`)
        }
        if (!phoneNumber || !phoneSuffix) {
            return response(res, 400, "phoneNumber and phoneSuffix are required.")
        }

        const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`
        user = await User.findOne({ phoneNumber })
        if (!user) {
            user = new User({ phoneNumber, phoneSuffix })

        }

        await sendOtpToPhoneNumber(fullPhoneNumber)
        await user.save();
        return response(res, 200, "otp sent successfully to your Phone Number");
    } catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.",error)
    }
}

// step: 2 verify otp
export const verifyOtpp = async (req, res) => {
    const { phoneNumber, email, phoneSuffix, otp } = req.body;

    console.log(phoneNumber, email, phoneSuffix, otp)


    try {
        let user;
        // for email otp
        if (email) {
            user = await User.findOne({ email })
            if (!user) {
                return response(res, 404, "User not found");
            }

            const now = new Date();
            if (!user.emailOtp || String(user.emailOtp) !== String(otp) || now > new Date(user.emailOtpExpiry)) {
                return response(res, 400, "Invalid or expired Otp")
            }
            user.isVerified = true
            user.emailOtp = null
            user.emailOtpExpiry = null
            await user.save();

        }

        // for phone otp
        else {
            if (!phoneNumber || !phoneSuffix) {
                return response(res, 400, "phoneNumber and phoneSuffix are required.")
            }
            const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`
            user = await User.findOne({ phoneNumber })
            if (!user) {
                return response(res, 404, "User not found")
            }
            const result = await verifyOtp(fullPhoneNumber, otp)
            if (result.status !== "approved") {
                return response(res, 400, "Invalid Otp");
            }
            user.isVerified = true;
            user.save();
        }

        const token = generateToken(user?._id);
        res.cookie("auth_token", token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365
        })

        console.log(token, user);
        return response(res, 200, "Otp verified Successfully.", { token, user })

    } catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.", error)
    }

}

// step:3 updateProfile
export const updateProfile = async (req, res) => {
    const { username, agreed, about } = req.body;
    const userId = req.user.userId;
    console.log(req);


    try {
        const user = await User.findById(userId)
        const file = req.file
        if (file) {
            const resultProfilePicture = await uploadFileToCloudinary(file)
            // console.log(resultProfilePicture);
            user.profilePicture = resultProfilePicture?.secure_url;
        } else if (req.body.profilePicture) {
            user.profilePicture = req.body.profilePicture;
        }
        if (username) user.username = username;
        if (about) user.about = about;
        if (agreed) user.agreed = agreed;
        await user.save();

        // console.log(res, 200, "Update Profile Sucessfully.", user)
        return response(res, 200, "Update Profile Sucessfully.", user)
    } catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.", error)
    }


}

// step 4 userAuthentication
export const checkAuthenticated = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) {
            return response(res, 404, "User not found, please login before use.")
        }
        const user = await User.findById(userId)
        if (!user) {
            return response(res, 404, "User not found.");
        }
        return response(res, 200, "user retrieved and allow to use whatsapp", user);
    } catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.", error)
    }
}

// step 5 logout
export const logout = (req, res) => {
    try {
        res.cookie("auth_token", "", { expires: new Date(0) })
        return response(res, 200, "User Logged-Out",)
    } catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.", error)
    }
}

export const getAllUsers = async (req, res) => {
    const loggedUser = req.user.userId;
    try {
        const user = await User.find({ _id: { $ne: loggedUser } }).select("about profilePicture isOnline lastSeen phoneSuffix  phoneNumber username").lean();

        const userWithConversation = await Promise.all(
            user.map(async (user) => {
                const conversation = await Conversation.findOne({
                    participants: { $all: [loggedUser, user?._id] }
                }).populate({
                    path: "lastMessage",
                    select: "content createdAt reciever sender ",
                }).lean();

                return {
                    ...user,
                    conversation: conversation || null
                }
            })
        )

        return response(res, 200, "User  retrieved, working successfully", userWithConversation)
    } catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.", error)
    }
}

// export default { sendOtp, verifyOtpp } 