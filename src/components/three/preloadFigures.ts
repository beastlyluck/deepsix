import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { figureModels, type FigureId } from '../../data/figureModels';

export function preloadFigure(id: FigureId) {
  const url = figureModels[id].url;
  if (url) useGLTF.preload(url, true, true);
}

/** Start the current figure immediately; warm the next one after the first request is in flight. */
export function useTwinModelPreload(current: FigureId, next?: FigureId) {
  useEffect(() => {
    preloadFigure(current);
    if (!next || next === current) return;
    const t = window.setTimeout(() => preloadFigure(next), 1600);
    return () => window.clearTimeout(t);
  }, [current, next]);
}
