import {
  SixSeven,
  Spooderman,
  IShowSpeed,
  Nailong,
} from "../memes";

import type {
    Landmark,
    MemeType,
} from "../memes"

export type { MemeType } from "../memes";

const detectors = [
  new SixSeven(),
  new Spooderman(),
  new IShowSpeed(),
  new Nailong(),
];

export function detectMeme(
  poseLandmarks: Landmark[],
  faceLandmarks?: Landmark[],
  frame?: HTMLCanvasElement,
): MemeType | null {

  for (const detector of detectors) {
    if (detector.detect(poseLandmarks, faceLandmarks, frame)) {
      return detector.memeType;
    }
  }
  return null;
}

