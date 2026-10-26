export type MemeType =
  | "six_seven"
  | "spooderman"
  | "ishowspeed"
  | "nailong";

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface MemeDetector {
  readonly memeType: MemeType;

  detect(
    poseLandmarks: Landmark[],
    faceLandmarks?: Landmark[],
    frame?: HTMLCanvasElement,
  ): boolean;
}