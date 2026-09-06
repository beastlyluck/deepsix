import { ChapterManuscript } from '../../manga/ChapterManuscript';
import { spidermanProjects } from './data/spidermanProjects';

export function SpiderManPage() {
  return <ChapterManuscript character="spiderman" projects={spidermanProjects} />;
}
