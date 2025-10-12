import { create } from "zustand";
import { getSocket } from "../services/chat.services";
import { set } from "react-hook-form";
import axiosInstance from "../services/url.services";
import { useEffect } from "react";

const useChatStore = create((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    error: null,
    onlineUsers: new Map(),
    typingUsers: new Map(),


    initSocketListner: () => {
        // let socket = getSocket();
        // if (socket) {
        //     return;
        // }

        let socket = getSocket();
        if (!socket) return;

        // turn off the all listeners to prevent duplicate listeners
        socket.off("message_send")
        socket.off("user_typing")
        socket.off("user_status")
        socket.off("message_error")
        socket.off("message_deleted")
        socket.off("recieve_message")


        // NOW: contiue or start converstation with each socket , io function 

        // // listen for incoming messages

        socket.on("recieve_message", (message) => {
            console.log("new message from backend:", message);
            useChatStore.getState().recieveMessage(message);
        });



        // socket.on("recieve_message", (message) => {
        //     console.log("new message from backend:", message);
        //     set((state) => ({
        //         messages: [...state.messages, message]
        //     }))
        // })



        // socket.on("recieve_message", (message) => {
        //     console.log("new message from backend:", message);
        //     set((state) => ({
        //         messages: [...state.messages, message]
        //     }));
        // });




        // cofirm messgae delivery 
        socket.on("send_message", (message) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === message._id ? { ...msg } : msg
                )
            }))
        })

        // update message status
        socket.on("message_status_update", ({ messageId, messageStatus }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    // msg._Id === messageId ? { ...msg, messageStatus } : msg)
                    msg._id === messageId ? { ...msg, messageStatus } : msg)
            }))
        })

        // handle reaction on messages
        socket.on("reaction_update", ({ messageId, reactions }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    // msg._Id === messageId ? { ...msg, reaction } : msg)
                    msg._id === messageId ? { ...msg, reactions } : msg)
            }))
        })

        // handle delete message to local storage
        socket.on("message_deleted", ({ deleteMessageId }) => {
            set((state) => ({
                messages: state.messages.filter((msg) =>
                    msg._Id !== deleteMessageId)
            }))
        })


        // handle any messags Id
        socket.on("message_error", (error) => {
            console.log("Message error :  ", error);
        })


        // Listener for tracking typing
        socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
            set((state) => {
                const newTypingUsers = new Map(state.typingUsers)
                if (!newTypingUsers.has(conversationId)) {
                    newTypingUsers.set(conversationId, new Set())
                }
                const newTyping = newTypingUsers.get(conversationId)
                if (isTyping) {
                    newTyping.add(userId)
                } else {
                    newTyping.delete(userId)
                }
                return { typingUsers: newTypingUsers }
            })
        })



        // Lisenter for tracking online or offline users
        socket.on("user_status", ({ isOnline, lastSeen, userId }) => {

            set((state) => {
                const newOnlineUsers = new Map(state.onlineUsers)
                newOnlineUsers.set(userId, { isOnline, lastSeen })
                return { onlineUsers: newOnlineUsers }
            })
        })






        socket.on("conversation_update", ({ conversationId, lastMessage, unreadCount }) => {
            console.log(conversationId, lastMessage, unreadCount)
            console.log(state.conversations)
            set((state) => {
                const updatedConversations = state.conversations?.data?.map((conv) =>
                    conv._id === conversationId
                        ? { ...conv, lastMessage, unreadCount }
                        : conv
                );
                console.log("conversation_update", updatedConversations)
                return {
                    conversations: {
                        ...state.conversations,
                        data: updatedConversations,
                    },
                };
            });
        });







        // emit status check for all users in conversations List
        const { conversations } = get();
        if (conversations?.data?.length > 0) {
            conversations?.data?.forEach((conv) => {
                const otherUsers = conv.participants.find(
                    (p) => p._id !== get().currentUser?.id)

                if (otherUsers?._id) {
                    socket.emit("get_user_status", otherUsers._id, (status) => {
                        set((state) => {
                            const newOnlineUsers = new Map(state.onlineUsers)
                            newOnlineUsers.set(otherUsers._id, {
                                isOnline: state.isOnline,
                                lastSeen: state.lastSeen,
                            })
                            return { onlineUsers: newOnlineUsers }
                        })

                    })

                }

            })

        }
    },


    setCurrentUser: (user) => set({ currentUser: user }),





    // fetching all conversation :
    fetchConversations: async () => {
        set({ loading: true, error: null })
        try {
            const { data } = await axiosInstance.get("/chats/conversations")

            // set({ conversation: data, loading: false })
            set({ conversations: data, loading: false })

            get().initSocketListner()
            // console.log(data);

            return data;
        } catch (error) {
            set({ error: error?.respose?.data?.message || error?.message, loading: false })
            console.log("Error in fetchConversations");

            return null;
        }
    },


    // fetching all messages :
    fetchMessages: async (conversationId) => {

        if (!conversationId) return console.log("id nahi hy bhai");


        set({ loading: true, error: null })
        try {
            const { data } = await axiosInstance.get(`/chats/conversations/${conversationId}/messages`)
            // console.log("fechesMssages", data);

            const messageArray = data.data || data || []

            set({
                messages: messageArray,
                currentConversation: conversationId,
                loading: false,

            })


            const { markMessageAsRead } = get();
            markMessageAsRead();


            return messageArray;
        } catch (error) {
            console.log("not working fetchmessage usechatstore");

            set({ error: error?.response?.data?.message || error?.message, loading: false })
            return [];
        }
    },

    // // send messages
    sendMessage: async (formData) => {
        const senderId = formData.get("senderId");
        const recieverId = formData.get("recieverId");
        const media = formData.get("media");
        const content = formData.get("content");
        const messageStatus = formData.get("messageStatus");


        const socket = getSocket()
        const { conversations } = get()
        let conversationId = null
        if (conversations?.data?.length > 0) {
            const conversation = conversations?.data?.find((conv) =>
                conv.participants.some((participant) => participant._id === senderId) &&
                conv.participants.some((participant) => participant._id === recieverId)
            );
            if (conversation) {
                // conversationId === conversation._id
                conversationId = conversation._id
                set({ currentConversation: conversationId })
            }
        }

        // temporary message before actually send
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            _id: tempId,
            sender: { _id: senderId },
            reciever: { _id: recieverId },
            conversation: conversationId,
            imageOrVideoUrl: media && typeof media !== "string" ? URL.createObjectURL(media) : null,
            content: content,
            contentType: media ? media.type.startsWith("image") ? "image" : "video" : "text",
            createdAt: new Date().toISOString(),
            messageStatus,
        }

        set((state) => ({
            messages: [...state.messages, optimisticMessage]
        }))



        try {

            const { data } = await axiosInstance.post("/chats/send-message", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            console.log("send message data:", data);

            const messageData = data.data || data;


            // 2) Emit to socket (so recipient gets it instantly)
            if (socket) {
                socket.emit("send_message", messageData);
            }

            // replace optismistic messages with real one
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === tempId ? messageData : msg)
            }))

            return messageData;
        } catch (error) {
            console.error("Error while sending message in useChatStore", error);
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === tempId ? { ...msg, messageStatus: "Failed" } : msg),
                error: error?.respose?.data?.message || error?.message
            }))
            throw error;
        }
    },



    // sendMessage: async (formData) => {

    //     const senderId = formData.get("senderId");
    //     const recieverId = formData.get("recieverId");
    //     const media = formData.get("media");
    //     const content = formData.get("content");
    //     const messageStatus = formData.get("messageStatus");

    //     const socket = getSocket();

    //     const tempId = `temp-${Date.now()}`;
    //     const optimisticMessage = {
    //         _id: tempId,
    //         sender: { _id: senderId },
    //         reciever: { _id: recieverId },
    //         // conversation: conversationId,
    //         imageOrVideoUrl: media && typeof media !== "string" ? URL.createObjectURL(media) : null,
    //         content: content,
    //         contentType: media ? media.type.startsWith("image") ? "image" : "video" : "text",
    //         createdAt: new Date().toISOString(),
    //         messageStatus,
    // };

    // set((state) => ({
    //     messages: [...state.messages, optimisticMessage]
    // }));

    // try {
    //     // 1) Save in DB via REST
    //     const { data } = await axiosInstance.post("/chats/send-message", formData, {
    //         headers: { "Content-Type": "multipart/form-data" }
    //     });

    //     const messageData = data.data || data;

    //     // 2) Emit to socket (so recipient gets it instantly)
    //     if (socket) {
    //         socket.emit("send_message", messageData);
    //     }

    //     // 3) Replace optimistic with actual message
    //     set((state) => ({
    //         messages: state.messages.map((msg) =>
    //             msg._id === tempId ? messageData : msg
    //         )
    //     }));

    //     return messageData;
    // } catch (error) {
    //     console.error("Error while sending message in useChatStore", error);
    //     set((state) => ({
    //         messages: state.messages.map((msg) =>
    //             msg._id === tempId ? { ...msg, messageStatus: "Failed" } : msg),
    //         error: error?.respose?.data?.message || error?.message
    //     }))
    //     throw error;
    // }
    //     },

    roughly: () => {
    },

    // // // recieve messages instantly

    // recieveMessage: async (message) => {
    //     console.log("message in recieve useChatStore", message);

    //     if (!message) return;

    //     const { currentConversation, currentUser, messages } = get();
    //     const messageExits = message.some((msg) => msg.id === message.id)
    //     if (messageExits) return;

    //     if (message.conversation === currentConversation) {
    //         set((state) => ({
    //             messages: [...state.messages, message]
    //         }))

    //         if (message.reciever?._id === currentUser?._id) {
    //             console.log("recieved new messages");

    //         }

    //     }

    //     // update conversation preview and update unreadCount
    //     set((state) => {
    //         const updateConversation = state.conversations?.data?.map((conv) => {
    //             if (conv._id === message.conversation) {
    //                 return {
    //                     ...conv,
    //                     lastMessage: message,
    //                     unreadCount: message?.reciever?._id === currentUser._id
    //                         ? (conv.unreadCount || 0) + 1
    //                         : (conv.unreadCount || 0) - 1

    //                 }
    //             }
    //             return conv;
    //         })
    //         return {
    //             conversations: {
    //                 ...state.conversations,
    //                 data: updateConversation
    //             },
    //         }
    //     })
    // },



    recieveMessage: (message) => {
        console.log("message in recieve useChatStore", message);

        set((state) => {
            // Update conversations
            const updatedConversations = state.conversations?.data?.map((conv) => {
                if (conv._id === message.conversation) {
                    return {
                        ...conv,
                        lastMessage: message,
                        unreadCount:
                            message?.reciever?._id === state.currentUser?._id
                                ? (conv.unreadCount || 0) + 1
                                : conv.unreadCount || 0,
                    };
                }
                return conv;
            });

            return {
                // ✅ append the new message object into array
                messages: [...(state.messages || []), message],
                conversations: {
                    ...state.conversations,
                    data: updatedConversations,
                },
            };
        });
    },


    // mark as unread to read
    markMessageAsRead: async () => {
        const { messages, currentUser } = get();

        if (!messages.length || !currentUser) return console.log(" messages and currentUser is required in markMessageAsRead");
        const unreadIds = messages.filter((msg) => msg.messageStatus !== "read" && msg.reciever?._id === currentUser?._id).map((msg) => msg.id).filter(Boolean)

        if (unreadIds.length === 0) return;

        try {
            const { data } = await axiosInstance.put("/chats/messages/read", {
                messageIds: unreadIds
            });

            set((state) => ({
                messages: state.messages.map((msg) =>
                    unreadIds.includes(msg._id) ? { ...msg, messageStatus: "read" } : msg
                )
            }));

            const socket = getSocket()
            console.log(socket)

            if (socket) {
                socket.emit("message_read", {
                    messageIds: unreadIds,
                    senderId: messages[0]?.sender._id
                })
            }

        } catch (error) {
            console.error("error in markMessageAsRead in chatStore", error);
        }

    },


    // delete messages
    deleteMessage: async (messageId) => {
        try {
            await axiosInstance.delete(`/chats/messages/${messageId}`)

            set((state) => ({
                messages: state.messages.filter((msg) => msg._id !== messageId)
            }))
            return true;

        } catch (error) {
            console.error("failed to delete message", error);
            set({ error: error?.respose?.data?.message || error?.message })
            return false;
        }
    },


    // // functions to use components:

    // add/remove  reactions
    addReaction: async (messageId, emoji) => {
        const { currentUser } = get()
        const socket = getSocket();
        if (socket && currentUser) {
            socket.emit("add_reaction", {
                messageId,
                emoji,
                userId: currentUser?._id
            })
        }
    },

    // when user starts typing
    startTyping: (recieverId) => {
        const { currentConversation } = get()
        const socket = getSocket();
        if (socket && currentConversation && recieverId) {
            socket.emit("typing_start", {
                conversationId: currentConversation,
                recieverId,
            })
        }
    },

    // when user stops typing
    stopTyping: (recieverId) => {
        const { currentConversation } = get()
        const socket = getSocket();
        if (socket && currentConversation && recieverId) {
            socket.emit("typing_stop", {
                conversationId: currentConversation,
                recieverId,
            })
        }
    },

    // isUserTyping: async (userId) => {
    isUserTyping: (userId) => {
        const { typingUsers, currentConversation } = get();

        if (!currentConversation || !userId || !typingUsers.has(currentConversation)) {
            return false
        }
        return typingUsers.get(currentConversation).has(userId)
    },

    // isUserOnline: async (userId) => {
    isUserOnline: (userId) => {
        if (!userId) return false;
        const { onlineUsers } = get();
        return onlineUsers.get(userId)?.isOnline || false;
    },

    // getUserLastSeen: async (userId) => {
    getUserLastSeen: (userId) => {
        if (!userId) return false;

        const { onlineUsers } = get();

        return onlineUsers.get(userId)?.lastSeen || null;
    },

    cleanUp: async () => {
        set({
            conversations: [],
            currentConversation: null,
            messages: [],
            loading: false,
            error: null,
            onlineUsers: new Map(),
            typingUsers: new Map(),
        })
    },


}))


