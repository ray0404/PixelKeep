import React, { useEffect, useState } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useFolderStore } from '../stores/useFolderStore';
import { cn } from '../utils/ui';
import { useNavigate, useLocation } from 'react-router-dom';
import { PixelButton } from './ui/PixelButton';
import { PixelModal } from './ui/PixelModal';
import { PixelInput } from './ui/PixelInput';
import { useSettingsStore } from '../stores/useSettingsStore';

export const Sidebar: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { nodes, fetchNodes, addFolder, currentFolderId, setCurrentFolderId, deleteNode } = useFolderStore();
  const { dualDirectory } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

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

  const renderScaffolding = (parentId: string, depth: number = 0) => {
    let children = nodes.filter(n => n.parentId === parentId);
    
    // Filter based on dualDirectory setting
    if (!dualDirectory) {
      // Actually, we can just check if we are in tasks view or notes view and what the root is.
      if (isTasksView || parentId === 'root_tasks') {
        children = children.filter(n => n.type === 'task' || n.type === 'folder');
      } else {
        children = children.filter(n => n.type === 'note' || n.type === 'folder');
      }
    }
    
    return (
      <div className={cn("space-y-1", depth > 0 && "ml-4 border-l-2 border-border-light/20 pl-2")}>
        {children.map(node => (
          <div key={node.id}>
            <div 
              className={cn(
                "group flex items-center justify-between p-1 hover:bg-primary/10 cursor-pointer rounded",
                currentFolderId === node.id && "bg-primary/20"
              )}
            >
              <div 
                className="flex items-center gap-2 flex-1 min-w-0" 
                onClick={() => {
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
                }}
              >
                <span className="material-symbols-outlined text-sm">
                  {node.type === 'folder' ? 'folder' : node.type === 'note' ? 'description' : 'task_alt'}
                </span>
                <span className="text-[10px] font-bold truncate">{node.name}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete ${node.name}?`)) deleteNode(node.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-danger hover:text-primary transition-opacity"
              >
                <span className="material-symbols-outlined text-xs">delete</span>
              </button>
            </div>
            {node.type === 'folder' && renderScaffolding(node.id, depth + 1)}
          </div>
        ))}
      </div>
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
        </div>

        <div className="p-4 border-t-4 border-border-dark bg-surface">
          <PixelButton 
            className="w-full h-12 text-xs uppercase gap-2"
            onClick={() => setIsNewFolderModalOpen(true)}
          >
            <span className="material-symbols-outlined text-base">create_new_folder</span>
            New Folder
          </PixelButton>
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
    </>
  );
};