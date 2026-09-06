import { Link } from 'react-router-dom';
import { profile } from '../../data/profile';
import { DeepSixLogo } from '../brand/DeepSixLogo';

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10 py-12 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <div className="mb-4 flex justify-center">
          <DeepSixLogo size="sm" />
        </div>
        <p className="font-ui text-sm text-paper/40 mb-4">
          DEEPSIX • {profile.name} • {profile.title} @ Monash University
        </p>
        <div className="mb-5 flex flex-wrap justify-center gap-5 font-ui text-[11px] uppercase tracking-[0.18em] text-paper/45">
          <Link to="/itachi" className="hover:text-gold">Vol. 01</Link>
          <Link to="/twins" className="hover:text-gold">Vol. 02</Link>
          <Link to="/resume" className="hover:text-gold">Résumé</Link>
          <Link to="/contact" className="hover:text-gold">Afterword</Link>
        </div>
        <div className="flex justify-center gap-6 text-paper/50">
          <a
            href={profile.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gold transition-colors"
            aria-label="GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <a href={profile.social.email} className="hover:text-gold transition-colors" aria-label="Email">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
