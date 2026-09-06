import { ChapterManuscript } from '../../manga/ChapterManuscript';
import { gokuProjects } from './data/gokuProjects';

export function GokuPage() {
  return <ChapterManuscript character="goku" projects={gokuProjects} />;
}
