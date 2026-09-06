import React, { useRef, useEffect, useMemo, useState } from 'react';
import { skills, skillCategories, Skill, SkillCategory } from '../../data/skills';

interface SkillsRadarProps {
  className?: string;
  interactive?: boolean;
}

export const SkillsRadar: React.FC<SkillsRadarProps> = ({ className = '', interactive = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.width });
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const categoryData = useMemo(() => {
    return skillCategories.map(cat => {
      const catSkills = skills.filter(s => s.category === cat.key);
      const avgProficiency = catSkills.length > 0
        ? catSkills.reduce((sum, s) => sum + s.proficiency, 0) / catSkills.length
        : 0;
      return {
        ...cat,
        proficiency: Math.round(avgProficiency),
        count: catSkills.length,
        skills: catSkills,
      };
    });
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    const categories = categoryData.length;
    const angleStep = (Math.PI * 2) / categories;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = '#2A2A2A';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const r = (radius / 4) * i;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Axis lines
      categoryData.forEach((cat, i) => {
        const angle = i * angleStep - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        ctx.stroke();
      });

      // Data polygon
      ctx.beginPath();
      categoryData.forEach((cat, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = radius * (cat.proficiency / 100);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();

      // Fill
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Stroke
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Points
      categoryData.forEach((cat, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = radius * (cat.proficiency / 100);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = cat.color === 'gold' ? '#FFD700' : cat.color === 'cyan' ? '#00FFFF' : '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#0D0D0D';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Labels
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      categoryData.forEach((cat, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = radius + 30;
        const x = centerX + Math.cos(angle) * labelRadius;
        const y = centerY + Math.sin(angle) * labelRadius;

        ctx.fillStyle = '#E8E8E8';
        ctx.fillText(cat.label, x, y);
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#B0B0B0';
        ctx.fillText(`${cat.proficiency}%`, x, y + 18);
        ctx.font = '12px "JetBrains Mono", monospace';
      });
    };

    draw();
  }, [dimensions, categoryData]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas ref={canvasRef} className="w-full h-auto" aria-label="Skills radar chart" />
      {interactive && (
        <div className="absolute inset-0 pointer-events-none">
          {categoryData.map((cat, i) => {
            const angle = (i / categoryData.length) * 360 - 90;
            const radius = Math.min(dimensions.width, dimensions.height) / 2 - 40;
            const r = radius * (cat.proficiency / 100);
            const x = dimensions.width / 2 + Math.cos((angle * Math.PI) / 180) * r;
            const y = dimensions.height / 2 + Math.sin((angle * Math.PI) / 180) * r;
            return (
              <div
                key={cat.key}
                className="absolute w-3 h-3 rounded-full pointer-events-auto transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  backgroundColor: cat.color === 'gold' ? '#FFD700' : cat.color === 'cyan' ? '#00FFFF' : '#FFD700',
                }}
                title={`${cat.label}: ${cat.proficiency}% (${cat.count} skills)`}
              />
            );
          })}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        {categoryData.map((cat) => (
          <div
            key={cat.key}
            className="p-3 bg-ink-light border border-ink-lighter rounded-lg hover:border-gold/50 transition-colors group"
            style={{ borderLeftColor: cat.color === 'gold' ? '#FFD700' : cat.color === 'cyan' ? '#00FFFF' : '#FFD700', borderLeftWidth: '3px' }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-display text-sm" style={{ color: cat.color === 'gold' ? '#FFD700' : cat.color === 'cyan' ? '#00FFFF' : '#FFD700' }}>
                {cat.label}
              </span>
              <span className="font-ui text-xs text-paper/50">{cat.count} skills</span>
            </div>
            <div className="h-1.5 bg-ink rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${cat.proficiency}%`,
                  backgroundColor: cat.color === 'gold' ? '#FFD700' : cat.color === 'cyan' ? '#00FFFF' : '#FFD700',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
