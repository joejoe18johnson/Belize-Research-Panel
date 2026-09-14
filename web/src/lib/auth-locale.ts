import type { HomeLocale } from "./home-locale";

export type AuthCopy = {
  signedInTitle: string;
  signedInVerifyEmail: string;
  signedInAlreadyRegistered: string;
  signedInContinueRegistration: string;
  checkVerification: string;
  continue: string;
  continueToRegistration: string;
  logOut: string;
  loggingOut: string;

  checkEmailTitle: string;
  checkEmailSubtitle: string;
  checkEmailSentPrefix: string;
  checkEmailTriedPrefix: string;
  checkEmailTo: string;
  checkEmailYourAddress: string;
  checkEmailOpenLink: string;
  checkEmailAfterVerify: string;
  checkInboxTitle: string;
  checkInboxBody: string;
  emailNotDeliveredTitle: string;
  emailNotDeliveredFallback: string;
  emailNotDeliveredHint: string;
  verifyOnSiteTitle: string;
  verifyOnSiteBody: string;
  confirmEmailAddress: string;
  sending: string;
  resendVerification: string;
  backToLogin: string;
  backToHome: string;
  couldNotResend: string;
  checkInboxNewLink: string;

  verifySuccessTitle: string;
  verifySuccessSubtitle: string;
  verifyAdminTitle: string;
  verifyAdminSubtitle: string;
  viewAccountStatus: string;
  verifyMissingTitle: string;
  verifyMissingSubtitle: string;
  verifyExpiredTitle: string;
  verifyExpiredSubtitle: string;
  verifyFailedTitle: string;
  verifyFailedSubtitle: string;
  verifyDefaultTitle: string;
  verifyDefaultSubtitle: string;
  createAccount: string;
  createNewAccount: string;
  goToVerificationHelp: string;
  logIn: string;

  facebookPageTitle: string;
  facebookPageSubtitle: string;
  facebookCouldNotSignIn: string;
  facebookSetupHelp: string;
  facebookPleaseWait: string;
  facebookFinishing: string;
  facebookSignup: string;
  facebookContinue: string;
  facebookConnecting: string;
  facebookNotEnabled: string;
  facebookReadyHint: string;
  facebookCouldNotStart: string;
  orContinueWithEmail: string;

  loginPageTitle: string;
  loginPageSubtitle: string;
  loginEmail: string;
  loginPassword: string;
  loginSubmit: string;
  loggingIn: string;
  forgotPassword: string;
  noAccount: string;
  signUp: string;
  emailVerifiedBannerTitle: string;
  emailVerifiedBannerBody: string;

  showPassword: string;
  hidePassword: string;

  phoneCountryCode: string;
  phoneNumber: string;

  socialViewProfile: string;
  socialConfirmProfile: string;

  draftRestoredPrefix: string;
};

