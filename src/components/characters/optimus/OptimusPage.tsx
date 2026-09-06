import { ChapterManuscript } from '../../manga/ChapterManuscript';
import { optimusProjects } from './data/optimusProjects';

export function OptimusPage() {
  return <ChapterManuscript character="optimus" projects={optimusProjects} />;
}
