-- WikiPong · Migração 007 — a leitura pública que a 004 quebrou
-- ---------------------------------------------------------------------------
-- Rodar depois da 006. Idempotente.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- URGENTE: HOJE NENHUM VISITANTE CONSEGUE LER A COMUNIDADE
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Quem abre o site sem estar logado recebe 401 em `avaliacoes`, `topicos` e
-- `respostas`. Não é "aparece vazio": é erro. Avaliação aprovada, tópico
-- publicado, resposta — nada disso chega a quem lê. A moderação continua
-- funcionando, porque o admin está logado; por isso o defeito passou
-- despercebido.
--
-- ── A CAUSA, E ELA É MINHA ────────────────────────────────────────────────
--
-- A 004 fez duas coisas certas que juntas dão uma errada.
--
-- Na seção 1, tirei do `anon` o direito de executar `eh_admin()`, com este
-- comentário escrito por mim:
--
--     "o `anon` perde o direito de chamá-la — nenhuma política de admin é
--      `to anon`, então ele nunca precisou."
--
-- Na seção 3, três seções abaixo, escrevi as políticas de leitura assim:
--
--     create policy "leitura de avaliacoes"
--       on public.avaliacoes for select        <-- SEM cláusula `to`
--       using (status = 'aprovado' or usuario_id = ... or public.eh_admin());
--
-- Política SEM `to` vale para TODOS os papéis, inclusive `anon`. Então o
-- mesmo arquivo que proibiu o anônimo de chamar a função escreveu uma regra
-- que obriga o anônimo a chamá-la. O Postgres levanta "permission denied for
-- function eh_admin", e o PostgREST devolve isso como 401.
--
-- A frase do comentário estava errada no instante em que foi escrita.
--
-- ── COMO ISSO FOI ENCONTRADO ──────────────────────────────────────────────
--
-- Não pelo painel — para o verificador do Supabase está tudo em ordem, porque
-- não há nada de inseguro aqui: é permissão de menos, não de mais. Apareceu ao
-- conferir com a chave publicável o que o público enxerga:
--
--     GET /rest/v1/perfis        -> 200 []     (política sem função)
--     GET /rest/v1/avaliacoes    -> 401        (política com eh_admin())
--     POST /rest/v1/rpc/eh_admin -> 401        (o anon não pode executá-la)
--
-- Vale a distinção, porque ela dá o diagnóstico de graça: sob papel anônimo, o
-- PostgREST responde 401 para permissão NEGADA e 200 com lista vazia quando é
-- a RLS que filtra. Erro 401 numa tabela de leitura pública nunca é RLS.
--
-- ── O CONSERTO ────────────────────────────────────────────────────────────
--
-- Havia o caminho de uma linha: devolver o EXECUTE para o `anon`. Resolve o
-- 401 e desfaz a melhoria da 004.
--
-- Melhor é dar a cada papel a política que ele realmente precisa. Para quem
-- não está logado, os outros dois termos são inúteis de qualquer jeito:
-- `auth.uid()` é nulo, e `eh_admin()` seria falso. O que sobra é o que sempre
-- foi a regra do anônimo — só o aprovado.
--
-- Assim o anônimo continua SEM poder chamar `eh_admin()` (a 004 fica de pé),
-- para de pagar uma chamada de função por linha lida, e o painel segue quieto:
-- uma política por papel não é política sobreposta.

-- ═══════════════════════════════════════════════════════════════════════════
-- avaliacoes
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists "leitura de avaliacoes" on public.avaliacoes;
drop policy if exists "leitura publica de avaliacoes" on public.avaliacoes;

create policy "leitura publica de avaliacoes"
  on public.avaliacoes for select to anon
  using (status = 'aprovado');

create policy "leitura de avaliacoes"
  on public.avaliacoes for select to authenticated
  using (
    status = 'aprovado'
    or usuario_id = (select auth.uid())
    or public.eh_admin()
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- topicos
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists "leitura de topicos" on public.topicos;
drop policy if exists "leitura publica de topicos" on public.topicos;

create policy "leitura publica de topicos"
  on public.topicos for select to anon
  using (status = 'aprovado');

create policy "leitura de topicos"
  on public.topicos for select to authenticated
  using (
    status = 'aprovado'
    or usuario_id = (select auth.uid())
    or public.eh_admin()
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- respostas
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists "leitura de respostas" on public.respostas;
drop policy if exists "leitura publica de respostas" on public.respostas;

create policy "leitura publica de respostas"
  on public.respostas for select to anon
  using (status = 'aprovado');

create policy "leitura de respostas"
  on public.respostas for select to authenticated
  using (
    status = 'aprovado'
    or usuario_id = (select auth.uid())
    or public.eh_admin()
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- COMO CONFERIR QUE FUNCIONOU
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Não dá para confiar no painel aqui: ele nunca acusou este defeito. A prova é
-- abrir a página de um material EM ABA ANÔNIMA (sem sessão) e ver se a
-- avaliação aprovada aparece. Se aparecer, acabou.
--
-- A `perfis` não precisou de nada: a política dela é `using (true)`, sem
-- chamada de função — foi justamente por responder 200 enquanto as outras três
-- respondiam 401 que a causa ficou clara.
