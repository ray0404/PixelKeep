# PixelNotes PWA - Agent Context

This file provides high-level context, architectural decisions, and coding conventions for AI agents working on the PixelNotes PWA project.

## 1. Project Overview
**Identity:** PixelNotes is a secure, offline-first Progressive Web App (PWA) for note-taking and task management.
**Aesthetic:** Retro "Pixel Art" UI.
**Core Philosophy:** Client-side only. Privacy-first (end-to-end encryption locally). Zero dependencies for the runtime (no bundlers, no build step).

## 2. Architecture & Tech Stack
*   **Frontend:** Monolithic Single-Page Application (SPA).
    *   **HTML/JS/CSS:** Almost all application logic, UI structure, and styling resides in **`index.html`**.
    *   **Framework:** None. Vanilla JavaScript (ES Modules).
    *   **Styling:** Tailwind CSS (loaded via CDN) + Custom "Pixel Art" CSS in `<style>` blocks.
*   **Data Layer:**
    *   **Storage:** IndexedDB (using `idb` library wrapper).
    *   **Encryption:** `crypto-js` (AES). All user data (notes, tasks, images) is encrypted *before* storage. Keys are derived from the user's session password (never stored).
*   **Offline & Network:**
    *   **Service Worker (`sw.js`):** Critical component.
        *   Handles offline caching (Cache-First strategy).
        *   **Image Decryption:** Intercepts `fetch` requests for images, retrieves encrypted blobs from IDB, decrypts them in memory, and responds with a Blob URL.
*   **Deployment:**
    *   Firebase Hosting (static) or Docker (Nginx).

## 3. Key Files & Locations
*   **`index.html`**: **CRITICAL**. Contains 95% of the codebase. Includes DOM structure, router, database interactions, encryption logic, and UI event handlers.
    *   *Agent Note:* When asked to "refactor" or "add a feature", you will likely be editing this single file. Be careful with line counts and structure.
*   **`sw.js`**: Service Worker logic. Modify this for caching strategies or image handling.
*   **`manifest.webmanifest`**: PWA installation config (icons, colors, shortcuts).
*   **`server.py`**: Local development server (Python). Disables caching for development.
*   **`crypto-js.min.js`**: Local copy of the encryption library.

## 4. Development Workflow
*   **Run Locally:** `python server.py` (Access at `http://localhost:5000`).
*   **Build Step:** **NONE**. You do not need to run `npm build` or `webpack`. The source is the production code.
*   **Dependencies:** Managed manually or via CDN links in `index.html`.

## 5. Coding Conventions
*   **Style:** Mimic the existing "Pixel Art" aesthetic. Use Tailwind classes like `border-4`, `border-black`, `font-mono`.
*   **JavaScript:** Use standard ES6+ features (`async/await`, modules, arrow functions).
*   **Security:**
    *   **NEVER** store the user's password in `localStorage` or `IndexedDB`.
    *   **ALWAYS** encrypt sensitive data before `db.put()`.
    *   **ALWAYS** decrypt data after `db.get()`.
*   **Images:** Do not store base64 strings in IDB (performance). Store `Blob` objects.

## 6. Common Tasks & patterns
*   **Adding a UI Component:** Add the HTML template to `index.html` (usually hidden by default), add Tailwind classes, and add a toggle function in the `<script>` block.
*   **Database Migration:** If changing the data schema, update `initDB` in `index.html` to handle `upgrade` events.
*   **Routing:** The app uses a simple hash-based router (`#settings`, `#note/123`). Update the `router()` function in `index.html` to handle new routes.
