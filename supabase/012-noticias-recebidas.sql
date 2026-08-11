-- WikiPong · Migração 012 — a fila de notícias que chegam sozinhas
-- ---------------------------------------------------------------------------
-- Rodar depois da 011, no SQL Editor. Idempotente.
--
-- A COLETA é automática; a PUBLICAÇÃO não é, e a separação é o ponto.
--
-- Um robô consegue trazer com precisão o que é FATO: título, endereço, data e
-- fonte. O que ele não consegue é escrever o `resumo` das notícias que já estão
-- no site — aquele "Calderano falou do que segurou a virada: foco com o corpo
-- cansado de jogar duas competições no mesmo dia" é texto lido e escrito, não
-- recortado. Robô nenhum produz isso, e copiar o resumo da fonte seria o mesmo
-- erro que encheu a colheita da GEWO de "Cancel - - Free US Shipping".
--
-- Então a notícia chega pendente e fica invisível até alguém escrever o resumo e
-- aprovar, na tela de moderação. O fundador deixa de pedir "busca as notícias" e
-- continua decidindo o que entra.

create table if not exists public.noticias_recebidas (
  id           uuid primary key default gen_random_uuid(),
  titulo       text        not null check (char_length(trim(titulo)) >= 10),
  url          text        not null unique,
  fonte        text        not null,
  publicado_em date        not null,
  -- Escrito na moderação, por gente. Nasce nulo de propósito: notícia sem resumo
  -- não deve ir ao ar, e a tela usa isto para saber o que ainda falta.
  resumo       text        check (resumo is null or char_length(trim(resumo)) >= 40),
  tag          text,
  colhido_em   timestamptz not null default now(),
  status       text        not null default 'pendente'
                           check (status in ('pendente', 'aprovada', 'descartada'))
);

-- `url` é UNIQUE e é isso que torna o robô idempotente: ele pode rodar de hora em
-- hora que a mesma notícia entra uma vez só. Sem isso, cada execução duplicaria a
-- fila inteira.
create index if not exists noticias_recebidas_publicas
  on public.noticias_recebidas (status, publicado_em desc);

alter table public.noticias_recebidas enable row level security;

-- ───────────────────────── Leitura ─────────────────────────
-- Uma política por papel, como a 007 ensinou: política sem `to` vale para o anon
-- e vira 401 numa tabela que devia ser pública.
drop policy if exists "leitura publica de noticias" on public.noticias_recebidas;
create policy "leitura publica de noticias"
  on public.noticias_recebidas for select to anon
  using (status = 'aprovada' and resumo is not null);

drop policy if exists "leitura de noticias" on public.noticias_recebidas;
create policy "leitura de noticias"
  on public.noticias_recebidas for select to authenticated
  using ((status = 'aprovada' and resumo is not null) or public.eh_admin());

-- ───────────────────────── Escrita ─────────────────────────
-- NINGUÉM insere pelo site. Nem anon, nem logado, nem admin pela chave pública:
-- quem alimenta esta tabela é a rotina do GitHub, com a chave de serviço, que
-- passa por cima do RLS por ser do servidor. Sem política de insert, a chave
-- anônima que vai no bundle não consegue despejar notícia falsa na sua fila.
drop policy if exists "qualquer um insere noticia" on public.noticias_recebidas;

-- Aprovar e escrever o resumo é trabalho de admin.
drop policy if exists "admin cuida das noticias" on public.noticias_recebidas;
create policy "admin cuida das noticias"
  on public.noticias_recebidas for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- A fila da 001 ganha o quinto braço.
create or replace view public.fila_moderacao
  with (security_invoker = on)
  as
  select 'avaliacao' as tipo, id, autor, criado_em, texto from public.avaliacoes where status = 'pendente'
  union all
  select 'topico', id, autor, criado_em, titulo from public.topicos where status = 'pendente'
  union all
  select 'resposta', id, autor, criado_em, texto from public.respostas where status = 'pendente'
  union all
  select 'pedido-de-pauta', id, autor, criado_em, tema from public.pedidos_de_pauta where status = 'pendente'
  union all
  select 'noticia', id, fonte, colhido_em, titulo from public.noticias_recebidas where status = 'pendente'
  order by criado_em;

-- ═══════════════════════════════════════════════════════════════════════════
-- A CHAVE DE SERVIÇO
-- ═══════════════════════════════════════════════════════════════════════════
--
-- No painel do Supabase: Project Settings → API → `service_role`. Ela passa por
-- cima do RLS, então NÃO vai no site nem no repositório — vai só nos segredos do
-- GitHub (Settings → Secrets and variables → Actions), com o nome
-- SUPABASE_SERVICE_KEY. A URL do projeto vai em SUPABASE_URL.
--
-- Se essa chave vazar, quem a tiver escreve em qualquer tabela do banco. É por
-- isso que ela mora lá e não aqui.
