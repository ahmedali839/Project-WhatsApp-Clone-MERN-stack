import React, { useState, useEffect, useRef } from 'react'
import useChatStore from "../store/useChatStore"
import useUserStore from '../store/useUserStore'
import useThemeStore from '../store/usethemeStore'
import { isToday, isYesterday, format } from 'date-fns'
import whatsappimage from "../../images/whatsapp_image.png"
import { FaArrowLeft, FaCamera, FaEllipsisV, FaFile, FaFileAlt, FaImage, FaLock, FaMusic, FaPaperclip, FaPaperPlane, FaSmile, FaTimes, FaVideo } from 'react-icons/fa'
import MessageBubble from '../utlis/MessageBubble'
import EmojiPicker from 'emoji-picker-react';
import useOutSideClick from '../../hooks/UseOutsideHook'
import VideoCallManager from '../videoCall/VideoCallManager'
import { getSocket } from '../services/chat.services'
import useVideoCallStore from '../store/videoCallStore'


const isValidate = (date) => {
  return date instanceof Date && !isNaN(date)
}

const ChatWindow = ({ selectedContact, setSelectedContact ,  recieverId, recieverName, recieverAvatar}) => {
  const [message, setMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [filePreview, setFilePreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const typingTimoutRef = useRef(null)
  const messageEndRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const fileInputRef = useRef(null)

  //  const initiateCall = useVideoCallStore((state) => state.initiateCall);


  const { user } = useUserStore();
  const { theme } = useThemeStore();
  
  const socket  =  getSocket(user?._id)

  const {
    conversations,
    typingUsers,
    onlineUsers,
    currentConversation,
    loading,
    messages,
    isUserOnline,
    getUserLastSeen,
    fetchConversations,
    isUserTyping,
    recieveMessage,
    fetchMessages,
    stopTyping,
    deleteMessage,
    sendMessage,
    startTyping,
    addReaction,
  } = useChatStore();

  const online = isUserOnline(selectedContact?._id)
  const lastSeen = getUserLastSeen(selectedContact?._id)
  const isTyping = isUserTyping(selectedContact?._id)


  const markMessagesAsRead = (conversationId, messages, userId, socket) => {
  const unreadMessages = messages.filter(
    (msg) =>
      msg.conversation === conversationId &&
      msg.reciever?._id === userId &&
      msg.messageStatus !== "read"
  );

  if (unreadMessages.length > 0) {
    const messageIds = unreadMessages.map((m) => m._id);
    const senderId = unreadMessages[0].sender._id;

    socket.emit("message_read", {
      messageIds,
      senderId,
      conversationId,
      readerId: userId,
    });
  }
};

useEffect(() => {
  if (selectedContact && messages.length > 0) {
    markMessagesAsRead(currentConversation, messages, user?._id, socket);
  }
}, [messages, selectedContact]);



  useEffect(() => {  
    if (selectedContact?._id && conversations?.data?.length > 0) {
      const conversation = conversations?.data?.find((conv) => conv.participants.some((participant) => participant?._id === selectedContact?._id))
      
    // console.log(conversation) 
      if (conversation?._id) {
        fetchMessages(conversation._id)
      }
    }
  }, [selectedContact, conversations])
  


  useEffect(() => {
    fetchConversations();
  }, [])


  const scrollToBottom = async () => {
    messageEndRef.current?.scrollIntoView({ behavior: "auto" })
  }


  useEffect(() => {
    scrollToBottom()
  }, [messages])


  useEffect(() => {
    if (message && selectedContact) {
      startTyping(selectedContact?._id)
    }

    if (typingTimoutRef.current) {
      clearTimeout(typingTimoutRef.current)
    }

    typingTimoutRef.current = setTimeout(() => {
      stopTyping(selectedContact?._id)
    }, 3000);

    return () => {
      if (typingTimoutRef.current) {
        clearTimeout(typingTimoutRef.current)
      }
    }
  }, [startTyping, stopTyping, message, selectedContact])


  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file),
        setShowFileMenu(false)
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file))
      }
    }
  }


  const handleSendMessage = async () => {

   // if no text message &&  file or image or video selected to send, returns; 
     if (!message.trim() && !selectedFile) return console.log("no message or file");
    
    try {
      const formData = new FormData()
      formData.append("senderId", user?._id)
      formData.append("recieverId", selectedContact?._id)

      const status = online ? "delivered" : "send"
      formData.append("messageStatus", status)
      if (message.trim()) {
        formData.append("content", message.trim())
      }
      //   if there file included too
      if (selectedFile) {
        formData.append("media", selectedFile, selectedFile.name)
      }

      // if no message or file return null
      if (!message.trim() && !selectedFile) return console.log("no message or file");
      ;


      // send towards backend
      await sendMessage(formData)

      setMessage("")
      setFilePreview(null)
      setSelectedFile(null)
      setShowFileMenu(false)
    } catch (error) {
      console.log("Error while sending message in handleSendMessage chatWindow", error);

    }
  }


  const renderValidateSeparator = (date) => {
    if (!isValidate(date)) {
      return;
    }

    let dateString;
    if (isToday(date)) {
      dateString = "Today"
    } else if (isYesterday(date)) {
      dateString = "Yesterday"
    } else {
      // dateString = format(date, "yyyy-MMMM-dd")
      dateString = format(date, "EE, MMMM d")
    }

    return (
      <div className={`flex my-4 justify-center`}>
        <span className={`px-4 py-2 text-sm rounded-full ${theme === "dark" ? "bg-gray-700 text-gray-300 " : "text-gray-600 bg-gray-200"}`}>
          {dateString}
        </span>
      </div>
    )
  }

  const groupedMessages = Array.isArray(messages) ? messages.reduce((acc, message) => {
    if (!message.createdAt) return acc;
    const date = new Date(message.createdAt)
    if (isValidate(date)) {
      // const dateString = format(date, "d-MMMM-dd")
      const dateString = format(date, "EE, MMMM d")
      if (!acc[dateString]) {
        acc[dateString] = []
      }
      acc[dateString].push(message)
    } else {
      console.error("Invalid date for message ", message);
    }
    return acc;

  }, {}) : {};



  const handleReaction = (messageId, emoji) => {
    addReaction(messageId, emoji)
  }



  useOutSideClick(emojiPickerRef, () => {
    if (showEmojiPicker) setShowEmojiPicker(false)
  })

  // useOutSideClick(fileInputRef, () => {
  //   if (showFileMenu) setShowFileMenu(false)
  // })

  // console.log("these are messages", messages);


  const handleVideoCall = () => {
    
    if (selectedContact && online) {
      const{ initiateCall } = useVideoCallStore.getState();

      const avartar = selectedContact?.profilePicture
     
      initiateCall(
        selectedContact?._id,
        selectedContact?.username,
        avartar,
        "video"
      )
    }else{
      alert("User is Offline, cannot Initiate the call")
    }
  }


  if (!selectedContact) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center ${theme === "dark" ? "" : "bg-[#ebe8e8]"} `}>
        <div className='max-w-md'>
          <img
            src={whatsappimage}
            alt="whatsapp_image"
            className={`w-full h-auto`}
          />
          <h2 className={`text-3xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
            Select a conversation to start chatting
          </h2>
          <p className={`  ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6 `}>
            Choose a contact from list on the left side to begin messaging
          </p>
          <p className={`flex ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6 text-sm items-center justify-center mt-8`}>
            <FaLock className={`h-4 w-4`} />  {" "} Your personal messages are end-to-end encrypted
          </p>
        </div>
      </div>
    )
  }

  
