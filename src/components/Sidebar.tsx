import React, { useEffect, useState, useRef } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useFolderStore } from '../stores/useFolderStore';
import { cn } from '../utils/ui';
import { useNavigate, useLocation } from 'react-router-dom';
import { PixelButton } from './ui/PixelButton';
import { PixelModal } from './ui/PixelModal';
import { PixelInput } from './ui/PixelInput';
import { PixelCheckbox } from './ui/PixelCheckbox';
import { useSettingsStore } from '../stores/useSettingsStore';
import { SortableFolderItem } from './SortableFolderItem';

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
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FSNode } from '../db/db';

export const Sidebar: React.FC = () => {
  const { sidebarOpen, setSidebarOpen, movingItems, setMovingItems } = useUIStore();
  const { nodes, fetchNodes, addFolder, currentFolderId, setCurrentFolderId, deleteNode, moveNodes, renameNode } = useFolderStore();
  const { dualDirectory } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string | null, name: string }>({ isOpen: false, id: null, name: '' });

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newNodeName, setNewName] = useState('');
  const [nodeToRename, setNodeToRename] = useState<string | null>(null);

  const [activeDragItem, setActiveDragItem] = useState<FSNode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (sidebarOpen) {
      fetchNodes();
    }
  }, [sidebarOpen, fetchNodes]);

  const isTasksView = location.pathname.includes('tasks');
  const rootId = isTasksView ? 'root_tasks' : 'root_notes';

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await addFolder(newFolderName, currentFolderId, isTasksView ? 'task' : 'note');
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
  };

  const handleStart = (id: string) => {
    timerRef.current = setTimeout(() => {
      setSelectionMode(true);
      if (!selectedIds.includes(id)) setSelectedIds(prev => [...prev, id]);
    }, 500);
  };

  const handleEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      const newIds = selectedIds.filter(i => i !== id);
      setSelectedIds(newIds);
      if (newIds.length === 0) setSelectionMode(false);
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleRenameInit = () => {
    if (selectedIds.length !== 1) return;
    const nodeId = selectedIds[0];
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setNodeToRename(nodeId);
      setNewName(node.name);
      setIsRenameModalOpen(true);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nodeToRename && newNodeName.trim()) {
      await renameNode(nodeToRename, newNodeName);
      setIsRenameModalOpen(false);
      setSelectionMode(false);
      setSelectedIds([]);
    }
  };

  const handleMoveInit = () => {
      setMovingItems({
          ids: selectedIds,
          type: 'folder', // It could be a mix, but we'll assume folder structure nodes for sidebar
          source: 'sidebar'
      });
      setSelectionMode(false);
      setSelectedIds([]);
      setSidebarOpen(false); // Close sidebar to let user navigate
  };

  const handlePlaceItems = async () => {
      if (!movingItems) return;
      await moveNodes(movingItems.ids as string[], currentFolderId);
      setMovingItems(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const node = nodes.find((n) => n.id === event.active.id);
    if (node) setActiveDragItem(node);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (active.id !== over?.id) {
      // Find the parent ID of the active item
      const activeNode = nodes.find((n) => n.id === active.id);
      if (!activeNode) return;

      // Filter siblings (same level reordering)
      const siblings = nodes.filter((n) => n.parentId === activeNode.parentId);
      
      const oldIndex = siblings.findIndex((n) => n.id === active.id);
      const newIndex = siblings.findIndex((n) => n.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSiblings = arrayMove(siblings, oldIndex, newIndex);
        
        // Update order for all siblings
        const updates = reorderedSiblings.map((node, index) => ({
          ...node,
          order: index,
        }));

        // We need to merge these updates back into the full nodes list for the store
        // @ts-ignore
        await reorderNodes(updates);
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      await deleteNode(deleteConfirm.id);
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
    }
  };

    const renderScaffolding = (parentId: string, depth: number = 0) => {

      let children = nodes.filter(n => n.parentId === parentId);

      

      if (!dualDirectory) {

        if (isTasksView || parentId === 'root_tasks') {

          children = children.filter(n => n.type === 'task' || n.type === 'folder');

        } else {

          children = children.filter(n => n.type === 'note' || n.type === 'folder');

        }

      }

      

      return (

        <SortableContext 

          items={children.map(n => n.id)}

          strategy={verticalListSortingStrategy}

          disabled={selectionMode}

        >

          <div className={cn("space-y-1", depth > 0 && "ml-4 border-l-2 border-border-light/20 pl-2")}>

            {children.map(node => (

              <SortableFolderItem key={node.id} id={node.id}>

                <div 

                  className={cn(

                    "group flex items-center justify-between p-1 hover:bg-primary/10 cursor-pointer rounded select-none",

                    currentFolderId === node.id && "bg-primary/20",

                    selectedIds.includes(node.id) && "bg-secondary/20 border border-secondary/50"

                  )}

                  onTouchStart={() => handleStart(node.id)}

                  onTouchEnd={handleEnd}

                  onMouseDown={() => handleStart(node.id)}

                  onMouseUp={handleEnd}

                  onMouseLeave={handleEnd}

                  onClick={(e) => {

                    if (selectionMode) {

                      e.stopPropagation();

                      handleToggle(node.id);

                    } else {

                      if (node.type === 'folder') {

                        setCurrentFolderId(node.id);

                        navigate(isTasksView ? '/tasks' : '/notes');

                      } else if (node.type === 'note') {

                        navigate(`/notes/view/${node.itemRefId}`);

                        setSidebarOpen(false);

                      } else if (node.type === 'task') {

                        navigate(`/tasks/edit/${node.itemRefId}`);

                        setSidebarOpen(false);

                      }

                    }

                  }}

                >

                  <div className="flex items-center gap-2 flex-1 min-w-0">

                    {selectionMode && (

                       <div className="pointer-events-none">

                         <PixelCheckbox checked={selectedIds.includes(node.id)} onChange={() => {}} />

                       </div>

                    )}

                    <span className="material-symbols-outlined text-sm">

                      {node.type === 'folder' ? 'folder' : node.type === 'note' ? 'description' : 'task_alt'}

                    </span>

                    <span className="text-[10px] font-bold truncate">{node.name}</span>

                  </div>

                  {!selectionMode && (

                    <button 

                      onClick={(e) => {

                        e.stopPropagation();

                        setDeleteConfirm({ isOpen: true, id: node.id, name: node.name });

                      }}

                      className="opacity-0 group-hover:opacity-100 text-danger hover:text-primary transition-opacity"

                    >

                      <span className="material-symbols-outlined text-xs">delete</span>

                    </button>

                  )}

                </div>

                {node.type === 'folder' && renderScaffolding(node.id, depth + 1)}

              </SortableFolderItem>

            ))}

          </div>

        </SortableContext>

      );

    };

  

    return (

      <>

        <div 

          className={cn(

            "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",

            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"

          )}

          onClick={() => setSidebarOpen(false)}

        />

        

        <aside 

          className={cn(

            "fixed inset-y-0 left-0 z-50 w-64 transform border-r-4 border-border-dark bg-surface transition-transform duration-300 ease-in-out shadow-pixel-container flex flex-col",

            sidebarOpen ? "translate-x-0" : "-translate-x-full"

          )}

        >

          <div className="flex items-center justify-between border-b-4 border-border-dark p-4 bg-surface">

            <h2 className="text-xs font-bold uppercase text-primary text-shadow-pixel">Directories</h2>

            <button 

              onClick={() => setSidebarOpen(false)}

              className="text-secondary hover:text-primary"

            >

              <span className="material-symbols-outlined">close</span>

            </button>

          </div>

  

          <div className="p-4 flex gap-2 border-b-2 border-border-light/30">

            <PixelButton 

              variant="secondary" 

              className="flex-1 h-10 text-[10px]"

              onClick={() => {

                setCurrentFolderId(isTasksView ? 'root_tasks' : 'root_notes');

                navigate(isTasksView ? '/tasks' : '/notes');

              }}

            >

              ROOT

            </PixelButton>

          </div>

  

          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            <DndContext 

              sensors={sensors}

              collisionDetection={closestCenter}

              onDragStart={handleDragStart}

              onDragEnd={handleDragEnd}

              autoScroll={{

                threshold: { x: 0, y: 0.15 },

                acceleration: 10,

              }}

            >

              {dualDirectory ? (

                <>

                  <div>

                    <h3 className="text-[10px] font-bold text-secondary uppercase mb-2 border-b border-border-light/20">Notes</h3>

                    {renderScaffolding('root_notes')}

                  </div>

                  <div>

                    <h3 className="text-[10px] font-bold text-secondary uppercase mb-2 border-b border-border-light/20">Tasks</h3>

                    {renderScaffolding('root_tasks')}

                  </div>

                </>

              ) : (

                renderScaffolding(rootId)

              )}

              <DragOverlay>

                {activeDragItem ? (

                  <div className="flex items-center gap-2 p-2 bg-surface border-2 border-primary rounded shadow-pixel-container opacity-90 scale-105">

                    <span className="material-symbols-outlined text-sm text-primary">

                      {activeDragItem.type === 'folder' ? 'folder' : activeDragItem.type === 'note' ? 'description' : 'task_alt'}

                    </span>

                    <span className="text-[10px] font-bold truncate text-primary">{activeDragItem.name}</span>

                  </div>

                ) : null}

              </DragOverlay>

            </DndContext>

          </div>

  

          <div className="p-4 border-t-4 border-border-dark bg-surface">
           {selectionMode ? (
              <div className="flex gap-2">
                 <PixelButton className="w-full h-12 text-xs uppercase" variant="secondary" onClick={() => { setSelectionMode(false); setSelectedIds([]); }}>
                    Cancel ({selectedIds.length})
                 </PixelButton>
                 {selectedIds.length === 1 && (
                    <PixelButton className="w-full h-12 text-xs uppercase" onClick={handleRenameInit}>
                        RENAME
                    </PixelButton>
                 )}
                 <PixelButton className="w-full h-12 text-xs uppercase" onClick={handleMoveInit}>
                    MOVE
                 </PixelButton>
              </div>
           ) : (
             !movingItems && (
              <PixelButton 
                className="w-full h-12 text-xs uppercase gap-2"
                onClick={() => setIsNewFolderModalOpen(true)}
              >
                <span className="material-symbols-outlined text-base">create_new_folder</span>
                New Folder
              </PixelButton>
             )
           )}
           {movingItems && movingItems.source === 'sidebar' && (
              <div className="flex gap-2">
                   <PixelButton onClick={() => setMovingItems(null)} variant="secondary" className="flex-1">CANCEL</PixelButton>
                   <PixelButton onClick={handlePlaceItems} className="flex-1">PLACE HERE</PixelButton>
              </div>
           )}
        </div>
      </aside>

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
        isOpen={isRenameModalOpen} 
        onClose={() => setIsRenameModalOpen(false)}
        title="Rename Node"
      >
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          <PixelInput 
            value={newNodeName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New name..."
            autoFocus
          />
          <PixelButton type="submit" className="w-full h-12 text-xs">RENAME</PixelButton>
        </form>
      </PixelModal>

      <PixelModal 
        isOpen={deleteConfirm.isOpen} 
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        title="Confirm Delete"
      >
        <p className="mb-4 text-xs text-text-light">Delete "{deleteConfirm.name}"?</p>
        <div className="flex justify-end gap-2">
           <PixelButton variant="secondary" onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}>CANCEL</PixelButton>
           <PixelButton className="bg-danger" onClick={confirmDelete}>DELETE</PixelButton>
        </div>
      </PixelModal>
    </>
  );
};