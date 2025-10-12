import axios from "axios"

// const backedUrl = axios('http://localhost.:8020/api')
const backedUrl = `${import.meta.env.VITE_BACKEND_URL}/api`

const getToken = () => localStorage.getItem("auth_token")

const axiosInstance = axios.create({
    baseURL: backedUrl,
    // withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
})


axiosInstance.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config;
})


export default axiosInstance;