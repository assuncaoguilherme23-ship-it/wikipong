-- WikiPong · 015 · a estante, e a separacao entre fato e prosa
-- ----------------------------------------------------------------------------
-- POR QUE DUAS TABELAS e nao uma coluna a mais: a RLS do Postgres filtra
-- LINHAS, nao colunas. E' a mesma pedra da migracao 010, onde
-- `marcar_resposta_util` virou funcao justamente por isso.
--
-- Com uma tabela so', esconder o motivo pendente sem esconder o material
-- exigiria grant por coluna mais funcoes security definer pro dono e pro admin
-- lerem o que e' deles. Com duas, RLS pura resolve.
--
-- A regra que isso implementa e' o D-14, literalmente: FATO SE PUBLICA SOZINHO,
-- PROSA ESPERA GENTE.

create table if not exists public.estante (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references auth.users (id) on delete cascade,
  -- Id de material, nao FK: o catalogo mora em JSON versionado no repo (D-17).
  material_id text not null,
  de          date,
  ate         date,
  criado_em   timestamptz not null default now(),
  constraint estante_periodo_coerente check (de is null or ate is null or de <= ate)
);

create table if not exists public.estante_motivos (
  estante_id uuid primary key references public.estante (id) on delete cascade,
  -- Desnormalizado de proposito: a politica de leitura precisa dele sem join.
  usuario_id uuid not null references auth.users (id) on delete cascade,
  texto      text not null check (char_length(trim(texto)) between 10 and 280),
  status     text not null default 'pendente'
                  check (status in ('pendente', 'aprovada', 'descartada')),
  criado_em  timestamptz not null default now()
);

create index if not exists estante_por_usuario on public.estante (usuario_id);
create index if not exists estante_motivos_pendentes
  on public.estante_motivos (status) where status = 'pendente';

alter table public.estante         enable row level security;
alter table public.estante_motivos enable row level security;

-- ───────────────────────── RLS ─────────────────────────
-- UMA POLITICA POR PAPEL, sempre com `to` explicito. Politica sem `to` tambem
-- se aplica ao anon e devolve 401 -- foi o que quebrou a leitura publica na 007.

-- A estante e' fato: qualquer um le'.
drop policy if exists "leitura publica da estante" on public.estante;
create policy "leitura publica da estante"
  on public.estante for select to anon using (true);

drop policy if exists "leitura da estante" on public.estante;
create policy "leitura da estante"
  on public.estante for select to authenticated using (true);

drop policy if exists "dono escreve a propria estante" on public.estante;
create policy "dono escreve a propria estante"
  on public.estante for insert to authenticated
  with check (usuario_id = (select auth.uid()));

drop policy if exists "dono atualiza a propria estante" on public.estante;
create policy "dono atualiza a propria estante"
  on public.estante for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

drop policy if exists "dono apaga a propria estante" on public.estante;
create policy "dono apaga a propria estante"
  on public.estante for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- O motivo e' prosa: so' aprovado e' publico.
drop policy if exists "leitura publica de motivo aprovado" on public.estante_motivos;
create policy "leitura publica de motivo aprovado"
  on public.estante_motivos for select to anon
  using (status = 'aprovada');

drop policy if exists "leitura de motivo" on public.estante_motivos;
create policy "leitura de motivo"
  on public.estante_motivos for select to authenticated
  using (status = 'aprovada' or usuario_id = (select auth.uid()) or public.eh_admin());

-- DUAS ARMADILHAS DE COLUNA, evitadas de proposito:
--
-- 1. O `with check` exige status = 'pendente'. Sem essa clausula, o dono
--    publicaria o proprio motivo mandando "status":"aprovada" no corpo do POST,
--    e a fila de moderacao viraria enfeite. A RLS nao consegue dizer "pode
--    mexer nesta coluna mas nao naquela" -- entao a restricao vai no VALOR.
drop policy if exists "dono escreve o proprio motivo" on public.estante_motivos;
create policy "dono escreve o proprio motivo"
  on public.estante_motivos for insert to authenticated
  with check (usuario_id = (select auth.uid()) and status = 'pendente');

-- 2. O dono NAO tem update, so' insert e delete. Editar um motivo e' apagar e
--    escrever outro -- o que de quebra e' o comportamento certo: texto
--    reescrito volta pra fila em vez de herdar a aprovacao do texto velho.
drop policy if exists "dono apaga o proprio motivo" on public.estante_motivos;
create policy "dono apaga o proprio motivo"
  on public.estante_motivos for delete to authenticated
  using (usuario_id = (select auth.uid()));

drop policy if exists "admin modera motivo" on public.estante_motivos;
create policy "admin modera motivo"
  on public.estante_motivos for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());
