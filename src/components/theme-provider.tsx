import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Mode = "light" | "dark" | "system";
export type ResolvedMode = "light" | "dark";

const VALID_MODES: Mode[] = ["light", "dark", "system"];

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultMode?: Mode;
  storageKey?: string;
};

type ThemeProviderState = {
  mode: Mode;
  resolvedMode: ResolvedMode;
  setMode: (mode: Mode) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined
);

const getSystemMode = (): ResolvedMode => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getStoredMode = (storageKey: string, defaultMode: Mode): Mode => {
  if (typeof window === "undefined") {
    return defaultMode;
  }

  const storedMode = window.localStorage.getItem(`${storageKey}-mode`);

  return VALID_MODES.includes(storedMode as Mode)
    ? (storedMode as Mode)
    : defaultMode;
};

export function ThemeProvider({
  children,
  defaultMode = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [mode, setCurrentMode] = useState<Mode>(() =>
    getStoredMode(storageKey, defaultMode)
  );
  const [systemMode, setSystemMode] = useState<ResolvedMode>(() =>
    getSystemMode()
  );

  const resolvedMode = mode === "system" ? systemMode : mode;

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleModeChange = (event: MediaQueryListEvent) => {
      setSystemMode(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleModeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleModeChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedMode);
  }, [resolvedMode]);

  const setMode = useCallback(
    (newMode: Mode) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`${storageKey}-mode`, newMode);
      }
      setCurrentMode(newMode);
    },
    [storageKey]
  );

  const value = useMemo<ThemeProviderState>(
    () => ({
      mode,
      resolvedMode,
      setMode,
    }),
    [mode, resolvedMode, setMode]
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = (): ThemeProviderState => {
  const context = useContext(ThemeProviderContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
