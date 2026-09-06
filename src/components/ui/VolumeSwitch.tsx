import { useLocation, useNavigate } from 'react-router-dom';
import { volumeOf, VOL1_START, VOL2_INDEX } from '../../data/volumes';

export function VolumeSwitch({
  size = 'nav',
}: {
  size?: 'nav' | 'page';
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const vol = volumeOf(location.pathname);
  const page = size === 'page';

  return (
    <div
      role="group"
      aria-label="Switch between career chapters and main projects"
      className={`inline-flex shrink-0 items-center rounded-full border ${
        page ? 'border-ink bg-[#fbf8f1] p-1 shadow-[3px_3px_0_#151515]' : 'border-white/15 bg-ink/50 p-0.5'
      }`}
    >
      <button
        type="button"
        onClick={() => navigate(VOL1_START)}
        title="Volume One · career chapters"
        aria-pressed={vol === 1}
        className={`rounded-full font-ui uppercase tracking-[0.16em] transition-colors ${
          page ? 'px-4 py-2 text-[11px]' : 'px-2.5 py-1 text-[10px]'
        } ${vol === 1 ? (page ? 'bg-ink text-gold' : 'bg-white/15 text-gold') : page ? 'text-ink/55 hover:text-ink' : 'text-paper/50 hover:text-paper'}`}
      >
        Career
      </button>
      <button
        type="button"
        onClick={() => navigate(VOL2_INDEX)}
        title="Volume Two · main projects"
        aria-pressed={vol === 2}
        className={`rounded-full font-ui uppercase tracking-[0.16em] transition-colors ${
          page ? 'px-4 py-2 text-[11px]' : 'px-2.5 py-1 text-[10px]'
        } ${vol === 2 ? (page ? 'bg-ink text-gold' : 'bg-white/15 text-gold') : page ? 'text-ink/55 hover:text-ink' : 'text-paper/50 hover:text-paper'}`}
      >
        Work
      </button>
    </div>
  );
}
