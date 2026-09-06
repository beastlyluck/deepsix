import React, { memo, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface SpeedLinesProps {
  intensity?: number;
  color?: string;
  direction?: 'horizontal' | 'vertical' | 'radial';
  duration?: number;
}

export const SpeedLines = memo(function SpeedLines({ intensity = 1, color = '#FFD700', direction = 'horizontal', duration = 0.5 }: SpeedLinesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const linesRef = useRef<Array<{ x: number; y: number; length: number; speed: number; opacity: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const generateLines = () => {
      linesRef.current = Array.from({ length: Math.floor(30 * intensity) }, () => ({
        x: direction === 'radial' ? canvas.width / 2 : Math.random() * canvas.width,
        y: direction === 'radial' ? canvas.height / 2 : Math.random() * canvas.height,
        length: 50 + Math.random() * 200 * intensity,
        speed: 5 + Math.random() * 15 * intensity,
        opacity: 0.3 + Math.random() * 0.5,
      }));
    };
    generateLines();

    let animationId: number;
    const animate = () => {
      if (!ctxRef.current) return;
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      linesRef.current.forEach(line => {
        ctx.globalAlpha = line.opacity;
        ctx.beginPath();
        if (direction === 'horizontal') {
          ctx.moveTo(line.x, line.y);
          ctx.lineTo(line.x - line.length, line.y);
          line.x -= line.speed;
          if (line.x < -line.length) line.x = canvas.width + line.length;
        } else if (direction === 'vertical') {
          ctx.moveTo(line.x, line.y);
          ctx.lineTo(line.x, line.y - line.length);
          line.y -= line.speed;
          if (line.y < -line.length) line.y = canvas.height + line.length;
        } else {
          const angle = Math.atan2(line.y - canvas.height / 2, line.x - canvas.width / 2);
          const dx = Math.cos(angle) * line.speed;
          const dy = Math.sin(angle) * line.speed;
          ctx.moveTo(line.x, line.y);
          ctx.lineTo(line.x - dx * 10, line.y - dy * 10);
          line.x -= dx;
          line.y -= dy;
          const dist = Math.hypot(line.x - canvas.width / 2, line.y - canvas.height / 2);
          if (dist > Math.max(canvas.width, canvas.height)) {
            const newAngle = Math.random() * Math.PI * 2;
            line.x = canvas.width / 2 + Math.cos(newAngle) * 50;
            line.y = canvas.height / 2 + Math.sin(newAngle) * 50;
          }
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [intensity, color, direction, duration]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[1]" style={{ opacity: 0.35 }} />;
});
