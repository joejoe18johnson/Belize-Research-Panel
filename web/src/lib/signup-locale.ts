import type { HomeLocale } from "./home-locale";
import {
  CITIZENSHIP_BELIZEAN_ABROAD,
  CITIZENSHIP_BELIZEAN_IN_BELIZE,
  CITIZENSHIP_COMMONWEALTH_IN_BELIZE,
  CITIZENSHIP_FOREIGNER_IN_BELIZE,
  CITIZENSHIP_OTHER,
} from "./constants";

export type SignupCopy = {
  pageTitle: string;
  pageSubtitle: string;
  citizenshipLabel: string;
  citizenshipIntro: string;
  citizenshipProofNote: string;
  citizenshipLabels: Record<string, string>;
  dobLabel: string;
  continueAccount: string;
  returnHome: string;
  alreadyHaveAccount: string;
  logIn: string;
  eligibilityConfirmedTitle: string;
  eligibilityConfirmedBody: string;
  changeEligibility: string;
  facebookSignup: string;
  facebookConnecting: string;
  orCreateWithEmail: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  createAccount: string;
  creatingAccount: string;
  back: string;
  passwordStrength: string;
  passwordStrengthHint: string;
  passwordsMatch: string;
  strengthWeak: string;
  strengthModerate: string;
  strengthStrong: string;
  dobMinAgeHint: string;
  dobMonthLabel: string;
  dobDayLabel: string;
  dobYearLabel: string;
  dobMonthPlaceholder: string;
  dobDayPlaceholder: string;
  dobYearPlaceholder: string;
  dobMonthNames: string[];
  ageRequirementTitle: string;
  ageRequirementBody: string;
  invalidDobTitle: string;
  invalidDobBody: string;
  citizenshipMetTitle: string;
  citizenshipMetBody: string;
  citizenshipNotMetTitle: string;
  citizenshipNotMetBody: string;
};

const MONTH_NAMES_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_NAMES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const CITIZENSHIP_LABELS_EN: Record<string, string> = {
  [CITIZENSHIP_BELIZEAN_IN_BELIZE]: "Belizean residing in Belize",
  [CITIZENSHIP_BELIZEAN_ABROAD]: "Belizean residing abroad (diaspora)",
  [CITIZENSHIP_COMMONWEALTH_IN_BELIZE]: "Commonwealth citizen residing in Belize",
  [CITIZENSHIP_FOREIGNER_IN_BELIZE]: "Other foreigner permanently residing in Belize",
  [CITIZENSHIP_OTHER]: "Other",
};

const CITIZENSHIP_LABELS_ES: Record<string, string> = {
  [CITIZENSHIP_BELIZEAN_IN_BELIZE]: "Beliceño residente en Belice",
  [CITIZENSHIP_BELIZEAN_ABROAD]: "Beliceño residente en el extranjero (diáspora)",
  [CITIZENSHIP_COMMONWEALTH_IN_BELIZE]: "Ciudadano de la Commonwealth residente en Belice",
  [CITIZENSHIP_FOREIGNER_IN_BELIZE]: "Otro extranjero residente permanente en Belice",
  [CITIZENSHIP_OTHER]: "Otro",
};

