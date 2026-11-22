-- SECURITY FIX (prepared for review, NOT applied yet).
-- Run ONLY after the code in this PR is live AND SUPABASE_SERVICE_ROLE_KEY and
-- AUTH_SECRET are set in Vercel, because the site then reads/writes these tables
-- through server routes with the service-role key (which bypasses RLS).
-- Result: the public anon key (visible in the site's JavaScript) can no longer
-- read or change admins (password hashes), events, library_items or library files.

drop policy if exists "Allow all on admins" on public.admins;
drop policy if exists "Allow all on events" on public.events;
drop policy if exists "library read" on public.library_items;
drop policy if exists "library insert" on public.library_items;
drop policy if exists "library update" on public.library_items;
drop policy if exists "library delete" on public.library_items;

-- Storage: keep public downloads (the bucket is public, files stay readable by URL),
-- but remove public upload and delete.
drop policy if exists "library files insert" on storage.objects;
drop policy if exists "library files delete" on storage.objects;

revoke all on public.admins, public.events, public.library_items from anon, authenticated;

-- ROLLBACK (if something breaks), run to restore the old behavior:
-- create policy "Allow all on admins" on public.admins for all to public using (true) with check (true);
-- create policy "Allow all on events" on public.events for all to public using (true) with check (true);
-- create policy "library read" on public.library_items for select to public using (true);
-- create policy "library insert" on public.library_items for insert to public with check (true);
-- create policy "library update" on public.library_items for update to public using (true) with check (true);
-- create policy "library delete" on public.library_items for delete to public using (true);
-- grant all on public.admins, public.events, public.library_items to anon, authenticated;
