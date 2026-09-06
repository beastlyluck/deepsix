import { digitalTwins, type DigitalTwin } from './digitalTwins';

export type TwinFigureKey = 'thor' | 'batman' | 'ironman' | 'luffy' | 'kratos' | 'naruto';

export interface TwinFigureMeta {
  name: string;
  kanji: string;
  title: string;
  subtitle: string;
  color: string;
  glowColor: string;
  particleColor: string;
  sfx: string;
  twinId: string;
  path: string;
}

export const twinFigureOrder: TwinFigureKey[] = ['thor', 'batman', 'ironman', 'luffy', 'kratos', 'naruto'];

export const twinFigureMetadata: Record<TwinFigureKey, TwinFigureMeta> = {
  thor: {
    name: 'Thor',
    kanji: '雷',
    title: 'The Storm That Measures',
    subtitle: 'AeroTwin · sky · 400 Hz',
    color: '#3d9dff',
    glowColor: '#7ec4ff',
    particleColor: '#b8dcff',
    sfx: 'THUNDER',
    twinId: 'aerotwin',
    path: '/thor',
  },
  batman: {
    name: 'Batman',
    kanji: '闇',
    title: 'The Night Watch',
    subtitle: 'GridPulse · city · cascade',
    color: '#f0c14b',
    glowColor: '#ffe082',
    particleColor: '#3dff8a',
    sfx: 'ZZZT',
    twinId: 'gridpulse',
    path: '/batman',
  },
  ironman: {
    name: 'Iron Man',
    kanji: '甲',
    title: 'The Suit That Breathes',
    subtitle: 'BioSync · body · on-device',
    color: '#1aa6b8',
    glowColor: '#4dd0e1',
    particleColor: '#ffcc80',
    sfx: 'PULSE',
    twinId: 'biosync',
    path: '/ironman',
  },
  luffy: {
    name: 'Luffy',
    kanji: '海',
    title: 'King of the Assignment',
    subtitle: 'OceanicOS · port · crew',
    color: '#ff7a1a',
    glowColor: '#ffb074',
    particleColor: '#ffe0c2',
    sfx: 'HORN',
    twinId: 'oceanicos',
    path: '/luffy',
  },
  kratos: {
    name: 'Kratos',
    kanji: '戦',
    title: 'Rage That Will Not Reset',
    subtitle: 'ForgeX · cell · HOLD',
    color: '#ff6a1a',
    glowColor: '#ff8a4c',
    particleColor: '#ffcc80',
    sfx: 'CLANG',
    twinId: 'forgex',
    path: '/kratos',
  },
  naruto: {
    name: 'Naruto',
    kanji: '忍',
    title: 'The Village as a Farm',
    subtitle: 'TerraTwin · earth · closed loop',
    color: '#3dba6e',
    glowColor: '#81c784',
    particleColor: '#c8e6c9',
    sfx: 'DRIP',
    twinId: 'terratwin',
    path: '/naruto',
  },
};

export function isTwinFigure(id: string): id is TwinFigureKey {
  return id in twinFigureMetadata;
}

export function twinByFigure(figure: TwinFigureKey): DigitalTwin {
  const twin = digitalTwins.find((t) => t.figure === figure);
  if (!twin) throw new Error(`No twin mapped to ${figure}`);
  return twin;
}

export function figureMetaFor(id: string) {
  if (isTwinFigure(id)) return twinFigureMetadata[id];
  return undefined;
}
