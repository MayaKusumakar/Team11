import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastCtx = createContext(null);

function Toast({ toast, onClose }) {
  const tone =
    toast.type === "error"
      ? "border-white/10-white/10-white/10-white/10-white/10-white/10-red-200 bg-red-50 text-red-800"
      : toast.type === "success"
      ? "border-white/10-white/10-white/10-white/10-white/10-white/10-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-white/10-white/10-white/10-white/10-white/10-white/10-black/10 bg-slate-950/40 text-black";

  return (
    <div className={`w-[340px] rounded-2xl border-white/10-white/10-white/10-white/10-white/10-white/10 p-4 shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
          <div className="mt-1 text-sm opacity-90">{toast.message}</div>
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="rounded-lg px-2 py-1 text-sm opacity-70 hover:opacity-100"
          aria-label="Close toast"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const pushToast = useCallback((t) => {
    const id = crypto.randomUUID();
    const toast = { id, type: "info", ...t };
    setToasts((prev) => [toast, ...prev].slice(0, 3)); // max 3 on screen

    const ms = toast.durationMs ?? 3500;
    window.setTimeout(() => removeToast(id), ms);
  }, [removeToast]);

  const value = useMemo(() => ({ toast: pushToast }), [pushToast]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[999] flex flex-col gap-3">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}