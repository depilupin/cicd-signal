import { nav } from "../content/site";
import { Logo } from "./ui";

export function Footer() {
  return (
    <footer className="border-t border-white/8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
            CI/CD → security research → vulnerability → validation → bug bounty.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-zinc-400 hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <p className="text-xs text-zinc-600">
          Findings are leads. Validate impact in scope before you report.
        </p>
      </div>
    </footer>
  );
}
