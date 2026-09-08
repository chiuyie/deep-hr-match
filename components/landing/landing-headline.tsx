"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function LandingHeadline({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const words = text.split(" ");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <h1
      className={cn(
        "landing-headline mt-8 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl md:text-6xl md:leading-[1.05]",
        ready && "landing-headline-ready",
        className
      )}
      aria-label={text}
    >
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="landing-word-wrap inline-block overflow-hidden align-bottom">
          <span
            className="landing-word inline-block"
            style={{ animationDelay: `${180 + index * 90}ms` }}
          >
            {word}
            {index < words.length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
    </h1>
  );
}
