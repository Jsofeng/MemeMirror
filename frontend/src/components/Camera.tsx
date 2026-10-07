import { useEffect, useRef, useState } from "react";

const CameraStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let localStream = null;

    async function startCamera() {
      try {
        // 1. Request camera permission & get MediaStream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false, // Set to true if you need microphone access
        });

        localStream = stream;

        // 2. Bind the MediaStream to the <video> element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Camera permission denied or not found.");
      }
    }

    startCamera();

    // 3. Cleanup: Stop the stream when the component unmounts
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>Browser Camera Stream</h2>
      
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
};

export default CameraStream;
