import Status from "../models/status.model.js";
import Message from "../models/message.model.js";
import { uploadFileToCloudinary } from "../config/cloudinaryConfig.js";
import response from "../utlis/responseHandler.js";


export const createStatus = async (req, res) => {

    try {
        const { content, contentType } = req.body;
        const userId = req.user.userId;
        const file = req.file;


        let mediaUrl = null
        let finalContentType = contentType || "text"

        //  handle the file upload
        if (file) {
            const uploadFile = await uploadFileToCloudinary(file)
            if (!uploadFile?.secure_url) {
                return response(res, 400, "Failed to upload media")
            }
            mediaUrl = uploadFile?.secure_url
            if (file.mimetype.startsWith("image")) {
                finalContentType = "image"
            }
            else if (file.mimetype.startsWith("video")) {
                finalContentType = "video"
            }
            else {
                return response(res, 400, "UnSupported file type. ")
            }
        }
        else if (content?.trim()) {
            finalContentType = "text"
        }
        else {
            return response(res, 400, "Message is required.")
        }


        const expiryAt = new Date();
        expiryAt.setHours(expiryAt.getHours() + 24)


        const status = new Status({
            user: userId,
            content: mediaUrl || content,
            contentType: finalContentType,
            expiryAt

        })


        await status.save();

        const populateStatus = await Status.findOne(status?._id)
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture")


        //  // emit socket event
        // if (req.io && req.socketUserMap) {
        //     for (const [connectingUserId, socketID] of req.socketUserMap) {
        //         if (connectingUserId !== userId) {
        //             req.io.to(socketID).emit("new_status", populateStatus)
        //         }
        //     }
        // }

        if (req.io && req.socketUserMap) {
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
                    req.io.to(socketId).emit("new_status", populateStatus)
                }
            }
        }

        return response(res, 201, "Status created Successfully.", populateStatus);

    } catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.", error)
    }

}

export const getStatus = async (req, res) => {
    try {
        const statuses = await Status.find({
            expiryAt: { $gt: new Date() }
        })
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture")
            .sort({ createdAt: -1 });

        console.log(statuses)
        // console.log(res, 201, "User Status retrieved and for views Successfully", statuses)
        return response(res, 201, "User Status retrieved and for views Successfully", statuses)
    } catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.", error)
    }
}

export const viewStatus = async (req, res) => {
    try {

        const { statusId } = req.params;
        const userId = req.user.userId
        const status = await Status.findById(statusId)

        if (!status) {
            return response(res, 404, "status not found.")
        }

        if (!status.viewers.includes(userId)) {
            status.viewers.push(userId);
            await status.save();

            const updateStatus = await Status.findById(statusId)
                .populate("user", "username profilePicture")
                .populate("viewers", "username profilePicture")

            // emit socket event
            if (req.io && req.socketUserMap) {
                const statusOwnerSocketId = req.socketUserMap.get(status.user._id.toString())
                if (statusOwnerSocketId) {
                    const viewData = {
                        statusId,
                        viewerId: userId,
                        totalViewers: updateStatus.viewers.length,
                        viewers: updateStatus.viewers,
                    }
                    req.io.to(statusOwnerSocketId).emit("status_viewed", viewData)
                } else {
                    console.log("status owner not connected");

                }
            }

        } else {
            console.log("User Already viewed Status.");
        }


        return response(res, 200, "User viewed Staus Successfully.")
    } catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.", error)
    }
}

export const deleteStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.user.userId

    try {
        const status = await Status.findById(statusId)

        if (!status) {
            return response(res, 404, "Status not found.")
        }

        if (status.user.toString() !== userId) {
            return response(res, 404, "UnAuthorized Status")
        }

        await status.deleteOne();


        // Exit socket event
        // emit socket event
        if (req.io && req.socketUserMap) {
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
                    req.io.to(socketId).emit("status_deleted", statusId)
                }
            }
        }

        return response(res, 200, "Status Deleted Successfully")
    } catch (error) {
        console.error("Server error", error);
        return response(res, 500, "Internally Server error.", error)
    }
}