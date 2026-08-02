-- WikiPong · Migração 006 — as duas últimas políticas sobrepostas
-- ---------------------------------------------------------------------------
-- Rodar depois da 005. Idempotente.
--
-- A 004 juntou as políticas de SELECT e esqueceu de olhar as de UPDATE e
-- INSERT. O painel achou as duas que sobraram, as duas na `avaliacoes`.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. UPDATE: o admin e o dono tinham políticas separadas
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Eram "admin modera avaliacoes" e "edito a minha avaliacao". As duas valem
-- para `authenticated`, então o Postgres avaliava as duas em todo UPDATE.
--
-- A regra não muda: o admin altera qualquer avaliação (é o que a moderação
-- faz), e o dono altera a dele — mas o texto editado VOLTA PRA FILA, porque
-- conteúdo novo merece um segundo par de olhos. Sem isso, dava pra aprovar um
-- texto inocente e trocar o corpo depois.

drop policy if exists "admin modera avaliacoes" on public.avaliacoes;
drop policy if exists "edito a minha avaliacao" on public.avaliacoes;
drop policy if exists "atualizacao de avaliacoes" on public.avaliacoes;

create policy "atualizacao de avaliacoes"
  on public.avaliacoes for update to authenticated
  using (
    public.eh_admin()
    or usuario_id = (select auth.uid())
  )
  with check (
    public.eh_admin()
    or (usuario_id = (select auth.uid()) and status = 'pendente')
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. INSERT: a política do anônimo alcançava o logado também
-- ═══════════════════════════════════════════════════════════════════════════
--
-- A "qualquer um cria avaliacao, sempre pendente" da migração 001 é
-- `to anon, authenticated`. Quando o login chegou na 002, entrou a "logado
-- assina o que escreve" — e as duas passaram a valer para quem está logado.
--
-- O conserto é dar a cada papel a sua: o anônimo tem a dele, o logado tem a
-- dele. E de quebra fica MAIS ESTRITO — o anônimo agora é obrigado a deixar
-- `usuario_id` nulo, em vez de poder mandar o id de outra pessoa e depender da
-- política do logado para ser barrado.

drop policy if exists "qualquer um cria avaliacao, sempre pendente" on public.avaliacoes;
drop policy if exists "anonimo cria avaliacao, sempre pendente" on public.avaliacoes;
drop policy if exists "logado assina o que escreve" on public.avaliacoes;

create policy "anonimo cria avaliacao, sempre pendente"
  on public.avaliacoes for insert to anon
  with check (status = 'pendente' and usuario_id is null);

create policy "logado assina o que escreve"
  on public.avaliacoes for insert to authenticated
  with check (status = 'pendente'
              and (usuario_id is null or usuario_id = (select auth.uid())));

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. O mesmo em tópicos e respostas
-- ═══════════════════════════════════════════════════════════════════════════
--
-- O painel só acusou a `avaliacoes` porque é a única com política de INSERT
-- para logado. Mas as outras duas têm a mesma política `to anon, authenticated`
-- da 001, e vão dar o mesmo aviso no dia em que ganharem posse — o que já está
-- previsto. Arrumo agora, enquanto está fresco.

drop policy if exists "qualquer um abre topico, sempre pendente" on public.topicos;
drop policy if exists "anonimo abre topico, sempre pendente" on public.topicos;
create policy "anonimo abre topico, sempre pendente"
  on public.topicos for insert to anon
  with check (status = 'pendente' and usuario_id is null);

drop policy if exists "logado assina o topico" on public.topicos;
create policy "logado assina o topico"
  on public.topicos for insert to authenticated
  with check (status = 'pendente'
              and (usuario_id is null or usuario_id = (select auth.uid())));

drop policy if exists "qualquer um responde, sempre pendente" on public.respostas;
drop policy if exists "anonimo responde, sempre pendente" on public.respostas;
create policy "anonimo responde, sempre pendente"
  on public.respostas for insert to anon
  with check (status = 'pendente' and usuario_id is null);

drop policy if exists "logado assina a resposta" on public.respostas;
create policy "logado assina a resposta"
  on public.respostas for insert to authenticated
  with check (status = 'pendente'
              and (usuario_id is null or usuario_id = (select auth.uid())));

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. O aviso que sobra NÃO é SQL
-- ═══════════════════════════════════════════════════════════════════════════
--
-- "Leaked Password Protection Disabled" é uma chave do painel, em
-- Authentication → Providers. Ela compara a senha escolhida contra a base do
-- HaveIBeenPwned e recusa as que já vazaram.
--
-- O WikiPong NÃO USA SENHA: quem entra usa link no e-mail. Enquanto for assim,
-- a proteção não tem o que proteger — não há senha para conferir.
--
-- Ligar mesmo assim não custa nada e cobre o dia em que o login por senha
-- entrar. Se preferir deixar desligada, o aviso fica no painel de propósito, e
-- isso é uma escolha defensável — não um esquecimento.
