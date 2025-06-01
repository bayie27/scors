-- Create venues table
create table if not exists public.venue (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  name text not null,
  description text,
  status text not null default 'available'::text,
  capacity integer,
  type text not null,
  amenities text[] default '{}'::text[],
  image_url text,
  constraint venue_pkey primary key (id)
) tablespace pg_default;

-- Add row-level security
alter table public.venue enable row level security;

-- Create policies for row-level security
create policy "Enable read access for all users"
on public.venue for select
using (true);

create policy "Enable insert for authenticated users only"
on public.venue for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users only"
on public.venue for update
to authenticated
using (true)
with check (true);

create policy "Enable delete for authenticated users only"
on public.venue for delete
to authenticated
using (true);

-- Create a trigger to update the updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger handle_venue_updated_at
before update on public.venue
for each row
execute function public.handle_updated_at();

-- Add comments for the table and columns
comment on table public.venue is 'Stores information about venues available for reservation.';
comment on column public.venue.id is 'Unique identifier for the venue.';
comment on column public.venue.created_at is 'Timestamp when the venue was created.';
comment on column public.venue.updated_at is 'Timestamp when the venue was last updated.';
comment on column public.venue.name is 'Name of the venue.';
comment on column public.venue.description is 'Description of the venue.';
comment on column public.venue.status is 'Current status of the venue (available, reserved, maintenance).';
comment on column public.venue.capacity is 'Maximum capacity of the venue.';
comment on column public.venue.type is 'Type of venue (e.g., Indoor, Outdoor, Hall, Court).';
comment on column public.venue.amenities is 'Array of available amenities at the venue.';
comment on column public.venue.image_url is 'URL of the venue image.';
