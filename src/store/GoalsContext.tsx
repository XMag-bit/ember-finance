import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Goal, type IconName } from "../data/mock";
import { KEYS, loadJSON, saveJSON } from "./storage";

const GOAL_ICONS: IconName[] = [
  "trophy-outline",
  "star-outline",
  "gift-outline",
  "home-outline",
  "airplane-outline",
  "car-outline",
];

type Ctx = {
  goals: Goal[];
  ready: boolean;
  addGoal: (title: string, target: number) => void;
  addFunds: (id: string, amount: number) => void;
  removeGoal: (id: string) => void;
  updateGoal: (id: string, changes: { title?: string; target?: number; saved?: number }) => void;
  resetGoals: () => void;
};

const GoalsContext = createContext<Ctx>({
  goals: [],
  ready: false,
  addGoal: () => {},
  addFunds: () => {},
  removeGoal: () => {},
  updateGoal: () => {},
  resetGoals: () => {},
});

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    loadJSON<Goal[]>(KEYS.goals, []).then((saved) => {
      if (!live) return;
      if (Array.isArray(saved)) setGoals(saved);
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveJSON(KEYS.goals, goals);
  }, [goals, ready]);

  function addGoal(title: string, target: number) {
    const goal: Goal = {
      id: `g${Date.now()}`,
      title,
      saved: 0,
      target,
      icon: GOAL_ICONS[goals.length % GOAL_ICONS.length],
      note: "Just started",
    };
    setGoals((prev) => [...prev, goal]);
  }

  function addFunds(id: string, amount: number) {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, saved: g.saved + amount } : g))
    );
  }

  function removeGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  function updateGoal(id: string, changes: { title?: string; target?: number; saved?: number }) {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...changes } : g)));
  }

  function resetGoals() {
    setGoals([]);
  }

  return <GoalsContext.Provider value={{ goals, ready, addGoal, addFunds, removeGoal, updateGoal, resetGoals }}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  return useContext(GoalsContext);
}
