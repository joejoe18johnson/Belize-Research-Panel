import type { HomeLocale } from "./home-locale";
import { REGISTRATION_PHASES } from "./registration-progress";

export type RegistrationCopy = {
  pageTitle: string;
  pageSubtitle: string;
  deleteAccount: string;
  logOut: string;
  loggingOut: string;
  dismiss: string;
  exclusiveTitle: string;
  exclusiveBody: string;
  phaseFixAlert: string;
  stepOf: (current: number, total: number) => string;
  progressAria: string;
  stepsAria: string;
  percentAria: (percent: number) => string;
  goToStep: (step: string) => string;
  currentStep: (step: string) => string;
  stepUnavailable: string;
  phases: { id: string; label: string; description: string }[];
  back: string;
  next: string;
  submit: string;
  submitting: string;
  returnHome: string;
  notProvided: string;
  notApplicable: string;
  optional: string;
  livingOutsideBelize: string;
  selectLocation: string;
  selectCountry: string;
  selectUsRegion: string;
  selectCtv: string;
  selectConstituency: string;
  selectEthnicity: string;
  selectSex: string;
  selectEducation: string;
  selectPhotoId: string;
  selectProof: string;
  selectOtherContact: string;
  selectCommonwealthCountry: string;
  selectVoterStatus: string;
  selectEducationShort: string;
  householdCountNote: string;
  finalReviewConfirm: string;
  reviewQuestion: string;
  reviewResponse: string;
  contactMeansOf: (count: number) => string;
  reviewLabels: {
    citizenship: string;
    commonwealthCountry: string;
    registeredVoter: string;
    firstName: string;
    lastName: string;
    dob: string;
    sex: string;
    education: string;
    ethnicity: string;
    householdHead: string;
    householdSize: string;
    currentResidence: string;
    livingAbroad: string;
    districtLive: string;
    cityTownVillage: string;
    countryAbroad: string;
    countryOther: string;
    usRegion: string;
    constituency: string;
    registeredCtv: string;
    marketInterests: string;
    accountEmail: string;
    phone: string;
    facebook: string;
    instagram: string;
    tiktok: string;
    otherPlatform: string;
    otherContact: string;
    streetAddress: string;
    cityOrVillage: string;
    addressDistrict: string;
    photoIdType: string;
    proofResidence: string;
    ownsBusinessOrNgo: string;
    orgName: string;
    orgStreetAddress: string;
    orgCityVillage: string;
    orgDistrict: string;
    orgDescription: string;
    orgSize: string;
    orgOwnershipStructure: string;
    orgYearStarted: string;
    orgContactMeans: string;
  };
  sections: {
    verifyHow: string;
    citizenship: string;
    dob: string;
    voter: string;
    proofResidence: string;
    name: string;
    demographics: string;
    residence: string;
    constituency: string;
    marketInterests: string;
    contact: string;
    confirmContact: string;
    consent: string;
    organisation: string;
    review: string;
  };
  photoIdIntro: string;
  photoIdAlert: string;
  photoIdType: string;
  photoIdUpload: string;
  commonwealthCountry: string;
  citizenshipIneligible: string;
  voterQuestion: string;
  proofAlert: string;
  proofType: string;
  proofUpload: string;
  nameAlert: string;
  firstName: string;
  lastName: string;
  sex: string;
  education: string;
  ethnicity: string;
  householdHead: string;
  householdSize: string;
  abroadIntro: string;
  districtLive: string;
  countryOfResidence: string;
  usRegion: string;
  usRegionHint: string;
  cityTownVillage: (district: string) => string;
  constituencyQuestion: string;
  registeredCtvQuestion: (constituency: string) => string;
  marketInterestsLabel: string;
  contactIntro: string;
  email: string;
  emailHint: string;
  facebook: string;
  facebookPlaceholder: string;
  phone: string;
  instagram: string;
  instagramPlaceholder: string;
  tiktok: string;
  tiktokPlaceholder: string;
  otherPlatform: string;
  otherPlatformCustom: string;
  otherPlatformPlaceholder: string;
  otherContact: string;
  otherContactPlaceholder: string;
  secondEmail: string;
  secondEmailPlaceholder: string;
  streetRequiredHint: string;
  streetOptionalHint: string;
  streetTitle: string;
  streetAddress: string;
  streetAddressPlaceholder: string;
  cityOrVillage: string;
  district: string;
  selectDistrict: string;
  ctvPlaceholder: string;
  contactSummary: string;
  contactMeans: string;
  contactIncomplete: string;
  contactSuccess: (count: number) => string;
  contactWarning: (count: number, belize: boolean) => string;
  contactVerifyNote: string;
  contactConfirm: string;
  physicalAddress: string;
  consentResearch: string;
  consentContact: string;
  consentPrivacy: string;
  specifyCountryOther: string;
  countryOtherLabel: string;
  ownsBusinessOrNgo: string;
  orgName: string;
  orgLocationIntro: string;
  orgDescription: string;
  orgDescriptionPlaceholder: string;
  orgSize: string;
  orgOwnershipStructure: string;
  orgOwnershipStructureOther: string;
  orgYearStarted: string;
  orgContactMeans: string;
  selectOrgSize: string;
  selectOrgOwnership: string;
  reviewTitle: string;
};

