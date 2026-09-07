import type { CharacterKey } from './openDataSources';
import type { TwinFigureKey } from './twinFigures';

export type FigureId = CharacterKey | TwinFigureKey | 'krishna';

export interface FigureModelSpec {
  url: string | null;
  height: number;
  yaw?: number;
  clips?: string[];
  camera: { position: [number, number, number]; fov: number };
  lookAt: [number, number, number];
}

const FRAME = {
  camera: { position: [0.16, 0.86, 5.1] as [number, number, number], fov: 34 },
  lookAt: [0, 0.72, 0] as [number, number, number],
};

export const figureModels: Record<FigureId, FigureModelSpec> = {
  itachi: {
    url: '/models/new/itachi.glb',
    height: 1.52,
    clips: ['Scene'],
    camera: { position: [0.2, 0.92, 6.2], fov: 34 },
    lookAt: [0, 0.72, 0],
  },
  goku: {
    url: '/models/new/goku.glb',
    height: 1.55,
    clips: ['idle_CINEMA_4D_Main', 'ready_CINEMA_4D_Main', 'taunt_CINEMA_4D_Main', 'kick 1_CINEMA_4D_Main'],
    ...FRAME,
  },
  vegeta: {
    url: '/models/new/vegeta.glb',
    height: 1.48,
    clips: ['mixamo.com'],
    camera: { position: [0.14, 0.84, 5.3], fov: 34 },
    lookAt: [0, 0.7, 0],
  },
  zoro: {
    url: '/models/new/zoro.glb',
    height: 1.52,
    clips: ['pl_zoro_dres01_idle_a', 'pl_zoro_dres01_combo_a', 'pl_zoro_dres01_skill_a', 'pl_zoro_dres01_idlehome_a'],
    camera: { position: [0.12, 0.86, 5.0], fov: 34 },
    lookAt: [0, 0.72, 0],
  },
  optimus: {
    url: '/models/new/optimus.glb',
    height: 1.62,
    clips: ['Scene'],
    camera: { position: [0.22, 1.35, 9.4], fov: 36 },
    lookAt: [0, 0.78, 0],
  },
  spiderman: {
    url: '/models/new/spiderman.glb',
    height: 1.55,
    clips: ['Crawl', 'Swing to land'],
    camera: { position: [0.08, 0.88, 5.1], fov: 34 },
    lookAt: [0, 0.72, 0],
  },
  krishna: {
    url: '/models/krishna.glb',
    height: 1.5,
    camera: { position: [0.1, 0.9, 5.2], fov: 34 },
    lookAt: [0, 0.78, 0],
  },
  thor: {
    url: '/models/new/thor.glb',
    height: 1.72,
    clips: ['Idle_C', 'Like_Idle'],
    camera: { position: [0.22, 0.98, 6.4], fov: 34 },
    lookAt: [0, 0.82, 0],
  },
  batman: {
    url: '/models/new/batman.glb',
    height: 1.64,
    clips: ['Batman_Nav_Idle_v5', 'C004_S01_Emote_CharacterSelect_Loop'],
    camera: { position: [0.18, 0.92, 5.8], fov: 34 },
    lookAt: [0, 0.78, 0],
  },
  ironman: {
    url: '/models/new/ironman.glb',
    height: 1.56,
    clips: ['HighTower_Tomato_STG01_Male_Idle', 'HighTower_Tomato_STG01_Male_Idle.001'],
    camera: { position: [0.16, 0.88, 5.3], fov: 34 },
    lookAt: [0, 0.74, 0],
  },
  luffy: {
    url: '/models/new/luffy.glb',
    height: 1.78,
    clips: ['Armature|Butterfly Twirl', 'Armature|Corkscrew Evade', 'Armature|Walk'],
    camera: { position: [0.2, 1.02, 6.6], fov: 36 },
    lookAt: [0, 0.86, 0],
  },
  kratos: {
    url: '/models/new/kratos.glb',
    height: 1.68,
    clips: ['Motion'],
    camera: { position: [0.18, 0.94, 5.6], fov: 34 },
    lookAt: [0, 0.8, 0],
  },
  naruto: {
    url: '/models/new/naruto.glb',
    height: 1.52,
    clips: ['Jacket_3472_int_XRMR_idleshow_DT'],
    camera: { position: [0.14, 0.86, 5.2], fov: 34 },
    lookAt: [0, 0.72, 0],
  },
};

export const gokuForms = {
  base: '/models/new/goku.glb',
  ssj: '/models/new/goku.glb',
  ui: '/models/new/goku.glb',
} as const;
