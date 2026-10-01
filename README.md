
# MaternaAI UI

Frontend for **MaternaAI**, a maternal health risk assessment app for primary healthcare workflows.

## Overview

This app helps healthcare workers:
- register/select patients
- submit visit vitals for risk assessment
- view risk result, confidence, clinical flags, and recommendations
- review patient history and risk trends
- continue capturing visits while offline, then sync later

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS (v4)
- IndexedDB for offline storage
- Recharts for risk trend charts

## Features

- **New Assessment flow** with validation for vitals
- **Risk results screen** with top factors and recommendation
- **Patient directory** with search and pending-sync visibility
- **History screen** with trend chart and visit drill-down
- **Offline-first behavior** via IndexedDB queue + sync-on-reconnect
- **Unit preferences** for temperature and blood sugar

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

The dev server runs on **http://localhost:3000**.

### Build

```bash
npm run build
```

### Preview build

```bash
npm run preview
```

### Type check

```bash
npm run lint
```

## Configuration

- `.env.example` includes `GEMINI_API_KEY` and `APP_URL` placeholders.
- API requests for prediction currently use a fixed base URL in:
  - `/home/runner/work/MaternaAi-UI/MaternaAi-UI/src/App.tsx` (`API_BASE`)

## Project Structure

```text
src/
  App.tsx
  db.js
  components/
  screens/
public/
  sw.js
```

## Notes

- This is a clinical support interface and should not replace professional medical judgment.
