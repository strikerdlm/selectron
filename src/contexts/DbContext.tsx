import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { db } from "@/db/schema";
import { seedDevIfEmpty } from "@/db/seedDev";

const DbContext = createContext<typeof db | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      await db.open();
      await seedDevIfEmpty();
      setReady(true);
    })();
  }, []);
  if (!ready) return <div className="p-12 text-ink-2">opening database…</div>;
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

export function useDb() {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error("useDb outside DbProvider");
  return ctx;
}
