import { useEffect, useState } from "react";

export function useCountUp(target: number, active: boolean, duration = 1100) {
  const reduce = prefersReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || reduce) return;

    let start: number | null = null;
    let frame = 0;

    const tick = (now: number) => {
      if (start === null) start = now;
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, reduce, target]);

  if (!active) return 0;
  if (reduce) return target;
  return value;
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
