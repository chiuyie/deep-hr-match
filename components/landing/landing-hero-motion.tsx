"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const PARTICLES = Array.from({ length: 18 }).map((_, index) => ({
  id: index,
  left: `${6 + ((index * 17) % 88)}%`,
  top: `${10 + ((index * 29) % 75)}%`,
  size: 2 + (index % 4),
  delay: `${(index % 9) * 0.35}s`,
  duration: `${5 + (index % 6)}s`,
}));

export function LandingHeroMotion() {
  const stageRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const grid = gridRef.current;
    if (!stage || !grid) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      targetX = px * 28;
      targetY = py * 18;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      grid.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) rotateX(${-currentY * 0.15}deg) rotateY(${currentX * 0.12}deg)`;
      frame = window.requestAnimationFrame(tick);
    };

    stage.addEventListener("pointermove", onMove);
    frame = window.requestAnimationFrame(tick);

    return () => {
      stage.removeEventListener("pointermove", onMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={stageRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="landing-orb landing-orb-a absolute -left-24 bottom-8 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl dark:bg-teal-400/25" />
      <div className="landing-orb landing-orb-b absolute right-[18%] top-8 h-52 w-52 rounded-full bg-sky-400/25 blur-3xl dark:bg-sky-300/20" />
      <div className="landing-orb landing-orb-c absolute bottom-24 right-8 h-40 w-40 rounded-full bg-blue-600/15 blur-3xl" />

      {PARTICLES.map((particle) => (
        <span
          key={particle.id}
          className="landing-particle absolute rounded-full bg-sky-500/50 dark:bg-sky-300/50"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}

      <div
        ref={gridRef}
        className="landing-grid-stage absolute -right-[18%] top-[6%] hidden h-[74vmin] w-[74vmin] [transform-style:preserve-3d] md:block"
      >
        <div className="landing-grid-frame absolute inset-0 rounded-[2rem] border border-sky-400/25 bg-[linear-gradient(145deg,rgba(37,99,235,0.14),transparent_55%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] dark:border-sky-300/20 dark:bg-[linear-gradient(145deg,rgba(56,189,248,0.14),transparent_55%)]" />
        <div className="landing-grid-ring absolute inset-[-6%] rounded-[2.5rem] border border-dashed border-sky-400/25 dark:border-sky-300/20" />
        <div className="landing-grid-ring-2 absolute inset-[-12%] rounded-[3rem] border border-sky-400/10 dark:border-sky-300/10" />
        <div className="landing-scan absolute inset-[12%] overflow-hidden rounded-xl">
          <div className="landing-scan-beam absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-sky-400/30 via-sky-300/10 to-transparent" />
        </div>
        <div className="absolute inset-[12%] grid grid-cols-7 grid-rows-7 gap-1.5">
          {Array.from({ length: 49 }).map((_, index) => (
            <span
              key={index}
              className={cn(
                "landing-cell rounded-sm bg-sky-500/10 dark:bg-sky-300/10",
                index % 8 === 0 && "landing-cell-hot bg-sky-600/45 dark:bg-sky-300/45",
                index % 5 === 2 && "bg-teal-500/30 dark:bg-teal-300/30",
                index === 24 && "landing-cell-core ring-1 ring-sky-300/60"
              )}
              style={{ animationDelay: `${(index % 14) * 110}ms` }}
            />
          ))}
        </div>
        <svg
          className="landing-links absolute inset-[12%] h-[calc(100%-24%)] w-[calc(100%-24%)]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path className="landing-link" d="M14 18 C 35 28, 48 40, 72 30" />
          <path className="landing-link landing-link-b" d="M22 78 C 40 60, 55 55, 86 42" />
          <path className="landing-link landing-link-c" d="M8 52 C 30 48, 58 70, 90 62" />
        </svg>
      </div>
    </div>
  );
}
