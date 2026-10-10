import type { PoseLandmarker, FaceLandmarker } from "@mediapipe/tasks-vision";

export type MemeType = 
  | "six_seven"
  | "spooderman"
  | "ishowspeed"
  | "tongue_out"
  | null;

type Landmark = {
    x: number,
    y: number,
    z: number,
    visibility?: number;
};

export function detectMeme(poseLandmarks: Landmark[],) : MemeType {
    // Ensure we have enough landmarks to evaluate the pose
    if(poseLandmarks.length < 17) {
        return null;
    }

    // MediaPipe Pose landmark indices
    const leftShoulder = poseLandmarks[11];
    const rightShoulder = poseLandmarks[12];
    const leftWrist = poseLandmarks[15];
    const rightWrist = poseLandmarks[16];

    const leftVisible = (leftShoulder.visibility ?? 0) > 0.5;
    const rightVisible = (rightShoulder.visibility ?? 0) > 0.5;

    if(!leftVisible || !rightVisible) {
        return null;
    }

    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

    if(shoulderWidth < 0.05) {
        return null;
    }

    const leftWristBelowShoulder = leftWrist.y > leftShoulder.y;
    const rightWristBelowShoulder = rightWrist.y > rightShoulder.y;
    
    const wristHeightDifference = Math.abs(leftWrist.y - rightWrist.y);

    const isSixSeven = leftWristBelowShoulder && rightWristBelowShoulder && wristHeightDifference > shoulderWidth * 0.15;

    if(isSixSeven) {
        return "six_seven";
    }

    return null;
}

