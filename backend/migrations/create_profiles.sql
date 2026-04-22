create table if not exists public.profiles (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  avatar_url text,
  provider   text,                         
  major      text,                         
  college    text,                          
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, full_name, avatar_url, provider)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider'
  )
  on conflict (user_id) do nothing;  -- safe to re-run, won't duplicate
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles
  for select
  using ( auth.uid() = user_id );

create policy "Users can update own profile"
  on public.profiles
  for update
  using ( auth.uid() = user_id );