import { Server, Socket } from "socket.io"
import User from "../models/user.model.js"
import Message from "../models/message.model.js"
import handleVideoCallEvent from "./video-call-event.js";
import { socketMiddleware } from "../middlewares/socketMiddleware.js";


// MAP to store user online -> userId -> socketID
const OnlineUsers = new Map();

// MAP to store user typing -> userId -> [conversation] : boolean
const typingUsers = new Map();

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true,
            methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS", ""]
        },
        pingTimeout: 60000 // Disconnect inactive user or socket id after this time 
    })


    // middleware
    io.use(socketMiddleware);


    // when a socket connection is established
    io.on("connection", (socket) => {
        console.log("User Connected: ", socket.id);
        let userId = null;




        // handle user connection and mark them online in db
        socket.on("user_connected", async (connectingUserId) => {

            try {
                userId = connectingUserId
                // OnlineUsers.set(userId.socket.id)
                socket.userId = userId // for video call functions
                OnlineUsers.set(userId, socket.id)
                socket.join(userId) // joins a direect room for emits

                // update user status in DB
                await User.findByIdAndUpdate(userId, {
                    isOnline: true,
                    lastSeen: new Date()
                })


                // notify all users that this user is online
                io.emit("user_status", {
                    userId,
                    isOnline: true,
                    lastSeen: new Date(),
                })

            } catch (error) {
                console.error("error handling user connection", error);
            }
        })



        // Returned online status of requested user
        socket.on("get_user_status", (requestedUserId, callback) => {
            const isOnline = OnlineUsers.has(requestedUserId)

            callback({
                userId: requestedUserId,
                isOnline,
                lastSeen: isOnline ? new Date() : null
            })
        })

        // forward message to reciever if online
        // socket.on("send_message", (message) => {
        //     console.log("send message : ", message);
        //     try {
        //         // socket.on("send_message", async (message) => {  

        //         const recieverSocketId = OnlineUsers.get(message.reciever?._id)

        //         if (recieverSocketId) {
        //             io.to(recieverSocketId).emit("recieve_message", message)
        //         }
        //     } catch (error) {
        //         console.error("error while sending message", error);
        //         socket.emit("message_error", { error: "Error while sending message" })
        //     }
        // })


        // update messages as read and notify sender
        socket.on("message_read", async ({ messageIds, senderId }) => {
            try {
                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { $set: { messageStatus: "read" } },
                )

                const senderSocketId = OnlineUsers.get(senderId)
                if (senderSocketId) {
                    messageIds.forEach((messageId) => {
                        io.to(senderSocketId).emit("message_status_update", {
                            messageId,
                            messageStatus: "read"
                        })
                    })
                }
            } catch (error) {
                console.error("Error updating message read status", error);
            }
        })

        socket.on("send_message", async (message) => {
            try {
                const recieverSocketId = OnlineUsers.get(message.reciever?._id);

                // 🔹 Update unreadCount in DB or calculate dynamically
                const unreadCount = await Message.countDocuments({
                    conversation: message.conversation,
                    reciever: message.reciever._id,
                    messageStatus: { $ne: "read" },
                });

                console.log(unreadCount)
                const conversationUpdate = {
                    conversationId: message.conversation,
                    lastMessage: message,
                    unreadCount,
                };

                console.log(conversationUpdate)

                // Send message to receiver
                if (recieverSocketId) {
                    io.to(recieverSocketId).emit("recieve_message", message);

                    // 🔹 Also send conversation update
                    io.to(recieverSocketId).emit("conversation_update", conversationUpdate);
                }
            } catch (error) {
                console.error("error while sending message", error);
                socket.emit("message_error", { error: "Error while sending message" });
            }
        });


        //handling typing start event and stop after 3s
































        // --- NEW unread messages socket event ---

        socket.on("typing_start", async ({ conversationId, recieverId }) => {

            if (!userId || !conversationId || !recieverId) return;

            if (!typingUsers.has(userId)) typingUsers.set(userId, {})

            const usertyping = typingUsers.get(userId)

            usertyping[conversationId] = true;


            // clear an existing timeout

            // original function:
            // if (userId[`${conversationId}_timeout`]) {
            //     clearTimeout([`${conversationId}_timeout`])
            // }

            // fixed:
            if (usertyping[`${conversationId}_timeout`]) {
                clearTimeout(usertyping[`${conversationId}_timeout`])
            }

            // auto stop after 3s
            usertyping[`${conversationId}_timeout`] = setTimeout(() => {
                usertyping[conversationId] = false;
                socket.to(recieverId).emit("user_typing", {
                    userId,
                    conversationId,
                    isTyping: false
                })
            }, 3000);


            // notify reciever
            socket.to(recieverId).emit("user_typing", {
                userId,
                conversationId,
                isTyping: true
            })

        })


        socket.on("typing_stop", async ({ conversationId, recieverId }) => {
            if (!userId || !conversationId || !recieverId) return;

            if (typingUsers.has(userId)) {
                const usertyping = typingUsers.get(userId)
                usertyping[conversationId] = false;


                if (usertyping[`${conversationId}_timeout`]) {
                    clearTimeout(usertyping[`${conversationId}_timeout`])
                    delete usertyping[`${conversationId}_timeout`]
                }
            }

            socket.to(recieverId).emit("user_typing", {
                userId,
                conversationId,
                isTyping: false
            })
        })





        // add or update user reactions on messages
        socket.on("add_reaction", async ({ messageId, emoji, userId: reactionUserId }) => {

            try {
                const message = await Message.findById(messageId)
                if (!message) return;

                const existingIndex = message.reactions.findIndex(
                    (e) => e.user.toString() === reactionUserId
                )
                console.log(message);

                if (existingIndex > -1) {
                    const existing = message.reactions[existingIndex]
                    if (existing.emoji === emoji) {
                        // remove the same emoji
                        message.reactions.splice(existingIndex, 1)
                    } else {
                        // change emoji
                        message.reactions[existingIndex].emoji = emoji
                    }
                } else {
                    // add new emoji
                    message.reactions.push({ user: reactionUserId, emoji })
                }

                await message.save();

                const populatedMessage = await Message.findOne(message?._id)
                    .populate("sender", "username profilePicture")
                    .populate("reciever", "username profilePicture")
                    .populate("reactions.user", "username")


                const reactionUpdated = {
                    messageId,
                    reactions: populatedMessage.reactions,
                }

                const senderSocket = OnlineUsers.get(populatedMessage.sender._id.toString())
                const recieverSocket = OnlineUsers.get(populatedMessage.reciever?._id.toString())

                if (senderSocket) io.to(senderSocket).emit("reaction_update", reactionUpdated)
                if (recieverSocket) io.to(recieverSocket).emit("reaction_update", reactionUpdated)


            } catch (error) {
                console.log("Error handling reactions", error);
            }
        });


        // // handle video call events action
        handleVideoCallEvent(socket, io, OnlineUsers)

        // handle disconnection and mark user as offline
        const handleDisconnected = async () => {
            if (!userId) return;

            try {
                OnlineUsers.delete(userId)

                // clear all typing timeout
                if (typingUsers.has(userId)) {
                    const userTyping = typingUsers.get(userId)
                    Object.keys(userTyping).forEach((key) => {
                        if (key.endsWith("_timeout")) clearTimeout(userTyping[key])
                    })
                    typingUsers.delete(userId)

                    await User.findByIdAndUpdate(userId, {
                        isOnline: false,
                        lastSeen: new Date(),
                    })

                    io.emit("user_status", {
                        userId,
                        isOnline: false,
                        lastSeen: new Date(),
                    })

                    socket.leave(userId)
                    console.log(`user ${userId} disconnected`)

                }
            } catch (error) {
                console.log("Error handling disconnection", error);

            }
        }

        // disconnect event
        socket.on("disconnect", handleDisconnected)
    });


    // attach the online user map to the socket server for external user
    io.socketUserMap = OnlineUsers;

    return io;

}


