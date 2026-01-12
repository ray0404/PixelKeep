import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../stores/useTaskStore';
import { useFolderStore } from '../stores/useFolderStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { PixelInput } from '../components/ui/PixelInput';
import { PixelButton } from '../components/ui/PixelButton';
import { PixelCheckbox } from '../components/ui/PixelCheckbox';
import { PixelModal } from '../components/ui/PixelModal';

export const TaskEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addTask, updateTask } = useTaskStore();
  const task = useTaskStore(state => state.tasks.find(t => t.id === Number(id)));
  const { currentFolderId } = useFolderStore();
  const settings = useSettingsStore();

  const [showPrompt, setShowPrompt] = useState(!settings.hasSeenEncryptionPrompt);
  
  // Local state for form inputs ensures immediate responsiveness and prevents 
  // global store updates on every keystroke, which would cause expensive re-renders.
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [completionType, setCompletionType] = useState<'at' | 'before_by' | 'any_time'>('at');
  const [startTime, setStartTime] = useState('');
  const [location, setLocation] = useState('');
  const [people, setPeople] = useState('');
  const [notes, setNotes] = useState('');
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmTrigger, setAlarmTrigger] = useState(0);
  const [alarmRepeat, setAlarmRepeat] = useState(0);
  const [alarmAudio, setAlarmAudio] = useState<{ data: string; name: string } | undefined>(undefined);
  const [noSound, setNoSound] = useState(false);

  useEffect(() => {
    if (id && task) {
      setTitle(task.title);
      setTime(task.time ? new Date(task.time).toISOString().slice(0, 16) : '');
      setCompletionType(task.completionType || 'at');
      setStartTime(task.startTime ? new Date(task.startTime).toISOString().slice(0, 16) : '');
      setLocation(task.location);
      setPeople(task.people);
      setNotes(task.notes);
      setAlarmEnabled(task.alarm.enabled);
      setAlarmTrigger(task.alarm.trigger);
      setAlarmRepeat(task.alarm.repeat);
      setAlarmAudio(task.alarm.audio);
      setNoSound(task.alarm.noSound || false);
    }
  }, [id, task]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const taskData = { 
      title, 
      time: completionType === 'any_time' ? null : (time ? new Date(time).toISOString() : null), 
      completionType,
      startTime: completionType === 'before_by' && startTime ? new Date(startTime).toISOString() : null,
      location, 
      people, 
      notes,
      alarm: {
        enabled: alarmEnabled,
        trigger: alarmTrigger,
        repeat: alarmRepeat,
        audio: alarmAudio,
        noSound
      }
    };
    
    if (id) {
      await updateTask(Number(id), taskData);
    } else {
      await addTask(taskData, currentFolderId);
    }
    navigate('/tasks');
  };

  const handlePromptClose = (enableEncryption: boolean) => {
    settings.setSetting('hasSeenEncryptionPrompt', true);
    if (enableEncryption) {
      settings.setSetting('disableTaskEncryption', false);
    }
    setShowPrompt(false);
  };

  return (
    <>
    <form onSubmit={handleSave} className="p-4 space-y-4">
      {/* ... existing form content ... */}
      <label className="flex flex-col gap-2">
        <span className="text-xs uppercase text-primary font-bold">Quest</span>
        <PixelInput 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?" 
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase text-text-meta">Completion Type</span>
          <select 
            className="h-10 border-2 border-border-light bg-[#f0fdf4] text-black text-[10px] px-2"
            value={completionType}
            onChange={(e) => setCompletionType(e.target.value as any)}
          >
            <option value="at">At Time (Standard)</option>
            <option value="before_by">Before/By Time</option>
            <option value="any_time">Any Time (No specific time)</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase text-text-meta">Due Time</span>
          <input 
            type="datetime-local"
            className="h-10 border-2 border-border-light bg-[#f0fdf4] text-black text-[10px] px-2"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
      </div>

      {completionType === 'before_by' && (
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase text-text-meta">Start Time</span>
          <input 
            type="datetime-local"
            className="h-10 border-2 border-border-light bg-[#f0fdf4] text-black text-[10px] px-2"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>
      )}

      <div className="border-2 border-border-light bg-surface p-3 shadow-pixel-btn">
        <label className="flex items-center gap-3 cursor-pointer mb-3">
          <PixelCheckbox 
            checked={alarmEnabled}
            onChange={(e) => setAlarmEnabled(e.target.checked)}
          />
          <span className="text-xs uppercase text-primary font-bold">Enable Alarm</span>
        </label>

        {alarmEnabled && (
          <div className="grid grid-cols-2 gap-4 pl-9">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-text-meta">Trigger</span>
              <select 
                className="h-8 border-2 border-border-light bg-[#f0fdf4] text-black text-[10px] px-1"
                value={alarmTrigger}
                onChange={(e) => setAlarmTrigger(parseInt(e.target.value))}
              >
                <option value="0">At Task Time</option>
                <option value="5">5 mins before</option>
                <option value="15">15 mins before</option>
                <option value="30">30 mins before</option>
                <option value="60">1 hour before</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-text-meta">Repeat</span>
              <select 
                className="h-8 border-2 border-border-light bg-[#f0fdf4] text-black text-[10px] px-1"
                value={alarmRepeat}
                onChange={(e) => setAlarmRepeat(parseInt(e.target.value))}
              >
                <option value="0">No Repeat</option>
                <option value="5">Every 5 mins</option>
                <option value="15">Every 15 mins</option>
                <option value="30">Every 30 mins</option>
              </select>
            </label>
            <div className="col-span-2 flex flex-col gap-2 pt-2">
              <span className="text-[10px] uppercase text-text-meta">Alarm Sound</span>
              <div className="flex items-center gap-2">
                <PixelButton type="button" variant="surface" className="flex-1 h-8 text-[8px]" onClick={() => document.getElementById('task-alarm-input')?.click()}>
                  {alarmAudio ? alarmAudio.name : 'UPLOAD UNIQUE SOUND'}
                </PixelButton>
                {alarmAudio && (
                  <button type="button" onClick={() => setAlarmAudio(undefined)} className="text-danger">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                )}
              </div>
              <input id="task-alarm-input" type="file" accept="audio/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const data = event.target?.result as string;
                  setAlarmAudio({ data, name: file.name });
                  setNoSound(false);
                };
                reader.readAsDataURL(file);
              }} />
              
              <label className="flex items-center gap-2 cursor-pointer">
                <PixelCheckbox checked={noSound} onChange={(e) => {
                  setNoSound(e.target.checked);
                  if (e.target.checked) setAlarmAudio(undefined);
                }} />
                <span className="text-[10px] uppercase text-text-meta">No Sound (Mute)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase text-text-meta">Location</span>
          <PixelInput 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-10 text-[10px]"
            placeholder="Where?" 
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase text-text-meta">People</span>
          <PixelInput 
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            className="h-10 text-[10px]"
            placeholder="Who?" 
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-xs uppercase text-primary font-bold">Notes</span>
        <textarea
          className="w-full border-2 border-border-light px-4 py-3 shadow-pixel-container-inset focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary bg-[#f0fdf4] text-black h-24 text-[0.6rem]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Extra details..."
        />
      </label>

      <div className="flex flex-col gap-4 pt-4">
        <PixelButton type="submit" className="h-14 w-full text-sm uppercase">Save Quest</PixelButton>
        <PixelButton type="button" variant="secondary" className="h-14 w-full text-sm uppercase" onClick={() => navigate('/tasks')}>
          Cancel
        </PixelButton>
      </div>
    </form>

    <PixelModal 
      isOpen={showPrompt} 
      onClose={() => handlePromptClose(false)}
      title="Quest Security"
    >
      <div className="space-y-4 text-center">
        <span className="material-symbols-outlined text-6xl text-primary">security</span>
        <h3 className="text-sm font-bold uppercase">Encryption Notice</h3>
        <p className="text-[10px] text-text-light/80 leading-relaxed">
          By default, Quests are stored in <span className="text-primary font-bold">High Performance Mode</span> (plaintext). 
          This ensures a fluid 8-bit experience on all devices.
        </p>
        <p className="text-[10px] text-text-light/80 leading-relaxed">
          You can enable <span className="text-secondary font-bold">Ancient Scroll Encryption</span> for Quests, 
          but you will likely experience significant sluggishness as your log grows.
        </p>
        <p className="text-[9px] text-text-meta italic">Note: Notes are always encrypted.</p>
        
        <div className="flex flex-col gap-3 pt-2">
          <PixelButton className="h-12 w-full text-[10px]" onClick={() => handlePromptClose(false)}>
            KEEP HIGH PERFORMANCE (RECOMMENDED)
          </PixelButton>
          <PixelButton variant="secondary" className="h-10 w-full text-[9px]" onClick={() => handlePromptClose(true)}>
            ENABLE ENCRYPTION (MAY BE SLOW)
          </PixelButton>
        </div>
      </div>
    </PixelModal>
    </>
  );
};
