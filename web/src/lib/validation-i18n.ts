import type { HomeLocale } from "@/lib/home-locale";
import type { FieldErrors } from "@/lib/validation";

/** Exact English → Spanish for registration / profile validation messages. */
const VALIDATION_ES_EXACT: Record<string, string> = {
  "Please select your month, day, and year of birth.":
    "Seleccione su mes, día y año de nacimiento.",
  "Please select a valid date of birth.": "Seleccione una fecha de nacimiento válida.",
  "You are not eligible to register. Participants must be 18 years or older.":
    "No es elegible para registrarse. Los participantes deben tener 18 años o más.",
  "Please select your citizenship / residency status.":
    "Seleccione su estado de ciudadanía / residencia.",
  "You are not eligible to register under this citizenship / residency status.":
    "No es elegible para registrarse con este estado de ciudadanía / residencia.",
  "Please indicate your voter registration status.":
    "Indique su estado de registro como votante.",
  "Please provide proof of residence in Belize for Commonwealth citizens.":
    "Proporcione comprobante de residencia en Belice para ciudadanos de la Commonwealth.",
  "Please upload proof of Belize residence for Commonwealth citizens.":
    "Suba el comprobante de residencia en Belice para ciudadanos de la Commonwealth.",
  "You must currently live in Belize to be eligible under this citizenship / residency category.":
    "Debe vivir actualmente en Belice para ser elegible bajo esta categoría de ciudadanía / residencia.",
  "This category is for Belizeans living abroad. Please select living abroad.":
    "Esta categoría es para beliceños que viven en el extranjero. Seleccione vivir en el extranjero.",
  "First name is required.": "El nombre es obligatorio.",
  "Last name is required.": "El apellido es obligatorio.",
  "Sex is required.": "El sexo es obligatorio.",
  "Education level is required.": "El nivel educativo es obligatorio.",
  "Please select a valid education level.": "Seleccione un nivel educativo válido.",
  "Ethnicity is required.": "La etnia es obligatoria.",
  "Please indicate whether you are the head of your household.":
    "Indique si es el jefe o la jefa de su hogar.",
  "Please select yes or no.": "Seleccione sí o no.",
  "Enter how many persons live in your household, including yourself.":
    "Indique cuántas personas viven en su hogar, incluyéndose a usted.",
  "Household size must include at least yourself.":
    "El tamaño del hogar debe incluir al menos a usted.",
  "Residence selection is required.": "La selección de residencia es obligatoria.",
  "Country of residence is required.": "El país de residencia es obligatorio.",
  "Please specify your country of residence.": "Especifique su país de residencia.",
  "Please select your country of residence from the list.":
    "Seleccione su país de residencia de la lista.",
  "US region is required.": "La región de EE. UU. es obligatoria.",
  "Please select Northeast, Midwest, South, or West.":
    "Seleccione Noreste, Medio Oeste, Sur u Oeste.",
  "City / town / village is required.": "La ciudad / pueblo / aldea es obligatoria.",
  "Please specify city / town / village.": "Especifique la ciudad / pueblo / aldea.",
  "Constituency is required for registered voters.":
    "La circunscripción es obligatoria para votantes registrados.",
  "Village / town / city area of voter registration is required for registered voters.":
    "El área de ciudad / pueblo / aldea del registro electoral es obligatoria para votantes registrados.",
  "Please provide at least two ways to contact you. Add another method, or a street address if you live in Belize.":
    "Proporcione al menos dos formas de contacto. Agregue otro método, o una dirección si vive en Belice.",
  "Please provide at least two ways to contact you in case one fails.":
    "Proporcione al menos dos formas de contacto por si una falla.",
  "Please enter a valid email address.": "Ingrese una dirección de correo válida.",
  "Contact email must match your account email.":
    "El correo de contacto debe coincidir con el de su cuenta.",
  "Second email address is selected, but the value entered is not a valid email address.":
    "Se seleccionó un segundo correo, pero el valor ingresado no es una dirección válida.",
  "Please enter a valid login email address.":
    "Ingrese una dirección de correo de inicio de sesión válida.",
  "Add a valid registration email in the Contact section to use it as your username.":
    "Agregue un correo de registro válido en la sección de Contacto para usarlo como nombre de usuario.",
  "Your registration email cannot be used as a username. The part before @ must be 4–20 letters, numbers, underscores, hyphens, or periods.":
    "Su correo de registro no puede usarse como nombre de usuario. La parte antes de @ debe tener de 4 a 20 letras, números, guiones bajos, guiones o puntos.",
  "Please confirm that your contact information is correct. Wrong details can mean missed research opportunities.":
    "Confirme que su información de contacto es correcta. Datos incorrectos pueden hacerle perder oportunidades de investigación.",
  "Photo ID type is required.": "El tipo de identificación con foto es obligatorio.",
  "Photo ID upload is required.": "Debe subir su identificación con foto.",
  "Valid username is required. Use 4–20 letters, numbers, underscores, hyphens, or periods.":
    "Se requiere un nombre de usuario válido. Use de 4 a 20 letras, números, guiones bajos, guiones o puntos.",
  "Username already exists.": "Ese nombre de usuario ya existe.",
  "Password is required.": "La contraseña es obligatoria.",
  "Password and confirm password do not match.":
    "La contraseña y la confirmación no coinciden.",
  "Research participation consent is required.":
    "Se requiere el consentimiento de participación en investigación.",
  "Contact consent is required.": "Se requiere el consentimiento de contacto.",
  "Privacy acknowledgement is required.": "Se requiere el reconocimiento de privacidad.",
  "Please review and confirm the full registration form before submitting.":
    "Revise y confirme el formulario de registro completo antes de enviar.",
  "A panelist with this email, phone, or name and date of birth is already in the system. If you need to register again, delete that panelist in Admin → Panelists first.":
    "Ya existe un panelista con este correo, teléfono, o nombre y fecha de nacimiento. Si necesita registrarse de nuevo, elimine ese panelista en Admin → Panelistas primero.",
  "District is required.": "El distrito es obligatorio.",
  "Please select a Belize district.": "Seleccione un distrito de Belice.",
  "City, town, or village is required.": "La ciudad, pueblo o aldea es obligatoria.",
  "Please select a city, town, or village in the chosen district.":
    "Seleccione una ciudad, pueblo o aldea en el distrito elegido.",
  "Please specify the city, town, or village.": "Especifique la ciudad, pueblo o aldea.",
  "Street name or a brief location description is required.":
    "Se requiere el nombre de la calle o una breve descripción de la ubicación.",
  "Please select a valid country code.": "Seleccione un código de país válido.",
  "Belize mobile / WhatsApp numbers must start with 6 (7 digits total, e.g. 6123456).":
    "Los números móviles / WhatsApp de Belice deben empezar con 6 (7 dígitos en total, p. ej. 6123456).",
  "Enter a password to see strength.": "Ingrese una contraseña para ver su fortaleza.",
  "Password must be at least 8 characters long.":
    "La contraseña debe tener al menos 8 caracteres.",
  "Password is too common. Please choose a less predictable password.":
    "La contraseña es demasiado común. Elija una menos predecible.",
  "Password should not contain your username.":
    "La contraseña no debe contener su nombre de usuario.",
  "Password should not contain your first name.":
    "La contraseña no debe contener su nombre.",
  "Password should not contain your last name.":
    "La contraseña no debe contener su apellido.",
  "Strong password — good to use.": "Contraseña segura: adecuada para usar.",
  "Moderate strength. A longer passphrase or symbol would make it stronger.":
    "Fortaleza moderada. Una frase más larga o un símbolo la haría más segura.",
  "Too weak. Use a mix of upper and lower case letters, numbers, and symbols.":
    "Demasiado débil. Use mayúsculas, minúsculas, números y símbolos.",
  "Registration failed. Please try again.": "El registro falló. Inténtelo de nuevo.",
  "Network error. Please check your connection and try again.":
    "Error de red. Revise su conexión e inténtelo de nuevo.",
  "Please fix the highlighted fields before continuing.":
    "Corrija los campos resaltados antes de continuar.",
};

