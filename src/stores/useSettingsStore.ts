import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsStore {
  promptSymbol: string;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (_set) => ({
      promptSymbol: ">",
    }),
    { name: "headway:settings" }
  )
);