export default initializeSocket

















// // backend/socket.service.js
// import { Server } from "socket.io";
// import User from "../models/user.model.js";
// import Message from "../models/message.model.js";
// import handleVideoCallEvent from "./video-call-event.js";

// // Maps
// const OnlineUsers = new Map();
// const typingUsers = new Map();

// const initializeSocket = (server) => {
//     const io = new Server(server, {
//         cors: {
//             origin: process.env.FRONTEND_URL,
//             credentials: true,
//             methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
//         },
//         pingTimeout: 60000,
//     });

//     io.on("connection", (socket) => {
//         console.log("[socket] connected:", socket.id);
//         let userId = null;

//         // user connected (client should emit with their userId)
//         socket.on("user_connected", async (connectingUserId) => {
//             try {
//                 userId = connectingUserId;
//                 socket.userId = userId;
//                 OnlineUsers.set(userId, socket.id);
//                 socket.join(userId);

//                 // update DB status
//                 await User.findByIdAndUpdate(userId, {
//                     isOnline: true,
//                     lastSeen: new Date(),
//                 });

//                 // broadcast to all connected sockets that user is online
//                 io.emit("user_status", { userId, isOnline: true, lastSeen: new Date() });

//                 console.log(`[socket] user_connected -> ${userId}`);
//             } catch (err) {
//                 console.error("error handling user_connected", err);
//             }
//         });

