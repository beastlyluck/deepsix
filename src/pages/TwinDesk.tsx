import { Navigate, useParams } from 'react-router-dom';
import { twinById } from '../data/digitalTwins';
import { storyByTwin } from '../data/twinStories';
import { TwinManuscript } from '../components/manga/TwinManuscript';

export function TwinDesk() {
  const { id } = useParams<{ id: string }>();
  const twin = id ? twinById(id) : undefined;
  const story = id ? storyByTwin(id) : undefined;
  if (!twin || !story) return <Navigate to="/twins" replace />;
  return <TwinManuscript twin={twin} story={story} />;
}
