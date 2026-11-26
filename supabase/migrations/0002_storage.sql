-- LedgerCrew AI — Storage: buckets + access rules
-- Run once in Supabase -> SQL Editor, AFTER 0001_core_schema.sql. Safe to run again.

-- File-size limits and allowed file types are enforced by Supabase Storage on
-- the server, so they can't be bypassed by editing the page in DevTools.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',   'avatars',   true,  2097152,  array['image/png', 'image/jpeg', 'image/webp']),
  ('documents', 'documents', false, 10485760, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- avatars (public bucket: anyone holding an image's link can view it, which
-- is what lets <img> tags work). Writing is limited to a folder named after
-- your own user id, so nobody can overwrite or delete anyone else's picture.
-- ---------------------------------------------------------------------
drop policy if exists "avatars: read own folder" on storage.objects;
create policy "avatars: read own folder"
on storage.objects for select to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: upload to own folder" on storage.objects;
create policy "avatars: upload to own folder"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: delete own" on storage.objects;
create policy "avatars: delete own"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- documents (PRIVATE bucket). Files live in a folder named after the
-- business id, so everyone on the same business can see them and nobody
-- outside it can — same rule as every table in 0001_core_schema.sql.
-- ---------------------------------------------------------------------
drop policy if exists "documents: read own business" on storage.objects;
create policy "documents: read own business"
on storage.objects for select to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = public.current_business_id()::text);

drop policy if exists "documents: upload to own business" on storage.objects;
create policy "documents: upload to own business"
on storage.objects for insert to authenticated
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = public.current_business_id()::text);

drop policy if exists "documents: delete own business" on storage.objects;
create policy "documents: delete own business"
on storage.objects for delete to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = public.current_business_id()::text);
