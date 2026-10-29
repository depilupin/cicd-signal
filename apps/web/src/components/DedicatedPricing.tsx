import { useEffect, useState } from "react";
import {
  Check,
  ShieldCheck,
  Zap,
  ArrowRight,
  Loader2,
  Sparkles,
  CreditCard,
  ChevronRight,
  Lock,
  UserCheck,
} from "lucide-react";
import { useUi } from "./useUi";
import { Button, Badge } from "./ui";

interface PlanItem {
  id: string;
  name: string;
  audience: string;
  price: string;
  priceCents: number;
  currency: string;
  cadence: string;
  equivalent: string;
  save: string | null;
  cta: string;
  featured: boolean;
  maxScansPerMonth: number;
  features: string[];
}

interface ActiveSubSummary {
  planName: string;
  priceCents: number;
  status: string;
  scansQuota: number;
  scansRemaining: number;
  currentPeriodEnd: string;
}

export function DedicatedPricing() {
  const { currentUser, loadingAuth, navigate, notification, setNotification, openLogin } = useUi();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<ActiveSubSummary | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    // Only fetch and generate dedicated pricing when user is logged in
    if (!currentUser) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        // 1. Fetch live plans
        const resPlans = await fetch(`${apiUrl}/api/v1/plans`);
        if (resPlans.ok) {
          const jsonPlans = await resPlans.json();
          if (jsonPlans.success && Array.isArray(jsonPlans.data)) {
            setPlans(jsonPlans.data);
          }
        }

        // 2. Fetch user's active subscription status
        const resSub = await fetch(`${apiUrl}/api/v1/billing/subscription`, {
          credentials: "include",
        });
        if (resSub.ok) {
          const jsonSub = await resSub.json();
          if (jsonSub.success && jsonSub.data?.hasActiveSubscription && jsonSub.data.subscription) {
            const sub = jsonSub.data.subscription;
            setActiveSub({
              planName: sub.plan.name,
              priceCents: sub.plan.priceCents,
              status: sub.status,
              scansQuota: sub.plan.maxScansPerMonth,
              scansRemaining: sub.usage.scansRemaining,
              currentPeriodEnd: sub.currentPeriodEnd,
            });
          }
        }
      } catch {
        // Fallback or offline state
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [apiUrl, currentUser]);

  const handleSelectPlan = (planId: string) => {
    // Leads directly to dedicated billing
    navigate("/billing", planId);
  };

  // State 1: Loading Auth Session
  if (loadingAuth) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <Loader2 size={24} className="animate-spin text-signal" />
        <p className="font-mono text-xs text-zinc-400">Verifying researcher authentication...</p>
      </div>
    );
  }

  // State 2: Not logged in — Dedicated Pricing is gated until login
  if (!currentUser) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-signal/30 bg-signal/10 text-signal">
            <Lock size={26} />
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-white">
            Dedicated Pricing Locked
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Dedicated research tiers, customized scan quotas, and direct billing integrations are visible only to logged-in researchers.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button onClick={openLogin} className="w-full font-semibold">
              Sign In / Register to Generate Pricing
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="text-xs">
              Return to Overview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Logged in — Dedicated Pricing is generated and visible
  return (
    <div className="min-h-screen pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex flex-col gap-4 border-b border-white/8 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <button onClick={() => navigate("/")} className="transition hover:text-white">
              Overview
            </button>
            <ChevronRight size={13} className="text-zinc-600" />
            <span className="font-medium text-signal">Dedicated Pricing</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-signal/30 bg-signal/10 py-1 pl-1.5 pr-3 text-xs">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-signal text-[10px] font-bold text-zinc-950">
                <UserCheck size={12} />
              </span>
              <span className="text-zinc-300">
                Verified: <span className="font-medium text-white">{currentUser.name || currentUser.email}</span>
              </span>
            </div>

            <Button
              variant="secondary"
              onClick={() => navigate("/billing")}
              className="text-xs"
            >
              <CreditCard size={13} />
              Billing & Invoices
            </Button>
          </div>
        </div>

        {/* Flash Notification / Welcome Banner */}
        {notification ? (
          <div className="relative mt-6 flex items-center justify-between gap-4 rounded-2xl border border-signal/30 bg-signal/10 px-5 py-3.5 text-sm text-signal">
            <div className="flex items-center gap-3">
              <Sparkles size={16} className="shrink-0 text-signal" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="rounded p-1 text-signal/70 hover:text-signal"
            >
              ✕
            </button>
          </div>
        ) : null}

        {/* Existing Active Subscription Callout */}
        {activeSub ? (
          <div className="mt-8 rounded-3xl border border-signal/30 bg-linear-to-r from-signal/15 via-white/3 to-white/1 p-6 backdrop-blur sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-signal animate-pulse" />
                  <p className="font-mono text-xs uppercase tracking-wider text-signal">Active Subscription Found</p>
                </div>
                <h3 className="mt-1 text-xl font-bold text-white">
                  You are currently on the {activeSub.planName} tier
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {activeSub.scansRemaining} of {activeSub.scansQuota} scans available. Renews on{" "}
                  {new Date(activeSub.currentPeriodEnd).toLocaleDateString()}.
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => navigate("/billing")} variant="primary">
                  Manage Billing & Quotas
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Hero Section */}
        <div className="mt-12 max-w-3xl text-left">
          <Badge variant="signal" dot className="mb-4">
            Generated For: {currentUser.email}
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Dedicated Researcher Pricing
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Personalized CI/CD workflow security plans generated for your account. Select a commitment window to immediately proceed to dedicated billing and activate your scan quota.
          </p>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="mt-16 flex flex-col items-center justify-center gap-3 py-16 text-zinc-400">
            <Loader2 size={24} className="animate-spin text-signal" />
            <p className="font-mono text-xs tracking-wider">Generating dedicated researcher plans...</p>
          </div>
        ) : (
          /* Plans Grid */
          <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = activeSub?.planName === plan.name;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-3xl border p-7 sm:p-8 transition duration-300 hover:border-white/20 ${
                    plan.featured
                      ? "border-signal/50 bg-[radial-gradient(ellipse_at_top,rgba(62,224,160,0.14),rgba(14,17,25,0.7))] shadow-[0_0_50px_rgba(62,224,160,0.12)]"
                      : "border-white/10 bg-white/3"
                  }`}
                >
                  {plan.featured ? (
                    <div className="absolute -top-3.5 right-7">
                      <span className="rounded-full bg-signal px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-950 shadow-md">
                        Most Popular
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight text-white">{plan.name}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{plan.audience}</p>
                    </div>
                    {plan.save ? (
                      <span className="shrink-0 rounded-full border border-signal/30 bg-signal/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-signal">
                        {plan.save}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-8 border-b border-white/8 pb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-extrabold tracking-tight text-white">{plan.price}</span>
                      <span className="text-sm text-zinc-400">/ {plan.cadence}</span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-signal">{plan.equivalent}</p>
                    <div className="mt-3 flex items-center gap-1.5 font-mono text-xs text-zinc-400">
                      <Zap size={13} className="text-signal" />
                      <span>{plan.maxScansPerMonth.toLocaleString()} scans per month</span>
                    </div>
                  </div>

                  <div className="mt-6 flex-1">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                      Entitlements Included:
                    </p>
                    <ul className="mt-4 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-300">
                          <Check size={16} className="mt-0.5 shrink-0 text-signal" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/8">
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      variant={plan.featured ? "primary" : "secondary"}
                      className="w-full text-sm font-semibold"
                    >
                      {isCurrent ? (
                        "Manage Active Plan"
                      ) : (
                        <span className="inline-flex items-center justify-center gap-2">
                          <span>Proceed to Billing</span>
                          <ArrowRight size={15} />
                        </span>
                      )}
                    </Button>
                    <p className="mt-2.5 text-center font-mono text-[11px] text-zinc-500">
                      Instant setup • Leads directly to billing
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trust & Guarantee Banner */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/2 p-5">
            <ShieldCheck size={20} className="text-signal" />
            <h4 className="mt-3 text-sm font-semibold text-white">Full AST Engine Coverage</h4>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Includes full detection vectors: unpinned actions, script injection, OIDC assumeRole misconfigs, and PR artifacts poison.
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/2 p-5">
            <CreditCard size={20} className="text-signal" />
            <h4 className="mt-3 text-sm font-semibold text-white">Transparent Billing</h4>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Zero hidden setup fees. Itemized tax receipts, flexible cancellation, and self-service billing management built in.
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/2 p-5">
            <Zap size={20} className="text-signal" />
            <h4 className="mt-3 text-sm font-semibold text-white">Instant Quota Activation</h4>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Once checkout completes, your scan quota is reserved and ready in real-time on our BullMQ high-concurrency worker cluster.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
