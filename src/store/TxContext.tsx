import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CATEGORY_ICONS, categories, normalizeCategory, type Tx } from "../data/mock";
import { KEYS, loadJSON, saveJSON } from "./storage";

export type NewTx = {
  title: string;
  amount: number; // signed: negative = expense, positive = income
  category: string;
  ts: number;
  paymentMethod?: string;
};

type Ctx = {
  txs: Tx[];
  /** Every category ever used, minus the built-in list = user-created customs. */
  customCats: string[];
  ready: boolean;
  addTx: (input: NewTx) => Tx;
  removeTx: (id: string) => void;
  updateTx: (id: string, changes: Partial<NewTx>) => void;
  resetTxs: () => void;
};

const TxContext = createContext<Ctx>({
  txs: [],
  customCats: [],
  ready: false,
  addTx: () => ({ id: "0", title: "", category: "", ts: Date.now(), amount: 0, icon: "receipt-outline" }),
  removeTx: () => {},
  updateTx: () => {},
  resetTxs: () => {},
});

const BUILT_IN = new Set<string>([...categories]);

export function TxProvider({ children }: { children: ReactNode }) {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    loadJSON<Tx[]>(KEYS.txs, []).then((saved) => {
      if (!live) return;
      if (Array.isArray(saved)) {
        setTxs(
          saved.map((t) => {
            const category = normalizeCategory(t.category);
            if (category === t.category) return t;
            return { ...t, category, icon: CATEGORY_ICONS[category] ?? t.icon };
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
    saveJSON(KEYS.txs, txs);
  }, [txs, ready]);

  const customCats = React.useMemo(() => {
    const seen: string[] = [];
    for (const t of txs) {
      if (!BUILT_IN.has(t.category) && !seen.includes(t.category)) seen.push(t.category);
    }
    return seen;
  }, [txs]);

  function addTx(input: NewTx): Tx {
    const tx: Tx = {
      id: `${Date.now()}`,
      title: input.title,
      amount: input.amount,
      category: input.category,
      ts: input.ts,
      icon: CATEGORY_ICONS[input.category] ?? "pricetag-outline",
      paymentMethod: input.paymentMethod,
    };
    setTxs((prev) => [tx, ...prev]);
    return tx;
  }

  function removeTx(id: string) {
    setTxs((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTx(id: string, changes: Partial<NewTx>) {
    setTxs((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...changes,
              icon: changes.category ? CATEGORY_ICONS[changes.category] ?? t.icon : t.icon,
            }
          : t
      )
    );
  }

  function resetTxs() {
    setTxs([]);
  }

  return <TxContext.Provider value={{ txs, customCats, ready, addTx, removeTx, updateTx, resetTxs }}>{children}</TxContext.Provider>;
}

export function useTxs() {
  return useContext(TxContext);
}