// const socket = async () => {
//  const socket  = await getSocket()
// console.log("user id: ",user?.id);
// 
//  const socket  =  getSocket(user?.id)
//  if (!socket) return console.log("socket not initialized in chat window");    
  // return socket
// }


  return (
<>
<div className={`flex flex-col flex-1 h-screen w-full`}>
      <div className={`p-4 ${theme === "dark" ? "bg-gray-600 text-white" : "text-gray-600 bg-gray-100"} flex`}>

        <button className='mr-2 focus:outline-none' onClick={() => setSelectedContact(null)}>
          <FaArrowLeft className='w-6 h-6' />
        </button>

        <img
          src={selectedContact?.profilePicture}
          alt={selectedContact?.username}
          className='w-10 h-10 rounded-full'
        />

        <div className='ml-3 flex-grow'>
          <h2 className='font-semibold text-start'> {selectedContact?.username}</h2>

          {isTyping ? (
            <div className='text-green-500 text-sm'>typing...</div>
          ) : (
            <p className={`textarea-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              {online 
              ? "Online"
              : lastSeen 
              ? `Last seen ${format(new Date(lastSeen), "HH:mm")}` 
              // ? `Last Seen` 
              : "Offline"}
            </p>
          )}
        </div>

        <div className={`flex items-center space-x-4`}>
          <button
          onClick={handleVideoCall}
                // onClick={() => initiateCall(socket, user, recieverId, recieverName, recieverAvatar, "video")}

          className='focus:outline-none'>
            <FaVideo 
            className='w-5 h-5 text-green-400 hover:text-green-500' />
          </button>
          <button className='focus:outline-none'>
            <FaEllipsisV className='w-5 h-5' />
          </button>
        </div>
      </div>


      <div className={`flex-1 p-4 overflow-y-auto ${theme === "dark" ? "bg-gray-700" : "bg-[#EEE8E0]"}`}>
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <React.Fragment key={date}>
            {renderValidateSeparator(new Date(date))}
 
            {/* {msgs && msgs.filter((msg) => msg.conversation === currentConversation).map((msg) => (
            console.log(msg)
            ))}
  */}
 
            {msgs && msgs.filter((msg) => msg.conversation === currentConversation).map((msg) => (
             <MessageBubble
                key={msg._id || "msg"}
                message={msg}
                theme={theme}
                currentUser={user}
                onReact={handleReaction}
                deleteMessage={deleteMessage}
              />
            ))}
          </React.Fragment>
        ))}
        <div ref={messageEndRef} />
      </div>

      {filePreview && (
        <div className={`bg-transparent relative p-2 ${theme === "dark" ?  "bg-[#738290]" : "bg-[#f8edeb]" } `}>

          {selectedFile?.type.startsWith("video/") ? (

            <video
              src={filePreview}
              controls
              alt="file-Preview"
              className={`w-80 object-cover rounded mx-auto shadow-lg`}
            />
            
          ) : (


            <img
              src={filePreview}
              alt="file-Preview"
              className={`w-80 object-cover rounded mx-auto shadow-lg`}
            />

          )}

          <button
          onClick={() => {
            setSelectedFile(null)
            setFilePreview(null)
          }}
          className={`absolute top-3 right-1 bg-red-500 hover:bg-red-600 rounded-full text-white p-1`} >
            <FaTimes className='h-4 w-4' />
          </button>
        </div>
      )}


      <div className={`p-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} flex items-center space-x-2 relative`}>
        <button className={`focus:outline-none`}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <FaSmile
  className={`w-6 h-6 ${theme === "dark" ? "text-gray-300 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"} opacity-75 hover:opacity-100 transition-all duration-200 cursor-pointer`}
          />
        </button>

        {showEmojiPicker && (
          <div className={`absolute left-0 bottom-16 z-50`} ref={emojiPickerRef}>
            <EmojiPicker
              onEmojiClick={(emojiObject) => {
                setMessage((prev) => prev + emojiObject.emoji)
                setShowEmojiPicker(false)
              }}
              theme={theme}
            />
          </div>
        )}

        <div className='relative'>
          <button className={`focus:outline-none`}
            onClick={() => setShowFileMenu(!showFileMenu)}
          >

<FaPaperclip
  className={`w-5 h-5 ${theme === "dark" ? "text-gray-300 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"} mt-2 opacity-75 hover:opacity-100 transition-all duration-200 cursor-pointer`}
/>
        </button>

          {/* {showFileMenu && (
            <div className={`absolute bottom-full  left-0 mb-2 ${theme === "dark" ? "bg-gray-400" : "bg-white"}  rounded shadow-lg`}>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept='image/*,video/*'
              />

              <button
                onClick={() => fileInputRef.current.click()}
                className={`w-full flex items-center px-4 py-2 transition-colors ${theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-100"} border border-red-500`}
              >
                <FaImage className=' w-6 h-6 mr-2' />  Image / video
              </button>

              <button
                onClick={() => fileInputRef.current.click()}
                className={`w-full flex items-center px-4 py-2 transition-colors ${theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-100"}`}
              >
                <FaFile className='mr-2 ' /> Documents
              </button>
            </div>
          )} */}


{showFileMenu && (
  <div className={`absolute bottom-full left-0 mb-3 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-xl shadow-lg border ${theme === "dark" ? "border-gray-700" : "border-gray-200"} overflow-hidden`}>
    
    {/* Hidden file inputs */}
    <input
      type="file"
      ref={fileInputRef}
      className="hidden"
      onChange={handleFileChange}
      accept='image/*,video/*'
      multiple
    />

    {/* Media Option */}
    <button
      onClick={() => fileInputRef.current.click()}
      className={`w-full flex items-center px-4 py-3 transition-colors duration-200 ${theme === "dark" ? "hover:bg-gray-700 text-gray-200" : "hover:bg-blue-50 text-gray-800"} group`}
    >
      <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3">
        <FaImage className="w-4 h-4" />
      </div>
      <span className="text-sm">Photos & Videos</span>
    </button>

    {/* Documents Option */}
    <button
      onClick={() => fileInputRef.current.click()}
      className={`w-full flex items-center px-4 py-3 transition-colors duration-200 ${theme === "dark" ? "hover:bg-gray-700 text-gray-200" : "hover:bg-green-50 text-gray-800"} group border-t ${theme === "dark" ? "border-gray-700" : "border-gray-100"}`}
    >
      <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3">
        <FaFileAlt className="w-4 h-4" />
      </div>
      <span className="text-sm">Documents</span>
    </button>
  </div>
)}

        </div>

        <input type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
          placeholder='Type a message'
          className={`flex-grow px-5 py-2 border rounded  focus:outline-none focus:ring-1 focus:ring-green-500
            ${theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white text-black border-gray-300 "}`}
        />
        <button onClick={handleSendMessage} className={`focus:outline-none`}>
          <FaPaperPlane className={`h-6 w-6 text-green-500`} />
        </button>

      </div>
    </div>


<VideoCallManager socket={socket}/>
 </>

  )
}

