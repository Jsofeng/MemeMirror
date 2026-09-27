import cv2 as cv
import mediapipe as mp
import numpy as np

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

# Open MacBook webcam
cap = cv.VideoCapture(0)

def evaluate_pose(landmarks):
    """Simple rule-based algorithm to match poses to memes."""
    # Extract key joint coordinates (Y-axis is inverted in images: 0 is top, 1 is bottom)
    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]
    left_wrist = landmarks[15]
    right_wrist = landmarks[16]

    shoulder_width = np.sqrt(
        (left_shoulder.x - right_shoulder.x)**2 +
        (left_shoulder.y - right_shoulder.y)**2
    )
    
    # 3. Calculate vertical distance between your wrists
    # (Y-axis is inverted: negative means left is higher, positive means right is higher)
    wrist_height_difference = left_wrist.y - right_wrist.y

    hands_at_chest_level = (left_wrist.y > left_shoulder.y) and (right_wrist.y > right_shoulder.y)

    if hands_at_chest_level:
        # A tiny threshold (15% of your shoulder width) catches small weighing gestures
        sensitivity_threshold = shoulder_width * 0.15


        if abs(wrist_height_difference) > sensitivity_threshold: # if the height of the wrist is greater than the shoulder with the new threshold THEN SIX SEVENN
            return "SIX SEVEEEN"

    # Pose logic 2: Confused Travolta / Spiderman Pointing (Both arms extended outward horizontally)
    # Checking if wrists are relatively aligned with shoulders horizontally
    if abs(right_wrist.y - right_shoulder.y) < 0.15 and abs(left_wrist.y - left_shoulder.y) < 0.15:
        return "CONFUSED TRAVOLTA"
        
    return "Scanning for a meme..."

print("Press 'q' in the camera window to quit.")

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("Ignoring empty camera frame.")
        continue

    # Flip horizontally for a mirror effect, convert to RGB for MediaPipe
    frame = cv.flip(frame, 1)
    rgb_frame = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
    
    # Process the frame and find landmarks
    results = pose.process(rgb_frame)
    
    current_meme = "No body detected"
    
    # Draw skeleton overlays and evaluate pose
    if results.pose_landmarks:
        mp_drawing.draw_landmarks(
            frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
        
        # Match user's coordinates to our meme database
        current_meme = evaluate_pose(results.pose_landmarks.landmark)

    # UI Overlay: Render the text of the matched meme onto the feed
    cv.putText(frame, f"Meme Match: {current_meme}", (10, 50), 
               cv.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv.LINE_AA)
    
    # Display the result
    cv.imshow('Meme Pose Matcher', frame)
    
    if cv.waitKey(5) & 0xFF == ord('q'):
        break

cap.release()
cv.destroyAllWindows()
