# Tech Stack: PixelKeep

## Core Technologies
- **Language:** [TypeScript](https://www.typescriptlang.org/) - Ensures type safety and improves developer productivity across the codebase.
- **Frontend Framework:** [React 18](https://reactjs.org/) - Leverages a component-based architecture for a modular and maintainable UI.
- **Build Tool:** [Vite](https://vitejs.dev/) - Provides a fast development environment and optimized production builds.

## State Management & Data
- **Global State:** [Zustand](https://github.com/pmndrs/zustand) - A lightweight, hooks-based state management solution for handling application logic, authentication, and UI states.
- **Database:** [Dexie.js](https://dexie.org/) - A robust wrapper for IndexedDB, enabling offline-first, local-first data storage.

## UI & Interactions
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development and consistent design.
- **Interactions:** [dnd-kit](https://dndkit.com/) - A modular, performant toolkit for implementing accessible drag-and-drop reordering.

## Security
- **Encryption:** [Crypto-js](https://github.com/brix/crypto-js) - Implements client-side AES-256 encryption to ensure data remains private and secure in the local vault.

## Platform & Testing
- **PWA:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) - Transforms the application into a Progressive Web App for installability and offline support.
- **Testing:** [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Used for unit and integration testing of components and store logic.