export default ChatWindow


















































// // frontend - src/pages/components/ChatWindow.jsx
// import React, { useState, useEffect, useRef } from "react";
// import useChatStore from "../store/useChatStore";
// import useUserStore from "../store/useUserStore";
// import useThemeStore from "../store/usethemeStore";
// import { isToday, isYesterday, format } from "date-fns";
// import whatsappimage from "../../images/whatsapp_image.png";
// import {
//   FaArrowLeft,
//   FaEllipsisV,
//   FaFile,
//   FaImage,
//   FaLock,
//   FaPaperclip,
//   FaPaperPlane,
//   FaSmile,
//   FaTimes,
//   FaVideo,
// } from "react-icons/fa";
// import MessageBubble from "../utlis/MessageBubble";
// import EmojiPicker from "emoji-picker-react";
// import useOutSideClick from "../../hooks/UseOutsideHook";
// import VideoCallManager from "../videoCall/videoCallManager";
// import { getSocket } from "../services/chat.services";
// import useVideoCallStore from "../store/videoCallStore";

// const isValidate = (date) => date instanceof Date && !isNaN(date);

// const ChatWindow = ({ selectedContact, setSelectedContact }) => {
//   const [message, setMessage] = useState("");
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [showFileMenu, setShowFileMenu] = useState(false);
//   const [filePreview, setFilePreview] = useState(null);
//   const [selectedFile, setSelectedFile] = useState(null);

