import { useMemo } from 'react';

const VideoParticles = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const size = 2 + Math.random() * 4;
      const left = Math.random() * 100;
      const delay = Math.random() * 8;
      const duration = 6 + Math.random() * 10;
      const startY = Math.random() * 100;
      const opacity = 0.15 + Math.random() * 0.35;
      const drift = -30 + Math.random() * 60;
      return { id: i, size, left, delay, duration, startY, opacity, drift };
    });
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.startY}%`,
            opacity: 0,
            background: `radial-gradient(circle, hsl(var(--primary-foreground) / ${p.opacity}), transparent)`,
            boxShadow: `0 0 ${p.size * 2}px hsl(var(--primary-foreground) / ${p.opacity * 0.5})`,
            animation: `float-particle ${p.duration}s ${p.delay}s ease-in-out infinite`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
};

export default VideoParticles;
