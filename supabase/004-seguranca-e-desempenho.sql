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

-- REVOGAR DO PUBLIC PRIMEIRO. Toda função no PostgreSQL nasce com EXECUTE
-- concedido a PUBLIC, o pseudo-papel que todos herdam. Tirar de `anon` sem
-- tirar do PUBLIC não muda nada — ele continua podendo executar pela herança.
revoke execute on function public.eh_admin() from public;
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

drop policy if exists "edito a minha avaliacao" on public.avaliacoes;
create policy "edito a minha avaliacao"
  on public.avaliacoes for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()) and status = 'pendente');

drop policy if exists "apago a minha avaliacao" on public.avaliacoes;
create policy "apago a minha avaliacao"
  on public.avaliacoes for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- As políticas de SELECT não aparecem aqui: elas são refeitas inteiras na
-- seção 3, que junta as duplicadas. Recriá-las aqui só para apagá-las três
-- linhas depois confundiria quem lê.
drop policy if exists "logado assina o que escreve" on public.avaliacoes;
create policy "logado assina o que escreve"
  on public.avaliacoes for insert to authenticated
  with check (status = 'pendente'
              and (usuario_id is null or usuario_id = (select auth.uid())));

-- (a `perfis` é tratada na seção 3, que separa leitura de escrita)

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

-- O `drop` da política NOVA precisa vir junto: sem ele, rodar este arquivo duas
-- vezes falha com "policy already exists" — que foi exatamente o que aconteceu
-- na primeira tentativa, depois de eu escrever "idempotente" no cabeçalho.
drop policy if exists "leitura de avaliacoes" on public.avaliacoes;
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

drop policy if exists "leitura de topicos" on public.topicos;
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

-- A tabela `perfis` tinha o mesmo problema, e este eu não tinha visto: a
-- política "perfil é do dono" é FOR ALL — o que inclui SELECT — e convive com
-- a "perfil é público em leitura". Duas expressões avaliadas em toda leitura.
-- Separando: o dono manda em escrita, e a leitura é pública numa política só.
drop policy if exists "perfil e' do dono" on public.perfis;
drop policy if exists "perfil e' publico em leitura" on public.perfis;
drop policy if exists "leitura de perfis" on public.perfis;
drop policy if exists "dono escreve o proprio perfil" on public.perfis;
drop policy if exists "dono atualiza o proprio perfil" on public.perfis;
drop policy if exists "dono apaga o proprio perfil" on public.perfis;

create policy "leitura de perfis"
  on public.perfis for select using (true);

create policy "dono escreve o proprio perfil"
  on public.perfis for insert to authenticated
  with check (usuario_id = (select auth.uid()));

create policy "dono atualiza o proprio perfil"
  on public.perfis for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy "dono apaga o proprio perfil"
  on public.perfis for delete to authenticated
  using (usuario_id = (select auth.uid()));

drop policy if exists "leitura de respostas" on public.respostas;
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
-- 4. A OUTRA FUNÇÃO DO AVISO: RESOLVIDA NA 005
-- ═══════════════════════════════════════════════════════════════════════════
--
-- O painel também acusou `public.rls_auto_enable()`, que não existe em nenhuma
-- migração deste repositório. Lemos o corpo dela: é um gatilho de evento que
-- LIGA RLS automaticamente em toda tabela nova do schema `public` — uma rede de
-- segurança, não um buraco.
--
-- Ela NÃO deve ser apagada. O tratamento está em 005-rls-auto-enable.sql, com o
-- raciocínio completo.
