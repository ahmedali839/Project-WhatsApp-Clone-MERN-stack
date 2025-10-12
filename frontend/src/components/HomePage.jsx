import React, { useEffect, useState } from 'react'
import Layout from './Layout'
import ChatList from '../pages/chatSection/ChatList'
import { motion } from "framer-motion"
import Sidebar from './Sidebar'
import { getAllUsers } from '../pages/services/user.services'
import useLayoutStore from '../pages/store/layoutStore'

const HomePage = () => {

  const [allUsers, setAllUsers] = useState([])




  const getAllUser = async () => {
    try {
      const result = await getAllUsers()
      if (result.status === "success") {
        setAllUsers(result.data)
      }
    } catch (error) {
      console.log(("error in fetching users"));
    }
  }


  useEffect(() => {
    getAllUser();
  }, [])


  return (

    <div>

      <Layout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className='h-full'
        >
          <ChatList contacts={allUsers} />
        </motion.div>
      </Layout>

    </div>
  )
}

export default HomePage