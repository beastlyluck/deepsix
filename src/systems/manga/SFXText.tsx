import React, { memo, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface SFXTextProps {
  text: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  position?: { x: number; y: number };
  trigger?: 'mount' | 'click' | 'scroll';
  className?: string;
}

export const SFXText = memo(function SFXText({ text, color = '#FFD700', size = 'lg', position, trigger = 'mount', className = '' }: SFXTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger === 'mount') setShow(true);
    else if (trigger === 'scroll') {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setShow(true);
      }, { threshold: 0.1 });
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [trigger]);

  useEffect(() => {
    if (!show || !ref.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current!, {
        scale: 0.3,
        opacity: 0,
        rotation: -10,
      }, {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.4,
        ease: 'back.out(1.7)',
      });

      gsap.to(ref.current!, {
        textShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
        duration: 0.2,
        yoyo: true,
        repeat: 3,
      });
    }, ref);

    return () => ctx.revert();
  }, [show, color]);

  const sizeClasses = {
    sm: 'text-xl md:text-2xl',
    md: 'text-2xl md:text-4xl',
    lg: 'text-3xl md:text-5xl lg:text-6xl',
    xl: 'text-4xl md:text-6xl lg:text-7xl',
  };

  return (
    <div
      ref={ref}
      className={`sfx-text font-display uppercase tracking-wider select-none ${sizeClasses[size]} ${className}`}
      style={{
        color,
        textShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
        position: position ? 'absolute' : 'static',
        left: position?.x ? `${position.x}px` : undefined,
        top: position?.y ? `${position.y}px` : undefined,
        transform: position ? 'translate(-50%, -50%)' : undefined,
      }}
      aria-hidden="true"
    >
      {text}
    </div>
  );
});
