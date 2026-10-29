import { useUi } from "./useUi";
import { Button } from "./ui";

export function FinalCta() {
  const { openScan } = useUi();

  return (
    <section className="border-t border-white/6">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(124,140,255,0.22),transparent_45%),linear-gradient(180deg,#12151e,#090b10)] px-6 py-16 text-center sm:px-12 sm:py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">Built for security researchers.</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.05]">
            Your Next Bounty Might Be One Workflow Away.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-zinc-400 sm:text-lg">
            Scan the pipeline. Find the weakness. Validate the impact. Submit the report.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button onClick={openScan} className="min-w-40 px-5">
              Start Hunting
            </Button>
            <Button href="#scanner" variant="secondary" className="min-w-40 px-5">
              Explore the Scanner
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
