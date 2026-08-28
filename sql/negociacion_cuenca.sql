-- Innovación: negociación peer-to-peer entre agentes de parcela de la misma
-- cuenca + soporte opcional de actuador físico.
-- Correr una vez en el SQL Editor de Supabase.

-- ── Resultado de cada ronda de negociación (una fila por cuenca por corrida) ──
create table if not exists "NegociacionCuenca" (
  id uuid primary key default gen_random_uuid(),
  cuenca text not null,
  ronda_at timestamptz not null default now(),
  capacidad_lmin numeric,
  demanda_total_lmin numeric,
  acuerdo text,                 -- resumen en lenguaje natural
  transcripcion jsonb,          -- [{agente, ronda, mensaje}]
  resultado jsonb               -- [{user_id, deseado_pct, asignado_pct, credito, justificacion}]
);
alter table "NegociacionCuenca" enable row level security;
-- lectura vía RPC SECURITY DEFINER (abajo); sin política de SELECT directo.

-- ── Memoria de equidad: crédito de agua acumulado por parcela y cuenca ──
-- credito > 0  => la parcela cedió agua y "se le debe" prioridad
-- credito < 0  => la parcela recibió de más y debe ceder antes la próxima vez
create table if not exists "EquidadCuenca" (
  user_id uuid not null,
  cuenca text not null,
  credito numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, cuenca)
);
alter table "EquidadCuenca" enable row level security;
create policy "cada quien ve su propia equidad" on "EquidadCuenca"
  for select using (auth.uid() = user_id);

-- ── Config de actuador físico por parcela (opcional) ──
create table if not exists "ParcelaConfig" (
  user_id uuid primary key references auth.users(id),
  tiene_actuador boolean not null default false,
  actuador_url text,
  actuador_token text,
  updated_at timestamptz not null default now()
);
alter table "ParcelaConfig" enable row level security;
create policy "cada quien gestiona su propia config" on "ParcelaConfig"
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── RPC: última negociación de la cuenca del usuario ──
create or replace function public.negociacion_cuenca_ultima()
returns table (
  cuenca text,
  ronda_at timestamptz,
  capacidad_lmin numeric,
  demanda_total_lmin numeric,
  acuerdo text,
  transcripcion jsonb,
  resultado jsonb,
  mi_credito numeric
)
language sql
security definer
set search_path = public
as $$
  with mi_cuenca as (
    select distinct on (user_id) cuenca
    from "RedParcelas"
    where user_id = auth.uid()
    order by user_id, created_at desc
  )
  select
    n.cuenca, n.ronda_at, n.capacidad_lmin, n.demanda_total_lmin,
    n.acuerdo, n.transcripcion, n.resultado,
    coalesce((select credito from "EquidadCuenca" e
              where e.user_id = auth.uid() and e.cuenca = n.cuenca), 0)
  from "NegociacionCuenca" n
  where n.cuenca in (select cuenca from mi_cuenca)
  order by n.ronda_at desc
  limit 1;
$$;
grant execute on function public.negociacion_cuenca_ultima() to anon, authenticated;
