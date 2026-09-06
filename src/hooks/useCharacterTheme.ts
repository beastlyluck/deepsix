import { useState, useEffect, useCallback } from 'react';
import { CharacterKey, characterMetadata } from '../systems/manga/mangaTypes';

interface CharacterTheme {
  character: CharacterKey;
  color: string;
  glowColor: string;
  particleColor: string;
  sfx: string;
  transition: string;
  kanji: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  progress: number; // 0-1 for form progression
}

export function useCharacterTheme(initialCharacter: CharacterKey = 'zoro') {
  const [currentCharacter, setCurrentCharacter] = useState<CharacterKey>(initialCharacter);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const theme = characterMetadata[currentCharacter];

  const activateCharacter = useCallback((character: CharacterKey) => {
    if (character === currentCharacter) return;
    setIsTransitioning(true);
    setProgress(0);
    setCurrentCharacter(character);
    setTimeout(() => setIsTransitioning(false), 800);
  }, [currentCharacter]);

  const updateProgress = useCallback((value: number) => {
    setProgress(Math.max(0, Math.min(1, value)));
  }, []);

  return {
    currentCharacter,
    theme: { ...theme, isActive: !isTransitioning, progress },
    activateCharacter,
    updateProgress,
    isTransitioning,
    allCharacters: Object.keys(characterMetadata) as CharacterKey[],
  };
}

export function useCharacterForm(character: CharacterKey) {
  const [formLevel, setFormLevel] = useState(0);
  const [formProgress, setFormProgress] = useState(0);

  const forms = {
    goku: ['Base', 'SSJ', 'SSJ2', 'SSJ3', 'SSJ God', 'SSJ Blue', 'SSJB KKx10', 'UI Sign', 'Master UI'],
    vegeta: ['Base', 'SSJ', 'SSJ2', 'SSJ God', 'SSJ Blue', 'SSJB Evolution', 'Ultra Ego'],
    itachi: ['1 Tomoe', '2 Tomoe', '3 Tomoe', 'Mangekyou', 'EMS', 'Tsukuyomi', 'Amaterasu', 'Susanoo'],
    zoro: ['1 Sword', '2 Swords', '3 Swords (Santoryu)', 'Asura (9 Swords)'],
    optimus: ['Truck', 'Partial Transform', 'Robot Mode', 'Powered Up'],
    spiderman: ['Civilian', 'Web Shooter', 'Web Swing', 'Spider-Sense', 'Iron Spider', 'Symbiote'],
  };

  const characterForms = forms[character] || ['Base'];
  const currentForm = characterForms[formLevel] || 'Base';

  const advanceForm = useCallback(() => {
    setFormLevel(prev => Math.min(prev + 1, characterForms.length - 1));
  }, [characterForms.length]);

  const setForm = useCallback((level: number) => {
    setFormLevel(Math.max(0, Math.min(level, characterForms.length - 1)));
  }, [characterForms.length]);

  return {
    formLevel,
    formProgress,
    currentForm,
    allForms: characterForms,
    advanceForm,
    setForm,
    setFormProgress,
  };
}
