import React, { useRef, useState, useEffect } from 'react'
import useLoginStore from "../store/useLoginStore.js"
import useUserStore from "../store/useUserStore.js"
import countries from "../utlis/countriles.js"
import Spinner from "../utlis/Spinner.jsx"
import * as yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"
import { useNavigate } from "react-router-dom"
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import useThemeStore from '../store/usethemeStore.js'
import { sendotp, verifyotp, updateUserProfile } from "../services/user.services.js";
import { FaAd, FaAddressBook, FaArrowDown, FaArrowLeft, FaChevronDown, FaPlus, FaUser, FaWhatsapp } from "react-icons/fa";
import { toast } from "react-toastify";
import useOutSideClick from '../../hooks/UseOutsideHook'

// validation schema
const loginValidationSchema = yup.object().shape({
    phoneNumber: yup.string().nullable().notRequired().matches(/^\d+$/, "phone number must be digits only.").transform((value, OriginalValue) => { return OriginalValue.trim() === "" ? null : value }),
    email: yup.string().nullable().notRequired().email("please enter valid email.").transform((value, OriginalValue) => { return OriginalValue.trim() === "" ? null : value })
}).test(
    "at-least-one",
    "Either enter phone number or email",
    function (value) {
        if (!value) return false;
        return !!(value.phoneNumber || value.email)
    }
)

const otpValidationSchema = yup.object().shape({
    // otp: yup.string().required("otp is required")
})

const profileValidationSchema = yup.object().shape({
    username: yup.string().required("Username is required"),
    agreed: yup.bool().oneOf([true], "You must agree the terms.")
})


// Avatars:
const avatars = [
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe',
]


