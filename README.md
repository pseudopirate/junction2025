# Junction 2025 PWA

A Progressive Web App built with React, TypeScript, and Vite.

## Features

- ⚡️ Vite for fast development and building
- ⚛️ React 18 with TypeScript
- 📱 PWA support with service worker
- 🔥 Hot Module Replacement (HMR)
- 🚀 Optimized for Vercel deployment

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

Start the development server with watch mode:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview

Preview the production build locally:

```bash
npm run preview
```

## Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Import your project in [Vercel](https://vercel.com)

3. Vercel will automatically detect the Vite framework and use the configuration from `vercel.json`

4. Your app will be deployed and available at a Vercel URL

Alternatively, you can use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## PWA Features

This app includes:
- Service worker for offline support
- Web app manifest
- Auto-update capability
- Installable on mobile devices and desktop
- Install prompt component for better UX

## Mobile Installation

### Android/Chrome

1. Open the app in Chrome browser
2. Look for the install prompt that appears automatically, or
3. Tap the menu (three dots) → "Install app" or "Add to Home screen"
4. Confirm installation

### iOS/Safari

1. Open the app in Safari browser
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Customize the name if desired
5. Tap "Add" to confirm

The app will appear on your home screen and can be launched like a native app.

## PWA Icons

For the best installation experience, add the following icon files to the `public` folder:

- `pwa-64x64.png` (64x64 pixels)
- `pwa-192x192.png` (192x192 pixels)
- `pwa-512x512.png` (512x512 pixels)
- `maskable-icon-512x512.png` (512x512 pixels, maskable - safe zone: 80% center)
- `apple-touch-icon.png` (180x180 pixels for iOS)

If icons are not provided, the PWA plugin will generate placeholder icons during build, but it's recommended to add your own branded icons.

## Project Structure

```
junction2025/
├── public/          # Static assets (icons go here)
├── src/
│   ├── components/  # React components
│   │   └── InstallPrompt.tsx  # Install prompt component
│   ├── App.tsx      # Main app component
│   ├── App.css      # App styles
│   ├── main.tsx     # Entry point
│   └── index.css    # Global styles
├── index.html       # HTML template
├── vite.config.ts   # Vite configuration
├── tsconfig.json    # TypeScript configuration
└── vercel.json      # Vercel deployment configuration
```

## License

MIT


## Data collection capabilities

### 1. **Geolocation API** ✅
- **What**: GPS coordinates (latitude, longitude), altitude, accuracy, heading, speed
- **Permission**: Required (user must grant)
- **API**: `navigator.geolocation`
- **Use Cases**: Location tracking, route mapping, location-based services
- **Limitations**: 
  - Requires HTTPS (or localhost)
  - User must grant permission
  - Battery intensive for continuous tracking

### 2. **Weather Data** ✅
- **What**: Current weather, forecasts, air quality
- **How**: External APIs (OpenWeatherMap, WeatherAPI, etc.)
- **Requirements**: API key, user's location (from Geolocation API)
- **Note**: Not directly from device, but can be fetched based on location


### 3. **Accelerometer** ✅
- **What**: Device acceleration in X, Y, Z axes
- **API**: `DeviceMotionEvent` or Generic Sensor API
- **Permission**: May require (iOS requires user gesture)
- **Use Cases**: Motion detection, step counting, shake detection, orientation

### 4. **Gyroscope** ✅
- **What**: Angular velocity/rotation rate
- **API**: `DeviceMotionEvent` or Generic Sensor API
- **Permission**: May require
- **Use Cases**: 3D orientation, gaming, VR/AR

### 5. **Magnetometer (Compass)** ✅
- **What**: Magnetic field strength, compass heading
- **API**: `DeviceOrientationEvent`
- **Permission**: May require
- **Use Cases**: Compass apps, navigation

### 6. **Web Bluetooth API** WIP
- **What**: Connect to Bluetooth Low Energy (BLE) devices
- **Devices**: Heart rate monitors, fitness trackers, smartwatches, blood pressure monitors
- **Permission**: Required
- **Browser Support**: Chrome/Edge (Android, Windows, Mac, Linux), not iOS Safari
- **Use Cases**: Heart rate, step count, sleep data, workout metrics

## TODO
- [ ] Integrate model (Igor)
- [ ] Feed context from database (Igor)
- [ ] Decision maker: calls model, gets score and makes prediction (Aarni)
- [ ] Explanaitions based on score (Aarni)
- [ ] Come up with scenario (Slava)
- [ ] Make presentation (Slava)
- [ ] Create video
- [ ] Fill hackathon.app
- [ ] SUBMIT!
