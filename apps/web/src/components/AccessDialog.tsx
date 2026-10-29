import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { type Intent } from "./UiContext";
import { useUi } from "./useUi";
import { Button } from "./ui";
import { Loader2, AlertCircle } from "lucide-react";

interface AccessDialogProps {
  intent: Intent;
  onClose: () => void;
}

export function AccessDialog({ intent, onClose }: AccessDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const { setCurrentUser, navigate, setNotification } = useUi();
  const [activeTab, setActiveTab] = useState<"login" | "signup">(
    intent === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanDone, setScanDone] = useState(false);

  const isScanning = intent === "scan";

  useEffect(() => {
    if (!intent) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("input")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [intent, onClose]);

  if (!intent) return null;

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (isScanning) {
      setScanDone(true);
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = activeTab === "signup" ? "/api/v1/auth/signup" : "/api/v1/auth/login";
      const body =
        activeTab === "signup"
          ? { email: email.trim(), password, name: name.trim() }
          : { email: email.trim(), password };

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Authentication failed. Please check your credentials.");
      }

      // Successful auth
      if (json.data?.user) {
        setCurrentUser(json.data.user);
        const displayName = json.data.user.name || json.data.user.email.split("@")[0];
        setNotification(
          activeTab === "signup"
            ? `Welcome to Signal, ${displayName}! Select a research tier below to activate your account.`
            : `Welcome back, ${displayName}! Pick your research plan to continue.`
        );
      }

      onClose();
      // Crucial requirement: Upon sign in or sign up, lead to dedicated pricing
      navigate("/pricing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="glass relative z-10 w-full max-w-md rounded-3xl border border-white/10 p-6 sm:p-8"
      >
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal">
            {isScanning ? "Security Scan" : "Researcher Access"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:bg-white/5 hover:text-white focus-visible:outline-signal"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <h2 id={titleId} className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {isScanning
            ? "Point Signal at a repository."
            : activeTab === "signup"
              ? "Create your researcher account."
              : "Welcome back, researcher."}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {isScanning
            ? "Inspect workflow triggers, runner privileges, and pipeline secrets."
            : "Sign in to run authorized CI/CD workflow security evaluations and manage research subscriptions."}
        </p>

        {error ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Google OAuth Quick Action */}
        {!isScanning ? (
          <div className="mt-6 border-b border-white/10 pb-6">
            <a
              href={`${apiUrl}/api/v1/auth/google`}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-4 font-medium text-white transition duration-200 hover:border-white/25 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </a>

            <div className="relative mt-4 text-center">
              <span className="bg-ink px-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                Or with email
              </span>
            </div>

            {/* Tab switch between Sign In and Sign Up */}
            <div className="mt-4 flex rounded-xl border border-white/8 bg-white/[0.02] p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-1.5 font-medium transition ${
                  activeTab === "login"
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signup");
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-1.5 font-medium transition ${
                  activeTab === "signup"
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>
          </div>
        ) : null}

        {scanDone ? (
          <div className="mt-6 rounded-2xl border border-signal/30 bg-signal/10 p-4">
            <p className="text-sm font-medium text-signal">Scan request registered.</p>
            <p className="mt-1 text-sm text-zinc-300">
              Repository scanning for <span className="font-mono text-white">{repoUrl}</span> will initiate after GitHub authorization.
            </p>
            <Button className="mt-4 w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            {!isScanning && activeTab === "signup" ? (
              <label className="block text-sm text-zinc-300">
                Full Name
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-signal/50 focus:ring-1 focus:ring-signal/50"
                />
              </label>
            ) : null}

            {!isScanning ? (
              <>
                <label className="block text-sm text-zinc-300">
                  Email Address
                  <input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="researcher@lab.sec"
                    className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-signal/50 focus:ring-1 focus:ring-signal/50"
                  />
                </label>

                <label className="block text-sm text-zinc-300">
                  Password
                  <input
                    required
                    type="password"
                    name="password"
                    autoComplete={activeTab === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    minLength={8}
                    className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-signal/50 focus:ring-1 focus:ring-signal/50"
                  />
                </label>
              </>
            ) : (
              <label className="block text-sm text-zinc-300">
                Target Repository URL
                <input
                  required
                  type="url"
                  name="repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/organization/target-repo"
                  className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-signal/50 focus:ring-1 focus:ring-signal/50"
                />
              </label>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={15} className="animate-spin text-zinc-950" />
                    <span>Processing...</span>
                  </span>
                ) : isScanning ? (
                  "Launch Scan"
                ) : activeTab === "signup" ? (
                  "Create Account & View Plans"
                ) : (
                  "Sign In & View Plans"
                )}
              </Button>
              <Button variant="secondary" onClick={onClose} type="button">
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
