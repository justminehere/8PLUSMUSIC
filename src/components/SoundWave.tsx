import { useRef, useEffect } from 'react';

export default function SoundWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let t = 0;

    const bars = 80;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const barW = W / bars;

      for (let i = 0; i < bars; i++) {
        const progress = i / bars;
        const wave1 = Math.sin(progress * Math.PI * 4 + t) * 0.5;
        const wave2 = Math.sin(progress * Math.PI * 6 + t * 1.3) * 0.3;
        const wave3 = Math.sin(progress * Math.PI * 2 + t * 0.7) * 0.2;
        const amplitude = (wave1 + wave2 + wave3 + 1) * 0.5;
        const barH = amplitude * H * 0.85 + 4;

        // Gradient per bar from pink to turquoise
        const grad = ctx.createLinearGradient(0, H / 2 - barH / 2, 0, H / 2 + barH / 2);
        const pinkAlpha = 0.6 + progress * 0.4;
        const tealAlpha = 0.6 + (1 - progress) * 0.4;
        grad.addColorStop(0, `rgba(236, 72, 153, ${pinkAlpha})`);
        grad.addColorStop(0.5, `rgba(45, 212, 191, ${(pinkAlpha + tealAlpha) / 2})`);
        grad.addColorStop(1, `rgba(45, 212, 191, ${tealAlpha})`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(
          i * barW + barW * 0.15,
          H / 2 - barH / 2,
          barW * 0.7,
          barH,
          barW * 0.35
        );
        ctx.fill();
      }

      t += 0.035;
      animationId = requestAnimationFrame(draw);
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    draw();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: '100px' }}
    />
  );
}