export default useChatStore













































// // frontend - src/pages/store/useChatStore.js
// import { create } from "zustand";
// import axiosInstance from "../services/url.services";
// import { getSocket } from "../services/chat.services";

// const useChatStore = create((set, get) => ({
//     conversations: [],
//     currentConversation: null,
//     messages: [],
//     loading: false,
//     error: null,
//     onlineUsers: new Map(),
//     typingUsers: new Map(),
//     currentUser: null,

//     // initialization: attach all socket listeners here
//     initSocketListner: () => {
//         const socket = getSocket();
//         if (!socket) return;

//         // remove previous listeners to avoid duplicate handlers
//         [
//             "recieve_message",
//             "send_message",
//             "message_status_update",
//             "reaction_update",
//             "message_deleted",
//             "message_error",
//             "user_typing",
//             "user_status",
//             "connect",
//             "disconnect",
//         ].forEach((ev) => socket.off(ev));

//         // incoming message (server -> receiver)
//         socket.on("recieve_message", (message) => {
//             try {
//                 // call store handler
//                 get().recieveMessage(message);
//             } catch (err) {
//                 console.error("recieve_message handler error", err);
//             }
//         });

//         // confirm message delivery ack (if you use)
//         socket.on("send_message", (message) => {
//             set((state) => ({
//                 messages: state.messages.map((m) => (m._id === message._id ? { ...message } : m)),
//             }));
//         });

