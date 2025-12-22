import React from 'react';
import { cn } from '../../utils/ui';

interface PixelProgressBarProps {
    progress: number; // 0 to 100
    label?: string;
    className?: string;
    color?: 'primary' | 'secondary' | 'danger';
}

export const PixelProgressBar: React.FC<PixelProgressBarProps> = ({ 
    progress, 
    label, 
    className,
    color = 'primary'
}) => {
    const colorClasses = {
        primary: 'bg-primary shadow-[0_4px_0_0_#166534]',
        secondary: 'bg-secondary shadow-[0_4px_0_0_#581c87]',
        danger: 'bg-danger shadow-[0_4px_0_0_#991b1b]'
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">{label}</span>
                    <span className="text-[10px] font-bold text-text-light">{Math.round(Math.max(0, Math.min(100, progress)))}%</span>
                </div>
            )}
            <div className="h-6 w-full bg-surface border-4 border-border-dark relative p-1 overflow-hidden">
                <div 
                    data-testid="progress-bar-fill"
                    className={cn(
                        "h-full transition-all duration-300 ease-out",
                        colorClasses[color]
                    )}
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                >
                    {/* Pixel shine effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
                </div>
            </div>
        </div>
    );
};
