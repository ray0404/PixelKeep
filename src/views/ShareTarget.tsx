import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../stores/useTaskStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { PixelButton } from '../components/ui/PixelButton';
import { PixelInput } from '../components/ui/PixelInput';

export const ShareTarget: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addTask } = useTaskStore();
  const { isAuthenticated } = useAuthStore();
  const { disableTaskEncryption } = useSettingsStore();

  const [title, setTitle] = useState(searchParams.get('title') || '');
  const [fileContent, setFileContent] = useState<string>('');
  const text = searchParams.get('text') || '';
  const url = searchParams.get('url') || '';
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if ('launchQueue' in window) {
      (window as any).launchQueue.setConsumer(async (launchParams: any) => {
        if (!launchParams.files.length) return;
        
        const fileHandle = launchParams.files[0];
        const file = await fileHandle.getFile();
        setTitle(file.name);
        
        // For text-based files, read the content
        if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json')) {
          const content = await file.text();
          setFileContent(content);
        } else {
          setFileContent(`[Binary File: ${file.type}]`);
        }
      });
    }
  }, []);

  const combinedNotes = `${text}${text && url ? '\n\n' : ''}${url}${ (text || url) && fileContent ? '\n\n--- FILE CONTENT ---\n' : '' }${fileContent}`;

  const handleSave = async () => {
    if (!disableTaskEncryption && !isAuthenticated) {
      // If encryption is ON, they MUST unlock first.
      // Redirect to unlock but pass share data
      const params = new URLSearchParams();
      if (title) params.set('title', title);
      if (text) params.set('text', text);
      if (url) params.set('url', url);
      navigate(`/unlock?redirect=/share-target&${params.toString()}`);
      return;
    }

    setSaving(true);
    try {
      await addTask({
        title: title || 'Shared Quest',
        notes: combinedNotes,
        completed: false,
        alarm: { enabled: false, trigger: 0, repeat: 0 },
      }, 'root_tasks');
      
      // Navigate to tasks after saving
      navigate('/tasks');
    } catch (e) {
      console.error("Failed to save shared task:", e);
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-center space-y-2">
        <span className="material-symbols-outlined text-6xl text-primary animate-bounce">download_for_offline</span>
        <h2 className="text-lg font-bold uppercase text-primary">Incoming Quest</h2>
        <p className="text-[10px] text-text-meta">Content received from another realm.</p>
      </div>

      <div className="space-y-4 border-2 border-border-light bg-surface p-4 shadow-pixel-container">
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase text-text-light font-bold">Quest Title</span>
          <PixelInput 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Name your shared quest..."
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase text-text-light font-bold">Notes / Links</span>
          <textarea
            className="w-full border-2 border-border-light px-4 py-3 shadow-pixel-container-inset focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary bg-[#f0fdf4] text-black h-32 text-[0.6rem]"
            value={combinedNotes}
            readOnly
          />
        </label>
      </div>

      {!isAuthenticated && !disableTaskEncryption && (
        <div className="border-2 border-danger/50 bg-danger/10 p-3 text-center">
          <p className="text-[9px] text-danger italic">
            Ancient Scroll Encryption is active. 
            You must provide your password to secure this data.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <PixelButton 
          className="h-14 w-full" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'SAVING...' : (!isAuthenticated && !disableTaskEncryption ? 'UNLOCK & SAVE' : 'ACCEPT QUEST')}
        </PixelButton>
        <PixelButton 
          variant="secondary" 
          className="h-10 w-full text-[10px]"
          onClick={() => navigate('/')}
        >
          DISCARD
        </PixelButton>
      </div>
    </div>
  );
};
