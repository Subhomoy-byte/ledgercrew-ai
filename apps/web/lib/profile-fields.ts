// Pure rules for the Your Profile forms. No network and no browser APIs, so
// every rule can be tested directly. The length limits and formats here mirror
// supabase/migrations/0003_profile_rules.sql: the database enforces them too
// (the part that can't be bypassed), while checking here gives friendly,
// specific messages before anything is sent.

export type PersonalValues = { full_name: string; phone: string };
export type BusinessValues = { name: string; business_type: string; address: string };
export type GstValues = { gstin: string; pan: string; registration_number: string };

export const EMPTY_PERSONAL: PersonalValues = { full_name: "", phone: "" };
export const EMPTY_BUSINESS: BusinessValues = { name: "", business_type: "", address: "" };
export const EMPTY_GST: GstValues = { gstin: "", pan: "", registration_number: "" };

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "LLP",
  "Private Limited",
  "Public Limited",
  "HUF",
  "Other",
];

export const LIMITS = {
  full_name: 100,
  phone: 25,
  name: 120,
  business_type: 60,
  address: 300,
  registration_number: 50,
} as const;

// The first two characters of a GSTIN are the state code.
export const GST_STATES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman and Diu",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (before division)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
  "99": "Centre Jurisdiction",
};

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const tidy = (s: string) => s.trim().replace(/\s+/g, " ");
const upperNoSpaces = (s: string) => s.toUpperCase().replace(/\s+/g, "");
const orNull = (s: string) => (s === "" ? null : s);

// ---- normalising: what actually gets saved (empty -> null, tidy spacing) ----

export function normalizePersonal(v: PersonalValues) {
  return { full_name: orNull(tidy(v.full_name)), phone: orNull(v.phone.trim()) };
}

export function normalizeBusiness(v: BusinessValues) {
  return {
    name: tidy(v.name),
    business_type: orNull(tidy(v.business_type)),
    address: orNull(tidy(v.address)),
  };
}

export function normalizeGst(v: GstValues) {
  return {
    gstin: orNull(upperNoSpaces(v.gstin)),
    pan: orNull(upperNoSpaces(v.pan)),
    registration_number: orNull(tidy(v.registration_number)),
  };
}

// ---- GSTIN helpers ----

const CHECK_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** The GSTIN check character: a Luhn-style mod-36 sum over the first 14 characters. */
export function gstinCheckChar(first14: string): string {
  let factor = 2;
  let sum = 0;
  for (let i = first14.length - 1; i >= 0; i--) {
    const digit = factor * CHECK_ALPHABET.indexOf(first14[i]);
    factor = factor === 2 ? 1 : 2;
    sum += Math.floor(digit / 36) + (digit % 36);
  }
  return CHECK_ALPHABET[(36 - (sum % 36)) % 36];
}

/** State name for a (possibly still-being-typed) GSTIN, or null. */
export function stateFromGstin(gstin: string): string | null {
  const code = upperNoSpaces(gstin).slice(0, 2);
  return /^[0-9]{2}$/.test(code) ? (GST_STATES[code] ?? null) : null;
}

// ---- validating: friendly, specific messages ----

export function validatePersonal(v: PersonalValues): FieldErrors<PersonalValues> {
  const n = normalizePersonal(v);
  const errors: FieldErrors<PersonalValues> = {};
  if (n.full_name && n.full_name.length > LIMITS.full_name) {
    errors.full_name = `Keep your name to ${LIMITS.full_name} characters or fewer.`;
  }
  if (n.phone) {
    const digits = n.phone.replace(/\D/g, "").length;
    if (n.phone.length > LIMITS.phone || !/^\+?[0-9 ()-]+$/.test(n.phone) || digits < 7 || digits > 15) {
      errors.phone = "Enter a phone number like +91 98300 00000.";
    }
  }
  return errors;
}

export function validateBusiness(v: BusinessValues): FieldErrors<BusinessValues> {
  const n = normalizeBusiness(v);
  const errors: FieldErrors<BusinessValues> = {};
  if (!n.name) errors.name = "Enter your business name.";
  else if (n.name.length > LIMITS.name) errors.name = `Keep the name to ${LIMITS.name} characters or fewer.`;
  if (n.business_type && n.business_type.length > LIMITS.business_type) {
    errors.business_type = `Keep this to ${LIMITS.business_type} characters or fewer.`;
  }
  if (n.address && n.address.length > LIMITS.address) {
    errors.address = `Keep the address to ${LIMITS.address} characters or fewer.`;
  }
  return errors;
}

export function validateGst(v: GstValues): FieldErrors<GstValues> {
  const n = normalizeGst(v);
  const errors: FieldErrors<GstValues> = {};

  if (n.gstin) {
    if (!GSTIN_PATTERN.test(n.gstin)) {
      errors.gstin = "That doesn't look like a GSTIN. It has 15 characters, like 27AAPFU0939F1ZV.";
    } else if (GST_STATES[n.gstin.slice(0, 2)] === undefined) {
      errors.gstin = `The first two digits (${n.gstin.slice(0, 2)}) aren't a valid GST state code.`;
    } else if (gstinCheckChar(n.gstin.slice(0, 14)) !== n.gstin[14]) {
      errors.gstin = "This GSTIN doesn't pass the check-character test. Please look for a typo.";
    }
  }

  if (n.pan && !PAN_PATTERN.test(n.pan)) {
    errors.pan = "A PAN has 10 characters: 5 letters, 4 digits, 1 letter (like ABCDE1234F).";
  }

  // A GSTIN contains the taxpayer's PAN (characters 3 to 12).
  if (n.gstin && n.pan && !errors.gstin && !errors.pan && n.gstin.slice(2, 12) !== n.pan) {
    errors.pan = `This PAN doesn't match the one inside your GSTIN (${n.gstin.slice(2, 12)}).`;
  }

  if (n.registration_number && n.registration_number.length > LIMITS.registration_number) {
    errors.registration_number = `Keep this to ${LIMITS.registration_number} characters or fewer.`;
  }
  return errors;
}

export function firstError(errors: Record<string, string | undefined>): string | null {
  for (const message of Object.values(errors)) if (message) return message;
  return null;
}