//         socket.on("message_status_update", ({ messageId, messageStatus }) => {
//             set((state) => ({
//                 messages: state.messages.map((m) => (m._id === messageId ? { ...m, messageStatus } : m)),
//             }));
//         });

//         // reaction update
//         socket.on("reaction_update", ({ messageId, reactions }) => {
//             set((state) => ({
//                 messages: state.messages.map((m) => (m._id === messageId ? { ...m, reactions } : m)),
//             }));
//         });

//         socket.on("message_deleted", ({ deleteMessageId }) => {
//             set((state) => ({ messages: state.messages.filter((m) => m._id !== deleteMessageId) }));
//         });

//         socket.on("message_error", (err) => {
//             console.warn("socket message_error:", err);
//         });

//         // typing indicator: maintain a Map<conversationId, Set<userId>>
//         socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
//             set((state) => {
//                 const newTyping = new Map(state.typingUsers);
//                 if (!newTyping.has(conversationId)) newTyping.set(conversationId, new Set());
//                 const setForConv = newTyping.get(conversationId);
//                 if (isTyping) setForConv.add(userId);
//                 else setForConv.delete(userId);
//                 newTyping.set(conversationId, setForConv);
//                 return { typingUsers: newTyping };
//             });
//         });

//         // online/offline updates
//         socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
//             set((state) => {
//                 const newOnline = new Map(state.onlineUsers);
//                 newOnline.set(userId, { isOnline, lastSeen });
//                 return { onlineUsers: newOnline };
//             });
//         });