//   const typingTimoutRef = useRef(null);
//   const messageEndRef = useRef(null);
//   const emojiPickerRef = useRef(null);
//   const fileInputRef = useRef(null);

//   const { user } = useUserStore();
//   const { theme } = useThemeStore();

//   // select methods from store
//   const {
//     conversations,
//     currentConversation,
//     fetchConversations,
//     fetchMessages,
//     startTyping,
//     stopTyping,
//     sendMessage,
//     addReaction,
//     isUserOnline,
//     isUserTyping,
//     getUserLastSeen,
//     deleteMessage,
//   } = useChatStore((state) => ({
//     conversations: state.conversations,
//     currentConversation: state.currentConversation,
//     fetchConversations: state.fetchConversations,
//     fetchMessages: state.fetchMessages,
//     startTyping: state.startTyping,
//     stopTyping: state.stopTyping,
//     sendMessage: state.sendMessage,
//     addReaction: state.addReaction,
//     isUserOnline: state.isUserOnline,
//     isUserTyping: state.isUserTyping,
//     getUserLastSeen: state.getUserLastSeen,
//     deleteMessage: state.deleteMessage,
//   }));

//   // IMPORTANT: subscribe to messages separately so re-render when store.messages changes
//   const messages = useChatStore((s) => s.messages);

//   const online = isUserOnline(selectedContact?._id);
//   const lastSeen = getUserLastSeen(selectedContact?._id);
//   const typing = isUserTyping(selectedContact?._id);

//   // get socket instance for VideoCallManager prop (if initialized)
//   const socket = getSocket();

//   useEffect(() => {
//     // when user selects a contact, load conversations if not loaded and fetch messages for the respective conversation
//     if (selectedContact?._id && conversations?.data?.length > 0) {
//       const conversation = conversations.data.find((conv) =>
//         conv.participants?.some((p) => p?._id === selectedContact?._id)
//       );
//       if (conversation?._id) {
//         fetchMessages(conversation._id);
//       }
//     }
//   }, [selectedContact, conversations, fetchMessages]);

//   useEffect(() => {
//     fetchConversations();
//   }, [fetchConversations]);

//   useEffect(() => {
//     messageEndRef.current?.scrollIntoView({ behavior: "auto" });
//   }, [messages]);

//   // typing indicator emit
//   useEffect(() => {
//     if (message && selectedContact) {
//       startTyping(selectedContact._id);
//     }
//     if (typingTimoutRef.current) clearTimeout(typingTimoutRef.current);

//     typingTimoutRef.current = setTimeout(() => {
//       stopTyping(selectedContact?._id);
//     }, 3000);

//     return () => clearTimeout(typingTimoutRef.current);
//   }, [message, selectedContact, startTyping, stopTyping]);

