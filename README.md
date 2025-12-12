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


## Functional Requirements

- Configuration
    - user can set following configurations
        - Rest between sets
        - Target Touches
- When the app opens, user is presented with a start session button
- When user starts a session the timer begins
- At each iteration user can enter a number which can be 0
    - 0 means no touch, as in user couldn't touch any holds after starting position 
    - 0 or not the values are recorded with their timestamps
- When user enters number of touches, the rest timer starts 
- when rest time is compelte or skipped user can again enter another number 
- This will go on until user hits the target touches
- post which this session is saved locally with following details
    - Total time
    - Touches
    - Falls (this includes 0 and non 0 falls)

### non functional requirements
- modern rich ui
- use tailwind
- this app should work regardless of internet being available
- allow user to install this as a PWA in their device (mobile/desktop/tab etc)
