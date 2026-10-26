import type {
  Landmark,
  MemeDetector,
  MemeType,
} from "./MemeDetector";

export class Nailong implements MemeDetector {
  readonly memeType: MemeType = "nailong";

  detect(
    poseLandmarks: Landmark[],
    faceLandmarks?: Landmark[],
  ): boolean {
    // TODO: Implement detection logic
    return false;
  }
}