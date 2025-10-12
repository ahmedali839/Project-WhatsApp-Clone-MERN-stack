import React, { useId, useEffect, useState } from 'react'
import useUserStore from "../store/useUserStore"
import useThemeStore from "../store/usethemeStore"
import useStatusStore from "../store/useStatusStore"
import Layout from '../../components/Layout'
import StatusPreview from './StatusPreview'
import { motion } from "framer-motion"
import { RxCross2 } from 'react-icons/rx'
import { FaCamera, FaEllipsisH, FaPlus } from 'react-icons/fa'
import formatTimestamp from "../utlis/formatTime"
import StatusList from './StatusList'

const Status = () => {

  const [previewContact, setPreviewContact] = useState(null)
  const [currentStatusIndex, setCurrentStatusIndex] = useState(null)
  const [showOptions, setShowOptions] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showCreateModel, setShowCreateModel] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [filePreview, setFilePreview] = useState(null)

  const { user } = useUserStore()
  const { theme } = useThemeStore()

  // status store
  const {
    statuses,
    loading,
    fetchStatus,
    cleanupSocket,
    creatingStatus,
    viewStatus,
    deleteStatus,
    getStatusViewers,
    getGroupedStatus,
    initializeSocket,
    reset,
    getUserStatuses,
    getOtherStatuses,
    clearError,
    error } = useStatusStore()



  const userStatuses = getUserStatuses(user?._id)
  const otherStatuses = getOtherStatuses(user?._id)



  useEffect(() => {
    fetchStatus()
    initializeSocket()

    return () => {
      cleanupSocket(user?._id)

    }
  }, [user?._id])



  // clear the error when page is unmount
  useEffect(() => {
    return () => clearError()
  }, [])


  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file))
      }
    }
  }



  const handleCreateStatus = async () => {
    if (!newStatus.trim() && !selectedFile) return console.log("no status");
    console.log("running");


    try {
      await creatingStatus({
        content: newStatus,
        file: selectedFile,
      });

      setNewStatus("")
      setFilePreview(null)
      setSelectedFile(null)
      setShowCreateModel(false)
      setNewStatus("")
    } catch (error) {
      console.log("creating status file error");

    }
  }




  const handleViewStatus = async (statusId) => {
    try {
      await viewStatus(statusId);

    } catch (error) {
      console.log("error to view Status");

    }
  }


  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId)
      setShowOptions(false)
      handlePreviewClose()
    } catch (error) {
      console.log("error to delete Status");

    }
  }


  const handlePreviewClose = async () => {
    setPreviewContact(null)
    setCurrentStatusIndex(0)
  }



  const handlePreviewNext = async () => {
    if (currentStatusIndex < previewContact.statuses.length - 1) {
      setCurrentStatusIndex((prev) => prev + 1)
    } else {
      handlePreviewClose()
    }
  }


  const handlePreviewPrevious = () => {
    setCurrentStatusIndex((prev) => Math.max(prev - 1, 0))
  }




  const handleStatusPreview = (contact, statusIndex = 0) => {
    setCurrentStatusIndex(statusIndex)
    setPreviewContact(contact)

    if (contact.statuses[statusIndex]) {
      handleViewStatus(contact.statuses[statusIndex].id)
    }

  }





  return (
    <Layout
      isStatusPreviewOpen={!!previewContact}
      statusPreviewContent={
        previewContact && (
          <StatusPreview
            contact={previewContact}
            currentIndex={currentStatusIndex}
            onClose={handlePreviewClose}
            onNext={handlePreviewNext}
            onPrev={handlePreviewPrevious}
            onDelete={handleDeleteStatus}
            theme={theme}
            currentUser={user}
            loading={loading}
          />
        )
      }
    >


      <motion.div
        initial={{ opacity: 0, }}
        animate={{ opacity: 1, }}
        transition={{ duration: 0.5 }}
        className={`flex-1 h-screen border-r ${theme === "dark" ? "bg-[rgb(12,19,24)] text-white border-gray-600" : "text-black bg-white border-gray-100"}`}
      >

        <div
          className={`flex justify-between shadow-md items-center ${theme === "dark" ? "bg-[rgb(17,27,33)] " : "bg-white"} p-4`}
        >
          <h2 className='text-2xl text-start font-bold '>Status</h2>
        </div>

        {error && (
          <div className='bg-red-100 border-red-400 text-gray-700 rounded mx-4 mt-2 px-4 py-2'>
            <span className='block sm:inline'>{error}</span>
            <button
              onClick={clearError}
              className='float-right text-red-500 hover:text-red-700 '>
              <RxCross2 className='h-5 w-5' />
            </button>
          </div>
        )}






        <div className={`overflow-y-auto h-[calc(100vh-64px)]`}>
          <div
            className={`flex p-3 space-x-4 shadow-md items-center ${theme === "dark" ? "bg-[rgb(17,27,33)] " : "bg-white"} `}>
            <div
              onClick={() => userStatuses ? handleStatusPreview(userStatuses) : setShowCreateModel(true)}
              className='relative cursor-pointer'>
              <img
                className='h-12 w-12 object-cover rounded-full'
                src={user?.profilePicture}
                alt={user?.username} />
              {userStatuses ? (
                <>
                  <svg className='absolute top-0 left-0 h-12 w-12   '
                    viewBox='0 0 100 100'
                  >
                    {userStatuses.statuses.map((_, index) => {
                      const circumference = 2 * Math.PI * 48
                      const segmentLength = circumference / userStatuses.statuses.length
                      const offset = index * segmentLength;
                      return (
                        <circle
                          key={index}
                          cx={"50"}
                          cy={"50"}
                          r={"48"}
                          fill='none'
                          stroke='#25D366'
                          strokeWidth={"4"}
                          strokeDasharray={`${segmentLength - 5} 5`}
                          strokeDashoffset={-offset}
                          transform={'rotate(-90 50 50)'}
                        />
                      )
                    })}
                  </svg>


                  <button className='absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full'
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCreateModel(true)
                    }}
                  >
                    <FaPlus className='h-2 w-2' />
                  </button>

                </>
              ) :
                (

                  <button className='absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full'
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCreateModel(true)
                    }}
                  >
                    <FaPlus className='h-2 w-2' />
                  </button>
                )}

            </div>



            <div className='flex flex-col flex-1'>
              <p className='font-semibold text-start'>
                My Status
              </p>

              <p className={`text-sm ${theme === "dark" ? "text-gray-400 " : "text-gray-500"}`}>
                {userStatuses ? `${userStatuses.statuses.length} status ${userStatuses?.statuses.length > 1 ? "" : ""} 
                ${formatTimestamp(userStatuses.statuses[userStatuses.statuses.length - 1].timestamp)}` : "Tap to add status update"}
              </p>
            </div>

            {userStatuses && (
              <button
                className='ml-auto '
                onClick={() => setShowOptions(!showOptions)}
              >
                <FaEllipsisH className={`h-2 w-2  ${theme === "dark" ? "text-gray-400 " : "text-gray-500"}`} />
              </button>
            )}

          </div>


          {/* options menu */}
          {showOptions && userStatuses && (
            <div className={` shadow-md p-4  ${theme === "dark" ? "bg-[rgb(17,27,33)] " : "bg-white"} `}>

              <button
                className='py-2 px-2 w-full text-left flex rounded items-center hover:bg-red-100 text-green-500 }'
                onClick={() => {
                  setShowOptions(false)
                  setShowCreateModel(true)
                }}
              >
                <FaCamera className='inline-block mr-2' /> Add Status

              </button>

              <button
                className='py-2 px-2 rounded w-full text-left hover:bg-red-100 text-blue-500 }'
                onClick={() => {
                  handleStatusPreview(userStatuses)
                  setShowOptions(false)
                }}
              >
                View Status

              </button>
            </div>
          )}

          {loading && (
            <div className={`flex justify-center items-center p-8 `}>
              <div className={`animate-spin rounded-full border-b-2 h-8 w-8  border-green-500`}>
              </div>
            </div>
          )}


          {/* recent updates from others users */}
          {!loading && otherStatuses.length > 0 && (
            <div
              className={` p-4 space-y-4  mt-4  items-center ${theme === "dark" ? "bg-[rgb(17,27,33)] " : "bg-white"} `}

            >
              <h3 className={` font-semibold ${theme === "dark" ? "text-gray-400 " : "to-gray-500"} `}>
                Recent Update
              </h3>
              {otherStatuses.map((contact, index) => (
                <React.Fragment
                  key={contact?.id}
                >
                  <StatusList
                    contact={contact}
                    onPreview={() => handleStatusPreview(contact)}
                    theme={theme}
                  />
                  {index < otherStatuses.length - 1 && (
                    <hr className={`${theme === "dark" ? "border-gray-700" : "border-gray-200"}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}


          {/* Empirety state */}
          {!loading && statuses.length === 0 && (
            <div className='justify-center items-center flex flex-col text-center p-8 '>
              <div className={`text-6xl mb-4 ${theme === "dark" ? "text-gray-600" : "text-gray-300"}`}>
                ˚.🎀༘⋆
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                No Status Update yet.
              </h3>
              <p
                className={`text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-600"}`}
              >be the first to share status update</p>
            </div>
          )}

        </div>


        {/* show status Create Model */}
        {showCreateModel && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div
              className={`rounded-lg p-6 max-w-md w-full mx-4  ${theme === "dark" ? "bg-gray-800" : "bg-gray-300"}`}>

              <h3
                className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-black "}`}
              >
                Create Status
              </h3>
              {filePreview && (
                <div className='mb-4'>
                  {selectedFile?.type.startsWith("video/") ? (
                    <video
                      src={filePreview}
                      controls
                      alt="file-Preview"
                      className={`w-full h-32 object-cover rounded`}
                    />

                  ) : (
                    <img
                      src={filePreview}
                      alt="file-Preview"
                      className={`w-full h-32 object-cover rounded`}
                    />
                  )}
                </div>
              )}

              <textarea
                value={newStatus}
                onChange={(e) => { setNewStatus(e.target.value) }}
                placeholder='Whats on your mind ?'
                className={`rounded-lg mb-4 w-full  p-3 border ${theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}
                rows={3}
              />

              <input type="file"
                accept='image/*, video/*'
                onChange={handleFileChange}
                className={`mb-4`}
              />


              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => {
                    setShowCreateModel(false)
                    setNewStatus("")
                    setSelectedFile(null)
                    setFilePreview(null)
                  }}
                  disabled={loading}
                  className={`p-64 py-2 text-gray-500 hover:text-gray-700`}
                >Cancel</button>

                <button
                  onClick={
                    handleCreateStatus
                  }
                  // disabled={loading || (newStatus.trim() && !selectedFile)}
                  className={`px-4 py-2 text-white rounded hover:bg-green-600 bg-green-500 disabled:opacity-50`}
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>

            </div>
          </div>

        )}

      </motion.div>
    </Layout >
  )
}

export default Status
























