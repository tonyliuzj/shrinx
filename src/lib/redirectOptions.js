export const REDIRECT_ACCESS_TYPES = {
  SIMPLE: "simple",
  CAPTCHA: "captcha",
  PASSWORD: "password",
};

export const REDIRECT_ACCESS_OPTIONS = [
  {
    value: REDIRECT_ACCESS_TYPES.SIMPLE,
    label: "Simple",
    description: "Send visitors straight to the destination.",
  },
  {
    value: REDIRECT_ACCESS_TYPES.CAPTCHA,
    label: "Captcha",
    description: "Require Cloudflare Turnstile before redirecting.",
  },
  {
    value: REDIRECT_ACCESS_TYPES.PASSWORD,
    label: "Password",
    description: "Require a password before redirecting.",
  },
];

const VALID_ACCESS_TYPES = new Set(
  REDIRECT_ACCESS_OPTIONS.map((option) => option.value)
);

export function normalizeRedirectAccessType(value) {
  return VALID_ACCESS_TYPES.has(value)
    ? value
    : REDIRECT_ACCESS_TYPES.SIMPLE;
}

export function getRedirectAccessOption(value) {
  const normalized = normalizeRedirectAccessType(value);

  return (
    REDIRECT_ACCESS_OPTIONS.find((option) => option.value === normalized) ||
    REDIRECT_ACCESS_OPTIONS[0]
  );
}

export function validateRedirectAccessInput({
  accessType,
  accessPassword,
}) {
  const normalizedAccessType = normalizeRedirectAccessType(accessType);
  const rawPassword = typeof accessPassword === "string" ? accessPassword : "";

  if (normalizedAccessType === REDIRECT_ACCESS_TYPES.PASSWORD) {
    if (!rawPassword.trim()) {
      return {
        valid: false,
        accessType: normalizedAccessType,
        error: "Password is required for password-protected redirects.",
      };
    }

    if (rawPassword.length < 4) {
      return {
        valid: false,
        accessType: normalizedAccessType,
        error: "Password must be at least 4 characters.",
      };
    }
  }

  return {
    valid: true,
    accessType: normalizedAccessType,
    error: null,
  };
}
