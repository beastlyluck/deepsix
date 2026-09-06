import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

function jumpToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const jump = () => {
        const el = document.getElementById(hash.slice(1)) || document.querySelector(hash);
        if (el) el.scrollIntoView({ block: 'start' });
      };
      jump();
      const t = window.setTimeout(jump, 80);
      return () => window.clearTimeout(t);
    }

    jumpToTop();
    const raf = window.requestAnimationFrame(jumpToTop);
    const t = window.setTimeout(() => {
      jumpToTop();
      ScrollTrigger.refresh();
    }, 50);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [pathname, hash]);

  return null;
}
