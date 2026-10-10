import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { detectMeme, type MemeType } from "../utils/memeDetection";

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const POSE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

const MEME_IMAGES: Record<Exclude<MemeType, null>, string> = {
  six_seven: "/images/sixseven.jpg",
  spooderman: "/images/tbm.jpeg",
  ishowspeed: "/images/ishowspeed.jpg",
  tongue_out: "/images/nailong-tongue.jpg",
};

type CameraStreamProps = {
  onMemeDetected: (meme: MemeType) => void;
};

const CameraStream = ({ onMemeDetected }: CameraStreamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detectedMeme, setDetectedMeme] = useState<MemeType>(null);

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Initializing...");


  useEffect(() => {

    let stream: MediaStream | null = null;
    let face_landmarker: FaceLandmarker | null = null;
    let pose_landmarker: PoseLandmarker | null = null;
    let animationId: number;
    let lastVideoTime = -1;
    let stopped = false;

    async function startCamera() {
      try {
        // 1. Request camera permission & get MediaStream
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
          },
          audio: false, // Set to true if you need microphone access
        });

        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;

        if(!video) {
          throw new Error("Video element not found.");
        }

        video.srcObject = stream;

        await new Promise<void>((resolve) => {
          if(video.readyState >= 2) {
            resolve();
          } else {
            video.onloadeddata = () => resolve();
          }
        });

        await video.play();

        const vision = await FilesetResolver.forVisionTasks(WASM_URL);

        face_landmarker = await FaceLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
          }
        );

        pose_landmarker = await PoseLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: POSE_MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
          }
        );

        if(stopped) return;

        setStatus("Camera and MediaPipe ready");

        function processFrame() {
          if (stopped || !videoRef.current) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");

          if (!canvas || !ctx || video.readyState < 2) {
            animationId = requestAnimationFrame(processFrame);
            return;
          }

          if(video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;

            const face_results = face_landmarker!.detectForVideo(
              video,
              performance.now()
            );

            const pose_results = pose_landmarker!.detectForVideo(
              video,
              performance.now()
            )

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            ctx.drawImage(
              video,
              0,
              0,
              canvas.width,
              canvas.height
            );

            const drawingUtils = new DrawingUtils(ctx);

            if (face_results.faceLandmarks.length > 0) {

              const faceLandmarks = face_results.faceLandmarks[0];
              ctx.fillStyle = "#00FF00";
              
              for (const landmark of faceLandmarks) {
                ctx.beginPath();
              
                ctx.arc(
                  landmark.x * canvas.width,
                  landmark.y * canvas.height,
                  1.5,
                  0,
                  2 * Math.PI
                );
                ctx.fill();
              }

            } else {
              setStatus("Looking for a face...");
            }

              if (pose_results.landmarks.length > 0) {
                const poseLandmarks = pose_results.landmarks[0];
                
                const meme = detectMeme(poseLandmarks);
                setDetectedMeme(meme);
                onMemeDetected(meme);

                  drawingUtils.drawConnectors(
                    poseLandmarks,
                    PoseLandmarker.POSE_CONNECTIONS,
                    {
                      color: "#00FFFF",
                      lineWidth: 3,
                    }
                  );

                  drawingUtils.drawLandmarks(poseLandmarks, {
                    color: "#FF0000",
                    lineWidth: 1,
                    radius: 4,
                  });

              } else {
                setDetectedMeme(null);
                onMemeDetected(null);
                setStatus("Looking for a pose...");
              }

          const faceDetected = face_results.faceLandmarks.length > 0;
          const poseDetected = pose_results.landmarks.length > 0;

          setStatus(
            `Face: ${faceDetected ? "Detected" : "Not detected"} | ` +
            `Pose: ${poseDetected ? "Detected" : "Not detected"}`
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
              : "Could not initialize the camera or MediaPipe."
          );
        }
    }

  }

  startCamera();

  return () => { 
      stopped = true;
      cancelAnimationFrame(animationId);
      stream?.getTracks().forEach((track) => track.stop());
      face_landmarker?.close();
      pose_landmarker?.close();
    };
  }, []);

  return (
    <div className="mx-auto mt-5 max-w-2xl text-center">
      <h2 className="mb-3 text-xl font-semibold">
        MemeMirror
      </h2>
      {error && (
        <p className="mb-3 text-red-500">{error}</p>
      )}

      <p className="mb-3 text-sm">{status}</p>

      <div className="relative overflow-hidden rounded-xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="hidden"
        />

        <canvas
          ref={canvasRef}
          className="h-auto w-full"
        />
      </div>
    </div>
  );
};

export default CameraStream;