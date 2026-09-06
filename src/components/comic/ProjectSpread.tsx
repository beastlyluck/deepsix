import { useCallback, useState, type ReactNode } from 'react';
import type { Project } from '../../data/openDataSources';
import { projectStories, projectFolder, projectFolderUrl } from '../../data/projectStories';
import { demoRegistry } from '../../demos/registry';
import { ComicPanel, Caption, Speech, Sfx } from './ComicPanel';
import { PanelLightbox } from './PanelLightbox';

type PanelId = 'problem' | 'approach' | 'demo' | 'result' | 'lesson' | 'files';

interface ProjectSpreadProps {
  project: Project;
  index: number;
  accent: string;
  characterName: string;
  sfx: string;
  pageNumber: number;
}

/** One project = one comic page: problem → approach → live demo → result → lesson → files. */
export function ProjectSpread({ project, index, accent, characterName, sfx, pageNumber }: ProjectSpreadProps) {
  const story = projectStories[project.id];
  const Demo = demoRegistry[project.id];
  const [open, setOpen] = useState<PanelId | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const caseNo = String(index + 1).padStart(2, '0');

  const titles: Record<PanelId, string> = {
    problem: `Case ${caseNo} · The problem`,
    approach: `Case ${caseNo} · The approach`,
    demo: `Case ${caseNo} · Live demo`,
    result: `Case ${caseNo} · The result`,
    lesson: `Case ${caseNo} · What it taught`,
    files: `Case ${caseNo} · Files & data`,
  };

  const content = (id: PanelId, expanded: boolean): ReactNode => {
    const big = expanded ? 'text-lg leading-relaxed' : 'text-sm leading-relaxed';
    switch (id) {
      case 'problem':
        return (
          <div className="flex h-full flex-col gap-3">
            <p className="font-ui text-[10px] uppercase tracking-[0.3em] text-ink/50">{project.domain}</p>
            <h3 className={`font-display text-ink ${expanded ? 'text-5xl' : 'text-3xl'} leading-none`}>{project.title}</h3>
            <Caption className={big}>{story?.problem ?? project.description}</Caption>
            <div className="mt-auto flex flex-wrap gap-1.5">
              {project.tags.map((t) => (
                <span key={t} className="rounded-sm border border-ink/40 px-1.5 py-0.5 font-ui text-[10px] uppercase tracking-wider text-ink/75">
                  {t}
                </span>
              ))}
            </div>
          </div>
        );
      case 'approach':
        return (
          <div className="flex h-full flex-col gap-3">
            <Speech speaker={characterName} className={big}>
              {story?.quote.text ?? project.longDescription}
            </Speech>
            <p className={`font-body text-ink/85 ${big}`}>{story?.approach ?? project.longDescription}</p>
            <p className="mt-auto font-ui text-[11px] text-ink/60">
              <span className="uppercase tracking-wider">Architecture</span> · {project.architecture}
            </p>
          </div>
        );
      case 'demo':
        return (
          <div className="flex h-full flex-col gap-3">
            <p className={`font-body italic text-ink/70 ${expanded ? 'text-base' : 'text-xs'}`}>{story?.demoCaption}</p>
            {Demo ? <Demo accent={accent} expanded={expanded} /> : <p className="font-ui text-xs text-ink/60">Demo coming soon.</p>}
          </div>
        );
      case 'result':
        return (
          <div className="flex h-full flex-col gap-3">
            <Sfx text={sfx} accent={accent} className={expanded ? 'text-7xl' : 'text-4xl'} />
            <div className={`grid gap-2 ${expanded ? 'grid-cols-4' : 'grid-cols-2'}`}>
              {Object.entries(project.metrics).map(([k, v]) => (
                <div key={k} className="border-2 border-ink bg-white px-2 py-1.5">
                  <div className={`font-display leading-none text-ink ${expanded ? 'text-4xl' : 'text-2xl'}`}>{String(v)}</div>
                  <div className="mt-1 font-ui text-[9px] uppercase tracking-wider text-ink/55">{k}</div>
                </div>
              ))}
            </div>
            <Caption className={big}>{story?.result}</Caption>
          </div>
        );
      case 'lesson':
        return (
          <div className="flex h-full flex-col justify-between gap-3">
            <p className={`font-display text-ink ${expanded ? 'text-4xl' : 'text-2xl'} leading-tight`}>{story?.lesson}</p>
            <p className={`font-body text-ink/70 ${big}`}>{project.longDescription}</p>
          </div>
        );
      case 'files':
        return (
          <div className={`grid gap-4 ${expanded ? 'sm:grid-cols-3' : 'sm:grid-cols-3'}`}>
            <div>
              <p className="font-ui text-[10px] uppercase tracking-wider text-ink/50">Source folder</p>
              <a href={projectFolderUrl(project.id)} target="_blank" rel="noopener noreferrer" className="mt-1 block font-ui text-xs text-ink underline decoration-ink/40 hover:decoration-ink" onClick={(e) => e.stopPropagation()}>
                {projectFolder(project.id)}/
              </a>
              <p className="mt-1 font-ui text-[10px] text-ink/55">README.md · main.py · outputs/</p>
            </div>
            <div>
              <p className="font-ui text-[10px] uppercase tracking-wider text-ink/50">Dataset</p>
              <a href={project.datasetUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block font-body text-xs text-ink underline decoration-ink/40 hover:decoration-ink" onClick={(e) => e.stopPropagation()}>
                {project.dataset}
              </a>
            </div>
            <div>
              <p className="font-ui text-[10px] uppercase tracking-wider text-ink/50">Stack</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {project.techStack.map((t) => (
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
    <article className="comic-page" aria-label={`${project.title} comic page`}>
      <header className="comic-page__header">
        <span>
          Case {caseNo} · {project.domain}
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
        <ComicPanel label="Live demo" kind="demo" accent={accent} className="comic-area-demo" onExpand={() => setOpen('demo')}>
          {content('demo', false)}
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
          <ComicPanel kind={open === 'demo' ? 'demo' : open === 'approach' ? 'speech' : open === 'problem' ? 'caption' : open === 'result' ? 'sfx' : 'plain'} accent={accent} expanded>
            {content(open, true)}
          </ComicPanel>
        )}
      </PanelLightbox>
    </article>
  );
}
