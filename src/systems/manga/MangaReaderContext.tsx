import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MangaSpread, CharacterKey, characterOrder, characterMetadata } from './mangaTypes';

interface MangaReaderContextType {
  currentSpreadIndex: number;
  currentPanelIndex: number;
  readingDirection: 'rtl' | 'ltr';
  isTransitioning: boolean;
  setSpread: (index: number) => void;
  setPanel: (index: number) => void;
  nextPanel: () => void;
  prevPanel: () => void;
  nextSpread: () => void;
  prevSpread: () => void;
  triggerTransition: (type: MangaSpread['transition']) => Promise<void>;
  registerSpread: (spread: MangaSpread) => void;
  unregisterSpread: (spreadId: string) => void;
  getSpreads: () => MangaSpread[];
}

const MangaReaderContext = createContext<MangaReaderContextType | null>(null);

interface SpreadRegistry {
  [key: string]: MangaSpread;
}

export const MangaReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [spreads, setSpreads] = useState<SpreadRegistry>({});
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [readingDirection] = useState<'rtl' | 'ltr'>('rtl');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionQueue, setTransitionQueue] = useState<MangaSpread['transition'][]>([]);

  const registerSpread = useCallback((spread: MangaSpread) => {
    setSpreads(prev => ({ ...prev, [spread.id]: spread }));
  }, []);

  const unregisterSpread = useCallback((spreadId: string) => {
    setSpreads(prev => {
      const next = { ...prev };
      delete next[spreadId];
      return next;
    });
  }, []);

  const getSpreads = useCallback(() => {
    return Object.values(spreads).sort((a, b) => characterOrder.indexOf(a.character || 'zoro') - characterOrder.indexOf(b.character || 'zoro'));
  }, [spreads]);

  const setSpread = useCallback((index: number) => {
    const spreadList = getSpreads();
    if (index >= 0 && index < spreadList.length) {
      setCurrentSpreadIndex(index);
      setCurrentPanelIndex(0);
    }
  }, [getSpreads]);

  const setPanel = useCallback((index: number) => {
    const spreadList = getSpreads();
    const currentSpread = spreadList[currentSpreadIndex];
    if (currentSpread && index >= 0 && index < currentSpread.panels.length) {
      setCurrentPanelIndex(index);
    }
  }, [getSpreads, currentSpreadIndex]);

  const nextPanel = useCallback(() => {
    const spreadList = getSpreads();
    const currentSpread = spreadList[currentSpreadIndex];
    if (currentSpread && currentPanelIndex < currentSpread.panels.length - 1) {
      setCurrentPanelIndex(prev => prev + 1);
    } else if (currentSpreadIndex < spreadList.length - 1) {
      triggerTransition(currentSpread.transition || 'page-turn').then(() => {
        setCurrentSpreadIndex(prev => prev + 1);
        setCurrentPanelIndex(0);
      });
    }
  }, [getSpreads, currentSpreadIndex, currentPanelIndex]);

  const prevPanel = useCallback(() => {
    if (currentPanelIndex > 0) {
      setCurrentPanelIndex(prev => prev - 1);
    } else if (currentSpreadIndex > 0) {
      triggerTransition('page-turn').then(() => {
        setCurrentSpreadIndex(prev => prev - 1);
        const spreadList = getSpreads();
        const prevSpread = spreadList[currentSpreadIndex - 1];
        if (prevSpread) setCurrentPanelIndex(prevSpread.panels.length - 1);
      });
    }
  }, [getSpreads, currentSpreadIndex, currentPanelIndex]);

  const nextSpread = useCallback(() => {
    const spreadList = getSpreads();
    if (currentSpreadIndex < spreadList.length - 1) {
      triggerTransition(spreadList[currentSpreadIndex].transition || 'page-turn').then(() => {
        setCurrentSpreadIndex(prev => prev + 1);
        setCurrentPanelIndex(0);
      });
    }
  }, [getSpreads, currentSpreadIndex]);

  const prevSpread = useCallback(() => {
    if (currentSpreadIndex > 0) {
      triggerTransition('page-turn').then(() => {
        setCurrentSpreadIndex(prev => prev - 1);
        setCurrentPanelIndex(0);
      });
    }
  }, [getSpreads, currentSpreadIndex]);

  const triggerTransition = useCallback(async (type: MangaSpread['transition']) => {
    setIsTransitioning(true);
    setTransitionQueue(prev => [...prev, type]);
    await new Promise(resolve => setTimeout(resolve, 800));
    setTransitionQueue(prev => prev.slice(1));
    setIsTransitioning(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      if (e.key === 'ArrowRight' || e.key === ' ') nextPanel();
      if (e.key === 'ArrowLeft') prevPanel();
      if (e.key === 'ArrowDown') nextSpread();
      if (e.key === 'ArrowUp') prevSpread();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTransitioning, nextPanel, prevPanel, nextSpread, prevSpread]);

  return (
    <MangaReaderContext.Provider value={{
      currentSpreadIndex,
      currentPanelIndex,
      readingDirection,
      isTransitioning,
      setSpread,
      setPanel,
      nextPanel,
      prevPanel,
      nextSpread,
      prevSpread,
      triggerTransition,
      registerSpread,
      unregisterSpread,
      getSpreads,
    }}>
      {children}
    </MangaReaderContext.Provider>
  );
};

export const useMangaReader = () => {
  const context = useContext(MangaReaderContext);
  if (!context) throw new Error('useMangaReader must be used within MangaReaderProvider');
  return context;
};

export const useCharacterMeta = (character: CharacterKey) => characterMetadata[character];
