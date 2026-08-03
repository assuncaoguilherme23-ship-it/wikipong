-- WikiPong · Migração 008 — os índices das chaves estrangeiras de usuário
-- ---------------------------------------------------------------------------
-- Rodar depois da 007. Idempotente.
--
-- O painel apontou cinco coisas. TRÊS são para arrumar e estão aqui; as outras
-- DUAS ficam acesas de propósito, e a seção final diz por quê. A diferença
-- importa: aviso que fica por decisão não é o mesmo que aviso que ninguém viu.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. As três chaves estrangeiras sem índice
-- ═══════════════════════════════════════════════════════════════════════════
--
-- `avaliacoes`, `topicos` e `respostas` apontam para `auth.users (id)` pela
-- coluna `usuario_id`, e nenhuma das três tem índice que sirva a essa coluna.
--
-- A `avaliacoes` PARECE ter: existe o único `(material_id, usuario_id)`. Não
-- serve. Num índice composto, só a PRIMEIRA coluna é pesquisável sozinha —
-- procurar por `usuario_id` ali é como procurar um sobrenome numa lista
-- ordenada por nome.
--
-- ── O QUE ISSO CUSTA DE VERDADE ───────────────────────────────────────────
--
-- As três colunas são `on delete set null`. Quando alguém apaga a conta, o
-- Postgres precisa achar TODA linha que aponta para aquele usuário, nas três
-- tabelas, para zerar o campo. Sem índice, isso é varredura completa de cada
-- uma. Com pouca gente é instantâneo; é o tipo de coisa que só aparece no dia
-- em que já não dá para arrumar rápido.
--
-- E ajuda a leitura que a 007 acabou de arrumar: a política do logado testa
-- `usuario_id = (select auth.uid())` para deixar a pessoa ver o que ela mesma
-- escreveu enquanto está pendente.
--
-- ── ÍNDICE INTEIRO, NÃO PARCIAL ───────────────────────────────────────────
--
-- O login é opcional (D-19), então a maioria das linhas vai ter `usuario_id`
-- nulo, e um índice parcial `where usuario_id is not null` seria menor. Ele
-- funcionaria: `usuario_id = <id>` implica `is not null`, e o planejador sabe
-- usar índice parcial nesse caso.
--
-- Fiquei com o índice inteiro assim mesmo. O que se ganha é espaço numa tabela
-- que vai ser pequena por muito tempo, e o que se arrisca é o verificador não
-- reconhecer a forma parcial e continuar apontando — que foi exatamente o
-- vaivém do `revoke ... from public` na 004. Troca ruim.

create index if not exists avaliacoes_por_usuario
  on public.avaliacoes (usuario_id);

create index if not exists topicos_por_usuario
  on public.topicos (usuario_id);

create index if not exists respostas_por_usuario
  on public.respostas (usuario_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. "Unused Index: topicos_por_material" — FICA
-- ═══════════════════════════════════════════════════════════════════════════
--
-- O painel diz que o índice nunca foi usado e sugere remover. Está certo no
-- fato e errado na conclusão.
--
-- Ele nunca foi usado porque AS DISCUSSÕES AINDA NÃO TÊM NADA. Conferido na
-- API no mesmo dia: `GET /rest/v1/topicos` devolve lista vazia. O índice serve
-- exatamente à consulta que a tela de discussões vai fazer — "os tópicos deste
-- material" — e essa tela ainda não recebeu visita.
--
-- "Nunca usado" aqui mede a idade do site, não a utilidade do índice. Apagá-lo
-- agora é garantir que ele precise ser recriado no primeiro dia em que a
-- funcionalidade pegar — e aí com tabela cheia, que é a hora cara.
--
-- Fica. E fica registrado, para não virar dúvida a cada vez que alguém abrir o
-- painel.

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. "Leaked Password Protection Disabled" — FICA, E NÃO DÁ PARA DESLIGAR
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Já explicado na seção 4 da 006, repetido aqui porque é o aviso que volta:
-- é recurso do plano Pro, o botão não liga no Free, e o WikiPong NÃO USA
-- SENHA — quem entra recebe link no e-mail.
--
-- É o único dos cinco que muda de importância no futuro: no dia em que entrar
-- o login por senha, ele deixa de ser ruído e vira requisito.

-- ═══════════════════════════════════════════════════════════════════════════
-- COMO CONFERIR
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Depois de rodar, o painel deve ficar com DOIS avisos: o índice não usado e o
-- de senha vazada. Os três de chave estrangeira somem.
--
-- Se sumirem os três, acabou. Os dois que sobram são os desta migração — estão
-- acesos porque foi decidido que ficassem.
