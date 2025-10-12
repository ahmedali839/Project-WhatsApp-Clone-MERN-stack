import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import './App.css'
// import Login from './pages/user-login/Login.jsx'
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import HomePage from './components/HomePage.jsx'
// import { PublicWrapper, ProtectedWrapper } from "./components/Protecteds.js"
import { PublicRoute, ProtectedRoute } from "./components/Protecteds"
import Login from './pages/user-login/Login.jsx'
import UserDetails from "./components/UserDetails.jsx"
import Status from "./pages/statusSection/Status.jsx"
import Setting from "./pages/settingSection/Setting.jsx"
import useUserStore from './pages/store/useUserStore.js'
import { useEffect } from 'react'
import { Socket } from 'socket.io-client'
import { disconnectSocket, getSocket, initializeSocket } from './pages/services/chat.services.js'
import useChatStore from './pages/store/useChatStore.js'

function App() {
  const [count, setCount] = useState(0)
  const { user } = useUserStore();
  const { setCurrentUser, initSocketListner, cleanUp } = useChatStore();

  // useEffect(() => {
  //   if (user._id) {
  //     const socket = initializeSocket();

  //     if (socket) {
  //       setCurrentUser(user)
  //       initSocketListner();
  //     }
  //   }

  //   return () => {
  //     cleanUp();
  //     disconnectSocket();
  //   }

  // }, [user, setCurrentUser, initSocketListner, cleanUp])



  useEffect(() => {
    if (user?._id) {
      // initializeSocket(user._id);   // ✅ pass user._id here
      // const socket = initializeSocket()
      const socket = initializeSocket(user._id)

      if (socket) {
        setCurrentUser(user)
        initSocketListner()
      }
    }



    return () => {
      cleanUp()
      disconnectSocket();
    };
  }, [user, setCurrentUser, initSocketListner, cleanUp]);



  return (

    <>
      <ToastContainer position='top-right' autoClose={3000} />
      <Router>
        <Routes>

          <Route element={<PublicRoute />}>
            <Route path='/user-login' element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path='/' element={<HomePage />} />
            <Route path='/user-profile' element={<UserDetails />} />
            <Route path='/status' element={<Status />} />
            <Route path='/setting' element={<Setting />} />
          </Route>
        </Routes >

      </Router >
    </>
  )
}

export default App



















































// import { useState, useEffect } from "react";
// import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import "./App.css";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// import HomePage from "./components/HomePage.jsx";
// import { PublicRoute, ProtectedRoute } from "./components/Protecteds";
// import Login from "./pages/user-login/login.jsx";
// import UserDetails from "./components/UserDetails.jsx";
// import Status from "./pages/statusSection/Status.jsx";
// import Setting from "./pages/settingSection/Setting.jsx";
// // import { initializeSocket } from './pages/services/chat.services';

// import useUserStore from "./pages/store/useUserStore.js";
// import useChatStore from "./pages/store/useChatStore.js";
// import { disconnectSocket, initializeSocket, getSocket } from "./pages/services/chat.services.js";

// function App() {
//   const { user } = useUserStore();
//   const { setCurrentUser, initSocketListner, cleanUp } = useChatStore();

//   useEffect(() => {
//     if (user?._id) {
//       initializeSocket(user._id);
//       setCurrentUser(user);
//       initSocketListner(); // from useChatStore
//     }
//   }, [user]);


//   useEffect(() => {
//     if (user?._id) {
//       const socket = initializeSocket(user._id); // ✅ pass user id
//       if (socket) {
//         setCurrentUser(user);
//         initSocketListner();
//       }
//     }

//     return () => {
//       cleanUp();
//       disconnectSocket();
//     };
//   }, [user, setCurrentUser, initSocketListner, cleanUp]);

//   return (
//     <>
//       <ToastContainer position="top-right" autoClose={3000} />
//       <Router>
//         <Routes>
//           <Route element={<PublicRoute />}>
//             <Route path="/user-login" element={<Login />} />
//           </Route>

//           <Route element={<ProtectedRoute />}>
//             <Route path="/" element={<HomePage />} />
//             <Route path="/user-profile" element={<UserDetails />} />
//             <Route path="/status" element={<Status />} />
//             <Route path="/setting" element={<Setting />} />
//           </Route>
//         </Routes>
//       </Router>
//     </>
//   );
// }

// export default App;
