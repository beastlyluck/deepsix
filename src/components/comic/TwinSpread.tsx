import { useCallback, useState, type ReactNode } from 'react';
import type { DigitalTwin } from '../../data/digitalTwins';
import type { TwinStory } from '../../data/twinStories';
import { ComicPanel, Caption, Speech, Sfx } from './ComicPanel';
import { PanelLightbox } from './PanelLightbox';

type PanelId = 'problem' | 'approach' | 'spec' | 'result' | 'lesson' | 'files';

export function TwinSpread({ twin, story, pageNumber }: { twin: DigitalTwin; story: TwinStory; pageNumber: number }) {
  const [open, setOpen] = useState<PanelId | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const accent = twin.accent;

  const titles: Record<PanelId, string> = {
    problem: `${story.volume} · The problem`,
    approach: `${story.volume} · The approach`,
    spec: `${story.volume} · Spec`,
    result: `${story.volume} · The result`,
    lesson: `${story.volume} · What it taught`,
    files: `${story.volume} · Files & stack`,
  };

  const content = (id: PanelId, expanded: boolean): ReactNode => {
    const big = expanded ? 'text-lg leading-relaxed' : 'text-sm leading-relaxed';
    switch (id) {
      case 'problem':
        return (
          <div className="flex h-full flex-col gap-3">
            <p className="font-ui text-[10px] uppercase tracking-[0.3em] text-ink/50">{twin.industry}</p>
            <h3 className={`font-display leading-none text-ink ${expanded ? 'text-5xl' : 'text-3xl'}`}>{twin.name}</h3>
            <Caption className={big}>{story.problem}</Caption>
            <p className="mt-auto font-ui text-[10px] uppercase tracking-wider text-ink/55">{story.asset}</p>
          </div>
        );
      case 'approach':
        return (
          <div className="flex h-full flex-col gap-3">
            <Speech speaker={story.quote.speaker} className={big}>
              {story.quote.text}
            </Speech>
            <p className={`font-body text-ink/85 ${big}`}>{story.approach}</p>
          </div>
        );
      case 'spec':
        return (
          <div className="flex h-full flex-col gap-3">
            <p className={`font-body italic text-ink/70 ${expanded ? 'text-base' : 'text-xs'}`}>{story.bottleneck}</p>
            <pre className="overflow-x-auto border-2 border-ink bg-white px-2 py-1.5 font-ui text-[10px] leading-relaxed text-ink/80">
              {story.topology}
            </pre>
            <div className={`grid gap-2 ${expanded ? 'sm:grid-cols-2' : ''}`}>
              {(expanded ? story.docs : story.docs.slice(0, 2)).map((d) => (
                <div key={d.title} className="border-2 border-ink bg-white px-2 py-1.5">
                  <p className="font-ui text-[10px] uppercase tracking-wider text-ink/50">{d.title}</p>
                  <p className={`font-body text-ink/80 ${expanded ? 'text-sm' : 'text-xs'}`}>{d.body}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'result':
        return (
          <div className="flex h-full flex-col gap-3">
            <Sfx text={story.sfx} accent={accent} className={expanded ? 'text-7xl' : 'text-4xl'} />
            <div className={`grid gap-2 ${expanded ? 'grid-cols-4' : 'grid-cols-2'}`}>
              {Object.entries(story.metrics).map(([k, v]) => (
                <div key={k} className="border-2 border-ink bg-white px-2 py-1.5">
                  <div className={`font-display leading-none text-ink ${expanded ? 'text-3xl' : 'text-xl'}`}>{v}</div>
                  <div className="mt-1 font-ui text-[9px] uppercase tracking-wider text-ink/55">{k}</div>
                </div>
              ))}
            </div>
            <Caption className={big}>{story.result}</Caption>
          </div>
        );
      case 'lesson':
        return (
          <div className="flex h-full flex-col justify-between gap-3">
            <p className={`font-display leading-tight text-ink ${expanded ? 'text-4xl' : 'text-2xl'}`}>{story.lesson}</p>
            <Caption className={big}>{story.honesty}</Caption>
          </div>
        );
      case 'files':
        return (
          <div className={`grid gap-4 ${expanded ? 'sm:grid-cols-3' : 'sm:grid-cols-3'}`}>
            <div>
              <p className="font-ui text-[10px] uppercase tracking-wider text-ink/50">Run</p>
              <p className="mt-1 font-ui text-xs text-ink">{twin.run}</p>
              <p className="mt-1 font-ui text-[10px] text-ink/55">projects/{twin.id}/ · site/ · docs/</p>
            </div>
            <div>
              <p className="font-ui text-[10px] uppercase tracking-wider text-ink/50">Code</p>
              <a
                href={twin.github}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block font-ui text-xs text-ink underline decoration-ink/40 hover:decoration-ink"
                onClick={(e) => e.stopPropagation()}
              >
                github.com/beastlyluck/{twin.id}
              </a>
              <a
                href={`/boards/${twin.id}/docs/index.html`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block font-ui text-xs text-ink underline decoration-ink/40 hover:decoration-ink"
                onClick={(e) => e.stopPropagation()}
              >
                Full technical docs
              </a>
            </div>
            <div>
              <p className="font-ui text-[10px] uppercase tracking-wider text-ink/50">Stack</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {story.stackParts.map((t) => (
                  <span key={t} className="rounded-sm bg-ink px-1.5 py-0.5 font-ui text-[10px] text-paper">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <article className="comic-page" aria-label={`${twin.name} comic page`}>
      <header className="comic-page__header">
        <span>
          {story.volume} · {twin.industry}
        </span>
        <span>p.{pageNumber}</span>
      </header>
      <div className="comic-spread">
        <ComicPanel label="Problem" kind="caption" accent={accent} className="comic-area-problem" onExpand={() => setOpen('problem')}>
          {content('problem', false)}
        </ComicPanel>
        <ComicPanel label="Approach" kind="speech" accent={accent} className="comic-area-approach" onExpand={() => setOpen('approach')} tilt={-0.3}>
          {content('approach', false)}
        </ComicPanel>
        <ComicPanel label="Spec" kind="demo" accent={accent} className="comic-area-demo" onExpand={() => setOpen('spec')}>
          {content('spec', false)}
        </ComicPanel>
        <ComicPanel label="Result" kind="sfx" accent={accent} className="comic-area-result" onExpand={() => setOpen('result')} tilt={0.4}>
          {content('result', false)}
        </ComicPanel>
        <ComicPanel label="Lesson" kind="plain" accent={accent} className="comic-area-lesson" onExpand={() => setOpen('lesson')}>
          {content('lesson', false)}
        </ComicPanel>
        <ComicPanel label="Files" kind="plain" accent={accent} className="comic-area-files" onExpand={() => setOpen('files')}>
          {content('files', false)}
        </ComicPanel>
      </div>
      <PanelLightbox open={open !== null} onClose={close} title={open ? titles[open] : undefined} accent={accent}>
        {open && (
          <ComicPanel
            kind={open === 'spec' ? 'demo' : open === 'approach' ? 'speech' : open === 'problem' ? 'caption' : open === 'result' ? 'sfx' : 'plain'}
            accent={accent}
            expanded
          >
            {content(open, true)}
          </ComicPanel>
        )}
      </PanelLightbox>
    </article>
  );
}
