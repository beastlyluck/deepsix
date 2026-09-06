import type { CharacterKey } from '../../data/openDataSources';
import { FigureScene } from './FigureScene';

export function ChapterScene({ character }: { character: CharacterKey }) {
  return <FigureScene id={character} />;
}
