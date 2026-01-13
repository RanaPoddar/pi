# video_stream.py - Streams MJPEG video using picamera2
from picamera2 import Picamera2
from http.server import BaseHTTPRequestHandler, HTTPServer
import threading
import io
import socket

# HTTP request handler for MJPEG stream
class StreamHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/stream':
            self.send_response(200)
            self.send_header('Content-type', 'multipart/x-mixed-replace; boundary=frame')
            self.end_headers()

            try:
                while True:
                    stream = io.BytesIO()
                    camera.capture_file(stream, format='jpeg')
                    self.wfile.write(b"--frame\r\n")
                    self.wfile.write(b"Content-Type: image/jpeg\r\n\r\n")
                    self.wfile.write(stream.getvalue())
                    self.wfile.write(b"\r\n")
                    stream.seek(0)
                    stream.truncate()
            except Exception as e:
                print(f"Client disconnected: {e}")
        else:
            self.send_error(404)

# Get the Raspberry Pi's IP address dynamically
def get_pi_ip():
    hostname = socket.gethostname()
    return socket.gethostbyname(hostname)

pi_ip = get_pi_ip()

# Start the camera
camera = Picamera2()
camera.configure(camera.create_still_configuration(main={"size": (640, 480)}))
camera.start()

# Start HTTP server
server = HTTPServer(("0.0.0.0", 8080), StreamHandler)
print(f"MJPEG stream available at http://{pi_ip}:8080/stream")

try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    camera.stop()
    server.server_close()
    print("Server stopped.")