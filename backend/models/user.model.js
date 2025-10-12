import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    phoneNumber: { type: Number, unique: true, sparse: true },
    phoneSuffix: { type: Number, unique: false },
    username: { type: String, },
    email: {
        type: String,
        lowercase: true,
        validate: {
            validator: function (value) {
                return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
            },
            message: "Email format not valid."
        }
    },
    emailOtp: { type: String },
    emailOtpExpiry: { type: Date },
    profilePicture: { type: String },
    about: { type: String },
    lastSeen: { type: Date },
    isOnline: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    agreed: { type: Boolean, default: false },

}, { timestamps: true })

const user = mongoose.model("User", userSchema)
export default user