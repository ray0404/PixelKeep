import React, { useRef } from 'react';
import { Note } from '../db/db';
import { PixelButton } from './ui/PixelButton';
import { PixelCheckbox } from './ui/PixelCheckbox';
import { useNoteStore } from '../stores/useNoteStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranscriptionStore } from '../stores/useTranscriptionStore';
import { htmlToPlainText } from '../utils/ui';

interface NoteItemProps {
  note: Note;
  nodeId: string;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number, nodeId: string) => void;
  selected?: boolean;
  selectionMode?: boolean;
  onToggleSelect?: (id: number) => void;
  onLongPress?: (id: number) => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({
  note, nodeId, onView, onEdit, onDelete,
  selected = false, selectionMode = false, onToggleSelect, onLongPress
}) => {
  const { setSearchQuery } = useNoteStore();
  const settings = useSettingsStore();
  const { isTranscribing, activeNoteId } = useTranscriptionStore();
  const isProcessing = isTranscribing && activeNoteId === note.id;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const content = htmlToPlainText(note.content);
    const plainText = settings.includeTitleInCopy ? `${note.title}\n\n${content}` : content;
    navigator.clipboard.writeText(plainText).then(() => {
      // Optional: Toast or alert
      alert('Copied to clipboard');
    }).catch(err => console.error('Copy failed', err));
  };
  const handleStart = () => {
    timerRef.current = setTimeout(() => {
      if (onLongPress) onLongPress(note.id);
    }, 500); // 500ms long press
  };

  const handleEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div 
      className={`flex flex-col gap-3 border-2 border-border-light bg-surface p-3 shadow-pixel-container ${selected ? 'bg-primary/10 border-primary' : ''}`}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 w-full">
          {(selectionMode || selected) && (
            <div onClick={(e) => { e.stopPropagation(); onToggleSelect && onToggleSelect(note.id); }}>
              <PixelCheckbox checked={selected} onChange={() => {}} />
            </div>
          )}
          <div className="flex flex-col justify-center min-w-0 w-full cursor-pointer" onClick={() => selectionMode && onToggleSelect ? onToggleSelect(note.id) : onView(note.id)}>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold leading-tight text-primary truncate">{note.title || 'Untitled'}</p>
              {isProcessing && <span className="material-symbols-outlined text-secondary text-sm animate-spin">refresh</span>}
              {!isProcessing && note.audio && <span className="material-symbols-outlined text-warning text-sm">mic</span>}
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
        <PixelButton variant="surface" onClick={(e) => { e.stopPropagation(); onEdit(note.id); }}>
          <span className="material-symbols-outlined">edit</span>
        </PixelButton>
        <PixelButton variant="surface" onClick={handleCopy}>
          <span className="material-symbols-outlined">content_copy</span>
        </PixelButton>
        <PixelButton variant="surface" className="bg-danger" onClick={(e) => { e.stopPropagation(); onDelete(note.id, nodeId); }}>
          <span className="material-symbols-outlined">delete</span>
        </PixelButton>
      </div>
    </div>
  );
};
