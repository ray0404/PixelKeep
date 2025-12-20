import React, { useEffect, useState } from 'react';
import { useNoteStore } from '../stores/useNoteStore';
import { useFolderStore } from '../stores/useFolderStore';
import { NoteItem } from '../components/NoteItem';
import { PixelInput } from '../components/ui/PixelInput';
import { PixelButton } from '../components/ui/PixelButton';
import { useNavigate } from 'react-router-dom';
import { PixelModal } from '../components/ui/PixelModal';

export const NotesList: React.FC = () => {
  const { notes, searchQuery, setSearchQuery, fetchNotes, deleteNote } = useNoteStore();
  const { nodes, fetchNodes, currentFolderId, setCurrentFolderId, addFolder, deleteNode } = useFolderStore();
  const navigate = useNavigate();

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

  const filteredNotes = notes
    .filter(note => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) {
        return noteNodes.some(node => node.itemRefId === note.id);
      }

      const tagMatch = note.tags.some(t => t.toLowerCase().includes(query));
      const titleMatch = note.title.toLowerCase().includes(query);
      const contentMatch = note.content.toLowerCase().includes(query);

      return tagMatch || titleMatch || contentMatch;
    })
    .sort((a, b) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return 0;

      const score = (note: typeof a) => {
        if (note.tags.some(t => t.toLowerCase().includes(query))) return 3;
        if (note.title.toLowerCase().includes(query)) return 2;
        if (note.content.toLowerCase().includes(query)) return 1;
        return 0;
      };

      return score(b) - score(a);
    });

  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await addFolder(newFolderName, currentFolderId, 'note');
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
  };

  return (
    <div className="p-4 space-y-4">
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
        {/* Render folders in the list too - only when NOT searching */}
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
          filteredNotes.map(note => (
            <NoteItem 
              key={note.id} 
              note={note} 
              nodeId={`note-${note.id}`}
              onView={(id) => navigate(`/notes/view/${id}`)}
              onEdit={(id) => navigate(`/notes/edit/${id}`)}
              onDelete={deleteNote}
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
          onClick={() => navigate('/notes/new')}
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
