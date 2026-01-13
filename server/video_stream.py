# video_stream.py - Streams MJPEG video using picamera2
from picamera2 import Picamera2, MjpegEncoder
from http.server import BaseHTTPRequestHandler, HTTPServer
import threading

# HTTP request handler for MJPEG stream
class StreamHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/stream':
            self.send_response(200)
            self.send_header('Content-type', 'multipart/x-mixed-replace; boundary=frame')
            self.end_headers()

            try:
                while True:
                    frame = camera.capture_buffer()
                    self.wfile.write(b"--frame\r\n")
                    self.wfile.write(b"Content-Type: image/jpeg\r\n\r\n")
                    self.wfile.write(frame)
                    self.wfile.write(b"\r\n")
            except Exception as e:
                print(f"Client disconnected: {e}")
        else:
            self.send_error(404)

# Start the camera and MJPEG encoder
camera = Picamera2()
camera.configure(camera.create_video_configuration(main={"size": (640, 480)}))
camera.start()

# Start HTTP server
server = HTTPServer(("0.0.0.0", 8080), StreamHandler)
print("MJPEG stream available at http://<Pi-IP>:8080/stream")

try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    camera.stop()
    server.server_close()
    print("Server stopped.")