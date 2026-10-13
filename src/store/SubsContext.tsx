import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { rollForward, type Cycle, type Subscription } from "../data/subscriptions";
import type { IconName } from "../data/mock";
import { KEYS, loadJSON, saveJSON } from "./storage";

export const SUB_ICONS: IconName[] = [
  "tv-outline",
  "musical-notes-outline",
  "game-controller-outline",
  "newspaper-outline",
  "cloud-outline",
  "wifi-outline",
  "car-outline",
  "heart-outline",
];

type Ctx = {
  subs: Subscription[];
  ready: boolean;
  addSub: (name: string, amount: number, cycle: Cycle, nextTs: number) => Subscription;
  removeSub: (id: string) => void;
  markPaid: (id: string) => void;
  setSubNotifIds: (id: string, notifIds: string[]) => void;
  updateSub: (id: string, changes: { name?: string; amount?: number; cycle?: Cycle; nextTs?: number }) => void;
  resetSubs: () => void;
};

const SubsContext = createContext<Ctx>({
  subs: [],
  ready: false,
  addSub: () => ({ id: "0", name: "", amount: 0, cycle: "monthly", nextTs: Date.now(), icon: "receipt-outline" }),
  removeSub: () => {},
  markPaid: () => {},
  setSubNotifIds: () => {},
  updateSub: () => {},
  resetSubs: () => {},
});

export function SubsProvider({ children }: { children: ReactNode }) {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    loadJSON<Subscription[]>(KEYS.subs, []).then((saved) => {
      if (!live) return;
      if (Array.isArray(saved)) setSubs(saved);
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveJSON(KEYS.subs, subs);
  }, [subs, ready]);

  function addSub(name: string, amount: number, cycle: Cycle, nextTs: number): Subscription {
    const sub: Subscription = {
      id: `s${Date.now()}`,
      name,
      amount,
      cycle,
      nextTs,
      icon: SUB_ICONS[subs.length % SUB_ICONS.length],
      notifIds: [],
    };
    setSubs((prev) => [...prev, sub]);
    return sub;
  }

  function removeSub(id: string) {
    setSubs((prev) => prev.filter((s) => s.id !== id));
  }

  function markPaid(id: string) {
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, nextTs: rollForward(s) } : s)));
  }

  function setSubNotifIds(id: string, notifIds: string[]) {
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, notifIds } : s)));
  }

  function updateSub(id: string, changes: { name?: string; amount?: number; cycle?: Cycle; nextTs?: number }) {
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, ...changes } : s)));
  }

  function resetSubs() {
    setSubs([]);
  }

  return <SubsContext.Provider value={{ subs, ready, addSub, removeSub, markPaid, setSubNotifIds, updateSub, resetSubs }}>{children}</SubsContext.Provider>;
}

export function useSubs() {
  return useContext(SubsContext);
}
