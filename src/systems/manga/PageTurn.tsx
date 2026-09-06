import React, { memo, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface PageTurnProps {
  isActive: boolean;
  direction: 'forward' | 'backward';
  onComplete: () => void;
  children: React.ReactNode;
}

export const PageTurn = memo(function PageTurn({ isActive, direction, onComplete, children }: PageTurnProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !pageRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete });
      tl.set(pageRef.current!, { transformOrigin: direction === 'forward' ? 'right center' : 'left center' })
        .to(pageRef.current!, {
          rotationY: direction === 'forward' ? -90 : 90,
          duration: 0.6,
          ease: 'power3.inOut',
        })
        .set(wrapperRef.current!, { opacity: 0 })
        .set(pageRef.current!, { rotationY: direction === 'forward' ? 90 : -90 })
        .to(wrapperRef.current!, { opacity: 1, duration: 0.01 })
        .to(pageRef.current!, {
          rotationY: 0,
          duration: 0.6,
          ease: 'power3.inOut',
        });
    }, pageRef);

    return () => ctx.revert();
  }, [isActive, direction, onComplete]);

  if (!isActive) return <>{children}</>;

  return (
    <div ref={wrapperRef} className="relative w-full h-full perspective-1000 preserve-3d">
      <div ref={pageRef} className="w-full h-full absolute top-0 left-0 preserve-3d backface-hidden">
        {children}
      </div>
    </div>
  );
});
