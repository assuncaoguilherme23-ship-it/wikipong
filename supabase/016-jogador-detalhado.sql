-- WikiPong · 016 · o que faz um perfil de mesatenista, e não de site qualquer
-- ----------------------------------------------------------------------------
-- A 014 deu ao perfil o que ele precisava pra ter ENDEREÇO (apelido) e pra
-- dizer o básico. Faltava o que faz alguém reconhecer outro mesatenista.
--
-- POR QUE ESTAS QUATRO E NÃO OUTRAS. O critério foi: pergunta curta, resposta
-- que a pessoa sabe de cabeça, e que muda como se lê o resto do perfil.
--
--   joga_desde   → vira "12 anos de raquete", que é o contexto de TUDO que ela
--                  escreve. "Rápida demais" de quem joga há 1 ano e de quem
--                  joga há 20 são duas frases diferentes.
--   frequencia   → diz quanto peso dar à observação de desgaste. Quem joga todo
--                  dia gasta uma borracha em 3 meses; quem joga aos sábados
--                  leva 2 anos, e os dois vão dizer "durou pouco".
--   clube        → a única coisa aqui que liga uma pessoa a outra. O resto do
--                  perfil descreve; este localiza.
--   bola         → detalhe que só mesatenista pergunta, e que muda o toque.
--
-- NENHUMA POLÍTICA NOVA. As policies de `perfis` da 001 valem por LINHA, e
-- linha é a pessoa inteira — colunas novas entram cobertas pelas mesmas regras.
-- (Se a leitura pública fosse por coluna, isto seria outra história; RLS filtra
-- LINHA, não coluna, e é por isso que a estante precisou de duas tabelas.)

alter table public.perfis
  add column if not exists joga_desde  integer,
  add column if not exists frequencia  text,
  add column if not exists clube       text,
  add column if not exists bola        text;

-- 1930 é anterior a qualquer jogador vivo em atividade; o teto é folgado de
-- propósito. Um CHECK não pode usar a data de hoje (não é imutável), então a
-- régua fina — "ano no futuro" — fica na tela, onde ela pode ser dita.
alter table public.perfis
  drop constraint if exists perfis_joga_desde_plausivel,
  add constraint perfis_joga_desde_plausivel
    check (joga_desde is null or joga_desde between 1930 and 2100);

alter table public.perfis
  drop constraint if exists perfis_frequencia_valida,
  add constraint perfis_frequencia_valida
    check (frequencia is null or frequencia in
      ('todo-dia', 'quase-todo-dia', 'toda-semana', 'de-vez-em-quando'));

-- Nome de clube, não biografia. O limite existe pra que a linha do perfil
-- continue sendo uma linha em qualquer tela.
alter table public.perfis
  drop constraint if exists perfis_clube_curto,
  add constraint perfis_clube_curto
    check (clube is null or char_length(clube) <= 60);

alter table public.perfis
  drop constraint if exists perfis_bola_curta,
  add constraint perfis_bola_curta
    check (bola is null or char_length(bola) <= 40);

comment on column public.perfis.joga_desde is
  'Ano em que comecou a jogar. Vira "N anos de raquete" na tela.';
comment on column public.perfis.frequencia is
  'Quanto joga. Contexto pra ler observacao de desgaste.';
comment on column public.perfis.clube is
  'Clube ou academia. O unico campo do perfil que liga uma pessoa a outra.';
comment on column public.perfis.bola is
  'Marca/modelo da bola que costuma usar.';
