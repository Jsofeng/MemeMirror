import CameraStream from "./components/Camera";
import { useState } from "react";
import { type MemeType } from "./memes";
import defaultCat from "./assets/default-cat.jpg";

const MEME_IMAGES: Record<Exclude<MemeType, null>, string> = {
  six_seven: "/images/sixseven.jpg",
  spooderman: "/images/tbm.jpeg",
  ishowspeed: "/images/ishowspeed.jpg",
  nailong: "/images/nailong-tongue.jpg",
};

function App() {
  const [detectedMeme, setDetectedMeme] = useState<MemeType>(null);

  const memeName = detectedMeme ? detectedMeme.replace("_", " ") : "";

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-8 py-5">
        <h1 className="text-2xl font-bold">MemeMirror</h1>
        <p className="text-sm text-zinc-400">
          Recreate the pose. Find your meme.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 p-8 md:grid-cols-3">
        {/* Camera card */}
        <div className="min-w-0 md:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <CameraStream onMemeDetected={setDetectedMeme} />

            <p className="absolute left-4 top-3 text-sm italic text-green-400 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
              Meme Match: {detectedMeme ?? "Scanning for a meme..."}
            </p>
          </div>
        </div>

        {/* Meme Match panel */}
        <div className="min-w-0 md:col-span-1">
          <h2 className="mb-3 text-[17px] font-semibold">Meme Match</h2>

          <div className="aspect-square rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
            <div className="h-full w-full overflow-hidden rounded-xl bg-zinc-800">
              {detectedMeme ? (
                <img
                  src={MEME_IMAGES[detectedMeme]}
                  alt={`Meme match: ${memeName}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <img
                  src={defaultCat}
                  alt="No meme detected yet"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>

          <p
            className={`mt-4 text-center text-[15px] font-semibold capitalize ${
              detectedMeme ? "text-green-400" : "text-zinc-500"
            }`}
          >
            {detectedMeme ? `${memeName} detected!` : "No meme detected yet"}
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;