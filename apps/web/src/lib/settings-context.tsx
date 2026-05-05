"use client";
import React, { createContext, useContext, useState } from "react";
interface SettingsContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}
const SettingsContext = createContext<SettingsContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SettingsContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </SettingsContext.Provider>
  );
}
export function useSettings() {
  return useContext(SettingsContext);
}
