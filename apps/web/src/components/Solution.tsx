import { useEffect, useState } from "react";
import { solutionSteps } from "../content/site";
import { prefersReducedMotion } from "../lib/useCountUp";
import { useInView } from "../lib/useInView";
import { Reveal, SectionHeading } from "./ui";

export function Solution() {
  const { ref, inView } = useInView<HTMLOListElement>(0.35);
  const [lit, setLit] = useState(() => (prefersReducedMotion() ? solutionSteps.length : 0));

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    let current = 0;
    const id = window.setInterval(() => {
      current += 1;
      setLit(current);
      if (current >= solutionSteps.length) window.clearInterval(id);
    }, 420);
    return () => window.clearInterval(id);
  }, [inView]);

  return (
    <section id="how-it-works" className="scroll-mt-20 border-t border-white/6">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <SectionHeading eyebrow="How it works" title="Turn CI/CD Code Into a Bug Bounty Attack Surface.">
          The scanner automatically analyzes CI/CD infrastructure and highlights security-sensitive code that deserves deeper investigation.
        </SectionHeading>

        <ol ref={ref} className="relative mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
          <span className="absolute left-[8%] right-[8%] top-5 hidden h-px bg-white/10 lg:block" aria-hidden="true" />
          {solutionSteps.map((step, index) => {
            const on = index < lit;
            return (
              <li key={step} className="relative">
                <span
                  className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border font-mono text-[11px] transition ${
                    on
                      ? "border-signal/50 bg-signal text-zinc-950 shadow-[0_0_24px_rgba(62,224,160,0.35)]"
                      : "border-white/10 bg-ink text-zinc-500"
                  }`}
                >
                  {index + 1}
                </span>
                <p className={`mt-3 text-sm font-medium ${on ? "text-white" : "text-zinc-500"}`}>{step}</p>
              </li>
            );
          })}
        </ol>

        <Reveal>
          <div className="mt-10 overflow-hidden rounded-3xl border border-signal/25 bg-[linear-gradient(90deg,rgba(62,224,160,0.12),rgba(124,140,255,0.08))] px-6 py-6 sm:px-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">Where the report starts</p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-3xl">
              Potential Finding → Validate → Report → Bounty
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
