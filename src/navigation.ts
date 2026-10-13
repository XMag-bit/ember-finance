import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

/** Navigate from outside components (e.g. notification taps). */
export function navigate(name: string, params?: object) {
  if (!navigationRef.isReady()) return;
  (navigationRef as unknown as { navigate: (name: string, params?: object) => void }).navigate(name, params);
}
