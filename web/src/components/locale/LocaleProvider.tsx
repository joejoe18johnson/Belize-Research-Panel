"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { HomeLocale } from "@/lib/home-locale";
import { REGISTRATION_COPY, type RegistrationCopy } from "@/lib/registration-locale";

const LocaleContext = createContext<HomeLocale>("en");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: HomeLocale;
  children: ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): HomeLocale {
  return useContext(LocaleContext);
}

export function useRegistrationCopy(): RegistrationCopy {
  return REGISTRATION_COPY[useLocale()];
}

/** English title-case for EN only; leave Spanish strings as authored. */
export function useDisplayCopy() {
  const locale = useLocale();
  return (text: string, formatEn?: (value: string) => string) =>
    locale === "en" && formatEn ? formatEn(text) : text;
}
