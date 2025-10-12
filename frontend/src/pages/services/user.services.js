import axiosInstance from "./url.services.js";

export const sendotp = async (phoneNumber, phoneSuffix, email) => {
    try {
        const response = await axiosInstance.post("/auth/send-otp", {
            phoneNumber, phoneSuffix, email
        })
        // console.log(response.data)
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
        // throw "error hy ahaha";
    }
}

export const verifyotp = async (phoneNumber, phoneSuffix, otp, email) => {
    // export const verifyotp = async (phoneNumber, email, phoneSuffix, otp) => {

    try {
        const response = await axiosInstance.post("/auth/verify-otp", {
            phoneNumber, phoneSuffix, otp, email
        })
        // console.log(response.data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}

export const updateUserProfile = async (updatedData) => {
    try {
        console.log(updatedData);
        const response = await axiosInstance.put("/auth/update-profile", updatedData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        })
        console.log(response.data);
        return response.data;

    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}

export const checkUserAuth = async () => {
    try {
        const response = await axiosInstance.get("/auth/check-auth")
        if (response.data.status === "success") {
            return { isAuthenticated: true, user: response?.data?.data }
        }
        else if (response.data.status === "error") {
            return { isAuthenticated: false }
        }
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}

export const logout = async () => {
    try {
        const response = await axiosInstance.get("/auth/logout")
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}

export const getAllUsers = async () => {
    try {
        const response = await axiosInstance.get("/auth/users")
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}
