const docs = [
  {
    title: "Point it at a repo",
    body: "Start with a repository that exposes GitHub Actions workflows. Signal reads pipeline files, scripts, and security-sensitive configuration.",
  },
  {
    title: "Triage the signal",
    body: "Findings land with severity, file, and line. High-risk permissions, untrusted input, and exposed secrets are the usual first pass.",
  },
  {
    title: "Prove it yourself",
    body: "A match is a lead, not a bounty. Reproduce impact in scope, then write the report. Signal does not submit findings for you.",
  },
];

export function Docs() {
  return (
    <section id="docs" className="scroll-mt-20 border-t border-white/6">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">Docs</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">How a hunter uses the scanner</h2>
        <ol className="mt-10 grid gap-4 lg:grid-cols-3">
          {docs.map((doc, index) => (
            <li key={doc.title} className="rounded-3xl border border-white/8 p-6">
              <p className="font-mono text-xs text-zinc-500">0{index + 1}</p>
              <h3 className="mt-3 text-lg font-semibold">{doc.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{doc.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
