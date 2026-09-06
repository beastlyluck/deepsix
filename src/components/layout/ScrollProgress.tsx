import React, { useState, useEffect } from 'react';
import { useScroll } from '../../hooks/useScroll';

export const ScrollProgress: React.FC = () => {
  const { scrollProgress } = useScroll();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (scrollProgress > 0.1) setVisible(true);
    else if (scrollProgress < 0.05) setVisible(false);
  }, [scrollProgress]);

  return (
    <div
      className={`fixed top-0 left-0 right-0 h-1 z-40 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-gold via-gold/50 to-gold/20 rounded-full origin-left"
        style={{
          transform: `scaleX(${scrollProgress})`,
          transformOrigin: 'left center',
        }}
      />
    </div>
  );
};
