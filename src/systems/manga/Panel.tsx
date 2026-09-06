import React, { memo, useEffect, useRef } from 'react';
import { MangaPanel } from './mangaTypes';
import { useMangaReader } from './MangaReaderContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface PanelProps {
  panel: MangaPanel;
  index: number;
  isActive: boolean;
  onEnter: () => void;
}

export const Panel = memo(function Panel({ panel, index, isActive, onEnter }: PanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { readingDirection } = useMangaReader();

  useEffect(() => {
    if (!panelRef.current || !isActive) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(panelRef.current!, {
        opacity: 0,
        scale: 0.95,
        y: readingDirection === 'rtl' ? 50 : -50,
        rotationY: readingDirection === 'rtl' ? 15 : -15,
      }, {
        opacity: 1,
        scale: 1,
        y: 0,
        rotationY: 0,
        duration: 0.6,
        ease: 'power3.out',
        onStart: onEnter,
      });

      if (panel.animation === 'speedlines') {
        gsap.fromTo(panelRef.current!, {
          backgroundPositionX: '0%',
        }, {
          backgroundPositionX: '-200%',
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    }, panelRef);

    return () => ctx.revert();
  }, [isActive, readingDirection, panel.animation, onEnter]);

  const baseClasses = 'manga-panel relative overflow-hidden';
  const typeClasses = {
    splash: 'manga-panel--splash',
    wide: 'manga-panel--wide',
    tall: 'manga-panel--tall',
    square: 'manga-panel--square',
    climax: 'manga-panel--climax',
  };

return (
    <div
      ref={panelRef}
      className={`${baseClasses} ${typeClasses[panel.type]}`}
      data-panel-id={panel.id}
      data-panel-index={index}
    >
      <div className="absolute inset-0 p-6 flex flex-col">
        {panel.content}
      </div>
      {panel.character && (
        <div className="absolute bottom-3 right-3 text-xs font-kanji text-paper/30">
          {panel.character}
        </div>
      )}
    </div>
  );
});
