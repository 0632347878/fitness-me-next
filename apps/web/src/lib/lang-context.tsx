"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { translations } from "@/lib/i18n";

type Lang = "en" | "ru";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => Promise<void>;
  loading: boolean;
}

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: async () => {},
  loading: false,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [loading, setLoading] = useState(false);

  // Load lang from server on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("accessToken") : null;
    if (!token) return;
    apiClient.get<{ lang?: string }>("/users/me")
      .then((res) => {
        const l = res.data.lang;
        if (l === "ru" || l === "en") setLangState(l);
      })
      .catch(() => {});
  }, []);

  const setLang = useCallback(async (newLang: Lang) => {
    setLoading(true);
    try {
      await apiClient.patch("/users/me", { lang: newLang });
      setLangState(newLang);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang, loading }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  const { lang } = useLang();
  return translations[lang];
}

