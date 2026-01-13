# PixelKeep V2 Optimization Blueprint
**Status:** DRAFT | **Date:** 2026-01-12 | **Version:** 1.0
**Target:** Local-First PWA (React 18 + Vite + Dexie.js)

## 1. Executive Summary
PixelKeep V2 has a solid PWA foundation but suffers from significant scalability risks due to synchronous, main-thread decryption of the entire database on every load. The use of `CryptoJS` (legacy) instead of the Web Crypto API creates a 10-100x performance penalty. Security is generally handled via client-side encryption, but the rendering pipeline (`dangerouslySetInnerHTML`) poses an XSS risk.

## 2. Technical Debt Radar

| Severity | Component | Issue | Recommended Fix |
| :--- | :--- | :--- | :--- |
| 🔴 **Critical** | `useNoteStore.ts` | **Synchronous Decryption:** Fetches & decrypts ALL notes on main thread. | Integrate `decryption.worker.ts` into the fetch loop. |
| 🔴 **Critical** | `src/utils/encryption.ts` | **Legacy Crypto:** Uses `CryptoJS` (slow, weak defaults). | Migrate to **Web Crypto API (AES-GCM)**. |
| 🟠 **High** | `NoteDetails.tsx` | **XSS Risk:** `dangerouslySetInnerHTML` with `marked` on user input. | Implement **DOMPurify** sanitization before render. |
| 🟠 **High** | `useNoteStore.ts` | **Full Refetch:** `addNote`/`updateNote` triggers full DB refetch. | Implement **Optimistic Updates** in Zustand. |
| 🟡 **Medium** | `src/db/db.ts` | **Opaque Data:** Cannot query by tags/date without decryption. | Create a local, unencrypted **search index table** (metadata only). |
| 🟡 **Medium** | `Sidebar.tsx` | **Re-renders:** Likely renders entire list on single item change. | Use **React.memo** and granular Zustand selectors. |

## 3. Detailed Refactoring Plan

### Phase 1: Security & Core Performance (Immediate)
*   **Action A: Web Crypto Migration**
    *   Replace `CryptoJS` with `window.crypto.subtle` (AES-GCM).
    *   *Challenge:* Migration will require a script to re-encrypt existing data (Legacy -> New) upon first load.
*   **Action B: Worker Integration**
    *   Modify `useNoteStore.fetchNotes` to offload the decryption array map to `src/workers/decryption.worker.ts`.
    *   Move the new Web Crypto logic *into* the worker.

### Phase 2: React Performance (Next Sprint)
*   **Action C: Markdown Sanitization**
    *   Install `dompurify`.
    *   Wrap `marked.parse()` output: `DOMPurify.sanitize(marked.parse(...))`.
*   **Action D: Optimistic UI**
    *   Update `useNoteStore.addNote` to `set((state) => ({ notes: [...state.notes, newNote] }))` *before* awaiting the DB write.

### Phase 3: Scalability (Future)
*   **Action E: Search Indexing**
    *   Create a `search_index` table in Dexie: `{ id, title, tags, updatedAt }` (Plaintext).
    *   Allows `db.search_index.where('tags').equals(...)` without decryption.
    *   *Trade-off:* Metadata is visible if device is compromised (Acceptable for "Notes" app context, keep Content encrypted).

## 4. Immediate Code Snippets (Quick Wins)

### A. Sanitization (NoteDetails.tsx)
```typescript
import DOMPurify from 'dompurify';
// ...
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content)) }} />
```

### B. Worker Integration (useNoteStore.ts)
```typescript
// Replace synchronous map
const worker = new Worker(new URL('../workers/decryption.worker.ts', import.meta.url), { type: 'module' });

worker.postMessage({ items: encryptedNotes, password });
worker.onmessage = (e) => {
  set({ notes: e.data.data, loading: false });
};
```

---
**Approved By:** Principal Optimization Architect
