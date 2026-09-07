import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/ui/Hero';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SceneBackdrop } from '../components/three/SceneBackdrop';
import { DeepSixLogo } from '../components/brand/DeepSixLogo';
import { Halftone } from '../systems/manga/Halftone';
import { characterMetadata, characterOrder } from '../systems/manga/mangaTypes';
import { chapterPlain, chapterStories, manuscriptPrologue } from '../data/story';
import { fieldDesks } from '../data/fieldDesks';
import { digitalTwins } from '../data/digitalTwins';
import { twinStories, twinsPrologue } from '../data/twinStories';
import { twinFigureMetadata } from '../data/twinFigures';
import { FigureScene } from '../components/three/FigureScene';
import { ComicPanel, Caption } from '../components/comic/ComicPanel';
import { VolumeSwitch } from '../components/ui/VolumeSwitch';

function LazyTwinClose() {
  const ref = useRef<HTMLElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShow(true);
      },
      { rootMargin: '240px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative h-[72vh] overflow-hidden border-t border-white/10">
      {show ? (
        <SceneBackdrop camera={{ position: [1.6, 1.3, 5.8], fov: 38 }} lookAt={[0.6, 1.0, 0]} dpr={[1, 1.25]}>
          <FigureScene id="thor" />
        </SceneBackdrop>
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/55 to-transparent" />
      <div className="relative z-10 flex h-full max-w-5xl flex-col justify-center px-6">
        <p className="font-ui text-[11px] tracking-[0.3em] text-gold/70">START WITH THE FIRST PROJECT</p>
        <h2 className="max-w-xl font-display text-4xl text-gold md:text-5xl">AeroTwin — drone software in wind it never trained on.</h2>
        <p className="mt-3 max-w-md font-body text-sm text-paper/60">
          The first Volume Two chapter. Read the plain-English problem, then the live board if you want the gap
          number.
        </p>
        <Link to="/thor" className="btn-manga mt-6 w-fit border-gold bg-gold px-8 py-3 text-ink">
          Open AeroTwin
        </Link>
      </div>
    </section>
  );
}

export function Home() {
  return (
    <div className="relative min-h-screen bg-ink">
      <Halftone opacity={0.02} size={28} />
      <Hero />

      <section id="how" className="relative z-10 border-t border-white/10 px-4 py-16 sm:px-6" aria-label="How this site works">
        <div className="mx-auto max-w-6xl">
          <p className="font-ui text-[11px] uppercase tracking-[0.32em] text-gold/70">Start here</p>
          <h2 className="mt-2 font-display text-5xl text-gold md:text-6xl">How this site works</h2>
          <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-paper/70">
            DEEPSIX is the portfolio of Atharva Jitendra Khaire — a Master of Data Science student at Monash, in
            Melbourne. The site is dressed like a manga so the cases are easy to walk through. The work is still
            analysis: forecasts, schedules, sensors, and boards you can open.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <article className="manga-ink-panel">
              <p className="font-ui text-[11px] uppercase tracking-[0.22em] text-gold/70">01 · Two volumes</p>
              <h3 className="mt-2 font-display text-2xl text-gold">Pick a book</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-paper/70">
                Volume Two is the main work: six digital twins. A twin is a computer copy of a real system — drones,
                a power grid, a body, a port, a factory cell, a farm. Volume One is the career, told as six shorter
                chapters.
              </p>
            </article>
            <article className="manga-ink-panel">
              <p className="font-ui text-[11px] uppercase tracking-[0.22em] text-gold/70">02 · One chapter</p>
              <h3 className="mt-2 font-display text-2xl text-gold">Read, then open</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-paper/70">
                Click a card. The first sentence is the project in plain English. Scroll for the story, the method,
                and a live board if you want the numbers. Recruiters can stop at the first sentence. Engineers can
                keep going.
              </p>
            </article>
            <article className="manga-ink-panel">
              <p className="font-ui text-[11px] uppercase tracking-[0.22em] text-gold/70">03 · Two audiences</p>
              <h3 className="mt-2 font-display text-2xl text-gold">Plain, then stack</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-paper/70">
                Each project keeps its own tools. The small line under a card is the technical stack. Honesty notes
                stay visible: held-out tests, losses, and synthetic worlds are labelled, not hidden.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="twins" className="relative z-10 border-t border-white/10 px-4 py-16 sm:px-6" aria-label="Main projects">
        <div className="mx-auto mb-8 flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-ui text-[11px] uppercase tracking-[0.32em] text-gold/70">{twinsPrologue.volume}</p>
            <h2 className="mt-2 font-display text-5xl text-gold md:text-6xl">The main projects</h2>
            <p className="mt-1 font-kanji text-2xl text-paper/35">{twinsPrologue.kanji}</p>
            <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-paper/65">{twinsPrologue.guide}</p>
          </div>
          <VolumeSwitch size="page" />
        </div>
        <div className="mx-auto max-w-6xl">
          <article className="comic-page">
            <header className="comic-page__header">
              <span>Volume Two · six digital twins</span>
              <span>p.1</span>
            </header>
            <div className="comic-story-grid">
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
                          <span className="font-ui text-[10px] text-ink/40">{t.industry}</span>
                        </div>
                        <h3 className="mt-1 font-display text-xl">{t.name}</h3>
                        <p className="font-ui text-[11px] uppercase tracking-[0.16em] text-ink/45">{twinFigureMetadata[t.figure].name}</p>
                        <p className="mt-2 font-body text-sm leading-relaxed text-ink/80">{t.plain}</p>
                        <p className="mt-3 font-ui text-[10px] leading-relaxed text-ink/45">{t.stack}</p>
                        <span className="mt-auto pt-3 font-ui text-[11px] uppercase tracking-wider" style={{ color: t.accent }}>
                          Open this project →
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
            See all six twins on one page →
          </Link>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <article className="comic-page">
            <header className="comic-page__header">
              <span>{manuscriptPrologue.volumeNumber} · The career volume</span>
              <span>What Volume One is</span>
            </header>
            <div className="comic-story-grid">
              <ComicPanel label="In plain words" kind="caption" accent="#FFD700" className="comic-story-premise">
                <h2 className="mb-3 font-display text-3xl text-ink">Volume One is the career</h2>
                <Caption className="text-sm leading-relaxed md:text-base">{manuscriptPrologue.guide}</Caption>
                <Caption className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/70">{manuscriptPrologue.opening}</Caption>
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
          <h2 className="font-display text-5xl text-gold">Volume One · the career</h2>
          <p className="mt-2 font-kanji text-xl text-paper/40">目次</p>
          <p className="mx-auto mt-3 max-w-xl font-body text-sm text-paper/60">
            Six shorter case studies. Same click-and-scroll pattern as Volume Two. The first line on each card is the
            work in everyday words.
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
                  <p className="mt-2 font-body text-sm leading-relaxed text-paper/75">{chapterPlain[key]}</p>
                  <p className="mt-2 font-body text-xs leading-relaxed text-paper/45">{story.hook}</p>
                  <span className="mt-4 inline-block font-ui text-[11px] uppercase tracking-wider text-gold/70">
                    Open chapter {String(index + 1).padStart(2, '0')} →
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
              <h3 className="mt-1 font-display text-2xl text-gold">3D figures</h3>
              <p className="mt-1 font-body text-sm text-paper/60">The characters from both volumes, as models you can orbit and zoom.</p>
            </div>
            <span className="font-kanji text-3xl text-paper/30 transition-colors group-hover:text-gold">六体</span>
          </Link>
          <Link to="/resume" className="manga-ink-panel group flex items-center justify-between gap-4 transition-transform duration-300 hover:-translate-y-0.5">
            <div>
              <span className="font-ui text-[11px] tracking-[0.28em] text-gold">APPENDIX B</span>
              <h3 className="mt-1 font-display text-2xl text-gold">Résumé</h3>
              <p className="mt-1 font-body text-sm text-paper/60">CV, Monash coursework, and skills — plus a downloadable PDF.</p>
            </div>
            <span className="font-kanji text-3xl text-paper/30 transition-colors group-hover:text-gold">履歴書</span>
          </Link>
        </div>

        <div id="field-desks" className="mx-auto mt-6 max-w-6xl">
          <p className="font-ui text-[11px] tracking-[0.28em] text-gold">APPENDIX C · FIELD DESKS</p>
          <h3 className="mt-1 font-display text-3xl text-gold">Four extra boards</h3>
          <p className="mt-2 max-w-2xl font-body text-sm text-paper/60">
            Smaller live cases — emergency waits, rent stress, a power peak, and duplicate invoices. Each one has its
            own GitHub repo if you want to run it.
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
                <p className="mt-2 font-body text-sm text-paper/75">{d.plain}</p>
                <p className="mt-2 font-body text-xs text-paper/45">{d.blurb}</p>
                <p className="mt-3 font-ui text-[10px] text-paper/40">{d.run}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <LazyTwinClose />

      <SiteFooter />
    </div>
  );
}