export const AUTH_COPY: Record<HomeLocale, AuthCopy> = {
  en: {
    signedInTitle: "You are already signed in",
    signedInVerifyEmail: "Verify your email before completing panelist registration.",
    signedInAlreadyRegistered: "You have already completed panelist registration.",
    signedInContinueRegistration: "You can continue to panelist registration.",
    checkVerification: "Check verification",
    continue: "Continue",
    continueToRegistration: "Continue to registration",
    logOut: "Log out",
    loggingOut: "Logging out…",

    checkEmailTitle: "Verify your email",
    checkEmailSubtitle: "Panelist registration is available once your email address is verified.",
    checkEmailSentPrefix: "We sent",
    checkEmailTriedPrefix: "We tried to send",
    checkEmailTo: "a verification link to",
    checkEmailYourAddress: "your email address",
    checkEmailOpenLink: "Open that link to continue. The link expires after 24 hours.",
    checkEmailAfterVerify: "After verification, you can complete your panelist registration profile.",
    checkInboxTitle: "Check your inbox",
    checkInboxBody:
      "Look in spam if you do not see it within a minute. Without a custom sending domain, Resend can only deliver to the email on your Resend account.",
    emailNotDeliveredTitle: "Email was not delivered",
    emailNotDeliveredFallback: "The verification email could not be sent.",
    emailNotDeliveredHint:
      "Use the on-site link below, or resend after signing up with your Resend account email.",
    verifyOnSiteTitle: "Verify on this site",
    verifyOnSiteBody:
      "This is the same confirmation as clicking the button in the email. It verifies your address on Belize Research Panel.",
    confirmEmailAddress: "Confirm email address",
    sending: "Sending…",
    resendVerification: "Resend verification email",
    backToLogin: "Back to login",
    backToHome: "Back to home",
    couldNotResend: "Could not resend the email.",
    checkInboxNewLink: "Check your inbox for a new link.",

    verifySuccessTitle: "Congratulations, your email has been verified",
    verifySuccessSubtitle: "Please log in to continue with account registration.",
    verifyAdminTitle: "Administrator approval required",
    verifyAdminSubtitle:
      "Email address changes are reviewed by our team. If you recently requested a new email, your account stays on hold until an administrator approves the change.",
    viewAccountStatus: "View account status",
    verifyMissingTitle: "Invalid verification link",
    verifyMissingSubtitle: "This verification link is missing or incomplete.",
    verifyExpiredTitle: "Verification link expired",
    verifyExpiredSubtitle: "This link may have already been used or is no longer valid.",
    verifyFailedTitle: "Verification failed",
    verifyFailedSubtitle:
      "We could not verify your email right now. Try again or log in if you already verified.",
    verifyDefaultTitle: "Check your email",
    verifyDefaultSubtitle:
      "Open the verification link we sent to your inbox to continue panelist registration.",
    createAccount: "Create account",
    createNewAccount: "Create a new account",
    goToVerificationHelp: "Go to verification help",
    logIn: "Log in",

    facebookPageTitle: "Facebook sign-in",
    facebookPageSubtitle: "Connecting your Facebook account to the Belize Research Panel.",
    facebookCouldNotSignIn: "Could not sign in with Facebook",
    facebookSetupHelp:
      "If Meta / Facebook Login is still pending verification, finish setup in the Meta Developer Console and enable the Facebook provider in Supabase Auth, then try again.",
    facebookPleaseWait: "Please wait",
    facebookFinishing: "Finishing Facebook sign-in…",
    facebookSignup: "Sign up with Facebook",
    facebookContinue: "Continue with Facebook",
    facebookConnecting: "Connecting Facebook…",
    facebookNotEnabled:
      "Facebook login will be available after Meta app verification and enabling Facebook in Supabase Auth.",
    facebookReadyHint:
      "Facebook sign-in is ready in the app. Enable the Facebook provider in Supabase after your Meta app is verified.",
    facebookCouldNotStart: "Could not start Facebook sign-in.",
    orContinueWithEmail: "or continue with email",

    loginPageTitle: "Panelist login",
    loginPageSubtitle:
      "Sign in with Facebook or with the email and password you used when creating your account.",
    loginEmail: "Email address",
    loginPassword: "Password",
    loginSubmit: "Log in",
    loggingIn: "Signing in…",
    forgotPassword: "Forgot password?",
    noAccount: "Need an account?",
    signUp: "Create account",
    emailVerifiedBannerTitle: "Congratulations, your email has been verified",
    emailVerifiedBannerBody: "Please log in to continue with account registration.",

    showPassword: "Show password",
    hidePassword: "Hide password",

    phoneCountryCode: "Country code",
    phoneNumber: "Phone number",

    socialViewProfile: "View profile",
    socialConfirmProfile: "Open the profile and confirm this is your {platform} account before continuing.",

    draftRestoredPrefix: "Your saved answers were restored. Please re-upload:",
  },
  es: {
    signedInTitle: "Ya tiene la sesión iniciada",
    signedInVerifyEmail: "Verifique su correo antes de completar el registro como panelista.",
    signedInAlreadyRegistered: "Ya completó el registro como panelista.",
    signedInContinueRegistration: "Puede continuar con el registro como panelista.",
    checkVerification: "Revisar verificación",
    continue: "Continuar",
    continueToRegistration: "Continuar al registro",
    logOut: "Cerrar sesión",
    loggingOut: "Cerrando sesión…",

    checkEmailTitle: "Verifique su correo electrónico",
    checkEmailSubtitle:
      "El registro de panelista estará disponible cuando verifique su correo electrónico.",
    checkEmailSentPrefix: "Enviamos",
    checkEmailTriedPrefix: "Intentamos enviar",
    checkEmailTo: "un enlace de verificación a",
    checkEmailYourAddress: "su correo electrónico",
    checkEmailOpenLink: "Abra ese enlace para continuar. El enlace vence en 24 horas.",
    checkEmailAfterVerify: "Después de la verificación, puede completar su perfil de registro.",
    checkInboxTitle: "Revise su bandeja de entrada",
    checkInboxBody:
      "Revise el correo no deseado si no lo ve en un minuto. Sin un dominio de envío personalizado, Resend solo puede entregar al correo de su cuenta de Resend.",
    emailNotDeliveredTitle: "No se entregó el correo",
    emailNotDeliveredFallback: "No se pudo enviar el correo de verificación.",
    emailNotDeliveredHint:
      "Use el enlace en este sitio abajo, o reenvíe después de registrarse con el correo de su cuenta de Resend.",
    verifyOnSiteTitle: "Verifique en este sitio",
    verifyOnSiteBody:
      "Esta es la misma confirmación que al hacer clic en el botón del correo. Verifica su dirección en Belize Research Panel.",
    confirmEmailAddress: "Confirmar dirección de correo",
    sending: "Enviando…",
    resendVerification: "Reenviar correo de verificación",
    backToLogin: "Volver al inicio de sesión",
    backToHome: "Volver al inicio",
    couldNotResend: "No se pudo reenviar el correo.",
    checkInboxNewLink: "Revise su bandeja de entrada para un nuevo enlace.",

    verifySuccessTitle: "Felicitaciones, su correo ha sido verificado",
    verifySuccessSubtitle: "Inicie sesión para continuar con el registro de la cuenta.",
    verifyAdminTitle: "Se requiere aprobación del administrador",
    verifyAdminSubtitle:
      "Los cambios de correo son revisados por nuestro equipo. Si solicitó un correo nuevo recientemente, su cuenta permanece en espera hasta que un administrador apruebe el cambio.",
    viewAccountStatus: "Ver estado de la cuenta",
    verifyMissingTitle: "Enlace de verificación no válido",
    verifyMissingSubtitle: "Este enlace de verificación falta o está incompleto.",
    verifyExpiredTitle: "Enlace de verificación vencido",
    verifyExpiredSubtitle: "Este enlace puede haberse usado ya o ya no es válido.",
    verifyFailedTitle: "Falló la verificación",
    verifyFailedSubtitle:
      "No pudimos verificar su correo en este momento. Inténtelo de nuevo o inicie sesión si ya lo verificó.",
    verifyDefaultTitle: "Revise su correo",
    verifyDefaultSubtitle:
      "Abra el enlace de verificación que enviamos a su bandeja de entrada para continuar el registro.",
    createAccount: "Crear cuenta",
    createNewAccount: "Crear una cuenta nueva",
    goToVerificationHelp: "Ir a ayuda de verificación",
    logIn: "Iniciar sesión",

    facebookPageTitle: "Inicio de sesión con Facebook",
    facebookPageSubtitle: "Conectando su cuenta de Facebook con el Belize Research Panel.",
    facebookCouldNotSignIn: "No se pudo iniciar sesión con Facebook",
    facebookSetupHelp:
      "Si el inicio de sesión de Meta / Facebook aún está pendiente de verificación, termine la configuración en la consola de desarrolladores de Meta, habilite el proveedor de Facebook en Supabase Auth e inténtelo de nuevo.",
    facebookPleaseWait: "Espere",
    facebookFinishing: "Finalizando el inicio de sesión con Facebook…",
    facebookSignup: "Registrarse con Facebook",
    facebookContinue: "Continuar con Facebook",
    facebookConnecting: "Conectando Facebook…",
    facebookNotEnabled:
      "El inicio de sesión con Facebook estará disponible después de la verificación de la app de Meta y de habilitar Facebook en Supabase Auth.",
    facebookReadyHint:
      "El acceso con Facebook está listo en la app. Habilite el proveedor de Facebook en Supabase después de verificar su app de Meta.",
    facebookCouldNotStart: "No se pudo iniciar el acceso con Facebook.",
    orContinueWithEmail: "o continuar con correo electrónico",

    loginPageTitle: "Inicio de sesión de panelista",
    loginPageSubtitle:
      "Inicie sesión con Facebook o con el correo y la contraseña que usó al crear su cuenta.",
    loginEmail: "Correo electrónico",
    loginPassword: "Contraseña",
    loginSubmit: "Iniciar sesión",
    loggingIn: "Iniciando sesión…",
    forgotPassword: "¿Olvidó su contraseña?",
    noAccount: "¿Necesita una cuenta?",
    signUp: "Crear cuenta",
    emailVerifiedBannerTitle: "Felicitaciones, su correo ha sido verificado",
    emailVerifiedBannerBody: "Inicie sesión para continuar con el registro de la cuenta.",

    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",

    phoneCountryCode: "Código de país",
    phoneNumber: "Número de teléfono",

    socialViewProfile: "Ver perfil",
    socialConfirmProfile: "Abra el perfil y confirme que esta es su cuenta de {platform} antes de continuar.",

    draftRestoredPrefix: "Se restauraron sus respuestas guardadas. Vuelva a subir:",
  },
};
