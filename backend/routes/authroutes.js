import express from "express"
import { logout, sendOtp, updateProfile, checkAuthenticated, verifyOtpp, getAllUsers } from "../controllers/auth.controller.js"; import { authMiddleware } from "../middlewares/authMiddleware.js";
import { multerMiddleware } from "../config/cloudinaryConfig.js";
;

const router = express.Router();

// routes
router.post("/send-otp", sendOtp)
router.post("/verify-otp", verifyOtpp)
router.get("/logout", logout)

// protected routes
router.put("/update-profile", authMiddleware, multerMiddleware, updateProfile);
router.get("/check-auth", authMiddleware, multerMiddleware, checkAuthenticated)
router.get("/users", authMiddleware, getAllUsers)



export default router;