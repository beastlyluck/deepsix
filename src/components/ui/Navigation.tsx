import { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { characterMetadata, CharacterKey, characterOrder } from '../../systems/manga/mangaTypes';
import { twinFigureOrder, twinFigureMetadata } from '../../data/twinFigures';
import { volumeOf } from '../../data/volumes';
import { VolumeSwitch } from './VolumeSwitch';
import { DeepSixLogo } from '../brand/DeepSixLogo';
import { useSound } from '../../audio/Soundscape';

const vol1: CharacterKey[] = characterOrder;

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { muted, setMuted } = useSound();
  const vol = volumeOf(location.pathname);
  const showVol1 = vol === 1;

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3" role="navigation" aria-label="Main navigation">
      <div className="mx-auto flex max-w-6xl items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-ink/70 px-4 py-2 backdrop-blur-md">
        <div className="relative z-20 flex shrink-0 items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2.5" aria-label="DEEPSIX Home">
            <DeepSixLogo size="sm" />
            <span className="hidden whitespace-nowrap pr-2 font-display text-xl leading-none tracking-[0.18em] text-gold sm:inline">
              DEEPSIX
            </span>
          </NavLink>
          <div className="hidden md:block">
            <VolumeSwitch />
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-0.5 overflow-x-auto overscroll-x-contain md:flex">
          <span className="mx-1 hidden h-4 w-px bg-white/10 xl:block" />
          {showVol1
            ? vol1.map((char) => {
                const meta = characterMetadata[char];
                const isActive = location.pathname === `/${char}`;
                return (
                  <button
                    key={char}
                    onClick={() => navigate(`/${char}`)}
                    className={`rounded-lg px-2.5 py-1.5 font-ui text-[11px] uppercase tracking-wider transition-colors ${
                      isActive ? 'bg-white/10 text-gold' : 'text-paper/55 hover:text-paper'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={meta.title}
                  >
                    <span className="font-kanji mr-1 text-sm">{meta.kanji}</span>
                    <span className="hidden xl:inline">{meta.name}</span>
                  </button>
                );
              })
            : twinFigureOrder.map((fig) => {
                const meta = twinFigureMetadata[fig];
                const isActive = location.pathname === meta.path || location.pathname === `/twins/${meta.twinId}`;
                return (
                  <button
                    key={fig}
                    onClick={() => navigate(meta.path)}
                    className={`rounded-lg px-2.5 py-1.5 font-ui text-[11px] uppercase tracking-wider transition-colors ${
                      isActive ? 'bg-white/10 text-gold' : 'text-paper/55 hover:text-paper'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={meta.title}
                  >
                    <span className="font-kanji mr-1 text-sm">{meta.kanji}</span>
                    <span className="hidden xl:inline">{meta.name}</span>
                  </button>
                );
              })}
          <span className="mx-1 h-4 w-px bg-white/10" />
          {[
            { to: '/figures', label: 'Figures' },
            { to: '/resume', label: 'Résumé' },
            { to: '/contact', label: 'Contact' },
          ].map((l) => (
            <button
              key={l.to}
              onClick={() => navigate(l.to)}
              className={`rounded-lg px-2.5 py-1.5 font-ui text-[11px] uppercase tracking-wider ${
                location.pathname === l.to ? 'bg-white/10 text-gold' : 'text-paper/55 hover:text-paper'
              }`}
              aria-current={location.pathname === l.to ? 'page' : undefined}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => setMuted(!muted)}
            className="ml-1 rounded-lg px-2.5 py-1.5 font-ui text-[11px] uppercase tracking-wider text-paper/55 hover:text-gold"
            aria-pressed={muted}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            title={muted ? 'Sound off' : 'Sound on'}
          >
            {muted ? 'Mute' : 'Sound'}
          </button>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg border border-white/10 p-2 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-ink/96 py-16 backdrop-blur-md md:hidden">
          <VolumeSwitch size="page" />
          <p className="mt-2 font-ui text-[10px] uppercase tracking-[0.28em] text-gold/70">Volume Two</p>
          {twinFigureOrder.map((fig) => {
            const meta = twinFigureMetadata[fig];
            return (
              <button
                key={fig}
                onClick={() => navigate(meta.path)}
                className="w-72 rounded-xl border border-white/10 px-5 py-3 font-display text-lg"
                style={{ color: meta.color }}
              >
                {meta.kanji} · {meta.name}
              </button>
            );
          })}
          <p className="mt-2 font-ui text-[10px] uppercase tracking-[0.28em] text-paper/40">Volume One</p>
          {vol1.map((char) => {
            const meta = characterMetadata[char];
            return (
              <button
                key={char}
                onClick={() => navigate(`/${char}`)}
                className="w-72 rounded-xl border border-white/10 px-5 py-2 font-display text-base"
                style={{ color: meta.color }}
              >
                {meta.kanji} · {meta.name}
              </button>
            );
          })}
          {[
            { to: '/figures', label: 'Figure Vault' },
            { to: '/resume', label: 'Résumé' },
            { to: '/contact', label: 'Contact' },
          ].map((l) => (
            <button key={l.to} onClick={() => navigate(l.to)} className="w-72 rounded-xl border border-white/10 px-5 py-3 text-paper/70">
              {l.label}
            </button>
          ))}
          <button onClick={() => setMuted(!muted)} className="w-72 rounded-xl border border-white/10 px-5 py-3 text-gold">
            {muted ? 'Unmute manuscript' : 'Mute manuscript'}
          </button>
        </div>
      )}
    </nav>
  );
};
