-- WikiPong · Migração 002 — administradores e posse do que se escreve
-- ---------------------------------------------------------------------------
-- Rodar DEPOIS de 001-comunidade.sql. Também é idempotente.
--
-- Resolve as duas coisas que a 001 deixou em aberto por não haver login:
--   · quem pode moderar pelo site (e não só pelo painel);
--   · quem é dono do que escreveu, e portanto pode corrigir ou apagar.

-- ───────────────────────── Quem é administrador ─────────────────────────
-- Tabela e não uma coluna `is_admin` no perfil: assim ninguém vira admin
-- editando o próprio registro. Entrar aqui só pelo painel do Supabase.

create table if not exists public.admins (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  criado_em  timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Cada um só enxerga a PRÓPRIA linha. É o suficiente pro site perguntar "eu sou
-- admin?" e não o bastante pra alguém listar quem são os moderadores.
drop policy if exists "vejo se eu sou admin" on public.admins;
create policy "vejo se eu sou admin"
  on public.admins for select to authenticated
  using (usuario_id = auth.uid());

-- Função de conveniência. `security definer` porque ela precisa ler `admins`
-- ignorando a política acima — senão, dentro de outra política, ela só
-- enxergaria a linha de quem está perguntando e daria no mesmo.
create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where usuario_id = auth.uid());
$$;

-- ───────────────────────── Moderar pelo site ─────────────────────────
-- É isto que a tela /comunidade/moderacao espera pra sair do modo "não posso
-- ver a fila": admin passa a LER tudo (inclusive pendente) e a MUDAR o status.

drop policy if exists "admin ve tudo em avaliacoes" on public.avaliacoes;
create policy "admin ve tudo em avaliacoes"
  on public.avaliacoes for select to authenticated using (public.eh_admin());

drop policy if exists "admin modera avaliacoes" on public.avaliacoes;
create policy "admin modera avaliacoes"
  on public.avaliacoes for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "admin ve tudo em topicos" on public.topicos;
create policy "admin ve tudo em topicos"
  on public.topicos for select to authenticated using (public.eh_admin());

drop policy if exists "admin modera topicos" on public.topicos;
create policy "admin modera topicos"
  on public.topicos for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "admin ve tudo em respostas" on public.respostas;
create policy "admin ve tudo em respostas"
  on public.respostas for select to authenticated using (public.eh_admin());

drop policy if exists "admin modera respostas" on public.respostas;
create policy "admin modera respostas"
  on public.respostas for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- ───────────────────────── Posse do que se escreve ─────────────────────────
-- Quem escreveu logado pode ver o próprio texto mesmo pendente (senão parece
-- que o site engoliu), corrigir e apagar. Anônimo segue sem dono: escreveu,
-- entregou.

drop policy if exists "vejo a minha avaliacao mesmo pendente" on public.avaliacoes;
create policy "vejo a minha avaliacao mesmo pendente"
  on public.avaliacoes for select to authenticated using (usuario_id = auth.uid());

-- A edição volta pra fila: texto novo é conteúdo novo e merece um segundo par
-- de olhos. Sem isto, dava pra publicar qualquer coisa aprovando um texto
-- inocente e trocando o corpo depois.
drop policy if exists "edito a minha avaliacao" on public.avaliacoes;
create policy "edito a minha avaliacao"
  on public.avaliacoes for update to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid() and status = 'pendente');

drop policy if exists "apago a minha avaliacao" on public.avaliacoes;
create policy "apago a minha avaliacao"
  on public.avaliacoes for delete to authenticated using (usuario_id = auth.uid());

drop policy if exists "vejo o meu topico mesmo pendente" on public.topicos;
create policy "vejo o meu topico mesmo pendente"
  on public.topicos for select to authenticated using (usuario_id = auth.uid());

drop policy if exists "vejo a minha resposta mesmo pendente" on public.respostas;
create policy "vejo a minha resposta mesmo pendente"
  on public.respostas for select to authenticated using (usuario_id = auth.uid());

-- ───────────────────────── Assinar o que se escreve ─────────────────────────
-- Com login, `usuario_id` passa a ser preenchido — e o índice único da 001
-- (uma avaliação por pessoa por material) começa a valer sozinho.
--
-- A política de INSERT da 001 é permissiva de propósito (anônimo pode escrever).
-- Esta acrescenta a regra pra quem está logado: se mandar usuario_id, tem que
-- ser o seu. Sem isto, dava pra assinar avaliação no nome de outra pessoa.
drop policy if exists "logado assina o que escreve" on public.avaliacoes;
create policy "logado assina o que escreve"
  on public.avaliacoes for insert to authenticated
  with check (status = 'pendente' and (usuario_id is null or usuario_id = auth.uid()));

-- ───────────────────────── Como me tornar admin ─────────────────────────
-- 1. entrar uma vez no site com o seu e-mail (cria a linha em auth.users);
-- 2. rodar isto aqui, trocando pelo seu e-mail:
--
--    insert into public.admins (usuario_id)
--    select id from auth.users where email = 'voce@exemplo.com'
--    on conflict do nothing
--    returning usuario_id;
--
--    O `returning` diz se funcionou: uma linha = gravou, 0 rows = a conta ainda
--    nao existe em auth.users. Sem ele o painel responde 'Success' nos dois casos.
--
-- 3. recarregar a página de moderação.
