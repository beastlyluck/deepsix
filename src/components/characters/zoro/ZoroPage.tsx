import { ChapterManuscript } from '../../manga/ChapterManuscript';
import { zoroProjects } from './data/zoroProjects';

export function ZoroPage() {
  return <ChapterManuscript character="zoro" projects={zoroProjects} />;
}
