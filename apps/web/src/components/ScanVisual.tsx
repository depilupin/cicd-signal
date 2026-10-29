import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../lib/useCountUp";
import { useUi } from "./useUi";

type Mark = "perm" | "inject" | "pin";

const code = [
  { text: "name: Deploy" },
  { text: "on:" },
  { text: "  issues:" },
  { text: "    types: [opened]" },
  { text: "permissions:", mark: "perm" as Mark },
  { text: "  contents: write", mark: "perm" as Mark },
  { text: "  packages: write", mark: "perm" as Mark },
  { text: "jobs:" },
  { text: "  deploy:" },
  { text: "    runs-on: ubuntu-latest" },
  { text: "    steps:" },
  { text: "      - uses: actions/checkout@v3", mark: "pin" as Mark },
  { text: "      - name: Ship" },
  { text: "        run: ./deploy.sh ${{ github.event.issue.title }}", mark: "inject" as Mark },
];

const terminal = [
  { tone: "ok", text: "Workflow discovered" },
  { tone: "ok", text: "Permissions analyzed" },
  { tone: "ok", text: "Secrets analyzed" },
  { tone: "ok", text: "Third-party actions analyzed" },
  { tone: "warn", text: "7 security findings detected" },
  { tone: "high", text: "2 High Risk" },
  { tone: "med", text: "3 Medium Risk" },
  { tone: "low", text: "2 Low Risk" },
];

const nodes = ["Discover", "Perms", "Secrets", "Actions", "Findings"];

const toneClass: Record<string, string> = {
  ok: "text-signal",
  warn: "text-medium",
  high: "text-high",
  med: "text-medium",
  low: "text-low",
};

