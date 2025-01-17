import cv2
import numpy as np
import pyautogui
from flask import Flask, Response

# Initialize Flask app
app = Flask(__name__)


def capture_screen():
    """Capture the screen and yield frames for the MJPEG stream."""
    while True:
        # Capture the screen using pyautogui
        screenshot = pyautogui.screenshot()
        frame = np.array(screenshot)
        # Convert RGB to BGR for OpenCV compatibility
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

        # Encode the frame in JPEG format
        ret, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if not ret:
            continue

        # Yield the frame in the required format for MJPEG streaming
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')


@app.route('/')
def index():
    """Home route that gives basic instructions."""
    return "<h1>Live Screen Broadcast</h1><p>Visit <a href='/stream'>/stream</a> to view the screen broadcast.</p>"


@app.route('/stream')
def stream():
    """Video streaming route for MJPEG stream."""
    return Response(capture_screen(), mimetype='multipart/x-mixed-replace; boundary=frame')


if __name__ == '__main__':
    # Run the Flask app on the local network
    app.run(host='0.0.0.0', port=5000, threaded=True)
