# Agent Development Guide (AGENTS.md)

Welcome, AI Agent. This document provides critical context and instructions for contributing to the **PixelKeep** project. 

## Project Architecture Overview

PixelKeep is a local-first, secure PWA built with a retro pixel-art aesthetic. It uses a modern web stack but maintains strict architectural patterns to ensure security and performance.

- **Frontend:** React (TypeScript) + Vite.
- **State Management:** Zustand (Stores are located in `src/stores/`).
- **Database:** Dexie.js (IndexedDB wrapper, schema in `src/db/db.ts`).
- **Styling:** Tailwind CSS with custom pixel-art utility classes (see `tailwind.config.js` and `src/index.css`).
- **Security:** All data is encrypted client-side. See `src/utils/encryption.ts`.

## Guidelines for Asynchronous Agents (e.g., Google Jules)

As an asynchronous agent operating in an isolated VM, please adhere to these protocols:

1.  **Codebase Acquisition:** Pull the latest codebase directly from the GitHub repository. Do not assume local state from the user's environment.
2.  **Environment Setup:** 
    - The project uses `npm`. Run `npm install` to set up dependencies.
    - Run `npm run dev` to start the development server.
    - Run `npm run build` to verify production builds and TypeScript integrity.
3.  **Dependency Management:** 
    - Verify existing usage in `package.json` before adding new libraries.
    - Prefer lightweight, well-maintained libraries that align with the local-first/PWA philosophy.
4.  **Styling & UI:** 
    - Adhere strictly to the "Pixel" theme conventions. 
    - Use `PixelButton`, `PixelInput`, and `PixelModal` from `src/components/ui/` for consistency.
    - Mimic the 8-bit aesthetic in all new UI components.
5.  **Data Integrity:** 
    - Always interact with data through the Zustand stores (`src/stores/`) or the Dexie database layer (`src/db/db.ts`).
    - Ensure encryption is respected when modifying sensitive content.
6.  **Submission:** 
    - Once your task is complete, create a descriptive Pull Request (PR) or branch in GitHub.
    - Provide a clear summary of changes, explaining the *why* behind architectural choices.
    - Include tests if applicable (though the current project focus is on rapid feature implementation).

## Core Store Reference

- `useAuthStore`: Handles user authentication state and password-derived encryption keys.
- `useNoteStore`: CRUD operations for notes.
- `useTaskStore`: CRUD operations for quests/tasks.
- `useFolderStore`: Manages the hierarchical file system (FSNode).
- `useSettingsStore`: Persistent user preferences (Theme, Font, Scale, Dual Directory).
- `useUIStore`: Global UI states (Sidebar toggle, etc.).

## Common Tasks

- **Adding a View:** Place in `src/views/` and register in `src/App.tsx`.
- **Modifying UI:** Check `src/components/` for shared components.
- **Adjusting Logic:** Check the corresponding store in `src/stores/`.

Stay efficient, stay secure, and keep the pixels sharp.
