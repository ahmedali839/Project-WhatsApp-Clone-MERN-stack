import { format } from 'date-fns'
import React, { useRef, useState } from 'react'
import { FaPlus, FaCheckDouble, FaRegCopy, FaSmile } from 'react-icons/fa'
import { FaCheck, } from 'react-icons/fa6'
import { HiDotsVertical } from 'react-icons/hi'
import { RxCross2 } from 'react-icons/rx'
import useOutSideClick from '../../hooks/UseOutsideHook'
import EmojiPicker from 'emoji-picker-react'


const MessageBubble = ({ message, theme, currentUser, onReact, deleteMessage }) => {

    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showReactions, setShowReactions] = useState(false)
    const [showOptions, setShowOptions] = useState(false)

    const messageRef = useRef(null)
    const optionRef = useRef(null)
    const emojiPickerRef = useRef(null)
    const reactionsMenuRef = useRef(null)

    const isUserMessage = message.sender._id === currentUser?._id;


    if (!message || Object.keys(message).length === 0) {
        return (
            <div className="flex justify-center items-center p-4 text-gray-500">
                {console.log("here not messages")}

                <p className="text-sm italic">No messages yet — start a conversation!</p>
            </div>
        )
    }


    const bubbleClass = isUserMessage ? `chat-end` : `chat-start`

    const bubbleContentClass = isUserMessage
        ? `chat-bubble md:max-w-[50%] min-w-[130px]  ${theme === "dark" ? "bg-green-500 text-white" : "bg-[#d3fCCC] text-black"}`
        : `chat-bubble md:max-w-[50%] min-w-[130px]  ${theme === "dark" ? "bg-white text-black" : "bg-[#FEFEFE] text-black"}`

    const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

    const handleReact = (emoji) => {
        onReact(message._id, emoji)
        setShowReactions(false)
        setShowEmojiPicker(false)
    }

    useOutSideClick(emojiPickerRef, () => {
        if (showEmojiPicker) setShowEmojiPicker(false)
    })

    useOutSideClick(optionRef, () => {
        if (showOptions) setShowOptions(false)
    })

    useOutSideClick(reactionsMenuRef, () => {
        if (showReactions) setShowReactions(false)
    })


    if (message === 0) return;

    return (
        <div className={`chat ${bubbleClass}`}>
            <div className={`${bubbleContentClass} relative group`} ref={messageRef}>

                <div className={`flex justify-center gap-2`}>
                    {!message.contentType && (
                        <div className='flex justify-center items-center'>
                            <h3 className='text-center font-semibold'>Start a new conversation</h3>
                            <p className='text-sm'>You did not texted to this specific person yet. </p>
                        </div>
                    )}

                    {message.contentType === "text" && (<p className='mr-2 text-sm'>{message.content} </p>)}

                    {message.contentType === "image" && (
                        <div className={``}>
                            <img
                                src={message.imageOrVideoUrl}
                                alt="image-vido"
                                className='rounded-lg max-w-xs'
                            />
                            <p className='mt-1'>{message.content}</p>
                        </div>
                    )}

                    {message.contentType === "video" && (
                        <div className={``}>
                            <video
                                src={message.imageOrVideoUrl}
                                alt="image-video"
                                controls
                                className='rounded-lg max-w-xs'
                            />
                            <p className='mt-1'>{message.content}</p>
                        </div>
                    )}
                </div>

                <div className='gap-1 flex justify-end self-end items-center mt-2 text-xs opacity-60 ml-2'>
                    <span className='textarea-xs'>{format(new Date(message.createdAt), "HH:mm")}</span>

                    {isUserMessage && (
                        <>
                            {message.messageStatus === "send" && (<FaCheck size={10} />)}
                            {message.messageStatus === "delivered" && (<FaCheckDouble size={10} />)}
                            {message.messageStatus === "read" && (<FaCheckDouble size={10} className='text-blue-600' />)}
                        </>
                    )}

                </div>

                <div className='absolute right-1 top-1 opacity-0 group-hover:opacity-100 z-20 transition-opacity '>
                    <button
                        onClick={() => setShowOptions((prev) => !prev)}
                        className={`p-1 rounded-full ${theme === "dark" ? "text-white" : "text-gray-800"}`} >
                        <HiDotsVertical size={18} />
                    </button>
                </div>

                <div className={`absolute ${isUserMessage ? "-left-10" : "-right-10"} top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2`}>
                    <button
                        onClick={() => setShowReactions(!showReactions)}
                        className={`p-2 rounded-full ${theme === "dark"
                            ? "bg-[#202c33] hover:bg-[#202c33]/80 "
                            : "bg-white hover:bg-gray-100"
                            } shadow-lg`}>

                        <FaSmile className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`} />
                    </button>
                </div>

                {showReactions && (
                    <div
                        ref={reactionsMenuRef}
                        className={`absolute -top-8 ${isUserMessage ? "left-0" : "left-36"} flex items-center transform -translate-x-1/2
                         bg-[#202c33] shadow-lg px-2 py-1.5 gap-1 rounded-full z-50`}>
                        {quickReactions.map((emoji, index) => (
                            <button
                                key={index}
                                onClick={() => handleReact(emoji)}
                                className={`hover:scale-125 transition-transform p-1`}
                            >
                                {emoji}
                            </button>
                        ))}

                        <div className={`w-[1px] h-5 bg-gray-600 mx-1`} />
                        <button className={`bg-[#ffffff1a]  rounded-full mr-2 p-1`}
                            onClick={() => setShowEmojiPicker(true)}
                        >
                            <FaPlus className='h-4 w-4 text-gray-400' />
                        </button>

                    </div>
                )}

                {showEmojiPicker && (
                    <div className={`absolute right-1 mb-6 z-50`} ref={emojiPickerRef}>
                        <div className='relative'>
                            <EmojiPicker
                                onEmojiClick={(emojiObject) =>
                                    handleReact(emojiObject.emoji)}
                                theme={theme} />

                            <button
                                onClick={() => setShowEmojiPicker(false)}
                                className='absolute right-2 top-2 text-gray-500 hover:text-gray-700'>
                                <RxCross2 />
                            </button>
                        </div>
                    </div>
                )}

                {message.reactions && message.reactions.length > 0 && (
                    <div className={`absolute -bottom-5 boder border-green-600 ${isUserMessage ? "right-2" : "left-2"} ${theme === "dark" ? "bg-[#2a3942]" : "bg-gray-200"} rounded-full px-2 shadow-md z-10`}>
                        {message.reactions.map((reaction, index) => (
                            <span
                                key={index}
                                className={`mr-1`}
                            >
                                {reaction.emoji}
                            </span>
                        ))}
                    </div>
                )}

                {showOptions && (
                    <div ref={optionRef} className={`text-sm py-2 shadow-lg z-50 rounded-xl w-36 absolute ring-1 top-8 ${theme === "dark" ? "text-white bg-[#1d1f1f]" : "text-black bg-gray-100"}`}>
                        <button
                            onClick={() => {
                                if (message.contentType === "text") {
                                    navigator.clipboard.writeText(message.content)
                                }
                                setShowOptions(false)
                            }}
                            className={`flex items-center w-full px-4 py-2 gap-3 rounded-lg`}
                        >

                            <FaRegCopy size={14} />
                            <span>Copy</span>
                        </button>


                        {isUserMessage && (
                            <button

                                onClick={() => {
                                    deleteMessage(message?._id)
                                    setShowOptions(false)
                                }}
                                className={`flex items-center w-full px-4 py-2 gap-3 rounded-lg text-red-500`}
                            >

                                <FaRegCopy className='text-red-600' size={14} />
                                <span>Delete</span>
                            </button>
                        )}


                    </div>
                )}

            </div>
        </div>

    )
}

