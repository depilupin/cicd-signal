import { FileStack, EyeOff, ScanSearch } from "lucide-react";
import { Reveal, SectionHeading } from "./ui";

const pains = [
  {
    icon: FileStack,
    title: "Endless Files",
    body: "Hundreds of YAML files, scripts, configurations and workflows.",
  },
  {
    icon: ScanSearch,
    title: "Manual Code Review",
    body: "Security researchers spend hours reading workflows line by line.",
  },
  {
    icon: EyeOff,
    title: "Hidden Attack Surface",
    body: "Permissions, secrets, third-party actions, runners and build logic can introduce exploitable weaknesses.",
  },
];

export function Problem() {
  return (
    <section className="scroll-mt-20 border-t border-white/6">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <SectionHeading
          eyebrow="The missed surface"
          title="Your Next Bounty Could Be Hiding in the Pipeline."
        >
          Modern applications depend heavily on CI/CD infrastructure, but security researchers often focus primarily on the application itself.
        </SectionHeading>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {pains.map((pain, index) => (
            <Reveal key={pain.title} delay={index * 80}>
              <article className="glass h-full rounded-3xl p-6">
                <pain.icon className="text-zinc-300" size={20} aria-hidden="true" />
                <p className="mt-6 font-mono text-[11px] text-zinc-500">0{index + 1}</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">{pain.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{pain.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-8 rounded-3xl border border-white/8 bg-white/[0.03] px-6 py-8 text-2xl font-semibold tracking-tight text-white sm:px-10 sm:text-4xl">
            The pipeline is part of the attack surface.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
