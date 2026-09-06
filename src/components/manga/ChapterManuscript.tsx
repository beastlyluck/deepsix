import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../../data/openDataSources';
import { chapterStories } from '../../data/story';
import type { CharacterKey } from '../../data/openDataSources';
import { characterMetadata } from '../../systems/manga/mangaTypes';
import { SceneBackdrop } from '../three/SceneBackdrop';
import { ChapterScene } from '../three/ChapterScene';
import { DeepSixLogo } from '../brand/DeepSixLogo';
import { Halftone } from '../../systems/manga/Halftone';
import { ComicPanel, Caption, Speech, Sfx } from '../comic/ComicPanel';
import { PanelLightbox } from '../comic/PanelLightbox';
import { ProjectSpread } from '../comic/ProjectSpread';
import { figureModels } from '../../data/figureModels';
import { VolumeSwitch } from '../ui/VolumeSwitch';

export function ChapterManuscript({ character, projects }: { character: CharacterKey; projects: Project[] }) {
  const meta = characterMetadata[character];
  const story = chapterStories[character];
  const [openBeat, setOpenBeat] = useState<string | null>(null);
  const beat = story.beats.find((b) => b.id === openBeat);

  // Lazy chunks load after the browser's hash jump; honour #cases deep links ourselves.
  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) window.setTimeout(() => el.scrollIntoView({ block: 'start' }), 60);
    }
  }, [character]);

  return (
    <div className="relative min-h-screen bg-ink">
      <Halftone opacity={0.02} size={28} color={meta.color} />

      {/* Splash page — 3D figure */}
      <section className="relative h-[92svh] overflow-hidden border-b border-white/10">
        <SceneBackdrop camera={figureModels[character].camera} lookAt={figureModels[character].lookAt}>
          <ChapterScene character={character} />
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
              <VolumeSwitch />
            </div>
            <p className="font-kanji text-3xl md:text-4xl" style={{ color: meta.color }}>
              {meta.kanji}
            </p>
            <h1 className="mt-1 font-display text-3xl tracking-wide text-gold md:text-5xl">{meta.title}</h1>
            <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-paper/75 md:text-lg">{story.hook}</p>
            <p className="mt-6 font-ui text-[11px] tracking-[0.25em] text-paper/40">SCROLL · {projects.length} CASE PAGES · CLICK ANY PANEL TO ENLARGE</p>
          </div>
        </div>
      </section>

      {/* Story page — comic panels */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <article className="comic-page">
          <header className="comic-page__header">
            <span>{story.volume} · Opening</span>
            <span>p.{story.pageStart + 1}</span>
          </header>
          <div className="comic-story-grid">
            <ComicPanel label="Narration" kind="caption" accent={meta.color} className="comic-story-premise" onExpand={() => setOpenBeat('premise')}>
              <Caption className="text-base leading-relaxed">{story.premise}</Caption>
            </ComicPanel>
            {story.beats.map((b, i) => (
              <ComicPanel
                key={b.id}
                label={b.kind === 'speech' ? b.speaker : b.kind === 'sfx' ? 'SFX' : `Panel ${i + 1}`}
                kind={b.kind === 'speech' ? 'speech' : b.kind === 'sfx' ? 'sfx' : 'caption'}
                accent={meta.color}
                tilt={i % 2 ? 0.35 : -0.35}
                onExpand={() => setOpenBeat(b.id)}
                className={b.kind === 'sfx' ? 'flex items-center justify-center' : undefined}
              >
                {b.kind === 'sfx' ? (
                  <Sfx text={b.sfx || b.text} accent={meta.color} className="text-5xl" />
                ) : b.kind === 'speech' ? (
                  <Speech speaker={b.speaker ?? meta.name}>{b.text}</Speech>
                ) : (
                  <Caption className="text-sm leading-relaxed">{b.text}</Caption>
                )}
              </ComicPanel>
            ))}
            <ComicPanel kind="plain" accent={meta.color} className="comic-story-art !p-0" onExpand={() => setOpenBeat('art')}>
              <img src={story.art} alt="" className="h-full min-h-[240px] w-full object-cover" />
              <p className="absolute bottom-0 left-0 right-0 border-t-[3px] border-ink bg-[#FFF3B0] px-4 py-2 font-display text-xl text-ink">{story.climax}</p>
            </ComicPanel>
          </div>
        </article>

        <PanelLightbox open={openBeat !== null} onClose={() => setOpenBeat(null)} title={openBeat === 'art' ? 'Splash' : openBeat === 'premise' ? 'Narration' : beat?.speaker ?? 'Panel'} accent={meta.color}>
          {openBeat === 'art' ? (
            <div>
              <img src={story.art} alt="" className="w-full border-[3px] border-ink" />
              <p className="mt-4 font-display text-3xl text-ink">{story.climax}</p>
            </div>
          ) : openBeat === 'premise' ? (
            <ComicPanel kind="caption" accent={meta.color} expanded>
              <Caption className="text-xl leading-relaxed">{story.premise}</Caption>
            </ComicPanel>
          ) : beat ? (
            <ComicPanel kind={beat.kind === 'speech' ? 'speech' : beat.kind === 'sfx' ? 'sfx' : 'caption'} accent={meta.color} expanded>
              {beat.kind === 'sfx' ? <Sfx text={beat.sfx || beat.text} accent={meta.color} className="text-8xl" /> : beat.kind === 'speech' ? <Speech speaker={beat.speaker ?? meta.name} className="text-xl">{beat.text}</Speech> : <Caption className="text-xl leading-relaxed">{beat.text}</Caption>}
            </ComicPanel>
          ) : null}
        </PanelLightbox>
      </section>

      {/* Case pages — one comic page per project */}
      <section id="cases" className="relative z-10 mx-auto max-w-6xl space-y-14 px-4 pb-20 sm:px-6 scroll-mt-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-ui text-[11px] tracking-[0.28em] text-gold/70">FEATURED ANALYTICS</p>
            <h2 className="font-display text-4xl text-gold">Case pages</h2>
            <p className="mt-1 font-body text-sm text-paper/55">Each page: the problem, the approach, a live demo you can drive, the result, and the lesson. Source in <span className="font-ui text-paper/75">projects/</span>.</p>
          </div>
          <DeepSixLogo size="sm" />
        </div>

        {projects.map((project, i) => (
          <ProjectSpread key={project.id} project={project} index={i} accent={meta.color} characterName={meta.name} sfx={meta.sfx} pageNumber={story.pageStart + 2 + i} />
        ))}

        <div className="flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-10 sm:flex-row">
          <Link to={story.prev.path} className="font-ui text-xs uppercase tracking-[0.2em] text-paper/50 hover:text-gold">
            ← {story.prev.label}
          </Link>
          <VolumeSwitch size="page" />
          <Link to={story.next.path} className="btn-manga border-gold bg-gold px-7 py-3 text-ink">
            {story.next.label}
          </Link>
        </div>
      </section>
    </div>
  );
}
