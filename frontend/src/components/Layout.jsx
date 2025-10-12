import React, { useEffect, useState } from 'react'
import useLayoutStore from '../pages/store/layoutStore'
import { useLocation } from 'react-router-dom'
import useThemeStore from '../pages/store/usethemeStore'
import Sidebar from './Sidebar'
import ChatWindow from '../pages/chatSection/ChatWindow'
import { AnimatePresence, motion } from 'framer-motion'


const Layout = ({ children, isThemeDialogeOpen, toggleThemeDialoge, isStatusPreviewOpen, statusPreviewContent }) => {

  const activeTab = useLayoutStore(state => state.activeTab)
  const selectedContact = useLayoutStore(state => state.selectedContact)
  const setSelectedContact = useLayoutStore(state => state.setSelectedContact)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const { theme, setTheme } = useThemeStore()
  const location = useLocation()


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener("resize", handleResize => {
      return window.removeEventListener("resize", handleResize)
    })
  }, [])



  return (

    <div className={`max-h-screen${theme === "dark" ? "text-white bg-gray-700" : "text-gray-600 bg-black"} flex relative`}>

      {!isMobile && <Sidebar />}

      <div className={`flex flex-1 overflow-hidden ${isMobile ? "flex-col" : ""}`}>

        <AnimatePresence initial={false}>

          {(!selectedContact || !isMobile) && (
            <motion.div
              key={"chatList"}
              initial={{ x: isMobile ? "-100%" : "" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween" }}
              className={`w-full md:w-1/2 h-full ${isMobile ? "pb-16" : ""}`}
            >
              {children}
            </motion.div>
          )}


          {(selectedContact || !isMobile) && (
            <motion.div
              key={"chatWindow"}
              initial={{ x: isMobile ? "-100%" : "" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween" }}
              className={`w-full h-full ${isMobile ? "pb-16" : ""}`}
            >
              <ChatWindow selectedContact={selectedContact} setSelectedContact={setSelectedContact} isMobile={isMobile} />

            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {isMobile && <Sidebar />}


      {isThemeDialogeOpen && (
        <div className='flex inset-0 fixed items-center justify-center bg-black bg-opacity-50 z-50'>
          <div className={`${theme === "dark" ? "text-gray-700 bg-white" : "text-white bg-gray-700"} p-6 rounded-lg shadow-lg  max-w-sm w-full`}>

            <h2 className='mb-4 text-2xl font-bold'>Choose a theme</h2>
            <div className='space-y-4'>
              <label className={`flex items-center space-x-3 cursor-pointer`}>
                <input
                  type="radio"
                  value={"light"}
                  checked={theme === "light"}
                  onChange={() => setTheme("light")}
                  className={`from-radio text-blue-600`}
                />
                <span>light</span>
              </label>

              <label className={`flex items-center space-x-3 cursor-pointer`}>
                <input
                  type="radio"
                  value={"dark"}
                  checked={theme === "dark"}
                  onChange={() => setTheme("dark")}
                  className={`from-radio text-blue-600`}
                />
                <span>Dark</span>
              </label>
            </div>
            <button className={`mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition duration-300`} onClick={() => { toggleThemeDialoge() }}></button>
          </div>
        </div>

      )}



      {/* status preview */}
      {isStatusPreviewOpen && (
        <div className='flex inset-0 fixed items-center justify-center bg-black bg-opacity-50 z-10'>
          {statusPreviewContent}
        </div>
      )}

    </div >
  )
}

export default Layout