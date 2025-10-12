// import React, { useState } from 'react'
// import useThemeStore from '../store/usethemeStore'
// import useUserStore from '../store/useUserStore'
// import { logout } from "../services/user.services"
// import Layout from "../../components/Layout"
// import { toast } from "react-toastify"
// import { FaComment, FaMoon, FaQuestionCircle, FaSearch, FaSignOutAlt, FaSun, FaUser } from 'react-icons/fa'
// import { Link } from 'react-router-dom'

// const Setting = () => {

//   const [isThemeDialogeOpen, setIsThemeDialogeOpen] = useState(false)

//   const { theme, toggleTheme } = useThemeStore();
//   const { user, clearUser } = useUserStore();

//   const toggleDialogeTheme = () => {
//     setIsThemeDialogeOpen(!isThemeDialogeOpen)
//   }

//   const handleLogout = async () => {
//     try {
//       await logout();
//       clearUser();
//       toast.success("User Logged Out Successfully.")
//     } catch (error) {
//       console.error("Failed to logout", error);

//     }
//   }

//   return (
//     <Layout
//       toggleThemeDialoge={toggleDialogeTheme}
//       isThemeDialogeOpen={isThemeDialogeOpen}
//     >

//       <div
//         className={`flex h-screen ${theme === "dark" ? "bg-[rgb(17,27,33)] text-white" : "text-black bg-white"}`}
//       >
//         <div className={`w-[400px] border-r- ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>

//           <div className={`p-4`}>
//             <h2 className={`mb-4 text-xl font-semibold`}>Setting</h2>

//             <div className='mb-4 relative'>
//               <FaSearch className='text-gray-500 w-5 h-5 absolute top-2.5 left-3' />
//               <input
//                 type="text"
//                 placeholder='Search setting'
//                 className={`w-full ${theme === "dark" ? "bg-[#202e33] text-white " : "text-black bg-gray-100"} border-none pl-10 placeholder-gray-400 rounded p-2`}
//               />
//             </div>

//             <div className={`flex items-center gap-4 p-4 ${theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"} mb-4 rounded-lg cursor-pointer`}>


//               <img
//                 src={user.profilePicture}
//                 alt='profile-Picture'
//                 className={`h-14 w-14 rounded-full`}
//               />

//               <div className='flex '>
//                 <h2 className='font-semibold'>{user?.username}</h2>
//                 <p> {user.about}</p>
//               </div>
//             </div>



//             {/* main items */}
//             <div className={`overflow-y-auto h-[calc(100vh - 200px)]`}>
//               {/* <div className='space-y-1'> */}
//               {
//                 [
//                   { icons: FaUser, label: "Account", href: "/user-profile" },
//                   { icons: FaComment, label: "Chats", href: "/" },
//                   { icons: FaQuestionCircle, label: "Help", href: "/" }
//                 ].map((item) => (
//                   <Link
//                     to={item.href}
//                     key={item.label}
//                     className={`w-full items-center p-2 gap-3 rounded flex ${theme === "dark" ? "text-white hover:bg-[#202c33]" : "text-black hover:bg-gray-100"
//                       }`}
//                   >
//                     <item.icons className='h-5 w-5' />
//                     <div
//                       className={`border-b ${theme === "dark" ? "border-gray-700 " : "border-gray-200"} w-full p-4 `}
//                     >{item.label}</div>
//                   </Link>
//                 ))}


//               {/* theme change button */}
//               <button
//                 onClick={toggleTheme}
//                 className={`w-full items-center flex gap-3 p-2 rounded ${theme === "dark" ? "text-white hover:bg-[#202c33] " : "text-black hover:bg-gray-100"}`}>
//                 {theme === "dark" ? <FaMoon className='h-5 w-5 ' /> : <FaSun className='w-5 h-5' />}
//                 <div className={`border-b text-start flex flex-col ${theme === "dark" ? "border-gray-700" : "border-gray-200"} w-full p-2`}>
//                   Theme
//                   <span className={`ml-auto ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
//                     {theme.charAt(0).toUpperCase() + theme.slice(1)}
//                   </span>
//                 </div>
//               </button>


