import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * A memory router. The app runs in a frame without a URL of its own, so
 * routes live in memory, not in `location` or `history`.
 */
interface Router {
  path: string;
  navigate(path: string): void;
  back(): void;
}

const RouterContext = createContext<Router | null>(null);

export function MemoryRouter({
  initialPath = "/",
  children,
}: {
  initialPath?: string;
  children: ReactNode;
}) {
  const [stack, setStack] = useState([initialPath]);
  const router: Router = {
    path: stack.at(-1)!,
    navigate: (path) => setStack((current) => [...current, path]),
    back: () =>
      setStack((current) => (current.length > 1 ? current.slice(0, -1) : current)),
  };
  return <RouterContext.Provider value={router}>{children}</RouterContext.Provider>;
}

export function useRouter(): Router {
  const router = useContext(RouterContext);
  if (!router) throw new Error("useRouter needs a <MemoryRouter> above it.");
  return router;
}

/** Renders the element of the first route that matches the current path exactly. */
export function Routes({ routes }: { routes: Record<string, () => ReactNode> }) {
  const { path } = useRouter();
  const render = routes[path] ?? routes["*"];
  return render ? <>{render()}</> : null;
}

export function Link({ to, children }: { to: string; children: ReactNode }) {
  const { navigate } = useRouter();
  return (
    <button type="button" className="link" onClick={() => navigate(to)}>
      {children}
    </button>
  );
}
