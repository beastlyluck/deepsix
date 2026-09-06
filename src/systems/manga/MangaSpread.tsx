import React, { memo, useEffect, useRef, useState } from 'react';
import type { MangaSpread } from './mangaTypes';
import { Panel } from './Panel';
import { useMangaReader } from './MangaReaderContext';
import { gsap } from 'gsap';

interface SpreadProps {
  spread: MangaSpread;
  isCurrent: boolean;
  onPanelEnter: (panelId: string) => void;
}

export const MangaSpreadComponent = memo(function MangaSpreadComponent({ spread, isCurrent, onPanelEnter }: SpreadProps) {
  const spreadRef = useRef<HTMLDivElement>(null);
  const [visiblePanels, setVisiblePanels] = useState<Set<number>>(new Set());
  const { readingDirection, currentSpreadIndex, currentPanelIndex, registerSpread, unregisterSpread } = useMangaReader();

  useEffect(() => {
    registerSpread(spread);
    return () => unregisterSpread(spread.id);
  }, [spread.id, registerSpread, unregisterSpread]);

  useEffect(() => {
    if (!spreadRef.current || !isCurrent) return;

    const ctx = gsap.context(() => {
      const panels = spreadRef.current!.querySelectorAll('[data-panel-id]');
      panels.forEach((panel, i) => {
        gsap.fromTo(panel, {
          opacity: 0,
          scale: 0.95,
          y: readingDirection === 'rtl' ? 50 : -50,
          rotationY: readingDirection === 'rtl' ? 15 : -15,
        }, {
          opacity: 1,
          scale: 1,
          y: 0,
          rotationY: 0,
          duration: 0.5,
          delay: i * 0.08,
          ease: 'power3.out',
          onStart: () => {
            setVisiblePanels(prev => new Set([...prev, i]));
            onPanelEnter(panel.getAttribute('data-panel-id') || '');
          },
        });
      });

      if (spread.backgroundEffect === 'halftone') {
        gsap.to(spreadRef.current!, {
          '--halftone-opacity': 0.08,
          duration: 2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }
    }, spreadRef);

    return () => ctx.revert();
  }, [isCurrent, readingDirection, spread.backgroundEffect, onPanelEnter]);

  const gridCols = readingDirection === 'rtl' ? 'grid-flow-col-dense' : 'grid-flow-col';

  return (
    <div
      ref={spreadRef}
      className={`manga-spread grid gap-4 md:gap-6 ${gridCols} relative`}
      style={{
        '--halftone-opacity': 0.03,
        gridTemplateColumns: 'repeat(2, 1fr)',
      } as React.CSSProperties}
      data-spread-id={spread.id}
      aria-hidden={!isCurrent}
    >
      <div className="col-span-2 px-6 py-4 border-b-2 border-ink-lighter flex items-center justify-between">
        <div>
          <p className="font-display text-2xl md:text-3xl text-gold tracking-wider">{spread.title}</p>
          <p className="font-kanji text-xl text-paper/50 mt-1">{spread.kanji}</p>
        </div>
        <div className="text-right font-ui text-xs text-paper/40">
          <kbd className="px-2 py-1 bg-ink-lighter rounded mr-1">←</kbd>
          <kbd className="px-2 py-1 bg-ink-lighter rounded mr-1">→</kbd>
          <kbd className="px-2 py-1 bg-ink-lighter rounded">Navigate</kbd>
        </div>
      </div>

      {spread.panels.map((panel, i) => (
        <Panel
          key={panel.id}
          panel={{ ...panel, character: spread.character }}
          index={i}
          isActive={isCurrent && visiblePanels.has(i)}
          onEnter={() => onPanelEnter(panel.id)}
        />
      ))}

      {spread.backgroundEffect === 'speedlines' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-speed-lines" />
        </div>
      )}
    </div>
  );
});

export { MangaSpreadComponent as MangaSpread };