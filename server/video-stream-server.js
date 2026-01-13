// video-stream-server.js - Streams MJPEG video from rpicam-vid to HTTP
const express = require('express');
const { spawn } = require('child_process');

const app = express();
const PORT = 8080; // MJPEG stream port

// Start rpicam-vid process
const rpicam = spawn('rpicam-vid', [
  '-t', '0', // no timeout
  '-o', '-', // output to stdout
  '--width', '640',
  '--height', '480',
  '--framerate', '25'
]);

// Serve MJPEG stream
app.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
  });

  rpicam.stdout.on('data', (data) => {
    res.write(`--frame\r\n`);
    res.write(`Content-Type: image/jpeg\r\n\r\n`);
    res.write(data);
    res.write(`\r\n`);
  });

  req.on('close', () => {
    console.log('Client disconnected from MJPEG stream');
  });
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`MJPEG stream available at http://<Pi-IP>:${PORT}/stream`);
});