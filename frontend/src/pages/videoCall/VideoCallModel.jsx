import React, { useRef, useMemo, useEffect } from 'react'
import useVideoCallStore from '../store/videoCallStore'
import useUserStore from '../store/useUserStore'
import usethemeStore from '../store/usethemeStore'
import { FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaTimes, FaVideo, FaVideoSlash } from "react-icons/fa"

const VideoCallModel = ({ socket }) => {

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  const {
    isVideoEnabled, localStream, currentCall, isCallActive, incomingCall, callType,
    isAudioEnabled, remoteStream, isCallModelOpen, peerConnection, callStatus, iceCandidatesQueue,
    setIncomingCall, setCallType, setCurrentCall,
    setCallActive, setLocalStream, setRemoteStream,
    setPeerConnection, processQueuedIceCandidates,
    setCallModelOpen, setCallStatus, addIceCandidate, toggleVideo,
    toggleAudio, endCall, clearIncomingCall,
  } = useVideoCallStore()

  const { user } = useUserStore()
  const { theme } = usethemeStore()



  const rtcConfiguration = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302'
      },
      {
        urls: 'stun:stun1.l.google.com:19302'
      },
      {
        urls: 'stun:stun2.l.google.com:19302'
      },
    ],
  };



  // Memorize display the user info this prevent unecesarry re-renders

  const displayInfo = useMemo(() => {
    if (incomingCall && !isCallActive) {
      return {
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar,
      }
    } else if (currentCall) {

      return {
        name: currentCall.participantName,
        avatar: currentCall.participantAvatar,
      }
    }

    return null;
  }, [incomingCall, isCallActive, currentCall])


  // connection the
  useEffect(() => {
    if (peerConnection && remoteStream) {
      console.log("both perrConnection and remote Stream is available.");
      setCallStatus("connected")
      setCallActive(true)
    }
  }, [peerConnection, remoteStream, setCallStatus, setCallActive])


  //  this for setup for local video stream when local streme changed
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream
      console.log("🎥 Local video attached", localStream);
    }
  }, [localStream])



  // setup the remote stream when remote stream changed
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])




  // intitiate media string
  const initializeMedia = async (video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio: true,
      })

      console.log("Initialize Media stream : ", stream.getTracks());
      setLocalStream(stream)
      return stream;
    } catch (error) {
      console.error("media error ", error);
      throw error
    }
  }



  // create perrConnection 
  const createPeerConnection = (stream, role) => {
    const pc = new RTCPeerConnection(rtcConfiguration)


    // add local tracks immediately
    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log(`${role}  adding ${track.kind} track`, track.id.slice(0, 8));
        pc.addTrack(track, stream)
        console.log("✅ Added track:", track);
      });
    }



    // handle ice Candidate
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const participantId = currentCall?.participantId || incomingCall?.callerId;
        const callId = currentCall?.callId || incomingCall?.callId;
        if (participantId && callId) {
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            recieverId: participantId,
            callId: callId
          })
        }
      }
    }




    // handle remote stream 
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0])
      } else {
        const stream = new MediaStream([event.track])
        setRemoteStream(stream)
      }
    }






    // monitor connection
    pc.onconnectionstatechange = () => {
      console.log(`role ${role} connection state: `, pc.connectionState);
      if (pc.connectionState === "failed") {
        setCallStatus("failed")
        setTimeout(handleEndCall, 2000)
      }
    }




    pc.oniceconnectionstatechange = () => {
      console.log(`role: ${role} ICE connection state:  `, pc.iceConnectionState);
    }

    // pc on signals:
    pc.onsignalingstatechange = () => {
      console.log(`role: ${role} ICE Signaling state:  `, pc.signalingState);
    }

    setPeerConnection(pc)
    return pc;
  }


  // caller: initialize call after acceptace
  const initializeCallerCall = async () => {
    try {

      setCallStatus("connecting");
      // get media

      const stream = await initializeMedia(callType === "video")
      // create peer connection with offer to reciever after accept the call
      const pc = createPeerConnection(stream, "CALLER")

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video"
      })
      console.log("📡 Created offer:", offer.sdp.slice(0, 200));

      // await pc.localDescription(offfer)
      await pc.setLocalDescription(offer)

      socket.emit("webrtc_offer", {
        offer,
        recieverId: currentCall?.participantId,
        // callerId: currentCall?.callId
        callId: currentCall?.callId
      })
      console.log("🚀 Emitted offer to:", currentCall?.participantId, offer);

    } catch (error) {
      console.log("caller error: ", error);
      setCallStatus("failed")
      setTimeout(handleEndCall, 2000);
    }
  }




  // Reciever answer the call
  const handleAnswerCall = async () => {
    try {
      setCallStatus("connecting")

      // get media
      const stream = await initializeMedia(callType === "video")

      createPeerConnection(stream, "RECIEVER")

      socket.emit("accept_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
        recieverInfo: {
          username: user?.username,
          profilePicture: user?.profilePicture
        }
      })

      setCurrentCall({
        callId: incomingCall?.callId,
        participantId: incomingCall?.callerId,
        participantName: incomingCall?.callerName,
        participantAvatar: incomingCall?.callerAvatar
      })

      clearIncomingCall();

    } catch (error) {
      console.log("reciver error: ", error);
      handleEndCall()
    }
  }


  // handle reject call
  const handleRejectCall = () => {
    if (incomingCall) {
      socket.emit("reject_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
      })
    }
    endCall()
  }


  const handleEndCall = () => {
    const participantId = currentCall?.participantId || incomingCall?.callerId
    const callId = currentCall?.callId || incomingCall?.callId;

    if (participantId && callId) {
      socket.emit("end_call", {
        callId: callId,
        participantId: participantId
      })
    }
    endCall();
  }




  // socket event listener:
  useEffect(() => {
    if (!socket) return;


    // call accepted start caller call
    const handleCallAccepted = ({ recieverName }) => {
      if (currentCall) {
        setTimeout(() => {
          initializeCallerCall()
        }, 500);
      }
    }


    const handleCallRejected = () => {
      setCallStatus("rejected")
      setTimeout(endCall, 2000);
    }


    const handleCallEnded = () => {
      endCall()
    }


    const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
      if (!peerConnection) return;


      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        // process queued ice candidates
        await processQueuedIceCandidates();

        // create answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer)

        socket.emit("webrtc_answer", {
          answer,
          recieverId: senderId,
          callId
        })

        console.log("Reciever : Answer is waiting for ice candidate");
      } catch (error) {
        console.log("Reciever offer error: ", error);
      }

    }


    // reciever answer (caller)
    const handleWebRTCAnswer = async ({ answer, senderId, callId }) => {
      if (!peerConnection) return;

      if (peerConnection.signalingState === "closed") {
        console.log("caller peerConnection is closed");
        return;
      }


      try {
        // current caller signaling
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

        // process the ice candiadates
        await processQueuedIceCandidates()

        // check reciever:
        const recievers = peerConnection.getReceivers();
        console.log("Recievers: ", recievers);
      } catch (error) {
        console.error("Caller answer Error", error);

      }
    }


    // Reciever ice candidates
    const handleWebRTCIceCandidates = async ({ candidate, senderId }) => {
      if (peerConnection && peerConnection.signalingState !== "closed") {

        if (peerConnection.setRemoteDescription) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            console.log("ICE candidates added");

          } catch (error) {
            console.log("ICE candidate Erro", error);

          }
        } else {
          console.log("queueing ice candidate");
          addIceCandidate(candidate)
        }
      }
    }




    // Register all Event Listeners
    socket.on("call_accepted", handleCallAccepted)
    socket.on("call_rejected", handleCallRejected)
    socket.on("call_ended", handleCallEnded)
    socket.on("webrtc_offer", handleWebRTCOffer)
    socket.on("webrtc_answer", handleWebRTCAnswer)
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidates)



    console.log(`socket listeners registers`);
    return () => {
      socket.off("call_accepted", handleCallAccepted)
      socket.off("call_rejected", handleCallRejected)
      socket.off("call_ended", handleCallEnded)
      socket.off("webrtc_offer", handleWebRTCOffer)
      socket.off("webrtc_answer", handleWebRTCAnswer)
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidates)
    }

  }, [socket, peerConnection, currentCall, incomingCall, user])


  if (!isCallModelOpen && !incomingCall) return null;

  const shouldShowCallActive = isCallActive || callStatus === "calling" || callStatus === "connecting"

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75'>
      <div className={`relative w-full h-full max-w-4xl max-h-3xl overflow-hidden rounded-lg ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}>

        {/* incoming call ui */}

        {incomingCall && !isCallActive && (
          <div className={`flex flex-col items-center justify-center h-full p-8`}>
            <div className={`text-center mb-8`}>
              <div className={`w-32 h-32 rounded-full bg-gray-300 mx-auto mb-4 overflow-hidden`}>
                <img
                  src={displayInfo?.avatar}
                  alt={displayInfo?.name}
                  className='object-cover w-full h-full'
                  onError={(e) => {
                    e.target.src = "/vite.svg"
                  }
                  }
                />
              </div>

              <h2 className={`text-2xl font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900 "}`}>
                {displayInfo?.name || "displayInfo no name"}
              </h2>

              <p className={`text-lg ${theme == "dark" ? "text-gray-200" : "text-gray-600"}`}>
                Incoming {callType} call...
              </p>
            </div>

            <div className={`flex space-x-6 `}>
              <button
                onClick={handleRejectCall}
                className={`w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 items-center justify-center text-white flex transition-colors`}>
                <FaPhoneSlash className='w-6 h-6' />
              </button>

              <button
                onClick={handleAnswerCall}
                className={`w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 items-center justify-center text-white flex transition-colors`}>
                <FaVideo className='w-6 h-6' />
              </button>
            </div>
          </div>
        )}



        {/* Active call UI */}

        {shouldShowCallActive && (
          <div className={`relative w-full h-full`}>
            {callType === "video" && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover bg-gray-800 ${remoteStream ? "block" : "hidden"}`}
              />
            )}



            {/* Avatar and status display  */}
            {(!remoteStream || callType !== "video") && (
              <div className='w-full h-full bg-gray-800 flex items-center justify-center'>
                <div className={`text-center `}>
                  <div className={`w-32 h-32 rounded-full bg-gray-600 mx-auto mb-4 overflow-hidden`}>
                    <img
                      src={displayInfo?.avatar}
                      alt={displayInfo?.name}
                      className={`w-full h-full object-cover`}
                      onError={(e) => {
                        e.target.src = "/vite.svg"
                      }
                      }
                    />
                  </div>

                  <p className={`text text-xl`}>
                    {console.log(displayInfo)}
                    {callStatus === "calling"
                      ? ` Calling ${displayInfo?.name}...`
                      : callStatus === "connecting"
                        ? "connecting..."
                        : callStatus === "connected"
                          ? displayInfo?.name
                          : callStatus === "failed"
                            ? "Connection Failed"
                            : displayInfo?.name
                    }
                  </p>
                </div>
              </div>
            )}



            {/* local video (picture in picture)  */}
            {callType === "video" && localStream && (
              <div className='absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white'>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover`}
                />
              </div>
            )}



            {/* call status */}
            <div className='absolute top-4 left-4'>
              <div className={`px-4 py-2 rounded-full ${theme === "dark" ? "bg-gray-800" : "bg-white"} bg-opacity-75 `}>
                <p className={`text-sm ${theme === "dark" ? "text-white " : "text-gray-900"}`}>
                  {callStatus === "connected" ? "connected" : callStatus}
                </p>
              </div>
            </div>





            {/* call controls */}
            <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 `}>
              <div className={`flex space-x-4`}>

                {console.log(callType)}


                {callType === "video" && (
                  <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoEnabled ? "bg-gray-600  hover:bg-gray-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}>

                    {isVideoEnabled ? (<FaVideo className='w-5 h-5' />) : (<FaVideoSlash className='w-5 h-5' />)}
                  </button>
                )}

                <button
                  onClick={toggleAudio}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isAudioEnabled ? "bg-gray-600  hover:bg-gray-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}>
                  {isAudioEnabled ? (<FaMicrophone className='w-5 h-5' />) : (<FaMicrophoneSlash className='w-5 h-5' />)}
                </button>

                <button
                  onClick={handleEndCall}
                  className={`w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 items-center justify-center text-white flex transition-colors`}>
                  <FaPhoneSlash className='w-5 h-5' />
                </button>


              </div>
            </div>
          </div>
        )}




        {/* End Call  */}
        {callStatus === "calling" && (
          <button
            onClick={handleEndCall}
            className={`absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-700 items-center justify-center text-white flex transition-colors`}>
            <FaTimes className='w-5 h-5' />
          </button>
        )}

      </div >
    </div >
  )
}

export default VideoCallModel
