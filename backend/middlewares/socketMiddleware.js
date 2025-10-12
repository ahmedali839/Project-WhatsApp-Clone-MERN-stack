import response from "../utlis/responseHandler.js";
import jwt from "jsonwebtoken"


export const socketMiddleware = (socket, next) => {

    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.split(' ')[1]

    if (!token) {
        return next(new Error("Authentication token missing."))
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        socket.user = decoded;
        // console.log(req.user);
        next();

    } catch (error) {
        console.log(error);
        return next(new Error("UnAuthorized Access.."))
    }
}
