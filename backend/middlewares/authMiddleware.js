import response from "../utlis/responseHandler.js";
import jwt from "jsonwebtoken"


export const authMiddleware = (req, res, next) => {


 const authHeader = req.headers["authorization"];

 
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        return response(res, 400, "UnAuthorized token missing, please provide valid token.")
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded;
        console.log(req.user);
        next();

    } catch (error) {
        console.log(error);
        return response(res, 400, "UnAuthorized Access.");
    }
}
