import { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { profile } from '../data/profile';
import { experience } from '../data/experience';
import { coursework, courseParts, certifications, languages, type CourseUnit } from '../data/coursework';
import { skills, skillCategories } from '../data/skills';
import { SkillsRadar } from '../components/ui/SkillsRadar';
import { SiteFooter } from '../components/layout/SiteFooter';
import { Logo3D } from '../components/three/Logo3D';
import { ComicPanel, Caption } from '../components/comic/ComicPanel';
import { PanelLightbox } from '../components/comic/PanelLightbox';
import { Halftone } from '../systems/manga/Halftone';
import { fieldDesks } from '../data/fieldDesks';
import { digitalTwins } from '../data/digitalTwins';
import { twinStories } from '../data/twinStories';
import { demoRegistry } from '../demos/registry';

const GOLD = '#FFD700';

function statusTone(s: CourseUnit['status']) {
  return s === 'completed' ? { bg: '#A5D6A7', label: 'Completed' } : s === 'in-progress' ? { bg: '#FFE082', label: 'In progress' } : { bg: '#E0E0E0', label: 'Planned' };
}

export function Resume() {
  const [open, setOpen] = useState<null | 'units' | 'skills' | 'pdf' | 'desks'>(null);
  const [deskId, setDeskId] = useState<string | null>(null);
  const DeskDemo = deskId ? demoRegistry[deskId] : null;
  const parts: CourseUnit['part'][] = ['A', 'B', 'C'];

  const unitsBlock = (expanded: boolean) => (
    <div className="space-y-5">
      {parts.map((p) => (
        <div key={p}>
          <p className="font-display text-xl text-ink">{courseParts[p].label}</p>
          <p className="font-body text-xs text-ink/60">{courseParts[p].blurb}</p>
          <div className={`mt-2 grid gap-2 ${expanded ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {coursework
              .filter((u) => u.part === p)
              .map((u) => {
                const tone = statusTone(u.status);
                return (
                  <div key={u.code} className="border-2 border-ink bg-white px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-ui text-[11px] font-semibold text-ink">
                        {u.code} <span className="font-normal text-ink/60">· {u.points} pts</span>
                      </span>
                      <span className="rounded-sm px-1.5 py-0.5 font-ui text-[9px] uppercase tracking-wider text-ink" style={{ background: tone.bg }}>
                        {tone.label}
                      </span>
                    </div>
                    <p className="font-body text-sm text-ink">{u.title}</p>
                    {expanded && <p className="mt-1 font-body text-xs text-ink/65">{u.summary}</p>}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {u.skills.map((s) => (
                        <span key={s} className="rounded-sm bg-ink/8 px-1.5 py-0.5 font-ui text-[9px] text-ink/75">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );

  const skillsBlock = (expanded: boolean) => (
    <div className={`grid gap-3 ${expanded ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {skillCategories.map((cat) => (
        <div key={cat.key} className="border-2 border-ink bg-white px-3 py-2">
          <p className="font-display text-base text-ink">{cat.label}</p>
          <ul className="mt-1 space-y-1">
            {skills
              .filter((s) => s.category === cat.key)
              .map((s) => (
                <li key={s.name} className="font-ui text-[11px] text-ink/85">
                  <div className="flex items-center justify-between gap-2">
                    <span>{s.name}</span>
                    {s.monashUnit && <span className="text-[9px] text-ink/50">{s.monashUnit}</span>}
                  </div>
                  <div className="mt-0.5 h-1 bg-ink/10">
                    <div className="h-full" style={{ width: `${s.proficiency}%`, background: '#151515' }} />
                  </div>
                  {expanded && s.description && <p className="mt-0.5 text-[10px] text-ink/55">{s.description}</p>}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative min-h-screen bg-ink">
      <Halftone opacity={0.02} size={30} />

      <section className="relative overflow-hidden border-b border-white/10 pt-28 pb-12">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 md:grid-cols-[220px_1fr]">
          <div className="h-56 w-full md:h-64">
            <Canvas camera={{ position: [0, 0, 4.2], fov: 38 }} dpr={[1, 1.6]} gl={{ alpha: true, antialias: true }}>
              <Suspense fallback={null}>
                <ambientLight intensity={0.5} />
                <spotLight position={[3, 4, 4]} intensity={2} color="#fff3dc" />
                <Suspense fallback={null}><Environment preset="night" /></Suspense>
                <Logo3D scale={1.1} spin={0.5} />
              </Suspense>
            </Canvas>
          </div>
          <div>
            <p className="font-ui text-[11px] tracking-[0.35em] text-gold/70">CHARACTER SHEET · 履歴書</p>
            <h1 className="mt-1 font-display text-5xl text-gold md:text-7xl">{profile.name}</h1>
            <p className="mt-2 font-body text-lg text-paper/75">
              {profile.title} · {profile.subtitle}
            </p>
            <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-paper/65">{profile.summary}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href={profile.resumeUrl} download className="btn-manga border-gold bg-gold px-7 py-3 text-ink">
                Download PDF
              </a>
              <button onClick={() => setOpen('pdf')} className="font-ui text-[11px] uppercase tracking-[0.2em] text-paper/60 hover:text-gold">
                View in browser
              </button>
              <a href={`mailto:${profile.email}`} className="font-ui text-[11px] uppercase tracking-[0.2em] text-paper/60 hover:text-gold">
                {profile.email}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <article className="comic-page">
          <header className="comic-page__header">
            <span>Character sheet · Atharva Jitendra Khaire</span>
            <span>Monash · Master of Data Science</span>
          </header>
          <div className="comic-story-grid">
            <ComicPanel label="Education" kind="caption" accent={GOLD} className="comic-story-premise">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="font-display text-2xl text-ink">Master of Data Science</p>
                  <p className="font-ui text-xs text-ink/70">Monash University · Clayton, Melbourne · coursework complete</p>
                  <Caption className="mt-2 text-sm">
                    Foundations (Python, databases) and core master’s study are complete, including project management (FIT5057) and IT research methods (FIT5125). Now completing professional practice (FIT5122) and the industry experience studio project (FIT5120). Units below follow the Monash Handbook (C6004).
                  </Caption>
                </div>
                <div>
                  <p className="font-display text-2xl text-ink">Bachelor of Computer Science</p>
                  <p className="font-ui text-xs text-ink/70">Savitribai Phule Pune University · graduated January 2024</p>
                  <Caption className="mt-2 text-sm">Capstone: recreating historical figures in a virtual environment using Unreal Engine and AI.</Caption>
                </div>
              </div>
            </ComicPanel>

            <ComicPanel label="Digital twins" kind="plain" accent={GOLD} className="comic-story-premise">
              <p className="mb-2 font-body text-xs text-ink/65">Main projects. Six industries, six stacks. Each one is a chapter.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {digitalTwins.map((t) => {
                  const s = twinStories[t.id];
                  return (
                    <Link key={t.id} to={`/${t.figure}`} className="border-2 border-ink bg-white px-3 py-2 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-ui text-[10px] uppercase tracking-wider text-ink/50">{s.volume}</p>
                        <span className="font-kanji text-lg" style={{ color: t.accent }}>
                          {s.kanji}
                        </span>
                      </div>
                      <p className="font-display text-lg text-ink">{t.name}</p>
                      <p className="mt-1 font-body text-xs text-ink/70">{s.hook}</p>
                    </Link>
                  );
                })}
              </div>
            </ComicPanel>

            <ComicPanel label="Field desks" kind="plain" accent={GOLD} className="comic-story-premise" onExpand={() => setOpen('desks')}>
              <div className="grid gap-2 sm:grid-cols-2">
                {fieldDesks.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setDeskId(d.id);
                      setOpen('desks');
                    }}
                    className="border-2 border-ink bg-white px-3 py-2 text-left"
                  >
                    <p className="font-ui text-[10px] uppercase tracking-wider text-ink/50">{d.domain}</p>
                    <p className="font-display text-lg text-ink">{d.title}</p>
                    <p className="mt-1 font-body text-xs text-ink/70">{d.blurb}</p>
                  </button>
                ))}
              </div>
            </ComicPanel>

            <ComicPanel label="Coursework" kind="plain" accent={GOLD} className="comic-story-premise" onExpand={() => setOpen('units')}>
              {unitsBlock(false)}
            </ComicPanel>

            <ComicPanel label="Skills" kind="plain" accent={GOLD} className="comic-story-premise" onExpand={() => setOpen('skills')}>
              <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
                <div className="rounded border-2 border-ink bg-ink p-3">
                  <SkillsRadar interactive={false} />
                </div>
                {skillsBlock(false)}
              </div>
            </ComicPanel>

            {experience.map((exp, i) => (
              <ComicPanel key={exp.id} label={exp.type} kind="caption" accent={GOLD} tilt={i % 2 ? 0.3 : -0.3}>
                <p className="font-display text-xl text-ink">{exp.role}</p>
                <p className="font-ui text-xs text-ink/70">
                  {exp.company} · {exp.location}
                </p>
                <p className="font-ui text-[10px] text-ink/50">{exp.period}</p>
                <ul className="mt-2 space-y-1 font-body text-xs text-ink/85">
                  {exp.highlights.slice(0, 3).map((h) => (
                    <li key={h} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-ink" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </ComicPanel>
            ))}

            <ComicPanel label="Certifications" kind="plain" accent={GOLD} className="comic-story-premise">
              <div className="grid gap-3 sm:grid-cols-3">
                {certifications.map((c) => (
                  <div key={c.name} className="border-2 border-ink bg-white px-3 py-2">
                    <p className="font-body text-sm font-semibold text-ink">{c.name}</p>
                    <p className="font-ui text-[10px] text-ink/60">
                      {c.issuer} · {c.date}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.skills.map((s) => (
                        <span key={s} className="rounded-sm bg-ink/8 px-1.5 py-0.5 font-ui text-[9px] text-ink/75">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 font-ui text-[11px] text-ink/60">
                Languages: {languages.join(' · ')} · Interests: driving, basketball, badminton, swimming, video editing, gaming
              </p>
            </ComicPanel>
          </div>
        </article>
      </section>

      <PanelLightbox
        open={open !== null}
        onClose={() => {
          setOpen(null);
          setDeskId(null);
        }}
        title={open === 'units' ? 'Coursework · Monash MDS' : open === 'skills' ? 'Skills' : open === 'desks' ? 'Field desks' : 'Résumé PDF'}
        accent={GOLD}
      >
        {open === 'units' && (
          <ComicPanel kind="plain" accent={GOLD} expanded>
            {unitsBlock(true)}
          </ComicPanel>
        )}
        {open === 'skills' && (
          <ComicPanel kind="plain" accent={GOLD} expanded>
            {skillsBlock(true)}
          </ComicPanel>
        )}
        {open === 'desks' && (
          <ComicPanel kind="plain" accent={GOLD} expanded>
            <div className="mb-3 flex flex-wrap gap-2">
              {fieldDesks.map((d) => (
                <a key={d.id} href={d.github} target="_blank" rel="noreferrer" className="font-ui text-[11px] text-ink/70 underline">
                  {d.title}
                </a>
              ))}
            </div>
            {DeskDemo ? <DeskDemo accent={GOLD} expanded /> : <p className="font-body text-sm text-ink/70">Pick a desk on the sheet.</p>}
          </ComicPanel>
        )}
        {open === 'pdf' && <iframe title="Résumé" src={profile.resumeUrl} className="h-[75vh] w-full border-[3px] border-ink bg-white" />}
      </PanelLightbox>

      <SiteFooter />
    </div>
  );
}
