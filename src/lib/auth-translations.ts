export type AuthLanguage = "bn" | "en";

export interface AuthTranslations {
  // Modal Top & Switcher
  langSwitcherAria: string;
  closeModal: string;

  // Header Titles & Subtitles
  loginTitle: string;
  loginSubtitle: string;
  signupTitle: string;
  signupSubtitle: string;
  forgotPasswordTitle: string;
  forgotPasswordSubtitle: string;
  profileCompleteTitle: string;
  profileCompleteSubtitle: string;

  // Google OAuth & Divider
  googleButton: string;
  orWithEmail: string;

  // Field Labels & Placeholders
  emailOrUsernamePlaceholder: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  signupPasswordPlaceholder: string;
  usernamePlaceholder: string;
  usernameHint: string;
  phonePlaceholder: string;
  addressPlaceholder: string;
  newUsernamePlaceholder: string;

  // Accessibility / Password Eye
  showPassword: string;
  hidePassword: string;

  // Links & Navigation
  forgotPasswordLink: string;
  noAccountPrompt: string;
  signUpLink: string;
  hasAccountPrompt: string;
  signInLink: string;
  rememberPasswordPrompt: string;

  // Buttons & Loading
  signInButton: string;
  signingIn: string;
  signUpButton: string;
  signingUp: string;
  sendResetLinkButton: string;
  sendingResetLink: string;
  saveProfileButton: string;
  savingProfile: string;

  // Trust Badges
  sslSecured: string;
  encrypted: string;
  fastLogin: string;

  // Validation Messages
  validationPasswordMismatch: string;
  validationPasswordShort: string;
  validationUsernameInvalid: string;
  validationPhoneTaken: string;
  validationUsernameTaken: string;
  validationEnterEmail: string;

  // Toast / Status Notifications
  toastPasswordMismatchTitle: string;
  toastShortPasswordTitle: string;
  toastInvalidUsernameTitle: string;
  toastRegistrationFailedTitle: string;
  toastUsernameTakenTitle: string;
  toastVerificationCodeSentTitle: string;
  toastVerificationCodeSentDesc: string;
  toastWelcomeTitle: string;
  toastAccountCreatedDesc: string;
  toastSignInFailedTitle: string;
  toastSignInFailedGeneric: string;
  toastWelcomeBackTitle: string;
  toastSignedInDesc: string;
  toastResetSentTitle: string;
  toastResetSentDesc: string;
  toastAuthFailedTitle: string;
  toastUnexpectedError: string;
}

export const AUTH_LANG_STORAGE_KEY = "techbd_auth_lang";

