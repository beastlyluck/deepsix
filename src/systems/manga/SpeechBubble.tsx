import React, { memo } from 'react';

interface SpeechBubbleProps {
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'speech' | 'thought' | 'narration';
  className?: string;
}

export const SpeechBubble = memo(function SpeechBubble({ children, position = 'bottom', variant = 'speech', className = '' }: SpeechBubbleProps) {
  const tailClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45',
    bottom: 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45',
    left: 'right-full top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45',
    right: 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-45',
  };

  const variantStyles = {
    speech: 'bg-paper/10 border-paper/20',
    thought: 'bg-paper/5 border-paper/10 rounded-full',
    narration: 'bg-ink-lighter border-paper/30 font-ui text-sm',
  };

  return (
    <div className={`relative ${variantStyles[variant]} border-2 rounded-2xl px-4 py-2 backdrop-blur-md ${className}`}>
      <div className="font-body text-sm leading-relaxed">{children}</div>
      {variant !== 'narration' && (
        <div
          className={`absolute w-3 h-3 ${tailClasses[position]} bg-inherit border-inherit border-t-2 border-r-2`}
          aria-hidden="true"
        />
      )}
    </div>
  );
});
