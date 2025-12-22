import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '../stores/useNoteStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { PixelButton } from '../components/ui/PixelButton';
import { Note } from '../db/db';
import { htmlToPlainText } from '../utils/ui';

export const NoteDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notes, setSearchQuery } = useNoteStore();
  const settings = useSettingsStore();
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    const found = notes.find(n => n.id === Number(id));
    if (found) {
      setNote(found);
    }
  }, [id, notes]);

  if (!note) return <div className="p-4 text-center">Note not found.</div>;

  const handleCopy = async () => {
    // Preserve formatting: whitespace and new-lines
    const plainText = `${note.title}\n\n${htmlToPlainText(note.content)}`; 
    try {
      await navigator.clipboard.writeText(plainText);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    navigate('/notes');
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <p className="pb-4 pt-1 text-xs font-normal leading-normal text-text-meta">
          Last edited: {new Date(note.updatedAt).toLocaleString()}
        </p>
        <div className="flex items-center justify-between">
          <h2 className="mb-4 text-lg font-bold text-primary">{note.title}</h2>
          <div className="flex gap-2">
             <PixelButton variant="surface" onClick={() => navigate(`/notes/edit/${note.id}`)}>
              <span className="material-symbols-outlined">edit</span>
            </PixelButton>
            <PixelButton variant="surface" onClick={handleCopy}>
              <span className="material-symbols-outlined">content_copy</span>
            </PixelButton>
          </div>
        </div>
      </div>

      <div 
        className="note-content-display mb-6 text-xs font-normal leading-relaxed whitespace-pre-wrap break-words"
        style={{ color: settings.terminalTextColor || settings.textColor }}
        dangerouslySetInnerHTML={{ __html: note.content }}
      />

      <div className="flex flex-wrap gap-2">
        {note.tags.map(tag => (
          <span 
            key={tag} 
            onClick={() => handleTagClick(tag)}
            className="border-2 border-border-light bg-surface px-3 py-1 text-[10px] font-medium text-primary shadow-pixel-btn cursor-pointer hover:bg-primary/10 transition-colors"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="pt-4">
        <PixelButton variant="secondary" className="h-14 w-full text-sm uppercase" onClick={() => navigate('/notes')}>
          Back to Scroll Case
        </PixelButton>
      </div>
    </div>
  );
};
