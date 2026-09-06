export interface MangaPanel {
  id: string;
  type: 'splash' | 'wide' | 'tall' | 'square' | 'climax';
  content: React.ReactNode;
  character?: CharacterKey;
  animation?: 'fade' | 'slide' | 'zoom' | 'speedlines';
  delay?: number;
}

export type CharacterKey = 'zoro' | 'goku' | 'itachi' | 'optimus' | 'vegeta' | 'spiderman';

export interface MangaSpread {
  id: string;
  title: string;
  kanji: string;
  character?: CharacterKey;
  panels: MangaPanel[];
  backgroundEffect?: 'halftone' | 'speedlines' | 'gradient' | 'particles';
  transition?: 'page-turn' | 'slash' | 'ki-blast' | 'genjutsu' | 'transform' | 'gravity' | 'web';
}

export const characterOrder: CharacterKey[] = ['itachi', 'goku', 'vegeta', 'zoro', 'optimus', 'spiderman'];

export const characterMetadata: Record<CharacterKey, {
  name: string;
  kanji: string;
  title: string;
  subtitle: string;
  color: string;
  glowColor: string;
  particleColor: string;
  sfx: string;
  transition: MangaSpread['transition'];
}> = {
  zoro: {
    name: 'Zoro',
    kanji: '三刀流',
    title: 'Three Blades, One Path',
    subtitle: 'Computer Vision • Precision • Santoryu',
    color: '#2E7D32',
    glowColor: '#4CAF50',
    particleColor: '#81C784',
    sfx: 'SLASH',
    transition: 'slash',
  },
  goku: {
    name: 'Goku',
    kanji: '超賽亞人',
    title: 'The Saiyan Singularity',
    subtitle: 'Deep Learning • Ki • Ultra Instinct',
    color: '#FFB300',
    glowColor: '#FFD700',
    particleColor: '#FFF176',
    sfx: 'KACHOW',
    transition: 'ki-blast',
  },
  itachi: {
    name: 'Itachi',
    kanji: '写輪眼',
    title: 'The Illusionist\'s Truth',
    subtitle: 'Generative AI • Sharingan • Genjutsu',
    color: '#B71C1C',
    glowColor: '#F44336',
    particleColor: '#EF9A9A',
    sfx: 'WHOOSH',
    transition: 'genjutsu',
  },
  optimus: {
    name: 'Optimus Prime',
    kanji: '變形',
    title: 'Freedom is Right of All',
    subtitle: 'MLOps • Transformation • Leadership',
    color: '#C62828',
    glowColor: '#EF5350',
    particleColor: '#E57373',
    sfx: 'TRANSFORM',
    transition: 'transform',
  },
  vegeta: {
    name: 'Vegeta',
    kanji: '自在極意',
    title: 'Pride Before the Fall',
    subtitle: 'Reinforcement Learning • Gravity • Ultra Ego',
    color: '#1565C0',
    glowColor: '#2196F3',
    particleColor: '#64B5F6',
    sfx: 'BOOM',
    transition: 'gravity',
  },
  spiderman: {
    name: 'Spider-Man',
    kanji: '絆',
    title: 'With Great Power',
    subtitle: 'Graph ML • Web • Spidey-Sense',
    color: '#EF6C00',
    glowColor: '#FF9800',
    particleColor: '#FFB74D',
    sfx: 'THWIP',
    transition: 'web',
  },
};
