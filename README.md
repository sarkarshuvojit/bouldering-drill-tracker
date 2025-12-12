# Bouldering Drill Tracker

An offline-first Progressive Web App (PWA) for tracking your bouldering drills and training progress.

## Features

- **Offline-First**: Works without an internet connection
- **Progressive Web App**: Install on your device like a native app
- **Local Storage**: All data is stored locally on your device
- **Drill Management**: Add, complete, and delete bouldering drills
- **Online/Offline Status**: Visual indicator shows your connection status

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```

### Development

Start the development server:
```bash
yarn dev
```

### Build

Build for production:
```bash
yarn build
```

Preview the production build:
```bash
yarn preview
```

## Technology Stack

- React 18
- TypeScript
- Vite
- Workbox (Service Worker)
- vite-plugin-pwa

## PWA Features

- Service Worker for offline caching
- Web App Manifest
- Installable on mobile and desktop
- Automatic updates when new content is available

### PWA Icons

To complete the PWA setup, you'll need to add icon files to the `public/` directory:
- `pwa-192x192.png` (192x192 pixels)
- `pwa-512x512.png` (512x512 pixels)

You can generate these icons from the SVG placeholder at `public/pwa-icon-placeholder.svg` or create custom icons that represent your app.

## Data Storage

All drill data is stored locally using localStorage. No data leaves your device.
