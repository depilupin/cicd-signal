import { platforms } from "../content/site";

export function Supported() {
  return (
    <section className="border-t border-white/6">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Supported CI/CD</h2>
        <p className="mt-4 max-w-2xl text-zinc-400">
          GitHub Actions is available now. Other pipeline formats are on the roadmap and are not claimed as live coverage.
        </p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => {
            const live = platform.status === "Supported";
            return (
              <li
                key={platform.name}
                className={`flex items-center justify-between rounded-2xl border px-4 py-4 ${
                  live ? "border-signal/30 bg-signal/8" : "border-white/8 bg-white/[0.02]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <PlatformMark name={platform.name} />
                  <span className="text-sm font-medium">{platform.name}</span>
                </span>
                <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${live ? "text-signal" : "text-zinc-500"}`}>
                  {platform.status}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function PlatformMark({ name }: { name: string }) {
  const letters = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-black/40 font-mono text-[10px] text-zinc-300">
      {letters}
    </span>
  );
}
