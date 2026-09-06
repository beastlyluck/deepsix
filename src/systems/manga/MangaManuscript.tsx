import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { gsap } from 'gsap';

export type CharacterKey = 'itachi' | 'goku' | 'vegeta' | 'zoro' | 'optimus' | 'spiderman';

export interface MangaPanelData {
  id: string;
  type: 'cover' | 'splash' | 'wide' | 'tall' | 'square' | 'climax' | 'spread';
  content: ReactNode;
  character?: CharacterKey;
  backgroundEffect?: 'halftone' | 'speedlines' | 'gradient' | 'particles' | 'ink-wash';
  transition?: 'page-turn' | 'slash' | 'ki-blast' | 'genjutsu' | 'transform' | 'gravity' | 'web' | 'ink-splash';
  sfx?: string;
  sfxColor?: string;
  delay?: number;
}

export interface MangaSpreadData {
  id: string;
  title: string;
  kanji: string;
  character: CharacterKey;
  panels: MangaPanelData[];
  backgroundEffect?: MangaPanelData['backgroundEffect'];
  transition?: MangaPanelData['transition'];
}

export interface MangaManuscriptContextType {
  currentSpreadIndex: number;
  currentPanelIndex: number;
  readingDirection: 'rtl' | 'ltr';
  isTransitioning: boolean;
  spreads: MangaSpreadData[];
  registerSpread: (spread: MangaSpreadData) => void;
  unregisterSpread: (id: string) => void;
  goToSpread: (index: number) => void;
  goToPanel: (spreadIndex: number, panelIndex: number) => void;
  nextPanel: () => void;
  prevPanel: () => void;
  nextSpread: () => void;
  prevSpread: () => void;
  triggerTransition: (type: MangaPanelData['transition'], character?: CharacterKey) => Promise<void>;
}

const MangaManuscriptContext = createContext<MangaManuscriptContextType | null>(null);

export const useMangaManuscript = () => {
  const ctx = useContext(MangaManuscriptContext);
  if (!ctx) throw new Error('useMangaManuscript must be used within MangaManuscriptProvider');
  return ctx;
};

interface MangaManuscriptProviderProps {
  children: ReactNode;
  initialSpreads?: MangaSpreadData[];
}

export const MangaManuscriptProvider: React.FC<MangaManuscriptProviderProps> = ({
  children,
  initialSpreads = [],
}) => {
  const [spreads, setSpreads] = useState<MangaSpreadData[]>(initialSpreads);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [readingDirection] = useState<'rtl' | 'ltr'>('rtl');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionQueue = useRef<MangaPanelData['transition'][]>([]);

  const registerSpread = useCallback((spread: MangaSpreadData) => {
    setSpreads(prev => {
      if (prev.some(s => s.id === spread.id)) return prev;
      const newSpreads = [...prev, spread].sort((a, b) => 
        initialSpreads.findIndex(s => s.id === a.id) - initialSpreads.findIndex(s => s.id === b.id)
      );
      return newSpreads;
    });
  }, [initialSpreads]);

  const unregisterSpread = useCallback((id: string) => {
    setSpreads(prev => prev.filter(s => s.id !== id));
  }, []);

  const goToSpread = useCallback((index: number) => {
    if (index >= 0 && index < spreads.length) {
      setCurrentSpreadIndex(index);
      setCurrentPanelIndex(0);
    }
  }, [spreads.length]);

  const goToPanel = useCallback((spreadIndex: number, panelIndex: number) => {
    const spread = spreads[spreadIndex];
    if (spread && panelIndex >= 0 && panelIndex < spread.panels.length) {
      setCurrentSpreadIndex(spreadIndex);
      setCurrentPanelIndex(panelIndex);
    }
  }, [spreads]);

  const nextPanel = useCallback(async () => {
    if (currentSpreadIndex >= spreads.length) return;
    const spread = spreads[currentSpreadIndex];
    if (currentPanelIndex < spread.panels.length - 1) {
      setCurrentPanelIndex(prev => prev + 1);
    } else if (currentSpreadIndex < spreads.length - 1) {
      await triggerTransition(spread.transition || 'page-turn', spread.character);
      setCurrentSpreadIndex(prev => prev + 1);
      setCurrentPanelIndex(0);
    }
  }, [spreads, currentSpreadIndex, currentPanelIndex]);

  const prevPanel = useCallback(async () => {
    if (currentPanelIndex > 0) {
      setCurrentPanelIndex(prev => prev - 1);
    } else if (currentSpreadIndex > 0) {
      await triggerTransition('page-turn');
      setCurrentSpreadIndex(prev => prev - 1);
      const prevSpread = spreads[currentSpreadIndex - 1];
      if (prevSpread) setCurrentPanelIndex(prevSpread.panels.length - 1);
    }
  }, [spreads, currentSpreadIndex, currentPanelIndex]);

  const nextSpread = useCallback(async () => {
    if (currentSpreadIndex < spreads.length - 1) {
      const spread = spreads[currentSpreadIndex];
      await triggerTransition(spread.transition || 'page-turn', spread.character);
      setCurrentSpreadIndex(prev => prev + 1);
      setCurrentPanelIndex(0);
    }
  }, [spreads, currentSpreadIndex]);

  const prevSpread = useCallback(async () => {
    if (currentSpreadIndex > 0) {
      await triggerTransition('page-turn');
      setCurrentSpreadIndex(prev => prev - 1);
      setCurrentPanelIndex(0);
    }
  }, [spreads, currentSpreadIndex]);

  const triggerTransition = useCallback(async (type: MangaPanelData['transition'], character?: CharacterKey) => {
    setIsTransitioning(true);
    transitionQueue.current = [...transitionQueue.current, type];
    await new Promise(resolve => setTimeout(resolve, 800));
    transitionQueue.current = transitionQueue.current.slice(1);
    setIsTransitioning(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === 'ArrowRight') nextPanel();
      if (e.key === 'ArrowLeft') prevPanel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTransitioning, nextPanel, prevPanel, nextSpread, prevSpread]);

  return (
    <MangaManuscriptContext.Provider value={{
      currentSpreadIndex,
      currentPanelIndex,
      readingDirection,
      isTransitioning,
      spreads,
      registerSpread,
      unregisterSpread,
      goToSpread,
      goToPanel,
      nextPanel,
      prevPanel,
      nextSpread,
      prevSpread,
      triggerTransition,
    }}>
      {children}
    </MangaManuscriptContext.Provider>
  );
};