export default MessageBubble























// import React, { useRef, useState } from "react";
// import { format } from "date-fns";
// import {
//     FaCheck,
//     FaCheckDouble,
//     FaRegCopy,
//     FaSmile,
//     FaPlus,
// } from "react-icons/fa";
// import { HiDotsVertical } from "react-icons/hi";
// import { RxCross2 } from "react-icons/rx";
// import useOutSideClick from "../../hooks/UseOutsideHook";
// import EmojiPicker from "emoji-picker-react";

// const MessageBubble = ({ message, theme, currentUser, onReact, deleteMessage }) => {
//     const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//     const [showReactions, setShowReactions] = useState(false);
//     const [showOptions, setShowOptions] = useState(false);

//     const optionRef = useRef(null);
//     const emojiPickerRef = useRef(null);
//     const reactionsMenuRef = useRef(null);

//     const isUserMessage = message?.sender?._id === currentUser?._id;

//     // ✅ Alignment: right for user, left for others
//     const bubbleClass = isUserMessage ? "chat-end" : "chat-start";

//     // ✅ WhatsApp-like colors
//     const bubbleContentClass = isUserMessage
//         ? `chat-bubble md:max-w-[60%] min-w-[120px]
//        ${theme === "dark" ? "bg-green-600 text-white" : "bg-green-400 text-white"}`
//         : `chat-bubble md:max-w-[60%] min-w-[120px]
//        ${theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-200 text-black"}`;