export const authTranslations: Record<AuthLanguage, AuthTranslations> = {
  bn: {
    langSwitcherAria: "ভাষা নির্বাচন করুন",
    closeModal: "বন্ধ করুন",

    loginTitle: "লগইন করুন",
    loginSubtitle: "আপনার অ্যাকাউন্টে প্রবেশ করুন",
    signupTitle: "সাইনআপ করুন",
    signupSubtitle: "নতুন অ্যাকাউন্ট তৈরি করুন",
    forgotPasswordTitle: "পাসওয়ার্ড রিসেট",
    forgotPasswordSubtitle: "আপনার ইমেইলে রিসেট লিংক পাঠান",
    profileCompleteTitle: "প্রোফাইল সম্পন্ন করুন",
    profileCompleteSubtitle: "আরও কিছু তথ্য প্রদান করুন",

    googleButton: "Google দিয়ে লগইন করুন",
    orWithEmail: "অথবা ইমেইল দিয়ে",

    emailOrUsernamePlaceholder: "ইমেইল ঠিকানা",
    emailPlaceholder: "ইমেইল ঠিকানা",
    passwordPlaceholder: "পাসওয়ার্ড",
    confirmPasswordPlaceholder: "পাসওয়ার্ড নিশ্চিত করুন",
    signupPasswordPlaceholder: "পাসওয়ার্ড (কমপক্ষে ১০ অক্ষর)",
    usernamePlaceholder: "ইউজারনেম (৩-৩০ অক্ষর)",
    usernameHint: "৩-৩০ অক্ষর, ইংরেজি বর্ণ ও সংখ্যা",
    phonePlaceholder: "মোবাইল নম্বর (+880 17...)",
    addressPlaceholder: "ঠিকানা (বাসা, রোড, এলাকা, শহর)",
    newUsernamePlaceholder: "নতুন ইউজারনেম",

    showPassword: "পাসওয়ার্ড দেখুন",
    hidePassword: "পাসওয়ার্ড লুকান",

    forgotPasswordLink: "পাসওয়ার্ড ভুলে গেছেন?",
    noAccountPrompt: "অ্যাকাউন্ট নেই?",
    signUpLink: "সাইনআপ করুন",
    hasAccountPrompt: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
    signInLink: "লগইন করুন",
    rememberPasswordPrompt: "মনে পড়েছে?",

    signInButton: "লগইন করুন",
    signingIn: "লগইন হচ্ছে...",
    signUpButton: "সাইনআপ করুন",
    signingUp: "তৈরি হচ্ছে...",
    sendResetLinkButton: "রিসেট লিংক পাঠান",
    sendingResetLink: "পাঠানো হচ্ছে...",
    saveProfileButton: "প্রোফাইল সেভ করুন",
    savingProfile: "সেভ হচ্ছে...",

    sslSecured: "SSL সুরক্ষিত",
    encrypted: "এনক্রিপ্টেড",
    fastLogin: "দ্রুত লগইন",

    validationPasswordMismatch: "পাসওয়ার্ড দুটি মিলছে না।",
    validationPasswordShort: "পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।",
    validationUsernameInvalid: "ইউজারনেম ৩ থেকে ৩০ অক্ষরের হতে হবে।",
    validationPhoneTaken: "এই ফোন নম্বর দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে।",
    validationUsernameTaken: "এই ইউজারনেম বা ফোন ইতিমধ্যে ব্যবহৃত হয়েছে। অনুগ্রহ করে অন্যটি বেছে নিন।",
    validationEnterEmail: "অনুগ্রহ করে আপনার ইমেইল ঠিকানা লিখুন।",

    toastPasswordMismatchTitle: "পাসওয়ার্ড মেলেনি",
    toastShortPasswordTitle: "ছোট পাসওয়ার্ড",
    toastInvalidUsernameTitle: "ভুল ইউজারনেম",
    toastRegistrationFailedTitle: "রেজিস্ট্রেশন ব্যর্থ",
    toastUsernameTakenTitle: "ইউজারনেম বিদ্যমান",
    toastVerificationCodeSentTitle: "ভেরিফিকেশন কোড পাঠানো হয়েছে",
    toastVerificationCodeSentDesc: "ভেরিফিকেশন কোডের জন্য আপনার ইমেইল চেক করুন।",
    toastWelcomeTitle: "স্বাগতম Tech Solutions BD-তে",
    toastAccountCreatedDesc: "অ্যাকাউন্ট সফলভাবে তৈরি ও প্রোফাইল সংরক্ষিত হয়েছে।",
    toastSignInFailedTitle: "সাইন ইন করতে ব্যর্থ",
    toastSignInFailedGeneric: "ভুল ইমেইল অথবা পাসওয়ার্ড।",
    toastWelcomeBackTitle: "আবার স্বাগতম",
    toastSignedInDesc: "সফলভাবে সাইন ইন হয়েছে।",
    toastResetSentTitle: "রিসেট ইমেইল পাঠানো হয়েছে",
    toastResetSentDesc: "পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।",
    toastAuthFailedTitle: "অথেন্টিকেশন ব্যর্থ",
    toastUnexpectedError: "একটি অপ্রত্যাশিত সমস্যা হয়েছে।",
  },

  en: {
    langSwitcherAria: "Switch language",
    closeModal: "Close modal",

    loginTitle: "Sign In",
    loginSubtitle: "Access your account",
    signupTitle: "Create an Account",
    signupSubtitle: "Join Tech Solutions BD",
    forgotPasswordTitle: "Reset Password",
    forgotPasswordSubtitle: "Send reset link to your email",
    profileCompleteTitle: "Complete Profile",
    profileCompleteSubtitle: "Please provide a few more details",

    googleButton: "Continue with Google",
    orWithEmail: "Or continue with email",

    emailOrUsernamePlaceholder: "Email Address",
    emailPlaceholder: "Email Address",
    passwordPlaceholder: "Password",
    confirmPasswordPlaceholder: "Confirm Password",
    signupPasswordPlaceholder: "Password (at least 10 chars)",
    usernamePlaceholder: "Username (3-30 characters)",
    usernameHint: "3-30 chars, letters, numbers, . _ -",
    phonePlaceholder: "Phone Number (+880 17...)",
    addressPlaceholder: "Address (House, Road, Area, City)",
    newUsernamePlaceholder: "New Username",

    showPassword: "Show password",
    hidePassword: "Hide password",

    forgotPasswordLink: "Forgot Password?",
    noAccountPrompt: "Don't have an account?",
    signUpLink: "Sign Up",
    hasAccountPrompt: "Already have an account?",
    signInLink: "Sign In",
    rememberPasswordPrompt: "Remember your password?",

    signInButton: "Sign In",
    signingIn: "Signing in...",
    signUpButton: "Sign Up",
    signingUp: "Creating account...",
    sendResetLinkButton: "Send Reset Link",
    sendingResetLink: "Sending link...",
    saveProfileButton: "Save Profile",
    savingProfile: "Saving profile...",

    sslSecured: "SSL Secured",
    encrypted: "Encrypted",
    fastLogin: "Fast Login",

    validationPasswordMismatch: "Passwords do not match.",
    validationPasswordShort: "Password must be at least 10 characters.",
    validationUsernameInvalid: "Username must be 3-30 characters.",
    validationPhoneTaken: "An account with this phone number already exists.",
    validationUsernameTaken: "That username or phone is already taken. Please choose another.",
    validationEnterEmail: "Please enter your email address.",

    toastPasswordMismatchTitle: "Password mismatch",
    toastShortPasswordTitle: "Short password",
    toastInvalidUsernameTitle: "Invalid username",
    toastRegistrationFailedTitle: "Registration failed",
    toastUsernameTakenTitle: "Username taken",
    toastVerificationCodeSentTitle: "Verification code sent",
    toastVerificationCodeSentDesc: "Check your email for the verification code.",
    toastWelcomeTitle: "Welcome to Tech Solutions BD",
    toastAccountCreatedDesc: "Account created and profile saved successfully.",
    toastSignInFailedTitle: "Unable to sign in",
    toastSignInFailedGeneric: "Invalid email or password.",
    toastWelcomeBackTitle: "Welcome back",
    toastSignedInDesc: "Signed in successfully.",
    toastResetSentTitle: "Reset email sent",
    toastResetSentDesc: "Password reset link has been sent to your email.",
    toastAuthFailedTitle: "Authentication failed",
    toastUnexpectedError: "An unexpected authentication error occurred.",
  },
};

let cachedAuthLang: AuthLanguage | null = null;

export function getInitialAuthLanguage(): AuthLanguage {
  if (cachedAuthLang) {
    return cachedAuthLang;
  }
  if (typeof window === "undefined") {
    return "bn";
  }
  try {
    const saved = localStorage.getItem(AUTH_LANG_STORAGE_KEY);
    if (saved === "en" || saved === "bn") {
      cachedAuthLang = saved;
      return saved;
    }
  } catch {
    // Ignore storage errors in private/restricted environments
  }
  cachedAuthLang = "bn";
  return "bn";
}

export function setStoredAuthLanguage(lang: AuthLanguage): void {
  cachedAuthLang = lang;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_LANG_STORAGE_KEY, lang);
  } catch {
    // Ignore storage errors
  }
}

export function subscribeAuthLanguage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(AUTH_LANG_STORAGE_KEY);
        if (saved === "en" || saved === "bn") {
          cachedAuthLang = saved;
        }
      } catch {
        // Ignore
      }
    }
    callback();
  };
  window.addEventListener("techbd:auth-lang-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("techbd:auth-lang-change", handler);
    window.removeEventListener("storage", handler);
  };
}

