import dotenv from 'dotenv'
dotenv.config();
import app from './app.js';
import http from 'http';
import initializeSocket from './services/socketService.js';
const PORT = process.env.PORT || 3000;


// create server with app.js(expres app) % for socket have to use http server, not express server
const server = http.createServer(app);

// Initialize Socket.ID and attach to server
const io = initializeSocket(server)

// apply socket middlware before other routes
app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap;
  next();
});



server.listen(PORT, () => {
  console.log(`Example app listening on port: ${PORT}`)
})