//         // Ask server for status for all conversation participants
//         const { conversations } = get();
//         if (conversations?.data?.length > 0) {
//             conversations.data.forEach((conv) => {
//                 const other = conv.participants.find((p) => p._id !== get().currentUser?._id);
//                 if (other?._id) {
//                     socket.emit("get_user_status", other._id, (status) => {
//                         // status = { userId, isOnline, lastSeen }
//                         set((state) => {
//                             const newOnline = new Map(state.onlineUsers);
//                             newOnline.set(status.userId, { isOnline: status.isOnline, lastSeen: status.lastSeen });
//                             return { onlineUsers: newOnline };
//                         });
//                     });
//                 }
//             });
//         }
//     },

//     setCurrentUser: (user) => set({ currentUser: user }),

//     // fetch conversations
//     fetchConversations: async () => {
//         set({ loading: true, error: null });
//         try {
//             const { data } = await axiosInstance.get("/chats/conversations");
//             set({ conversations: data, loading: false });
//             get().initSocketListner();
//             return data;
//         } catch (err) {
//             set({ error: err?.response?.data?.message || err?.message, loading: false });
//             return null;
//         }
//     },

//     // fetch messages for conversation
//     fetchMessages: async (conversationId) => {
//         if (!conversationId) {
//             console.warn("fetchMessages called without conversationId");
//             return [];
//         }

