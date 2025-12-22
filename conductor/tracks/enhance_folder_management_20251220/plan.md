# Track Plan: Enhance Folder Management

## Phase 1: Store & Database Updates [checkpoint: dbd66f8]
- [x] Task: Create `renameNode` function in `useFolderStore`. [5559e46]
    - [x] Sub-task: Write unit test for `renameNode`.
    - [x] Sub-task: Implement `renameNode` in `useFolderStore.ts` to update `fs_nodes` table.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Store & Database Updates' (Protocol in workflow.md)

## Phase 2: Folder Renaming UI [checkpoint: 6c57d71]
- [x] Task: Implement "Rename" UI flow in Sidebar. [ff63e62]
    - [x] Sub-task: Update `Sidebar.tsx` selection mode to show a "RENAME" button when exactly one folder is selected.
    - [x] Sub-task: Create state for `isRenameModalOpen` and `folderToRename`.
    - [x] Sub-task: Reuse `PixelModal` to prompt for the new name.
    - [x] Sub-task: Connect the modal submission to `renameNode`.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Folder Renaming UI' (Protocol in workflow.md)

## Phase 3: Folder Reordering (Drag-and-Drop)
- [x] Task: Implement Sortable Sidebar Items. [64ca2aa]
    - [x] Sub-task: Create `SortableFolderItem` component (wrapper around the folder rendering logic) using `@dnd-kit/sortable`.
    - [x] Sub-task: Update `Sidebar.tsx` to import necessary DnD Kit components (`DndContext`, `SortableContext`, etc.).
- [x] Task: Integrate DndContext into Sidebar. [64ca2aa]
    - [x] Sub-task: Wrap the list of folders in `Sidebar.tsx` with `DndContext` and `SortableContext`.
    - [x] Sub-task: Implement `handleDragEnd` to calculate new order and call `reorderNodes`.
    - [x] Sub-task: Add `DragOverlay` for visual feedback during drag.
    - [x] Sub-task: Ensure `autoScroll` is configured for the sidebar container.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Folder Reordering (Drag-and-Drop)' (Protocol in workflow.md)

## Phase 4: Final Polish & Verification
- [ ] Task: Verify functionality and consistency.
    - [ ] Sub-task: Verify that "Rename" works and persists.
    - [ ] Sub-task: Verify that "Reorder" works and persists.
    - [ ] Sub-task: Ensure the UI matches the aesthetic (pixel-perfect buttons, correct fonts).
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Polish & Verification' (Protocol in workflow.md)
