import React, { useEffect, useState } from 'react';
import { useNoteStore } from '../stores/useNoteStore';
import { useFolderStore } from '../stores/useFolderStore';
import { useUIStore } from '../stores/useUIStore';
import { NoteItem } from '../components/NoteItem';
import { PixelInput } from '../components/ui/PixelInput';
import { PixelButton } from '../components/ui/PixelButton';
import { useNavigate } from 'react-router-dom';
import { PixelModal } from '../components/ui/PixelModal';

// DnD Kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Note } from '../db/db';

// Sortable Note Item Wrapper
const SortableNoteItem = ({ id, ...props }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.3 : 1, // Dim original while dragging
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <NoteItem {...props} />
    </div>
  );
};

export const NotesList: React.FC = () => {
  const { notes, searchQuery, setSearchQuery, fetchNotes, deleteNote } = useNoteStore();
  const { nodes, fetchNodes, currentFolderId, setCurrentFolderId, addFolder, deleteNode, moveNodes, reorderNodes } = useFolderStore();
  const { movingItems, setMovingItems } = useUIStore();
  const navigate = useNavigate();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]); 
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: number | null, nodeId: string | null }>({ isOpen: false, id: null, nodeId: null });
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeDragItem, setActiveDragItem] = useState<Note | null>(null);

  // Sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            delay: 150, // Short delay to prevent accidental drags on tap
            tolerance: 5,
        }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchNotes();
    fetchNodes();
  }, [fetchNotes, fetchNodes]);

  useEffect(() => {
    // Ensure we are in a notes folder
    if (!currentFolderId.includes('notes') && currentFolderId !== 'root_notes' && !nodes.find(n => n.id === currentFolderId && n.type === 'folder')) {
       // This is a bit weak, but helps when switching between views via bottom nav
    }
  }, [currentFolderId, nodes]);

  const folderNodes = nodes.filter(n => n.parentId === currentFolderId && n.type === 'folder');
  const noteNodes = nodes.filter(n => n.parentId === currentFolderId && n.type === 'note');

  // Filter notes based on current folder AND search
  const displayNotes = notes.filter(note => noteNodes.some(node => node.itemRefId === note.id));
  
  // Sort notes based on FSNode order
  const sortedNotes = displayNotes.sort((a, b) => {
      const nodeA = noteNodes.find(n => n.itemRefId === a.id);
      const nodeB = noteNodes.find(n => n.itemRefId === b.id);
      return (nodeA?.order || 0) - (nodeB?.order || 0);
  });

  const filteredNotes = sortedNotes.filter(note => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      const tagMatch = note.tags.some(t => t.toLowerCase().includes(query));
      const titleMatch = note.title.toLowerCase().includes(query);
      const contentMatch = note.content.toLowerCase().includes(query);
      return tagMatch || titleMatch || contentMatch;
  });

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await addFolder(newFolderName, currentFolderId, 'note');
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
  };

  const handleLongPress = (id: number) => {
    setSelectionMode(true);
    if (!selectedIds.includes(id)) {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleToggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      const newIds = selectedIds.filter(i => i !== id);
      setSelectedIds(newIds);
      if (newIds.length === 0) setSelectionMode(false);
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleMoveInit = () => {
      // Find FSNode IDs for selected notes
      const selectedNodeIds = selectedIds.map(id => noteNodes.find(n => n.itemRefId === id)?.id).filter(Boolean) as string[];
      setMovingItems({
          ids: selectedNodeIds,
          type: 'note',
          source: 'list'
      });
      setSelectionMode(false);
      setSelectedIds([]);
  };

  const handlePlaceItems = async () => {
      if (!movingItems) return;
      await moveNodes(movingItems.ids as string[], currentFolderId);
      setMovingItems(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
      const note = filteredNotes.find(n => n.id === event.active.id);
      if (note) setActiveDragItem(note);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    
    if (active.id !== over?.id) {
        const oldIndex = sortedNotes.findIndex(n => n.id === active.id);
        const newIndex = sortedNotes.findIndex(n => n.id === over?.id);
        
        // Reorder locally
        // We actually need to reorder the *Nodes*, not just the notes array.
        const newOrder = arrayMove(sortedNotes, oldIndex, newIndex);
        
        // Map back to nodes
        const reorderedNodes = newOrder.map((note, index) => {
            const node = noteNodes.find(n => n.itemRefId === note.id);
            if (node) return { ...node, order: index };
            return null;
        }).filter(Boolean);

        // Update DB
        // @ts-ignore
        await reorderNodes(reorderedNodes);
    }
  };

  const handleDeleteRequest = (id: number, nodeId: string) => {
    setDeleteConfirm({ isOpen: true, id, nodeId });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id && deleteConfirm.nodeId) {
      await deleteNote(deleteConfirm.id, deleteConfirm.nodeId);
      setDeleteConfirm({ isOpen: false, id: null, nodeId: null });
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Search Bar - No Changes */}
      <div className="relative py-3">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
          <span className="material-symbols-outlined text-xl">search</span>
        </div>
        <PixelInput 
          className="pl-12" 
          placeholder="Search tags, titles, content..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-4">
        {/* Folders List - No Changes */}
        {!searchQuery && folderNodes.map(folder => (
          <div 
            key={folder.id}
            className="flex items-center justify-between border-2 border-border-light bg-surface p-3 shadow-pixel-container cursor-pointer hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1" onClick={() => setCurrentFolderId(folder.id)}>
              <span className="material-symbols-outlined text-4xl text-secondary">folder</span>
              <p className="text-sm font-bold text-primary truncate">{folder.name}</p>
            </div>
            <button 
              onClick={() => deleteNode(folder.id)}
              className="text-danger hover:text-primary transition-colors p-2"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        ))}

        {filteredNotes.length === 0 && (searchQuery || folderNodes.length === 0) ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border-light/50 bg-surface/50 p-6 text-center">
            <span className="material-symbols-outlined text-6xl text-primary/70">
              {searchQuery ? 'search_off' : 'inventory_2'}
            </span>
            <h3 className="text-sm font-bold text-text-light">
              {searchQuery ? 'No scrolls match your search.' : 'Your scroll case is empty.'}
            </h3>
            {!searchQuery && <p className="max-w-xs text-xs leading-relaxed text-text-light/70">Tap the '+' button to scribe a new scroll!</p>}
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            autoScroll={{
                threshold: { x: 0, y: 0.15 }, // Trigger scroll in top/bottom 15% of screen
                acceleration: 10,
            }}
          >
            <SortableContext 
              items={filteredNotes.map(n => n.id)}
              strategy={verticalListSortingStrategy}
              disabled={selectionMode || !!searchQuery}
            >
              {filteredNotes.map(note => (
                <SortableNoteItem 
                  key={note.id}
                  id={note.id} 
                  note={note} 
                  nodeId={`note-${note.id}`}
                  onView={(id: number) => navigate(`/notes/view/${id}`)}
                  onEdit={(id: number) => navigate(`/notes/edit/${id}`)}
                  onDelete={handleDeleteRequest}
                  selected={selectedIds.includes(note.id)}
                  selectionMode={selectionMode}
                  onToggleSelect={handleToggleSelect}
                  onLongPress={handleLongPress}
                />
              ))}
            </SortableContext>
            
            {/* Drag Overlay for smooth visual feedback */}
            <DragOverlay>
                {activeDragItem ? (
                    <div className="opacity-90 rotate-2 scale-105">
                         <NoteItem 
                            note={activeDragItem} 
                            nodeId={`note-${activeDragItem.id}`}
                            onView={() => {}}
                            onEdit={() => {}}
                            onDelete={() => {}}
                            selected={false}
                        />
                    </div>
                ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* ... Buttons and Modals ... */}
      <div className="fixed bottom-24 right-6 z-20 flex flex-col gap-4">
        {!selectionMode && !movingItems && (
          <>
            <PixelButton 
              variant="secondary" 
              className="size-14 rounded-full shadow-[6px_6px_0px_0px_#1e1b4b]"
              onClick={() => setIsNewFolderModalOpen(true)}
            >
              <span className="material-symbols-outlined text-4xl">create_new_folder</span>
            </PixelButton>
            <PixelButton 
              className="size-14 rounded-full shadow-[6px_6px_0px_0px_#1e1b4b]" 
              onClick={() => navigate('/notes/new')}
            >
              <span className="material-symbols-outlined text-4xl">add</span>
            </PixelButton>
          </>
        )}
      </div>

      {movingItems && movingItems.source === 'list' && (
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t-2 border-border-light z-30 flex gap-2 shadow-[0px_-4px_10px_rgba(0,0,0,0.5)]">
             <div className="flex-1 flex flex-col justify-center">
                 <span className="text-[10px] font-bold text-primary uppercase">Moving {movingItems.ids.length} items...</span>
                 <span className="text-[8px] text-text-light">Navigate to folder & Place</span>
             </div>
             <PixelButton onClick={() => setMovingItems(null)} variant="secondary" className="w-24">CANCEL</PixelButton>
             <PixelButton onClick={handlePlaceItems} className="w-32">PLACE HERE</PixelButton>
         </div>
      )}

      {selectionMode && !movingItems && (
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t-2 border-border-light z-30 flex gap-2 shadow-[0px_-4px_10px_rgba(0,0,0,0.5)]">
            <PixelButton onClick={() => { setSelectionMode(false); setSelectedIds([]); }} variant="secondary" className="flex-1">CANCEL</PixelButton>
             <div className="flex flex-col items-center justify-center px-4">
                 <span className="text-xs font-bold text-primary">{selectedIds.length} Selected</span>
             </div>
            <PixelButton onClick={handleMoveInit} className="flex-1">MOVE</PixelButton>
         </div>
      )}

      <PixelModal 
        isOpen={isNewFolderModalOpen} 
        onClose={() => setIsNewFolderModalOpen(false)}
        title="New Folder"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <PixelInput 
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name..."
            autoFocus
          />
          <PixelButton type="submit" className="w-full h-12 text-xs">CREATE</PixelButton>
        </form>
      </PixelModal>

      <PixelModal 
        isOpen={deleteConfirm.isOpen} 
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        title="Confirm Delete"
      >
        <p className="mb-4 text-xs text-text-light">Are you sure you want to delete this scroll?</p>
        <div className="flex justify-end gap-2">
           <PixelButton variant="secondary" onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}>CANCEL</PixelButton>
           <PixelButton className="bg-danger" onClick={confirmDelete}>DELETE</PixelButton>
        </div>
      </PixelModal>
    </div>
  );
};
