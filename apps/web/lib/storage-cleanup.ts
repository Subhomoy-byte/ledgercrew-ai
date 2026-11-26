// Removes everything under a storage folder. Used when an account is deleted:
// database rows are cleaned up by foreign keys, but files in Storage are NOT,
// so they must be removed explicitly or they'd be left behind.

export interface FolderEntry {
  name: string;
  /** Storage reports sub-folders with a null id. */
  id?: string | null;
}

export interface FolderStorage {
  list(
    folder: string,
    options: { limit: number }
  ): Promise<{ data: FolderEntry[] | null; error: { message: string } | null }>;
  remove(
    paths: string[]
  ): Promise<{ data: unknown[] | null; error: { message: string } | null }>;
}

const PAGE_SIZE = 1000;
const MAX_ROUNDS = 50; // stops a runaway loop if remove() ever silently does nothing
const MAX_DEPTH = 5;

export async function removeFolder(
  storage: FolderStorage,
  folder: string,
  depth = 0
): Promise<{ error: string | null }> {
  if (depth > MAX_DEPTH) return { error: "Folders are nested too deeply to remove." };

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const listed = await storage.list(folder, { limit: PAGE_SIZE });
    if (listed.error) return { error: listed.error.message };

    const entries = listed.data ?? [];
    if (entries.length === 0) return { error: null };

    for (const sub of entries.filter((e) => e.id === null)) {
      const inner = await removeFolder(storage, `${folder}/${sub.name}`, depth + 1);
      if (inner.error) return inner;
    }

    const files = entries
      .filter((e) => e.id !== null)
      .map((e) => `${folder}/${e.name}`);
    if (files.length > 0) {
      const removed = await storage.remove(files);
      if (removed.error) return { error: removed.error.message };
    }
  }
  return { error: "Too many files to remove in one go." };
}
