import type { SupabaseClient } from "@supabase/supabase-js";
import type { Result } from "./storage-client";
import {
  EMPTY_BUSINESS,
  EMPTY_GST,
  EMPTY_PERSONAL,
  firstError,
  normalizeBusiness,
  normalizeGst,
  normalizePersonal,
  validateBusiness,
  validateGst,
  validatePersonal,
  type BusinessValues,
  type GstValues,
  type PersonalValues,
} from "./profile-fields";

// Load and save steps for the Your Profile page. The Supabase client is passed
// in (not imported) so every step and failure path can be tested with a fake.
// Each save is ONE request to ONE table, so it either fully succeeds or fully
// fails, never half-saves.

export type LoadedProfile = {
  userId: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  businessId: string | null;
  personal: PersonalValues;
  business: BusinessValues;
  gst: GstValues;
};

type DbError = { message: string; code?: string };

const CONSTRAINT_MESSAGES: Record<string, string> = {
  businesses_gstin_format: "That GSTIN isn't in a valid format.",
  businesses_pan_format: "That PAN isn't in a valid format.",
  businesses_gstin_pan_match: "Your GSTIN and PAN don't match.",
  businesses_name_len: "Business name must be between 1 and 120 characters.",
  businesses_business_type_len: "Business type is too long.",
  businesses_address_len: "Address is too long.",
  businesses_registration_number_len: "Registration number is too long.",
  profiles_full_name_len: "Name is too long.",
  profiles_phone_len: "Phone number is too long.",
};

function describeSaveError(error: DbError): string {
  for (const [constraint, text] of Object.entries(CONSTRAINT_MESSAGES)) {
    if (error.message.includes(constraint)) return text;
  }
  return "We couldn't save your changes. Please try again.";
}

const NOT_OWNER =
  "Your changes weren't saved. Only the business owner can change these details.";
const NOT_SAVED_PERSONAL =
  "Your changes weren't saved. Please sign in again and retry.";

function finishSave<T>(
  result: { data: unknown[] | null; error: DbError | null },
  value: T,
  noRowsMessage: string
): Result<T> {
  if (result.error) return { ok: false, error: describeSaveError(result.error) };
  // Row-Level Security can change ZERO rows without raising an error, so
  // "no error" alone doesn't mean it saved.
  if (!result.data || result.data.length !== 1) return { ok: false, error: noRowsMessage };
  return { ok: true, value };
}

export async function loadProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Result<LoadedProfile>> {
  const profile = await supabase
    .from("profiles")
    .select("full_name, email, phone, avatar_url, business_id, role")
    .eq("id", userId)
    .maybeSingle();
  if (profile.error) return { ok: false, error: "We couldn't load your profile." };

  const businessId: string | null = profile.data?.business_id ?? null;
  let business = EMPTY_BUSINESS;
  let gst = EMPTY_GST;

  if (businessId) {
    const biz = await supabase
      .from("businesses")
      .select("name, business_type, address, gstin, pan, registration_number")
      .eq("id", businessId)
      .maybeSingle();
    if (biz.error) return { ok: false, error: "We couldn't load your business details." };
    if (biz.data) {
      business = {
        name: biz.data.name ?? "",
        business_type: biz.data.business_type ?? "",
        address: biz.data.address ?? "",
      };
      gst = {
        gstin: biz.data.gstin ?? "",
        pan: biz.data.pan ?? "",
        registration_number: biz.data.registration_number ?? "",
      };
    }
  }

  return {
    ok: true,
    value: {
      userId,
      email: profile.data?.email ?? "",
      role: profile.data?.role ?? "member",
      avatarUrl: profile.data?.avatar_url ?? null,
      businessId,
      personal: {
        full_name: profile.data?.full_name ?? EMPTY_PERSONAL.full_name,
        phone: profile.data?.phone ?? EMPTY_PERSONAL.phone,
      },
      business,
      gst,
    },
  };
}

export async function savePersonal(
  supabase: SupabaseClient,
  userId: string,
  values: PersonalValues
): Promise<Result<PersonalValues>> {
  const problem = firstError(validatePersonal(values));
  if (problem) return { ok: false, error: problem };

  const row = normalizePersonal(values);
  const saved = await supabase.from("profiles").update(row).eq("id", userId).select("id");
  return finishSave(
    saved,
    { full_name: row.full_name ?? "", phone: row.phone ?? "" },
    NOT_SAVED_PERSONAL
  );
}

export async function saveBusiness(
  supabase: SupabaseClient,
  businessId: string,
  values: BusinessValues
): Promise<Result<BusinessValues>> {
  const problem = firstError(validateBusiness(values));
  if (problem) return { ok: false, error: problem };

  const row = normalizeBusiness(values);
  const saved = await supabase.from("businesses").update(row).eq("id", businessId).select("id");
  return finishSave(
    saved,
    { name: row.name, business_type: row.business_type ?? "", address: row.address ?? "" },
    NOT_OWNER
  );
}

export async function saveGst(
  supabase: SupabaseClient,
  businessId: string,
  values: GstValues
): Promise<Result<GstValues>> {
  const problem = firstError(validateGst(values));
  if (problem) return { ok: false, error: problem };

  const row = normalizeGst(values);
  const saved = await supabase.from("businesses").update(row).eq("id", businessId).select("id");
  return finishSave(
    saved,
    {
      gstin: row.gstin ?? "",
      pan: row.pan ?? "",
      registration_number: row.registration_number ?? "",
    },
    NOT_OWNER
  );
}