const PHONE_EXACT_RE =
  /^(.+) phone numbers must be exactly (\d+) digits \(without the country code\)\.$/;
const PHONE_MIN_RE =
  /^(.+) phone numbers need at least (\d+) digits \(without the country code\)\.$/;
const PHONE_MAX_RE =
  /^(.+) phone numbers can have at most (\d+) digits \(without the country code\)\.$/;
const PHONE_PREFIX_RE = /^(.+) phone numbers must start with (.+)\.$/;
const HOUSEHOLD_MAX_RE =
  /^Please enter a household size of (\d+) or fewer, or contact us if this is a larger household\.$/;
const MARKET_MAX_RE = /^Please select up to (\d+) market research interests\.$/;

/** Translate a validation / form error string for the active locale. */
export function localizeValidationMessage(message: string, locale: HomeLocale): string {
  const text = String(message ?? "").trim();
  if (!text || locale === "en") return text;

  const exact = VALIDATION_ES_EXACT[text];
  if (exact) return exact;

  let match = text.match(PHONE_EXACT_RE);
  if (match) {
    return `Los números de teléfono de ${match[1]} deben tener exactamente ${match[2]} dígitos (sin el código de país).`;
  }
  match = text.match(PHONE_MIN_RE);
  if (match) {
    return `Los números de teléfono de ${match[1]} necesitan al menos ${match[2]} dígitos (sin el código de país).`;
  }
  match = text.match(PHONE_MAX_RE);
  if (match) {
    return `Los números de teléfono de ${match[1]} pueden tener como máximo ${match[2]} dígitos (sin el código de país).`;
  }
  match = text.match(PHONE_PREFIX_RE);
  if (match) {
    return `Los números de teléfono de ${match[1]} deben empezar con ${match[2]}.`;
  }
  match = text.match(HOUSEHOLD_MAX_RE);
  if (match) {
    return `Ingrese un tamaño de hogar de ${match[1]} o menos, o contáctenos si el hogar es más grande.`;
  }
  match = text.match(MARKET_MAX_RE);
  if (match) {
    return `Seleccione hasta ${match[1]} intereses de investigación de mercado.`;
  }

  return text;
}

export function localizeFieldErrors(errors: FieldErrors, locale: HomeLocale): FieldErrors {
  if (locale === "en") return errors;
  const localized: FieldErrors = {};
  for (const [key, value] of Object.entries(errors)) {
    if (value) localized[key] = localizeValidationMessage(value, locale);
  }
  return localized;
}
