-- WikiPong · Migração 009 — pedidos de pauta do /aprender
-- ---------------------------------------------------------------------------
-- Rodar depois da 008, no SQL Editor. Idempotente.
--
-- O leitor diz o tema que quer aprender; o guia nasce daí. É a única tabela do
-- projeto em que o conteúdo do site é PEDIDO por quem lê, e não colhido.
--
-- O QUE ESTE SCHEMA DECIDE, e que não é detalhe de banco:
--
--  · `guia_slug` é o desfecho do pedido, e só o fundador o preenche. A política
--    de insert recusa qualquer valor nele — senão bastaria montar a requisição
--    na mão para carimbar o próprio pedido como atendido, apontando para um guia
--    que ninguém escreveu.
--
--  · `status` com DEFAULT 'pendente', como em toda escrita do site. A lista
--    pública é a dos pedidos lidos; não há como despejar texto na página de
--    Aprender de um site que fala de equipamento.
--
--  · NENHUMA coluna de contagem de "também quero". Agregado é sempre derivado
--    (mesma regra do D-11), e voto sem login é voto que a mesma pessoa dá dez
--    vezes. O sinal de "muita gente quer isto" vem de ler os pedidos parecidos,
--    que é o que a tela mostra antes de alguém enviar mais um.

create table if not exists public.pedidos_de_pauta (
  id         uuid primary key default gen_random_uuid(),
  tema       text        not null check (char_length(trim(tema)) between 10 and 160),
  detalhe    text        check (detalhe is null or char_length(trim(detalhe)) <= 800),
  autor      text        not null check (char_length(trim(autor)) >= 2),
  usuario_id uuid        references auth.users (id) on delete set null,
  -- Slug de guia, não FK: os guias moram em app/aprender/guias.ts, versionado
  -- no repo (D-17), não no banco. Guardar o slug e resolver na UI mantém as
  -- duas metades soltas — mesma escolha do equipamento no perfil.
  guia_slug  text,
  criado_em  timestamptz not null default now(),
  status     text        not null default 'pendente'
                         check (status in ('pendente', 'aprovado', 'removido'))
);

-- A consulta que a página de Aprender faz a cada visita.
create index if not exists pedidos_de_pauta_publicos
  on public.pedidos_de_pauta (status, criado_em desc);

alter table public.pedidos_de_pauta enable row level security;

-- ───────────────────────── Leitura ─────────────────────────
-- UMA POLÍTICA POR PAPEL, e não uma sem cláusula `to`. Foi exatamente esse
-- descuido que a 007 teve de consertar: política sem `to` vale para todos os
-- papéis, inclusive o `anon`, que não pode executar `eh_admin()` — e o
-- PostgREST devolve isso como 401 numa tabela que era pra ser pública.
drop policy if exists "leitura publica de pedidos" on public.pedidos_de_pauta;
create policy "leitura publica de pedidos"
  on public.pedidos_de_pauta for select to anon
  using (status = 'aprovado');

drop policy if exists "leitura de pedidos" on public.pedidos_de_pauta;
create policy "leitura de pedidos"
  on public.pedidos_de_pauta for select to authenticated
  using (
    status = 'aprovado'
    or usuario_id = (select auth.uid())
    or public.eh_admin()
  );

-- ───────────────────────── Escrita ─────────────────────────
-- Sem login, como o resto do site: quem segura o portão é a moderação. O
-- `status = 'pendente'` impede publicar já aprovado, e o `guia_slug is null`
-- impede alguém se declarar atendido.
drop policy if exists "qualquer um pede pauta, sempre pendente" on public.pedidos_de_pauta;
create policy "qualquer um pede pauta, sempre pendente"
  on public.pedidos_de_pauta for insert to anon, authenticated
  with check (status = 'pendente' and guia_slug is null);

-- Aprovar um pedido e amarrá-lo ao guia que nasceu dele é trabalho de admin.
drop policy if exists "admin cuida dos pedidos" on public.pedidos_de_pauta;
create policy "admin cuida dos pedidos"
  on public.pedidos_de_pauta for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- ───────────────────────── Fila de moderação ─────────────────────────
-- A view da 001 ganha o quarto braço. `security_invoker` continua ligado: sem
-- ele a view leria as tabelas IGNORANDO o RLS, e qualquer visitante com a chave
-- anônima veria tudo o que está pendente. Foi o buraco que a primeira versão da
-- 001 tinha.
create or replace view public.fila_moderacao
  with (security_invoker = on)
  as
  select 'avaliacao' as tipo, id, autor, criado_em, texto from public.avaliacoes
    where status = 'pendente'
  union all
  select 'topico', id, autor, criado_em, titulo from public.topicos
    where status = 'pendente'
  union all
  select 'resposta', id, autor, criado_em, texto from public.respostas
    where status = 'pendente'
  union all
  select 'pedido-de-pauta', id, autor, criado_em, tema from public.pedidos_de_pauta
    where status = 'pendente'
  order by criado_em;

-- ═══════════════════════════════════════════════════════════════════════════
-- COMO ATENDER UM PEDIDO
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Depois de escrever o guia em app/aprender/guias.ts, amarre o pedido a ele:
--
--   update public.pedidos_de_pauta
--      set guia_slug = 'dureza-de-esponja', status = 'aprovado'
--    where id = '...';
--
-- A partir daí o pedido aparece na lista com o link para o guia, e quem pediu
-- vê que pedir adiantou. Um pedido atendido em silêncio ensina o contrário.
--
-- COMO CONFERIR QUE FUNCIONOU: abrir /aprender EM ABA ANÔNIMA. Um pedido
-- aprovado tem de aparecer. Se der 401 em vez de lista vazia, o problema é
-- permissão, não RLS — é o diagnóstico que a 007 documenta.
