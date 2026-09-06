import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Project, VisualizationType } from '../../data/openDataSources';
import { gsap } from 'gsap';
import { SFXText } from '../../systems/manga/SFXText';
import { characterMetadata } from '../../systems/manga/mangaTypes';
import { SpeechBubble } from '../../systems/manga/SpeechBubble';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
  isOpen: boolean;
}

function MetricsViz({ project }: { project: Project }) {
  const entries = Object.entries(project.metrics);
  return (
    <div className="rounded-lg bg-ink-lighter/50 p-5 space-y-3">
      <p className="font-ui text-xs uppercase tracking-wider text-paper/40">{project.domain}</p>
      {entries.map(([key, value], index) => {
        const width = `${Math.max(28, 100 - index * 8)}%`;
        return (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between gap-3 font-ui text-xs">
              <span className="text-paper/60">{key}</span>
              <span className="text-gold">{String(value)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-ink">
              <div className="h-full rounded-full bg-gold" style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const visualizationComponents: Record<VisualizationType, React.FC<{ project: Project }>> = {
  'interactive-chart': MetricsViz,
  '3d-tensor': MetricsViz,
  'attention-map': MetricsViz,
  'architecture-diagram': ({ project }) => (
    <div className="rounded-lg bg-ink-lighter/50 p-4">
      <pre className="whitespace-pre-wrap font-ui text-xs text-paper/70">{project.architecture}</pre>
    </div>
  ),
  'training-curve': MetricsViz,
  'confusion-matrix': MetricsViz,
  'latent-walk': MetricsViz,
  'inference-video': MetricsViz,
  'onnx-graph': MetricsViz,
  'keypoint-heatmap': MetricsViz,
  'segmentation-overlay': MetricsViz,
  'graph-viz': MetricsViz,
  'attention-web': MetricsViz,
  'particle-field': MetricsViz,
  'shader-playground': MetricsViz,
};

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose, isOpen }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeViz, setActiveViz] = useState<VisualizationType>(project?.visualizations[0] || 'architecture-diagram');

  useEffect(() => {
    if (project) setActiveViz(project.visualizations[0] || 'architecture-diagram');
  }, [project]);

  useEffect(() => {
    if (!isOpen || !project) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(modalRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out' });
      const contentEl = modalRef.current?.querySelector('.modal-content');
      if (contentEl) {
        gsap.fromTo(contentEl, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: 0.1, ease: 'power3.out' });
      }
    }, modalRef);

    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      ctx.revert();
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, project, onClose]);

  if (!isOpen || !project) return null;

  const meta = characterMetadata[project.character];
  const VizComponent = visualizationComponents[activeViz];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/95 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="modal-content w-full max-w-5xl max-h-[90vh] overflow-y-auto manga-panel relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-paper/10 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-kanji text-2xl" style={{ color: meta.color }}>{meta.kanji}</span>
              <span className="font-display text-xl text-gold">{meta.name}</span>
              <span className="font-ui text-xs px-2 py-1 bg-ink/50 border border-paper/20 rounded text-paper/60 uppercase">
                {project.difficulty}
              </span>
            </div>
            <h2 id="modal-title" className="font-display text-2xl md:text-3xl text-paper mb-2">{project.title}</h2>
            <p className="font-body text-paper/70">{project.longDescription}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-paper/5 hover:bg-paper/10 transition-colors text-paper/60 hover:text-paper"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {project.visualizations.map((viz) => (
              <button
                key={viz}
                onClick={() => setActiveViz(viz)}
                className={`font-ui text-sm px-3 py-1.5 rounded transition-all ${
                  activeViz === viz
                    ? 'bg-gold text-ink font-medium'
                    : 'bg-paper/5 text-paper/60 hover:bg-paper/10 hover:text-paper'
                }`}
              >
                {viz.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>

          <VizComponent project={project} />

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-display text-lg text-gold mb-3">Architecture</h3>
              <p className="font-ui text-sm text-paper/70 bg-ink/50 p-4 rounded font-mono whitespace-pre-wrap">{project.architecture}</p>
            </div>
            <div>
              <h3 className="font-display text-lg text-gold mb-3">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span key={tech} className="font-ui text-xs px-3 py-1 bg-paper/5 border border-paper/10 rounded text-paper/60">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-ink/50 p-4 rounded">
              <h4 className="font-display text-sm text-gold mb-2">Dataset</h4>
              <p className="font-body text-sm text-paper/70">{project.dataset}</p>
              <a href={project.datasetUrl} target="_blank" rel="noopener noreferrer" className="font-ui text-xs text-cyan hover:text-gold transition-colors inline-block mt-2">
                View Source →
              </a>
            </div>
            <div className="bg-ink/50 p-4 rounded">
              <h4 className="font-display text-sm text-gold mb-2">Key Metrics</h4>
              <div className="space-y-1">
                {Object.entries(project.metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between font-ui text-sm">
                    <span className="text-paper/60">{key}</span>
                    <span className="text-paper font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-ink/50 p-4 rounded">
              <h4 className="font-display text-sm text-gold mb-2">Links</h4>
              <div className="space-y-2">
                <a href={project.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-ui text-sm text-paper/70 hover:text-gold transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                  GitHub Repository
                </a>
                {project.demo && (
                  <a href={project.demo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-ui text-sm text-paper/70 hover:text-gold transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    Live Demo
                  </a>
                )}
                {project.paper && (
                  <a href={project.paper} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-ui text-sm text-paper/70 hover:text-gold transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    Paper
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SFXText
        text={project.character.toUpperCase()}
        color={meta.color}
        size="md"
        trigger="mount"
        className="absolute top-6 right-6 pointer-events-none"
      />
    </div>,
    document.body
  );
};