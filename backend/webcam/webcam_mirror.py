import cv2 as cv
import mediapipe as mp
import numpy as np

# ---------------------------------------------------------------------------
# Paths (relative to this script file, not the current working directory)
# ---------------------------------------------------------------------------

MEMES = {
    "tongue_out": "images/nailong-tongue.jpg",
    "six_seven": "images/sixseven.jpg",
    "spooderman": "images/tbm.jpeg",
    
}

MEME_IMAGES = {}
for name, path in MEMES.items():
    img = cv.imread(path)
    if img is None:
        raise FileNotFoundError(f"Could not load meme image '{name}' from {path}")
    MEME_IMAGES[name] = cv.resize(img, (400, 400))  # resize once, up front

# ---------------------------------------------------------------------------
# MediaPipe setup
# ---------------------------------------------------------------------------
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_face_mesh = mp.solutions.face_mesh

pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True, max_num_faces=1)

# Pose landmark indices (defined once)
L_SHOULDER, R_SHOULDER = 11, 12
L_WRIST, R_WRIST = 15, 16
L_PINKY, R_PINKY = 17, 18
L_INDEX, R_INDEX = 19, 20


def dist(a, b):
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5


# ---------------------------------------------------------------------------
# Pose detectors
# ---------------------------------------------------------------------------
def is_web_pose(lm):
    ls, rs = lm[L_SHOULDER], lm[R_SHOULDER]
    lw, rw = lm[L_WRIST], lm[R_WRIST]

    sw = abs(ls.x - rs.x)
    if sw < 0.05:
        return False

    #avg shoulder height
    shoulder_y = (ls.y + rs.y) / 2 #instead of comparing each wrist to a different shoulder, you’re comparing both wrists to one average shoulder height.

    #Is this wrist reasonably close to shoulder height?
    def in_band(w):
        rel = (w.y - shoulder_y) / sw #How far above or below the shoulders is the wrist, relative to shoulder width?
        return -0.8 < rel < 0.8

    wrist_gap = abs(lw.x - rw.x) / sw

    #Check whether the left index and pinky fingers are sufficiently far away from the left wrist.
    def fingers_out(wrist, index, pinky):
        return dist(wrist, index) > 0.25 * sw and dist(wrist, pinky) > 0.2 * sw

    fingers_ok = (fingers_out(lw, lm[L_INDEX], lm[L_PINKY]) and
                  fingers_out(rw, lm[R_INDEX], lm[R_PINKY]))

    return in_band(lw) and in_band(rw) and wrist_gap > 1.0 and fingers_ok


def is_six_seven_pose(lm):
    left_shoulder, right_shoulder = lm[L_SHOULDER], lm[R_SHOULDER]
    left_wrist, right_wrist = lm[L_WRIST], lm[R_WRIST]

    shoulder_width = dist(left_shoulder, right_shoulder)
    if shoulder_width < 0.05:
        return False

    hands_at_chest_level = (left_wrist.y > left_shoulder.y) and (right_wrist.y > right_shoulder.y) and abs(left_wrist.y - left_shoulder.y) < 0.25 and abs(right_wrist.y - right_shoulder.y) < 0.25
    if not hands_at_chest_level:
        return False

    wrist_height_diff = left_wrist.y - right_wrist.y
    sensitivity_threshold = shoulder_width * 0.10

    return abs(wrist_height_diff) > sensitivity_threshold #has to be lower than the shoulders


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

    y1 = max(0, int(upper_lip.y * h))
    y2 = min(h, int(lower_lip.y * h))
    x1 = max(0, int(left_corner.x * w))
    x2 = min(w, int(right_corner.x * w))

    if y2 <= y1 or x2 <= x1:
        return False

    mouth_roi = frame[y1:y2, x1:x2]
    hsv_mouth = cv.cvtColor(mouth_roi, cv.COLOR_BGR2HSV)

    lower_red1, upper_red1 = np.array([0, 40, 40]), np.array([10, 255, 255])
    lower_red2, upper_red2 = np.array([160, 40, 40]), np.array([180, 255, 255])

    mask1 = cv.inRange(hsv_mouth, lower_red1, upper_red1)
    mask2 = cv.inRange(hsv_mouth, lower_red2, upper_red2)
    tongue_mask = mask1 + mask2

    mouth_area = mouth_roi.shape[0] * mouth_roi.shape[1]
    red_ratio = cv.countNonZero(tongue_mask) / mouth_area

    return red_ratio > 0.35


def evaluate_meme(pose_landmarks, tongue_detected):
    if tongue_detected:
        return "tongue_out"
    if pose_landmarks is not None and is_web_pose(pose_landmarks):
        return "spooderman"
    if pose_landmarks is not None and is_six_seven_pose(pose_landmarks):
        return "six_seven"
    return None


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
cap = cv.VideoCapture(0)
print("Press 'q' in the camera window to quit.")

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("Ignoring empty camera frame.")
        continue

    frame = cv.flip(frame, 1)
    rgb_frame = cv.cvtColor(frame, cv.COLOR_BGR2RGB)

    pose_results = pose.process(rgb_frame)
    face_results = face_mesh.process(rgb_frame)

    pose_landmarks = None
    if pose_results.pose_landmarks:
        pose_landmarks = pose_results.pose_landmarks.landmark
        mp_drawing.draw_landmarks(frame, pose_results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

    face_landmarks = None
    tongue_detected = False
    if face_results.multi_face_landmarks:
        face_landmarks = face_results.multi_face_landmarks[0].landmark
        tongue_detected = detect_tongue(frame, face_landmarks)

    meme_key = evaluate_meme(pose_landmarks, tongue_detected)

    if meme_key is not None:
        cv.imshow("Meme", MEME_IMAGES[meme_key])
    else:
        try:
            cv.destroyWindow("Meme")
        except cv.error:
            pass

    label = meme_key if meme_key is not None else "Scanning for a meme..."
    cv.putText(frame, f"Meme Match: {label}", (10, 50),
               cv.FONT_ITALIC, 1, (0, 255, 0), 2, cv.LINE_AA)

    cv.imshow('Meme Pose Matcher', frame)

    if cv.waitKey(5) & 0xFF == ord('q'):
        break

cap.release()
cv.destroyAllWindows()