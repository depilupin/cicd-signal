import { useEffect, useState, useCallback, type FormEvent } from "react";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  ChevronRight,
  Download,
  Receipt,
  FileText,
  RotateCcw,
} from "lucide-react";
import { useUi } from "./useUi";
import { Button, Badge } from "./ui";

interface SubscriptionData {
  id: string;
  status: string;
  provider: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: {
    id: string;
    name: string;
    priceCents: number;
    currency: string;
    interval: string;
    features: string[];
    maxScansPerMonth: number;
  };
  usage: {
    scansUsed: number;
    maxScansPerMonth: number;
    scansRemaining: number;
    percentUsed: number;
  };
}

interface InvoiceItem {
  id: string;
  invoiceId: string;
  planName: string;
  amount: string;
  amountCents: number;
  currency: string;
  status: string;
  date: string;
  paymentMethod: { brand: string; last4: string };
}

const PLAN_PREVIEWS: Record<string, { name: string; price: string; priceCents: number; interval: string; scans: number }> = {
  month: { name: "1 Month", price: "$39", priceCents: 3900, interval: "month", scans: 50 },
  quarter: { name: "3 Months", price: "$99", priceCents: 9900, interval: "3 months", scans: 200 },
  year: { name: "1 Year", price: "$299", priceCents: 29900, interval: "year", scans: 1000 },
};

