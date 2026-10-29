import {
  Boxes,
  Cloud,
  KeyRound,
  Link2,
  Package,
  Puzzle,
  Server,
  ShieldAlert,
  Terminal,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Reveal, SectionHeading } from "./ui";

const detections: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: KeyRound,
    title: "Secret Exposure",
    body: "Detect potentially exposed credentials, tokens and sensitive values.",
  },
  {
    icon: ShieldAlert,
    title: "Dangerous Permissions",
    body: "Identify excessive workflow permissions and privilege-related configurations.",
  },
  {
    icon: Puzzle,
    title: "Third-Party Actions",
    body: "Analyze external actions and potentially risky dependencies.",
  },
  {
    icon: Server,
    title: "Self-Hosted Runners",
    body: "Identify security-sensitive runner configurations and potential attack paths.",
  },
  {
    icon: Workflow,
    title: "Workflow Injection",
    body: "Detect potentially dangerous user-controlled inputs flowing into workflow execution.",
  },
  {
    icon: Package,
    title: "Supply-Chain Risks",
    body: "Identify suspicious packages, dependencies and external components.",
  },
  {
    icon: Cloud,
    title: "Cloud Credentials",
    body: "Detect insecure cloud authentication and credential usage patterns.",
  },
  {
    icon: Terminal,
    title: "Command Execution",
    body: "Identify potentially dangerous shell commands and execution paths.",
  },
  {
    icon: Boxes,
    title: "Artifact & Build Risks",
    body: "Analyze artifact handling, build processes and workflow trust boundaries.",
  },
  {
    icon: Link2,
    title: "Security Misconfiguration",
    body: "Detect insecure CI/CD configurations that may expose attack surfaces.",
  },
];

export function Detections() {
  return (
    <section id="detections" className="scroll-mt-20 border-t border-white/6">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <SectionHeading eyebrow="Detection capabilities" title="The weaknesses worth opening a report for.">
          Signal flags the CI/CD patterns researchers actually chase: secrets, privileges, untrusted input, runners, and supply-chain trust.
        </SectionHeading>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {detections.map((item, index) => (
            <Reveal key={item.title} delay={(index % 5) * 50}>
              <article className="glass group h-full rounded-2xl p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/20">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-zinc-200 transition group-hover:border-signal/40 group-hover:text-signal">
                  <item.icon size={16} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
