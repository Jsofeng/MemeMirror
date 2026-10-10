import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

const CameraStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Initializing...");


  useEffect(() => {

    let stream: MediaStream | null = null;
    let faceLandmarker: FaceLandmarker | null = null;
    let animationId: number;
    let lastVideoTime = -1;
    let stopped = false;

    async function startCamera() {
      try {
        // 1. Request camera permission & get MediaStream
        const stream = await navigator.mediaDevices.getUserMedia({
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

        faceLandmarker = await FaceLandmarker.createFromOptions(
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

            const results = faceLandmarker!.detectForVideo(
              video,
              performance.now()
            );

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            ctx.drawImage(
              video,
              0,
              0,
              canvas.width,
              canvas.height
            );

            if (results.faceLandmarks.length > 0) {

              const landmarks = results.faceLandmarks[0];
              ctx.fillStyle = "#00FF00";
              
              for (const landmark of landmarks) {
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
              
              setStatus(
                `Face detected: ${landmarks.length} landmarks`
              );

            } else {
              setStatus("Looking for a face...");
            }
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
      faceLandmarker?.close();
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

        {/* Actual browser camera */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="hidden"
        />
        {/* Video with facial landmarks drawn over it */}
        <canvas
          ref={canvasRef}
          className="h-auto w-full"
        />
      </div>
    </div>
  );
};

export default CameraStream;