export const SIGNUP_COPY: Record<HomeLocale, SignupCopy> = {
  en: {
    pageTitle: "Create your account",
    pageSubtitle:
      "Confirm eligibility, then create your account with Facebook or email. Prefer WhatsApp or social contact if you do not use email.",
    citizenshipLabel: "Citizenship / residency status",
    citizenshipIntro:
      "Choose the option that best describes your citizenship and where you live. The panel is open to Belizeans in Belize, Belizeans abroad (diaspora), Commonwealth citizens residing in Belize, and other foreigners permanently residing in Belize.",
    citizenshipProofNote:
      "You will be required to provide proof of your citizenship or residency during panelist registration.",
    citizenshipLabels: CITIZENSHIP_LABELS_EN,
    dobLabel: "Date of birth",
    continueAccount: "Continue to account setup",
    returnHome: "Return home",
    alreadyHaveAccount: "Already have an account?",
    logIn: "Log in",
    eligibilityConfirmedTitle: "Eligibility confirmed",
    eligibilityConfirmedBody:
      "Proof of citizenship or residency will be required when you complete panelist registration. If you do not use email, sign up with Facebook and add WhatsApp or another social contact on the next registration step.",
    changeEligibility: "Change eligibility answers",
    facebookSignup: "Sign up with Facebook",
    facebookConnecting: "Connecting Facebook…",
    orCreateWithEmail: "or create with email",
    firstName: "First name",
    lastName: "Last name(s)",
    email: "Email address",
    password: "Password",
    confirmPassword: "Confirm password",
    createAccount: "Create account",
    creatingAccount: "Creating account…",
    back: "Back",
    passwordStrength: "Password strength",
    passwordStrengthHint: "Password must reach at least moderate strength (orange) before you can continue.",
    passwordsMatch: "Passwords match.",
    strengthWeak: "Weak",
    strengthModerate: "Moderate",
    strengthStrong: "Strong",
    dobMinAgeHint: "You must be at least 18 years old.",
    dobMonthLabel: "Month",
    dobDayLabel: "Day",
    dobYearLabel: "Year",
    dobMonthPlaceholder: "Month",
    dobDayPlaceholder: "Day",
    dobYearPlaceholder: "Year",
    dobMonthNames: MONTH_NAMES_EN,
    ageRequirementTitle: "Age requirement not met",
    ageRequirementBody: "You must be at least 18 years old to register for the panel.",
    invalidDobTitle: "Invalid date of birth",
    invalidDobBody: "Please select a valid month, day, and year.",
    citizenshipMetTitle: "Citizenship requirement met",
    citizenshipMetBody:
      "You can continue. Proof of citizenship or residency will be required during registration.",
    citizenshipNotMetTitle: "Citizenship requirement not met",
    citizenshipNotMetBody:
      "You cannot continue registration. Choose a different citizenship status or return home.",
  },
  es: {
    pageTitle: "Cree su cuenta",
    pageSubtitle:
      "Confirme su elegibilidad y luego cree su cuenta con Facebook o correo electrónico. Prefiera WhatsApp u otro contacto social si no usa correo.",
    citizenshipLabel: "Estado de ciudadanía / residencia",
    citizenshipIntro:
      "Elija la opción que mejor describa su ciudadanía y dónde vive. El panel está abierto a beliceños en Belice, beliceños en el extranjero (diáspora), ciudadanos de la Commonwealth residentes en Belice y otros extranjeros residentes permanentes en Belice.",
    citizenshipProofNote:
      "Deberá presentar comprobante de ciudadanía o residencia durante el registro como panelista.",
    citizenshipLabels: CITIZENSHIP_LABELS_ES,
    dobLabel: "Fecha de nacimiento",
    continueAccount: "Continuar a la configuración de la cuenta",
    returnHome: "Volver al inicio",
    alreadyHaveAccount: "¿Ya tiene una cuenta?",
    logIn: "Iniciar sesión",
    eligibilityConfirmedTitle: "Elegibilidad confirmada",
    eligibilityConfirmedBody:
      "Se requerirá comprobante de ciudadanía o residencia cuando complete el registro como panelista. Si no usa correo, regístrese con Facebook y agregue WhatsApp u otro contacto social en el siguiente paso.",
    changeEligibility: "Cambiar respuestas de elegibilidad",
    facebookSignup: "Registrarse con Facebook",
    facebookConnecting: "Conectando Facebook…",
    orCreateWithEmail: "o crear con correo electrónico",
    firstName: "Nombre",
    lastName: "Apellido(s)",
    email: "Correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    createAccount: "Crear cuenta",
    creatingAccount: "Creando cuenta…",
    back: "Atrás",
    passwordStrength: "Fortaleza de la contraseña",
    passwordStrengthHint:
      "La contraseña debe alcanzar al menos una fortaleza moderada (naranja) antes de continuar.",
    passwordsMatch: "Las contraseñas coinciden.",
    strengthWeak: "Débil",
    strengthModerate: "Moderada",
    strengthStrong: "Fuerte",
    dobMinAgeHint: "Debe tener al menos 18 años.",
    dobMonthLabel: "Mes",
    dobDayLabel: "Día",
    dobYearLabel: "Año",
    dobMonthPlaceholder: "Mes",
    dobDayPlaceholder: "Día",
    dobYearPlaceholder: "Año",
    dobMonthNames: MONTH_NAMES_ES,
    ageRequirementTitle: "Requisito de edad no cumplido",
    ageRequirementBody: "Debe tener al menos 18 años para registrarse en el panel.",
    invalidDobTitle: "Fecha de nacimiento no válida",
    invalidDobBody: "Seleccione un mes, día y año válidos.",
    citizenshipMetTitle: "Requisito de ciudadanía cumplido",
    citizenshipMetBody:
      "Puede continuar. Se requerirá comprobante de ciudadanía o residencia durante el registro.",
    citizenshipNotMetTitle: "Requisito de ciudadanía no cumplido",
    citizenshipNotMetBody:
      "No puede continuar el registro. Elija otro estado de ciudadanía o vuelva al inicio.",
  },
};

export function monthOptionsForLocale(locale: HomeLocale): { value: string; label: string }[] {
  return SIGNUP_COPY[locale].dobMonthNames.map((label, index) => ({
    value: String(index + 1),
    label,
  }));
}

export function citizenshipLabelFor(locale: HomeLocale, status: string): string {
  return SIGNUP_COPY[locale].citizenshipLabels[status] ?? status;
}
