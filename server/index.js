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
  console.log('[SOCKET.IO] Client connected:', socket.id);


  socket.on('offer', async (offer) => {
    console.log(`[SIGNALING] Received offer from client ${socket.id}`);
    // Create a new RTCPeerConnection for each client
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add Pi camera video track
    const videoTrack = createPiCameraTrack();
    pc.addTrack(videoTrack);
    console.log('[RTC] Video track added to PeerConnection');

    // Set remote offer
    await pc.setRemoteDescription(offer);
    console.log('[RTC] Remote offer set');

    // Create and send answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', pc.localDescription);
    console.log('[SIGNALING] Sent answer to client');

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
        console.log('[ICE] Sent ICE candidate to client');
      }
    };

    // Receive ICE candidates from client
    socket.on('ice-candidate', async (candidate) => {
      try {
        await pc.addIceCandidate(candidate);
        console.log('[ICE] Received and added ICE candidate from client');
      } catch (e) {
        console.error('[ICE] Error adding ICE candidate:', e);
      }
    });

    pc.onconnectionstatechange = () => {
      console.log(`[RTC] Connection state: ${pc.connectionState}`);
    };
  });

  socket.on('answer', (answer) => {
    console.log(`[SIGNALING] Received answer from client ${socket.id}`);
    socket.broadcast.emit('answer', answer);
  });

  socket.on('ice-candidate', (candidate) => {
    console.log(`[SIGNALING] Received ICE candidate from client ${socket.id}`);
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
