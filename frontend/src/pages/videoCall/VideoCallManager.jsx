import React, { useEffect } from 'react'
import useVideoCallStore from '../store/videoCallStore'
import useUserStore from '../store/useUserStore'
import { useCallback } from 'react'
import VideoCallModel from './VideoCallModel'

const VideoCallManager = ({ socket }) => {

    const {
        setIncomingCall,
        setCurrentCall,
        setCallType,
        setCallModelOpen,
        endCall,
        setCallStatus,
    } = useVideoCallStore()


    const { user } = useUserStore();

    useEffect(() => {

        if (!socket) return;

        const handleIncomingCall = ({ callerId, callerName, callerAvatar, callType, callId }) => {
            setIncomingCall({
                callerId,
                callerName,
                callerAvatar,
                callId
            })

            setCallType(callType)
            setCallModelOpen(true)
            setCallStatus("ringing")
        }

        const handleCallEnded = ({ reason }) => {
            setCallStatus("failed")
            setTimeout(() => {
                endCall()
            }, 2000);
        }

        socket.on("incoming_call", handleIncomingCall)
        socket.on("call_failed", handleCallEnded)

        return () => {
            socket.off("incoming_call", handleIncomingCall)
            socket.off("call_failed", handleCallEnded)
        }

    }, [socket, setIncomingCall, setCallType, setCallModelOpen, setCallStatus, endCall]);


    // Memorize Person to initiate to call
    const initiateCall = useCallback((recieverId, recieverName, recieverAvatar, callType = "video") => {
        // const callId = `${user?._id}-${recieverId}-${new Date.now()}`
        // const callId = `${user?.id}-${recieverId}-${Date.now()}`
        const callId = `${user?._id}-${recieverId}-${Date.now()}`

        const callData = {
            callId,
            participantId: recieverId,
            participantName: recieverName,
            participantAvatar: recieverAvatar,
        }



        setCurrentCall(callData)
        setCallType(callType)
        setCallModelOpen(true)
        setCallStatus("calling")


        // emit the initiate
        socket.emit("initiate_call", {
            callerId: user?._id,
            recieverId,
            callType,
            callerInfo: {
                username: user.username,
                profilePicture: user.profilePicture,
            },
        })

    }, [user, socket, setCurrentCall, setCallType, setCallModelOpen, setCallStatus])





    // suppose initiate call function to store the data
    useEffect(() => {
        useVideoCallStore.getState().initiateCall = initiateCall
    }, [initiateCall])


    return <VideoCallModel socket={socket} />

}

export default VideoCallManager







































// import React, { useEffect } from 'react'
// import useVideoCallStore from '../store/videoCallStore'
// import useUserStore from '../store/useUserStore'
// import { useCallback } from 'react'
// import VideoCallModel from './videoCallModel'

// const VideoCallManager = ({ socket }) => {

//     const {
//         setIncomingCall,
//         setCallType,
//         setCurrentCall,
//         setCallModelOpen,
//         setCallStatus,
//         endCall
//     } = useVideoCallStore()


//     const { user } = useUserStore();

//     useEffect(() => {

//         if (!socket) return;

//         const handleIncomingCall = ({ callerId, callerName, callerAvatar, callId, callType }) => {
//             setIncomingCall({
//                 callerId,
//                 callerAvatar,
//                 callerName,
//                 callId
//             })

//             setCallType(callType)
//             setCallModelOpen(true)
//             setCallStatus("ringing")
//         }

//         const handleCallEnded = ({ reason }) => {
//             setCallStatus("failed")
//             setTimeout(() => {
//                 endCall()
//             }, 2000);
//         }

//         socket.on("Incoming_call", handleIncomingCall)
//         socket.on("call_failed", handleCallEnded)

//         return () => {
//             socket.off("Incoming_call", handleIncomingCall)
//             socket.off("call_failed", handleCallEnded)
//         }

//     }, [socket, setIncomingCall, setCallType, setCallModelOpen, setCallStatus, endCall])



//     // Memorize Person to initiate to call
//     const initiateCall = useCallback((recieverId, recieverName, recieverAvatar, callType = "video") => {
//         // const callId = `${user?._id}-${recieverId}-${new Date.now()}`
//         // const callId = `${user?.id}-${recieverId}-${Date.now()}`
//         const callId = `${user?._id}-${recieverId}-${Date.now()}`

//         const callData = {
//             callId,
//             participantId: recieverId,
//             participantName: recieverName,
//             participantAvatar: recieverAvatar,
//         }



//         setCurrentCall(callData)
//         setCallType(callType)
//         setCallModelOpen(true)
//         setCallStatus("calling")


//         // emit the initiate
//         socket.emit("initiate_call", {
//             callerId: user?._id,
//             recieverId,
//             callerInfo: {
//                 username: user.username,
//                 profilePicture: user.profilePicture,
//             },
//             callType,
//         })

//     }, [user, socket, setCurrentCall, setCallType, setCallModelOpen, setCallStatus])





//     // suppose initiate call function to store the data
//     useEffect(() => {
//         useVideoCallStore.getState().initiateCall = initiateCall
//         // useVideoCallStore.getState().initiateCall = initiateCall
//         console.log("useeffect");

//     }, [initiateCall])




//     return (

//         <VideoCallModel socket={socket} />

//     )
// }

// export default VideoCallManager