export function ScanVisual() {
  const { openScan } = useUi();
  const reduceMotion = prefersReducedMotion();
  const [step, setStep] = useState(() => (prefersReducedMotion() ? code.length + terminal.length : 0));

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setStep((current) => (current + 1) % (code.length + terminal.length + 4));
    }, 520);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const cursor = Math.min(step, code.length - 1);
  const shownTerminal = Math.max(0, Math.min(terminal.length, step - 3));
  const score = Math.min(86, Math.round((Math.min(step, code.length) / code.length) * 86));
  const findingsLive = shownTerminal >= 5;
  const litNodes = findingsLive ? 5 : step > 11 ? 4 : step > 8 ? 3 : step > 5 ? 2 : step > 0 ? 1 : 0;
  const latest = terminal[shownTerminal - 1];

  return (
    <div className="relative min-w-0">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 right-8 h-40 w-40 rounded-full bg-high/10 blur-3xl"
      />
      <div className="hero-frame relative min-w-0 overflow-hidden rounded-[1.35rem] border border-white/10">
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex gap-1" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
            </span>
            <p className="truncate font-mono text-[11px] text-zinc-400">.github/workflows/deploy.yml</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-signal/30 bg-signal/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-signal">
              Simulated Telemetry Demo
            </span>
            <RiskRing score={score} hot={score > 60} />
          </div>
        </div>

        <div className="border-b border-white/8 px-3 py-3 sm:px-4">
          <ol className="grid grid-cols-5 gap-1">
            {nodes.map((node, index) => {
              const on = index < litNodes;
              return (
                <li key={node} className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${on ? "bg-signal shadow-[0_0_10px_rgba(62,224,160,0.8)]" : "bg-white/15"}`}
                    />
                    {index < nodes.length - 1 ? (
                      <span className={`h-px flex-1 ${on ? "bg-signal/50" : "bg-white/10"}`} />
                    ) : null}
                  </div>
                  <p className={`mt-1.5 truncate font-mono text-[9px] uppercase tracking-wide sm:text-[10px] ${on ? "text-zinc-200" : "text-zinc-600"}`}>
                    {node}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="grid min-w-0 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="flex flex-col border-b border-white/8 p-3 sm:p-4 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[11px] text-zinc-500">
              <span className="text-signal">signal</span> scan --workflows
            </p>
            <ul className="mt-3 flex-1 space-y-1.5 font-mono text-[11px] sm:text-[12px]" aria-live="polite">
              {terminal.slice(0, shownTerminal).map((line) => (
                <li key={line.text} className="flex gap-2">
                  <span className={toneClass[line.tone]}>{line.tone === "ok" ? "✓" : "⚠"}</span>
                  <span className="text-zinc-200">{line.text}</span>
                </li>
              ))}
              {shownTerminal === 0 ? <li className="text-zinc-600">waiting for workflow graph…</li> : null}
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-1.5">
              <Count label="High" value={findingsLive ? "2" : "–"} tone="text-high" />
              <Count label="Med" value={findingsLive ? "3" : "–"} tone="text-medium" />
              <Count label="Low" value={findingsLive ? "2" : "–"} tone="text-low" />
            </div>
          </div>

          <div className="relative min-w-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_30%)] p-2 sm:p-3">
            <div className="pointer-events-none absolute inset-x-3 top-3 h-px bg-gradient-to-r from-transparent via-signal to-transparent scan-beam" />
            <ol className="font-mono text-[10.5px] leading-5 sm:text-[11.5px] sm:leading-[1.35rem]">
              {code.map((line, index) => {
                const active = index === cursor;
                const seen = index <= cursor;
                const risky = Boolean(line.mark) && seen;
                return (
                  <li
                    key={`${line.text}-${index}`}
                    className={`grid grid-cols-[1.35rem_1fr] gap-2 rounded px-1.5 ${
                      risky ? "bg-high/12 shadow-[inset_2px_0_0_#ff5c6a]" : active ? "bg-white/6" : ""
                    }`}
                  >
                    <span className="text-right text-zinc-600">{index + 1}</span>
                    <span className="flex min-w-0 items-start justify-between gap-2">
                      <CodeText text={line.text} hot={line.mark === "inject" && seen} />
                      {risky ? (
                        <span className="mt-0.5 hidden shrink-0 rounded bg-high/15 px-1 text-[9px] uppercase tracking-wide text-high sm:inline">
                          {line.mark === "perm" ? "perms" : line.mark === "inject" ? "inject" : "unpinned"}
                        </span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-2 font-mono text-[10px] text-zinc-500">
          <span className={latest ? toneClass[latest.tone] : ""}>{latest ? latest.text : "Idle"}</span>
          <span>{findingsLive ? "7 findings" : "Scanning pipeline"}</span>
        </div>
      </div>

      <article className="relative z-10 mt-3 ml-auto w-[min(100%,300px)] overflow-hidden rounded-2xl border border-white/10 bg-[#10131b] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.5)] sm:mr-3 sm:p-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-high to-transparent" />
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[11px] font-medium tracking-[0.16em] text-high">HIGH</p>
          <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-zinc-400">deploy.yml</span>
        </div>
        <h3 className="mt-2 text-[15px] font-semibold leading-snug tracking-tight">Excessive Workflow Permissions</h3>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-white/8 bg-black/50 p-2.5 font-mono text-[10px] leading-4 text-zinc-300">
{`permissions:
  contents: write
  packages: write`}
        </pre>
        <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-zinc-500">Potential impact</p>
        <ul className="mt-2 space-y-1 text-xs text-zinc-300">
          <li>Privilege escalation</li>
          <li>Repository modification</li>
          <li>Supply-chain compromise</li>
        </ul>
        <button
          type="button"
          onClick={openScan}
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-full bg-white text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Investigate Finding
        </button>
      </article>
    </div>
  );
}

function RiskRing({ score, hot }: { score: number; hot: boolean }) {
  const radius = 15;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" role="img" aria-label={`Risk score ${score}`}>
      <circle cx="20" cy="20" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke={hot ? "#ff5c6a" : "#3ee0a0"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 20 20)"
        style={{ transition: "stroke-dashoffset 280ms linear" }}
      />
      <text x="20" y="23" textAnchor="middle" fill="#f4f4f5" fontSize="9" fontFamily="IBM Plex Mono, monospace">
        {score}
      </text>
    </svg>
  );
}

function Count({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/30 px-1.5 py-1.5">
      <p className={`font-mono text-sm ${tone}`}>{value}</p>
      <p className="text-[9px] uppercase tracking-wide text-zinc-500">{label}</p>
    </div>
  );
}

function CodeText({ text, hot }: { text: string; hot: boolean }) {
  const parts = text.split(/(\$\{\{[^}]+\}\})/g);
  return (
    <span className={`min-w-0 break-all ${hot ? "text-amber-200" : "text-zinc-300"}`}>
      {parts.map((part, index) =>
        part.startsWith("${{") ? (
          <span key={index} className="text-amber-300">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}
