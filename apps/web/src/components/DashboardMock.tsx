import { useCountUp } from "../lib/useCountUp";
import { useInView } from "../lib/useInView";

const stats = [
  { label: "Files", value: 1248 },
  { label: "Workflows", value: 87 },
  { label: "Secrets", value: 32 },
  { label: "High Risk", value: 19, tone: "text-high" },
  { label: "Medium Risk", value: 41, tone: "text-medium" },
  { label: "Informational", value: 73, tone: "text-low" },
];

const findings = [
  { severity: "HIGH", tone: "text-high", finding: "Workflow Injection", file: "deploy.yml", line: "47" },
  { severity: "HIGH", tone: "text-high", finding: "Excessive Permissions", file: "build.yml", line: "21" },
  { severity: "MEDIUM", tone: "text-medium", finding: "Unpinned Action", file: "release.yml", line: "14" },
  { severity: "MEDIUM", tone: "text-medium", finding: "Secret Exposure", file: "deploy.yml", line: "63" },
  { severity: "LOW", tone: "text-low", finding: "Insecure Configuration", file: "test.yml", line: "29" },
];

export function DashboardMock() {
  const { ref, inView } = useInView<HTMLElement>(0.25);

  return (
    <section id="scanner" ref={ref} className="scroll-mt-20 border-t border-white/6">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">Product</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          A research console, not a compliance report.
        </h2>
        <p className="mt-4 max-w-2xl text-zinc-400">
          File, workflow, line. Enough context to decide whether a finding is worth the next hour of validation.
        </p>

        <div className="glass mt-10 overflow-hidden rounded-[1.5rem]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
            <div>
              <p className="font-mono text-[11px] text-zinc-500">Repository</p>
              <p className="mt-1 text-sm font-medium">target-org / target-repository</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Simulated Console Demo
              </span>
              <p className="inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs text-signal">
                <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                Completed
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-white/8 sm:grid-cols-3 lg:grid-cols-6">
            {stats.map((stat) => (
              <Stat key={stat.label} label={stat.label} value={stat.value} tone={stat.tone} active={inView} />
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Severity</th>
                  <th className="px-5 py-3 font-medium">Finding</th>
                  <th className="px-5 py-3 font-medium">File</th>
                  <th className="px-5 py-3 font-medium">Line</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((row) => (
                  <tr key={`${row.finding}-${row.line}`} className="border-t border-white/6 hover:bg-white/[0.03]">
                    <td className={`px-5 py-3.5 font-mono text-xs ${row.tone}`}>{row.severity}</td>
                    <td className="px-5 py-3.5 text-zinc-100">{row.finding}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-400">{row.file}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-400">{row.line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone = "text-white",
  active,
}: {
  label: string;
  value: number;
  tone?: string;
  active: boolean;
}) {
  const count = useCountUp(value, active);
  return (
    <div className="border-b border-white/6 px-5 py-4 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <p className={`font-mono text-2xl tracking-tight ${tone}`}>{count.toLocaleString()}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-zinc-500">{label}</p>
    </div>
  );
}
