import { useEffect, useState } from "react";

type Toast = { id: number; kind: "info" | "error"; message: string };

let nextId = 1;
const subscribers = new Set<(t: Toast) => void>();

export function notify(message: string, kind: "info" | "error" = "info") {
  const t: Toast = { id: nextId++, kind, message };
  subscribers.forEach((s) => s(t));
}

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const sub = (t: Toast) => {
      setToasts((cur) => [...cur, t]);
      setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), 3500);
    };
    subscribers.add(sub);
    return () => {
      subscribers.delete(sub);
    };
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            "mono rounded-md border px-3 py-2 text-[13px] " +
            (t.kind === "error"
              ? "border-red-400/40 bg-red-500/10 text-red-300"
              : "border-signal/40 bg-signal/10 text-signal")
          }
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
