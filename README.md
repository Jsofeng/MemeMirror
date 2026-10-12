# MemeMirror

Strike a pose and get a meme.

MemeMirror watches your webcam, tracks your body and face, and when you copy a meme pose it pulls up the matching meme.

![MemeMirror]()

### Web

```bash
cd frontend
npm install
npm run dev
```

Hit `q` in the camera window to quit.

One catch: the script loads meme images from an `images/` folder next to it, but I moved them to `frontend/public/images/`. Copy them into `backend/webcam/images/` before running.

## How it works

MediaPipe gives us pose and face landmarks for each frame. The detection is just a few rules on top of those points, like where your wrists are compared to your shoulders, or whether your mouth is open. First rule that matches decides the meme.

## 🗂️ Project structure

```
MemeMirror/
├── backend/                  # Python + OpenCV desktop version
│   ├── requirements.txt
│   └── webcam/
│       ├── webcam_mirror.py  # main app: pose/face/tongue → meme window
│       └── claude_webcam.py  # pose landmarker experiment
└── frontend/                 # React + TypeScript + Vite + Tailwind
    ├── public/images/        # meme images
    └── src/
        ├── App.tsx           # layout + Meme Match panel
        ├── components/Camera.tsx      # webcam + MediaPipe + overlay
        └── utils/memeDetection.ts     # pose → meme logic
```

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, MediaPipe Tasks Vision
- **Backend:** Python, OpenCV, MediaPipe, NumPy, PyTorch

---
