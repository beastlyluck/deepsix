import { ChapterManuscript } from '../../manga/ChapterManuscript';
import { vegetaProjects } from './data/vegetaProjects';

export function VegetaPage() {
  return <ChapterManuscript character="vegeta" projects={vegetaProjects} />;
}
