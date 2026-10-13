import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { KEYS, loadJSON, saveJSON } from "./storage";

export type Profile = {
  name: string;
  currency: string;
  remindersEnabled: boolean;
  /** "HH:MM" local time for subscription reminders. */
  reminderTime: string;
  lastPayMethod: string;
  customPayMethods: string[];
};

const EMPTY_PROFILE: Profile = {
  name: "",
  currency: "USD",
  remindersEnabled: true,
  reminderTime: "09:00",
  lastPayMethod: "Cash",
  customPayMethods: [],
};

type SavedUser = {
  profile: Profile;
  onboarded: boolean;
};

type Ctx = {
  profile: Profile;
  onboarded: boolean;
  ready: boolean;
  updateProfile: (p: Profile) => void;
  completeOnboarding: (name: string) => void;
  resetProfile: () => void;
};

const UserContext = createContext<Ctx>({
  profile: EMPTY_PROFILE,
  onboarded: false,
  ready: false,
  updateProfile: () => {},
  completeOnboarding: () => {},
  resetProfile: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [onboarded, setOnboarded] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    loadJSON<SavedUser | null>(KEYS.profile, null).then((saved) => {
      if (!live) return;
      if (saved && typeof saved === "object") {
        if (saved.profile && typeof saved.profile === "object") {
          setProfile({ ...EMPTY_PROFILE, ...saved.profile });
        }
        if (saved.onboarded === true) setOnboarded(true);
      }
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveJSON(KEYS.profile, { profile, onboarded });
  }, [profile, onboarded, ready]);

  function completeOnboarding(name: string) {
    setProfile((prev) => ({ ...prev, name: name.trim() }));
    setOnboarded(true);
  }

  function resetProfile() {
    setProfile(EMPTY_PROFILE);
    setOnboarded(false);
  }

  return (
    <UserContext.Provider value={{ profile, onboarded, ready, updateProfile: setProfile, completeOnboarding, resetProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useProfile() {
  return useContext(UserContext);
}

export function initialOf(name: string) {
  const clean = name.trim();
  return clean ? clean.charAt(0).toUpperCase() : "?";
}