//         // return online status for a requested user (callback style)
//         socket.on("get_user_status", (requestedUserId, callback) => {
//             try {
//                 const isOnline = OnlineUsers.has(requestedUserId);
//                 const lastSeen = isOnline ? new Date() : null;
//                 callback({ userId: requestedUserId, isOnline, lastSeen });
//             } catch (err) {
//                 console.error("get_user_status error", err);
//                 callback({ userId: requestedUserId, isOnline: false, lastSeen: null });
//             }
//         });

//         // forward message to receiver when server receives 'send_message' (client should emit this after POST)
//         socket.on("send_message", async (message) => {
//             try {
//                 const receiverId = message?.reciever?._id || message?.reciever;
//                 if (!receiverId) return;

//                 const receiverSocketId = OnlineUsers.get(String(receiverId));
//                 if (receiverSocketId) {
//                     io.to(receiverSocketId).emit("recieve_message", message);
//                 } else {
//                     // receiver offline — you may want to queue/persist this (server's REST already saved)
//                 }
//             } catch (err) {
//                 console.error("error while forwarding send_message", err);
//                 socket.emit("message_error", { error: "Error while forwarding message" });
//             }
//         });

//         // message read updates -> update DB & notify sender
//         socket.on("message_read", async ({ messageIds, senderId }) => {
//             try {
//                 await Message.updateMany({ _id: { $in: messageIds } }, { $set: { messageStatus: "read" } });

//                 const senderSocketId = OnlineUsers.get(String(senderId));
//                 if (senderSocketId) {
//                     messageIds.forEach((messageId) => {
//                         io.to(senderSocketId).emit("message_status_update", {
//                             messageId,
//                             messageStatus: "read",
//                         });
//                     });
//                 }
//             } catch (err) {
//                 console.error("Error in message_read handler", err);
//             }
//         });

//         // typing events
//         socket.on("typing_start", ({ conversationId, recieverId }) => {
//             try {
//                 if (!userId || !conversationId || !recieverId) return;

//                 if (!typingUsers.has(userId)) typingUsers.set(userId, {});
//                 const userTyping = typingUsers.get(userId);
//                 userTyping[conversationId] = true;

//                 // clear previous timeout safely
//                 if (userTyping[`${conversationId}_timeout`]) {
//                     clearTimeout(userTyping[`${conversationId}_timeout`]);
//                 }