//   const handleFileChange = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setSelectedFile(file);
//     setShowFileMenu(false);
//     if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
//       setFilePreview(URL.createObjectURL(file));
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!message.trim() && !selectedFile) return;

//     try {
//       const formData = new FormData();
//       formData.append("senderId", user?._id);
//       formData.append("recieverId", selectedContact?._id);
//       const status = online ? "delivered" : "send";
//       formData.append("messageStatus", status);
//       if (message.trim()) formData.append("content", message.trim());
//       if (selectedFile) formData.append("media", selectedFile, selectedFile.name);

//       await sendMessage(formData);

//       setMessage("");
//       setFilePreview(null);
//       setSelectedFile(null);
//       setShowFileMenu(false);
//     } catch (err) {
//       console.error("handleSendMessage error", err);
//     }
//   };

//   const renderValidateSeparator = (date) => {
//     if (!isValidate(date)) return null;
//     let dateString;
//     if (isToday(date)) dateString = "Today";
//     else if (isYesterday(date)) dateString = "Yesterday";
//     else dateString = format(date, "EE, MMMM d");

//     return (
//       <div className="flex my-4 justify-center">
//         <span
//           className={`px-4 py-2 text-sm rounded-full ${
//             theme === "dark" ? "bg-gray-700 text-gray-300 " : "text-gray-600 bg-gray-200"
//           }`}
//         >
//           {dateString}
//         </span>
//       </div>
//     );
//   };

//   const groupedMessages = Array.isArray(messages)
//     ? messages.reduce((acc, msg) => {
//         if (!msg.createdAt) return acc;
//         const date = new Date(msg.createdAt);
//         if (!isValidate(date)) return acc;
//         const dateString = format(date, "EE, MMMM d");
//         if (!acc[dateString]) acc[dateString] = [];
//         acc[dateString].push(msg);
//         return acc;
//       }, {})
//     : {};

//   const handleReaction = (messageId, emoji) => {
//     addReaction(messageId, emoji);
//   };

//   const handleVideoCall = () => {
//     if (!selectedContact) return;
//     if (!online) {
//       alert("User is offline");
//       return;
//     }
//     const { initiateCall } = useVideoCallStore.getState();
//     initiateCall(selectedContact._id, selectedContact.username, selectedContact.profilePicture, "video");
//   };

//   if (!selectedContact) {
//     return (
//       <div
//         className={`flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center ${
//           theme === "dark" ? "" : "bg-[#ebe8e8]"
//         } `}
//       >
//         <div className="max-w-md">
//           <img src={whatsappimage} alt="whatsapp_image" className="w-full h-auto" />
//           <h2 className={`text-3xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
//             Select a conversation to start chatting
//           </h2>
//           <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6 `}>
//             Choose a contact from list on the left side to begin messaging
//           </p>
//           <p className={`flex ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6 text-sm items-center justify-center mt-8`}>
//             <FaLock className={`h-4 w-4`} /> Your personal messages are end-to-end encrypted
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className={`flex flex-col flex-1 h-screen w-full`}>
//         <div className={`p-4 ${theme === "dark" ? "bg-gray-600 text-white" : "text-gray-600 bg-gray-100"} flex`}>
//           <button className="mr-2 focus:outline-none" onClick={() => setSelectedContact(null)}>
//             <FaArrowLeft className="w-6 h-6" />
//           </button>

//           <img src={selectedContact?.profilePicture} alt={selectedContact?.username} className="w-10 h-10 rounded-full" />

//           <div className="ml-3 flex-grow">
//             <h2 className="font-semibold text-start"> {selectedContact?.username}</h2>

//             {typing ? (
//               <div className="text-green-500 text-sm">typing...</div>
//             ) : (
//               <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
//                 {online ? "Online" : lastSeen ? `Last Seen ${format(new Date(lastSeen), "HH:mm")}` : "Offline"}
//               </p>
//             )}
//           </div>

//           <div className={`flex items-center space-x-4`}>
//             <button onClick={handleVideoCall} className="focus:outline-none">
//               <FaVideo className="w-5 h-5 text-green-400 hover:text-green-500" />
//             </button>
//             <button className="focus:outline-none">
//               <FaEllipsisV className="w-5 h-5" />
//             </button>
//           </div>
//         </div>

//         <div className={`flex-1 p-4 overflow-y-auto ${theme === "dark" ? "bg-gray-700" : "bg-[#EEE8E0]"}`}>
//           {Object.entries(groupedMessages).map(([date, msgs]) => (
//             <React.Fragment key={date}>
//               {renderValidateSeparator(new Date(date))}
//               {msgs.filter((msg) => msg.conversation === currentConversation).map((msg) => (
//                 <MessageBubble
//                   key={msg._id}
//                   message={msg}
//                   theme={theme}
//                   currentUser={user}
//                   onReact={handleReaction}
//                   deleteMessage={deleteMessage}
//                 />
//               ))}
//             </React.Fragment>
//           ))}
//           <div ref={messageEndRef} />
//         </div>

