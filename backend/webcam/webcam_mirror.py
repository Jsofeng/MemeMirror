import cv2 as cv
import mediapipe as mp
import numpy as np

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose #detect the human body
mp_drawing = mp.solutions.drawing_utils #draw the human body

pose = mp_pose.Pose(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Initialize MediaPipe Face Mesh

mp_face_mesh = mp.solutions.face_mesh

face_mesh = mp_face_mesh.FaceMesh(
    refine_landmarks=True,
    max_num_faces=1
)

MEMES = {
    "tongue_out": "images/nailong-tongue.jpg",
    "six_seven": "images/sixseven.jpg"
}

tongue_meme = cv.imread(MEMES["tongue_out"])
sixseven_meme = cv.imread(MEMES["six_seven"])


# Open Webcam
cap = cv.VideoCapture(0)

def detect_tongue(frame, face_landmarks):
    if face_landmarks is None:
        return False
    
    h, w, _ = frame.shape


    upper_lip = face_landmarks[13]
    lower_lip = face_landmarks[14]

    left_corner = face_landmarks[61]
    right_corner = face_landmarks[291]

    mouth_gap = abs(upper_lip.y - lower_lip.y)

    if mouth_gap <= 0.03:
        return False
        
    #opencv needs actual coordinates so it turns mediapipe landmarks to actual pixel coords
    y1 = int(upper_lip.y * h)
    y2 = int(lower_lip.y * h)
    x1 = int(left_corner.x * w)
    x2 = int(right_corner.x * w)

    # Prevent coordinates from going outside the image
    y1 = max(0, y1)
    y2 = min(h, y2)
    x1 = max(0, x1)
    x2 = min(w, x2)

    if y2 <= y1 or x2 <= x1:
        return False
    
    mouth_roi = frame[y1:y2, x1:x2] #only gets the mouth frames 

    hsv_mouth = cv.cvtColor(mouth_roi, cv.COLOR_BGR2HSV)

    lower_red1 = np.array([0, 40, 40])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([160, 40, 40])
    upper_red2 = np.array([180, 255, 255])
 
    mask1 = cv.inRange(hsv_mouth, lower_red1, upper_red1) #creates a black-and-white image. (white = matching & black != match)
    mask2 = cv.inRange(hsv_mouth, lower_red2, upper_red2)

    tongue_mask = mask1 + mask2

    mouth_area = mouth_roi.shape[0] * mouth_roi.shape[1] #number of pixels in the mouth

    red_pixel_count = cv.countNonZero(tongue_mask) #counts how many pixels in the mask are white. 

    red_ratio = red_pixel_count / mouth_area

    return red_ratio > 0.35


def evaluate_pose(pose_landmarks, face_landmarks=None):
    """Simple rule-based algorithm to match poses to memes."""
    # Extract key joint coordinates (Y-axis is inverted in images: 0 is top, 1 is bottom)
    left_shoulder = pose_landmarks[11]
    right_shoulder = pose_landmarks[12]

    left_wrist = pose_landmarks[15]
    right_wrist = pose_landmarks[16]


    shoulder_width = np.sqrt(
        (left_shoulder.x - right_shoulder.x)**2 +
        (left_shoulder.y - right_shoulder.y)**2
    )

    #SIX SEVEN

    # 3. Calculate vertical distance between your wrists
    # (Y-axis is inverted: negative means left is higher, positive means right is higher)
    wrist_height_difference = left_wrist.y - right_wrist.y

    hands_at_chest_level = (left_wrist.y > left_shoulder.y) and (right_wrist.y > right_shoulder.y)

    if hands_at_chest_level:
        # A tiny threshold (15% of your shoulder width) catches small weighing gestures
        sensitivity_threshold = shoulder_width * 0.10


        if abs(wrist_height_difference) > sensitivity_threshold: # if the height of the wrist is greater than the shoulder with the new threshold THEN SIX SEVENN
            return "six_seven"
    
        
    return "Scanning for a meme..."

print("Press 'q' in the camera window to quit.")


while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("Ignoring empty camera frame.")
        continue

    # Flip horizontally for a mirror effect, convert to RGB for MediaPipe
    frame = cv.flip(frame, 1)
    
    h, w, _ = frame.shape

    #convert to RGB
    rgb_frame = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
    
    pose_results = pose.process(rgb_frame)
    face_results = face_mesh.process(rgb_frame)
    
    current_meme = "No body detected"
    
    pose_landmarks = None

    if pose_results.pose_landmarks:
        
        pose_landmarks = pose_results.pose_landmarks.landmark
        
        # Draw skeleton overlays and evaluate pose
        mp_drawing.draw_landmarks(
            frame,
            pose_results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS
        )

    
    face_landmarks = None
    tongue_detected = False
    
    if face_results.multi_face_landmarks: #Did MediaPipe find a face?
        face_landmarks = (
            face_results.multi_face_landmarks[0].landmark #retrieves the first detected face
        )

        tongue_detected = detect_tongue(
            frame,
            face_landmarks
        )

    
    if not tongue_detected and pose_landmarks:
        current_meme = evaluate_pose(
            pose_landmarks,
            face_landmarks
        )

    if tongue_detected and tongue_meme is not None:
        tongue_meme = cv.resize(tongue_meme, (400, 400))
        cv.imshow("Meme", tongue_meme)

    elif current_meme == "six_seven" and sixseven_meme is not None:
        sixseven_meme = cv.resize(sixseven_meme, (400, 400))
        cv.imshow("Meme", sixseven_meme)

    else:
        try:
            cv.destroyWindow("Meme")
        except cv.error:
            pass

    # UI Overlay: Render the text of the matched meme onto the feed
    cv.putText(
        frame,
        f"Meme Match: {current_meme}",
        (10, 50),
        cv.FONT_ITALIC,
        1,
        (0, 255, 0),
        2,
        cv.LINE_AA
    )
    
    # Display the result
    cv.imshow('Meme Pose Matcher', frame)
    
    if cv.waitKey(5) & 0xFF == ord('q'):
        break

cap.release()
cv.destroyAllWindows()
