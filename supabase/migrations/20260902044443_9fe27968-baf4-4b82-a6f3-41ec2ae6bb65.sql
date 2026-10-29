create or replace function public.get_leaderboard()
returns table (
  user_id uuid,
  nombre text,
  tool_id uuid,
  vistos bigint,
  dominados bigint,
  xp bigint
)
language sql
security definer
set search_path = ''
as $fn$
  select
    p.user_id,
    pr.nombre,
    e.tool_id,
    count(*) as vistos,
    count(*) filter (where p.estado = 'dominado') as dominados,
    sum(
      case p.estado
        when 'dominado' then 12
        when 'repaso_3' then 8
        when 'repaso_2' then 6
        when 'repaso_1' then 4
        else 2
      end
    ) as xp
  from public.progress p
  join public.exercises e on e.id = p.exercise_id
  left join public.profiles pr on pr.id = p.user_id
  group by p.user_id, pr.nombre, e.tool_id;
$fn$;

revoke execute on function public.get_leaderboard() from public;
grant execute on function public.get_leaderboard() to authenticated;