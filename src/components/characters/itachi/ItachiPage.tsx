import { ChapterManuscript } from '../../manga/ChapterManuscript';
import { itachiProjects } from './data/itachiProjects';

export function ItachiPage() {
  return <ChapterManuscript character="itachi" projects={itachiProjects} />;
}
