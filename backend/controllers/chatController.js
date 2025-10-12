import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { uploadFileToCloudinary } from "../config/cloudinaryConfig.js";
import response from "../utlis/responseHandler.js";


export const sendMessage = async (req, res) => {

    try {
        const { recieverId, senderId, content, messageStatus } = req.body;
        const file = req.file

        const participants = [senderId, recieverId].sort();

        // check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: participants
        })

        if (!conversation) {
            conversation = new Conversation({
                participants
            })
            await conversation.save();
        }

        let imageOrVideoUrl = null;
        let contentType = null;

        if (file) {
            const uploadFile = await uploadFileToCloudinary(file)
            if (!uploadFile?.secure_url) {
                return response(res, 400, "Failed to upload media")
            }
            imageOrVideoUrl = uploadFile?.secure_url
            if (file.mimetype.startsWith("image")) {
                contentType = "image"
            }
            else if (file.mimetype.startsWith("video")) {
                contentType = "video"
            }
            else {
                return response(res, 400, "UnSupported file type. ")
            }
        }
        else if (content && content.trim()) {
            contentType = "text"
        }
        else {
            return response(res, 400, "Message is required.")
        }


        const message = new Message({
            conversation: conversation?._id,
            sender: senderId,
            reciever: recieverId,
            content,
            contentType,
            imageOrVideoUrl,
            messageStatus
        })
        await message.save();

        if (message.content) {
            conversation.lastMessage = message?._id
        }
        conversation.unreadCount += 1
        await conversation.save();


        const populateMessage = await Message.findById(message?._id)
            .populate("sender", "username profilePicture")
            .populate("reciever", "username profilePicture")


        // Exit Socket Event for realtime
        if (req.io && req.socketUserMap) {
            const recieverSocketId = req.socketUserMap.get(recieverId)
            if (recieverSocketId) {
                req.io.to(recieverSocketId).emit("recieve_message", populateMessage)
                message.messageStatus = "delivered";
                await message.save();
            }
        }


        return response(res, 201, "Message Sent Successfully.", populateMessage);

    } catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.", error)
    }
}

export const getConversation = async (req, res) => {
    const userId = req.user.userId;

    try {
        const conversation = await Conversation.find({
            participants: userId
        }).populate("participants", "username profilePicture isOnline lastSeen")
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender reciever",
                    select: "username profilePicture"
                }
            }).sort({ updatedAt: - 1 })

        if (!conversation || conversation.length === 0) {
            return response(res, 404, "No conversations found for this user.", []);
        }


        return response(res, 200, "User retrieved s, ", conversation)
    } catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.", error)
    }
}

// get Messages for specific conversation 
export const getMessages = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    try {
        const conversation = await Conversation.findById(conversationId)

        if (!conversation) {
            return response(res, 404, "conversation not found")
        }

        if (!conversation.participants.includes(userId)) {
            return response(res, 403, "not authenticated to see messages of this conversaion.")
        }

        const messages = await Message.find(conversation.conversationId)
            .populate("sender", "username profilePicture")
            .populate("reciever", "username profilePicture")
            .sort({ createdAt: 1 })

        await Message.updateMany({
            conversation: conversationId,
            reciever: userId,
            messageStatus: { $in: ["send", "delivered"] }
        },
            { $set: { messageStatus: "read" } }
        )

        conversation.unreadCount = 0;
        await conversation.save();

        return response(res, 201, "Messages retrieved Successfully", messages)
    }
    catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.", error)
    }


}

export const markAsRead = async (req, res) => {
    const { messageIds } = req.body;
    const userId = req.user.userId;

    try {
        // get relevant messages to determine senders
        const messages = await Message.find({
            _id: { $in: messageIds },
            reciever: userId
        })

        await Message.updateMany({
            _id: { $in: messageIds },
            reciever: userId
        },
            { $set: { messageStatus: "read" } }
        )



        // Exit Socket Event for realtime
        if (req.io && req.socketUserMap) {
            for (const message of messages) {
                const senderSocketId = req.socketUserMap.get(message.sender.toString())
                if (senderSocketId) {
                    const updatedMessage = {
                        _id: message._id,
                        messageStatus: "read"
                    }
                    req.io.to(senderSocketId).emit("message_read", updatedMessage)
                    await message.save();
                }
            }
        }




        return response(res, 201, "User Successfully working", messages)

    } catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.", error)
    }
}

export const deleteMessage = async (req, res) => {
    const { messageIds } = req.params;
    const userId = req.user.userId;

    try {
        const messages = await Message.findById(messageIds)

        if (!messages) {
            return response(res, 404, "Messages not found")
        }

        if (messages.sender.toString() !== userId) {
            return response(res, 401, "You are not authorized to delete Message")
        }

        await messages.deleteOne();


        // emit socket event
        if (req.io && req.socketUserMap) {

            const recieverSocketId = req.socketUserMap.get(messages.reciever.toString())
            if (recieverSocketId) {
                req.io.to(recieverSocketId).emit("message_deleted", messageIds)
            }
        }






        return response(res, 201, "Message Deleted Successfully")
    } catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.", error)
    }

}