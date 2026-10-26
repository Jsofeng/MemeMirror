import type {
  Landmark,
  MemeDetector,
  MemeType,
} from "./MemeDetector";

export class Spooderman implements MemeDetector {
  readonly memeType: MemeType = "spooderman";

  detect(
    poseLandmarks: Landmark[],
    faceLandmarks?: Landmark[],
  ): boolean {
    // TODO: Implement detection logic
    return false;
  }
}