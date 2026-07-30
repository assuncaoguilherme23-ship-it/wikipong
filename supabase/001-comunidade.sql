-- WikiPong · Migração 001 — a camada de comunidade (D-11 + emendas do D-19)
-- ---------------------------------------------------------------------------
-- Rodar no SQL Editor do projeto Supabase, de uma vez. É idempotente: pode
-- rodar de novo sem estragar nada.
--
-- As tabelas espelham os tipos de src/logica/*.ts campo a campo, de propósito.
-- Foi por isso que o adaptador existiu desde o primeiro dia: a migração é este
-- arquivo mais a troca de uma linha em repositorio().
--
-- O QUE ESTE SCHEMA DECIDE, e que não é detalhe de banco:
--
--  · `status` com DEFAULT 'pendente'. O D-11 pede PRÉ-moderação enquanto o
--    volume for baixo: o que entra fica invisível até alguém aprovar. O modo
--    local grava direto como 'aprovado' porque lá o segundo par de olhos é o
--    próprio dono do navegador — aqui não é.
--
--  · NENHUM campo de média, contagem ou posição de ranking. Agregado é sempre
--    DERIVADO (D-11), e coluna de média é a porta de entrada pra número que não
--    bate com as avaliações que o geraram.
--
--  · CHECK nos vocabulários (nível, estilo, tempo de uso). São os mesmos três
--    níveis do catálogo e os mesmos três estilos do guia /aprender/estilos-de-jogo.
--    Deixar como texto livre garantiria "Avançado", "avancado" e "AVANÇADO" na
--    mesma coluna em duas semanas.

-- ───────────────────────── Avaliações (D-11) ─────────────────────────

create table if not exists public.avaliacoes (
  id           uuid primary key default gen_random_uuid(),
  material_id  text        not null,
  usuario_id   uuid        references auth.users (id) on delete set null,
  autor        text        not null check (char_length(trim(autor)) >= 2),
  nota         smallint    not null check (nota between 1 and 5),
  texto        text        not null check (char_length(trim(texto)) between 15 and 1500),
  nivel        text        not null check (nivel in ('Iniciante', 'Intermediário', 'Avançado')),
  tempo_de_uso text        not null check (tempo_de_uso in (
                             'menos de 1 mês', '1 a 6 meses',
                             '6 meses a 1 ano', 'mais de 1 ano')),
  estilo       text        not null check (estilo in ('atacante', 'allround', 'defensor')),
  criado_em    timestamptz not null default now(),
  status       text        not null default 'pendente'
                           check (status in ('pendente', 'aprovado', 'removido'))
);

-- Uma avaliação por pessoa por material. Sem isto, quem quiser inflar a nota de
-- um material só precisa apertar "publicar" dez vezes.
create unique index if not exists avaliacoes_uma_por_pessoa
  on public.avaliacoes (material_id, usuario_id)
  where usuario_id is not null;

-- A consulta que a ficha faz a cada visita.
create index if not exists avaliacoes_por_material
  on public.avaliacoes (material_id, status, criado_em desc);

-- ───────────────────────── Discussões (D-19, emenda) ─────────────────────────

create table if not exists public.topicos (
  id          uuid primary key default gen_random_uuid(),
  titulo      text        not null check (char_length(trim(titulo)) >= 8),
  texto       text        not null check (char_length(trim(texto)) >= 20),
  assunto     text        not null check (assunto in
                            ('material', 'montagem', 'tecnica', 'compra', 'geral')),
  material_id text,
  usuario_id  uuid        references auth.users (id) on delete set null,
  autor       text        not null,
  estilo      text        check (estilo in ('atacante', 'allround', 'defensor')),
  nivel       text        check (nivel in ('Iniciante', 'Intermediário', 'Avançado')),
  criado_em   timestamptz not null default now(),
  status      text        not null default 'pendente'
                          check (status in ('pendente', 'aprovado', 'removido'))
);

create index if not exists topicos_por_material on public.topicos (material_id)
  where material_id is not null;

create table if not exists public.respostas (
  id         uuid primary key default gen_random_uuid(),
  topico_id  uuid        not null references public.topicos (id) on delete cascade,
  usuario_id uuid        references auth.users (id) on delete set null,
  autor      text        not null,
  estilo     text        check (estilo in ('atacante', 'allround', 'defensor')),
  nivel      text        check (nivel in ('Iniciante', 'Intermediário', 'Avançado')),
  texto      text        not null check (char_length(trim(texto)) >= 5),
  criado_em  timestamptz not null default now(),
  status     text        not null default 'pendente'
                         check (status in ('pendente', 'aprovado', 'removido'))
);

create index if not exists respostas_por_topico
  on public.respostas (topico_id, status, criado_em);

-- ───────────────────────── Perfil ─────────────────────────

create table if not exists public.perfis (
  usuario_id     uuid primary key references auth.users (id) on delete cascade,
  nome           text not null check (char_length(trim(nome)) >= 2),
  estilo         text check (estilo in ('atacante', 'allround', 'defensor')),
  nivel          text check (nivel in ('Iniciante', 'Intermediário', 'Avançado')),
  -- Ids de material, não FK: o catálogo mora em JSON versionado no repo (D-17),
  -- não no banco. Guardar o id e resolver na UI mantém as duas metades soltas.
  equip_lamina   text,
  equip_fh       text,
  equip_bh       text,
  atualizado_em  timestamptz not null default now()
);

-- ───────────────────────── RLS ─────────────────────────
-- Sem isto a anon key lê e escreve tudo, inclusive o que está pendente de
-- moderação. O site é estático: a chave anônima VAI estar no bundle, à vista de
-- qualquer um. A segurança tem que morar aqui, não no cliente.

alter table public.avaliacoes enable row level security;
alter table public.topicos    enable row level security;
alter table public.respostas  enable row level security;
alter table public.perfis     enable row level security;

-- Leitura pública: só o que passou pela moderação.
drop policy if exists "avaliacoes aprovadas sao publicas" on public.avaliacoes;
create policy "avaliacoes aprovadas sao publicas"
  on public.avaliacoes for select using (status = 'aprovado');

drop policy if exists "topicos aprovados sao publicos" on public.topicos;
create policy "topicos aprovados sao publicos"
  on public.topicos for select using (status = 'aprovado');

drop policy if exists "respostas aprovadas sao publicas" on public.respostas;
create policy "respostas aprovadas sao publicas"
  on public.respostas for select using (status = 'aprovado');

-- Escrita: só logado, só no próprio nome, e nunca escolhendo o próprio status.
-- O `status = 'pendente'` no WITH CHECK é o que impede alguém de publicar já
-- aprovado montando a requisição na mão.
drop policy if exists "logado cria a propria avaliacao" on public.avaliacoes;
create policy "logado cria a propria avaliacao"
  on public.avaliacoes for insert to authenticated
  with check (usuario_id = auth.uid() and status = 'pendente');

drop policy if exists "logado cria o proprio topico" on public.topicos;
create policy "logado cria o proprio topico"
  on public.topicos for insert to authenticated
  with check (usuario_id = auth.uid() and status = 'pendente');

drop policy if exists "logado cria a propria resposta" on public.respostas;
create policy "logado cria a propria resposta"
  on public.respostas for insert to authenticated
  with check (usuario_id = auth.uid() and status = 'pendente');

-- Cada pessoa vê e edita o próprio perfil.
drop policy if exists "perfil e' do dono" on public.perfis;
create policy "perfil e' do dono"
  on public.perfis for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Perfil de quem escreveu é público em leitura: é ele que dá a tag de estilo no
-- comentário, e uma tag que só o dono enxerga não serve pra nada.
drop policy if exists "perfil e' publico em leitura" on public.perfis;
create policy "perfil e' publico em leitura"
  on public.perfis for select using (true);

-- ───────────────────────── Moderação ─────────────────────────
-- A fila do D-11: o que está esperando um par de olhos, mais antigo primeiro.
-- É view e não tabela porque não há estado novo aqui, só um recorte.
create or replace view public.fila_moderacao as
  select 'avaliacao' as tipo, id, autor, criado_em, texto from public.avaliacoes
    where status = 'pendente'
  union all
  select 'topico', id, autor, criado_em, titulo from public.topicos
    where status = 'pendente'
  union all
  select 'resposta', id, autor, criado_em, texto from public.respostas
    where status = 'pendente'
  order by criado_em;
