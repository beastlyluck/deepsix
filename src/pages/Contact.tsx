import { ContactForm } from '../components/ui/ContactForm';
import { SkillsRadar } from '../components/ui/SkillsRadar';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SceneBackdrop } from '../components/three/SceneBackdrop';
import { KrishnaScene } from '../components/three/KrishnaScene';
import { DeepSixLogo } from '../components/brand/DeepSixLogo';
import { profile } from '../data/profile';
import { experience } from '../data/experience';
import { Halftone } from '../systems/manga/Halftone';
import { figureModels } from '../data/figureModels';

export function Contact() {
  return (
    <div className="relative min-h-screen bg-ink">
      <Halftone opacity={0.02} size={30} />

      <section className="relative h-[92svh] overflow-hidden border-b border-white/10">
        <SceneBackdrop camera={figureModels.krishna.camera} lookAt={figureModels.krishna.lookAt}>
          <KrishnaScene />
        </SceneBackdrop>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/80 to-transparent pt-16">
          <div className="mx-auto flex max-w-2xl flex-col items-center px-6 pb-7 text-center">
            <DeepSixLogo size="sm" glowing />
            <p className="mt-2 font-ui text-[10px] tracking-[0.35em] text-gold/70">AFTERWORD · श्रीकृष्ण · あとがき</p>
            <h1 className="font-display text-2xl text-gold md:text-4xl">The flute after the last panel</h1>
            <p className="mx-auto mt-2 max-w-xl font-body text-sm text-paper/70">
              The volume closes. Krishna stands in the gutter: work, then let go of the fruit. If you need a data scientist who treats a system as a story you can hold — write here.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-12" aria-label="Afterword">
        <div className="mx-auto mb-12 max-w-3xl">
          <article className="comic-page">
            <header className="comic-page__header">
              <span>Afterword · Krishna</span>
              <span>last page</span>
            </header>
            <p className="font-body text-sm leading-relaxed text-ink/85">
              This last page is not another chapter of a fighter. It is the author stepping out. In the Gita, Krishna does not ask Arjuna to abandon the field — he asks him to see clearly, act, and not cling. That is also how this manuscript was written: eighteen cases, each a twin you can question, none of them a shrine.
            </p>
            <p className="mt-3 font-body text-sm leading-relaxed text-ink/70">
              The figure is Shri Krishna Chakra-dhari. Credit:{' '}
              <a className="underline decoration-ink/40 hover:decoration-ink" href="https://sketchfab.com/3d-models/shri-krishna-chakra-dhari-9e2655fd5ca5448cb8d98a5f4b0e629b" target="_blank" rel="noreferrer">
                Vijay Saini
              </a>
              , CC BY 4.0. The chakra turns. The work continues.
            </p>
          </article>
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 items-start">
          <div className="space-y-8">
            <div className="manga-ink-panel">
              <h2 className="font-display text-2xl text-gold mb-6">Get In Touch</h2>
              <ContactForm />
            </div>

            <div className="manga-ink-panel">
              <h2 className="font-display text-2xl text-gold mb-6">Direct Contact</h2>
              <div className="space-y-4 font-ui text-sm">
                <div className="flex items-center gap-4 text-paper/70">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-paper/40 text-xs uppercase tracking-wider">Email</div>
                    <a href={`mailto:${profile.email}`} className="text-paper hover:text-gold transition-colors">
                      {profile.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-paper/70">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-paper/40 text-xs uppercase tracking-wider">Phone</div>
                    <a href={`tel:${profile.phone}`} className="text-paper hover:text-gold transition-colors">
                      {profile.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-paper/70">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-paper/40 text-xs uppercase tracking-wider">Location</div>
                    <span>{profile.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="manga-ink-panel">
              <h2 className="font-display text-2xl text-gold mb-6">Skills Overview</h2>
              <SkillsRadar />
            </div>

            <div className="manga-ink-panel">
              <h2 className="font-display text-2xl text-gold mb-6">Experience</h2>
              <div className="space-y-6">
                {experience.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-gold/30 pl-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-lg text-paper">{exp.role}</h3>
                        <p className="font-ui text-sm text-gold">{exp.company}</p>
                      </div>
                      <span className="font-ui text-xs text-paper/50 whitespace-nowrap">{exp.period}</span>
                    </div>
                    <p className="font-body text-sm text-paper/60 mt-1">{exp.location}</p>
                    <ul className="mt-3 space-y-1 font-ui text-xs text-paper/50">
                      {exp.highlights.slice(0, 2).map((h) => (
                        <li key={h} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-gold/50" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="manga-ink-panel">
              <h2 className="font-display text-2xl text-gold mb-6">Education</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-lg text-paper">Master of Data Science</h3>
                  <p className="font-ui text-sm text-gold">Monash University, Melbourne</p>
                  <p className="font-ui text-xs text-paper/50">Coursework complete · professional practice & industry studio</p>
                </div>
                <div className="border-t border-ink-lighter pt-4">
                  <h3 className="font-display text-lg text-paper">Bachelor of Engineering (Computer Science)</h3>
                  <p className="font-ui text-sm text-gold">Savitribai Phule Pune University</p>
                  <p className="font-ui text-xs text-paper/50">
                    B.E. · Graduated January 2024 · Capstone: historical figures in a virtual environment using Unreal and AI
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
