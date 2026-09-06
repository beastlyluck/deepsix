import { Suspense, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import type { FigureId } from '../data/figureModels';
import { characterMetadata, characterOrder } from '../systems/manga/mangaTypes';
import { chapterStories } from '../data/story';
import { twinFigureOrder, twinFigureMetadata, isTwinFigure } from '../data/twinFigures';
import { twinStories } from '../data/twinStories';
import { VaultScene, type VaultPhase } from '../components/three/VaultScene';
import { DeepSixLogo } from '../components/brand/DeepSixLogo';

export function FigureVault() {
  const [volume, setVolume] = useState<1 | 2>(2);
  const [phase, setPhase] = useState<VaultPhase>('logo');
  const [selected, setSelected] = useState<FigureId | null>(null);
  const figures: FigureId[] = volume === 2 ? twinFigureOrder : characterOrder;

  useEffect(() => {
    const t = window.setTimeout(() => setPhase('figures'), 3200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    setSelected(null);
  }, [volume]);

  const select = useCallback((c: FigureId | null) => {
    setSelected(c);
    if (c) setPhase('figures');
  }, []);

  const step = (dir: 1 | -1) => {
    const i = selected ? figures.indexOf(selected) : -1;
    const next = figures[(i + dir + figures.length) % figures.length];
    select(next);
  };

  const fig = selected && isTwinFigure(selected) ? twinFigureMetadata[selected] : selected && selected !== 'krishna' ? characterMetadata[selected] : null;
  const story = selected && isTwinFigure(selected) ? twinStories[twinFigureMetadata[selected].twinId] : selected && selected !== 'krishna' ? chapterStories[selected] : null;

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-ink">
      <Canvas shadows camera={{ position: [0, 4.2, 13.2], fov: 38 }} dpr={[1, 1.6]} gl={{ antialias: true, powerPreference: 'high-performance' }} className="absolute inset-0">
        <Suspense fallback={null}>
          <VaultScene phase={phase} figures={figures} selected={selected} onSelect={select} />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute left-6 right-6 top-24 z-10 flex flex-col items-start gap-1 md:left-10">
        <div className="pointer-events-auto flex items-center gap-3">
          <DeepSixLogo size="sm" />
          <span className="font-ui text-[11px] tracking-[0.35em] text-gold/70">FIGURE VAULT · {volume === 2 ? 'VOL. 02' : 'VOL. 01'}</span>
        </div>
        <h1 className="font-display text-3xl text-gold md:text-5xl">{phase === 'logo' ? 'One mark. Two volumes.' : fig ? fig.title : 'Choose a figure'}</h1>
        <p className="max-w-md font-body text-xs text-paper/55 md:text-sm">
          {phase === 'logo'
            ? 'Volume Two unfolds first: six twins, six figures. Click a pedestal to load the model.'
            : 'Drag to orbit · scroll to zoom · a figure loads only when you select it.'}
        </p>
        <div className="pointer-events-auto mt-3 flex gap-2">
          <button
            onClick={() => setVolume(2)}
            className={`rounded-full border px-3 py-1 font-ui text-[10px] uppercase tracking-wider ${volume === 2 ? 'border-gold bg-gold text-ink' : 'border-white/20 text-paper/60'}`}
          >
            Volume Two
          </button>
          <button
            onClick={() => setVolume(1)}
            className={`rounded-full border px-3 py-1 font-ui text-[10px] uppercase tracking-wider ${volume === 1 ? 'border-gold bg-gold text-ink' : 'border-white/20 text-paper/60'}`}
          >
            Volume One
          </button>
        </div>
        {phase === 'logo' && (
          <button onClick={() => setPhase('figures')} className="btn-manga pointer-events-auto mt-4 border-gold bg-gold px-8 py-3 text-ink">
            Transform
          </button>
        )}
      </div>

      {phase === 'figures' && (
        <div className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-4 px-4">
          {fig && story && selected && (
            <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-ink/75 p-5 backdrop-blur-md">
              <div className="grid gap-5 sm:grid-cols-[112px_1fr]">
                <img src={story.art} alt="" className="hidden h-28 w-28 rounded-lg border object-cover sm:block" style={{ borderColor: fig.color }} />
                <div>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-kanji text-2xl" style={{ color: fig.color }}>
                      {fig.kanji}
                    </span>
                    <span className="font-display text-2xl text-gold">{fig.name}</span>
                    <span className="font-ui text-[11px] uppercase tracking-wider text-paper/50">{fig.subtitle}</span>
                  </div>
                  <p className="mt-2 font-body text-sm text-paper/75">{story.hook}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Link
                      to={isTwinFigure(selected) ? `/${selected}` : `/${selected}`}
                      className="rounded-lg px-4 py-2 font-ui text-[11px] uppercase tracking-wider text-ink"
                      style={{ background: fig.color }}
                    >
                      Open {story.volume}
                    </Link>
                    <button onClick={() => setSelected(null)} className="font-ui text-[11px] uppercase tracking-wider text-paper/50 hover:text-paper">
                      Release
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink/70 px-3 py-2 backdrop-blur-md">
            <button onClick={() => step(-1)} className="px-2 font-ui text-paper/60 hover:text-gold" aria-label="Previous figure">
              ←
            </button>
            {figures.map((c) => {
              const m = isTwinFigure(c) ? twinFigureMetadata[c] : characterMetadata[c as Exclude<typeof c, 'krishna'>];
              const active = selected === c;
              return (
                <button
                  key={c}
                  onClick={() => select(c)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border font-kanji text-xs transition-transform hover:scale-110"
                  style={{ borderColor: m.color, color: active ? '#0D0D0D' : m.color, background: active ? m.color : 'transparent' }}
                  aria-label={m.name}
                  aria-pressed={active}
                >
                  {m.kanji.slice(0, 1)}
                </button>
              );
            })}
            <button onClick={() => step(1)} className="px-2 font-ui text-paper/60 hover:text-gold" aria-label="Next figure">
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
