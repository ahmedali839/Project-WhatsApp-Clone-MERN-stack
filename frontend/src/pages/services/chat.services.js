// import { io } from "socket.io-client"
// import useUserStore from "../store/useUserStore";


// let socket = null;


// export const initializeSocket = () => {
//     //  let { user } = useUserStore(); // //  run when app.jsx don't create user._id

//     if (socket) return socket;

//     let backendUrl = import.meta.env.VITE_BACKEND_URL

//     socket = io(backendUrl, {
//         withCredentials: true,
//         transports: ["websocket", "polling"],
//         reconnectionAttempts: 5,
//         reconnectionDelay: 1000,
//     })

//     socket("connect", () => {
//         console.log("socket connected", socket._id)
//         socket.emit("user_connected", user._id)
//     })


//     socket("connect_error", (error) => {
//         console.log("socket connecting error", error)
//     })


//     socket("disconnect", (reason) => {
//         console.log("socket disconnectin error", reason)
//     })

//     return socket;
// }


// export const getSocket = () => {
//     if (!socket) {
//         return initializeSocket();
//     }
//     return socket;
// }


// export const disconnectSocket = () => {
//     if (socket) {
//         socket.disconnect();
//         socket = null;
//     }
//     return socket;
// }

















// // frontend - src/pages/services/chat.services.js
// import { io } from "socket.io-client";

// let socket = null;

// export const initializeSocket = (userId) => {
//     if (socket) return socket;

//     const backendUrl = import.meta.env.VITE_BACKEND_URL;
//     socket = io(backendUrl, {
//         withCredentials: true,
//         transports: ["websocket", "polling"],
//         reconnectionAttempts: 5,
//         reconnectionDelay: 1000,
//     });

//     socket.on("connect", () => {
//         console.log("socket connected", socket.id);
//         // emit if we have a userId
//         if (userId) {
//             socket.emit("user_connected", userId);
//         }
//     });

//     socket.on("connect_error", (err) => {
//         console.warn("socket connect_error", err);
//     });

//     socket.on("disconnect", (reason) => {
//         console.log("socket disconnected", reason);
//     });

//     return socket;
// };

// // returns the socket instance or null (do not throw)
// export const getSocket = () => socket;

// export const disconnectSocket = () => {
//     if (socket) {
//         socket.disconnect();
//         socket = null;
//     }
// };

































import { io } from "socket.io-client";

let socket = null;
const token = localStorage.getItem("auth_token")

export const initializeSocket = (userId) => {
    if (socket) return socket;

    let backendUrl = import.meta.env.VITE_BACKEND_URL;

    socket = io(backendUrl, {
        // withCredentials: true,
        auth: { token },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });


    socket.on("connect", () => {
        console.log("socket connected", socket.id);
        socket.emit("user_connected", userId);
    });

    socket.on("connect_error", (error) => {
        console.log("socket connecting error", error);
    });

    socket.on("disconnect", (reason) => {
        console.log("socket disconnected", reason);
    });

    // socket.on("recieve_message", (message) => {
    //     console.log("📩 new message received on frontend:", message);
    //     useChatStore.getState().recieveMessage(message);
    // });

    return socket;
};

export const getSocket = (userId) => {
    if (!socket) {
        if (!userId) throw new Error("Need userId to initialize socket");
        return initializeSocket(userId);
    }
    return socket;
};


export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
