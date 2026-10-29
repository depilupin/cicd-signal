import { useCountUp } from "../lib/useCountUp";
import { useInView } from "../lib/useInView";
import { Reveal, SectionHeading } from "./ui";

export function LineByLine() {
  const { ref, inView } = useInView<HTMLDivElement>(0.35);
  const lines = useCountUp(12847, inView, 1300);
  const locations = useCountUp(17, inView, 900);
  const high = useCountUp(6, inView, 900);
  const worth = useCountUp(3, inView, 900);

  return (
    <section className="border-t border-white/6">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <SectionHeading
          eyebrow="Automate the boring part of CI/CD security research."
          title="From Thousands of Lines to the 10 Lines That Matter."
        />

        <div ref={ref} className="mt-12 grid gap-4 lg:grid-cols-2">
          <Reveal>
            <article className="h-full rounded-3xl border border-white/8 bg-white/[0.02] p-6 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">Manual Review</p>
              <p className="mt-6 font-mono text-4xl tracking-tight text-zinc-200">12,847 lines</p>
              <ul className="mt-4 space-y-1 text-sm text-zinc-400">
                <li>342 workflow files</li>
                <li>89 configuration files</li>
              </ul>
              <div className="bar-drift mt-8 h-3 rounded-full" />
              <p className="mt-4 text-sm text-zinc-500">Hours of manual analysis</p>
            </article>
          </Reveal>

          <Reveal delay={80}>
            <article className="h-full rounded-3xl border border-signal/25 bg-[linear-gradient(180deg,rgba(62,224,160,0.08),rgba(10,12,18,0.4))] p-6 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal">Scanner</p>
              <ol className="mt-6 space-y-4">
                <li>
                  <p className="font-mono text-3xl tracking-tight text-white">{lines.toLocaleString()} lines analyzed</p>
                </li>
                <li className="border-t border-white/10 pt-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Suspicious locations</p>
                  <p className="mt-1 font-mono text-3xl text-white">{locations}</p>
                </li>
                <li className="border-t border-white/10 pt-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">High-priority findings</p>
                  <p className="mt-1 font-mono text-3xl text-high">{high}</p>
                </li>
                <li className="border-t border-white/10 pt-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Worth investigating</p>
                  <p className="mt-1 font-mono text-3xl text-signal">{worth}</p>
                </li>
              </ol>
            </article>
          </Reveal>
        </div>

        <p className="mt-8 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Spend your time exploiting vulnerabilities—not searching for them.
        </p>
      </div>
    </section>
  );
}
