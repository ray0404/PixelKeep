import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { PixelButton } from '../components/ui/PixelButton';
import { PixelInput } from '../components/ui/PixelInput';

export const Unlock: React.FC = () => {
  const [password, setPassword] = useState('');
  const { unlock } = useAuthStore();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await unlock(password);
      if (!success) {
        alert('Wrong password.');
      }
    } catch (err: any) {
      console.error('Unlock error:', err);
      alert(`The Ritual Failed: ${err.message}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background-dark">
      <form 
        onSubmit={handleUnlock}
        className="flex flex-col items-center gap-4 rounded border-2 border-border-light bg-surface p-8 shadow-pixel-container max-w-sm w-full"
      >
        <span className="material-symbols-outlined text-6xl text-primary">shield_lock</span>
        <h1 className="text-lg font-bold uppercase text-primary text-shadow-pixel">Pixel Keep</h1>
        <p className="text-xs text-text-meta text-center">Enter your password to unlock.</p>
        <PixelInput 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="text-center" 
          placeholder="Your secret key..." 
          required
        />
        <PixelButton type="submit" className="h-14 w-full text-sm uppercase">
          Unlock
        </PixelButton>
      </form>
    </div>
  );
};
