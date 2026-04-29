-- ============================================================
-- Initial schema for Off-Market Property Letter Service
-- ============================================================

-- Trigger function: auto-update updated_at on row changes
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- letter_templates
-- ============================================================
create table letter_templates (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  body        text not null,
  variables   jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger letter_templates_updated_at
  before update on letter_templates
  for each row execute function set_updated_at();

-- RLS: templates are public read, admin write
alter table letter_templates enable row level security;
create policy "anyone can read templates"
  on letter_templates for select using (true);

-- Seed the one MVP template
insert into letter_templates (slug, label, body, variables) values (
  'friendly-home-mover',
  'Friendly home mover',
  'A warm, personal letter from a home mover to a homeowner.',
  '["senderName", "senderAddress", "personalMessage"]'
);

-- ============================================================
-- orders
-- ============================================================
create table orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users on delete set null,
  status              text not null default 'pending'
                        check (status in ('pending', 'paid', 'dispatched', 'failed')),
  letter_template_id  uuid references letter_templates,
  letter_content      jsonb not null default '{}',
  letter_count        int not null check (letter_count > 0 and letter_count <= 50),
  total_pence         int not null check (total_pence > 0),
  stripe_session_id   text,
  stripe_payment_intent_id text,
  stannp_job_id       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

alter table orders enable row level security;
-- Authenticated users see only their own orders
create policy "users see own orders"
  on orders for select
  using (auth.uid() = user_id);
create policy "users insert own orders"
  on orders for insert
  with check (auth.uid() = user_id);
-- Service role (backend) can update any order
create policy "service role can update orders"
  on orders for update
  using (auth.role() = 'service_role');

-- ============================================================
-- order_addresses
-- ============================================================
create table order_addresses (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders on delete cascade,
  display_address  text not null,
  street_address   text not null,
  postcode         text,
  lat              double precision not null,
  lng              double precision not null,
  created_at       timestamptz not null default now()
);

alter table order_addresses enable row level security;
create policy "users see own order addresses"
  on order_addresses for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_addresses.order_id
        and orders.user_id = auth.uid()
    )
  );
create policy "users insert own order addresses"
  on order_addresses for insert
  with check (
    exists (
      select 1 from orders
      where orders.id = order_addresses.order_id
        and orders.user_id = auth.uid()
    )
  );
