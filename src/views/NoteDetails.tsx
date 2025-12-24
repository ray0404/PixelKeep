import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '../stores/useNoteStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranscriptionStore } from '../stores/useTranscriptionStore';
import { PixelButton } from '../components/ui/PixelButton';
import { PixelModal } from '../components/ui/PixelModal';
import { DecipherModal } from '../components/DecipherModal';
import { Note } from '../db/db';
import { htmlToPlainText } from '../utils/ui';

export const NoteDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notes, setSearchQuery, getAsset } = useNoteStore();
  const settings = useSettingsStore();
  const { reset: resetTranscription, transcribe, lastResult, isTranscribing } = useTranscriptionStore();
  const [note, setNote] = useState<Note | null>(null);
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string | null>(null);
  const [resolvedAudioBlob, setResolvedAudioBlob] = useState<Blob | null>(null);

  const [isDecipherModalOpen, setIsDecipherModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  useEffect(() => {
    const found = notes.find(n => n.id === Number(id));
    if (found) {
      setNote(found);
      if (found.audio) {
          if (found.audio.startsWith('asset:')) {
              getAsset(found.audio.replace('asset:', '')).then(blob => {
                  if (blob) {
                    setResolvedAudioUrl(URL.createObjectURL(blob));
                    setResolvedAudioBlob(blob);
                  }
              });
          } else {
              setResolvedAudioUrl(found.audio);
              // Note: For non-asset audio, we can't transcribe.
              // This could be improved by fetching the URL and creating a blob.
          }
      }
    }

    return () => {
        if (resolvedAudioUrl && resolvedAudioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(resolvedAudioUrl);
        }
    };
  }, [id, notes, getAsset]);

  useEffect(() => {
    if (lastResult && !isTranscribing && note) {
        const decipheredText = `\n\n--- DECIPHERED ECHO ---\n${lastResult}`;
        if (!note.content.includes('DECIPHERED ECHO')) {
            useNoteStore.getState().updateNote(note.id, {
                content: note.content + decipheredText
            });
        }
    }
  }, [lastResult, isTranscribing, note]);

  if (!note) return <div className="p-4 text-center">Note not found.</div>;

  const handleCopy = async () => {
    const content = htmlToPlainText(note.content);
    const plainText = settings.includeTitleInCopy ? `${note.title}\n\n${content}` : content; 
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

  const handleDecipherClick = () => {
    const hasPermission = localStorage.getItem('whisper_model_permission') === 'true';
    if (!hasPermission) {
      setIsPermissionModalOpen(true);
    } else {
      startDeciphering();
    }
  };

  const startDeciphering = () => {
    if (resolvedAudioBlob) {
        resetTranscription();
        setIsDecipherModalOpen(true);
        transcribe(resolvedAudioBlob);
    }
  };

  const grantPermission = () => {
    localStorage.setItem('whisper_model_permission', 'true');
    setIsPermissionModalOpen(false);
    startDeciphering();
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

      {resolvedAudioUrl && (
        <div className="space-y-4">
          <div 
            className="flex flex-col gap-2 border-2 border-border-light bg-surface p-2 shadow-pixel-btn"
            data-testid="note-audio-player"
          >
            <span className="text-[10px] text-text-meta uppercase">Echo Stone Recording</span>
            <audio src={resolvedAudioUrl} controls className="w-full h-10" />
          </div>
          
         {resolvedAudioBlob && <PixelButton 
            variant="primary" 
            className="w-full h-12 text-xs gap-2"
            onClick={handleDecipherClick}
          >
            <span className="material-symbols-outlined">auto_fix_high</span>
            DECIPHER ECHO
          </PixelButton>}
        </div>
      )}

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

      <PixelModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        title="Invoke the Oracle"
      >
        <div className="space-y-4 text-center">
          <span className="material-symbols-outlined text-6xl text-secondary">
            history_edu
          </span>
          <p className="text-xs leading-relaxed">
            To decipher this Echo, we must invoke the AI Oracle. This requires a one-time download of approximately <span className="text-secondary font-bold">40MB</span>.
          </p>
          <p className="text-[10px] text-text-meta italic">
            The Oracle will reside locally in your browser, ensuring your voice never leaves this device.
          </p>
          <div className="pt-4 flex flex-col gap-3">
            <PixelButton onClick={grantPermission} className="w-full h-12 text-xs">
              I ACCEPT THE RITUAL
            </PixelButton>
            <PixelButton variant="secondary" onClick={() => setIsPermissionModalOpen(false)} className="w-full h-12 text-xs">
              NOT NOW
            </PixelButton>
          </div>
        </div>
      </PixelModal>

      <DecipherModal 
        isOpen={isDecipherModalOpen} 
        onClose={() => setIsDecipherModalOpen(false)} 
      />
    </div>
  );
};
