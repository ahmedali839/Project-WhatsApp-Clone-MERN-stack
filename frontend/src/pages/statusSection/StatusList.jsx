import React from 'react'
import formatTimestamp from "../utlis/formatTime"

const StatusList = ({ contact, onPreview, theme }) => {

    return (
        <div className={`py-2 flex items-center space-x-4`}
            onClick={onPreview}
        >
            <div className='relative'>
                <img
                    src={contact.avatar} alt={contact.name} className='rounded-full w-14 h-14' />

                <svg className='absolute top-0 left-0 h-14 w-14'
                    viewBox='0 0 100 100'
                >
                    {contact.statuses.map((_, index) => {
                        const circumference = 2 * Math.PI * 48
                        const segmentLength = circumference / contact.statuses.length
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
                                transform={'rotate(-90 50 50)'}
                            />
                        )
                    })}
                </svg>

            </div>


            <div>
                <p className='font-semibold'> {contact.name}</p>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"} `}>

                    {formatTimestamp(contact.statuses[contact.statuses.length - 1].timestamp)}

                </p>
            </div>


        </div >
    )
}

export default StatusList