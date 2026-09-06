import { characterOrder } from '../systems/manga/mangaTypes';
import { isTwinFigure } from './twinFigures';

export const VOL1_START = '/itachi';
export const VOL1_END = '/spiderman';
export const VOL2_START = '/thor';
export const VOL2_INDEX = '/twins';

export function volumeOf(path: string): 0 | 1 | 2 {
  const key = path.replace(/^\//, '').split('/')[0];
  if (path.startsWith('/twins') || isTwinFigure(key)) return 2;
  if (characterOrder.includes(key as (typeof characterOrder)[number])) return 1;
  return 0;
}
