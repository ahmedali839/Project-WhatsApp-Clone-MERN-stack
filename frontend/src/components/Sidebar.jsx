import React, { useEffect, useState } from 'react'
import useLayoutStore from '../pages/store/layoutStore'
import { Link, useLocation } from 'react-router-dom'
import useThemeStore from '../pages/store/usethemeStore'
import useUserStore from '../pages/store/useUserStore'
import { FaCog, FaUserCircle, FaWhatsapp } from 'react-icons/fa'
import { motion } from "framer-motion"
import { IoMdRadioButtonOn } from "react-icons/io";


const Sidebar = () => {

  const location = useLocation()
  const { user } = useUserStore()
  const { theme, setTheme } = useThemeStore()
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener("resize", handleResize => {
      return window.removeEventListener("resize", handleResize)
    })
  }, [])


  useEffect(() => {
    if (location.pathname === "/") {
      setActiveTab("chats")
    } else if (location.pathname === "/status") {
      setActiveTab("status")
    } else if (location.pathname === "/setting") {
      setActiveTab("setting")
    } else if (location.pathname === "/user-profile") {
      setActiveTab("profile")
    }
  }, [location, setActiveTab])


  if (isMobile && selectedContact) {
    return null;
  }

  const sideContact = (
    <>
      {/* for homePage */}
      <Link
        to={"/"}
        className={`${isMobile ? "" : "my-8"} ${activeTab === "chats" && "bg-gray-300 shadow-sm p-3 rounded-full"} focus:outline-none`}
      >
        <FaWhatsapp
          className={`h-6 w-6 text-green-500 
            ${activeTab === "chats"
              ? theme === "dark" ? "text-gray-800" : ""
              : theme === "dark" ? "text-gray-300" : "text-gray-800"
            }`}

        />
      </Link>


      {/* for status */}
      <Link
        to={"/status"}
        className={`${isMobile ? "" : "mb-8"} ${activeTab === "status" && "bg-gray-300 shadow-sm p-3 rounded-full"} focus:outline-none `}
      >

        <IoMdRadioButtonOn
          className={`h-6 w-6
            ${activeTab === "status"
              ? theme === "dark" ? "text-gray-800" : ""
              : theme === "dark" ? "text-gray-300" : "text-gray-800"
            }`}
        />
      </Link>
      {!isMobile && <div className='flex-grow' />}


      {/* for profile */}
      <Link
        to={"/user-profile"}
        className={`${isMobile ? "" : "mb-8"} ${activeTab === "profile" && `w-13 h-15 object-cover bg-gray-300 shadow-sm p-3 rounded-full`} focus:outline-none `}
      >

        {user?.profilePicture ? (
          <img src={user?.profilePicture} alt="user-profile" className={` w-8 h-8 object-cover rounded-full`} />

        ) : (

          <FaUserCircle
            className={`h-6 w-6
      ${activeTab === "profile"
                ? theme === "dark" ? "text-gray-800 bg-gray-700" : ""
                : theme === "light" ? "bg-gray-300" : "text-gray-800"
              }`}
          />
        )}


      </Link>

      {/* for setting */}
      <Link
        to={"/setting"}
        className={`${isMobile ? "" : "mb-8"} ${activeTab === "setting" && "bg-gray-300 shadow-sm p-3 rounded-full"} focus:outline-none `}
      >

        <FaCog
          className={`h-6 w-6
            ${activeTab === "setting"
              ? theme === "dark" ? "text-gray-800" : ""
              : theme === "dark" ? "text-gray-300" : "text-gray-800"
            }`}
        />
      </Link>

    </>
  )


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${isMobile ? "fixed bottom-0 left-0 right-0 h-16 " : "w-16 h-screen border-r-2"}
      ${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-gray-200 border-gray-300"}
      ${isMobile ? "flex-row justify-around " : "flex-col justify-between"}
      bg-opacity-90 flex items-center px-4 shadow-lg
      `}
    >
      {sideContact}
    </motion.div>
  )
}

export default Sidebar