//         set({ loading: true, error: null });
//         try {
//             const { data } = await axiosInstance.get(`/chats/conversations/${conversationId}/messages`);
//             const messageArray = data.data || data || [];
//             set({ messages: messageArray, currentConversation: conversationId, loading: false });

//             get().markMessageAsRead();

//             return messageArray;
//         } catch (err) {
//             console.error("fetchMessages error", err);
//             set({ error: err?.response?.data?.message || err?.message, loading: false });
//             return [];
//         }
//     },

//     // send message (POST + optimistic UI + emit socket)
//     sendMessage: async (formData) => {
//         const senderId = formData.get("senderId");
//         const recieverId = formData.get("recieverId");
//         const media = formData.get("media");
//         const content = formData.get("content");
//         const messageStatus = formData.get("messageStatus");

//         const socket = getSocket();

//         // derive conversationId if exists
//         const { conversations } = get();
//         let conversationId = null;
//         if (conversations?.data?.length > 0) {
//             const conversation = conversations.data.find(
//                 (conv) =>
//                     conv.participants.some((p) => p._id === senderId) &&
//                     conv.participants.some((p) => p._id === recieverId)
//             );
//             if (conversation) {
//                 conversationId = conversation._id;
//                 set({ currentConversation: conversationId });
//             }
//         }

//         // optimistic message
//         const tempId = `temp-${Date.now()}`;
//         const optimisticMessage = {
//             _id: tempId,
//             sender: { _id: senderId },
//             reciever: { _id: recieverId },
//             conversation: conversationId,
//             imageOrVideoUrl:
//                 media && typeof media !== "string" && media instanceof File ? URL.createObjectURL(media) : null,
//             content: content || "",
//             contentType: media ? (media.type && media.type.startsWith("image") ? "image" : "video") : "text",
//             createdAt: new Date().toISOString(),
//             messageStatus,
//         };

//         set((state) => ({ messages: [...state.messages, optimisticMessage] }));

//         try {
//             const { data } = await axiosInstance.post("/chats/send-message", formData, {
//                 headers: { "Content-Type": "multipart/form-data" },
//             });

//             const messageData = data.data || data;

//             // replace optimistic message with server message
//             set((state) => ({
//                 messages: state.messages.map((m) => (m._id === tempId ? messageData : m)),
//             }));

