"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteAccount, type DeletionDeps } from "@/lib/account-deletion";
import { removeFolder } from "@/lib/storage-cleanup";
import { AVATAR_BUCKET, DOCUMENT_BUCKET } from "@/lib/storage";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

// Wires the pure deletion logic to real Supabase calls. Not exported: a
// "use server" file may only export async functions, and this must never
// be callable from the browser anyway.
function adminDeps(admin: AdminClient): DeletionDeps {
  return {
    async getProfile(userId) {
      const { data, error } = await admin
        .from("profiles")
        .select("business_id, role")
        .eq("id", userId)
        .maybeSingle();
      return { data: data ?? null, error: error?.message ?? null };
    },
    async countOtherMembers(businessId, userId) {
      const { count, error } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .neq("id", userId);
      return { data: count ?? 0, error: error?.message ?? null };
    },
    // Files in Storage aren't removed by database cascades — do it explicitly.
    removeBusinessFiles(businessId) {
      return removeFolder(admin.storage.from(DOCUMENT_BUCKET), businessId);
    },
    async deleteBusiness(businessId) {
      const { error } = await admin.from("businesses").delete().eq("id", businessId);
      return { error: error?.message ?? null };
    },
    removeUserFiles(userId) {
      return removeFolder(admin.storage.from(AVATAR_BUCKET), userId);
    },
    async deleteUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      return { error: error?.message ?? null };
    },
  };
}

export async function deleteAccountAction(): Promise<{ error: string } | void> {
  // Who is asking is decided by the verified session cookie — never by
  // anything the browser sends along with the request.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  if (!admin) {
    return {
      error:
        "Account deletion isn't set up on this server yet (the service key is missing).",
    };
  }

  const result = await deleteAccount(user.id, adminDeps(admin));
  if (!result.ok) return { error: result.error };

  // The login no longer exists; clear the now-dead session cookie.
  await supabase.auth.signOut();
  redirect("/login");
}
