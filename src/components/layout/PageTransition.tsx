import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { characterMetadata, type CharacterKey } from '../../systems/manga/mangaTypes';
import { isTwinFigure, twinFigureMetadata } from '../../data/twinFigures';
import { DeepSixLogo } from '../brand/DeepSixLogo';
import { useSound } from '../../audio/Soundscape';

const PAGE_ORDER = [
  '/',
  '/twins',
  '/thor',
  '/batman',
  '/ironman',
  '/luffy',
  '/kratos',
  '/naruto',
  '/itachi',
  '/goku',
  '/vegeta',
  '/zoro',
  '/optimus',
  '/spiderman',
  '/figures',
  '/resume',
  '/contact',
];

function pageIndex(path: string) {
  const i = PAGE_ORDER.indexOf(path);
  return i < 0 ? 0 : i;
}

function pageLabel(path: string) {
  if (path === '/') return { title: 'Cover', kanji: '表紙', color: '#FFD700' };
  if (path === '/twins') return { title: 'Volume Two', kanji: '双子', color: '#FFD700' };
  if (path === '/contact') return { title: 'Afterword', kanji: 'श्रीकृष्ण', color: '#FFD54F' };
  if (path === '/figures') return { title: 'Figure Vault', kanji: '六体', color: '#FFD700' };
  if (path === '/resume') return { title: 'Character Sheet', kanji: '履歴書', color: '#FFD700' };
  const key = path.replace('/', '');
  if (isTwinFigure(key)) {
    const fig = twinFigureMetadata[key];
    return { title: fig.title, kanji: fig.kanji, color: fig.color };
  }
  const meta = characterMetadata[key as CharacterKey];
  return meta
    ? { title: meta.title, kanji: meta.kanji, color: meta.color }
    : { title: 'DEEPSIX', kanji: 'VI', color: '#FFD700' };
}

function LeafFace({ label, kicker }: { label: ReturnType<typeof pageLabel>; kicker: string }) {
  return (
    <>
      <div className="book-leaf-sheen" />
      <div className="book-leaf-margin" />
      <DeepSixLogo size="md" />
      <p className="font-ui text-[11px] tracking-[0.35em] text-ink/50">{kicker}</p>
      <p className="font-kanji text-4xl" style={{ color: label.color }}>
        {label.kanji}
      </p>
      <p className="font-display text-3xl text-ink">{label.title}</p>
    </>
  );
}

export const PageTransition = () => {
  const location = useLocation();
  const { play } = useSound();
  const prevPath = useRef(location.pathname);
  const isFirstRender = useRef(true);
  const [flip, setFlip] = useState<{
    from: string;
    to: string;
    direction: 'forward' | 'back';
  } | null>(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevPath.current = location.pathname;
      return;
    }
    if (prevPath.current === location.pathname) return;

    const direction = pageIndex(location.pathname) >= pageIndex(prevPath.current) ? 'forward' : 'back';
    setFlip({ from: prevPath.current, to: location.pathname, direction });
    play('page-turn');
    prevPath.current = location.pathname;

    const timer = window.setTimeout(() => setFlip(null), 1180);
    return () => window.clearTimeout(timer);
  }, [location.pathname, play]);

  if (!flip) return null;

  const incoming = pageLabel(flip.to);
  const outgoing = pageLabel(flip.from);

  return (
    <div className="book-stage" aria-hidden="true">
      <div className="book-spread">
        <div className="book-spine" />
        <div className="book-static book-static--left">
          <LeafFace label={outgoing} kicker="WAS READING" />
        </div>
        <div className="book-static book-static--right">
          <LeafFace label={incoming} kicker="NOW READING" />
        </div>
        <div className={`book-leaf book-leaf--${flip.direction}`}>
          <div className="book-leaf-face book-leaf-face--front">
            <LeafFace label={outgoing} kicker="TURNING PAGE" />
          </div>
          <div className="book-leaf-face book-leaf-face--back">
            <LeafFace label={incoming} kicker="NOW READING" />
          </div>
        </div>
      </div>
    </div>
  );
};