//             // emit to backend so server can forward to receiver
//             if (socket) {
//                 try {
//                     socket.emit("send_message", messageData);
//                 } catch (emitErr) {
//                     console.warn("Failed to emit send_message:", emitErr);
//                 }
//             }

//             return messageData;
//         } catch (err) {
//             console.error("sendMessage error", err);
//             set((state) => ({
//                 messages: state.messages.map((m) => (m._id === tempId ? { ...m, messageStatus: "Failed" } : m)),
//                 error: err?.response?.data?.message || err?.message,
//             }));
//             throw err;
//         }
//     },

//     // receive message from socket (called by socket listener)
//     recieveMessage: (message) => {
//         if (!message) return;

//         // guard: don't duplicate
//         const existing = get().messages.some((m) => m._id === message._id);
//         if (existing) return;

//         const { currentConversation, currentUser } = get();

//         // if message is for the currently open conversation, append it
//         if (message.conversation === currentConversation) {
//             set((state) => ({ messages: [...state.messages, message] }));
//         }

//         // update conversation preview + unread counts
//         set((state) => {
//             const updated = (state.conversations?.data || []).map((conv) => {
//                 if (conv._id === message.conversation) {
//                     const isReceiver = message.reciever?._id === state.currentUser?._id;
//                     return {
//                         ...conv,
//                         lastMessage: message,
//                         unreadCount: isReceiver ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
//                     };
//                 }
//                 return conv;
//             });

//             return { conversations: { ...(state.conversations || {}), data: updated } };
//         });
//     },

//     // mark messages as read
//     markMessageAsRead: async () => {
//         const { messages, currentUser } = get();
//         if (!messages.length || !currentUser) return;

//         const unreadIds = messages
//             .filter((m) => m.messageStatus !== "read" && m.reciever?._id === currentUser._id)
//             .map((m) => m._id)
//             .filter(Boolean);

//         if (!unreadIds.length) return;

//         try {
//             await axiosInstance.put("/chats/messages/read", { messageIds: unreadIds });

//             set((state) => ({
//                 messages: state.messages.map((m) => (unreadIds.includes(m._id) ? { ...m, messageStatus: "read" } : m)),
//             }));

//             const socket = getSocket();
//             if (socket) {
//                 socket.emit("message_read", { messageIds: unreadIds, senderId: messages[0]?.sender?._id });
//             }
//         } catch (err) {
//             console.error("markMessageAsRead error", err);
//         }
//     },

//     deleteMessage: async (messageId) => {
//         try {
//             await axiosInstance.delete(`/chats/messages/${messageId}`);
//             set((state) => ({ messages: state.messages.filter((m) => m._id !== messageId) }));
//             return true;
//         } catch (err) {
//             console.error("deleteMessage error", err);
//             set({ error: err?.response?.data?.message || err?.message });
//             return false;
//         }
//     },

//     addReaction: (messageId, emoji) => {
//         const { currentUser } = get();
//         const socket = getSocket();
//         if (!socket || !currentUser) return;
//         socket.emit("add_reaction", { messageId, emoji, userId: currentUser._id });
//     },

//     startTyping: (recieverId) => {
//         const { currentConversation } = get();
//         const socket = getSocket();
//         if (!socket || !currentConversation || !recieverId) return;
//         socket.emit("typing_start", { conversationId: currentConversation, recieverId });
//     },

//     stopTyping: (recieverId) => {
//         const { currentConversation } = get();
//         const socket = getSocket();
//         if (!socket || !currentConversation || !recieverId) return;
//         socket.emit("typing_stop", { conversationId: currentConversation, recieverId });
//     },

//     isUserTyping: (userId) => {
//         const { typingUsers, currentConversation } = get();
//         if (!currentConversation || !userId || !typingUsers.has(currentConversation)) return false;
//         return typingUsers.get(currentConversation).has(userId);
//     },

//     isUserOnline: (userId) => {
//         if (!userId) return false;
//         const { onlineUsers } = get();
//         return onlineUsers.get(userId)?.isOnline || false;
//     },

//     getUserLastSeen: (userId) => {
//         if (!userId) return null;
//         const { onlineUsers } = get();
//         return onlineUsers.get(userId)?.lastSeen || null;
//     },

