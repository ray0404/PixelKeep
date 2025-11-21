# Pixel Keep & Quest Log

A secure, offline-first Progressive Web App (PWA) for encrypted note-taking and to-do lists with a retro pixel art aesthetic.

## Overview

**Live Version:** https://pixelkeep.web.app

Pixel Keep is a privacy-focused note-taking and task management application that stores all data locally in the browser using IndexedDB with AES encryption. The app features a distinctive retro "pixel art" aesthetic with a dark indigo theme and bright green/purple accents.

## Project Status

- **Type:** Static Progressive Web App (PWA)
- **Framework:** Vanilla HTML, CSS, and JavaScript
- **Styling:** Tailwind CSS (CDN)
- **Current State:** Fully functional and ready to use

## Features

- **Offline-First:** Fully functional without internet connection via Service Worker
- **End-to-End Encryption:** All data encrypted using AES (crypto-js) before storage
- **Password Protection:** Single password unlocks and decrypts all notes and tasks
- **Note Taking:** Rich text editor with formatting, images, and audio recording
- **Quest Log:** To-do list with time, location, and people tracking
- **Image Support:** Embed images from gallery or camera
- **Audio Recording:** Record and attach audio notes
- **Data Portability:** Export/import data as JSON files
- **Installable:** Can be installed as a standalone app on desktop and mobile

## Recent Changes (2025-11-21)

- Imported project from GitHub
- Set up Python HTTP server for development on port 5000
- Configured Replit workflow for automatic server startup
- Configured deployment settings for static hosting
- Updated .gitignore for Python files

## Project Architecture

### Frontend Structure
- `index.html` - Main application file (single-page app)
- `sw.js` - Service Worker for offline functionality
- `manifest.webmanifest` - PWA manifest file
- `crypto-js.min.js` - Encryption library
- `turndown.js` - HTML to Markdown conversion
- `icons/` - PWA icons (192x192 and 512x512)

### Development Setup
- `server.py` - Simple Python HTTP server for development
- Serves static files on `0.0.0.0:5000`
- Implements cache-control headers for development
- Allows address reuse for smooth restarts

### Data Storage
- Uses IndexedDB (via idb library) for local storage
- All data is AES encrypted before storage
- No backend server required
- No external database

### Styling
- Tailwind CSS via CDN (no build process)
- Custom pixel art aesthetic with:
  - Deep indigo background (#1e1b4b)
  - Bright pixel green (#4ade80)
  - Bright pixel purple (#a855f7)
  - Pixel art font (Press Start 2P)
  - Custom shadow effects for retro look

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Styling:** Tailwind CSS (CDN)
- **Storage:** IndexedDB with idb library
- **Encryption:** crypto-js (AES)
- **PWA:** Service Worker, Web App Manifest
- **Development Server:** Python 3.11 HTTP server
- **Original Deployment:** Firebase Hosting

## User Preferences

None recorded yet.

## Development

### Running Locally
The project is configured to run automatically via the Replit workflow. The workflow starts a Python HTTP server on port 5000.

### Manual Start
If needed, you can manually start the server:
```bash
python server.py
```

### Deployment
The project is configured for static deployment. All files in the current directory will be served as static assets. The PWA can be deployed to any static hosting service (Firebase Hosting, Netlify, Vercel, etc.).

## Notes

- This is a pure client-side application with no build process
- The Tailwind CDN approach is intentional for this project
- All sensitive data is encrypted client-side before storage
- The app works completely offline after first load
- No API keys or external services required