//         {filePreview && (
//           <div className="relative p-2">
//             {selectedFile?.type?.startsWith("video/") ? (
//               <video src={filePreview} controls className="w-80 object-cover rounded mx-auto shadow-lg" />
//             ) : (
//               <img src={filePreview} alt="file-Preview" className="w-80 object-cover rounded mx-auto shadow-lg" />
//             )}

//             <button
//               onClick={() => {
//                 setSelectedFile(null);
//                 setFilePreview(null);
//               }}
//               className="absolute top-3 right-1 bg-red-500 hover:bg-red-600 rounded-full text-white p-1"
//             >
//               <FaTimes className="h-4 w-4" />
//             </button>
//           </div>
//         )}

//         <div className={`p-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} flex items-center space-x-2 relative`}>
//           <button className="focus:outline-none" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
//             <FaSmile className={`w-6 h-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
//           </button>

//           {showEmojiPicker && (
//             <div className="absolute left-0 bottom-16 z-50" ref={emojiPickerRef}>
//               <EmojiPicker
//                 onEmojiClick={(emojiObject) => {
//                   setMessage((prev) => prev + emojiObject.emoji);
//                   setShowEmojiPicker(false);
//                 }}
//                 theme={theme}
//               />
//             </div>
//           )}

//           <div className="relative">
//             <button className="focus:outline-none" onClick={() => setShowFileMenu(!showFileMenu)}>
//               <FaPaperclip className={`w-6 h-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"} mt-2`} />
//             </button>

//             {showFileMenu && (
//               <div className={`absolute bottom-full left-0 mb-2 ${theme === "dark" ? "bg-gray-400" : "bg-white"} rounded shadow-lg`}>
//                 <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,video/*" />
//                 <button onClick={() => fileInputRef.current.click()} className={`w-full flex items-center px-4 py-2`}>
//                   <FaImage className="w-6 h-6 mr-2" /> Image / video
//                 </button>
//                 <button onClick={() => fileInputRef.current.click()} className={`w-full flex items-center px-4 py-2`}>
//                   <FaFile className="mr-2" /> Documents
//                 </button>
//               </div>
//             )}
//           </div>

