"use client";

import { createContext, useCallback, useContext, useState } from "react";

type NotifType = "chat" | "requests";
type NotifState = { chat: number; requests: number };
type NotifCtx = NotifState & {
  increment: (type: NotifType) => void;
  clear: (type: NotifType) => void;
};

const Ctx = createContext<NotifCtx>({ chat: 0, requests: 0, increment: () => {}, clear: () => {} });

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NotifState>({ chat: 0, requests: 0 });
  const increment = useCallback((type: NotifType) => setState((s) => ({ ...s, [type]: s[type] + 1 })), []);
  const clear = useCallback((type: NotifType) => setState((s) => ({ ...s, [type]: 0 })), []);
  return <Ctx.Provider value={{ ...state, increment, clear }}>{children}</Ctx.Provider>;
}

export function useNotifications() {
  return useContext(Ctx);
}
