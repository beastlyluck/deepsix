import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DigitalTwin } from '../../data/digitalTwins';
import { twinNeighbors } from '../../data/digitalTwins';
import type { TwinStory } from '../../data/twinStories';
import { twinFigureMetadata } from '../../data/twinFigures';
import { figureModels } from '../../data/figureModels';
import { DeepSixLogo } from '../brand/DeepSixLogo';
import { Halftone } from '../../systems/manga/Halftone';
import { ComicPanel, Caption, Speech, Sfx } from '../comic/ComicPanel';
import { PanelLightbox } from '../comic/PanelLightbox';
import { TwinSpread } from '../comic/TwinSpread';
import { SiteFooter } from '../layout/SiteFooter';
import { SceneBackdrop } from '../three/SceneBackdrop';
import { FigureScene } from '../three/FigureScene';
import { VolumeSwitch } from '../ui/VolumeSwitch';
import { VOL1_END, VOL1_START } from '../../data/volumes';

export function TwinManuscript({ twin, story }: { twin: DigitalTwin; story: TwinStory }) {
  const { prev, next, index } = twinNeighbors(twin.id);
  const figure = twinFigureMetadata[twin.figure];
  const spec = figureModels[twin.figure];
  const [openBeat, setOpenBeat] = useState<string | null>(null);
  const beat = story.beats.find((b) => b.id === openBeat);

  return (
    <div className="relative min-h-screen bg-ink">
      <Halftone opacity={0.025} size={26} color={twin.accent} />

      <section className="relative h-[92svh] overflow-hidden border-b border-white/10">
        <SceneBackdrop camera={spec.camera} lookAt={spec.lookAt}>
          <FigureScene id={twin.figure} />
        </SceneBackdrop>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/80 to-transparent pt-20">
          <div className="pointer-events-auto mx-auto w-full max-w-6xl px-6 pb-10">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <DeepSixLogo size="sm" />
                <span className="font-ui text-[11px] tracking-[0.28em] text-paper/50">
                  {story.volume} · p.{story.pageStart}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <VolumeSwitch />
                <Link to="/twins" className="font-ui text-[11px] uppercase tracking-[0.2em] text-gold/70 hover:text-gold">
                  Contents
                </Link>
              </div>
            </div>
            <p className="font-kanji text-3xl md:text-4xl" style={{ color: figure.color }}>
              {figure.kanji}
            </p>
            <h1 className="mt-1 font-display text-3xl tracking-wide text-gold md:text-5xl">{figure.title}</h1>
            <p className="mt-2 font-display text-xl text-paper/80">{figure.name} · {twin.name}</p>
            <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-paper/75 md:text-lg">{story.hook}</p>
            <p className="mt-6 font-ui text-[11px] tracking-[0.25em] text-paper/40">
              SCROLL · STORY · SPEC · LIVE BOARD · CLICK ANY PANEL TO ENLARGE
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <article className="comic-page">
          <header className="comic-page__header">
            <span>{story.volume} · Opening</span>
            <span>p.{story.pageStart + 1}</span>
          </header>
          <div className="comic-story-grid">
            <ComicPanel label="Narration" kind="caption" accent={twin.accent} className="comic-story-premise" onExpand={() => setOpenBeat('premise')}>
              <Caption className="text-base leading-relaxed">{story.premise}</Caption>
            </ComicPanel>
            {story.beats.map((b, i) => (
              <ComicPanel
                key={b.id}
                label={b.kind === 'speech' ? b.speaker : b.kind === 'sfx' ? 'SFX' : `Panel ${i + 1}`}
                kind={b.kind === 'speech' ? 'speech' : b.kind === 'sfx' ? 'sfx' : 'caption'}
                accent={twin.accent}
                tilt={i % 2 ? 0.35 : -0.35}
                onExpand={() => setOpenBeat(b.id)}
                className={b.kind === 'sfx' ? 'flex items-center justify-center' : undefined}
              >
                {b.kind === 'sfx' ? (
                  <Sfx text={b.text} accent={twin.accent} className="text-5xl" />
                ) : b.kind === 'speech' ? (
                  <Speech speaker={b.speaker ?? twin.name}>{b.text}</Speech>
                ) : (
                  <Caption className="text-sm leading-relaxed">{b.text}</Caption>
                )}
              </ComicPanel>
            ))}
            <ComicPanel kind="plain" accent={twin.accent} className="comic-story-art !p-0">
              <img src={story.art} alt="" className="h-full min-h-[240px] w-full object-cover" />
              <p className="absolute bottom-0 left-0 right-0 border-t-[3px] border-ink bg-[#FFF3B0] px-4 py-2 font-display text-xl text-ink">{story.climax}</p>
            </ComicPanel>
          </div>
        </article>

        <PanelLightbox
          open={openBeat !== null}
          onClose={() => setOpenBeat(null)}
          title={openBeat === 'premise' ? 'Narration' : beat?.speaker ?? 'Panel'}
          accent={twin.accent}
        >
          {openBeat === 'premise' ? (
            <ComicPanel kind="caption" accent={twin.accent} expanded>
              <Caption className="text-xl leading-relaxed">{story.premise}</Caption>
            </ComicPanel>
          ) : beat ? (
            <ComicPanel kind={beat.kind === 'speech' ? 'speech' : beat.kind === 'sfx' ? 'sfx' : 'caption'} accent={twin.accent} expanded>
              {beat.kind === 'sfx' ? (
                <Sfx text={beat.text} accent={twin.accent} className="text-8xl" />
              ) : beat.kind === 'speech' ? (
                <Speech speaker={beat.speaker ?? twin.name} className="text-xl">
                  {beat.text}
                </Speech>
              ) : (
                <Caption className="text-xl leading-relaxed">{beat.text}</Caption>
              )}
            </ComicPanel>
          ) : null}
        </PanelLightbox>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="mb-6">
          <p className="font-ui text-[11px] tracking-[0.28em] text-gold/70">CASE PAGE</p>
          <h2 className="font-display text-4xl text-gold">Problem, spec, lesson</h2>
        </div>
        <TwinSpread twin={twin} story={story} pageNumber={story.pageStart + 2} />
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <article className="comic-page">
          <header className="comic-page__header">
            <span>{story.volume} · Ops board</span>
            <span>p.{story.pageStart + 3}</span>
          </header>
          <ComicPanel label="Live board" kind="demo" accent={twin.accent}>
            <p className="mb-3 font-body text-sm text-ink/70">{twin.product}. Click any panel above for the written spec. This frame is the running desk.</p>
            <iframe
              title={`${twin.name} operations board`}
              src={`/boards/${twin.id}/index.html`}
              className="comic-board-frame h-[72vh] w-full"
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <a href={`/boards/${twin.id}/index.html`} target="_blank" rel="noreferrer" className="font-ui text-[11px] uppercase tracking-wider text-ink underline">
                Full board
              </a>
              <a href={`/boards/${twin.id}/docs/index.html`} target="_blank" rel="noreferrer" className="font-ui text-[11px] uppercase tracking-wider text-ink underline">
                Technical docs
              </a>
              <a href={twin.github} target="_blank" rel="noreferrer" className="font-ui text-[11px] uppercase tracking-wider text-ink underline">
                Source
              </a>
            </div>
          </ComicPanel>
        </article>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <article className="comic-page">
          <header className="comic-page__header">
            <span>{story.volume} · Notes</span>
            <span>p.{story.pageStart + 4}</span>
          </header>
          <div className="comic-docs-grid">
            {story.docs.map((d) => (
              <ComicPanel key={d.title} label={d.title} kind="plain" accent={twin.accent}>
                <p className="font-body text-sm leading-relaxed text-ink/85">{d.body}</p>
              </ComicPanel>
            ))}
            <ComicPanel label="Honesty" kind="caption" accent={twin.accent} className="comic-docs-lead">
              <Caption className="text-sm leading-relaxed">{story.honesty}</Caption>
            </ComicPanel>
          </div>
        </article>
      </section>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 pb-16 sm:flex-row">
        {index === 0 ? (
          <Link to={VOL1_END} className="font-ui text-xs uppercase tracking-[0.2em] text-paper/50 hover:text-gold">
            ← Volume One · Spider-Man
          </Link>
        ) : (
          <Link to={`/${prev.figure}`} className="font-ui text-xs uppercase tracking-[0.2em] text-paper/50 hover:text-gold">
            ← {twinFigureMetadata[prev.figure].name} · {prev.name}
          </Link>
        )}
        <VolumeSwitch size="page" />
        {index === 5 ? (
          <Link to={VOL1_START} className="btn-manga border-gold bg-gold px-7 py-3 text-ink">
            Travel to Volume One →
          </Link>
        ) : (
          <Link to={`/${next.figure}`} className="btn-manga border-gold bg-gold px-7 py-3 text-ink">
            {twinFigureMetadata[next.figure].name} · {next.name} →
          </Link>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
