import express from "express"
import { createStatus, deleteStatus, getStatus, viewStatus } from "../controllers/statusController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { multerMiddleware } from "../config/cloudinaryConfig.js";


const router = express.Router();

// protected routes
router.post("/", authMiddleware, multerMiddleware, createStatus)
router.get("/", authMiddleware, getStatus)

router.put("/:statusId/view", authMiddleware, viewStatus);
router.delete("/:statusId", authMiddleware, deleteStatus)



export default router;