-- Supabase SQL Editor에서 실행. 이메일을 실제 관리자 이메일로 변경하세요.
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  video_date date not null,
  title text not null,
  youtube_url text not null,
  created_at timestamptz not null default now()
);
alter table public.videos enable row level security;
drop policy if exists "Anyone can read videos" on public.videos;
create policy "Anyone can read videos" on public.videos for select to anon, authenticated using (true);
drop policy if exists "Admin can add videos" on public.videos;
create policy "Admin can add videos" on public.videos for insert to authenticated with check ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL@example.com');
drop policy if exists "Admin can delete videos" on public.videos;
create policy "Admin can delete videos" on public.videos for delete to authenticated using ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL@example.com');
