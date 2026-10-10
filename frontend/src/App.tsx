import CameraStream from "./components/Camera";
import { useState } from "react";
import type { MemeType } from "./utils/memeDetection";

const MEME_IMAGES: Record<Exclude<MemeType, null>, string> = {
  six_seven: "/images/sixseven.jpg",
  spooderman: "/images/tbm.jpeg",
  ishowspeed: "/images/ishowspeed.jpg",
  tongue_out: "/images/nailong-tongue.jpg",
}

function App() {
  const [detectedMeme, setDetectedMeme] = useState(null);
  return (

    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-8 py-5">
        <h1 className="text-2xl font-bold">
          MemeMirror
        </h1>

            <p className="text-sm text-zinc-400">
      Recreate the pose. Find your meme.
    </p>
  </header>

  <section className="mx-auto flex max-w-6xl flex-col gap-6 p-8 md:flex-row">
    {/* Camera */}
    <div className="min-w-0 flex-1">
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <CameraStream onMemeDetected={setDetectedMeme} />
      </div>
    </div>

    {/* Meme Match */}
    <div className="w-full shrink-0 md:w-80">
      <h2 className="mb-3 text-lg font-semibold">Meme Match</h2>

      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        {detectedMeme ? (
          <img
            src={MEME_IMAGES[detectedMeme]}
            alt={`Meme match: ${detectedMeme.replace("_", " ")}`}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="px-6 text-center">
            <p className="text-zinc-400">No meme detected yet</p>
            <p className="mt-2 text-sm text-zinc-600">
                  Recreate a meme pose to find your match!
                </p>
              </div>
            )}
          </div>

          {detectedMeme && (
            <p className="mt-3 text-center font-medium capitalize text-green-400">
              {detectedMeme.replace("_", " ")} detected!
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default App