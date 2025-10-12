
import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import useUserStore from "../pages/store/useUserStore.js"
import { checkUserAuth } from "../pages/services/user.services.js"


export const ProtectedRoute = () => {
    const location = useLocation()
    const [isChecking, setIsChecking] = useState("loading...")

    const { isAuthenticated, setUser, clearUser } = useUserStore()

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const result = await checkUserAuth()
                if (result.isAuthenticated) {
                    setUser(result.user)
                } else {
                    clearUser()
                }
            } catch (error) {
                console.error(error);
                clearUser()
            } finally {
                setIsChecking(false)
            }
        }
        verifyAuth()
    }, [setUser, clearUser])

    // if (isChecking) {
    //     // return setIsChecking(false)
    //     console.log("loading abhi bhe ho rha hy");

    //     return <div>Loading.1232323233.</div>
    // }

    if (!isAuthenticated) {
        return <Navigate to="/user-login" state={{ from: location }} replace />
    }

    // User got Authenticated
    return < Outlet />
}

export const PublicRoute = () => {
    const isAuthenticated = useUserStore(state => state.isAuthenticated)
    if (isAuthenticated) {
        return <Navigate to="/" replace />
    }

    return <Outlet />

}