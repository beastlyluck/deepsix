import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type SoundCue = 'page-turn';

interface SoundApi {
  muted: boolean;
  unlocked: boolean;
  setMuted: (v: boolean) => void;
  play: (cue: SoundCue) => void;
}

const SoundContext = createContext<SoundApi | null>(null);

const SOUL_VOL = 0.07;
const TURN_VOL = 0.55;

async function decode(ctx: AudioContext, url: string) {
  const res = await fetch(url);
  const raw = await res.arrayBuffer();
  return ctx.decodeAudioData(raw.slice(0));
}

export function SoundscapeProvider({ children }: { children: ReactNode }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const turnBuf = useRef<AudioBuffer | null>(null);
  const soulBuf = useRef<AudioBuffer | null>(null);
  const soulSrc = useRef<AudioBufferSourceNode | null>(null);
  const soulGain = useRef<GainNode | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [muted, setMutedState] = useState(() => localStorage.getItem('deepsix-muted') === '1');

  const ensure = useCallback(async () => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctxRef.current) ctxRef.current = new AC();
    if (ctxRef.current.state === 'suspended') await ctxRef.current.resume();
    setUnlocked(true);
    return ctxRef.current;
  }, []);

  const startSoul = useCallback(
    async (ctx: AudioContext) => {
      if (muted || soulSrc.current) return;
      if (!soulBuf.current) {
        try {
          soulBuf.current = await decode(ctx, '/audio/soul.mp3');
        } catch {
          return;
        }
      }
      if (soulSrc.current) return;
      const gain = ctx.createGain();
      gain.gain.value = SOUL_VOL;
      gain.connect(ctx.destination);
      const src = ctx.createBufferSource();
      src.buffer = soulBuf.current;
      src.loop = true;
      src.connect(gain);
      src.start();
      soulSrc.current = src;
      soulGain.current = gain;
    },
    [muted]
  );

  const stopSoul = useCallback(() => {
    try {
      soulSrc.current?.stop();
    } catch {
      /* already stopped */
    }
    soulSrc.current?.disconnect();
    soulGain.current?.disconnect();
    soulSrc.current = null;
    soulGain.current = null;
  }, []);

  const play = useCallback(
    (cue: SoundCue) => {
      if (muted || cue !== 'page-turn') return;
      void ensure().then(async (ctx) => {
        if (!muted) void startSoul(ctx);
        try {
          if (!turnBuf.current) turnBuf.current = await decode(ctx, '/audio/page-turn.mp3');
          const src = ctx.createBufferSource();
          src.buffer = turnBuf.current;
          const g = ctx.createGain();
          g.gain.value = TURN_VOL;
          src.connect(g);
          g.connect(ctx.destination);
          src.start();
        } catch {
          /* ignore autoplay blocks */
        }
      });
    },
    [muted, ensure, startSoul]
  );

  const setMuted = useCallback(
    (v: boolean) => {
      setMutedState(v);
      localStorage.setItem('deepsix-muted', v ? '1' : '0');
      if (v) {
        stopSoul();
        if (ctxRef.current) void ctxRef.current.suspend();
        return;
      }
      void ensure().then((ctx) => startSoul(ctx));
    },
    [ensure, startSoul, stopSoul]
  );

  useEffect(() => {
    const unlock = () => {
      void ensure().then((ctx) => {
        if (!muted) void startSoul(ctx);
      });
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, [ensure, muted, startSoul]);

  useEffect(() => {
    if (!unlocked || muted) return;
    void ensure().then((ctx) => startSoul(ctx));
  }, [unlocked, muted, ensure, startSoul]);

  useEffect(() => () => stopSoul(), [stopSoul]);

  const api = useMemo<SoundApi>(() => ({ muted, unlocked, setMuted, play }), [muted, unlocked, setMuted, play]);

  return <SoundContext.Provider value={api}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound must be used inside SoundscapeProvider');
  return ctx;
}