//     cleanUp: () =>
//         set({
//             conversations: [],
//             currentConversation: null,
//             messages: [],
//             loading: false,
//             error: null,
//             onlineUsers: new Map(),
//             typingUsers: new Map(),
//             currentUser: null,
//         }),
// }));

// export default useChatStore;





























// import { create } from "zustand";
// // import axiosInstance from "../services/url.services";
// import { getSocket } from "../services/chat.services";

// const useChatStore = create((set, get) => ({
//     conversations: [],
//     currentConversation: null,
//     messages: [],
//     typingUsers: {},
//     onlineUsers: {},
//     currentUser: null,
//     loading: false,
//     error: null,

//     setCurrentUser: (user) => set({ currentUser: user }),

//     fetchConversations: async () => {
//         set({ loading: true });
//         try {
//             const { data } = await axiosInstance.get("/chats/conversations");
//             set({ conversations: data, loading: false });
//         } catch (err) {
//             set({ error: err.message, loading: false });
//         }
//     },



//     fetchMessages: async (conversationId) => {
//         try {
//             set({ loading: true });
//             const { data } = await axiosInstance.get(`/chats/messages/${conversationId}`);
//             set({ messages: data, currentConversation: conversationId, loading: false });
//         } catch (err) {
//             set({ error: err.message, loading: false });
//         }
//     },

//     sendMessage: async (formData) => {
//         try {
//             const { data } = await axiosInstance.post("/chats/messages", formData, {
//                 headers: { "Content-Type": "multipart/form-data" },
//             });

//             set((state) => ({
//                 messages: [...state.messages, data],
//             }));

//             const socket = getSocket();
//             if (socket) {
//                 socket.emit("send_message", data);
//             }
//         } catch (error) {
//             console.error("Send message error:", error);
//         }
//     },

//     recieveMessage: (message) => {
//         set((state) => {
//             const exists = state.messages.some((m) => m._id === message._id);
//             if (exists) return {};
//             return { messages: [...state.messages, message] };
//         });
//     },

//     deleteMessage: async (messageId) => {
//         try {
//             await axiosInstance.delete(`/chats/messages/${messageId}`);
//             set((state) => ({
//                 messages: state.messages.filter((m) => m._id !== messageId),
//             }));
//         } catch (err) {
//             console.error("Delete message error:", err);
//         }
//     },

//     startTyping: (receiverId, conversationId) => {
//         const socket = getSocket();
//         socket.emit("typing_start", { conversationId, recieverId: receiverId });
//     },

//     stopTyping: (receiverId, conversationId) => {
//         const socket = getSocket();
//         socket.emit("typing_stop", { conversationId, recieverId: receiverId });
//     },

//     addReaction: (messageId, emoji, reactionUserId) => {
//         const socket = getSocket();
//         socket.emit("add_reaction", messageId, emoji, get().currentUser?._id, reactionUserId);
//     },

//     isUserOnline: (userId) => get().onlineUsers[userId]?.isOnline || false,
//     getUserLastSeen: (userId) => get().onlineUsers[userId]?.lastSeen || null,
//     isUserTyping: (userId) => get().typingUsers[userId] || false,

//     initSocketListner: () => {
//         const socket = getSocket();
//         if (!socket) return;

//         socket.on("recieve_message", (message) => get().recieveMessage(message));
//         socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
//             set((state) => ({
//                 onlineUsers: {
//                     ...state.onlineUsers,
//                     [userId]: { isOnline, lastSeen },
//                 },
//             }));
//         });
//         socket.on("user_typing", ({ userId, isTyping }) => {
//             set((state) => ({
//                 typingUsers: { ...state.typingUsers, [userId]: isTyping },
//             }));
//         });
//         socket.on("reaction_update", ({ messageId, reactions }) => {
//             set((state) => ({
//                 messages: state.messages.map((m) =>
//                     m._id === messageId ? { ...m, reactions } : m
//                 ),
//             }));
//         });
//     },

//     cleanUp: () => {
//         const socket = getSocket();
//         if (!socket) return;

//         socket.off("recieve_message");
//         socket.off("user_status");
//         socket.off("user_typing");
//         socket.off("reaction_update");
//     },
// }));

// export default useChatStore;
