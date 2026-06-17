export type HomeLocale = "en" | "es";

export const HOME_LOCALE_STORAGE_KEY = "brp_home_locale";

export const HOME_COPY = {
  en: {
    logIn: "Log in",
    register: "Register",
    eyebrow: "Exclusive research panel · earn rewards",
    headline: "Share your opinion. Get rewarded.",
    description:
      "Qualified panelists earn points for every survey they complete — then redeem for cash, mobile phone credit, gift cards, utility credit, and more. Join Belize's trusted platform for public opinion polling, market research, and governance studies.",
    rewardsBadge: "Qualified panelists get paid for their opinions",
    rewardsHeadline: "Turn your views into real rewards",
    rewardsDescription:
      "Complete verified surveys matched to your profile and stack points toward redemptions you can actually use in Belize — cash to your bank, phone credit on DigiCell or Smart!, gift cards, utility top-ups, and more.",
    rewardsCta: "Register & start earning",
    rewardPerks: [
      {
        title: "Cash payouts",
        body: "Redeem points for bank transfer payouts when you reach the minimum balance.",
      },
      {
        title: "Phone credit",
        body: "Top up DigiCell or Smart! with airtime credit in convenient BZ$ increments.",
      },
      {
        title: "Gift cards & utility credit",
        body: "Choose gift cards, utility bill credit, and other practical redemption options.",
      },
      {
        title: "More coming",
        body: "New reward partners and redemption types are added as the panel grows.",
      },
    ],
    registerCta: "Register & earn rewards",
    loginCta: "Panelist login",
    features: [
      {
        title: "Earn real rewards",
        body: "Qualified panelists earn points on every completed survey — redeem for cash, phone credit, gift cards, and more.",
      },
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
    eyebrow: "Panel de investigación exclusivo · gane recompensas",
    headline: "Comparta su opinión. Reciba recompensas.",
    description:
      "Los panelistas calificados ganan puntos por cada encuesta completada — y los canjean por efectivo, crédito telefónico, tarjetas de regalo, crédito de servicios públicos y más. Únase a la plataforma de confianza de Belice para encuestas de opinión pública, investigación de mercado y estudios de gobernanza.",
    rewardsBadge: "Los panelistas calificados reciben pago por sus opiniones",
    rewardsHeadline: "Convierta sus opiniones en recompensas reales",
    rewardsDescription:
      "Complete encuestas verificadas acordes a su perfil y acumule puntos para canjearlos en Belice: efectivo a su banco, crédito telefónico en DigiCell o Smart!, tarjetas de regalo, recargas de servicios públicos y más.",
    rewardsCta: "Registrarse y empezar a ganar",
    rewardPerks: [
      {
        title: "Pagos en efectivo",
        body: "Canjee puntos por transferencias bancarias al alcanzar el saldo mínimo.",
      },
      {
        title: "Crédito telefónico",
        body: "Recargue DigiCell o Smart! con crédito de tiempo aire en incrementos de BZ$.",
      },
      {
        title: "Tarjetas de regalo y servicios",
        body: "Elija tarjetas de regalo, crédito de servicios públicos y otras opciones prácticas.",
      },
      {
        title: "Más por venir",
        body: "Se añaden nuevos socios y tipos de canje a medida que crece el panel.",
      },
    ],
    registerCta: "Registrarse y ganar recompensas",
    loginCta: "Acceso de panelistas",
    features: [
      {
        title: "Recompensas reales",
        body: "Los panelistas calificados ganan puntos en cada encuesta completada — canjeables por efectivo, crédito telefónico, tarjetas de regalo y más.",
      },
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
