import type { HomeLocale } from "@/lib/home-locale";
import type { FieldErrors } from "@/lib/validation";

/** Exact English → Spanish for registration / profile validation messages. */
const VALIDATION_ES_EXACT: Record<string, string> = {
  "Please select your month, day, and year of birth.":
    "Seleccione su mes, día y año de nacimiento.",
  "Please select a valid date of birth.": "Seleccione una fecha de nacimiento válida.",
  "You are not eligible to register. Participants must be 18 years or older.":
    "No es elegible para registrarse. Los participantes deben tener 18 años o más.",
  "Age requirement not met": "Requisito de edad no cumplido",
  "You must be at least 18 years old to register for the panel.":
    "Debe tener al menos 18 años para registrarse en el panel.",
  "You must be at least 18 years old.": "Debe tener al menos 18 años.",
  "Invalid date of birth": "Fecha de nacimiento no válida",
  "Please select a valid month, day, and year.": "Seleccione un mes, día y año válidos.",
  "Please select your citizenship / residency status.":
    "Seleccione su estado de ciudadanía / residencia.",
  "You are not eligible to register under this citizenship / residency status.":
    "No es elegible para registrarse con este estado de ciudadanía / residencia.",
  "You are not eligible to join the Belize Research Panel.":
    "No es elegible para unirse al Belize Research Panel.",
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
  "Please ensure that you have entered the correct household size.":
    "Asegúrese de haber ingresado el tamaño de hogar correcto.",
  "Please tick this box if the household size you entered is correct.":
    "Marque esta casilla si el tamaño de hogar que ingresó es correcto.",
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
  "Last name(s) is required.": "El apellido / los apellidos son obligatorios.",
  "Email address is required.": "El correo electrónico es obligatorio.",
  "Please confirm your password.": "Confirme su contraseña.",
  "Passwords do not match.": "Las contraseñas no coinciden.",
  "Could not create account.": "No se pudo crear la cuenta.",
  "Network error. Please try again.": "Error de red. Inténtelo de nuevo.",
  "An account with this email already exists. Try logging in instead.":
    "Ya existe una cuenta con este correo. Intente iniciar sesión.",
  "Another account already uses this email with that password. Choose a different password so you can sign in to this new account.":
    "Otra cuenta ya usa este correo con esa contraseña. Elija una contraseña diferente para iniciar sesión en esta cuenta nueva.",
  "Account storage is not configured on this server. The site administrator must add Supabase environment variables in the hosting dashboard.":
    "El almacenamiento de cuentas no está configurado en este servidor. El administrador del sitio debe agregar las variables de entorno de Supabase en el panel de alojamiento.",
  "Account storage is not configured. Add Supabase environment variables in the hosting dashboard.":
    "El almacenamiento de cuentas no está configurado. Agregue las variables de entorno de Supabase en el panel de alojamiento.",
  "Disposable or temporary email addresses cannot be used to join the panel.":
    "No se pueden usar correos desechables o temporales para unirse al panel.",
  "This email address looks automated or suspicious. Use a personal email you check regularly.":
    "Esta dirección de correo parece automatizada o sospechosa. Use un correo personal que revise con regularidad.",
  "Verification email could not be sent.": "No se pudo enviar el correo de verificación.",
  "Sign in to resend the verification email.":
    "Inicie sesión para reenviar el correo de verificación.",
  "Your email is already verified.": "Su correo ya está verificado.",
  "Please wait a minute before requesting another verification email.":
    "Espere un minuto antes de solicitar otro correo de verificación.",
  "Could not resend verification email.": "No se pudo reenviar el correo de verificación.",
  "Could not resend the email.": "No se pudo reenviar el correo.",
  "We sent a new verification link. Check your inbox and spam folder.":
    "Enviamos un nuevo enlace de verificación. Revise su bandeja de entrada y el correo no deseado.",
  "We could not send the email. Use the verification link on this page.":
    "No pudimos enviar el correo. Use el enlace de verificación en esta página.",
  "Check your inbox for a new link.": "Revise su bandeja de entrada para un nuevo enlace.",
  "Invalid email or password.": "Correo o contraseña no válidos.",
  "Login failed.": "Error al iniciar sesión.",
  "Facebook login is not configured on this site yet.":
    "El inicio de sesión con Facebook aún no está configurado en este sitio.",
  "Missing Facebook session.": "Falta la sesión de Facebook.",
  "Could not verify Facebook sign-in.": "No se pudo verificar el inicio de sesión con Facebook.",
  "Facebook user id was not returned.": "No se devolvió el identificador de usuario de Facebook.",
  "Facebook session was not created. Try again.":
    "No se creó la sesión de Facebook. Inténtelo de nuevo.",
  "Could not complete Facebook sign-in.": "No se pudo completar el inicio de sesión con Facebook.",
  "Facebook sign-in failed.": "Falló el inicio de sesión con Facebook.",
  "Could not start Facebook sign-in.": "No se pudo iniciar el acceso con Facebook.",
  "Facebook login will be available after Meta app verification and enabling Facebook in Supabase Auth.":
    "El inicio de sesión con Facebook estará disponible después de la verificación de la app de Meta y de habilitar Facebook en Supabase Auth.",
  "You must be logged in to register.": "Debe iniciar sesión para registrarse.",
  "Verify your email before completing registration.":
    "Verifique su correo antes de completar el registro.",
  "You have already completed panelist registration.":
    "Ya completó el registro como panelista.",
  "Account not found.": "Cuenta no encontrada.",
  "We could not upload your identification documents. Try smaller JPG or PDF files, or try again in a moment.":
    "No pudimos subir sus documentos de identificación. Pruebe con archivos JPG o PDF más pequeños, o inténtelo de nuevo en un momento.",
  "Registration storage is not configured on this server. Please contact support or try again later.":
    "El almacenamiento de registro no está configurado en este servidor. Contacte a soporte o inténtelo más tarde.",
  "Registration could not be completed. Please try again or contact support if the problem continues.":
    "No se pudo completar el registro. Inténtelo de nuevo o contacte a soporte si el problema continúa.",
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
  "United States phone numbers must start with 2–9 (10 digits total, e.g. 2025550123).":
    "Los números de teléfono de Estados Unidos deben empezar con 2–9 (10 dígitos en total, p. ej. 2025550123).",
  "Canada phone numbers must start with 2–9 (10 digits total, e.g. 2025550123).":
    "Los números de teléfono de Canadá deben empezar con 2–9 (10 dígitos en total, p. ej. 2025550123).",
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
  "Argentina numbers use 10 digits.": "Los números de Argentina usan 10 dígitos.",
  "Australia numbers use 9 digits (without the leading 0).":
    "Los números de Australia usan 9 dígitos (sin el 0 inicial).",
  "Bahamas numbers use 7 digits after +1 242 and start with 2–9.":
    "Los números de Bahamas usan 7 dígitos después de +1 242 y empiezan con 2–9.",
  "Barbados numbers use 7 digits after +1 246 and start with 2–9.":
    "Los números de Barbados usan 7 dígitos después de +1 246 y empiezan con 2–9.",
  "Belize mobile / WhatsApp numbers use exactly 7 digits and start with 6.":
    "Los números móviles / WhatsApp de Belice usan exactamente 7 dígitos y empiezan con 6.",
  "Brazil numbers use 10–11 digits (including area code).":
    "Los números de Brasil usan 10–11 dígitos (incluido el código de área).",
  "Chile numbers use 9 digits.": "Los números de Chile usan 9 dígitos.",
  "China mobile numbers use 11 digits.": "Los números móviles de China usan 11 dígitos.",
  "Colombia numbers use 10 digits.": "Los números de Colombia usan 10 dígitos.",
  "Costa Rica numbers use 8 digits.": "Los números de Costa Rica usan 8 dígitos.",
  "Cuba numbers use 8 digits.": "Los números de Cuba usan 8 dígitos.",
  "Ecuador numbers use 9 digits.": "Los números de Ecuador usan 9 dígitos.",
  "El Salvador numbers use 8 digits.": "Los números de El Salvador usan 8 dígitos.",
  "UAE numbers use 9 digits (without the leading 0).":
    "Los números de EAU usan 9 dígitos (sin el 0 inicial).",
  "France numbers use 9 digits (without the leading 0).":
    "Los números de Francia usan 9 dígitos (sin el 0 inicial).",
  "Germany numbers usually use 10–11 digits (without the leading 0).":
    "Los números de Alemania suelen usar 10–11 dígitos (sin el 0 inicial).",
  "Guatemala numbers use 8 digits.": "Los números de Guatemala usan 8 dígitos.",
  "Hong Kong numbers use 8 digits.": "Los números de Hong Kong usan 8 dígitos.",
  "Honduras numbers use 8 digits.": "Los números de Honduras usan 8 dígitos.",
  "India mobile numbers use 10 digits.": "Los números móviles de India usan 10 dígitos.",
  "Ireland numbers use 9 digits (without the leading 0).":
    "Los números de Irlanda usan 9 dígitos (sin el 0 inicial).",
  "Italy mobile numbers usually use 9–10 digits.":
    "Los números móviles de Italia suelen usar 9–10 dígitos.",
  "Jamaica numbers use 7 digits after +1 876 and start with 2–9.":
    "Los números de Jamaica usan 7 dígitos después de +1 876 y empiezan con 2–9.",
  "Japan mobile numbers use 10 digits (without the leading 0).":
    "Los números móviles de Japón usan 10 dígitos (sin el 0 inicial).",
  "Mexico numbers use 10 digits.": "Los números de México usan 10 dígitos.",
  "Netherlands numbers use 9 digits (without the leading 0).":
    "Los números de Países Bajos usan 9 dígitos (sin el 0 inicial).",
  "New Zealand numbers usually use 8–10 digits (without the leading 0).":
    "Los números de Nueva Zelanda suelen usar 8–10 dígitos (sin el 0 inicial).",
  "Nigeria numbers use 10 digits (without the leading 0).":
    "Los números de Nigeria usan 10 dígitos (sin el 0 inicial).",
  "Nicaragua numbers use 8 digits.": "Los números de Nicaragua usan 8 dígitos.",
  "Panama numbers use 8 digits.": "Los números de Panamá usan 8 dígitos.",
  "Philippines mobile numbers use 10 digits.":
    "Los números móviles de Filipinas usan 10 dígitos.",
  "Peru numbers use 9 digits.": "Los números de Perú usan 9 dígitos.",
  "Saudi Arabia numbers use 9 digits (without the leading 0).":
    "Los números de Arabia Saudita usan 9 dígitos (sin el 0 inicial).",
  "Singapore numbers use 8 digits.": "Los números de Singapur usan 8 dígitos.",
  "South Africa numbers use 9 digits (without the leading 0).":
    "Los números de Sudáfrica usan 9 dígitos (sin el 0 inicial).",
  "South Korea numbers usually use 9–10 digits (without the leading 0).":
    "Los números de Corea del Sur suelen usar 9–10 dígitos (sin el 0 inicial).",
  "Spain numbers use 9 digits.": "Los números de España usan 9 dígitos.",
  "Sweden numbers use 9 digits (without the leading 0).":
    "Los números de Suecia usan 9 dígitos (sin el 0 inicial).",
  "Switzerland numbers use 9 digits (without the leading 0).":
    "Los números de Suiza usan 9 dígitos (sin el 0 inicial).",
  "Taiwan mobile numbers use 9 digits.": "Los números móviles de Taiwán usan 9 dígitos.",
  "Trinidad and Tobago numbers use 7 digits after +1 868 and start with 2–9.":
    "Los números de Trinidad y Tobago usan 7 dígitos después de +1 868 y empiezan con 2–9.",
  "US and Canada numbers use 10 digits and start with 2–9 (area code + number).":
    "Los números de EE. UU. y Canadá usan 10 dígitos y empiezan con 2–9 (código de área + número).",
  "UK numbers use 10 digits (without the leading 0).":
    "Los números del Reino Unido usan 10 dígitos (sin el 0 inicial).",
  "Venezuela numbers use 10 digits.": "Los números de Venezuela usan 10 dígitos.",
  "Enter the phone number without the country code.":
    "Ingrese el número de teléfono sin el código de país.",
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
const DRAFT_RESTORE_RE = /^Your saved answers were restored\. Please re-upload: (.+)\.$/;
const REGISTRATION_DETAIL_RE = /^Registration could not be completed: (.+)$/;

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
  match = text.match(DRAFT_RESTORE_RE);
  if (match) {
    return `Se restauraron sus respuestas guardadas. Vuelva a subir: ${match[1]}.`;
  }
  match = text.match(REGISTRATION_DETAIL_RE);
  if (match) {
    return `No se pudo completar el registro: ${match[1]}`;
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
