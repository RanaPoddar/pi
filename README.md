# WebRTC Video Streaming Server (Raspberry Pi)

This server captures video from the Pi camera and streams it live using WebRTC. It also provides a signaling server for WebRTC peer connection setup.

## Structure
- `server/` - Node.js backend for video capture and signaling
- `client/` - Dashboard and video player for viewing the stream

## Getting Started
1. Install dependencies in both `server` and `client` folders.
2. Start the signaling server on the Pi.
3. Open the dashboard from your laptop and connect to the stream.

## Requirements
- Node.js (v16+ recommended)
- Raspberry Pi with camera module

## Usage
- Run the server on the Pi: `cd server && npm install && npm start`
- Run the dashboard on your laptop: `cd client && npm install && npm start`

---
This project is scaffolded for a full-stack WebRTC streaming solution.