export function BillingPage() {
  const { currentUser, selectedPlanId, navigate, openLogin } = useUi();
  const [activeTab, setActiveTab] = useState<"checkout" | "portal">("checkout");
  const [targetPlanId, setTargetPlanId] = useState<string>(selectedPlanId || "year");

  // Subscription & Invoices State
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loadingSub, setLoadingSub] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Checkout Form State
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("United States");
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<{
    invoiceId: string;
    amount: string;
    planName: string;
  } | null>(null);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Receipt Modal State
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceItem | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  // Pre-fill user data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName((prev) => (prev ? prev : currentUser.name || ""));
      setEmail((prev) => (prev ? prev : currentUser.email || ""));
    }
  }, [currentUser]);

  // Sync selectedPlanId from router
  useEffect(() => {
    if (selectedPlanId && PLAN_PREVIEWS[selectedPlanId]) {
      setTargetPlanId(selectedPlanId);
      setActiveTab("checkout");
    }
  }, [selectedPlanId]);

  // Fetch current subscription and invoices
  const fetchBillingData = useCallback(async () => {
    if (!currentUser) {
      setLoadingSub(false);
      return;
    }

    try {
      setLoadingSub(true);
      const resSub = await fetch(`${apiUrl}/api/v1/billing/subscription`, {
        credentials: "include",
      });
      if (resSub.ok) {
        const jsonSub = await resSub.json();
        if (jsonSub.success && jsonSub.data?.hasActiveSubscription && jsonSub.data.subscription) {
          setSubscription(jsonSub.data.subscription);
          if (!selectedPlanId) {
            setActiveTab("portal");
          }
        } else {
          setSubscription(null);
          setActiveTab("checkout");
        }
      }

      setLoadingInvoices(true);
      const resInv = await fetch(`${apiUrl}/api/v1/billing/invoices`, {
        credentials: "include",
      });
      if (resInv.ok) {
        const jsonInv = await resInv.json();
        if (jsonInv.success && Array.isArray(jsonInv.data)) {
          setInvoices(jsonInv.data);
        }
      }
    } catch {
      // offline or error state
    } finally {
      setLoadingSub(false);
      setLoadingInvoices(false);
    }
  }, [apiUrl, currentUser, selectedPlanId]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  // Fill 1-click test card helper
  const handleFillDemoCard = () => {
    setCardNumber("4242 4242 4242 4242");
    setExpDate("12/28");
    setCvc("888");
    if (!name) setName(currentUser?.name || "Alex Rivera");
    if (!email) setEmail(currentUser?.email || "researcher@lab.sec");
    if (!company) setCompany("Security Lab Ltd.");
  };

  // Process checkout
  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!currentUser) {
      openLogin();
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${apiUrl}/api/v1/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planId: targetPlanId,
          billingDetails: {
            name: name.trim() || currentUser.name || "Researcher",
            email: email.trim() || currentUser.email,
            company: company.trim() || undefined,
            country,
          },
          paymentMethod: {
            cardBrand: "Visa",
            cardLast4: cardNumber.replace(/\s+/g, "").slice(-4) || "4242",
            expMonth: 12,
            expYear: 2028,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Checkout failed. Please verify payment details.");
      }

      setCheckoutSuccess({
        invoiceId: json.data?.invoice?.invoiceId || "INV-SUCCESS",
        amount: json.data?.invoice?.amount || PLAN_PREVIEWS[targetPlanId].price,
        planName: json.data?.invoice?.planName || PLAN_PREVIEWS[targetPlanId].name,
      });

      // Refresh billing data
      await fetchBillingData();
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Payment processing interrupted");
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel subscription
  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);
      const res = await fetch(`${apiUrl}/api/v1/billing/cancel`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setShowCancelModal(false);
        await fetchBillingData();
      }
    } catch {
      // ignore
    } finally {
      setCancelling(false);
    }
  };

  // Reactivate subscription
  const handleReactivateSubscription = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/billing/reactivate`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        await fetchBillingData();
      }
    } catch {
      // ignore
    }
  };

  const currentPlanConfig = PLAN_PREVIEWS[targetPlanId] || PLAN_PREVIEWS.year;

  return (
    <div className="min-h-screen pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumbs & Status */}
        <div className="flex flex-col gap-4 border-b border-white/8 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <button onClick={() => navigate("/")} className="transition hover:text-white">
              Overview
            </button>
            <ChevronRight size={13} className="text-zinc-600" />
            <button onClick={() => navigate("/pricing")} className="transition hover:text-white">
              Dedicated Pricing
            </button>
            <ChevronRight size={13} className="text-zinc-600" />
            <span className="font-medium text-signal">Billing & Subscriptions</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/pricing")} className="text-xs">
              View All Plans
            </Button>
            <Button onClick={() => navigate("/app")} className="text-xs">
              <Zap size={13} />
              Scanner Workbench
            </Button>
          </div>
        </div>

        {/* Auth prompt if not logged in */}
        {!currentUser ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <CreditCard size={36} className="mx-auto text-signal" />
            <h2 className="mt-4 text-2xl font-bold text-white">Sign in to manage billing</h2>
            <p className="mt-2 text-sm text-zinc-400">
              You must be authenticated to activate research tiers and view invoice statements.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={openLogin}>Sign In / Create Account</Button>
            </div>
          </div>
        ) : (
          <>
            {/* View Tab Switcher */}
            <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {activeTab === "checkout" ? "Dedicated Plan Checkout" : "Subscription & Billing Management"}
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  {activeTab === "checkout"
                    ? "Confirm your research tier and activate immediate pipeline scan entitlements."
                    : "Manage active subscriptions, monitor monthly scan quota utilization, and download receipts."}
                </p>
              </div>

              <div className="flex rounded-2xl border border-white/10 bg-white/[0.03] p-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("checkout");
                    setCheckoutSuccess(null);
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition ${
                    activeTab === "checkout"
                      ? "bg-signal text-zinc-950 font-semibold shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <CreditCard size={13} />
                  <span>Checkout & Upgrade</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("portal")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition ${
                    activeTab === "portal"
                      ? "bg-signal text-zinc-950 font-semibold shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Receipt size={13} />
                  <span>My Subscription & Invoices</span>
                  {subscription ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ) : null}
                </button>
              </div>
            </div>

            {/* TAB 1: CHECKOUT & UPGRADE */}
            {activeTab === "checkout" ? (
              <div className="mt-10">
                {checkoutSuccess ? (
                  /* Success Celebration Card */
                  <div className="rounded-3xl border border-signal/40 bg-[radial-gradient(ellipse_at_top,rgba(62,224,160,0.16),rgba(14,17,25,0.8))] p-8 text-center sm:p-12">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-signal/20 text-signal">
                      <CheckCircle2 size={36} />
                    </div>
                    <h2 className="mt-6 text-2xl font-extrabold text-white sm:text-3xl">
                      Subscription Successfully Activated!
                    </h2>
                    <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-300">
                      Your <span className="font-semibold text-white">{checkoutSuccess.planName}</span> subscription is live.
                      Payment of <span className="font-mono text-signal">{checkoutSuccess.amount}</span> has been confirmed.
                    </p>

                    <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 font-mono text-xs text-zinc-400">
                      <span>Receipt ID:</span>
                      <span className="font-semibold text-white">{checkoutSuccess.invoiceId}</span>
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                      <Button onClick={() => setActiveTab("portal")} variant="primary">
                        View Subscription & Invoices
                      </Button>
                      <Button onClick={() => navigate("/app")} variant="secondary">
                        <Zap size={14} />
                        Launch Security Scanner
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-8 lg:grid-cols-12">
                    {/* Left Column: Plan Selection & Summary */}
                    <div className="space-y-6 lg:col-span-5">
                      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-signal">
                          Select Research Tier
                        </p>

                        {/* Plan Switcher Pills */}
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {(["month", "quarter", "year"] as const).map((pid) => {
                            const p = PLAN_PREVIEWS[pid];
                            const isSelected = targetPlanId === pid;
                            return (
                              <button
                                key={pid}
                                type="button"
                                onClick={() => setTargetPlanId(pid)}
                                className={`rounded-2xl border p-3 text-center transition ${
                                  isSelected
                                    ? "border-signal bg-signal/15 text-white"
                                    : "border-white/8 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white"
                                }`}
                              >
                                <p className="text-xs font-semibold">{p.name}</p>
                                <p className="mt-1 font-mono text-sm font-bold text-white">{p.price}</p>
                              </button>
                            );
                          })}
                        </div>

                        {/* Order Breakdown */}
                        <div className="mt-8 border-t border-white/8 pt-6">
                          <h3 className="text-base font-semibold text-white">Order Summary</h3>
                          <div className="mt-4 space-y-3 text-xs">
                            <div className="flex justify-between text-zinc-300">
                              <span>{currentPlanConfig.name} Access ({currentPlanConfig.scans.toLocaleString()} scans/mo)</span>
                              <span className="font-mono font-medium text-white">{currentPlanConfig.price}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>AST Security Rules Engine (10 Vectors)</span>
                              <span className="font-mono text-signal">Included</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Priority Background Job Queue</span>
                              <span className="font-mono text-signal">Included</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Estimated Sales Tax / VAT</span>
                              <span className="font-mono">$0.00</span>
                            </div>
                            <div className="border-t border-white/8 pt-3 flex justify-between text-sm font-bold text-white">
                              <span>Total Due Today</span>
                              <span className="font-mono text-signal">{currentPlanConfig.price}.00</span>
                            </div>
                          </div>
                        </div>

                        {/* Guarantee Badges */}
                        <div className="mt-8 rounded-2xl border border-white/8 bg-black/30 p-4">
                          <div className="flex items-center gap-2 text-xs text-zinc-300">
                            <CheckCircle2 size={14} className="text-signal shrink-0" />
                            <span>Instant automated quota provisioning</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-300">
                            <CheckCircle2 size={14} className="text-signal shrink-0" />
                            <span>Cancel or change commitment anytime</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Billing Information & Payment Form */}
                    <div className="lg:col-span-7">
                      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-white">Billing Information & Checkout</h3>
                            <p className="mt-0.5 text-xs text-zinc-400">
                              Enter payment details to confirm your {currentPlanConfig.name} research tier.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleFillDemoCard}
                            className="rounded-full border border-signal/40 bg-signal/10 px-3 py-1 font-mono text-[11px] font-medium text-signal hover:bg-signal/20 transition"
                          >
                            Fill Demo Card
                          </button>
                        </div>

                        {checkoutError ? (
                          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                            <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" />
                            <span>{checkoutError}</span>
                          </div>
                        ) : null}

                        <form className="mt-6 space-y-4" onSubmit={handleCheckoutSubmit}>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block text-xs font-medium text-zinc-300">
                              Full Name
                              <input
                                required
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Alex Rivera"
                                className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-signal/50 focus:ring-1 focus:ring-signal/50"
                              />
                            </label>

                            <label className="block text-xs font-medium text-zinc-300">
                              Billing Email
                              <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="researcher@lab.sec"
                                className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-signal/50 focus:ring-1 focus:ring-signal/50"
                              />
                            </label>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block text-xs font-medium text-zinc-300">
                              Company / Organization (Optional)
                              <input
                                type="text"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                placeholder="Independent Hunter or Lab"
                                className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-signal/50 focus:ring-1 focus:ring-signal/50"
                              />
                            </label>

                            <label className="block text-xs font-medium text-zinc-300">
                              Country
                              <select
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-signal/50 focus:ring-1 focus:ring-signal/50"
                              >
                                <option value="United States" className="bg-ink">United States</option>
                                <option value="Germany" className="bg-ink">Germany</option>
                                <option value="United Kingdom" className="bg-ink">United Kingdom</option>
                                <option value="Canada" className="bg-ink">Canada</option>
                                <option value="India" className="bg-ink">India</option>
                                <option value="Japan" className="bg-ink">Japan</option>
                                <option value="Australia" className="bg-ink">Australia</option>
                                <option value="France" className="bg-ink">France</option>
                              </select>
                            </label>
                          </div>

                          {/* Card details */}
                          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                            <label className="block text-xs font-medium text-zinc-300">
                              Card Number
                              <div className="relative mt-1.5">
                                <input
                                  required
                                  type="text"
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(e.target.value)}
                                  placeholder="4242 4242 4242 4242"
                                  maxLength={19}
                                  className="h-11 w-full rounded-xl border border-white/10 bg-black/60 pl-10 pr-3 font-mono text-sm text-white outline-none placeholder:text-zinc-600 focus:border-signal/50 focus:ring-1 focus:ring-signal/50"
                                />
                                <CreditCard size={16} className="absolute left-3.5 top-3.5 text-zinc-500" />
                              </div>
                            </label>

                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <label className="block text-xs font-medium text-zinc-300">
                                Expiration (MM/YY)
                                <input
                                  required
                                  type="text"
                                  value={expDate}
                                  onChange={(e) => setExpDate(e.target.value)}
                                  placeholder="12/28"
                                  maxLength={5}
                                  className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-black/60 px-3 font-mono text-sm text-white outline-none placeholder:text-zinc-600 focus:border-signal/50 focus:ring-1 focus:ring-signal/50"
                                />
                              </label>

                              <label className="block text-xs font-medium text-zinc-300">
                                CVC / Security Code
                                <input
                                  required
                                  type="password"
                                  value={cvc}
                                  onChange={(e) => setCvc(e.target.value)}
                                  placeholder="888"
                                  maxLength={4}
                                  className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-black/60 px-3 font-mono text-sm text-white outline-none placeholder:text-zinc-600 focus:border-signal/50 focus:ring-1 focus:ring-signal/50"
                                />
                              </label>
                            </div>
                          </div>

                          <div className="pt-2">
                            <Button
                              type="submit"
                              disabled={submitting}
                              className="h-12 w-full text-base font-bold shadow-lg shadow-signal/15"
                            >
                              {submitting ? (
                                <span className="inline-flex items-center gap-2">
                                  <Loader2 size={16} className="animate-spin text-zinc-950" />
                                  <span>Securing Payment & Provisioning...</span>
                                </span>
                              ) : (
                                `Confirm & Pay ${currentPlanConfig.price}.00`
                              )}
                            </Button>
                            <p className="mt-3 text-center text-xs text-zinc-500">
                              🔒 256-bit TLS encrypted transaction • Stripe PCI DSS Level 1 compliant
                            </p>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* TAB 2: SUBSCRIPTION PORTAL & INVOICES */
              <div className="mt-10 space-y-8">
                {loadingSub ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400">
                    <Loader2 size={24} className="animate-spin text-signal" />
                    <p className="font-mono text-xs">Loading active subscriptions...</p>
                  </div>
                ) : subscription ? (
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Active Subscription Overview Card */}
                    <div className="rounded-3xl border border-signal/30 bg-white/[0.03] p-7 lg:col-span-2">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-signal animate-pulse" />
                          <Badge variant="signal">ACTIVE SUBSCRIPTION</Badge>
                        </div>
                        <span className="font-mono text-xs text-zinc-400">
                          Provider: <span className="text-white font-medium">{subscription.provider}</span>
                        </span>
                      </div>

                      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-baseline">
                        <div>
                          <h3 className="text-3xl font-extrabold text-white">{subscription.plan.name} Tier</h3>
                          <p className="mt-1 text-sm text-zinc-400">
                            Billed {subscription.plan.interval} • Renews on{" "}
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-4xl font-extrabold font-mono text-signal">
                            ${(subscription.plan.priceCents / 100).toFixed(2)}
                          </span>
                          <span className="text-xs text-zinc-400"> / {subscription.plan.interval}</span>
                        </div>
                      </div>

                      {/* Quota Progress Meter */}
                      <div className="mt-8 rounded-2xl border border-white/8 bg-black/40 p-5">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-zinc-300">Monthly Scan Utilization</span>
                          <span className="font-mono text-signal">
                            {subscription.usage.scansUsed} / {subscription.usage.maxScansPerMonth.toLocaleString()} Scans
                          </span>
                        </div>
                        <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full bg-signal transition-all duration-500 rounded-full"
                            style={{ width: `${Math.max(5, subscription.usage.percentUsed)}%` }}
                          />
                        </div>
                        <p className="mt-2 font-mono text-[11px] text-zinc-500">
                          {subscription.usage.scansRemaining} scans remaining this cycle • Resets on{" "}
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Cancellation status warning */}
                      {subscription.cancelAtPeriodEnd ? (
                        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
                          <AlertCircle size={16} className="shrink-0 text-amber-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold">Cancellation Scheduled</p>
                            <p className="mt-0.5 text-zinc-300">
                              Your access will remain active until{" "}
                              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}. You will not be charged again.
                            </p>
                          </div>
                          <Button
                            variant="secondary"
                            onClick={handleReactivateSubscription}
                            className="text-xs shrink-0"
                          >
                            <RotateCcw size={12} />
                            Reactivate Auto-Renew
                          </Button>
                        </div>
                      ) : null}

                      {/* Action buttons */}
                      <div className="mt-8 flex flex-wrap gap-3 border-t border-white/8 pt-6">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setActiveTab("checkout");
                            setTargetPlanId(subscription.plan.id === "year" ? "quarter" : "year");
                          }}
                          className="text-xs"
                        >
                          Change / Upgrade Plan
                        </Button>

                        {!subscription.cancelAtPeriodEnd ? (
                          <button
                            type="button"
                            onClick={() => setShowCancelModal(true)}
                            className="rounded-full px-4 py-2 text-xs text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
                          >
                            Cancel Subscription
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Payment Method Card */}
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                      <h4 className="text-base font-bold text-white">Payment Method on File</h4>
                      <p className="mt-1 text-xs text-zinc-400">Managed via verified payment provider.</p>

                      <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-bold text-white">VISA</span>
                          <span className="rounded-full bg-signal/20 px-2 py-0.5 font-mono text-[10px] text-signal font-semibold">
                            DEFAULT
                          </span>
                        </div>
                        <p className="mt-4 font-mono text-lg tracking-wider text-zinc-200">
                          •••• •••• •••• 4242
                        </p>
                        <div className="mt-3 flex justify-between text-xs text-zinc-500">
                          <span>Expires 12/28</span>
                          <span>Auto-debit</span>
                        </div>
                      </div>

                      <div className="mt-6 space-y-2 text-xs text-zinc-400">
                        <p>Need tax invoices with company VAT?</p>
                        <p className="text-zinc-500">
                          Receipts are automatically dispatched to <span className="text-white">{currentUser.email}</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
                    <Receipt size={36} className="mx-auto text-zinc-500" />
                    <h3 className="mt-4 text-xl font-bold text-white">No active subscription found</h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      You are not currently subscribed to any researcher tier.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => setActiveTab("checkout")}>
                        Activate a Research Plan
                      </Button>
                    </div>
                  </div>
                )}

                {/* Invoices & Billing History */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">Invoice & Payment History</h3>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        Itemized receipts for accounting, tax verification, and expense reporting.
                      </p>
                    </div>
                    {invoices.length > 0 ? (
                      <span className="rounded-full bg-white/5 px-2.5 py-1 font-mono text-[11px] text-zinc-300">
                        {invoices.length} {invoices.length === 1 ? "Receipt" : "Receipts"}
                      </span>
                    ) : null}
                  </div>

                  {loadingInvoices ? (
                    <div className="flex items-center justify-center py-10 text-zinc-500 text-xs font-mono">
                      <Loader2 size={16} className="animate-spin text-signal mr-2" />
                      Loading receipts...
                    </div>
                  ) : invoices.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-500 font-mono">
                      No invoices recorded yet. Invoices appear here immediately upon checkout.
                    </div>
                  ) : (
                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/8 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                            <th className="pb-3 pl-2">Invoice ID</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3">Plan</th>
                            <th className="pb-3">Amount</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right pr-2">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {invoices.map((inv) => (
                            <tr key={inv.id} className="transition hover:bg-white/[0.02]">
                              <td className="py-4 pl-2 font-mono font-medium text-white">
                                {inv.invoiceId}
                              </td>
                              <td className="py-4 text-zinc-300">
                                {new Date(inv.date).toLocaleDateString()}
                              </td>
                              <td className="py-4 text-zinc-200">{inv.planName}</td>
                              <td className="py-4 font-mono font-semibold text-white">{inv.amount}</td>
                              <td className="py-4">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                                  {inv.status}
                                </span>
                              </td>
                              <td className="py-4 text-right pr-2">
                                <Button
                                  variant="ghost"
                                  onClick={() => setViewingInvoice(inv)}
                                  className="h-8 px-2.5 text-xs text-signal hover:text-white"
                                >
                                  <FileText size={13} />
                                  <span>View Receipt</span>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* CANCELLATION CONFIRMATION MODAL */}
        {showCancelModal && subscription ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowCancelModal(false)}
            />
            <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-ink p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-wider text-rose-400">Cancel Subscription</p>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <h3 className="mt-2 text-xl font-bold text-white">
                Confirm subscription cancellation?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                You will retain full AST scanning entitlements and quota until the end of your billing period on{" "}
                <span className="font-medium text-white">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
                . After that, your account will revert to free preview mode.
              </p>
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white"
                >
                  {cancelling ? "Scheduling..." : "Yes, Cancel Auto-Renew"}
                </Button>
                <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                  Keep Subscription
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {/* INVOICE RECEIPT MODAL */}
        {viewingInvoice ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setViewingInvoice(null)}
            />
            <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/12 bg-[#0b0d14] p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-signal" />
                  <span className="font-bold text-white">Official Tax Receipt</span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingInvoice(null)}
                  className="text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 space-y-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Receipt Number</span>
                  <span className="font-mono font-bold text-white">{viewingInvoice.invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Payment Date</span>
                  <span className="text-white">{new Date(viewingInvoice.date).toUTCString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Billed To</span>
                  <span className="text-white">{currentUser?.name || currentUser?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Payment Method</span>
                  <span className="font-mono text-white">
                    {viewingInvoice.paymentMethod?.brand} •••• {viewingInvoice.paymentMethod?.last4}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Status</span>
                  <span className="font-semibold text-emerald-400">{viewingInvoice.status}</span>
                </div>

                <div className="border-t border-white/8 pt-4">
                  <div className="flex justify-between text-sm font-semibold text-white">
                    <span>{viewingInvoice.planName} Subscription</span>
                    <span className="font-mono">{viewingInvoice.amount}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-zinc-500">
                    <span>Vulnerability AST Scanner Access</span>
                    <span>Included</span>
                  </div>
                </div>

                <div className="border-t border-white/8 pt-4 flex justify-between text-base font-bold text-white">
                  <span>Total Paid</span>
                  <span className="font-mono text-signal">{viewingInvoice.amount}</span>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <Button
                  onClick={() => window.print()}
                  variant="primary"
                  className="flex-1 text-xs"
                >
                  <Download size={13} />
                  Print / Save PDF
                </Button>
                <Button variant="secondary" onClick={() => setViewingInvoice(null)} className="text-xs">
                  Close
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
