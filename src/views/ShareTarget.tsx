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

  const [title, setTitle] = useState('');
  const [fileContent, setFileContent] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 1. Check for stored share data from a previous redirect
    const storedData = sessionStorage.getItem('pending_share_data');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setTitle(parsed.title || '');
        setFileContent(parsed.fileContent || '');
        // We don't clear it yet, in case they refresh or something, 
        // but we'll clear it after successful save.
      } catch (e) {
        console.error("Failed to parse stored share data:", e);
      }
    } else {
      // 2. Fallback to URL params if no stored data
      const urlTitle = searchParams.get('title') || '';
      const urlText = searchParams.get('text') || '';
      const urlUrl = searchParams.get('url') || '';
      if (urlTitle) setTitle(urlTitle);
      if (urlText || urlUrl) setFileContent(`${urlText}${urlText && urlUrl ? '\n\n' : ''}${urlUrl}`);
    }

    // 3. Handle File Launch (PWA File Handler)
    if ('launchQueue' in window) {
      (window as any).launchQueue.setConsumer(async (launchParams: any) => {
        if (!launchParams.files.length) return;
        
        const fileHandle = launchParams.files[0];
        const file = await fileHandle.getFile();
        setTitle(file.name);
        
        if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json')) {
          const content = await file.text();
          setFileContent(content);
        } else {
          setFileContent(`[Binary File: ${file.type}]`);
        }
      });
    }
  }, [searchParams]);

  const combinedNotes = fileContent;

  const handleSave = async () => {
    if (!disableTaskEncryption && !isAuthenticated) {
      // If encryption is ON, they MUST unlock first.
      // Store data in sessionStorage instead of URL to avoid length limits
      sessionStorage.setItem('pending_share_data', JSON.stringify({
        title,
        fileContent
      }));
      navigate(`/unlock?redirect=/share-target`);
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
      
      // Success! Clear the pending data
      sessionStorage.removeItem('pending_share_data');
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
