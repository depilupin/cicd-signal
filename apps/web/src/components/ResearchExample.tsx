import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../lib/useCountUp";
import { useUi } from "./useUi";

const stages = [
  {
    label: "Repository",
    body: "github.com/example/target",
  },
  {
    label: "Workflow",
    body: ".github/workflows/deploy.yml",
  },
  {
    label: "Finding",
    body: "Untrusted input reaches a shell step",
  },
  {
    label: "Impact",
    body: "Potential command injection",
  },
];

export function ResearchExample() {
  const { openScan } = useUi();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % stages.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <section className="border-t border-white/6" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">Real-world research workflow</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          One workflow. One line. A lead you can actually chase.
        </h2>

        <div className="mt-10 grid gap-3 lg:grid-cols-4">
          {stages.map((stage, index) => (
            <button
              key={stage.label}
              type="button"
              onClick={() => setActive(index)}
              className={`rounded-2xl border p-4 text-left transition ${
                active === index ? "border-signal/40 bg-signal/10" : "border-white/8 bg-white/[0.02] hover:border-white/20"
              }`}
              aria-pressed={active === index}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">{stage.label}</p>
              <p className="mt-2 text-sm text-zinc-200">{stage.body}</p>
            </button>
          ))}
        </div>

        <article className="glass mt-4 rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-high/15 px-2 py-1 font-mono text-[11px] text-high">HIGH</span>
            <h3 className="text-lg font-semibold">Untrusted Input → Shell Execution</h3>
          </div>
          <p className="mt-3 font-mono text-xs text-zinc-500">.github/workflows/deploy.yml · Line 47</p>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/8 bg-black/50 p-4 font-mono text-[12px] leading-6 text-zinc-200">
            <span className="mr-4 text-zinc-600">47</span>
            run: ./deploy.sh <span className="text-amber-300">{"${{ github.event.issue.title }}"}</span>
          </pre>
          <p className="mt-4 text-sm text-zinc-300">Potential impact: Potential Command Injection</p>
          <button
            type="button"
            onClick={openScan}
            className="mt-4 text-sm font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
          >
            Investigate Finding →
          </button>
          <p className="mt-5 max-w-2xl text-xs leading-relaxed text-zinc-500">
            Detection identifies potentially vulnerable patterns. Researchers should manually validate impact before reporting.
          </p>
        </article>
      </div>
    </section>
  );
}
