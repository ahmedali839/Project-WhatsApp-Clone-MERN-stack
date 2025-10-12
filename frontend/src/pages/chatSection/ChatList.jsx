// import React, { useState } from 'react'
// import useLayoutStore from '../store/layoutStore'
// import useThemeStore from '../store/usethemeStore'
// import useUserStore from '../store/useUserStore'
// import { FaPlus, FaSearch } from 'react-icons/fa'
// import { motion } from 'framer-motion'

// const ChatList = ({ contacts }) => {

//   console.log(contacts);


//   const setSelectedContact = useLayoutStore(state => state.setSelectedContact)
//   const selectedContact = useLayoutStore(state => state.selectedContact)
//   const { theme } = useThemeStore()
//   const { user } = useUserStore()
//   const [searchTerm, setSearchTerm] = useState("")
//   const filteredContacts = contacts?.filter((contact) => contact?.username?.toLowerCase()?.includes(searchTerm.toLowerCase()));

//   console.log(filteredContacts);


//   return (
//     <div className={`h-screen w-full border-r ${theme === "dark" ? "bg-gray-700 border-gray-500" : "bg-white border-gray-200"}`}>
//       <div className={`p-4 justify-between flex ${theme === "dark" ? "text-white" : "text-gray-800"} `}>
//         <h2 className={`font-bold text-2xl`}>Chats</h2>
//         <button className={`p-2 bg-green-500 text-white transition-colors rounded-full hover:bg-green-600`}>
//           <FaPlus />
//         </button>

//       </div>
//       <div className={`p-2`}>
//         <div className='relative'>
//           <FaSearch
//             className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-800"}`} />
//           <input
//             type="text"
//             placeholder='Search or start new chat'
//             className={`pr-4 py-2 pl-10 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${theme === "dark" ? "border-gray-700 bg-gray-800 text-white" : "border-gray-200 bg-gray-100 text-black placeholder-gray-400"}`}
//             value={searchTerm}
//             onChange={(e) => { setSearchTerm(e.target.value) }}
//           />
//         </div>
//       </div>


//       {/* map the chats */}
//       <div className={`overflow-y-auto h-[calc(100vh-120px)] `}>
//         {filteredContacts.map((contact) => {
//           return (
//             <motion.div
//               key={contact?._id}
//               onClick={() => setSelectedContact(contact)}
//               className={`cursor-pointer p-3 flex justify-center
//                 ${theme === "dark"
//                   ? selectedContact?._id === contact?._id ? "bg-green-700" : "hover:bg-gray-800"
//                   : selectedContact?._id === contact?._id ? "bg-green-200" : "hover:bg-gray-100"}
//        `}
//             >
//               <img
//                 src={contact?.profilePicture}
//                 alt={`${contact?.username}`}
//                 className={`rounded-full h-12 w-12`}
//               />
//               <div className={`flex-1 ml-3`}>
//                 <div className={`flex justify-center items-baseline`}>

//                   <h2 className={`font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
//                     {contact?.username}
//                   </h2>

//                 </div>
//               </div>

//             </motion.div>
//           )
//         })}
//       </div>

//     </div >
//   )
// }

// export default ChatList






















import React, { useState, useEffect } from 'react'
import useLayoutStore from '../store/layoutStore'
import useThemeStore from '../store/usethemeStore'
import useUserStore from '../store/useUserStore'
import { FaPlus, FaSearch } from 'react-icons/fa'
import { motion } from 'framer-motion'
import formatTimestamp from '../utlis/formatTime.js'
import useChatStore from '../store/useChatStore.js'

const ChatList = ({ contacts }) => {

  const setSelectedContact = useLayoutStore(state => state.setSelectedContact)
  const selectedContact = useLayoutStore(state => state.selectedContact)
  const { user } = useUserStore()
  const { theme } = useThemeStore()
  const [searchTerm, setSearchTerm] = useState("")

  // Ensure contacts is always an array
  const filteredContacts = (contacts || []).filter(contact =>
    contact?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )



  return (
    <div className={`h-screen w-full border-r ${theme === "dark" ? "bg-gray-700 border-gray-500" : "bg-white border-gray-200"}`}>
      {/* Header */}
      <div className={`p-4 justify-between flex ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
        <h2 className="font-bold text-2xl">Chats</h2>
        <button className="p-2 bg-green-500 text-white transition-colors rounded-full hover:bg-green-600">
          <FaPlus />
        </button>
      </div>

      {/* Search */}
      <div className="p-2">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-800"}`}
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            className={`pr-4 py-2 pl-10 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${theme === "dark" ? "border-gray-700 bg-gray-800 text-white" : "border-gray-200 bg-gray-100 text-black placeholder-gray-400"}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts */}
      <div className="overflow-y-auto h-[calc(100vh-120px)]">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <motion.div
              key={contact?._id}
              onClick={() => setSelectedContact(contact)}
              className={`cursor-pointer p-3 flex items-center gap-3 rounded-md transition-colors
                ${theme === "dark"
                  ? selectedContact?._id === contact?._id ? "bg-gray-700" : "hover:bg-gray-600"
                  : selectedContact?._id === contact?._id ? "bg-gray-100" : "hover:bg-gray-50"}
              `}
              // whileHover={{ scale: 1.006 }}
              whileTap={{ scale: 0.98 }}
            >
              <img
                src={contact?.profilePicture}
                alt={contact?.username || "User"}
                className="rounded-full h-12 w-12 object-cover"
              />
              <div className="flex-1">
                <h2 className={`font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
                  {contact?.username}
                </h2>
                {contact?.conversation && (
                  <span className={`text-xs ${theme === "dark" ? "text-white" : "text-black"}`}>
                    {/* {formatTimestamp(contact?.conversation?.lastMessage?.createdAt)} */}
                    {contact?.conversation?.lastMessage?.content}
                  </span>
                )}
              </div>

              {/* continue work here */}
              <div className={`flex flex-col gap-1 items-end justify-end`}>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"} truncate`}>
                  {formatTimestamp(contact?.conversation?.lastMessage?.createdAt)}
                  {/* {contact?.conversation?.lastMessage?.content} */}
                </p>


                {contact?.conversation && contact?.conversation?.unreadCount > 0 && contact?.conversation?.lastMessage?.sender !== user?._id && (
                  <p className={`h-5 w-5 text-sm ${theme === "dark" ? "text-gray-800" : "text-gray-500"} rounded-full bg-green-300 items-center justify-center flex font-semibold`}>
                    {contact?.conversation?.unreadCount}
                  </p>
                )}

              </div>


            </motion.div>
          ))
        ) : (
          <p className={`text-center mt-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            No contacts found
          </p>
        )}
      </div>
    </div >
  )
}

export default ChatList
