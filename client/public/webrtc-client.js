// webrtc-client.js - Handles WebRTC connection to Pi server
const socket = io('http://localhost:3000'); // Change to Pi IP if needed
const video = document.getElementById('video');
const statusDiv = document.getElementById('status');
const connectBtn = document.getElementById('connectBtn');

let pc;

function createPeerConnection() {
  pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  pc.ontrack = (event) => {
    video.srcObject = event.streams[0];
    statusDiv.textContent = 'Live stream connected!';
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', event.candidate);
    }
  };
}

connectBtn.onclick = async () => {
  connectBtn.disabled = true;
  statusDiv.textContent = 'Connecting to stream...';
  createPeerConnection();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('offer', offer);
};

socket.on('answer', async (answer) => {
  await pc.setRemoteDescription(answer);
});

socket.on('ice-candidate', async (candidate) => {
  try {
    await pc.addIceCandidate(candidate);
  } catch (e) {
    console.error('Error adding ICE candidate', e);
  }
});

statusDiv.textContent = 'Ready to connect.';
