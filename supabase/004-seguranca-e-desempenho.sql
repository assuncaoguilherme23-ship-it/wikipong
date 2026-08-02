-- WikiPong · Migração 004 — o aviso de segurança da eh_admin, e o desempenho do RLS
-- ---------------------------------------------------------------------------
-- Rodar depois da 003. Idempotente.
--
-- Duas coisas que o verificador do Supabase apontou. A primeira é segurança e
-- é minha; a segunda é velocidade e vale arrumar antes de o banco crescer.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. A eh_admin() não precisava ser SECURITY DEFINER
-- ═══════════════════════════════════════════════════════════════════════════
--
-- O painel avisou que ela é executável por `anon` e por `authenticated` via
-- /rest/v1/rpc/eh_admin, rodando com os privilégios de quem a criou.
--
-- O CONSTRANGEDOR É QUE EU JÁ SABIA. O comentário que escrevi na migração 002
-- dizia, com todas as letras, que sem o SECURITY DEFINER a função "só
-- enxergaria a linha de quem está perguntando e daria no mesmo" — e eu botei o
-- SECURITY DEFINER assim mesmo. Era desnecessário pela minha própria análise.
--
-- Por que dava no mesmo: a função pergunta se QUEM CHAMA é admin, usando
-- auth.uid(). A política da tabela `admins` já devolve exatamente a linha de
-- quem pergunta. Rodar como dono ou como chamador dá a mesma resposta.
--
-- O que muda ao consertar: a função deixa de ser um ponto de elevação de
-- privilégio exposto na API, e o `anon` perde o direito de chamá-la — nenhuma
-- política de admin é `to anon`, então ele nunca precisou.

create or replace function public.eh_admin()
returns boolean
language sql
stable
security invoker           -- era DEFINER; ver acima
set search_path = public
as $$
  select exists (select 1 from public.admins where usuario_id = (select auth.uid()));
$$;

revoke execute on function public.eh_admin() from anon;
grant execute on function public.eh_admin() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. auth.uid() era reavaliado LINHA A LINHA
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Escrito solto numa política, `auth.uid()` é chamado uma vez POR LINHA
-- examinada. Envolvido em subconsulta — `(select auth.uid())` — o Postgres
-- calcula uma vez e reaproveita.
--
-- Com uma avaliação no banco ninguém percebe. Com dez mil, é a diferença entre
-- uma consulta e dez mil chamadas de função.

drop policy if exists "vejo se eu sou admin" on public.admins;
create policy "vejo se eu sou admin"
  on public.admins for select to authenticated
  using (usuario_id = (select auth.uid()));

drop policy if exists "vejo a minha avaliacao mesmo pendente" on public.avaliacoes;
create policy "vejo a minha avaliacao mesmo pendente"
  on public.avaliacoes for select to authenticated
  using (usuario_id = (select auth.uid()));

drop policy if exists "edito a minha avaliacao" on public.avaliacoes;
create policy "edito a minha avaliacao"
  on public.avaliacoes for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()) and status = 'pendente');

drop policy if exists "apago a minha avaliacao" on public.avaliacoes;
create policy "apago a minha avaliacao"
  on public.avaliacoes for delete to authenticated
  using (usuario_id = (select auth.uid()));

drop policy if exists "logado assina o que escreve" on public.avaliacoes;
create policy "logado assina o que escreve"
  on public.avaliacoes for insert to authenticated
  with check (status = 'pendente'
              and (usuario_id is null or usuario_id = (select auth.uid())));

drop policy if exists "vejo o meu topico mesmo pendente" on public.topicos;
create policy "vejo o meu topico mesmo pendente"
  on public.topicos for select to authenticated
  using (usuario_id = (select auth.uid()));

drop policy if exists "vejo a minha resposta mesmo pendente" on public.respostas;
create policy "vejo a minha resposta mesmo pendente"
  on public.respostas for select to authenticated
  using (usuario_id = (select auth.uid()));

drop policy if exists "perfil e' do dono" on public.perfis;
create policy "perfil e' do dono"
  on public.perfis for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Políticas de leitura duplicadas
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cada tabela tinha DUAS políticas de SELECT: uma para o público ("só o que
-- está aprovado") e outra para o dono ou o admin. O Postgres precisa avaliar as
-- duas e unir o resultado, em toda consulta.
--
-- Juntando numa só, ele avalia uma expressão. A regra continua idêntica:
-- aprovado é público; o seu, você vê mesmo pendente; admin vê tudo.

drop policy if exists "avaliacoes aprovadas sao publicas" on public.avaliacoes;
drop policy if exists "admin ve tudo em avaliacoes" on public.avaliacoes;
drop policy if exists "vejo a minha avaliacao mesmo pendente" on public.avaliacoes;
create policy "leitura de avaliacoes"
  on public.avaliacoes for select
  using (
    status = 'aprovado'
    or usuario_id = (select auth.uid())
    or public.eh_admin()
  );

drop policy if exists "topicos aprovados sao publicos" on public.topicos;
drop policy if exists "admin ve tudo em topicos" on public.topicos;
drop policy if exists "vejo o meu topico mesmo pendente" on public.topicos;
create policy "leitura de topicos"
  on public.topicos for select
  using (
    status = 'aprovado'
    or usuario_id = (select auth.uid())
    or public.eh_admin()
  );

drop policy if exists "respostas aprovadas sao publicas" on public.respostas;
drop policy if exists "admin ve tudo em respostas" on public.respostas;
drop policy if exists "vejo a minha resposta mesmo pendente" on public.respostas;
create policy "leitura de respostas"
  on public.respostas for select
  using (
    status = 'aprovado'
    or usuario_id = (select auth.uid())
    or public.eh_admin()
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. A OUTRA FUNÇÃO DO AVISO NÃO É MINHA
-- ═══════════════════════════════════════════════════════════════════════════
--
-- O painel também acusou `public.rls_auto_enable()`. Ela NÃO existe em nenhuma
-- das migrações deste repositório — nem a 001, nem a 002, nem a 003 a criam.
-- Veio de outro lugar: um template do painel, um assistente, ou algo colado no
-- SQL Editor.
--
-- NÃO MEXO no que não escrevi e não sei o que faz. Para descobrir, rode:
--
--   select prosrc, prosecdef, proacl
--     from pg_proc
--    where proname = 'rls_auto_enable';
--
-- `prosrc` é o corpo dela. Se for coisa que você não reconhece e não usa,
-- o mais seguro é apagar:
--
--   drop function if exists public.rls_auto_enable();
--
-- Se for algo que você quer manter, o mesmo tratamento da eh_admin resolve o
-- aviso:
--
--   revoke execute on function public.rls_auto_enable() from anon, authenticated;
--
-- O nome sugere que ela LIGA RLS automaticamente em tabelas. Se for isso e
-- estiver exposta na API, qualquer visitante poderia chamá-la — daí a
-- gravidade do aviso ser maior que a da eh_admin.
