import React, { useEffect, useState } from 'react'
import useUserStore from "../pages/store/useUserStore"
import useThemeStore from "../pages/store/usethemeStore"
import { updateUserProfile } from "../pages/services/user.services"
import Layout from "../components/Layout"
import { toast } from "react-toastify"
import { motion } from "framer-motion"
import { FaCamera, FaCheck, FaPencilAlt, FaSmile } from 'react-icons/fa'
import { MdCancel } from 'react-icons/md'
import EmojiPicker from 'emoji-picker-react'


const UserDetails = () => {

  const [name, setName] = useState("")
  const [about, setAbout] = useState("")
  const [profilePicture, setProfilePicture] = useState(null)
  const [preview, setPreview] = useState(null)


  const [isEditing, setIsEditing] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingAbout, setIsEditingAbout] = useState(false)
  const [showNameEmoji, setShowNameEmoji] = useState(false)
  const [showAboutEmoji, setShowAboutEmoji] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { user, setUser } = useUserStore()
  const { theme } = useThemeStore()


  useEffect(() => {
    if (user) {
      setName(user.username || "")
      setAbout(user.about || "")
    }
  }, [user])


  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfilePicture(file)
      setPreview(URL.createObjectURL(file))
    }
  }


  const handleSave = async (field) => {
    try {
      setIsLoading(true)
      let formData = new FormData()
      if (field === "name") {
        formData.append("username", name)
        setIsEditingName(false)
        setShowNameEmoji(false)
      }
      else if (field === "about") {
        formData.append("about", about)
        setIsEditingAbout(false)
        setShowAboutEmoji(false)
      }


      if (profilePicture && field === "profile") {
        formData.append("media", profilePicture)
      }


      const updated = await updateUserProfile(formData)

      if (updated?.status === "success") {
        setUser(updated?.data)
        setProfilePicture(null)
        setPreview(null)
      }

      toast.success("Profile Updated")
      setIsLoading(false)

    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");

    }
  }



  const handleEmojiSelected = (emoji, field) => {
    if (field === "name") {
      setName((prev) => prev + emoji.emoji)
      setShowNameEmoji(false)
    } else {
      setAbout((prev) => prev + emoji.emoji)
      setShowAboutEmoji(false)
    }


  }


  return (

    // <div>
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={` flex w-full min-h-screen border-r ${theme === "dark" ? "bg-[rgb(17, 27, 30)] border-gray-600 text-white" : "bg-white border-gray-200 text-black"}`}
      >

        <div className='w-full rounded-lg p-4'>
          <div className='flex items-center p-1 mb-6'>
            <h1 className='text-2xl text-start font-bold'> Profile</h1>
          </div>


          <div className={`space-y-6`}>
            <div className='flex flex-col items-center '>
              <div className='relative group h-52 w-52 rounded-full overflow-hidden'>
                <img
                  src={preview || user.profilePicture}
                  alt="profilePicture"
                  className={`h-52 w-52 rounded-full mb-2 object-cover `}
                />
                <label htmlFor="profileUpload"
                  className={`absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity`}
                >
                  <div className='text-white text-center '>
                    <FaCamera className='h-8 w-8 mx-auto mb-2' />
                    <span className='text-sm'>Change</span>
                  </div>
                  <input
                    type="file"
                    className={`hidden`}
                    id='profileUpload'
                    accept='image/* video/*'
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>

            {preview && (
              <div className={`flex gap-4 justify-center mt-4 `}>
                <button
                  onClick={() => handleSave("profile")}
                  className='bg-green-500 hover:bg-gray-700 py-2 px-4 rounded text-white'
                >
                  {isLoading ? "Saving..." : "Change"}
                </button>

                <button
                  onClick={() => {
                    setPreview(null)
                    setProfilePicture(null)
                  }
                  }
                  className='bg-red-500 hover:bg-red-600 py-2 px-4 rounded text-white'
                >
                  Discard
                </button>
              </div>
            )}


            {/* continue here */}
            <div className={`relative shadow-lg p-4 ${theme == "dark" ? "bg-gray-600" : "bg-white"}`}>
              <label htmlFor="name"
                className={`font-medium  mb-1 block text-sm  ${theme === "dark" ? "text-gray-200" : "text-gray-500"} text-start`}
              >Your Name</label>



              <div className='flex items-center'>
                {isEditingName ? (
                  <input
                    type="text"
                    id='name'
                    value={name}
                    onChange={(e) => { setName(e.target.value) }}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${theme === "dark" ? "bg-gray-700 text-white" : "bg-white text-black"}`}
                  />
                ) : (
                  <span className='w-full px-4 py-2'>{user.username || name}</span>
                )}

                {isEditingName ? (
                  <>
                    <button
                      onClick={() => { handleSave("name") }}
                      className='ml-2 focus:outline-none '
                    >
                      <FaCheck className='h-5 w-5 text-green-500' />
                    </button>
                    <button
                      onClick={() => {
                        setShowNameEmoji(!showNameEmoji)
                      }}
                      className='ml-2  focus:outline-none '
                    >
                      <FaSmile className='h-5 w-5 text-yellow-500' />
                    </button>

                    <button
                      onClick={() => {
                        setIsEditingName(false)
                        setShowNameEmoji(false)

                      }}
                      className='ml-2 focus:outline-none'
                    >
                      <MdCancel className='h-5 w-5 text-gray-300' />
                    </button>
                  </>

                ) : (
                  <button
                    onClick={() => { setIsEditingName(!isEditingName) }}
                    className='ml-2 focus:outline-none '
                  >
                    <FaPencilAlt className={`h-5 w-5 ${theme === "dark" ? "text-gray-300" : "text-gray-400"}`} />
                  </button>
                )}
              </div>




              {showNameEmoji && (
                <div className={`-top-80 z-10 absolute`}>
                  <EmojiPicker
                    onEmojiClick={(emoji) => handleEmojiSelected(emoji, "name")}
                  />

                </div>
              )}

            </div>


            <div className={`relative shadow-lg p-4 ${theme == "dark" ? "bg-gray-600" : "bg-white"}`}>
              <label htmlFor="about"
                className={`font-medium  mb-1 block  text-sm  ${theme === "dark" ? "text-gray-200" : "text-gray-500"} text-start`}
              >About</label>



              <div className='flex items-center'>
                {isEditingAbout ? (
                  <input
                    type="text"
                    id='about'
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${theme === "dark" ? "bg-gray-700 text-white" : "bg-white text-black"}`}
                  />
                ) : (
                  <span className='w-full px-4   py-2'>{user.about || about}</span>
                )}

                {isEditingAbout ? (
                  <>
                    <button
                      onClick={() => { handleSave("about") }}
                      className='ml-2 focus:outline-none '
                    >
                      <FaCheck className='h-5 w-5 text-green-500' />
                    </button>
                    <button
                      onClick={() => {
                        setShowAboutEmoji(!showAboutEmoji)
                      }}
                      className='ml-2  focus:outline-none '
                    >
                      <FaSmile className='h-5 w-5 text-yellow-500' />
                    </button>

                    <button
                      onClick={() => {
                        setIsEditingAbout(false)
                        setShowAboutEmoji(false)

                      }}
                      className='ml-2 focus:outline-none'
                    >
                      <MdCancel className='h-5 w-5 text-gray-300' />
                    </button>
                  </>

                ) : (
                  <button
                    onClick={() => { setIsEditingAbout(!isEditingAbout) }}
                    className='ml-2 focus:outline-none '
                  >
                    <FaPencilAlt className={`h-5 w-5 ${theme === "dark" ? "text-gray-300" : "text-gray-400"}`} />
                  </button>
                )}
              </div>




              {showAboutEmoji && (
                <div className={`-top-80 z-10 absolute`}>
                  <EmojiPicker
                    onEmojiClick={(emoji) => handleEmojiSelected(emoji, "about")}
                  />

                </div>
              )}

            </div>


          </div>
        </div>


      </motion.div>
    </Layout >
    // </div>
  )

}
export default UserDetails
