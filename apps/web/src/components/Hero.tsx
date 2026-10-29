import { ArrowRight } from "lucide-react";
import { useUi } from "./useUi";
import { ScanVisual } from "./ScanVisual";
import { Button } from "./ui";

const signals = [
  { k: "01", label: "Workflow graph" },
  { k: "02", label: "Permission map" },
  { k: "03", label: "Line-level leads" },
];

export function Hero() {
  const { openScan } = useUi();

  return (
    <section id="product" className="relative scroll-mt-20 overflow-x-clip">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(62,224,160,0.09),transparent_68%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-24 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(124,140,255,0.16),transparent_62%)]"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-10 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-signal" />
            Built for Bug Bounty Hunters & Security Researchers
          </p>
          <h1 className="mt-6 text-balance text-[clamp(3.05rem,4.7vw,4.6rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-white">
            Find Your Next Bounty in{" "}
            <span className="bg-gradient-to-br from-white via-zinc-200 to-signal bg-clip-text text-transparent">
              CI/CD.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400 sm:text-[17px]">
            Stop reviewing CI/CD pipelines line by line. Automatically uncover security weaknesses, risky configurations, exposed secrets, privilege issues, and attack paths hidden inside modern development workflows.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={openScan} className="px-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_10px_40px_rgba(255,255,255,0.06)]">
              Start Scanning
              <ArrowRight size={16} />
            </Button>
            <Button href="#scanner" variant="secondary" className="px-5">
              Explore Demo
            </Button>
          </div>
          <p className="mt-5 font-mono text-[12px] tracking-wide text-zinc-500">Stop searching. Start finding.</p>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-3 border-t border-white/8 pt-6">
            {signals.map((item) => (
              <div key={item.k}>
                <dt className="font-mono text-[10px] tracking-[0.16em] text-signal">{item.k}</dt>
                <dd className="mt-1 text-sm text-zinc-300">{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <ScanVisual />
      </div>
    </section>
  );
}
