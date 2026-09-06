import { Link } from 'react-router-dom';
import { SiteFooter } from '../components/layout/SiteFooter';
import { DeepSixLogo } from '../components/brand/DeepSixLogo';
import { Halftone } from '../systems/manga/Halftone';
import { ComicPanel, Caption, Speech } from '../components/comic/ComicPanel';
import { TwinSpread } from '../components/comic/TwinSpread';
import { digitalTwins } from '../data/digitalTwins';
import { twinStories, twinsPrologue } from '../data/twinStories';
import { twinFigureMetadata } from '../data/twinFigures';
import { VolumeSwitch } from '../components/ui/VolumeSwitch';

export function Twins() {
  return (
    <div className="relative min-h-screen bg-ink pt-20">
      <Halftone opacity={0.02} size={28} />

      <section className="relative overflow-hidden border-b border-white/10 px-6 pb-14 pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DeepSixLogo size="sm" />
              <span className="font-ui text-[11px] tracking-[0.28em] text-paper/50">{twinsPrologue.volume}</span>
            </div>
            <VolumeSwitch />
          </div>
          <p className="font-kanji text-5xl text-gold md:text-6xl">{twinsPrologue.kanji}</p>
          <h1 className="mt-2 font-display text-5xl text-gold md:text-7xl">Volume Two · the work</h1>
          <p className="mt-4 max-w-2xl font-display text-2xl text-paper">{twinsPrologue.title}</p>
          <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-paper/70">{twinsPrologue.guide}</p>
          <p className="mt-6 font-ui text-[11px] tracking-[0.25em] text-paper/40">
            SIX PROJECTS · PLAIN WORDS FIRST · STACK UNDERNEATH
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <article className="comic-page">
          <header className="comic-page__header">
            <span>Opening · How to read the twins</span>
            <span>p.1</span>
          </header>
          <div className="comic-story-grid">
            <ComicPanel label="In plain words" kind="caption" accent="#FFD700" className="comic-story-premise">
              <Caption className="text-base leading-relaxed">{twinsPrologue.guide}</Caption>
              <Caption className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/70">{twinsPrologue.opening}</Caption>
            </ComicPanel>
            <ComicPanel label="The rule" kind="speech" accent="#FFD700">
              <Speech speaker="Atharva">Each twin keeps the tools that industry actually uses. Do not flatten them onto one stack.</Speech>
            </ComicPanel>
            <ComicPanel label="How to read a card" kind="plain" accent="#FFD700">
              <p className="font-display text-2xl text-ink">Plain sentence, then the stack.</p>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/75">
                Click a project. Scroll the story. Open the live board if you want the numbers. Recruiters can stop at
                the first sentence.
              </p>
            </ComicPanel>
            <ComicPanel label="Honesty" kind="caption" accent="#FFD700">
              <Caption className="text-sm leading-relaxed">
                Read the honesty note before you trust the board. Fake worlds stay labelled. Losses stay printed.
              </Caption>
            </ComicPanel>
          </div>
        </article>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <article className="comic-page">
          <header className="comic-page__header">
            <span>Contents · 目次</span>
            <span>p.2</span>
          </header>
          <div className="comic-twin-contents">
            {digitalTwins.map((t, i) => {
              const s = twinStories[t.id];
              return (
                <ComicPanel key={t.id} label={s.volume} kind="caption" accent={t.accent} tilt={i % 2 ? 0.25 : -0.25}>
                  <Link to={`/${t.figure}`} className="flex h-full flex-col text-ink">
                    <img src={s.art} alt="" className="-mx-4 -mt-4 mb-3 h-32 w-[calc(100%+2rem)] object-cover" />
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-kanji text-3xl" style={{ color: t.accent }}>
                        {twinFigureMetadata[t.figure].kanji}
                      </p>
                      <span className="font-ui text-[10px] text-ink/45">p.{s.pageStart}</span>
                    </div>
                    <h2 className="mt-2 font-display text-2xl">{twinFigureMetadata[t.figure].name}</h2>
                    <p className="font-display text-xl text-ink/80">{t.name}</p>
                    <p className="mt-1 font-ui text-[10px] uppercase tracking-[0.18em] text-ink/50">{t.industry}</p>
                    <p className="mt-3 font-body text-sm leading-relaxed text-ink/80">{t.plain}</p>
                    <p className="mt-2 font-ui text-[10px] leading-relaxed text-ink/45">{t.stack}</p>
                    <span className="mt-auto pt-4 font-ui text-[11px] uppercase tracking-wider" style={{ color: t.accent }}>
                      Open this project →
                    </span>
                  </Link>
                </ComicPanel>
              );
            })}
          </div>
        </article>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl space-y-14 px-4 pb-20 sm:px-6">
        <div>
          <p className="font-ui text-[11px] tracking-[0.28em] text-gold/70">CASE PAGES</p>
          <h2 className="font-display text-4xl text-gold">Stories, specs, files</h2>
          <p className="mt-2 max-w-2xl font-body text-sm text-paper/55">
            Same comic grammar as the chapter cases. Click a panel to enlarge. Open a twin for the live board.
          </p>
        </div>
        {digitalTwins.map((t) => (
          <div key={t.id} id={t.id}>
            <TwinSpread twin={t} story={twinStories[t.id]} pageNumber={twinStories[t.id].pageStart + 2} />
            <div className="mt-4 flex justify-end">
              <Link to={`/${t.figure}`} className="font-ui text-[11px] uppercase tracking-[0.2em] text-gold/80 hover:text-gold">
                Open {t.name} manuscript + board →
              </Link>
            </div>
          </div>
        ))}
      </section>

      <SiteFooter />
    </div>
  );
}
