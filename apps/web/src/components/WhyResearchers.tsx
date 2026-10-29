import { Crosshair, Hourglass, Layers3, Search } from "lucide-react";
import { Reveal } from "./ui";

const reasons = [
  {
    icon: Hourglass,
    title: "Save Hours",
    body: "Automate repetitive CI/CD code review.",
  },
  {
    icon: Search,
    title: "Find More",
    body: "Surface security-sensitive patterns you may otherwise overlook.",
  },
  {
    icon: Crosshair,
    title: "Go Deeper",
    body: "Quickly jump from a finding to the exact workflow and code location.",
  },
  {
    icon: Layers3,
    title: "Research Faster",
    body: "Spend more time validating vulnerabilities and less time searching.",
  },
];

export function WhyResearchers() {
  return (
    <section className="border-t border-white/6">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Why security researchers use it
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, index) => (
            <Reveal key={reason.title} delay={index * 60}>
              <article className="h-full rounded-3xl border border-white/8 bg-white/[0.03] p-6">
                <reason.icon size={18} className="text-signal" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-semibold">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{reason.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
