import cv2
import mediapipe as mp
import time
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe.framework.formats import landmark_pb2

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

latest_result = None

def receive_result_callback(result, output_image, timestamp_ms):
    global latest_result
    latest_result = result

model_path = 'pose_landmarker.task'

options = vision.PoseLandmarkerOptions(
    base_options=python.BaseOptions(model_asset_path=model_path),
    running_mode=vision.RunningMode.LIVE_STREAM,
    result_callback=receive_result_callback
)

cap = cv2.VideoCapture(0) #opens mac camera

# Start MediaPipe Task Instance
with vision.PoseLandmarker.create_from_options(options) as landmarker:
    print("MemeMirror Webcam Running! Press 'q' to quit.")
    
    while cap.isOpened(): 
        success, frame = cap.read()
        if not success:
            print("Ignoring empty camera frame.")
            continue

        # Flip the image horizontally for a natural mirror effect 
        frame = cv2.flip(frame, 1)

        # Convert the BGR OpenCV image structure to RGB (MediaPipe requirement)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Wrap numpy frame data inside MediaPipe's custom Image structure
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        # Generate a strictly increasing millisecond timestamp required for live streams
        frame_timestamp_ms = int(time.time() * 1000)

        # Send frame off asynchronously to the model (non-blocking)
        landmarker.detect_async(mp_image, frame_timestamp_ms)

        # 5. Visual Overlays: Draw the most recent results onto the active window
        if latest_result is not None and latest_result.pose_landmarks:
            for pose_landmarks in latest_result.pose_landmarks:
                # Convert Task landmark formatting into standard Protocol Buffer drawing format
                from mediapipe.framework.formats import landmark_pb2
                pose_landmarks_proto = landmark_pb2.NormalizedLandmarkList()
                pose_landmarks_proto.landmark.extend([
                    landmark_pb2.NormalizedLandmark(x=l.x, y=l.y, z=l.z) for l in pose_landmarks
                ])
                
                # Render the dots (landmarks) and lines (connections) onto the display frame
                mp_drawing.draw_landmarks(
                    frame,
                    pose_landmarks_proto,
                    mp_pose.POSE_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2), # Dots
                    mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2)                 # Skeleton Lines
                )

        # Display the output window
        cv2.imshow('MemeMirror Live Pose Tracking', frame)

        # Break loop instantly if the user strikes the 'q' key
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()