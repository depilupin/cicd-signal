import { createContext } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role?: string;
  emailVerified?: boolean;
}

export type Intent = "scan" | "login" | "signup" | null;

export type ViewPath = "/" | "/pricing" | "/billing" | "/app";

export interface UiContextValue {
  // Modal dialog intent
  intent: Intent;
  openScan: () => void;
  openLogin: () => void;
  openSignup: () => void;
  close: () => void;

  // Authentication state
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  loadingAuth: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<AuthUser | null>;

  // Routing & view state
  currentPath: string;
  selectedPlanId: string | null;
  navigate: (path: string, planId?: string) => void;

  // Flash notification / welcome message
  notification: string | null;
  setNotification: (msg: string | null) => void;
}

export const UiContext = createContext<UiContextValue | null>(null);
