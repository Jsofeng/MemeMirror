import CameraStream from "./components/Camera";

function App() {
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

      <section className="mx-auto flex max-w-6xl gap-6 p-8">
        {/* Camera */}
        <div className="flex-1">
          <div className="aspect-video overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="flex h-full items-center justify-center text-zinc-500">
              <CameraStream />
            </div>
          </div>
        </div>

        {/* Meme */}
        <div className="w-80">
          <div className="aspect-square rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="flex h-full items-center justify-center text-zinc-500">
              Meme Match
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App