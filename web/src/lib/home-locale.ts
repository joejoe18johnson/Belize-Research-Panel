export type HomeLocale = "en" | "es";

export const HOME_LOCALE_STORAGE_KEY = "brp_home_locale";
export const REGISTER_LANG_CONFIRMED_KEY = "brp_register_lang_confirmed";

export const HOME_COPY = {
  en: {
    logIn: "Log in",
    clientPortal: "Client portal",
    register: "Register",
    eyebrow: "Exclusive research panel · earn rewards",
    headline: "Share your opinion. Get rewarded.",
    description:
      "Qualified panelists earn points for every survey they complete — then redeem for cash, mobile phone credit, utility credit, and more. Join Belize's trusted platform for public opinion polling, market research, and governance studies.",
    rewardsBadge: "Qualified panelists get paid for their opinions",
    rewardsHeadline: "Turn your views into real rewards",
    rewardsDescription:
      "Complete verified surveys matched to your profile and stack points toward redemptions you can actually use in Belize — cash to your bank, phone credit on DigiCell or Smart!, utility top-ups, and more.",
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
        title: "Utility credit & more",
        body: "Choose utility bill credit, bank payout, and other practical redemption options.",
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
        body: "Qualified panelists earn points on every completed survey — redeem for cash, phone credit, utility credit, and more.",
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
    clientPortal: "Portal de clientes",
    register: "Registrarse",
    eyebrow: "Panel de investigación exclusivo · gane recompensas",
    headline: "Comparta su opinión. Reciba recompensas.",
    description:
      "Los panelistas calificados ganan puntos por cada encuesta completada — y los canjean por efectivo, crédito telefónico, crédito de servicios públicos y más. Únase a la plataforma de confianza de Belice para encuestas de opinión pública, investigación de mercado y estudios de gobernanza.",
    rewardsBadge: "Los panelistas calificados reciben pago por sus opiniones",
    rewardsHeadline: "Convierta sus opiniones en recompensas reales",
    rewardsDescription:
      "Complete encuestas verificadas acordes a su perfil y acumule puntos para canjearlos en Belice: efectivo a su banco, crédito telefónico en DigiCell o Smart!, recargas de servicios públicos y más.",
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
        title: "Servicios públicos y más",
        body: "Elija crédito de servicios públicos, pago bancario y otras opciones prácticas.",
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
        body: "Los panelistas calificados ganan puntos en cada encuesta completada — canjeables por efectivo, crédito telefónico, crédito de servicios públicos y más.",
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

export const REGISTER_GATE_COPY = {
  en: {
    languageStep: {
      title: "Choose your language",
      titleBilingual: "Choose your language / Elija su idioma",
      subtitle: "Select the language you prefer for registration. You can change it later.",
      continue: "Continue",
    },
    title: "Panelist registration",
    subtitle:
      "Create an account and verify your email before completing the registration form. Eligibility is checked when you sign up.",
    steps: [
      "Confirm your citizenship and age eligibility.",
      "Create an account with your name, email, and password.",
      "Verify your email address.",
      "Complete the panelist registration form.",
    ],
    createAccount: "Create account",
    loginExisting: "Log in to existing account",
  },
  es: {
    languageStep: {
      title: "Elija su idioma",
      titleBilingual: "Choose your language / Elija su idioma",
      subtitle: "Seleccione el idioma que prefiere para el registro. Puede cambiarlo más adelante.",
      continue: "Continuar",
    },
    title: "Registro de panelista",
    subtitle:
      "Cree una cuenta y verifique su correo electrónico antes de completar el formulario de registro. La elegibilidad se verifica al registrarse.",
    steps: [
      "Confirme su ciudadanía y elegibilidad por edad.",
      "Cree una cuenta con su nombre, correo electrónico y contraseña.",
      "Verifique su dirección de correo electrónico.",
      "Complete el formulario de registro del panelista.",
    ],
    createAccount: "Crear cuenta",
    loginExisting: "Iniciar sesión con cuenta existente",
  },
} as const;

export function localeDisplayName(locale: HomeLocale): string {
  return locale === "en" ? HOME_COPY.en.english : HOME_COPY.es.spanish;
}

export function isRegisterLanguageConfirmed(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(REGISTER_LANG_CONFIRMED_KEY) === "1";
}

export function confirmRegisterLanguage(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(REGISTER_LANG_CONFIRMED_KEY, "1");
}

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
