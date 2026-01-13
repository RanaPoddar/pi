// index.js - WebRTC signaling and video streaming server for Raspberry Pi
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const { RTCPeerConnection } = require('wrtc');
const { createPiCameraTrack } = require('./video-capture');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.static('public'));

// Serve a simple page for testing
app.get('/', (req, res) => {
  res.send('<h2>WebRTC Pi Video Server Running</h2>');
});

// WebRTC signaling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);


  socket.on('offer', async (offer) => {
    // Create a new RTCPeerConnection for each client
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add Pi camera video track
    const videoTrack = createPiCameraTrack();
    pc.addTrack(videoTrack);

    // Set remote offer
    await pc.setRemoteDescription(offer);

    // Create and send answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', pc.localDescription);

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    // Receive ICE candidates from client
    socket.on('ice-candidate', async (candidate) => {
      try {
        await pc.addIceCandidate(candidate);
      } catch (e) {
        console.error('Error adding ICE candidate:', e);
      }
    });
  });

  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer);
  });

  socket.on('ice-candidate', (candidate) => {
    socket.broadcast.emit('ice-candidate', candidate);
  });
});

server.listen(PORT, () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let ip = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ip = iface.address;
        break;
      }
    }
    if (ip !== 'localhost') break;
  }
  console.log(`Server running on:`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  http://${ip}:${PORT}`);
});
