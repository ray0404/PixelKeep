import React from 'react';
import { cn } from '../../utils/ui';

interface PixelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const PixelInput: React.FC<PixelInputProps> = ({ className, ...props }) => {
  return (
    <input
      className={cn(
        'h-14 w-full resize-none border-2 border-border-light px-4 shadow-pixel-container-inset focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary bg-[#f0fdf4] text-black',
        className
      )}
      {...props}
    />
  );
};
