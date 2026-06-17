export type HomeLocale = "en" | "es";

export const HOME_LOCALE_STORAGE_KEY = "brp_home_locale";

export const HOME_COPY = {
  en: {
    logIn: "Log in",
    register: "Register",
    eyebrow: "Exclusive research panel",
    headline: "Public opinion polling, market research, and governance studies for Belize",
    description:
      "A secure, invitation-quality research platform. Create an account, verify your email, then complete panelist registration to participate in surveys matched to your profile and interests.",
    registerCta: "Register for the panel",
    loginCta: "Panelist login",
    features: [
      {
        title: "Verified eligibility",
        body: "Age, citizenship, residency, and voter status checks before panel admission.",
      },
      {
        title: "Secure accounts",
        body: "Create an account with email verification before completing panelist registration.",
      },
      {
        title: "Matched research",
        body: "Political, market, and civic interest profiling for relevant survey invitations.",
      },
    ],
    languageLabel: "Language",
    english: "English",
    spanish: "Spanish",
  },
  es: {
    logIn: "Iniciar sesión",
    register: "Registrarse",
    eyebrow: "Panel de investigación exclusivo",
    headline: "Encuestas de opinión pública, investigación de mercado y estudios de gobernanza para Belice",
    description:
      "Una plataforma de investigación segura y de calidad por invitación. Cree una cuenta, verifique su correo electrónico y complete el registro del panelista para participar en encuestas acordes a su perfil e intereses.",
    registerCta: "Registrarse en el panel",
    loginCta: "Acceso de panelistas",
    features: [
      {
        title: "Elegibilidad verificada",
        body: "Verificación de edad, ciudadanía, residencia y estado electoral antes de ingresar al panel.",
      },
      {
        title: "Cuentas seguras",
        body: "Cree una cuenta con verificación de correo electrónico antes de completar el registro del panelista.",
      },
      {
        title: "Investigación personalizada",
        body: "Perfil político, de mercado y cívico para recibir invitaciones de encuestas relevantes.",
      },
    ],
    languageLabel: "Idioma",
    english: "English",
    spanish: "Español",
  },
} as const;

export function isHomeLocale(value: string | null | undefined): value is HomeLocale {
  return value === "en" || value === "es";
}

export function readStoredHomeLocale(): HomeLocale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(HOME_LOCALE_STORAGE_KEY);
  return isHomeLocale(stored) ? stored : "en";
}

export function storeHomeLocale(locale: HomeLocale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HOME_LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}
