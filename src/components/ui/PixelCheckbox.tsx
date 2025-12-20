import React from 'react';
import { cn } from '../../utils/ui';

interface PixelCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const PixelCheckbox: React.FC<PixelCheckboxProps> = ({ className, ...props }) => {
  return (
    <input
      type="checkbox"
      className={cn(
        'shrink-0 appearance-none size-6 border-2 border-border-light bg-surface shadow-pixel-btn checked:bg-primary checked:shadow-pixel-btn-hover cursor-pointer',
        className
      )}
      {...props}
    />
  );
};
