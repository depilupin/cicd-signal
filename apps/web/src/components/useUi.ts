import { useContext } from "react";
import { UiContext, type UiContextValue } from "./UiContext";

export function useUi(): UiContextValue {
  const value = useContext(UiContext);
  if (!value) {
    throw new Error("useUi must be used within a UiProvider");
  }
  return value;
}