//     // ✅ Quick reactions
//     const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

//     const handleReact = (emoji) => {
//         onReact?.(message._id, emoji);
//         setShowReactions(false);
//         setShowEmojiPicker(false);
//     };

//     useOutSideClick(optionRef, () => setShowOptions(false));
//     useOutSideClick(emojiPickerRef, () => setShowEmojiPicker(false));
//     useOutSideClick(reactionsMenuRef, () => setShowReactions(false));

//     if (!message) return null;

//     // ✅ Status ticks
//     const renderStatusIcon = () => {
//         if (!isUserMessage) return null;
//         switch (message.messageStatus) {
//             case "send":
//                 return <FaCheck size={12} />;
//             case "delivered":
//                 return <FaCheckDouble size={12} />;
//             case "read":
//                 return <FaCheckDouble size={12} className="text-blue-500" />;
//             default:
//                 return null;
//         }
//     };

//     return (
//         <div className={`chat ${bubbleClass}`}>
//             <div className={`${bubbleContentClass} relative group rounded-2xl px-3 py-2`}>
//                 {/* ✅ Text / Media */}
//                 {message.contentType === "text" && (
//                     <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
//                 )}

//                 {message.contentType === "image" && (
//                     <div>
//                         <img
//                             src={message.imageOrVideoUrl}
//                             alt="sent"
//                             className="rounded-lg max-w-[250px]"
//                         />
//                         {message.content && <p className="mt-1 text-sm">{message.content}</p>}
//                     </div>
//                 )}

//                 {message.contentType === "video" && (
//                     <video controls className="rounded-lg max-w-[250px] mt-1">
//                         <source src={message.imageOrVideoUrl} type="video/mp4" />
//                     </video>
//                 )}

//                 {/* ✅ Time + Status */}
//                 <div className="flex justify-end items-center gap-1 mt-1 text-[11px] opacity-70">
//                     <span>{format(new Date(message.createdAt), "h:mm a")}</span>
//                     {renderStatusIcon()}
//                 </div>

//                 {/* ✅ Options (hover) */}
//                 <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 z-20 transition-opacity">
//                     <button
//                         onClick={() => setShowOptions((prev) => !prev)}
//                         className={`p-1 rounded-full ${theme === "dark" ? "text-white" : "text-gray-800"}`}
//                     >
//                         <HiDotsVertical size={18} />
//                     </button>
//                 </div>

//                 {/* ✅ Reactions button */}
//                 <div
//                     className={`absolute ${isUserMessage ? "-left-10" : "-right-10"} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex flex-col gap-2`}
//                 >
//                     <button
//                         onClick={() => setShowReactions(!showReactions)}
//                         className={`p-2 rounded-full shadow-lg ${theme === "dark" ? "bg-[#202c33]" : "bg-white"
//                             }`}
//                     >
//                         <FaSmile className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`} />
//                     </button>
//                 </div>

//                 {/* ✅ Quick reactions menu */}
//                 {showReactions && (
//                     <div
//                         ref={reactionsMenuRef}
//                         className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center bg-[#202c33] text-white shadow-lg px-2 py-1.5 gap-1 rounded-full z-50"
//                     >
//                         {quickReactions.map((emoji, idx) => (
//                             <button
//                                 key={idx}
//                                 onClick={() => handleReact(emoji)}
//                                 className="hover:scale-125 transition-transform p-1"
//                             >
//                                 {emoji}
//                             </button>
//                         ))}
//                         <div className="w-[1px] h-5 bg-gray-600 mx-1" />
//                         <button
//                             className="bg-[#ffffff1a] rounded-full mr-2 p-1"
//                             onClick={() => setShowEmojiPicker(true)}
//                         >
//                             <FaPlus className="h-4 w-4 text-gray-400" />
//                         </button>
//                     </div>
//                 )}

