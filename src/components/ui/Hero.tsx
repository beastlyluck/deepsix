import { Suspense, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { gsap } from 'gsap';
import { profile } from '../../data/profile';
import { digitalTwins } from '../../data/digitalTwins';
import { Halftone } from '../../systems/manga/Halftone';
import { chapterPlain } from '../../data/story';
import { characterMetadata, characterOrder } from '../../systems/manga/mangaTypes';
import { twinFigureMetadata } from '../../data/twinFigures';
import { Logo3D } from '../three/Logo3D';
import { VolumeSwitch } from './VolumeSwitch';

export const Hero: React.FC = () => {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(panel.current, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.05, ease: 'power3.out' });
    }, panel);
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative min-h-[100svh] overflow-hidden" aria-labelledby="hero-title">
      <img src="/environments/env-landing.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/40" />
      <Halftone opacity={0.018} size={32} />

      <div ref={panel} className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-16 pt-28 md:justify-center md:pb-24">
        <div className="flex items-center gap-3">
          <div className="h-20 w-20">
            <Canvas camera={{ position: [0, 0, 3.8], fov: 40 }} dpr={[1, 1.4]} gl={{ alpha: true, antialias: true }}>
              <Suspense fallback={null}>
                <ambientLight intensity={0.6} />
                <spotLight position={[3, 4, 4]} intensity={2} color="#fff3dc" />
                <Suspense fallback={null}>
                  <Environment preset="night" />
                </Suspense>
                <Logo3D scale={1.2} spin={0.45} glow={1.3} />
              </Suspense>
            </Canvas>
          </div>
          <p className="font-ui text-[11px] tracking-[0.42em] text-gold/75">PORTFOLIO · {profile.name}</p>
        </div>

        <h1 id="hero-title" className="mt-6 max-w-3xl font-display text-6xl leading-[0.92] text-gold md:text-8xl">
          DEEPSIX
        </h1>
        <p className="mt-5 max-w-2xl font-display text-2xl text-paper md:text-3xl">
          Atharva Khaire’s data-science portfolio. Built like a book you can walk through.
        </p>
        <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-paper/75">
          Master of Data Science at Monash, looking for a Data Scientist, Data Analyst, or Data Engineer role. The site
          has two volumes. Volume Two is six main projects — digital twins of drones, a power grid, a body, a port, a
          factory cell, and a farm. Volume One is the career told as six chapters. Click a chapter, scroll the story,
          open the live board if you want the numbers.
        </p>
        <p className="mt-3 max-w-md font-ui text-[11px] uppercase tracking-[0.22em] text-gold/60">{profile.motto}</p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <VolumeSwitch />
          <a href="#twins" className="btn-manga border-gold bg-gold px-9 py-3.5 text-ink">
            See the main projects
          </a>
          <a href="#how" className="btn-manga border-paper/30 px-8 py-3.5 text-paper/85 hover:border-gold hover:text-gold">
            How this site works
          </a>
          <Link to="/resume" className="px-3 font-ui text-[11px] uppercase tracking-[0.25em] text-paper/55 hover:text-gold">
            Résumé
          </Link>
        </div>

        <nav aria-label="Volume Two" className="mt-10 flex flex-wrap gap-2">
          {digitalTwins.map((t) => {
            const fig = twinFigureMetadata[t.figure];
            return (
              <Link
                key={t.id}
                to={`/${t.figure}`}
                title={t.plain}
                className="rounded-full border border-white/10 bg-ink/45 px-3.5 py-1.5 font-ui text-[10px] uppercase tracking-[0.18em] text-paper/80 backdrop-blur-sm transition hover:border-gold/50 hover:text-gold"
              >
                <span className="mr-2 font-kanji text-sm normal-case tracking-normal" style={{ color: fig.color }}>
                  {fig.kanji}
                </span>
                {t.name}
              </Link>
            );
          })}
        </nav>

        <nav aria-label="Volume One" className="mt-4 flex flex-wrap gap-2">
          {characterOrder.map((key, i) => {
            const meta = characterMetadata[key];
            return (
              <Link
                key={key}
                to={`/${key}`}
                title={chapterPlain[key]}
                className="rounded-full border border-white/10 bg-ink/45 px-3.5 py-1.5 font-ui text-[10px] uppercase tracking-[0.18em] text-paper/70 backdrop-blur-sm transition hover:border-gold/50 hover:text-gold"
              >
                <span className="mr-2 font-kanji text-sm normal-case tracking-normal" style={{ color: meta.color }}>
                  {meta.kanji}
                </span>
                {String(i + 1).padStart(2, '0')} {meta.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </section>
  );
};
