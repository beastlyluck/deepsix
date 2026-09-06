import { Navigate, useLocation } from 'react-router-dom';
import { isTwinFigure, twinByFigure } from '../data/twinFigures';
import { storyByTwin } from '../data/twinStories';
import { TwinManuscript } from '../components/manga/TwinManuscript';

export function TwinFigurePage() {
  const figure = useLocation().pathname.replace(/^\//, '');
  if (!isTwinFigure(figure)) return <Navigate to="/twins" replace />;
  const twin = twinByFigure(figure);
  const story = storyByTwin(twin.id);
  if (!story) return <Navigate to="/twins" replace />;
  return <TwinManuscript twin={twin} story={story} />;
}
