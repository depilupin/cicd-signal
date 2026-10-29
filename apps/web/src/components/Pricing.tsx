import { useEffect, useState } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { plans as fallbackPlans } from "../content/site";
import { useUi } from "./useUi";
import { Button } from "./ui";

interface PlanItem {
  id: string;
  name: string;
  audience: string;
  price: string;
  cadence: string;
  equivalent: string;
  save: string | null;
  cta: string;
  featured: boolean;
  features: readonly string[] | string[];
}

export function Pricing() {
  const { currentUser, navigate, openLogin } = useUi();
  const [plansList, setPlansList] = useState<PlanItem[]>(fallbackPlans as unknown as PlanItem[]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

    async function fetchPlans() {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/api/v1/plans`);
        if (!res.ok) {
          throw new Error(`Failed to load plans (HTTP ${res.status})`);
        }
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.data)) {
          setPlansList(json.data);
          setError(null);
        }
      } catch {
        if (isMounted) {
          // Graceful fallback to verified defaults
          setError("Showing verified preview pricing (API offline)");
          setPlansList(fallbackPlans as unknown as PlanItem[]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="pricing" className="scroll-mt-20 border-t border-white/6">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Pick a research window.
            </h2>
            <p className="mt-4 text-zinc-400">
              One month, three months, or a full year. Built for individual hunters, not a company rollout.
            </p>
          </div>

          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-zinc-400">
              <Loader2 size={12} className="animate-spin text-signal" />
              Syncing live plan data...
            </div>
          ) : error ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-medium/20 bg-medium/10 px-3 py-1 font-mono text-xs text-medium">
              <AlertCircle size={12} />
              {error}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal/10 px-3 py-1 font-mono text-xs text-signal">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              Live Server Plans
            </div>
          )}
        </div>

        <div className="mt-10 grid items-stretch gap-4 lg:grid-cols-3">
          {plansList.map((plan) => (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border p-6 sm:p-7 ${
                plan.featured
                  ? "border-signal/40 bg-[linear-gradient(180deg,rgba(62,224,160,0.12),rgba(16,19,27,0.4))] shadow-[0_0_0_1px_rgba(62,224,160,0.08),0_30px_80px_rgba(0,0,0,0.28)]"
                  : "border-white/8 bg-white/3"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-white">{plan.name}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{plan.audience}</p>
                </div>
                {plan.save ? (
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${
                      plan.featured ? "bg-signal text-zinc-950 font-semibold" : "border border-white/10 text-zinc-300"
                    }`}
                  >
                    {plan.save}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                    Flexible
                  </span>
                )}
              </div>

              <p className="mt-8 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tight text-white">{plan.price}</span>
              </p>
              <p className="mt-2 text-sm text-zinc-400">{plan.equivalent}</p>
              <p className="text-xs text-zinc-500">{plan.cadence}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check size={15} className="mt-0.5 shrink-0 text-signal" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8 w-full"
                variant={plan.featured ? "primary" : "secondary"}
                onClick={() => {
                  if (currentUser) {
                    navigate("/pricing");
                  } else {
                    openLogin();
                  }
                }}
              >
                {plan.cta}
              </Button>
            </article>
          ))}
        </div>

        <p className="mt-6 text-sm text-zinc-500">
          Subscriptions are subject to terms of service. You still validate every finding before reporting it.
        </p>
      </div>
    </section>
  );
}
