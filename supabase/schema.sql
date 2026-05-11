create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('patient', 'caregiver', 'family')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.health_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  routine_rating text not null,
  goals text[] not null default '{}',
  confidence integer not null check (confidence between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dosage text,
  instructions text,
  frequency text,
  schedule_time time,
  schedule_times text[] not null default '{}',
  remaining_pills integer not null default 0 check (remaining_pills >= 0),
  refill_threshold integer not null default 6 check (refill_threshold >= 0),
  next_dose_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.medications add column if not exists frequency text;
alter table public.medications add column if not exists schedule_time time;
alter table public.medications add column if not exists schedule_times text[] not null default '{}';

create table if not exists public.dose_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  medication_id bigint not null references public.medications(id) on delete cascade,
  scheduled_for timestamptz not null,
  taken_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'taken', 'missed', 'skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.caregiver_invites (
  id bigint generated always as identity primary key,
  patient_id uuid not null references auth.users(id) on delete cascade,
  caregiver_email text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  requested_by text not null default 'patient' check (requested_by in ('patient', 'caregiver')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.caregiver_invites add column if not exists requested_by text not null default 'patient';
alter table public.caregiver_invites add column if not exists updated_at timestamptz not null default now();
alter table public.caregiver_invites alter column requested_by set default 'patient';
alter table public.caregiver_invites alter column updated_at set default now();
update public.caregiver_invites set requested_by = 'patient' where requested_by is null;
update public.caregiver_invites set updated_at = created_at where updated_at is null;
alter table public.caregiver_invites alter column requested_by set not null;
alter table public.caregiver_invites alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'caregiver_invites_requested_by_check'
      and conrelid = 'public.caregiver_invites'::regclass
  ) then
    alter table public.caregiver_invites
      add constraint caregiver_invites_requested_by_check
      check (requested_by in ('patient', 'caregiver'));
  end if;
end;
$$;

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'CuraDose Dispenser',
  status text not null default 'setup_needed' check (status in ('setup_needed', 'online', 'offline')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.device_slots (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.devices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_number integer not null check (slot_number in (1, 2)),
  label text not null default 'Medication slot',
  medication_id bigint references public.medications(id) on delete set null,
  empty_weight_grams numeric(8, 2) not null default 0,
  pill_weight_grams numeric(8, 3) not null default 1,
  current_weight_grams numeric(8, 2),
  current_pill_count integer not null default 0 check (current_pill_count >= 0),
  last_pill_count integer not null default 0 check (last_pill_count >= 0),
  status text not null default 'setup_needed' check (status in ('setup_needed', 'ready', 'low', 'empty')),
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (device_id, slot_number)
);

create table if not exists public.device_readings (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.devices(id) on delete cascade,
  slot_id bigint references public.device_slots(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_number integer not null check (slot_number in (1, 2)),
  weight_grams numeric(8, 2) not null,
  pill_count integer not null check (pill_count >= 0),
  event_type text not null default 'stable' check (event_type in ('stable', 'dose_taken', 'refill', 'calibration')),
  raw_payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'CuraDose User'),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'patient')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.request_patient_connection(patient_email text)
returns public.caregiver_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_email text;
  target_patient public.profiles%rowtype;
  connection public.caregiver_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to request a patient connection.';
  end if;

  requester_email := lower(auth.jwt() ->> 'email');

  if requester_email is null or requester_email = '' then
    raise exception 'Your account needs an email address before requesting access.';
  end if;

  select *
  into target_patient
  from public.profiles
  where lower(email) = lower(patient_email)
    and role = 'patient'
  limit 1;

  if target_patient.id is null then
    raise exception 'No patient account was found with that email address.';
  end if;

  if target_patient.id = auth.uid() then
    raise exception 'You cannot request access to your own patient account.';
  end if;

  select *
  into connection
  from public.caregiver_invites
  where patient_id = target_patient.id
    and lower(caregiver_email) = requester_email
  order by created_at desc
  limit 1;

  if connection.id is not null then
    update public.caregiver_invites
    set status = 'pending',
        requested_by = 'caregiver',
        updated_at = now()
    where id = connection.id
    returning * into connection;

    return connection;
  end if;

  insert into public.caregiver_invites (patient_id, caregiver_email, status, requested_by)
  values (target_patient.id, requester_email, 'pending', 'caregiver')
  returning * into connection;

  return connection;
end;
$$;

grant execute on function public.request_patient_connection(text) to authenticated;

create or replace function public.disconnect_patient_connection(connection_id bigint)
returns public.caregiver_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_email text;
  connection public.caregiver_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to disconnect a patient.';
  end if;

  requester_email := lower(auth.jwt() ->> 'email');

  update public.caregiver_invites
  set status = 'declined',
      updated_at = now()
  where id = connection_id
    and status = 'accepted'
    and lower(caregiver_email) = requester_email
  returning * into connection;

  if connection.id is null then
    raise exception 'No connected patient was found for this caregiver account.';
  end if;

  return connection;
end;
$$;

grant execute on function public.disconnect_patient_connection(bigint) to authenticated;
revoke update on public.caregiver_invites from authenticated;
grant update(status, updated_at) on public.caregiver_invites to authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.health_goals enable row level security;
alter table public.medications enable row level security;
alter table public.dose_logs enable row level security;
alter table public.caregiver_invites enable row level security;
alter table public.devices enable row level security;
alter table public.device_slots enable row level security;
alter table public.device_readings enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can read their own health goals" on public.health_goals;
drop policy if exists "Users can create their own health goals" on public.health_goals;
drop policy if exists "Users can update their own health goals" on public.health_goals;
drop policy if exists "Users can read their own medications" on public.medications;
drop policy if exists "Users can create their own medications" on public.medications;
drop policy if exists "Users can update their own medications" on public.medications;
drop policy if exists "Users can delete their own medications" on public.medications;
drop policy if exists "Users can read their own dose logs" on public.dose_logs;
drop policy if exists "Users can create their own dose logs" on public.dose_logs;
drop policy if exists "Users can update their own dose logs" on public.dose_logs;
drop policy if exists "Users can delete their own dose logs" on public.dose_logs;
drop policy if exists "Users can read their own caregiver invites" on public.caregiver_invites;
drop policy if exists "Users can create their own caregiver invites" on public.caregiver_invites;
drop policy if exists "Caregivers can update patient invites sent to their email" on public.caregiver_invites;
drop policy if exists "Patients can update caregiver requests for them" on public.caregiver_invites;
drop policy if exists "Caregivers can read invites sent to their email" on public.caregiver_invites;
drop policy if exists "Caregivers can read pending patient profiles" on public.profiles;
drop policy if exists "Caregivers can read accepted patient profiles" on public.profiles;
drop policy if exists "Caregivers can read accepted patient medications" on public.medications;
drop policy if exists "Caregivers can create accepted patient medications" on public.medications;
drop policy if exists "Caregivers can update accepted patient medications" on public.medications;
drop policy if exists "Caregivers can delete accepted patient medications" on public.medications;
drop policy if exists "Caregivers can read accepted patient dose logs" on public.dose_logs;
drop policy if exists "Caregivers can read accepted patient devices" on public.devices;
drop policy if exists "Caregivers can read accepted patient device slots" on public.device_slots;
drop policy if exists "Caregivers can read accepted patient device readings" on public.device_readings;
drop policy if exists "Users can read their own devices" on public.devices;
drop policy if exists "Users can create their own devices" on public.devices;
drop policy if exists "Users can update their own devices" on public.devices;
drop policy if exists "Users can read their own device slots" on public.device_slots;
drop policy if exists "Users can create their own device slots" on public.device_slots;
drop policy if exists "Users can update their own device slots" on public.device_slots;
drop policy if exists "Users can read their own device readings" on public.device_readings;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Caregivers can read accepted patient profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.caregiver_invites ci
      where ci.patient_id = profiles.id
        and ci.status = 'accepted'
        and lower(ci.caregiver_email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "Caregivers can read pending patient profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.caregiver_invites ci
      where ci.patient_id = profiles.id
        and ci.status = 'pending'
        and lower(ci.caregiver_email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can read their own health goals"
  on public.health_goals for select
  using (auth.uid() = user_id);

create policy "Users can create their own health goals"
  on public.health_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own health goals"
  on public.health_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read their own medications"
  on public.medications for select
  using (auth.uid() = user_id);

create policy "Caregivers can read accepted patient medications"
  on public.medications for select
  using (
    exists (
      select 1
      from public.caregiver_invites ci
      where ci.patient_id = medications.user_id
        and ci.status = 'accepted'
        and lower(ci.caregiver_email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "Caregivers can create accepted patient medications"
  on public.medications for insert
  with check (
    exists (
      select 1
      from public.caregiver_invites ci
      where ci.patient_id = medications.user_id
        and ci.status = 'accepted'
        and lower(ci.caregiver_email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "Caregivers can update accepted patient medications"
  on public.medications for update
  using (
    exists (
      select 1
      from public.caregiver_invites ci
      where ci.patient_id = medications.user_id
        and ci.status = 'accepted'
        and lower(ci.caregiver_email) = lower(auth.jwt() ->> 'email')
    )
  )
  with check (
    exists (
      select 1
      from public.caregiver_invites ci
      where ci.patient_id = medications.user_id
        and ci.status = 'accepted'
        and lower(ci.caregiver_email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "Caregivers can delete accepted patient medications"
  on public.medications for delete
  using (
    exists (
      select 1
      from public.caregiver_invites ci
      where ci.patient_id = medications.user_id
        and ci.status = 'accepted'
        and lower(ci.caregiver_email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "Users can create their own medications"
  on public.medications for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own medications"
  on public.medications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own medications"
  on public.medications for delete
  using (auth.uid() = user_id);

create policy "Users can read their own dose logs"
  on public.dose_logs for select
  using (auth.uid() = user_id);

create policy "Caregivers can read accepted patient dose logs"
  on public.dose_logs for select
  using (
    exists (
      select 1
      from public.caregiver_invites ci
      where ci.patient_id = dose_logs.user_id
        and ci.status = 'accepted'
        and lower(ci.caregiver_email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "Users can create their own dose logs"
  on public.dose_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own dose logs"
  on public.dose_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own dose logs"
  on public.dose_logs for delete
  using (auth.uid() = user_id);

create policy "Users can read their own caregiver invites"
  on public.caregiver_invites for select
  using (auth.uid() = patient_id);

create policy "Caregivers can read invites sent to their email"
  on public.caregiver_invites for select
  using (lower(caregiver_email) = lower(auth.jwt() ->> 'email'));

create policy "Users can create their own caregiver invites"
  on public.caregiver_invites for insert
  with check (auth.uid() = patient_id and requested_by = 'patient');

create policy "Caregivers can update patient invites sent to their email"
  on public.caregiver_invites for update
  using (
    requested_by = 'patient'
    and lower(caregiver_email) = lower(auth.jwt() ->> 'email')
  )
  with check (
    requested_by = 'patient'
    and lower(caregiver_email) = lower(auth.jwt() ->> 'email')
    and status in ('accepted', 'declined')
  );

create policy "Patients can update caregiver requests for them"
  on public.caregiver_invites for update
  using (
    requested_by = 'caregiver'
    and auth.uid() = patient_id
  )
  with check (
    requested_by = 'caregiver'
    and auth.uid() = patient_id
    and status in ('accepted', 'declined')
  );

create policy "Users can read their own devices"
  on public.devices for select
  using (auth.uid() = user_id);

create policy "Caregivers can read accepted patient devices"
  on public.devices for select
  using (
    exists (
      select 1
      from public.caregiver_invites ci
      where ci.patient_id = devices.user_id
        and ci.status = 'accepted'
        and lower(ci.caregiver_email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "Users can create their own devices"
  on public.devices for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own devices"
  on public.devices for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read their own device slots"
  on public.device_slots for select
  using (auth.uid() = user_id);

create policy "Caregivers can read accepted patient device slots"
  on public.device_slots for select
  using (
    exists (
      select 1
      from public.caregiver_invites ci
      where ci.patient_id = device_slots.user_id
        and ci.status = 'accepted'
        and lower(ci.caregiver_email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "Users can create their own device slots"
  on public.device_slots for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own device slots"
  on public.device_slots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read their own device readings"
  on public.device_readings for select
  using (auth.uid() = user_id);

create policy "Caregivers can read accepted patient device readings"
  on public.device_readings for select
  using (
    exists (
      select 1
      from public.caregiver_invites ci
      where ci.patient_id = device_readings.user_id
        and ci.status = 'accepted'
        and lower(ci.caregiver_email) = lower(auth.jwt() ->> 'email')
    )
  );