//                 // auto-stop after 3s
//                 userTyping[`${conversationId}_timeout`] = setTimeout(() => {
//                     userTyping[conversationId] = false;
//                     socket.to(recieverId).emit("user_typing", {
//                         userId,
//                         conversationId,
//                         isTyping: false,
//                     });
//                 }, 3000);

//                 // notify receiver immediately
//                 socket.to(recieverId).emit("user_typing", {
//                     userId,
//                     conversationId,
//                     isTyping: true,
//                 });
//             } catch (err) {
//                 console.error("typing_start error", err);
//             }
//         });

//         socket.on("typing_stop", ({ conversationId, recieverId }) => {
//             try {
//                 if (!userId || !conversationId || !recieverId) return;

//                 if (typingUsers.has(userId)) {
//                     const userTyping = typingUsers.get(userId);
//                     userTyping[conversationId] = false;

//                     if (userTyping[`${conversationId}_timeout`]) {
//                         clearTimeout(userTyping[`${conversationId}_timeout`]);
//                         delete userTyping[`${conversationId}_timeout`];
//                     }
//                 }

//                 socket.to(recieverId).emit("user_typing", {
//                     userId,
//                     conversationId,
//                     isTyping: false,
//                 });
//             } catch (err) {
//                 console.error("typing_stop error", err);
//             }
//         });

//         // reactions
//         socket.on("add_reaction", async ({ messageId, emoji, userId: reactionUserId }) => {
//             try {
//                 const message = await Message.findById(messageId);
//                 if (!message) return;

//                 const existingIndex = message.reactions.findIndex((e) => e.user.toString() === String(reactionUserId));

//                 if (existingIndex > -1) {
//                     const existing = message.reactions[existingIndex];
//                     if (existing.emoji === emoji) message.reactions.splice(existingIndex, 1);
//                     else message.reactions[existingIndex].emoji = emoji;
//                 } else {
//                     message.reactions.push({ user: reactionUserId, emoji });
//                 }

//                 await message.save();

//                 const populatedMessage = await Message.findById(message._id)
//                     .populate("sender", "username profilePicture")
//                     .populate("reciever", "username profilePicture")
//                     .populate("reactions.user", "username");

//                 const reactionUpdated = {
//                     messageId,
//                     reactions: populatedMessage.reactions,
//                 };

//                 const senderSocket = OnlineUsers.get(String(populatedMessage.sender?._id));
//                 const receiverSocket = OnlineUsers.get(String(populatedMessage.reciever?._id));

//                 if (senderSocket) io.to(senderSocket).emit("reaction_update", reactionUpdated);
//                 if (receiverSocket) io.to(receiverSocket).emit("reaction_update", reactionUpdated);
//             } catch (err) {
//                 console.error("Error handling add_reaction", err);
//             }
//         });

//         // plug-in for video call events (keeps separation)
//         handleVideoCallEvent(socket, io, OnlineUsers);

//         // disconnection cleanup
//         const handleDisconnected = async () => {
//             try {
//                 if (!userId) return;

//                 OnlineUsers.delete(userId);

//                 if (typingUsers.has(userId)) {
//                     const userTyping = typingUsers.get(userId);
//                     Object.keys(userTyping).forEach((k) => {
//                         if (k.endsWith("_timeout")) clearTimeout(userTyping[k]);
//                     });
//                     typingUsers.delete(userId);
//                 }

//                 await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });

//                 io.emit("user_status", { userId, isOnline: false, lastSeen: new Date() });

//                 socket.leave(userId);
//                 console.log(`[socket] user ${userId} disconnected`);
//             } catch (err) {
//                 console.error("Error on disconnect cleanup", err);
//             }
//         };

//         socket.on("disconnect", handleDisconnected);
//     });

//     // expose the map for other modules if needed
//     io.socketUserMap = OnlineUsers;
//     return io;
// };

// export default initializeSocket;
