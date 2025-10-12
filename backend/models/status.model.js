import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // user: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    content: { type: String, required: true },
    contentType: { type: String, enum: ["image", "video", "text"], default: "text" },
    expiryAt: { type: Date, required: true },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true })


const status = mongoose.model("Status", statusSchema)
export default status;