const Login = () => {


    const { step, setStep, userPhoneData, setUserPhoneData, resetLoginState } = useLoginStore()


    const { register: loginRegister, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm({ resolver: yupResolver(loginValidationSchema) })
    const { handleSubmit: handleOtpSubmit, formState: { errors: otpErrors }, setValue: setOtpValue } = useForm({ resolver: yupResolver(otpValidationSchema) })
    const { register: profileRegister, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, watch } = useForm({ resolver: yupResolver(profileValidationSchema) })


    const [phoneNumber, setPhoneNumber] = useState("")
    const [otp, setOtp] = useState(["", "", "", "", "", ""])
    const [email, setEmail] = useState("")
    const [profilePicture, setProfilePicture] = useState(null)
    const [profilePictureFile, setProfilePictureFile] = useState(null)
    const [selectedAvatar, setSelectedAvatar] = useState(avatars[4])
    const [error, setError] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [showDropDown, setShowDropDown] = useState(null)
    const [selectedCountry, setSelectedCountry] = useState(countries[0])
    const [isLoading, setIsLoading] = useState(false)


    const navigate = useNavigate()
    const { setUser } = useUserStore()
    const { theme, setTheme, toggleTheme } = useThemeStore();

    const showDropDownRef = useRef(null)
    const otpRefs = useRef([]);

    const filterCountry = countries.filter((country) => (
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) || country.dialCode.includes(searchTerm)
    ))

    const onLoginSubmit = async () => {
        setIsLoading(true)
        try {
            if (email) {
                const response = await sendotp(null, null, email)
                if (response.status === "success") {
                    toast.info("Otp sent to your email")
                    setUserPhoneData({ email })
                    setStep(2)
                }
            } else {
                const response = await sendotp(phoneNumber, selectedCountry.dialCode, null)
                console.log(phoneNumber, selectedCountry.dialCode, null);

                if (response.status === "success") {
                    toast.info("Otp sent to your Phone Number")
                    setUserPhoneData({ phoneNumber, phoneSuffix: selectedCountry.dialCode })
                    setStep(2)
                }
            }
        } catch (error) {
            console.log(error);
            setError(error.message || "Failed to send Otp to your Phone Number")
        } finally {
            setIsLoading(false)
        }
    }


    const onOtpSubmit = async () => {
        setIsLoading(true)
        try {
            if (!userPhoneData) {
                throw new Error("Phone or email is missing.");
            }

            const otpString = otp.join("");
            let response;
            if (userPhoneData?.email) {
                response = await verifyotp(null, null, otpString, email)
            }
            else {
                response = await verifyotp(userPhoneData.phoneNumber, userPhoneData.phoneSuffix, otpString)
            }

            if (response.status === "success") {
                toast.success("Your Account Successfully logged-in.")
                const token = response?.data?.token
                localStorage.setItem("auth_token", token)
                const user = response?.data?.user
                if (user?.username && user?.profilePicture) {
                    toast.info("Welcome Back to your WhatsApp!.")
                    console.log(user)
                    setUser(user)
                    navigate("/")
                    resetLoginState()
                } else {
                    setStep(3)
                }

            }
        } catch (error) {
            console.log(error);
            setError(error.mesage || "Error while verifying otp")
        } finally {
            setIsLoading(false);
        }
    }


    const onProfileSubmit = async (data) => {

        try {
            setIsLoading(true)
            const formData = new FormData()
            formData.append("username", data.username)
            formData.append("agreed", data.agreed)

            // selecting profile image or default avatar  
            if (profilePictureFile) {
                formData.append("media", profilePictureFile)
            } else {
                formData.append("profilePicture", selectedAvatar)
            }

            await updateUserProfile(formData)
            toast.info("User profile Updated Successfully.")
            navigate("/")
            resetLoginState()
        } catch (error) {
            console.log(error);
            setError(error.mesage || "Failed to update User Profile.")
        } finally {
            setIsLoading(false);
        }
    }



    const handleOtpChange = (index, value) => {
        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)
        setOtpValue("otp", newOtp.join())
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    }


    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setProfilePictureFile(file)
            setProfilePicture(URL.createObjectURL(file))
        }
    }


    const ProgressBar = () => (
        <div className={`mb-6 h-2.5 rounded-full w-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`}>
            <div className={`h-2.5 bg-green-500 rounded-full transition-all duration-500 ease-in-out`} style={{ width: `${(step / 3) * 100}%` }}>
            </div>
        </div >
    )

    useOutSideClick(showDropDownRef, () => {
        if (showDropDown) setShowDropDown(false)
    })

    const handleBack = () => {
        setStep(1)
        setError("")
        setUserPhoneData(null)
        setOtp(["", "", "", "", "", ""])
    }








    useEffect(() => {
        // Auto-focus the first input when step 2 starts
        if (step === 2 && otpRefs.current[0]) {
            otpRefs.current[0].focus();
        }
    }, [step]);

    const handleOtpChanges = (index, value) => {
        // Only allow single character (string) — numbers or letters if needed
        if (value.length <= 1) {
            const newOtp = [...otp];
            newOtp[index] = value; // keep as string
            setOtp(newOtp);

            // Move to next input automatically if not empty
            if (value !== "" && index < otp.length - 1) {
                otpRefs.current[index + 1].focus();
            }
        }
    };

    const handleOtpKeyDown = (e, index) => {
        // Move back on Backspace
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1].focus();
        }
    };







    return (
        <div className={`min-h-screen  ${theme === "dark" ? "bg-gray-800" : "bg-gradient-to-t from-blue-600 to-blue-800"} flex justify-center items-center p-4 overflow-hidden`} >

            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`${theme === "dark" ? "bg-black text-white" : "bg-white"} p-6 md:p-8  rounded-lg shadow-2xl w-full max-w-md relative z-10`}
            >


                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 260, damping: 20 }}
                    className='w-24 h-24 bg-green-500 mx-auto rounded-full mb-4 flex items-center justify-center'
                >
                    <FaWhatsapp className='w-16 h-16 text-white' />
                </motion.div>

                <h1 className={`font-bold text-center my-6 text-3xl ${theme === "dark" ? "text-white" : "text-black"}`}>WhatsApp Login</h1>

                <ProgressBar />

                {error && <p className='text-red-500 text-center mb-4'>{error}</p>}

                {step === 1 && (
                    <form className='space-y-4' onSubmit={handleLoginSubmit(onLoginSubmit)}>
                        <p className={`mb-4 text-center ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Enter your Phone Number to recieve an otp </p>

                        <div className='relative'>
                            <div className='flex'>
                                <div className='relative w-1/3'>
                                    <button className={`flex-shrink-0 z-10 inline-flex items-center py-2.5 font-medium text-sm px-4 text-center border ${theme === "dark" ? "text-white bg-gray-700 border-gray-600  hover:bg-gray-800" : " hover:bg-gray-200 text-gray-900 bg-gray-100 border-gray-300"}
                                    border rounded-s-lg  focus:ring-2  focus:outline-none focus:ring-gray-100`} type='button' onClick={() => setShowDropDown(!showDropDown)}>
                                        <span>{selectedCountry.flag}{selectedCountry.dialCode} </span>
                                        <FaChevronDown className='ml-2' />

                                    </button>
                                    {showDropDown && (
                                        <div ref={showDropDownRef} className={`absolute z-10 w-full mt-1 ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-600"} border rounded-md shadow-lg max-h-60 overflow-auto`}>
                                            <div className={`sticky top-0 ${theme === "dark" ? "bg-gray-700" : "bg-white"} p-2 `}>
                                                <input type="text" placeholder='Search countries...' value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value) }}
                                                    className={` text-sm w-full px-2 py-1 border ${theme === "dark" ? "bg-gray-600 border-gray-600 text-white" : "text-gray-600 border-gray-300 bg-white"} rounded-md border focus:outline-none focus:ring-2 focus:ring-green-500`} />
                                            </div>
                                            {filterCountry.map((country) => (

                                                <button
                                                    type='button'
                                                    key={country.alpha2}
                                                    className={`w-full text-left px-3 py-2 ${theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-100"}  focus:outline-none focus:bg-gray-100`}
                                                    onClick={(e) => {
                                                        setSelectedCountry(country)
                                                        setShowDropDown(false)
                                                    }}>
                                                    {country.flag} ({country.dialCode}) {country.name}</button>
                                            ))}
                                        </div>
                                    )}

                                </div>


                                <input
                                    type="text"
                                    {...loginRegister("phoneNumber")}
                                    placeholder='Phone Number'
                                    value={phoneNumber}
                                    onChange={(e) => { setPhoneNumber(e.target.value) }}
                                    className={`w-2/3 px-3 py-2 border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500  ${loginErrors.phoneNumber && "border-red-500"}`}
                                />

                            </div>
                            {loginErrors.phoneNumber && (
                                <p className='text-sm text-red-500'>{loginErrors.phoneNumber.message}</p>
                            )}
                        </div>


                        {/* divider with or */}
                        <div className='flex items-center my-4'>
                            <div className='flex-grow h-px bg-gray-400' />
                            <span className='mx-2 text-sm font-medium text-gray-300'>Or</span>
                            <div className='flex-grow h-px bg-gray-400' />
                        </div>


                        {/* email input box */}
                        <div className={`flex items-center border rounded-md py-2 px-3 ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`} >

                            <FaUser className={`mr-2 text-gray-400 ${theme === "dark" ? "text-gray-400" : "text-gray-500"} `} />
                            <input
                                type="email"
                                {...loginRegister("email")}
                                placeholder='Email(Optional)'
                                value={email}
                                onChange={(e) => { setEmail(e.target.value) }}
                                className={`w-full bg-transparent focus:outline-none ${theme === "dark" ? "text-white" : "text-black"}   ${loginErrors.email ? "border-red-500" : ""}`}
                            />

                            {loginErrors.email && (
                                <p className='text-red-500 text-sm'>{loginErrors.email.message}</p>
                            )}

                        </div>

                        <button
                            type='submit'
                            className='w-full py-2 rounded-md text-white font-bold bg-gradient-to-r from-green-500 to-green-700  hover:bg-blue-800 transition'
                        > {isLoading ? <Spinner /> : "Send Otp"}</button>

                        <button
                            type='button'
                            onClick={toggleTheme}
                            className={`w-full mt-2 py-2  rounded-md text-white bg-gray-2 00 ${theme === "dark" ? "bg-gray-600 text-gray-300 hover:bg-gray-700" : "bg-gray-300 text-gray-700 hover:bg-gray-300"}  flex items-center justify-center transition rounded-md`}
                        >  <FaArrowLeft className='mr-2' /> Change Daylight/ NightTime</button>

                    </form>
                )}


                {step === 2 && (
                    <form onSubmit={handleOtpSubmit(onOtpSubmit)}>
                        <p
                            className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                                } mb-4`}
                        >
                            Please enter the 6 digit OTP sent to your{" "}
                            {userPhoneData.phoneSuffix ? (userPhoneData.phoneSuffix) : (<>Email,<br />must check spam folders for otp</>)}
                            {userPhoneData.phoneNumber && userPhoneData.phoneNumber}
                        </p>

                        <div className="flex justify-between">
                            {otp.map((digit, index) => (
                                <input
                                    type="text"
                                    key={`otp-${index}`}
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChanges(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                    ref={(el) => (otpRefs.current[index] = el)}
                                    className={`w-10 h-12 ${theme === "dark"
                                        ? "bg-gray-700 border-gray-600 text-white"
                                        : "bg-gray-300 text-gray-800 border-gray-200"
                                        } my-4 mx-auto rounded-md text-center focus:outline-none focus:ring-2 focus:border-green-500 ${otpErrors.otp ? "border-red-500" : ""
                                        }`}
                                />
                            ))}
                        </div>

                        {otpErrors.otp && otpErrors.otp.message}

                        <button
                            type="submit"
                            className="w-full py-2 rounded-md text-white bg-green-500 hover:bg-green-600 transition"
                        >
                            {isLoading ? <Spinner /> : "Continue"}
                        </button>

                        <button
                            type="button"
                            onClick={handleBack}
                            className={`w-full mt-2 py-2 rounded-md text-white ${theme === "dark"
                                ? "bg-gray-600 text-gray-300 hover:bg-gray-700"
                                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                                } flex items-center justify-center transition rounded-md`}
                        >
                            <FaArrowLeft className="mr-2" /> Wrong Number? Go Back
                        </button>
                    </form>
                )}










                {step === 3 && (
                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className='space-y-4'>
                        <div className='flex flex-col items-center mb-4'>
                            <div className='relative w-24 h-24 mb-4'>
                                <img
                                    src={profilePicture || selectedAvatar}
                                    alt="profile"
                                    className='w-full h-full rounded-full object-cover'
                                />
                                <label
                                    htmlFor="profile-picture"
                                    className={`absolute bottom-0 right-0  bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition duration-300`}
                                >
                                    <FaPlus className='w-4 h-4' />
                                </label>
                                <input type="file" id='profile-picture' onChange={handleFileChange} accept='image/*' className='hidden' />
                            </div>
                            <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"} mb-2`}>
                                Choose an Avatar</p>

                            <div className='flex flex-wrap justify-center gap-2'>
                                {avatars.map((avatar, index) => (
                                    <img src={avatar} key={index} alt={`Avatar-${index + 1}`}
                                        className={`w-12 h-12 rounded-full cursor-pointer hover:scale-110 transform ease-in-out transition duration-300 ${selectedAvatar === avatar ? "ring-2 ring-green-500" : ""}`}
                                        onClick={() => setSelectedAvatar(avatar)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className='relative'>
                            <FaUser className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`} />
                            <input type="text" {...profileRegister("username")}
                                placeholder="Username"
                                className={`w-full pl-10 pr-3 py-2 text-lg border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-400 border-gray-300"} rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none`} />
                        </div>

                        {/* <div className='flex items-center space-x-2'> */}


                        <input
                            type="checkbox"
                            {...profileRegister("agreed")}
                            className={`rounded-md mr-2 text-green-500 ${theme === "dark" ? "bg-gray-700" : ""} focus:ring-2 focus:ring-green-500`}
                        />

                        <label
                            htmlFor=""
                            className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                        >
                            I am agree to {" "} <a href='#' className='hover:underline text-red-500'>terms and conditions</a>
                        </label>

                        {profileErrors.agreed && (
                            <p className='text-sm text-red-500'>{profileErrors.agreed.message}</p>
                        )}

                        <button
                            type='submit'
                            disabled={!watch("agreed") || isLoading}
                            className={`w-full text-white font-bold rounded-md transition duration-300 ease-in-out px-4 py-3 ${theme === "dark" ? " bg-gray-500 hover:bg-gray-600" : "bg-gray-300 hover:bg-gray-200"}  focus:outline-none focus:bg-gray-100
                            ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                            `}
                        >
                            {isLoading ? <Spinner /> : "Create Account"}
                        </button>


                    </form>
                )}

            </motion.div >

        </div>
    )


}

export default Login