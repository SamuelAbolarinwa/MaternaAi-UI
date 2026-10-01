## MaternaAI UI

MaternaAI UI is a React + Vite frontend for maternal health risk assessment in primary healthcare settings.  
It helps healthcare workers register patients, capture visit vitals, assess maternal risk, and track outcomes over time.

## Features

- **New assessment flow** for capturing maternal vital signs and clinical inputs
- **Risk assessment results** with risk level, confidence, top contributing factors, and recommendations
- **Patient directory** with search, visit counts, and latest risk label
- **Patient history** with trend visualization and visit-by-visit details
- **Offline-first support** using IndexedDB:
  - Save visits while offline
  - Queue pending sync
  - Auto-sync when connectivity returns
- **Unit preferences** for temperature (°C/°F) and blood sugar (mmol/L/mg/dL)

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- IndexedDB (browser local storage)
- Recharts (trend charting)

## Project Structure

```
src/
  App.tsx                     # App shell + screen navigation
  db.js                       # IndexedDB + offline queue logic
  components/                 # Reusable UI components
  screens/                    # Main app screens
public/
  sw.js                       # Service worker registration target
```

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Type check

```bash
npm run lint
```

## Available Scripts

- `npm run dev` - Start Vite dev server on port 3000
- `npm run build` - Create production build
- `npm run preview` - Serve production build locally
- `npm run lint` - Run TypeScript no-emit checks
- `npm run clean` - Remove generated build artifacts

## How the App Works

1. Select an existing patient or register a new one.
2. Capture assessment inputs (age, blood pressure, blood sugar, body temperature, heart rate).
3. Submit to prediction endpoint (`/predict`) through the configured API base URL.
4. View computed risk outcome and recommendation.
5. Track longitudinal risk trend and detailed visit history.

## Offline Behavior

- Every visit is stored locally in IndexedDB.
- If prediction request fails due to connectivity, the visit is saved as **Pending** and queued.
- On reconnection, queued/pending visits are retried and updated automatically.
- Pending sync status is visible on the Patients screen.

## API Notes

The UI currently targets a hosted API base URL defined in `src/App.tsx`:

- `https://maternaai-pbpw.onrender.com`

It submits prediction payloads to:

- `POST /predict`

Expected response fields used by the UI:

- `risk_label`
- `risk_class`
- `confidence`
- `clinical_flags`
- `top_factors`
- `recommendation`

## Environment

An `.env.example` file is included for AI Studio-style runtime injection (`GEMINI_API_KEY`, `APP_URL`).  
The frontend flow in this repository primarily relies on the API base URL configured in `src/App.tsx`.
