import { useCallback, useEffect, useState, type ReactNode } from "react";
import { UiContext, type AuthUser, type Intent } from "./UiContext";
import { AccessDialog } from "./AccessDialog";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getInitialLocationState() {
  if (typeof window === "undefined") {
    return { path: "/", planId: null, notification: null };
  }
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const plan = searchParams.get("plan");
  const auth = searchParams.get("auth");

  let path = "/";
  if (pathname === "/pricing" || searchParams.get("view") === "pricing") {
    path = "/pricing";
  } else if (pathname === "/billing" || searchParams.get("view") === "billing") {
    path = "/billing";
  } else if (pathname === "/app" || searchParams.get("view") === "app") {
    path = "/app";
  }

  const notification =
    auth === "google_success"
      ? "Authenticated via Google! Pick your research subscription below."
      : null;

  return { path, planId: plan, notification };
}

export function UiProvider({ children }: { children: ReactNode }) {
  const initial = getInitialLocationState();
  const [intent, setIntent] = useState<Intent>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentPath, setCurrentPath] = useState<string>(initial.path);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initial.planId);
  const [notification, setNotification] = useState<string | null>(initial.notification);

  const openScan = useCallback(() => setIntent("scan"), []);
  const openLogin = useCallback(() => setIntent("login"), []);
  const openSignup = useCallback(() => setIntent("signup"), []);
  const close = useCallback(() => setIntent(null), []);

  const navigate = useCallback((path: string, planId?: string) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const query = planId ? `?plan=${planId}` : "";
    window.history.pushState({}, "", `${cleanPath}${query}`);
    setCurrentPath(cleanPath);
    if (planId) {
      setSelectedPlanId(planId);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const refreshAuth = useCallback(async (): Promise<AuthUser | null> => {
    try {
      setLoadingAuth(true);
      const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user) {
          setCurrentUser(json.data.user);
          return json.data.user;
        }
      }
      setCurrentUser(null);
      return null;
    } catch {
      setCurrentUser(null);
      return null;
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${apiUrl}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      setCurrentUser(null);
      navigate("/");
    }
  }, [navigate]);

  // Sync back/forward popstate
  useEffect(() => {
    refreshAuth();

    const handlePopState = () => {
      const loc = getInitialLocationState();
      setCurrentPath(loc.path);
      if (loc.planId) setSelectedPlanId(loc.planId);
      if (loc.notification) setNotification(loc.notification);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [refreshAuth]);

  return (
    <UiContext.Provider
      value={{
        intent,
        openScan,
        openLogin,
        openSignup,
        close,
        currentUser,
        setCurrentUser,
        loadingAuth,
        logout,
        refreshAuth,
        currentPath,
        selectedPlanId,
        navigate,
        notification,
        setNotification,
      }}
    >
      {children}
      {intent ? (
        <AccessDialog
          key={intent}
          intent={intent}
          onClose={close}
        />
      ) : null}
    </UiContext.Provider>
  );
}