//           <input
//             type="text"
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             onKeyPress={(e) => {
//               if (e.key === "Enter") handleSendMessage();
//             }}
//             placeholder="Type a message"
//             className={`flex-grow px-5 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-green-500 ${
//               theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white text-black border-gray-300"
//             }`}
//           />
//           <button onClick={handleSendMessage} className="focus:outline-none">
//             <FaPaperPlane className="h-6 w-6 text-green-500" />
//           </button>
//         </div>
//       </div>

//       <VideoCallManager socket={socket} />
//     </>
//   );
// };

// export default ChatWindow;






























































// import React, { useState, useEffect, useRef } from "react";
// import useChatStore from "../store/useChatStore";
// import useUserStore from "../store/useUserStore";
// import useThemeStore from "../store/usethemeStore";
// import { isToday, isYesterday, format, longFormatters } from "date-fns";
// import whatsappimage from "../../images/whatsapp_image.png";
// import {
//   FaArrowLeft,
//   FaEllipsisV,
//   FaFile,
//   FaImage,
//   FaLock,
//   FaPaperclip,
//   FaPaperPlane,
//   FaSmile,
//   FaTimes,
//   FaVideo,
// } from "react-icons/fa";
// import MessageBubble from "../utlis/MessageBubble";
// import EmojiPicker from "emoji-picker-react";
// import useOutSideClick from "../../hooks/UseOutsideHook";

// const isValidDate = (date) => date instanceof Date && !isNaN(date);

// const ChatWindow = ({ selectedContact, setSelectedContact }) => {
//   const [message, setMessage] = useState("");
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [showFileMenu, setShowFileMenu] = useState(false);
//   const [filePreview, setFilePreview] = useState(null);
//   const [selectedFile, setSelectedFile] = useState(null);

//   const typingTimeoutRef = useRef(null);
//   const messageEndRef = useRef(null);
//   const emojiPickerRef = useRef(null);
//   const fileInputRef = useRef(null);

//   const { user } = useUserStore();
//   const { theme } = useThemeStore();

//   const {
//     conversations,
//     typingUsers,
//     onlineUsers,
//     currentConversation,
//     loading,
//     messages,
//     isUserOnline,
//     getUserLastSeen,
//     fetchConversations,
//     isUserTyping,
//     fetchMessages,
//     stopTyping,
//     deleteMessage,
//     sendMessage,
//     startTyping,
//     addReaction,
//   } = useChatStore();



//   const online = isUserOnline(selectedContact?._id);
//   const lastSeen = getUserLastSeen(selectedContact?._id);
//   const isTyping = isUserTyping(selectedContact?._id);

//   // Fetch messages when contact changes
//   useEffect(() => {
   
//     console.log(conversations?.data?.length); // undefined
//     console.log(selectedContact?._id); // okay

//     if (selectedContact?._id && conversations?.data?.length > 0) {
//       const conv = conversations?.data?.find((c) =>
//         c.participants.some((p) => p._id === selectedContact._id)
//       );
//       if (conv?._id) fetchMessages(conv._id);
//     }
//   }, [selectedContact, conversations, fetchMessages]);

//   // Initial fetch of conversations
//   useEffect(() => {
//     fetchConversations();
//   }, [fetchConversations]);

//   // Auto scroll on new messages
//   useEffect(() => {
//     messageEndRef.current?.scrollIntoView({ behavior: "auto" });
//   }, [messages]);

//   // Typing indicator
//   useEffect(() => {
//     if (message && selectedContact) {
//       startTyping(selectedContact._id);
//     }
//     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

//     typingTimeoutRef.current = setTimeout(() => {
//       stopTyping(selectedContact?._id);
//     }, 3000);

//     return () => clearTimeout(typingTimeoutRef.current);
//   }, [message, selectedContact, startTyping, stopTyping]);

//   // File change
//   const handleFileChange = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setSelectedFile(file);
//     setShowFileMenu(false);

//     if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
//       setFilePreview(URL.createObjectURL(file));
//     }
//   };

//   // Send message
//   const handleSendMessage = async () => {
//     if (!message.trim() && !selectedFile) return;

//     try {
//       const formData = new FormData();
//       formData.append("senderId", user?._id);
//       // formData.append("receiverId", selectedContact?._id);
//       formData.append("recieverId", selectedContact?._id);

//       const status = online ? "delivered" : "send";
//       formData.append("messageStatus", status);

//       if (message.trim()) formData.append("content", message.trim());
//       if (selectedFile) {
//         formData.append("media", selectedFile, selectedFile.name);
//       }

//       await sendMessage(formData);

//       setMessage("");
//       setFilePreview(null);
//       setSelectedFile(null);
//       setShowFileMenu(false);
//     } catch (err) {
//       console.error("Error sending message:", err);
//     }
//   };

//   // Group messages by day
//   const groupedMessages = Array.isArray(messages)
//     ? messages.reduce((acc, msg) => {
//       if (!msg.createdAt) return acc;
//       const dayKey = new Date(msg.createdAt).toDateString();
//       acc[dayKey] = acc[dayKey] || [];
//       acc[dayKey].push(msg);
//       return acc;
//     }, {})
//     : {};

//   const renderDaySeparator = (date) => {
//     if (!isValidDate(date)) return null;
//     let label = format(date, "EE, MMMM d");
//     if (isToday(date)) label = "Today";
//     else if (isYesterday(date)) label = "Yesterday";

//     return (
//       <div className="flex my-4 justify-center">
//         <span
//           className={`px-4 py-2 text-sm rounded-full ${theme === "dark"
//             ? "bg-gray-700 text-gray-300"
//             : "text-gray-600 bg-gray-200"
//             }`}
//         >
//           {label}
//         </span>
//       </div>
//     );
//   };

//   // Close emoji/file pickers on outside click
//   useOutSideClick(emojiPickerRef, () => setShowEmojiPicker(false));
//   useOutSideClick(fileInputRef, () => setShowFileMenu(false));

//   // No contact selected UI
//   if (!selectedContact) {
//     return (
//       <div
//         className={`flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center ${theme === "dark" ? "" : "bg-[#ebe8e8]"
//           }`}
//       >
//         <div className="max-w-md">
//           <img src={whatsappimage} alt="WhatsApp" className="w-full h-auto" />
//           <h2
//             className={`text-3xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-black"
//               }`}
//           >
//             Select a conversation to start chatting
//           </h2>
//           <p
//             className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"
//               } mb-6`}
//           >
//             Choose a contact from the list on the left side to begin messaging
//           </p>
//           <p
//             className={`flex ${theme === "dark" ? "text-gray-400" : "text-gray-600"
//               } mb-6 text-sm items-center justify-center mt-8`}
//           >
//             <FaLock className="h-4 w-4 mr-2" /> Your personal messages are
//             end-to-end encrypted
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col flex-1 h-screen w-full">
//       {/* Header */}
//       <div
//         className={`p-4 ${theme === "dark"
//           ? "bg-gray-600 text-white"
//           : "text-gray-600 bg-gray-100"
//           } flex`}
//       >
//         <button onClick={() => setSelectedContact(null)} className="mr-2">
//           <FaArrowLeft className="w-6 h-6" />
//         </button>
//         <img
//           src={selectedContact?.profilePicture}
//           alt={selectedContact?.username}
//           className="w-10 h-10 rounded-full"
//         />
//         <div className="ml-3 flex-grow">
//           <h2 className="font-semibold">{selectedContact?.username}</h2>
//           {isTyping ? (
//             <div className="text-green-500 text-sm">typing...</div>
//           ) : (
//             <p
//               className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"
//                 }`}
//             >
//               {online
//                 ? "Online"
//                 : lastSeen
//                   ? `Last Seen ${format(new Date(lastSeen), "HH:mm")}`
//                   : "Offline"}
//             </p>
//           )}
//         </div>
//         <div className="flex items-center space-x-4">
//           <button>
//             <FaVideo className="w-5 h-5" />
//           </button>
//           <button>
//             <FaEllipsisV className="w-5 h-5" />
//           </button>
//         </div>
//       </div>

//       {/* Messages */}
//       <div
//         className={`flex-1 p-4 overflow-y-auto ${theme === "dark" ? "bg-gray-700" : "bg-[#EEE8E0]"
//           }`}
//       >
//         {Object.entries(groupedMessages).map(([day, msgs]) => (
//           <React.Fragment key={day}>
//             {renderDaySeparator(new Date(day))}
//             {msgs.map((msg) => (
//               <MessageBubble
//                 key={msg._id}
//                 message={msg}
//                 theme={theme}
//                 currentUser={user}
//                 onReact={addReaction}
//                 deleteMessage={deleteMessage}
//               />
//             ))}
//           </React.Fragment>
//         ))}
//         <div ref={messageEndRef} />
//       </div>

//       {/* File Preview */}
//       {filePreview && (
//         <div className="relative p-2">
//           {selectedFile?.type.startsWith("video/") ? (
//             <video
//               src={filePreview}
//               controls
//               className="w-80 object-cover rounded mx-auto shadow-lg"
//             />
//           ) : (
//             <img
//               src={filePreview}
//               alt="file preview"
//               className="w-80 object-cover rounded mx-auto shadow-lg"
//             />
//           )}
//           <button
//             onClick={() => {
//               setFilePreview(null);
//               setSelectedFile(null);
//             }}
//             className="absolute top-3 right-1 bg-red-500 hover:bg-red-600 rounded-full text-white p-1"
//           >
//             <FaTimes className="h-4 w-4" />
//           </button>
//         </div>
//       )}

//       {/* Input */}
//       <div
//         className={`p-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
//           } flex items-center space-x-2 relative`}
//       >
//         {/* Emoji */}
//         <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
//           <FaSmile
//             className={`w-6 h-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
//               }`}
//           />
//         </button>
//         {showEmojiPicker && (
//           <div className="absolute left-0 bottom-16 z-50" ref={emojiPickerRef}>
//             <EmojiPicker
//               onEmojiClick={(e) => setMessage((prev) => prev + e.emoji)}
//               theme={theme}
//             />
//           </div>
//         )}

//         {/* File */}
//         <div className="relative">
//           <button onClick={() => setShowFileMenu(!showFileMenu)}>
//             <FaPaperclip
//               className={`w-6 h-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
//                 } mt-2`}
//             />
//           </button>
//           {showFileMenu && (
//             <div
//               className={`absolute bottom-full left-0 mb-2 ${theme === "dark" ? "bg-gray-400" : "bg-white"
//                 } rounded shadow-lg`}
//             >
//               <input
//                 type="file"
//                 ref={fileInputRef}
//                 className="hidden"
//                 onChange={handleFileChange}
//                 accept="image/*,video/*"
//               />
//               <button
//                 onClick={() => fileInputRef.current.click()}
//                 className="w-full flex items-center px-4 py-2 hover:bg-gray-200"
//               >
//                 <FaImage className="w-6 h-6 mr-2" /> Image / Video
//               </button>
//               <button
//                 onClick={() => fileInputRef.current.click()}
//                 className="w-full flex items-center px-4 py-2 hover:bg-gray-200"
//               >
//                 <FaFile className="w-6 h-6 mr-2" /> Documents
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Input */}
//         <input
//           type="text"
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
//           placeholder="Type a message"
//           className={`flex-grow px-5 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-green-500 ${theme === "dark"
//             ? "bg-gray-700 text-white border-gray-600"
//             : "bg-white text-black border-gray-300"
//             }`}
//         />
//         <button onClick={handleSendMessage}>
//           <FaPaperPlane className="h-6 w-6 text-green-500" />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ChatWindow;