//               {/* logout button */}
//               <button
//                 className={`flex items-center gap-2 p-3 rounded w-full text-red-600 ${theme === "dark" ? "hover:bg-[#202c33] " : "hover:bg-pink-100"} mt-10 md:mt-30`}
//                 onClick={handleLogout}
//               >
//                 <FaSignOutAlt className='h-5 w-5 ' /> Logout
//               </button>
//               {/* </div> */}
//             </div>
//           </div>
//         </div>
//       </div >

//     </Layout >

//   )
// }

// export default Setting


































import React, { useState } from "react";
import useThemeStore from "../store/usethemeStore";
import useUserStore from "../store/useUserStore";
import { logout } from "../services/user.services";
import Layout from "../../components/Layout";
import { toast } from "react-toastify";
import {
  FaComment,
  FaMoon,
  FaQuestionCircle,
  FaSearch,
  FaSignOutAlt,
  FaSun,
  FaUser,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const Setting = () => {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);

  const { theme, toggleTheme } = useThemeStore();
  const { user, clearUser } = useUserStore();

  const toggleDialogTheme = () => {
    setIsThemeDialogOpen(!isThemeDialogOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      clearUser();
      toast.success("User Logged Out Successfully.");
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  const navItems = [
    { icons: FaUser, label: "Account", href: "/user-profile" },
    { icons: FaComment, label: "Chats", href: "/" },
    { icons: FaQuestionCircle, label: "Help", href: "/" },
  ];

  return (
    <Layout toggleThemeDialoge={toggleDialogTheme} isThemeDialogeOpen={isThemeDialogOpen}>
      <div
        className={`flex h-screen transition-colors duration-300 ${theme === "dark"
          ? "bg-[rgb(17,27,33)] text-white"
          : "bg-white text-black"
          }`}
      >
        {/* Sidebar */}
        <div
          className={`w-full sm:w-[435px] ${theme === "dark" ? "bordder-orange-700" : "border-gray-200"} flex flex-col`}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-500/20">
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          </div>

          {/* Search */}
          <div className="p-4 relative">
            <FaSearch className="text-gray-500 w-5 h-5 absolute top-6 left-6" />
            <input
              type="text"
              placeholder="Search settings"
              className={`w-full rounded-lg pl-10 py-2 focus:outline-none transition-all duration-200 ${theme === "dark"
                ? "bg-[#202e33] text-white placeholder-gray-400 focus:ring focus:ring-green-700"
                : "bg-gray-100 text-black placeholder-gray-500 focus:ring focus:ring-green-300"
                }`}
            />
          </div>

          {/* User Info */}
          <div
            className={`flex items-center gap-4 px-4 py-3 mb-4 rounded-lg cursor-pointer transition-all duration-200 ${theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"
              }`}
          >
            <img
              src={user?.profilePicture}
              alt="profile"
              className="h-14 w-14 rounded-full object-cover border"
            />
            <div className="flex flex-col">
              <h2 className="font-semibold text-lg">{user?.username}</h2>
              <p className="text-sm text-gray-500">{user?.about}</p>
            </div>
          </div>

          {/* Nav Items */}
          <div className="flex-1 overflow-y-auto px-2">
            {navItems.map((item) => (
              <Link
                to={item.href}
                key={item.label}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 mb-2 transition-colors duration-200 ${theme === "dark"
                  ? "hover:bg-[#202c33] text-white"
                  : "hover:bg-gray-100 text-black"
                  }`}
              >
                <item.icons className="h-5 w-5 flex-shrink-0" />
                <span className="text-base font-medium">{item.label}</span>
              </Link>
            ))}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors duration-200 ${theme === "dark"
                ? "hover:bg-[#202c33] text-white"
                : "hover:bg-gray-100 text-black"
                }`}
            >
              {theme === "dark" ? (
                <FaMoon className="h-5 w-5" />
              ) : (
                <FaSun className="h-5 w-5" />
              )}
              <div className="flex-1 flex justify-between items-center">
                <span className="font-medium">Theme</span>
                <span
                  className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </span>
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-semibold transition-colors duration-200 ${theme === "dark"
                ? "hover:bg-[#202c33] text-red-400"
                : "hover:bg-red-50 text-red-600"
                }`}
            >
              <FaSignOutAlt className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Setting;
