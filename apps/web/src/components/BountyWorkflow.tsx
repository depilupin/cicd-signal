import { useEffect, useState } from "react";
import { bountySteps } from "../content/site";
import { prefersReducedMotion } from "../lib/useCountUp";
import { useInView } from "../lib/useInView";
import { SectionHeading } from "./ui";

export function BountyWorkflow() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const [active, setActive] = useState(() =>
    prefersReducedMotion() ? bountySteps.length - 1 : 0,
  );

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    let current = 0;
    const id = window.setInterval(() => {
      current += 1;
      setActive(current);
      if (current >= bountySteps.length - 1) window.clearInterval(id);
    }, 480);
    return () => window.clearInterval(id);
  }, [inView]);

  return (
    <section id="researchers" className="scroll-mt-20 border-t border-white/6">
      <div ref={ref} className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <SectionHeading eyebrow="Stop searching. Start finding." title="Built Around the Bug Bounty Workflow.">
          The scanner does not replace the researcher. It clears the repetitive read so you can spend the hours on proof.
        </SectionHeading>

        <ol className="mt-12 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {bountySteps.map((step, index) => {
            const on = index <= active;
            const last = index === bountySteps.length - 1;
            return (
              <li
                key={step}
                className={`rounded-2xl border px-4 py-5 ${
                  last && on
                    ? "border-signal/40 bg-signal/10"
                    : on
                      ? "border-white/15 bg-white/[0.04]"
                      : "border-white/8 bg-transparent"
                }`}
              >
                <p className="font-mono text-[11px] text-zinc-500">0{index + 1}</p>
                <p className={`mt-3 text-sm font-semibold uppercase tracking-[0.14em] ${on ? "text-white" : "text-zinc-600"}`}>
                  {step}
                </p>
              </li>
            );
          })}
        </ol>

        <blockquote className="mt-10 max-w-4xl">
          <p className="text-4xl font-semibold tracking-tight text-white sm:text-6xl sm:leading-[1.05]">
            The scanner finds the signal.
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-signal sm:text-6xl sm:leading-[1.05]">
            You prove the impact.
          </p>
        </blockquote>
      </div>
    </section>
  );
}
