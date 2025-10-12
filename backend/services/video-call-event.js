const handleVideoCallEvent = (socket, io, onlineUsers) => {

    // initiate the call
    socket.on("initiate_call", ({ callerId, recieverId, callType, callerInfo }) => {

        const recieverSocketId = onlineUsers.get(recieverId)

        if (recieverSocketId) {
            const callId = `${callerId}-${recieverId}-${Date.now()}`

            io.to(recieverSocketId).emit("incoming_call", {
                callerId,
                callerName: callerInfo.username,
                callerAvatar: callerInfo.profilePicture,
                callId,
                callType,
            })

        } else {
            console.log(`Server response: ${recieverId} is offline.`);
            socket.emit("call_failed", { reason: "User is offline." })
        }
    })


    // Accept the call 
    socket.on("accept_call", ({ callerId, callId, recieverInfo }) => {

        const callerSocketId = onlineUsers.get(callerId)

        if (callerSocketId) {
            io.to(callerSocketId).emit("call_accepted", {
                callerName: recieverInfo.username,
                callerAvatar: recieverInfo.profilePicture,
                callId,
            })

        } else {
            console.log(`Server:  Caller ${callerId} is not found.`);
        }


    })


    // reject the call 
    socket.on("reject_call", ({ callerId, callId }) => {
        const callerSocketId = onlineUsers.get(callerId)
        if (callerSocketId) {
            io.to(callerSocketId).emit("call_rejected", { callId })
        }
    })



    // end the call
    socket.on("end_call", ({ callId, participantId }) => {
        const participantSocketId = onlineUsers.get(participantId)
        if (participantSocketId) {
            io.to(participantSocketId).emit("call_ended", { callId })
        }
    })

    // webrtc signaling offering video with userId
    socket.on("webrtc_offer", ({ offer, recieverId, callId }) => {
        const recieverSocketId = onlineUsers.get(recieverId)

        if (recieverSocketId) {
            io.to(recieverSocketId).emit("webrtc_offer", {
                offer,
                senderId: socket.userId,
                callId
            })
            console.log(`server offer forwarded to this ${recieverId}`);
        } else {
            console.log(`server: reciever ${recieverId} not found`);
        }
    })



    // webrtc signaling answering video with userId
    socket.on("webrtc_answer", ({ answer, recieverId, callId }) => {
        const recieverSocketId = onlineUsers.get(recieverId)

        if (recieverSocketId) {
            io.to(recieverSocketId).emit("webrtc_answer", {
                answer,
                senderId: socket.userId,
                callId
            })
            console.log(`server answer forwarded to this ${recieverId}`);
        } else {
            console.log(`server: answer ${recieverId} not found & answer`);
        }
    })


    // webrtc signaling answer video with userId
    socket.on("webrtc_ice_candidate", ({ candidate, recieverId, callId }) => {
        const recieverSocketId = onlineUsers.get(recieverId)

        if (recieverSocketId) {
            io.to(recieverSocketId).emit("webrtc_ice_candidate", {
                candidate,
                senderId: socket.userId,
                callId
            })
            console.log(`server answer ffforwarded to this ${recieverId}`);
        } else {
            console.log(`server: answer ${recieverId} not found for the ice candiate`);
        }
    })


}

export default handleVideoCallEvent;


























































// const handleVideoCallEvent = (socket, io, onlineUsers) => {

//     // initiate the call
//     socket.on("initiate_call", ({ callerId, recieverId, callerInfo, callType }) => {

//         const recieverSocketId = onlineUsers.get(recieverId)

//         if (recieverSocketId) {
//             const callId = `${callerId}-${recieverId}-${Date.now()}`

//             io.to(recieverSocketId).emit("Incoming_call", {
//                 callerId,
//                 callType,
//                 callId,
//                 callerName: callerInfo.username,
//                 callerAvatar: callerInfo.profilePicture,
//             })

//         } else {
//             console.log(`Server response: ${recieverId} is offline.`);
//             socket.emit("call_failed", { reason: "User is offline." })
//         }


//     })


//     // Accept the call
//     socket.on("accept_call", ({ callerId, callId, recieverInfo }) => {

//         const callerSocketId = onlineUsers.get(callerId)

//         if (callerSocketId) {
//             // const callId = `${callerId}-${recieverId}-${Date.now()}`

//             io.to(callerSocketId).emit("call_accepted", {
//                 // callerId,
//                 callerName: recieverInfo.username,
//                 callerAvatar: recieverInfo.profilePicture,
//                 callId,
//             })

//         } else {
//             console.log(`Server:  Caller ${callerId} is not found.`);
//         }


//     })


//     // reject the call
//     socket.on("reject_call", ({ callerId, callId }) => {
//         const callerSocketId = onlineUsers.get(callerId)
//         if (callerSocketId) {
//             io.to(callerSocketId).emit("call_rejected", { callId })
//         }
//     })



//     // end the call
//     socket.on("end_call", ({ participantId, callId }) => {
//         const participantSocketId = onlineUsers.get(participantId)
//         if (participantSocketId) {
//             io.to(participantSocketId).emit("call_ended", { callId })
//         }
//     })

//     // webrtc signaling offering video with userId
//     socket.on("webrtc_offer", ({ offer, recieverId, callId }) => {
//         const recieverSocketId = onlineUsers.get(recieverId)

//         if (recieverSocketId) {
//             io.to(recieverSocketId).emit("webrtc_offer", {
//                 callId,
//                 senderId: socket.userId,
//                 offer
//             })
//             console.log(`server offer forwarded to this ${recieverId}`);
//         } else {
//             console.log(`server: reciever ${recieverId} not found`);
//         }
//     })



//     // webrtc signaling answering video with userId
//     socket.on("webrtc_answer", ({ answer, recieverId, callId }) => {
//         const recieverSocketId = onlineUsers.get(recieverId)

//         if (recieverSocketId) {
//             io.to(recieverSocketId).emit("webrtc_answer", {
//                 answer,
//                 senderId: socket.userId,
//                 callId
//             })
//             console.log(`server answer forwarded to this ${recieverId}`);
//         } else {
//             console.log(`server: answer ${recieverId} not found & answer`);
//         }
//     })


//     // webrtc signaling answer video with userId
//     socket.on("webrtc_ice_candidate", ({ candidate, recieverId, callId }) => {
//         const recieverSocketId = onlineUsers.get(recieverId)

//         if (recieverSocketId) {
//             io.to(recieverSocketId).emit("webrtc_ice_candidate", {
//                  candidate,
//                 senderId: socket.userId,
//                 callId
//             })
//             console.log(`server answer forwarded to this ${recieverId}`);
//         } else {
//             console.log(`server: answer ${recieverId} not found for the ice candiate`);
//         }
//     })


// }

// export default handleVideoCallEvent;