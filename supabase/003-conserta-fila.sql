-- WikiPong · Migração 003 — fecha o buraco da view fila_moderacao
-- ---------------------------------------------------------------------------
-- Rodar depois da 001 e da 002. Idempotente.
--
-- O QUE ACONTECEU
--
-- A 001 criou `fila_moderacao` como uma conveniência: uma view que junta
-- avaliações, tópicos e respostas à espera de aprovação, para olhar pelo painel.
--
-- No Postgres, uma view roda com as permissões de QUEM A CRIOU, não de quem a
-- consulta. Como ela foi criada por quem é dono do banco, passou a ler as três
-- tabelas IGNORANDO o RLS. As políticas que garantem "só o que está aprovado é
-- público" continuavam valendo para as tabelas — e a view passava por cima.
--
-- Resultado: qualquer pessoa com a chave anônima (que está no bundle do site, à
-- vista de todos) poderia consultar a view e ler TODO o conteúdo pendente, sem
-- moderação nenhuma. Foi o buraco que o resto do arquivo existia para fechar,
-- aberto por uma linha que o código do site nem usa.
--
-- O CONSERTO, em duas camadas porque uma só não me deixa dormir:
--
--  1. `security_invoker = on` — a view passa a rodar com as permissões de quem
--     PERGUNTA. O RLS das tabelas volta a valer, e um admin (política da 002)
--     enxerga tudo enquanto o anônimo enxerga o mesmo que já enxergava.
--  2. `revoke` explícito de anon — mesmo com o item 1, não há motivo para o
--     visitante ter permissão de sequer tocar nesta view. Ela é ferramenta de
--     moderação.
--
-- Se o seu Postgres for anterior ao 15, o passo 1 falha. Nesse caso, apague a
-- view: `drop view public.fila_moderacao;`. Você não perde nada — a tela de
-- moderação do site lê as tabelas direto, e o painel do Supabase também.

alter view public.fila_moderacao set (security_invoker = on);

revoke all on public.fila_moderacao from anon;
grant select on public.fila_moderacao to authenticated;

-- Confirme que ficou certo: esta consulta tem que devolver `true`.
-- select reloptions::text like '%security_invoker=on%'
--   from pg_class where relname = 'fila_moderacao';
