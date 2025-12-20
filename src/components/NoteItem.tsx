import React from 'react';
import { Note } from '../db/db';
import { PixelButton } from './ui/PixelButton';
import { PixelCheckbox } from './ui/PixelCheckbox';
import { useNoteStore } from '../stores/useNoteStore';

interface NoteItemProps {
  note: Note;
  nodeId: string;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number, nodeId: string) => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({ note, nodeId, onView, onEdit, onDelete }) => {
  const { setSearchQuery } = useNoteStore();

  return (
    <div className="flex flex-col gap-3 border-2 border-border-light bg-surface p-3 shadow-pixel-container">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 w-full">
          <PixelCheckbox />
          <div className="flex flex-col justify-center min-w-0 w-full cursor-pointer" onClick={() => onView(note.id)}>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold leading-tight text-primary truncate">{note.title || 'Untitled'}</p>
              {note.audio && <span className="material-symbols-outlined text-warning text-sm">mic</span>}
            </div>
            <p className="mt-2 text-[10px] font-normal leading-snug text-text-light/80 break-words line-clamp-2">
              {note.content.replace(/<[^>]*>?/gm, ' ')}
            </p>
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {note.tags.map(tag => (
                  <span 
                    key={tag} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery(tag);
                    }}
                    className="text-[8px] bg-primary/20 text-primary px-1 border border-primary/30 hover:bg-primary/40 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t-2 border-dashed border-border-light pt-2">
        <PixelButton variant="surface" onClick={() => onEdit(note.id)}>
          <span className="material-symbols-outlined">edit</span>
        </PixelButton>
        <PixelButton variant="surface" className="bg-danger" onClick={() => onDelete(note.id, nodeId)}>
          <span className="material-symbols-outlined">delete</span>
        </PixelButton>
      </div>
    </div>
  );
};
