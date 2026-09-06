import { Link } from 'react-router-dom';
import { Hero } from '../components/ui/Hero';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SceneBackdrop } from '../components/three/SceneBackdrop';
import { DeepSixLogo } from '../components/brand/DeepSixLogo';
import { Halftone } from '../systems/manga/Halftone';
import { characterMetadata, characterOrder } from '../systems/manga/mangaTypes';
import { chapterStories, manuscriptPrologue } from '../data/story';
import { fieldDesks } from '../data/fieldDesks';
import { digitalTwins } from '../data/digitalTwins';
import { twinStories, twinsPrologue } from '../data/twinStories';
import { twinFigureMetadata } from '../data/twinFigures';
import { FigureScene } from '../components/three/FigureScene';
import { ComicPanel, Caption } from '../components/comic/ComicPanel';
import { VolumeSwitch } from '../components/ui/VolumeSwitch';

export function Home() {
  return (
    <div className="relative min-h-screen bg-ink">
      <Halftone opacity={0.02} size={28} />
      <Hero />

      <section id="twins" className="relative z-10 border-t border-white/10 px-4 py-16 sm:px-6" aria-label="Main projects">
        <div className="mx-auto mb-8 flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-ui text-[11px] uppercase tracking-[0.32em] text-gold/70">{twinsPrologue.volume}</p>
            <h2 className="mt-2 font-display text-5xl text-gold md:text-6xl">The work.</h2>
            <p className="mt-1 font-kanji text-2xl text-paper/35">{twinsPrologue.kanji}</p>
          </div>
          <VolumeSwitch size="page" />
        </div>
        <div className="mx-auto max-w-6xl">
          <article className="comic-page">
            <header className="comic-page__header">
              <span>Main projects · six twins</span>
              <span>p.1</span>
            </header>
            <div className="comic-story-grid">
              <ComicPanel label="Narration" kind="caption" accent="#FFD700" className="comic-story-premise">
                <Caption className="whitespace-pre-line text-sm leading-relaxed md:text-base">{twinsPrologue.opening}</Caption>
              </ComicPanel>
              {digitalTwins.map((t, i) => {
                const s = twinStories[t.id];
                return (
                  <ComicPanel key={t.id} label={s.volume} kind="caption" accent={t.accent} tilt={i % 2 ? 0.3 : -0.3} className="!p-0">
                    <Link to={`/${t.figure}`} className="flex h-full flex-col text-ink">
                      <img src={s.art} alt="" className="h-28 w-full object-cover" />
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-kanji text-2xl" style={{ color: twinFigureMetadata[t.figure].color }}>
                            {twinFigureMetadata[t.figure].kanji}
                          </span>
                          <span className="font-ui text-[10px] text-ink/40">p.{s.pageStart}</span>
                        </div>
                        <h3 className="mt-1 font-display text-xl">{twinFigureMetadata[t.figure].name}</h3>
                        <p className="font-display text-lg text-ink/80">{t.name}</p>
                        <Caption className="mt-2 text-xs leading-relaxed md:text-sm">{s.hook}</Caption>
                        <span className="mt-auto pt-3 font-ui text-[11px] uppercase tracking-wider" style={{ color: t.accent }}>
                          Open chapter →
                        </span>
                      </div>
                    </Link>
                  </ComicPanel>
                );
              })}
            </div>
          </article>
        </div>
        <div className="mx-auto mt-6 max-w-6xl">
          <Link to="/twins" className="font-ui text-[11px] uppercase tracking-[0.22em] text-gold/80 hover:text-gold">
            Read the full twins manuscript →
          </Link>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <article className="comic-page">
            <header className="comic-page__header">
              <span>{manuscriptPrologue.volumeNumber} · Prologue</span>
              <span>How to read this volume</span>
            </header>
            <div className="comic-story-grid">
              <ComicPanel label="Narration" kind="caption" accent="#FFD700" className="comic-story-premise">
                <h2 className="mb-3 font-display text-3xl text-ink">How to read this volume</h2>
                <Caption className="whitespace-pre-line text-sm leading-relaxed md:text-base">{manuscriptPrologue.opening}</Caption>
              </ComicPanel>
              <ComicPanel kind="plain" accent="#FFD700" className="comic-story-art !p-0">
                <img src="/manga/deepsix-cover.png" alt="DEEPSIX volume cover" className="h-full min-h-[260px] w-full object-cover" />
              </ComicPanel>
            </div>
          </article>
        </div>
      </section>

      <section id="volume-one" className="relative z-10 px-6 py-20" aria-label="Table of Contents">
        <div className="mx-auto mb-12 max-w-5xl text-center">
          <div className="mb-4 flex justify-center">
            <DeepSixLogo size="md" />
          </div>
          <div className="mb-4 flex justify-center">
            <VolumeSwitch size="page" />
          </div>
          <h2 className="font-display text-5xl text-gold">Volume One</h2>
          <p className="mt-2 font-kanji text-xl text-paper/40">目次</p>
          <p className="mx-auto mt-3 max-w-xl font-body text-sm text-paper/50">
            Six chapters that tell the career. Volume Two, above, is the main work.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
          {characterOrder.map((key, index) => {
            const meta = characterMetadata[key];
            const story = chapterStories[key];
            return (
              <Link key={key} to={`/${key}`} className="manga-ink-panel group overflow-hidden p-0 transition-transform duration-300 hover:-translate-y-0.5">
                <div className="relative h-44">
                  <img src={story.art} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
                  <span className="absolute left-4 top-4 font-ui text-[11px] tracking-[0.28em] text-gold">{story.volume}</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-kanji text-xl" style={{ color: meta.color }}>
                      {meta.kanji}
                    </span>
                    <span className="font-ui text-[11px] text-paper/35">p.{story.pageStart}</span>
                  </div>
                  <h3 className="mt-2 font-display text-2xl text-gold">{meta.name}</h3>
                  <p className="mt-1 font-body text-sm text-paper/60">{story.hook}</p>
                  <span className="mt-4 inline-block font-ui text-[11px] uppercase tracking-wider text-gold/70">
                    Chapter {String(index + 1).padStart(2, '0')} →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mx-auto mt-6 grid max-w-6xl gap-5 lg:grid-cols-2">
          <Link to="/figures" className="manga-ink-panel group flex items-center justify-between gap-4 transition-transform duration-300 hover:-translate-y-0.5">
            <div>
              <span className="font-ui text-[11px] tracking-[0.28em] text-gold">APPENDIX A</span>
              <h3 className="mt-1 font-display text-2xl text-gold">Figure Vault</h3>
              <p className="mt-1 font-body text-sm text-paper/60">The mark unfolds into six interactive 3D figures. Orbit, zoom, inspect.</p>
            </div>
            <span className="font-kanji text-3xl text-paper/30 transition-colors group-hover:text-gold">六体</span>
          </Link>
          <Link to="/resume" className="manga-ink-panel group flex items-center justify-between gap-4 transition-transform duration-300 hover:-translate-y-0.5">
            <div>
              <span className="font-ui text-[11px] tracking-[0.28em] text-gold">APPENDIX B</span>
              <h3 className="mt-1 font-display text-2xl text-gold">Character Sheet</h3>
              <p className="mt-1 font-body text-sm text-paper/60">Résumé, Monash coursework and skills — as a comic page, with the PDF.</p>
            </div>
            <span className="font-kanji text-3xl text-paper/30 transition-colors group-hover:text-gold">履歴書</span>
          </Link>
        </div>

        <div id="field-desks" className="mx-auto mt-6 max-w-6xl">
          <p className="font-ui text-[11px] tracking-[0.28em] text-gold">APPENDIX C · FIELD DESKS</p>
          <h3 className="mt-1 font-display text-3xl text-gold">Four boards you can run</h3>
          <p className="mt-2 max-w-2xl font-body text-sm text-paper/60">
            Longer cases than the chapter pages. Each has its own repo under beastlyluck — a shift board, an atlas, a control-room page, a payment queue.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {fieldDesks.map((d) => (
              <a
                key={d.id}
                href={d.github}
                target="_blank"
                rel="noreferrer"
                className="manga-ink-panel block transition-transform duration-300 hover:-translate-y-0.5"
              >
                <span className="font-ui text-[10px] uppercase tracking-[0.22em] text-gold/70">{d.domain}</span>
                <h4 className="mt-1 font-display text-xl text-gold">{d.title}</h4>
                <p className="mt-2 font-body text-sm text-paper/65">{d.blurb}</p>
                <p className="mt-3 font-ui text-[10px] text-paper/40">{d.run}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="relative h-[72vh] overflow-hidden border-t border-white/10">
        <SceneBackdrop camera={{ position: [1.6, 1.3, 5.8], fov: 38 }} lookAt={[0.6, 1.0, 0]}>
          <FigureScene id="thor" />
        </SceneBackdrop>
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/55 to-transparent" />
        <div className="relative z-10 flex h-full max-w-5xl flex-col justify-center px-6">
          <p className="font-ui text-[11px] tracking-[0.3em] text-gold/70">BEGIN VOLUME TWO</p>
          <h2 className="max-w-xl font-display text-4xl text-gold md:text-5xl">Thor is already measuring the gust.</h2>
          <p className="mt-3 max-w-md font-body text-sm text-paper/60">AeroTwin opens Volume Two: six airframes, one policy, a gap that stays honest.</p>
          <Link to="/thor" className="btn-manga mt-6 w-fit border-gold bg-gold px-8 py-3 text-ink">
            Turn the first page
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
