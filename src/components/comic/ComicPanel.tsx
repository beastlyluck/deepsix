import type { CSSProperties, ReactNode } from 'react';

export type PanelKind = 'caption' | 'speech' | 'demo' | 'sfx' | 'plain';

export interface ComicPanelProps {
  label?: string;
  kind?: PanelKind;
  accent: string;
  children: ReactNode;
  onExpand?: () => void;
  className?: string;
  style?: CSSProperties;
  expanded?: boolean;
  tilt?: number;
}

/**
 * A single comic-book panel: thick ink border on paper, optional label tab,
 * and a click-to-enlarge affordance. Interactive children should stopPropagation.
 */
export function ComicPanel({ label, kind = 'plain', accent, children, onExpand, className = '', style, expanded = false, tilt = 0 }: ComicPanelProps) {
  const clickable = !!onExpand && !expanded;
  return (
    <section
      className={`comic-panel comic-panel--${kind} ${clickable ? 'comic-panel--clickable' : ''} ${expanded ? 'comic-panel--expanded' : ''} ${className}`}
      style={{ ...style, ['--accent' as string]: accent, transform: tilt && !expanded ? `rotate(${tilt}deg)` : undefined }}
      onClick={clickable ? onExpand : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onExpand?.();
              }
            }
          : undefined
      }
      aria-label={clickable && label ? `Enlarge panel: ${label}` : undefined}
    >
      {label && <span className="comic-panel__label">{label}</span>}
      {clickable && (
        <span className="comic-panel__zoom" aria-hidden="true">
          ⤢
        </span>
      )}
      <div className="comic-panel__body">{children}</div>
    </section>
  );
}

export function Caption({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`comic-caption ${className}`}>{children}</p>;
}

export function Speech({ speaker, children, className = '' }: { speaker: string; children: ReactNode; className?: string }) {
  return (
    <div className={`comic-speech ${className}`}>
      <span className="comic-speech__speaker">{speaker}</span>
      <p>{children}</p>
    </div>
  );
}

export function Sfx({ text, accent, className = '' }: { text: string; accent: string; className?: string }) {
  return (
    <span className={`comic-sfx ${className}`} style={{ color: accent }} aria-hidden="true">
      {text}
    </span>
  );
}
