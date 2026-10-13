import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CATEGORY_ICONS, normalizeCategory, type Budget } from "../data/mock";
import { KEYS, loadJSON, saveJSON } from "./storage";

type Ctx = {
  budgets: Budget[];
  ready: boolean;
  addBudget: (label: string, limit: number, cats: string[]) => void;
  removeBudget: (id: string) => void;
  updateBudget: (id: string, changes: { label?: string; limit?: number; cats?: string[] }) => void;
  resetBudgets: () => void;
};

const BudgetsContext = createContext<Ctx>({
  budgets: [],
  ready: false,
  addBudget: () => {},
  removeBudget: () => {},
  updateBudget: () => {},
  resetBudgets: () => {},
});

export function BudgetsProvider({ children }: { children: ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    loadJSON<Budget[]>(KEYS.budgets, []).then((saved) => {
      if (!live) return;
      if (Array.isArray(saved)) {
        setBudgets(
          saved.map((b) => {
            const cats = b.cats.map(normalizeCategory);
            return { ...b, cats, icon: CATEGORY_ICONS[cats[0]] ?? b.icon };
          })
        );
      }
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveJSON(KEYS.budgets, budgets);
  }, [budgets, ready]);

  function addBudget(label: string, limit: number, cats: string[]) {
    const budget: Budget = {
      id: `b${Date.now()}`,
      label,
      limit,
      icon: CATEGORY_ICONS[cats[0]] ?? "receipt-outline",
      cats,
    };
    setBudgets((prev) => [...prev, budget]);
  }

  function removeBudget(id: string) {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }

  function updateBudget(id: string, changes: { label?: string; limit?: number; cats?: string[] }) {
    setBudgets((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              ...changes,
              icon:
                changes.cats && changes.cats.length > 0
                  ? CATEGORY_ICONS[changes.cats[0]] ?? b.icon
                  : b.icon,
            }
          : b
      )
    );
  }

  function resetBudgets() {
    setBudgets([]);
  }

  return <BudgetsContext.Provider value={{ budgets, ready, addBudget, removeBudget, updateBudget, resetBudgets }}>{children}</BudgetsContext.Provider>;
}

export function useBudgets() {
  return useContext(BudgetsContext);
}
