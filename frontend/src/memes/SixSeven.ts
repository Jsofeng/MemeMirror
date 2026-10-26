import type {
  Landmark,
  MemeDetector,
  MemeType,
} from "./MemeDetector";

export class SixSeven implements MemeDetector {
  readonly memeType: MemeType = "six_seven";

  detect(poseLandmarks: Landmark[]): boolean {
    if (poseLandmarks.length < 17) {
      return false;
    }

    const leftShoulder = poseLandmarks[11];
    const rightShoulder = poseLandmarks[12];
    const leftWrist = poseLandmarks[15];
    const rightWrist = poseLandmarks[16];

    const leftVisible = (leftWrist.visibility ?? 0) > 0.5;
    const rightVisible = (rightWrist.visibility ?? 0) > 0.5;

    if (!leftVisible || !rightVisible) {
      return false;
    }

    const shoulderWidth = Math.abs(
      leftShoulder.x - rightShoulder.x,
    );

    if (shoulderWidth < 0.05) {
      return false;
    }

    const leftWristBelowShoulder =
      leftWrist.y > leftShoulder.y;

    const rightWristBelowShoulder =
      rightWrist.y > rightShoulder.y;

    const wristHeightDifference = Math.abs(
      leftWrist.y - rightWrist.y,
    );

    return (
      leftWristBelowShoulder &&
      rightWristBelowShoulder &&
      wristHeightDifference > shoulderWidth * 0.15
    );
  }
}