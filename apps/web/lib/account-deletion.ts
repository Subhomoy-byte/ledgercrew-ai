// Pure decision logic for deleting an account. It performs no I/O itself —
// everything it needs is passed in via `deps` — so every path (including
// failures) can be tested without a real database.
//
// Ordering is deliberate. For the last member of a business:
//   1. remove the business's uploaded documents,
//   2. remove the business,
//   3. remove the user's profile picture,
//   4. remove the login.
// If any step fails, the user simply retries: files are removed before the
// records that point to them, and once the business is gone the profile no
// longer references it, so a retry skips straight to steps 3 and 4. Nothing is
// left in a state that can't be recovered from.

export type DeletionResult = { ok: true } | { ok: false; error: string };

type DbResult<T> = { data: T; error: string | null };

export interface DeletionDeps {
  getProfile(
    userId: string
  ): Promise<DbResult<{ business_id: string | null; role: string } | null>>;
  countOtherMembers(
    businessId: string,
    userId: string
  ): Promise<DbResult<number>>;
  removeBusinessFiles(businessId: string): Promise<{ error: string | null }>;
  deleteBusiness(businessId: string): Promise<{ error: string | null }>;
  removeUserFiles(userId: string): Promise<{ error: string | null }>;
  deleteUser(userId: string): Promise<{ error: string | null }>;
}

const fail = (error: string): DeletionResult => ({ ok: false, error });

export async function deleteAccount(
  userId: string,
  deps: DeletionDeps
): Promise<DeletionResult> {
  const profile = await deps.getProfile(userId);
  if (profile.error) {
    return fail("We couldn't load your account details. Nothing was deleted.");
  }

  const businessId = profile.data?.business_id ?? null;
  let businessRemoved = false;

  if (businessId) {
    const others = await deps.countOtherMembers(businessId, userId);
    if (others.error) {
      return fail("We couldn't check your team's access. Nothing was deleted.");
    }

    if (others.data > 0) {
      // Other people still use this business. An owner can't leave it
      // behind; a regular member can leave without touching it.
      if (profile.data?.role === "owner") {
        return fail(
          "You're the owner of a business that still has team members. Remove them or transfer ownership first, then delete your account."
        );
      }
    } else {
      const files = await deps.removeBusinessFiles(businessId);
      if (files.error) {
        return fail(
          "We couldn't remove your uploaded documents, so your account wasn't closed. Some files may already have been removed. Please try again."
        );
      }
      const removed = await deps.deleteBusiness(businessId);
      if (removed.error) {
        return fail(
          "We couldn't remove your business data, so your account wasn't closed. Please try again."
        );
      }
      businessRemoved = true;
    }
  }

  const avatar = await deps.removeUserFiles(userId);
  if (avatar.error) {
    return fail(
      businessRemoved
        ? "Your business data was removed, but we couldn't remove your profile picture. Please try again."
        : "We couldn't remove your profile picture, so your account wasn't closed. Please try again."
    );
  }

  const user = await deps.deleteUser(userId);
  if (user.error) {
    return fail(
      businessRemoved
        ? "Your business data was removed, but we couldn't close your login. Please try again."
        : "We couldn't close your account. Please try again."
    );
  }

  return { ok: true };
}
