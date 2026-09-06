import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';

interface PanelLightboxProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  accent: string;
}

/** Fullscreen reader for a single comic panel. Escape or backdrop click closes. */
export function PanelLightbox({ open, onClose, title, children, accent }: PanelLightboxProps) {
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(sheet.current, { scale: 0.88, opacity: 0, rotate: -1.5 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.32, ease: 'power3.out' });
    });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      ctx.revert();
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm sm:p-8" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div
        ref={sheet}
        className="comic-lightbox relative max-h-[92vh] w-full max-w-5xl overflow-y-auto"
        style={{ ['--accent' as string]: accent }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-[3px] border-ink bg-[#FBF8F1] px-5 py-3">
          <span className="font-ui text-[11px] uppercase tracking-[0.25em] text-ink/60">{title ?? 'Panel'}</span>
          <button onClick={onClose} className="rounded border-2 border-ink px-3 py-1 font-ui text-[11px] uppercase tracking-wider text-ink hover:bg-ink hover:text-paper" aria-label="Close panel">
            Close · Esc
          </button>
        </div>
        <div className="p-6 sm:p-10">{children}</div>
      </div>
    </div>,
    document.body
  );
}
