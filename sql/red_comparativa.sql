-- Innovación: comparación entre parcelas de la misma cuenca.
-- RLS en "RedParcelas" sólo deja ver las filas propias (auth.uid() = user_id),
-- así que la comparación con vecinos NO se puede hacer con un SELECT del cliente.
-- Esta función SECURITY DEFINER agrega los datos del lado del servidor y sólo
-- devuelve promedios (nunca filas individuales de otros usuarios).
--
-- Correr una vez en el SQL Editor de Supabase.

create or replace function public.red_comparativa()
returns table (
  cuenca text,
  parcelas_vecinas int,
  apertura_promedio_vecinos numeric,
  humedad_promedio_vecinos numeric,
  apertura_propia numeric,
  humedad_propia numeric
)
language sql
security definer
set search_path = public
as $$
  with mi_ultima as (
    select distinct on (user_id)
      user_id, cuenca, porcentaje_apertura_deseado, humedad_suelo_pct, created_at
    from "RedParcelas"
    where user_id = auth.uid()
    order by user_id, created_at desc
  ),
  ultima_por_user as (
    select distinct on (r.user_id)
      r.user_id, r.cuenca, r.porcentaje_apertura_deseado, r.humedad_suelo_pct
    from "RedParcelas" r
    where r.cuenca in (select cuenca from mi_ultima)
      and r.created_at > now() - interval '30 days'
    order by r.user_id, r.created_at desc
  )
  select
    m.cuenca,
    (select count(*) from ultima_por_user u
       where u.cuenca = m.cuenca and u.user_id <> auth.uid())::int,
    (select round(avg(u.porcentaje_apertura_deseado), 0) from ultima_por_user u
       where u.cuenca = m.cuenca and u.user_id <> auth.uid()),
    (select round(avg(u.humedad_suelo_pct), 0) from ultima_por_user u
       where u.cuenca = m.cuenca and u.user_id <> auth.uid()),
    m.porcentaje_apertura_deseado,
    m.humedad_suelo_pct
  from mi_ultima m;
$$;

grant execute on function public.red_comparativa() to anon, authenticated;
