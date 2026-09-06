import React, { memo } from 'react';

export const Halftone = memo(function Halftone({ opacity = 0.03, size = 20, color = '#FFFFFF' }: { opacity?: number; size?: number; color?: string }) {
  const pattern = `url("data:image/svg+xml,%3Csvg viewBox='0 0 ${size} ${size}' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='${size/2}' cy='${size/2}' r='${size/6}' fill='${color.replace('#', '%23')}'/%3E%3C/svg%3E")`;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: pattern,
        backgroundSize: `${size}px ${size}px`,
        opacity,
        animation: 'halftonePulse 4s ease-in-out infinite',
      }}
      aria-hidden="true"
    />
  );
});
