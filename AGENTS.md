# Agent Development Guide (AGENTS.md)

Welcome, AI Agent. This document provides critical context for contributing to the **PixelKeep** project.

## High-Performance Architecture

PixelKeep is optimized for speed and fluidity. When adding features, follow these performance patterns:

### 1. Web Workers for Heavy Lifting
All CPU-intensive operations MUST be offloaded to a worker.
- **`decryption.worker.ts`**: Handles bulk AES decryption.
- **`transcription.worker.ts`**: Handles on-device AI transcription.
- **Usage**: Communicate via `postMessage`. See `useTaskStore.ts` for implementation examples.

### 2. Optimistic UI & Incremental Updates
Never block the UI for database or encryption operations.
- **Pattern**: Update the Zustand state *immediately* (optimistically), then perform the IndexedDB write in the background.
- **Constraint**: Do NOT call `fetchTasks()` or `fetchNodes()` after a mutation. Update the local `tasks` or `nodes` array incrementally.

### 3. PWA & Native Integration
PixelKeep is a "Deep PWA". Be aware of:
- **Share Target**: Handled in `ShareTarget.tsx`. Receives titles, text, and files.
- **Launch Queue**: Consumes file handles from the OS (Launch Handler API).
- **Badging**: Use the `updateBadge` helper in stores to sync the app icon badge.

## Guidelines for Asynchronous Agents

1.  **Environment Setup:** The project uses `npm` and `vite-plugin-pwa`. Ensure a full `npm run build` passes before submitting.
2.  **Thematic UI:** Use `PixelButton`, `PixelInput`, and `PixelModal`. For new icons, use the `generate_icon` tool with "8-bit pixel art" prompts.
3.  **Security Hybrid:** 
    - Notes: Always encrypted.
    - Tasks: Plaintext JSON by default (for speed), but can be encrypted. 
    - **Safe Access**: Use the `disableTaskEncryption` check from `useSettingsStore`.

## Core Store Reference

- `useAuthStore`: Auth state and keys.
- `useTaskStore`: Incremental updates + Badge syncing.
- `useFolderStore`: Metadata-first structure + Worker decryption.
- `useSettingsStore`: Performance/Security toggles.

Stay sharp, keep the UI at 60 FPS, and protect the user's data.