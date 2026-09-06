import { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function useScroll() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down'>('down');
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrollY(currentY);
      setDirection(currentY > lastScrollY.current ? 'down' : 'up');
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    ScrollTrigger.refresh();
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(scrollY / maxScroll, 1));
    }
  }, [scrollY]);

  const scrollTo = useCallback((target: number | HTMLElement, options?: ScrollToOptions) => {
    const y = typeof target === 'number' ? target : target.offsetTop;
    gsap.to(window, { scrollTo: { y, ...options }, duration: 1, ease: 'power3.inOut' });
  }, []);

  return { scrollY, scrollProgress, direction, scrollTo };
}

export function useScrollTrigger(
  trigger: string | Element,
  onEnter: () => void,
  onLeave?: () => void,
  options?: { start?: string; end?: string; scrub?: boolean | number }
) {
  const triggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    triggerRef.current = ScrollTrigger.create({
      trigger,
      start: options?.start || 'top 80%',
      end: options?.end || 'bottom 20%',
      scrub: options?.scrub,
      onEnter,
      onLeave,
      onEnterBack: onEnter,
      onLeaveBack: onLeave,
    });

    return () => triggerRef.current?.kill();
  }, [trigger, onEnter, onLeave, options?.start, options?.end, options?.scrub]);

  return triggerRef;
}

export function useParallax(speed: number = 0.5) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.to(ref.current!, {
        yPercent: -50 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [speed]);

  return ref;
}

export function useRevealAnimation(delay: number = 0) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current!, {
        opacity: 0,
        y: 30,
      }, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [delay]);

  return ref;
}