//                 {/* ✅ Emoji picker */}
//                 {showEmojiPicker && (
//                     <div className="absolute left-0 mb-6 z-50" ref={emojiPickerRef}>
//                         <div className="relative">
//                             <EmojiPicker
//                                 onEmojiClick={(e) => handleReact(e.emoji)}
//                                 theme={theme}
//                             />
//                             <button
//                                 onClick={() => setShowEmojiPicker(false)}
//                                 className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
//                             >
//                                 <RxCross2 />
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 {/* ✅ Already reacted */}
//                 {message.reactions && message.reactions.length > 0 && (
//                     <div
//                         className={`absolute -bottom-5 ${isUserMessage ? "right-2" : "left-2"
//                             } ${theme === "dark" ? "bg-[#2a3942]" : "bg-gray-200"} rounded-full px-2 shadow-md`}
//                     >
//                         {message.reactions.map((r, i) => (
//                             <span key={i} className="mr-1">
//                                 {r.emoji}
//                             </span>
//                         ))}
//                     </div>
//                 )}

//                 {/* ✅ Options dropdown */}
//                 {showOptions && (
//                     <div
//                         ref={optionRef}
//                         className={`text-sm py-2 shadow-lg rounded-xl w-36 absolute top-8 ${theme === "dark" ? "text-white bg-[#1d1f1f]" : "text-black bg-gray-100"
//                             }`}
//                     >
//                         <button
//                             onClick={() => {
//                                 if (message.contentType === "text") {
//                                     navigator.clipboard.writeText(message.content);
//                                 }
//                                 setShowOptions(false);
//                             }}
//                             className="flex items-center w-full px-4 py-2 gap-3 rounded-lg"
//                         >
//                             <FaRegCopy size={14} />
//                             <span>Copy</span>
//                         </button>

//                         {isUserMessage && (
//                             <button
//                                 onClick={() => {
//                                     deleteMessage?.(message._id);
//                                     setShowOptions(false);
//                                 }}
//                                 className="flex items-center w-full px-4 py-2 gap-3 rounded-lg text-red-500"
//                             >
//                                 <span>🗑️ Delete</span>
//                             </button>
//                         )}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default MessageBubble;




















// import { format } from "date-fns";
// import React, { useRef, useState } from "react";
// import { FaCheck, FaCheckDouble } from "react-icons/fa";

// const MessageBubble = ({ message, theme, currentUser, onReact, deleteMessage }) => {
//     const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//     const [showReactions, setShowReactions] = useState(false);
//     const [showOption, setShowOptions] = useState(false);

//     const messageRef = useRef(null);

//     const isUserMessage = message.sender._id === currentUser?._id;

//     // ✅ Position: right for user, left for others
//     const bubbleClass = isUserMessage ? "chat-end" : "chat-start";

//     // ✅ WhatsApp-like colors
//     const bubbleContentClass = isUserMessage
//         ? `chat-bubble md:max-w-[65%] min-w-[120px]
//        ${theme === "dark" ? "bg-green-600 text-white" : "bg-green-400 text-white"}`
//         : `chat-bubble md:max-w-[65%] min-w-[120px]
//        ${theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-200 text-black"}`;

//     // ✅ Status ticks
//     const renderStatusIcon = () => {
//         if (!isUserMessage) return null;
//         switch (message.messageStatus) {
//             case "send":
//                 return <FaCheck size={12} />;
//             case "delivered":
//                 return <FaCheckDouble size={12} />;
//             case "read":
//                 return <FaCheckDouble size={12} className="text-blue-500" />;
//             default:
//                 return null;
//         }
//     };

//     if (!message) return null;

//     return (
//         <div className={`chat ${bubbleClass}`}>
//             <div
//                 className={`${bubbleContentClass} relative group rounded-2xl px-3 py-2`}
//                 ref={messageRef}
//             >
//                 {/* ✅ Text */}
//                 {message.contentType === "text" && (
//                     <p className="whitespace-pre-wrap break-words text-sm">
//                         {message.content}
//                     </p>
//                 )}

//                 {/* ✅ Image / Video */}
//                 {message.contentType === "image" && (
//                     <div>
//                         <img
//                             src={message.imageOrVideoUrl}
//                             alt="sent media"
//                             className="rounded-lg max-w-[250px]"
//                         />
//                         {message.content && (
//                             <p className="mt-1 text-sm">{message.content}</p>
//                         )}
//                     </div>
//                 )}

//                 {message.contentType === "video" && (
//                     <video
//                         controls
//                         className="rounded-lg max-w-[250px] mt-1"
//                     >
//                         <source src={message.imageOrVideoUrl} type="video/mp4" />
//                     </video>
//                 )}

//                 {/* ✅ Time + Status */}
//                 <div className="flex justify-end items-center gap-1 mt-1 text-[11px] opacity-70">
//                     <span>{format(new Date(message.createdAt), "h:mm a")}</span>
//                     {renderStatusIcon()}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default MessageBubble;
