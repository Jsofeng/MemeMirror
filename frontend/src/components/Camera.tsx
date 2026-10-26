import { useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

import { detectMeme, type MemeType } from "../utils/memeDetection";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

type CameraStreamProps = {
  onMemeDetected: (meme: MemeType) => void;
};

const CameraStream = ({ onMemeDetected }: CameraStreamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let faceLandmarker: FaceLandmarker | null = null;
    let poseLandmarker: PoseLandmarker | null = null;
    let animationId: number | null = null;
    let lastVideoTime = -1;
    let stopped = false;

    async function startCamera() {
      try {
        // 1. Request camera permission.
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
          },
          audio: false,
        });

        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;

        if (!video) {
          throw new Error("Video element not found.");
        }

        video.srcObject = stream;

        // 2. Wait until the video has loaded.
        await new Promise<void>((resolve, reject) => {
          if (video.readyState >= 2) {
            resolve();
            return;
          }

          video.onloadeddata = () => resolve();
          video.onerror = () => reject(new Error("Failed to load webcam video."));
        });

        await video.play();

        if (stopped) return;

        // 3. Load MediaPipe.
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);

        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (stopped) {
          faceLandmarker.close();
          faceLandmarker = null;
          return;
        }

        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: POSE_MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        if (stopped) return;

        setStatus("Camera and MediaPipe ready");

        // 4. Process webcam frames.
        function processFrame() {
          if (stopped || !videoRef.current) return;

          const currentVideo = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");

          if (!canvas || !ctx || currentVideo.readyState < 2) {
            animationId = requestAnimationFrame(processFrame);
            return;
          }

          if (currentVideo.currentTime !== lastVideoTime) {
            lastVideoTime = currentVideo.currentTime;

            // Keep canvas dimensions in sync with the webcam.
            if (
              canvas.width !== currentVideo.videoWidth ||
              canvas.height !== currentVideo.videoHeight
            ) {
              canvas.width = currentVideo.videoWidth;
              canvas.height = currentVideo.videoHeight;
            }

            ctx.drawImage(
              currentVideo,
              0,
              0,
              canvas.width,
              canvas.height,
            );

            // Use one timestamp for both MediaPipe detectors.
            const timestamp = performance.now();

            const faceResults = faceLandmarker!.detectForVideo(
              currentVideo,
              timestamp,
            );

            const poseResults = poseLandmarker!.detectForVideo(
              currentVideo,
              timestamp,
            );

            const drawingUtils = new DrawingUtils(ctx);

            // 5. Get face landmarks, if available.
            const faceLandmarks =
              faceResults.faceLandmarks.length > 0
                ? faceResults.faceLandmarks[0]
                : undefined;

            if (faceLandmarks) {
              ctx.fillStyle = "#00FF00";

              for (const landmark of faceLandmarks) {
                ctx.beginPath();

                ctx.arc(
                  landmark.x * canvas.width,
                  landmark.y * canvas.height,
                  1.5,
                  0,
                  2 * Math.PI,
                );

                ctx.fill();
              }
            }

            // 6. Get pose landmarks and detect a meme.
            const poseLandmarks =
              poseResults.landmarks.length > 0
                ? poseResults.landmarks[0]
                : undefined;

            if (poseLandmarks) {
              // Pass BOTH body and face landmarks.
              const meme = detectMeme(poseLandmarks, faceLandmarks);

              onMemeDetected(meme);

              drawingUtils.drawConnectors(
                poseLandmarks,
                PoseLandmarker.POSE_CONNECTIONS,
                {
                  color: "#00FFFF",
                  lineWidth: 3,
                },
              );

              drawingUtils.drawLandmarks(poseLandmarks, {
                color: "#FF0000",
                lineWidth: 1,
                radius: 4,
              });
            } else {
              // No pose means no current meme match.
              onMemeDetected(null);
            }

            // 7. Update the status once per processed frame.
            const faceDetected = faceLandmarks !== undefined;
            const poseDetected = poseLandmarks !== undefined;

            setStatus(
              `Face: ${faceDetected ? "Detected" : "Not detected"} | ` +
                `Pose: ${poseDetected ? "Detected" : "Not detected"}`,
            );
          }

          animationId = requestAnimationFrame(processFrame);
        }

        processFrame();
      } catch (err) {
        console.error("Camera or MediaPipe initialization failed:", err);

        if (!stopped) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not initialize the camera or MediaPipe.",
          );

          onMemeDetected(null);
        }
      }
    }

    startCamera();

    return () => {
      stopped = true;

      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }

      stream?.getTracks().forEach((track) => track.stop());

      faceLandmarker?.close();
      poseLandmarker?.close();
    };
  }, [onMemeDetected]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />

      <canvas ref={canvasRef} className="block h-auto w-full" />

      {error && (
        <p className="absolute inset-x-4 top-12 rounded bg-black/60 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <p className="absolute bottom-3 left-4 rounded bg-black/50 px-2 py-1 text-xs text-zinc-300">
        {status}
      </p>
    </div>
  );
};

export default CameraStream;