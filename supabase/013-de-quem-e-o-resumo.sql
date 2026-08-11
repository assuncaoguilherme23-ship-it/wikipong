-- WikiPong · 013 · de quem é o texto que está embaixo do título
-- ----------------------------------------------------------------------------
-- A CBTM publica uma linha fina em toda notícia, logo abaixo do título:
-- "Atletas representarão o Brasil em Dakar, no Senegal, acompanhados pela
-- técnica Daniela Bassi". É específica, é em português e é gratuita — resolve o
-- resumo sem modelo nenhum e sem ninguém digitar.
--
-- Só que ela é texto DA CBTM, não da WikiPong. Publicar palavra alheia como se
-- fosse nossa é o mesmo erro da colheita da GEWO, com roupa melhor. Por isso a
-- coluna: ela diz de quem é a frase que está na tela.
--
--   'fonte'    — a linha fina da CBTM, como ela publicou. Aparece atribuída.
--   'wikipong' — alguém da casa escreveu ou reescreveu. Aparece sem atribuição,
--                porque aí a voz é nossa mesmo.
--
-- Nulo é o passado: as notícias que entraram antes desta coluna existir. Elas
-- foram todas escritas na moderação, então lê-se como 'wikipong' — mas eu não
-- carimbo isso no banco, porque afirmar procedência que não foi registrada é
-- inventar procedência, e é exatamente o que este projeto não faz.
alter table public.noticias_recebidas
  add column if not exists origem_resumo text
    check (origem_resumo is null or origem_resumo in ('fonte', 'wikipong'));

comment on column public.noticias_recebidas.origem_resumo is
  'De quem é o texto do resumo: fonte (linha fina da CBTM, atribuída na tela) ou wikipong (escrito aqui). Nulo = anterior à coluna.';
