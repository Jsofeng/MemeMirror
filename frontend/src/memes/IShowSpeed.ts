import type {
  Landmark,
  MemeDetector,
  MemeType,
} from "./MemeDetector";

export class IShowSpeed implements MemeDetector {
  readonly memeType: MemeType = "ishowspeed";

  detect(
    poseLandmarks: Landmark[],
    faceLandmarks?: Landmark[],
  ): boolean {
    // TODO: Implement detection logic
    return false;
  }
}