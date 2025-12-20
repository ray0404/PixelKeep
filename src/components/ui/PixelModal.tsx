import React from 'react';
import { cn } from '../../utils/ui';

interface PixelModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const PixelModal: React.FC<PixelModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/80 backdrop-blur-sm p-4">
      <div className={cn(
        "flex flex-col items-center gap-4 rounded border-2 border-border-light bg-surface p-8 shadow-pixel-container max-w-md w-full",
        className
      )}>
        <div className="flex w-full justify-between items-center border-b-2 border-border-light pb-2 mb-2">
          <h3 className="text-sm font-bold uppercase text-primary text-shadow-pixel">{title}</h3>
          <button onClick={onClose} className="text-secondary hover:text-primary">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="w-full text-text-light">
          {children}
        </div>
      </div>
    </div>
  );
};
