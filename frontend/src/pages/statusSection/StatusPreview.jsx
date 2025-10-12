import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from "framer-motion"
import { format } from 'date-fns'
import formatTimestamp from "../utlis/formatTime"
import { FaChevronDown, FaChevronLeft, FaChevronRight, FaEye, FaTimes, FaTrash } from 'react-icons/fa'


const StatusPreview = ({ contact, loading, currentUser, theme, onDelete, onPrev, onNext, currentIndex, onClose, }) => {

    const [progress, setProgress] = useState(0)
    const [showViewers, setShowViewers] = useState(false)


    const currentStatus = contact?.statuses[currentIndex];
    const isOwnerStatus = contact?.id === currentUser?._id

    useEffect(() => {
        setProgress(0)
        let current = 0;

        const interval = setInterval(() => {
            current += 2 // Increase Progress by 2% by every 2--- mili Second => 50 steps = 5sec 
            setProgress(current)
            if (current >= 100) {
                clearInterval(interval);
                onNext();
            }
        }, 100);
        return () => clearInterval(interval);
    }, [currentIndex])


    const handleViewersToggle = () => {
        setShowViewers(!showViewers)
    }


    const handleDeleteStatus = () => {
        if (onDelete && currentStatus?.id) {
            onDelete(currentStatus.id)
        }
        if (contact.statuses.length === 1) {
            onClose()
        } else {
            onPrev()
        }
    }


    if (!currentStatus) return;

    return (

        <motion.div
            initial={{ opacity: 0, }}
            animate={{ opacity: 1, }}
            transition={{ duration: 0.5 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 h-full w-full bg-black bg-opacity-90 flex justify-center items-center`}
            style={{ backdropFilter: "blur(5px)" }}
            onClick={onClose}
        >

            <div
                className={`relative w-full h-full max-w-4xl mx-auto flex justify-center items-center `}
                onClick={(e) => e.stopPropagation()}
            >

                <div className={`w-full h-full ${theme === "dark" ? "bg-[#202c33]" : "bg-gray-800 relative"}`}>
                    <div className='absolute top-0 left-0 right-0 flex justify-between p-4 z-10 gap-1'>
                        {contact.statuses.map((_, index) => (
                            <div key={index} className={`h-1 bg-gray-400 bg-opacity-50 flex-1 rounded-full overflow-hidden`}>
                                <div className='h-full bg-white transition-all duration-100 rounded-full ease-linear'
                                    style={{ width: index < currentIndex ? "100%" : index === currentIndex ? ` ${progress}% ` : "0%" }}
                                >


                                </div>

                            </div>
                        ))}

                    </div>

                    <div className={`absolute top-8 left-4 right-16 z-10 flex justify-around items-center `}>
                        <div className='flex fslex-col space-x-3 items-center'>
                            <img
                                src={contact?.avatar}
                                alt={contact?.name}
                                className={`border-2 border-white h-10 w-10 object-cover rounded-full`}

                            />
                            <div>
                                <p className='text-white font-semibold'>{contact?.name}</p>
                                <p className='text-gray-300 text-sm'>{formatTimestamp(currentStatus.timestamp)}</p>

                            </div>
                        </div>


                        {/* // status actions */}
                        {isOwnerStatus && (
                            <div className='flex items-center space-x-2 '>
                                <button
                                    onClick={handleDeleteStatus}
                                    className={`text-white bg-red-500 bg-opacity-70 rounded-full p-2 hover:bg-opacity-90 transition-all `}>
                                    <FaTrash className='h-4 w-4' />
                                </button>
                            </div>
                        )}
                    </div>


                    <div className={`w-full h-full flex items-center justify-center `}>
                        {currentStatus.contentType === "text" ? (
                            <div className='text-white text-center p-8'>
                                <p className='text-2xl font-medium'>{currentStatus.media}</p>
                            </div>

                        ) : currentStatus.contentType === "image" ? (
                            <img
                                src={currentStatus.media}
                                alt="image"
                                className='max-w-full max-h-full object-contain'
                            />
                        ) : currentStatus.contentType === "video" ? (
                            <video
                                src={currentStatus.media}
                                controls
                                autoPlay
                                muted
                                className='max-w-full max-h-full object-contain'
                            />
                        ) : null}
                    </div>

                    <button
                        onClick={onClose}
                        className='absolute top-4 right-4 bg-black text-white rounded-full bg-opacity-50 hover:bg-opacity-70 transition-all p-3 z-10'>
                        <FaTimes className='h-5 w-5' />
                    </button>



                    {currentIndex > 0 && (
                        <button
                            onClick={onPrev}
                            className='absolute top-1/2 left-4 transition -translate-y-1/2 bg-black text-white rounded-full bg-opacity-50 hover:bg-opacity-70  p-3 '>
                            <FaChevronLeft className='h-5 w-5' />
                        </button>
                    )}


                    {currentIndex > contact.statuses.length - 1 && (
                        <button
                            onClick={onNext}
                            className='absolute top-1/2 right-4 transition -translate-y-1/2 bg-black text-white rounded-full bg-opacity-50 hover:bg-opacity-70  p-3 '>
                            <FaChevronRight className='h-5 w-5' />
                        </button>
                    )}



                    {isOwnerStatus && (
                        <div className='absolute bottom-4 left-4 right-4'>
                            <button
                                onClick={handleViewersToggle}
                                className='flex items-center justify-between w-full text-white bg-black bg-opacity-50 rounded-lg px-4 py-2 hover:bg-opacity-70 transition-all '>
                                <div className='flex items-center space-x-4'>
                                    <FaEye className='w-4 h-4' />
                                    <span>{currentStatus?.viewers?.length}</span>

                                </div>
                                <FaChevronDown className={`h-4 w-4 transition-transform ${showViewers ? "rotate-180" : ""}`} />
                            </button>

                            <AnimatePresence>
                                {showViewers && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`bg-black bg-opacity-70 mt-2 rounded-lg overflow-y-auto p-4 max-h-40`}
                                    >

                                        {loading ? (
                                            <p className='text-center text-white'>loading viewers...</p>
                                        ) : currentStatus.viewers.length > 0 ? (
                                            <div>
                                                {currentStatus?.viewers.map((viewer, index) => (
                                                    <div
                                                        key={index}
                                                        className='flex items-center py-2 space-x-3'
                                                    >
                                                        <img
                                                            src={viewer.profilePicture}
                                                            alt={viewer.username}
                                                            className='rounded-full object-cover border-red-500 h-8 w-8'
                                                        />
                                                        <span className='text-white align-middle border-green-500'>{viewer.username}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className='text-white text-center'>No status viewer. </p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>






                        </div>
                    )}



                </div>



            </div>
        </motion.div>
    )
}

export default StatusPreview