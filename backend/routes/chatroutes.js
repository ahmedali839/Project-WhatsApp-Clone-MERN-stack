import express from "express"
import { deleteMessage, getConversation, getMessages, markAsRead, sendMessage } from "../controllers/chatController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { multerMiddleware } from "../config/cloudinaryConfig.js";
;

const router = express.Router();

// protected routes
router.post("/send-message", authMiddleware, multerMiddleware, sendMessage)
router.get("/conversations", authMiddleware, getConversation)
router.get("/conversations/:conversationId/messages", authMiddleware, getMessages)

router.put("/messages/read", authMiddleware, markAsRead);
router.delete("/messages/:messageIds", authMiddleware, deleteMessage)



export default router;