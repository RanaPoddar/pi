
// Pi camera video capture and WebRTC stream logic
const { spawn } = require('child_process');
const { RTCVideoSource, RTCVideoFrame } = require('wrtc');


// Function to start rpicam-vid and pipe frames to RTCVideoSource
function createPiCameraTrack() {
	// Use rpicam-vid to capture raw H264 video
	const rpicam = spawn('rpicam-vid', [
		'-t', '0', // no timeout
		'-o', '-', // output to stdout
		'--width', '640',
		'--height', '480',
		'--framerate', '25'
	]);

	const videoSource = new RTCVideoSource();
	const track = videoSource.createTrack();

	// Buffer for incoming data
	let frameBuffer = Buffer.alloc(0);

	// Listen for data from rpicam-vid
	rpicam.stdout.on('data', (data) => {
		// In production, parse H264 NAL units or use ffmpeg to convert to raw frames
		// For demo, we just push dummy frames (integration with real frames requires more parsing)
		// Here, you would decode the frame and push to videoSource.onFrame
		// Example (pseudo):
		// videoSource.onFrame(new RTCVideoFrame(decodedFrame));
	});

	rpicam.stderr.on('data', (data) => {
		// Optionally log rpicam-vid errors
		// console.error('rpicam-vid error:', data.toString());
	});

	rpicam.on('close', (code) => {
		console.log('rpicam-vid process exited with code', code);
	});

	return track;
}

module.exports = { createPiCameraTrack };
