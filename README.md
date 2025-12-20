# PixelKeep Refactor (PWA)

PixelKeep is a secure, local-first Progressive Web App (PWA) for managing encrypted notes and quests with a charming retro 8-bit pixel-art aesthetic. It empowers users to take control of their data with client-side encryption and offline-first capabilities.

![PixelKeep Logo](public/icons/icon-192.png)

## 🚀 Key Features

- **Local-First & Secure:** All data is encrypted using AES-256 (via `crypto-js`) and stored locally in your browser's IndexedDB. No server-side storage means your data belongs to you.
- **Hierarchical Organization:** Organize notes and quests into nested folders.
- **Rich Note Editing:** 
    - Text formatting (Bold, Italic, Underline, Lists).
    - Multimedia support: Record or upload audio, capture or import images.
    - **Advanced Image Handling:** Resizing and dragging handles for images within the editor.
- **Quest Log (Tasks):** 
    - Track tasks with due dates, locations, and involved people.
    - Custom Alarm/Reminder system with snooze and repeat functionality.
- **Immersive Customization:**
    - Multiple Themes: Standard and "Pixel" (8-bit).
    - Custom Fonts: Support for pixel fonts and modern readable fonts (Inter, Roboto, etc.).
    - Interface Scaling: Adjust the UI scale to fit your device and preference.
    - **Dual Directory Mode:** Toggle between separated notes/tasks directories or a unified view.
- **PWA Ready:** Installable on desktop and mobile for a native-like experience.

## 🛠 Tech Stack

- **Framework:** [React 18](https://reactjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Database:** [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Encryption:** [Crypto-js](https://github.com/brix/crypto-js)
- **PWA Support:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- **Icons:** [Material Symbols](https://fonts.google.com/icons)

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd PixelKeepRefactor
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open `http://localhost:5173` in your browser.

## 🏗 Build & Deployment

### Production Build

To create a production-ready build, run:

```bash
npm run build
```

This will run TypeScript checks and generate the static files in the `dist/` directory.

### Deployment

The project is designed to be hosted on any static hosting service (Firebase Hosting, Vercel, Netlify, Replit).

#### Firebase Hosting (Recommended)

1.  Initialize Firebase (if not already done):
    ```bash
    firebase init
    ```
2.  Deploy to Firebase:
    ```bash
    firebase deploy
    ```

#### Replit

1.  Import the repository into a new Repl.
2.  Set the run command to `npm run dev` for development or `npm run build && npx serve dist` for production preview.

## 📂 Project Structure

```text
src/
├── components/     # Reusable UI components (PixelButton, PixelModal, etc.)
├── db/             # Dexie.js database schema and configuration
├── hooks/          # Custom React hooks (useAudioRecorder, etc.)
├── stores/         # Zustand state stores (centralized logic)
├── utils/          # Utility functions (encryption, formatting, backup)
├── views/          # Main application views (NotesList, NoteEditor, Settings, etc.)
├── App.tsx         # Main application entry and routing
└── main.tsx        # React DOM entry point
```

## 🤖 AI Agent Integration

This project is optimized for assistance from AI agents like **Google Jules**. For specific instructions on how to contribute as an agent, please refer to [AGENTS.md](./AGENTS.md).

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*Keep your pixels secure and your quests organized.*
