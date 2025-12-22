# Track Specification: Enhance Folder Management

## Overview
This track focuses on improving the folder management capabilities within the Sidebar component. The goal is to bring the same level of tactile control and organization found in the Notes List (drag-and-drop reordering) to the directory structure itself. Additionally, users will be able to rename existing folders, a feature currently missing.

## Objectives
-   **Rename Folders:** Allow users to rename folders directly from the Sidebar UI.
-   **Reorder Folders:** Implement drag-and-drop reordering for folder nodes within the Sidebar, persisting the order in the database.
-   **Consistent UX:** Ensure the interaction model (long-press to select/edit/drag) mirrors the established patterns in the Notes List.

## User Stories
-   As a user, I want to rename a folder so that I can correct typos or update its purpose.
-   As a user, I want to drag and drop folders in the sidebar to organize them in a custom order.
-   As a user, I want visual feedback when dragging a folder so I know exactly where it will be placed.

## Functional Requirements
### 1. Rename Folder
-   **UI Trigger:** A "Rename" button should appear in the context menu or action bar when a folder is selected (via long-press). Alternatively, a double-click or specific edit icon could trigger it. *Decision:* Use the existing "Selection Mode" pattern. When a folder is selected, show a "RENAME" button in the bottom action bar (next to "MOVE" or replacing it if only one item is selected).
-   **Interaction:** Clicking "Rename" opens a modal (reusing `PixelModal`) pre-filled with the current name.
-   **Validation:** Prevent empty names.
-   **Persistence:** Update the folder's name in the `fs_nodes` table in Dexie.js.

### 2. Reorder Folders
-   **Interaction:** Enable drag-and-drop for folder items in the Sidebar using `@dnd-kit/core` and `@dnd-kit/sortable`.
-   **Scope:** Reordering should work within the same parent level (sibling reordering).
-   **Visuals:** Use the same `DragOverlay` and dimming effects as the Notes List.
-   **Persistence:** Update the `order` field of the `FSNode` in the database upon drop.

## Non-Functional Requirements
-   **Performance:** Dragging must be smooth (60fps) on mobile devices.
-   **Accessibility:** Ensure all new interactive elements are keyboard accessible (though drag-and-drop is primarily pointer-based, basic actions like rename must work).

## Technical Implementation Details
-   **Store Updates:**
    -   Update `useFolderStore` to include a `renameNode(id, newName)` function.
    -   Ensure `reorderNodes` (already implemented) works correctly for folder nodes when triggered from the Sidebar.
-   **Component Updates:**
    -   Refactor `Sidebar.tsx` to wrap folder items in `SortableContext` (similar to `NotesList.tsx`).
    -   Implement `SortableFolderItem` wrapper component.
    -   Add `DndContext` to `Sidebar.tsx`.
    -   Integrate the "Rename" flow into the selection mode UI.

## Testing Strategy
-   **Unit Tests:** Test `renameNode` in `useFolderStore`.
-   **Integration Tests:** Verify that renaming updates the UI and persists after reload. Verify that reordering folders persists new order.
