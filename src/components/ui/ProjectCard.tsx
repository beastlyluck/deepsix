import React, { useRef, useEffect } from 'react';
import { Project, VisualizationType } from '../../data/openDataSources';
import { gsap } from 'gsap';

interface ProjectCardProps {
  project: Project;
  index: number;
  onOpen: (project: Project) => void;
}

const visualizationIcons: Record<VisualizationType, string> = {
  'interactive-chart': '📊',
  '3d-tensor': '🔲',
  'attention-map': '👁️',
  'architecture-diagram': '🏗️',
  'training-curve': '📈',
  'confusion-matrix': '🔢',
  'latent-walk': '🌌',
  'inference-video': '🎬',
  'onnx-graph': '🔗',
  'keypoint-heatmap': '🎯',
  'segmentation-overlay': '🎨',
  'graph-viz': '🕸️',
  'attention-web': '🕸️',
  'particle-field': '✨',
  'shader-playground': '🎮',
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, onOpen }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current, {
        y: 50,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        delay: index * 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
        },
      });
    }, cardRef);
    return () => ctx.revert();
  }, [index]);

  return (
    <article
      ref={cardRef}
      className="project-card group relative"
      onClick={() => onOpen(project)}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(project); }}
      role="button"
      aria-label={`View ${project.title} project`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 right-0 m-3 text-xs font-ui px-2 py-1 rounded bg-ink/80 border border-paper/20 text-paper/60">
        {project.difficulty.toUpperCase()}
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl text-gold mb-1 group-hover:text-gold/80 transition-colors">
              {project.title}
            </h3>
            <p className="font-ui text-xs text-paper/50 uppercase tracking-wider">{project.domain}</p>
          </div>
          <div className="flex items-center gap-2 text-paper/40">
            {project.visualizations.slice(0, 3).map((viz, i) => (
              <span key={i} className="text-lg" title={viz}>{visualizationIcons[viz]}</span>
            ))}
            {project.visualizations.length > 3 && (
              <span className="font-ui text-xs bg-ink/80 px-2 py-0.5 rounded">+{project.visualizations.length - 3}</span>
            )}
          </div>
        </div>

        <p className="font-body text-sm text-paper/70 leading-relaxed line-clamp-3">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {project.techStack.slice(0, 5).map((tech) => (
            <span key={tech} className="font-ui text-xs px-2 py-1 bg-paper/5 border border-paper/10 rounded text-paper/60 hover:border-gold/50 hover:text-gold transition-colors">
              {tech}
            </span>
          ))}
          {project.techStack.length > 5 && (
            <span className="font-ui text-xs px-2 py-1 bg-paper/5 border border-paper/10 rounded text-paper/50">
              +{project.techStack.length - 5}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-paper/10">
          {Object.entries(project.metrics).slice(0, 3).map(([key, value]) => (
            <div key={key} className="text-center p-2 bg-ink/50 rounded">
              <div className="font-display text-lg text-gold">{value}</div>
              <div className="font-ui text-xs text-paper/50">{key}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3">
          <span className="font-ui text-xs text-paper/40">
            Dataset: {project.dataset.split('(')[0].trim()}
          </span>
          <span className="font-ui text-xs text-gold/70 group-hover:text-gold transition-colors">
            View Details →
          </span>
        </div>
      </div>

    </article>
  );
};