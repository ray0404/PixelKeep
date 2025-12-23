import React, { useEffect, useState } from 'react';
import { useTaskStore } from '../stores/useTaskStore';
import { useFolderStore } from '../stores/useFolderStore';
import { TaskItem } from '../components/TaskItem';
import { PixelButton } from '../components/ui/PixelButton';
import { useNavigate } from 'react-router-dom';
import { PixelModal } from '../components/ui/PixelModal';
import { PixelInput } from '../components/ui/PixelInput';

export const QuestLog: React.FC = () => {
  const { tasks, fetchTasks, toggleTask, deleteTask } = useTaskStore();
  const { nodes, fetchNodes, currentFolderId, setCurrentFolderId, addFolder } = useFolderStore();
  const navigate = useNavigate();

  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchNodes();
  }, [fetchTasks, fetchNodes]);

  useEffect(() => {
    // Ensure we are in a tasks folder context when mounting QuestLog if we were in notes
    if (currentFolderId === 'root_notes') {
      setCurrentFolderId('root_tasks');
    }
  }, []);

  const folderNodes = React.useMemo(() => 
    nodes.filter(n => n.parentId === currentFolderId && n.type === 'folder'),
    [nodes, currentFolderId]
  );

  const taskNodes = React.useMemo(() => 
    nodes.filter(n => n.parentId === currentFolderId && n.type === 'task'),
    [nodes, currentFolderId]
  );

  const filteredTasks = React.useMemo(() => 
    tasks.filter(task => taskNodes.some(node => node.itemRefId === task.id)),
    [tasks, taskNodes]
  );

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await addFolder(newFolderName, currentFolderId, 'task');
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col gap-4">
        {/* Render folders in the list too */}
        {folderNodes.map(folder => (
          <div 
            key={folder.id}
            className="flex items-center gap-3 border-2 border-border-light bg-surface p-3 shadow-pixel-container cursor-pointer hover:bg-primary/5 transition-colors"
            onClick={() => setCurrentFolderId(folder.id)}
          >
            <span className="material-symbols-outlined text-4xl text-secondary">folder</span>
            <p className="text-sm font-bold text-primary truncate">{folder.name}</p>
          </div>
        ))}

        {filteredTasks.length === 0 && folderNodes.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border-light/50 bg-surface/50 p-6 text-center">
            <span className="material-symbols-outlined text-6xl text-primary/70">fact_check</span>
            <h3 className="text-sm font-bold text-text-light">Your quest log is empty.</h3>
            <p className="max-w-xs text-xs leading-relaxed text-text-light/70">Tap the '+' button to add a new task!</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              nodeId={`task-${task.id}`}
              onToggle={toggleTask}
              onEdit={(id) => navigate(`/tasks/edit/${id}`)}
              onDelete={deleteTask}
            />
          ))
        )}
      </div>

      <div className="fixed bottom-24 right-6 z-20 flex flex-col gap-4">
        <PixelButton 
          variant="secondary" 
          className="size-14 rounded-full shadow-[6px_6px_0px_0px_#1e1b4b]"
          onClick={() => setIsNewFolderModalOpen(true)}
        >
          <span className="material-symbols-outlined text-4xl">create_new_folder</span>
        </PixelButton>
        <PixelButton 
          className="size-14 rounded-full shadow-[6px_6px_0px_0px_#1e1b4b]" 
          onClick={() => navigate('/tasks/new')}
        >
          <span className="material-symbols-outlined text-4xl">add</span>
        </PixelButton>
      </div>

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
    </div>
  );
};
