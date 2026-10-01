# MaternaAI UI

MaternaAI UI is a React + Vite web app for maternal health risk assessment workflows used by healthcare workers.  
It supports patient registration, visit capture, risk result visualization, and offline-first data handling.

## Features

- **New Assessment flow** for collecting vitals and submitting a risk prediction
- **Patient directory** with search and visit counts
- **Patient history view** with trend chart and prior visit insights
- **Offline-first behavior** with IndexedDB persistence for patients/visits
- **Automatic sync** of unsynced records when connectivity is restored

## Tech Stack

- React 19
- TypeScript + Vite
- Tailwind CSS
- Recharts
- IndexedDB (browser)

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Run locally

```bash
npm run dev
```

App runs on `http://localhost:3000`.

## Available Scripts

- `npm run dev` — start local dev server
- `npm run build` — create production build
- `npm run preview` — preview production build
- `npm run lint` — run TypeScript type-check
- `npm run clean` — remove build artifacts

## Project Structure

```text
src/
  App.tsx               # app shell + screen routing
  db.js                 # IndexedDB storage and sync logic
  screens/              # main app views
  components/           # reusable UI components
public/
  sw.js                 # service worker scaffold
```

## API Integration

The app currently targets the hosted API base URL configured in `src/App.tsx`:

- `https://maternaai-pbpw.onrender.com`

Prediction and persistence flows are handled through the local `db` module, which orchestrates local-first save behavior and server sync.
