import type {
  Landmark,
  MemeDetector,
  MemeType,
} from "./MemeDetector";

export class Nailong implements MemeDetector {
  readonly memeType: MemeType = "nailong";

  private lastCheckTime = 0;
  private readonly checkInterval = 150;

  detect(
    _poseLandmarks: Landmark[],
    faceLandmarks?: Landmark[],
    frame?: HTMLCanvasElement,
  ): boolean {
    const now = performance.now();

    // Limit pixel processing to approximately 6-7 checks per second.
    if (now - this.lastCheckTime < this.checkInterval) {
      return false;
    }

    this.lastCheckTime = now;

    if (!faceLandmarks || !frame || faceLandmarks.length <= 291) {
      return false;
    }

    const upperLip = faceLandmarks[13];
    const lowerLip = faceLandmarks[14];
    const leftCorner = faceLandmarks[61];
    const rightCorner = faceLandmarks[291];

    const mouthGap = Math.abs(upperLip.y - lowerLip.y);

    if (mouthGap <= 0.03) {
      return false;
    }

    const width = frame.width;
    const height = frame.height;

    const x1 = Math.max(0, Math.floor(leftCorner.x * width));
    const x2 = Math.min(width, Math.ceil(rightCorner.x * width));
    const y1 = Math.max(0, Math.floor(upperLip.y * height));
    const y2 = Math.min(height, Math.ceil(lowerLip.y * height));

    if (x2 <= x1 || y2 <= y1) {
      return false;
    }

    // Read the mouth pixels directly from the existing canvas.
    const ctx = frame.getContext("2d", {
      willReadFrequently: true,
    });

    if (!ctx) {
      return false;
    }

    try {
      const imageData = ctx.getImageData(
        x1,
        y1,
        x2 - x1,
        y2 - y1,
      );

      const pixels = imageData.data;
      let redPixels = 0;
      const totalPixels = imageData.width * imageData.height;

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        // Convert RGB values to HSV.
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        let hue = 0;

        if (delta !== 0) {
          if (max === r) {
            hue = 60 * (((g - b) / delta) % 6);
          } else if (max === g) {
            hue = 60 * ((b - r) / delta + 2);
          } else {
            hue = 60 * ((r - g) / delta + 4);
          }
        }

        if (hue < 0) {
          hue += 360;
        }

        const saturation = max === 0 ? 0 : delta / max;
        const value = max / 255;

        // Match the two red hue ranges from the Python version.
        const isRedHue = hue <= 20 || hue >= 320;
        const hasEnoughSaturation = saturation >= 40 / 255;
        const isBrightEnough = value >= 40 / 255;

        if (isRedHue && hasEnoughSaturation && isBrightEnough) {
          redPixels++;
        }
      }

      const redRatio = totalPixels > 0
        ? redPixels / totalPixels
        : 0;

      return redRatio > 0.35;
    } catch (error) {
      console.error("Nailong detection failed:", error);
      return false;
    }
  }
}