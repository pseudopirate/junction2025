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

## Project Structure

```
junction2025/
├── public/          # Static assets
├── src/
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

