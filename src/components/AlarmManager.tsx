import React, { useEffect, useState, useRef } from 'react';
import { useTaskStore } from '../stores/useTaskStore';
import { PixelModal } from './ui/PixelModal';
import { PixelButton } from './ui/PixelButton';
import { Task } from '../db/db';
import { useSettingsStore } from '../stores/useSettingsStore';

export const AlarmManager: React.FC = () => {
  const { tasks } = useTaskStore();
  const { defaultAlarmSound } = useSettingsStore();
  const [activeAlarm, setActiveAlarm] = useState<Task | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Only scan tasks that actually have alarms enabled to reduce processing
    const activeTasksWithAlarms = tasks.filter(t => !t.completed && t.alarm.enabled && t.time);
    
    if (activeTasksWithAlarms.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      
      activeTasksWithAlarms.forEach(task => {
        const dueTime = new Date(task.time!).getTime();
        const triggerOffset = (task.alarm.trigger || 0) * 60000;
        const alarmTime = dueTime - triggerOffset;

        // Check if now is within a 1-minute window of the alarm time
        // and ensure we don't trigger if it's already active
        if (now >= alarmTime && now < alarmTime + 60000) {
          triggerAlarm(task);
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [tasks]);

  const triggerAlarm = (task: Task) => {
    if (activeAlarm?.id === task.id) return;
    
    setActiveAlarm(task);
    
    if (!task.alarm.noSound) {
      const soundData = task.alarm.audio?.data || defaultAlarmSound?.data;
      if (soundData) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(soundData);
        audioRef.current.loop = true;
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
    }

    if (Notification.permission === 'granted') {
      const notificationTitle = `Quest Due: ${task.title}`;
      const notificationOptions = {
        body: task.notes || 'Time to complete your quest!',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `task-alarm-${task.id}`,
        renotify: true
      };

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(notificationTitle, notificationOptions);
        });
      } else {
        new Notification(notificationTitle, notificationOptions);
      }
    }
  };

  const handleDismiss = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setActiveAlarm(null);
  };

  const handleSnooze = async () => {
    // Basic snooze: just stop sound and hide modal for now
    handleDismiss();
  };

  return (
    <PixelModal 
      isOpen={!!activeAlarm} 
      onClose={handleDismiss}
      title="ALARM!"
      className="border-danger shadow-[8px_8px_0px_0px_#ef4444] animate-pulse-fast"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-6xl text-danger">notifications_active</span>
        <h2 className="text-lg font-bold uppercase">{activeAlarm?.title}</h2>
        <p className="text-xs text-text-meta">The time for your quest has arrived!</p>
        
        <div className="flex gap-4 w-full mt-4">
          <PixelButton variant="secondary" className="flex-1 h-12" onClick={handleSnooze}>SNOOZE</PixelButton>
          <PixelButton variant="danger" className="flex-1 h-12" onClick={handleDismiss}>DISMISS</PixelButton>
        </div>
      </div>
    </PixelModal>
  );
};