const phasesEn = REGISTRATION_PHASES.map((phase) => ({
  id: phase.id,
  label: phase.label,
  description: phase.description,
}));

const phasesEs = [
  { id: "verification", label: "Verificación", description: "Cómo se confirmará su identidad" },
  { id: "eligibility", label: "Elegibilidad", description: "Ciudadanía, edad y estado electoral" },
  { id: "profile", label: "Su perfil", description: "Nombre, datos personales y residencia" },
  { id: "interests", label: "Intereses", description: "Temas de investigación de su interés" },
  { id: "contact", label: "Contacto", description: "Cómo podemos comunicarnos con usted" },
  { id: "review", label: "Revisión", description: "Consentimiento y envío" },
] as const;

export const REGISTRATION_COPY: Record<HomeLocale, RegistrationCopy> = {
  en: {
    pageTitle: "Verify Your Account to Continue",
    pageSubtitle:
      "Complete verification to join the panel for Public Opinion Polling, Market Research, and Governance Studies.",
    deleteAccount: "Delete account",
    logOut: "Log out",
    loggingOut: "Logging out…",
    dismiss: "Dismiss",
    exclusiveTitle: "Exclusive Belize Research Panel",
    exclusiveBody:
      "Complete registration to join the panel. Your information is kept confidential and used only for legitimate research.",
    phaseFixAlert: "Please fix the highlighted fields in this section before continuing.",
    stepOf: (current, total) => `Step ${current} of ${total}`,
    progressAria: "Registration progress",
    stepsAria: "Registration steps",
    percentAria: (percent) => `Registration ${percent}% complete`,
    goToStep: (step) => `Go to ${step}`,
    currentStep: (step) => `${step} (current)`,
    stepUnavailable: "Complete the earlier steps first",
    phases: phasesEn,
    back: "Back",
    next: "Next",
    submit: "Submit registration",
    submitting: "Submitting...",
    returnHome: "Return home",
    notProvided: "Not provided",
    notApplicable: "Not applicable",
    optional: "Optional",
    livingOutsideBelize: "Living outside Belize",
    selectLocation: "Select location",
    selectCountry: "Select country",
    selectUsRegion: "Select US region",
    selectCtv: "Select city, town, or village",
    selectConstituency: "Select constituency",
    selectEthnicity: "Select ethnicity",
    selectSex: "Select sex",
    selectEducation: "Select education level",
    selectPhotoId: "Select photo ID type",
    selectProof: "Select proof type",
    selectOtherContact: "Select other contact type (optional)",
    selectCommonwealthCountry: "Select commonwealth country",
    selectVoterStatus: "Select voter status",
    selectEducationShort: "Select education",
    householdCountNote: "Count everyone regardless of age.",
    finalReviewConfirm:
      "I have reviewed the full form and confirm that the information is correct. *",
    reviewQuestion: "Question / field",
    reviewResponse: "Response",
    contactMeansOf: (count) => `${count} of 7 means of contact`,
    reviewLabels: {
      citizenship: "Citizenship / residency status",
      commonwealthCountry: "Commonwealth country of citizenship",
      registeredVoter: "Registered to vote in Belize",
      firstName: "First name",
      lastName: "Last name(s)",
      dob: "Date of birth",
      sex: "Sex",
      education: "Highest education",
      ethnicity: "Ethnicity",
      householdHead: "Head of household",
      householdSize: "Household size",
      currentResidence: "Current residence",
      livingAbroad: "Living abroad",
      districtLive: "District where you currently live",
      cityTownVillage: "City / town / village",
      countryAbroad: "Country if abroad",
      countryOther: "Country of residence (specified)",
      usRegion: "Region of country",
      constituency: "Constituency registered to vote",
      registeredCtv: "Registered CTV area",
      marketInterests: "Market research interests",
      accountEmail: "Account email",
      phone: "Phone / WhatsApp",
      facebook: "Facebook",
      instagram: "Instagram",
      tiktok: "TikTok",
      otherPlatform: "Other contact platform",
      otherContact: "Other contact detail",
      streetAddress: "Street address",
      cityOrVillage: "City or Village",
      addressDistrict: "Contact address district",
      photoIdType: "Photo ID type",
      proofResidence: "Proof of Belize residence",
      ownsBusinessOrNgo: "Majority owner of business / head of NGO",
      orgName: "Business / organisation name",
      orgStreetAddress: "Organisation street address",
      orgCityVillage: "Organisation city or village",
      orgDistrict: "Organisation district",
      orgDescription: "Organisation products / services",
      orgSize: "Organisation size",
      orgOwnershipStructure: "Ownership structure",
      orgYearStarted: "Year started",
      orgContactMeans: "Organisation means of contact",
    },
    sections: {
      verifyHow: "How we will verify you",
      citizenship: "Citizenship / residency",
      dob: "Date of birth",
      voter: "Voter registration",
      proofResidence: "Proof of Belize residence",
      name: "Name",
      demographics: "Demographic information",
      residence: "Residence details",
      constituency: "Constituency registration",
      marketInterests: "Market research interests",
      contact: "Preferred ways to contact you",
      confirmContact: "Confirm contact details",
      consent: "Consent",
      organisation: "Business / organisation",
      review: "Review full registration before submitting",
    },
    photoIdIntro: "Upload a government-issued photo ID to verify yourself, then continue the form.",
    photoIdAlert:
      "Upload a government-issued photo ID. We use it only to verify your identity and eligibility. We do not keep or store ID images in our files. ID numbers may be blurred or covered before upload, as long as your name, photograph, and eligibility details remain visible.",
    photoIdType: "Photo ID type",
    photoIdUpload: "Upload photo ID image or PDF",
    commonwealthCountry: "Commonwealth country of citizenship",
    citizenshipIneligible:
      "You are not eligible to register under this citizenship / residency status. Choose a qualifying option or return home.",
    voterQuestion: "Are you registered to vote in Belize?",
    proofAlert:
      "Commonwealth citizens must provide proof that they are currently resident in Belize. This protects the integrity of the panel.",
    proofType: "Proof of residence in Belize",
    proofUpload: "Upload proof of Belize residence",
    nameAlert:
      "Enter your first name and last name(s) exactly as they appear on your government-issued photo ID. If you have more than one last name, include all of them.",
    firstName: "First name",
    lastName: "Last name(s)",
    sex: "Sex",
    education: "Highest level of education",
    ethnicity: "Ethnicity",
    householdHead: "Are you the head of your household?",
    householdSize: "Including yourself, how many persons live in your household?",
    abroadIntro: "You selected Belizean residing abroad. Tell us the country where you currently live.",
    districtLive: "District where you currently live",
    countryOfResidence: "Country of residence",
    usRegion: "Region of country",
    usRegionHint: "Required for United States residents. US Census regions.",
    cityTownVillage: (district) => `City / town / village in ${district} where you currently live`,
    constituencyQuestion: "In which constituency are you registered to vote?",
    registeredCtvQuestion: (constituency) =>
      `Where in the ${constituency} constituency were you living at the time you registered to vote there?`,
    marketInterestsLabel:
      "Select up to 5 products and services you are interested in and are willing to give feedback on.",
    contactIntro:
      "We need at least two means of contact in case one fails. Your email counts as one. Phone / WhatsApp is optional. If you live in Belize and still have fewer than two means of contact, a street address is required as a last resort.",
    email: "Email address",
    emailHint: "This is your verified account email. It counts as one way to contact you.",
    facebook: "Facebook name or profile link",
    facebookPlaceholder: "username or https://facebook.com/username",
    phone: "Phone / WhatsApp number",
    instagram: "Instagram handle",
    instagramPlaceholder: "@username or profile link",
    tiktok: "TikTok handle",
    tiktokPlaceholder: "@username or profile link",
    otherPlatform: "Other contact platform / application",
    otherPlatformCustom: "Specify other contact platform / application",
    otherPlatformPlaceholder: "Telegram, Signal, LinkedIn...",
    otherContact: "Other contact detail",
    otherContactPlaceholder: "Username, handle, phone, link, or ID",
    secondEmail: "Second email address",
    secondEmailPlaceholder: "Enter second email address",
    streetRequiredHint:
      "Required because you live in Belize and have fewer than two means of contact. Home visits are a last resort.",
    streetOptionalHint:
      "Optional. You already have at least two means of contact. Add an address only if you want a backup.",
    streetTitle: "Physical contact address",
    streetAddress: "Street address",
    streetAddressPlaceholder: "House number and street name",
    cityOrVillage: "City or Village",
    district: "District",
    selectDistrict: "Select district",
    ctvPlaceholder: "Start typing a city, town, or village",
    contactSummary: "Contact summary",
    contactMeans: "means of contact",
    contactIncomplete: "incomplete",
    contactSuccess: (count) =>
      `You have submitted ${count} means of contact. Please double-check every detail below — wrong contact information can mean you miss survey and research opportunities.`,
    contactWarning: (count, belize) =>
      `Only ${count} ${count === 1 ? "means of contact has" : "means of contact have"} been submitted so far. We need at least two means of contact in case one fails${belize ? ", or a complete physical address if you live in Belize" : ""}. Go back and add another method before confirming. Also make sure every detail is correct — wrong contact information can mean you miss survey and research opportunities.`,
    contactVerifyNote:
      "Please verify that every means of contact above is accurate and up to date. If we cannot reach you, you may miss out on paid surveys, polls, and other research opportunities.",
    contactConfirm:
      "I confirm that the contact information shown above is correct, and I understand I may miss opportunities if it is wrong. *",
    physicalAddress: "Physical address",
    consentResearch: "I agree to be considered for surveys, polls, interviews, or research activities. *",
    consentContact: "I agree to be contacted using the contact details I provided. *",
    consentPrivacy:
      "I understand that my information should be kept confidential and used only for legitimate research-related purposes. *",
    specifyCountryOther: "Please specify your country of residence",
    countryOtherLabel: "Country of residence (please specify)",
    ownsBusinessOrNgo:
      "Are you the majority owner of a private business(es) or head of a non-governmental organisation in Belize?",
    orgName: "Name of the business / organisation",
    orgLocationIntro: "Where is the business / organisation located in Belize?",
    orgDescription: "Briefly describe the main products or services",
    orgDescriptionPlaceholder: "e.g. panades business at home, supermarket, corn tortilla mill",
    orgSize: "Size of the operation",
    orgOwnershipStructure: "Legal ownership structure",
    orgOwnershipStructureOther: "Please specify the ownership structure",
    orgYearStarted: "Year the operation started",
    orgContactMeans: "Means of contact for the organisation",
    selectOrgSize: "Select operation size",
    selectOrgOwnership: "Select ownership structure",
    reviewTitle: "Review full registration before submitting",
  },
  es: {
    pageTitle: "Verifique su cuenta para continuar",
    pageSubtitle:
      "Complete la verificación para unirse al panel de encuestas de opinión pública, investigación de mercado y estudios de gobernanza.",
    deleteAccount: "Eliminar cuenta",
    logOut: "Cerrar sesión",
    loggingOut: "Cerrando sesión…",
    dismiss: "Cerrar",
    exclusiveTitle: "Panel exclusivo de investigación de Belice",
    exclusiveBody:
      "Complete el registro para unirse al panel. Su información se mantiene confidencial y se usa solo para investigación legítima.",
    phaseFixAlert: "Corrija los campos resaltados en esta sección antes de continuar.",
    stepOf: (current, total) => `Paso ${current} de ${total}`,
    progressAria: "Progreso del registro",
    stepsAria: "Pasos del registro",
    percentAria: (percent) => `Registro ${percent}% completo`,
    goToStep: (step) => `Ir a ${step}`,
    currentStep: (step) => `${step} (actual)`,
    stepUnavailable: "Complete primero los pasos anteriores",
    phases: [...phasesEs],
    back: "Atrás",
    next: "Siguiente",
    submit: "Enviar registro",
    submitting: "Enviando...",
    returnHome: "Volver al inicio",
    notProvided: "No proporcionado",
    notApplicable: "No aplica",
    optional: "Opcional",
    livingOutsideBelize: "Vive fuera de Belice",
    selectLocation: "Seleccione ubicación",
    selectCountry: "Seleccione país",
    selectUsRegion: "Seleccione región de EE. UU.",
    selectCtv: "Seleccione ciudad, pueblo o aldea",
    selectConstituency: "Seleccione circunscripción",
    selectEthnicity: "Seleccione etnia",
    selectSex: "Seleccione sexo",
    selectEducation: "Seleccione nivel educativo",
    selectPhotoId: "Seleccione tipo de identificación",
    selectProof: "Seleccione tipo de comprobante",
    selectOtherContact: "Seleccione otro tipo de contacto (opcional)",
    selectCommonwealthCountry: "Seleccione país de la Commonwealth",
    selectVoterStatus: "Seleccione estado electoral",
    selectEducationShort: "Seleccione educación",
    householdCountNote: "Cuente a todas las personas, sin importar la edad.",
    finalReviewConfirm:
      "He revisado el formulario completo y confirmo que la información es correcta. *",
    reviewQuestion: "Pregunta / campo",
    reviewResponse: "Respuesta",
    contactMeansOf: (count) => `${count} de 7 medios de contacto`,
    reviewLabels: {
      citizenship: "Estado de ciudadanía / residencia",
      commonwealthCountry: "País de ciudadanía de la Commonwealth",
      registeredVoter: "Registrado para votar en Belice",
      firstName: "Nombre",
      lastName: "Apellido(s)",
      dob: "Fecha de nacimiento",
      sex: "Sexo",
      education: "Nivel educativo más alto",
      ethnicity: "Etnia",
      householdHead: "Jefe(a) del hogar",
      householdSize: "Tamaño del hogar",
      currentResidence: "Residencia actual",
      livingAbroad: "Vive en el extranjero",
      districtLive: "Distrito donde vive actualmente",
      cityTownVillage: "Ciudad / pueblo / aldea",
      countryAbroad: "País si vive en el extranjero",
      countryOther: "País de residencia (especificado)",
      usRegion: "Región del país",
      constituency: "Circunscripción donde está registrado",
      registeredCtv: "Área CTV registrada",
      marketInterests: "Intereses de investigación de mercado",
      accountEmail: "Correo de la cuenta",
      phone: "Teléfono / WhatsApp",
      facebook: "Facebook",
      instagram: "Instagram",
      tiktok: "TikTok",
      otherPlatform: "Otra plataforma de contacto",
      otherContact: "Otro dato de contacto",
      streetAddress: "Dirección",
      cityOrVillage: "Ciudad o aldea",
      addressDistrict: "Distrito de la dirección de contacto",
      photoIdType: "Tipo de identificación con foto",
      proofResidence: "Comprobante de residencia en Belice",
      ownsBusinessOrNgo: "Propietario mayoritario de negocio / jefe(a) de ONG",
      orgName: "Nombre del negocio / organización",
      orgStreetAddress: "Dirección de la organización",
      orgCityVillage: "Ciudad o aldea de la organización",
      orgDistrict: "Distrito de la organización",
      orgDescription: "Productos / servicios de la organización",
      orgSize: "Tamaño de la organización",
      orgOwnershipStructure: "Estructura de propiedad",
      orgYearStarted: "Año de inicio",
      orgContactMeans: "Medios de contacto de la organización",
    },
    sections: {
      verifyHow: "Cómo lo verificaremos",
      citizenship: "Ciudadanía / residencia",
      dob: "Fecha de nacimiento",
      voter: "Registro electoral",
      proofResidence: "Comprobante de residencia en Belice",
      name: "Nombre",
      demographics: "Información demográfica",
      residence: "Detalles de residencia",
      constituency: "Registro de circunscripción",
      marketInterests: "Intereses de investigación de mercado",
      contact: "Formas preferidas de contacto",
      confirmContact: "Confirmar datos de contacto",
      consent: "Consentimiento",
      organisation: "Negocio / organización",
      review: "Revise el registro completo antes de enviar",
    },
    photoIdIntro: "Suba una identificación con foto emitida por el gobierno para verificarse y luego continúe el formulario.",
    photoIdAlert:
      "Suba una identificación con foto emitida por el gobierno. Solo la usamos para verificar su identidad y elegibilidad. No guardamos ni almacenamos imágenes de identificación. Puede ocultar o difuminar números de identificación antes de subirla, siempre que su nombre, fotografía y datos de elegibilidad sigan visibles.",
    photoIdType: "Tipo de identificación con foto",
    photoIdUpload: "Subir imagen o PDF de identificación",
    commonwealthCountry: "País de ciudadanía de la Commonwealth",
    citizenshipIneligible:
      "No es elegible para registrarse con este estado de ciudadanía / residencia. Elija una opción válida o vuelva al inicio.",
    voterQuestion: "¿Está registrado para votar en Belice?",
    proofAlert:
      "Los ciudadanos de la Commonwealth deben presentar comprobante de que actualmente residen en Belice. Esto protege la integridad del panel.",
    proofType: "Comprobante de residencia en Belice",
    proofUpload: "Subir comprobante de residencia en Belice",
    nameAlert:
      "Escriba su nombre y apellido(s) exactamente como aparecen en su identificación con foto emitida por el gobierno. Si tiene más de un apellido, inclúyalos todos.",
    firstName: "Nombre",
    lastName: "Apellido(s)",
    sex: "Sexo",
    education: "Nivel educativo más alto",
    ethnicity: "Etnia",
    householdHead: "¿Es usted el jefe o la jefa de su hogar?",
    householdSize: "Incluyéndose a usted, ¿cuántas personas viven en su hogar?",
    abroadIntro: "Seleccionó beliceño residente en el extranjero. Indíquenos el país donde vive actualmente.",
    districtLive: "Distrito donde vive actualmente",
    countryOfResidence: "País de residencia",
    usRegion: "Región del país",
    usRegionHint: "Obligatorio para residentes de Estados Unidos. Regiones del censo de EE. UU.",
    cityTownVillage: (district) => `Ciudad / pueblo / aldea en ${district} donde vive actualmente`,
    constituencyQuestion: "¿En qué circunscripción está registrado para votar?",
    registeredCtvQuestion: (constituency) =>
      `¿Dónde en la circunscripción de ${constituency} vivía cuando se registró para votar allí?`,
    marketInterestsLabel:
      "Seleccione hasta 5 productos y servicios sobre los que le interesa dar su opinión.",
    contactIntro:
      "Necesitamos al menos dos medios de contacto por si uno falla. Su correo cuenta como uno. Teléfono / WhatsApp es opcional. Si vive en Belice y aún tiene menos de dos medios de contacto, se requiere una dirección como último recurso.",
    email: "Correo electrónico",
    emailHint: "Este es el correo verificado de su cuenta. Cuenta como una forma de contactarlo.",
    facebook: "Nombre o enlace de perfil de Facebook",
    facebookPlaceholder: "usuario o https://facebook.com/usuario",
    phone: "Número de teléfono / WhatsApp",
    instagram: "Usuario de Instagram",
    instagramPlaceholder: "@usuario o enlace del perfil",
    tiktok: "Usuario de TikTok",
    tiktokPlaceholder: "@usuario o enlace del perfil",
    otherPlatform: "Otra plataforma / aplicación de contacto",
    otherPlatformCustom: "Especifique otra plataforma / aplicación de contacto",
    otherPlatformPlaceholder: "Telegram, Signal, LinkedIn...",
    otherContact: "Otro dato de contacto",
    otherContactPlaceholder: "Usuario, identificador, teléfono, enlace o ID",
    secondEmail: "Segundo correo electrónico",
    secondEmailPlaceholder: "Ingrese el segundo correo electrónico",
    streetRequiredHint:
      "Obligatorio porque vive en Belice y tiene menos de dos medios de contacto. Las visitas a domicilio son un último recurso.",
    streetOptionalHint:
      "Opcional. Ya tiene al menos dos medios de contacto. Agregue una dirección solo si desea un respaldo.",
    streetTitle: "Dirección física de contacto",
    streetAddress: "Dirección",
    streetAddressPlaceholder: "Número de casa y nombre de la calle",
    cityOrVillage: "Ciudad o aldea",
    district: "Distrito",
    selectDistrict: "Seleccione distrito",
    ctvPlaceholder: "Empiece a escribir una ciudad, pueblo o aldea",
    contactSummary: "Resumen de contacto",
    contactMeans: "medios de contacto",
    contactIncomplete: "incompleto",
    contactSuccess: (count) =>
      `Ha enviado ${count} medios de contacto. Revise cada detalle a continuación: si la información es incorrecta, podría perder oportunidades de encuestas e investigación.`,
    contactWarning: (count, belize) =>
      `Solo se ha enviado ${count} ${count === 1 ? "medio de contacto" : "medios de contacto"} hasta ahora. Necesitamos al menos dos medios de contacto por si uno falla${belize ? ", o una dirección física completa si vive en Belice" : ""}. Regrese y agregue otro método antes de confirmar. Asegúrese también de que cada detalle sea correcto: si la información es incorrecta, podría perder oportunidades de encuestas e investigación.`,
    contactVerifyNote:
      "Verifique que cada medio de contacto anterior sea exacto y esté actualizado. Si no podemos contactarlo, podría perder encuestas pagadas, sondeos y otras oportunidades de investigación.",
    contactConfirm:
      "Confirmo que la información de contacto mostrada arriba es correcta, y entiendo que podría perder oportunidades si es incorrecta. *",
    physicalAddress: "Dirección física",
    consentResearch:
      "Acepto ser considerado(a) para encuestas, sondeos, entrevistas o actividades de investigación. *",
    consentContact: "Acepto que me contacten con los datos de contacto que proporcioné. *",
    consentPrivacy:
      "Entiendo que mi información debe mantenerse confidencial y usarse solo para fines legítimos relacionados con la investigación. *",
    specifyCountryOther: "Indique su país de residencia",
    countryOtherLabel: "País de residencia (especifique)",
    ownsBusinessOrNgo:
      "¿Es usted el propietario mayoritario de un negocio privado o el/la jefe(a) de una organización no gubernamental en Belice?",
    orgName: "Nombre del negocio / organización",
    orgLocationIntro: "¿Dónde está ubicado el negocio / organización en Belice?",
    orgDescription: "Describa brevemente los principales productos o servicios",
    orgDescriptionPlaceholder: "p. ej. negocio de panades en casa, supermercado, molino de tortillas de maíz",
    orgSize: "Tamaño de la operación",
    orgOwnershipStructure: "Estructura legal de propiedad",
    orgOwnershipStructureOther: "Especifique la estructura de propiedad",
    orgYearStarted: "Año en que inició la operación",
    orgContactMeans: "Medios de contacto de la organización",
    selectOrgSize: "Seleccione el tamaño de la operación",
    selectOrgOwnership: "Seleccione la estructura de propiedad",
    reviewTitle: "Revise el registro completo antes de enviar",
  },
};

export function getRegistrationPhases(locale: HomeLocale) {
  return REGISTRATION_COPY[locale].phases;
}
