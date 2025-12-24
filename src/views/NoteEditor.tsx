import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '../stores/useNoteStore';
import { useFolderStore } from '../stores/useFolderStore';
import { PixelInput } from '../components/ui/PixelInput';
import { PixelButton } from '../components/ui/PixelButton';
import { PixelModal } from '../components/ui/PixelModal';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTranscriptionStore } from '../stores/useTranscriptionStore';
import { cn } from '../utils/ui';

export const NoteEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notes, addNote, updateNote, saveAsset } = useNoteStore();
  const { currentFolderId } = useFolderStore();
  
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  const { isRecording, audioUrl, audioBlob, startRecording, stopRecording, clearAudio, setAudioUrl, setAudioBlob } = useAudioRecorder();
  const transcription = useTranscriptionStore();

  useEffect(() => {
    if (id) {
      const note = notes.find(n => n.id === Number(id));
      if (note) {
        setTitle(note.title);
        setTags(note.tags.join(', '));
        if (note.audio) {
            if (note.audio.startsWith('asset:')) {
                useNoteStore.getState().getAsset(note.audio.replace('asset:', '')).then(blob => {
                    if (blob) {
                        setAudioUrl(URL.createObjectURL(blob));
                        setAudioBlob(blob);
                    }
                });
            } else {
                setAudioUrl(note.audio);
            }
        }
        if (editorRef.current) editorRef.current.innerHTML = note.content;
      }
    }
    
    // Reset transcription store when component unmounts
    return () => {
      transcription.reset();
    }
  }, [id, notes, setAudioUrl, setAudioBlob, transcription.reset]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const htmlContent = editorRef.current?.innerHTML || '';
    
    let finalAudioUrl = audioUrl;
    if (audioBlob && !audioUrl?.startsWith('asset:')) {
        const assetId = `audio-${Date.now()}`;
        await saveAsset(assetId, audioBlob);
        finalAudioUrl = `asset:${assetId}`;
    }

    if (id) {
      await updateNote(Number(id), { 
        title, 
        content: htmlContent, 
        tags: tagList,
        audio: finalAudioUrl || undefined
      });
    } else {
      await addNote(title, htmlContent, tagList, currentFolderId, finalAudioUrl || undefined);
    }
    navigate('/notes');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    insertImageAtCursor(url);
    setIsImageModalOpen(false);
  };

  const insertImageAtCursor = (url: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, `<img src="${url}" class="pixel-note-image w-full my-4 shadow-pixel-container border-4 border-border-dark cursor-move" style="position: relative;">`);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setAudioBlob(file);
    setIsAudioModalOpen(false);
  };
  
  const handleTranscribe = () => {
    if (audioBlob) {
      transcription.transcribe(audioBlob);
    }
  }

  const insertTranscription = () => {
    if (editorRef.current && transcription.lastResult) {
        editorRef.current.focus();
        // Insert a paragraph with a horizontal rule for separation
        const htmlToInsert = `<hr class="my-4 border-border-light"><p>${transcription.lastResult}</p>`;
        document.execCommand('insertHTML', false, htmlToInsert);
    }
  }

  // Image handling state
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.classList.contains('pixel-note-image')) {
        setSelectedImage(target as HTMLImageElement);
      } else {
        setSelectedImage(null);
      }
    };

    editor.addEventListener('click', handleClick);
    return () => editor.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="relative">
      <form onSubmit={handleSave} className="p-4 space-y-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase text-primary">Title</span>
          <PixelInput 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter Title..." 
            required
          />
        </label>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <PixelButton type="button" variant="surface" className="flex-1 min-w-[60px]" onClick={() => setIsImageModalOpen(true)}>
            <span className="material-symbols-outlined">image</span>
          </PixelButton>
          <PixelButton 
            type="button" 
            variant="surface" 
            className={cn("flex-1 min-w-[60px]", isRecording && "bg-danger animate-pulse-fast border-danger")}
            onClick={() => {
              if (isRecording) stopRecording();
              else setIsAudioModalOpen(true);
            }}
          >
            <span className="material-symbols-outlined">{isRecording ? 'stop_circle' : 'mic'}</span>
          </PixelButton>
        </div>

        {audioUrl && (
          <div className="flex flex-col gap-2 border-2 border-border-light bg-surface p-2 shadow-pixel-btn">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-text-meta uppercase">Audio Recording</span>
              <button type="button" onClick={clearAudio} className="text-danger text-[10px] uppercase hover:underline">Remove</button>
            </div>
            <audio src={audioUrl} controls className="w-full h-10" />
            
            {/* --- TRANSCRIPTION UI --- */}
            <div className="pt-2">
              <PixelButton type="button" className="w-full h-8 text-[10px]" onClick={handleTranscribe} disabled={transcription.isTranscribing || !audioBlob}>
                  {transcription.isTranscribing ? 'TRANSCRIBING...' : 'TRANSCRIBE AUDIO'}
              </PixelButton>
              
              {transcription.isDownloading && (
                 <div className="text-center text-[9px] text-text-meta pt-2">Downloading Model: {transcription.progress.toFixed(0)}%</div>
              )}

              {transcription.status && !transcription.isTranscribing && (
                  <div className="text-center text-[9px] text-text-meta pt-2">{transcription.status}</div>
              )}

              {transcription.error && (
                  <div className="text-center text-[9px] text-danger pt-2">Error: {transcription.error}</div>
              )}

              {transcription.lastResult && (
                  <div className="pt-2 space-y-2">
                      <p className="text-[10px] bg-background-dark p-2 border-2 border-border-dark italic">{transcription.lastResult}</p>
                      <PixelButton type="button" variant='secondary' className="w-full h-8 text-[10px]" onClick={insertTranscription}>
                          INSERT INTO NOTE
                      </PixelButton>
                  </div>
              )}
            </div>
            {/* --- END TRANSCRIPTION UI --- */}
          </div>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase text-primary">Content</span>
          <div 
            ref={editorRef}
            contentEditable
            className="pixel-textarea min-h-[40vh] overflow-y-auto outline-none relative"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase text-primary">Tags (comma separated)</span>
          <PixelInput 
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="gamedev, ideas, etc..." 
          />
        </label>

        <div className="flex flex-col gap-4 pt-4">
          <PixelButton type="submit" className="h-14 w-full text-sm uppercase">Save Scroll</PixelButton>
          <PixelButton type="button" variant="secondary" className="h-14 w-full text-sm uppercase" onClick={() => navigate('/notes')}>
            Cancel
          </PixelButton>
        </div>
      </form>

      {/* Image Prompt Modal */}
      <PixelModal 
        isOpen={isImageModalOpen} 
        onClose={() => setIsImageModalOpen(false)} 
        title="Add Image"
      >
        <div className="space-y-4">
          <PixelButton className="w-full h-12 text-xs gap-2" onClick={() => document.getElementById('camera-input')?.click()}>
            <span className="material-symbols-outlined">photo_camera</span>
            TAKE PICTURE
          </PixelButton>
          <PixelButton className="w-full h-12 text-xs gap-2" variant="secondary" onClick={() => document.getElementById('gallery-input')?.click()}>
            <span className="material-symbols-outlined">image</span>
            IMPORT FROM DEVICE
          </PixelButton>
          <input 
            id="camera-input" 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            onChange={handleImageUpload}
          />
          <input 
            id="gallery-input" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageUpload}
          />
        </div>
      </PixelModal>

      {/* Audio Prompt Modal */}
      <PixelModal 
        isOpen={isAudioModalOpen} 
        onClose={() => setIsAudioModalOpen(false)} 
        title="Add Audio"
      >
        <div className="space-y-4">
          <PixelButton 
            className={cn("w-full h-12 text-xs gap-2", isRecording && "bg-danger")} 
            onClick={() => {
              if (isRecording) stopRecording();
              else startRecording();
              setIsAudioModalOpen(false);
            }}
          >
            <span className="material-symbols-outlined">{isRecording ? 'stop_circle' : 'mic'}</span>
            {isRecording ? 'STOP RECORDING' : 'RECORD FROM MIC'}
          </PixelButton>
          <PixelButton className="w-full h-12 text-xs gap-2" variant="secondary" onClick={() => document.getElementById('audio-upload-input')?.click()}>
            <span className="material-symbols-outlined">upload_file</span>
            IMPORT AUDIO FILE
          </PixelButton>
          <input 
            id="audio-upload-input" 
            type="file" 
            accept="audio/*" 
            className="hidden" 
            onChange={handleAudioUpload}
          />
        </div>
      </PixelModal>

      {/* Image Handles (Only visible when an image is selected) */}
      {selectedImage && (
        <ImageHandles 
          image={selectedImage} 
          onDeselect={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};

interface ImageHandlesProps {
  image: HTMLImageElement;
  onDeselect: () => void;
}

const ImageHandles: React.FC<ImageHandlesProps> = ({ image, onDeselect }) => {
  const [rect, setRect] = useState(image.getBoundingClientRect());
  const [parentRect, setParentRect] = useState(image.parentElement?.getBoundingClientRect());

  useEffect(() => {
    const updateRects = () => {
      setRect(image.getBoundingClientRect());
      setParentRect(image.parentElement?.getBoundingClientRect());
    };
    
    updateRects();
    window.addEventListener('resize', updateRects);
    image.parentElement?.addEventListener('scroll', updateRects);
    
    return () => {
      window.removeEventListener('resize', updateRects);
      image.parentElement?.removeEventListener('scroll', updateRects);
    };
  }, [image]);

  if (!parentRect) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    pointerEvents: 'none',
    border: '2px solid var(--color-primary)',
    zIndex: 10,
  };

  const handleResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startWidth = rect.width;

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const newWidth = startWidth + (currentX - startX);
      image.style.width = `${Math.max(50, newWidth)}px`;
      setRect(image.getBoundingClientRect());
    };

    const onEnd = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onEnd);
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Get current offset from style or default to 0
    const currentLeft = parseInt(image.style.left) || 0;
    const currentTop = parseInt(image.style.top) || 0;

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;
      
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      image.style.left = `${currentLeft + deltaX}px`;
      image.style.top = `${currentTop + deltaY}px`;
      setRect(image.getBoundingClientRect());
    };

    const onEnd = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onEnd);
  };

  return (
    <div style={style}>
      <div 
        className="absolute bottom-0 right-0 w-6 h-6 bg-primary border-2 border-border-dark cursor-se-resize flex items-center justify-center pointer-events-auto shadow-pixel-btn z-20"
        onMouseDown={handleResize}
        onTouchStart={handleResize}
      >
        <span className="material-symbols-outlined text-xs text-background-dark">open_in_full</span>
      </div>
      <div 
        className="absolute top-0 left-0 w-6 h-6 bg-primary border-2 border-border-dark cursor-move flex items-center justify-center pointer-events-auto shadow-pixel-btn z-20"
        onMouseDown={handleDrag}
        onTouchStart={handleDrag}
      >
        <span className="material-symbols-outlined text-xs text-background-dark">drag_pan</span>
      </div>
      <div 
        className="absolute top-0 right-0 w-6 h-6 bg-secondary border-2 border-border-dark cursor-pointer flex items-center justify-center pointer-events-auto shadow-pixel-btn z-20"
        onClick={(e) => { e.stopPropagation(); onDeselect(); }}
      >
        <span className="material-symbols-outlined text-xs text-text-light">close</span>
      </div>
    </div>
  );
};