-- WikiPong · 014 · o perfil deixa de ser pagina de configuracoes
-- ----------------------------------------------------------------------------
-- A tabela `perfis` ja' tinha leitura publica (`using (true)`) desde a 001, e
-- nunca teve e-mail -- e' por isso que expor essas colunas e' seguro.
--
-- O que entra: o apelido que vira endereco, mao e empunhadura (que mudam a
-- recomendacao inteira e nao existiam no site), cidade/UF opcionais, e a linha
-- "o que eu procuro agora".

alter table public.perfis
  add column if not exists apelido     text,
  add column if not exists mao         text,
  add column if not exists empunhadura text,
  add column if not exists cidade      text,
  add column if not exists uf          text,
  add column if not exists procuro     text;

-- O unique e' o que faz o endereco ser endereco. PARCIAL porque perfil antigo
-- ainda nao tem apelido, e varios nulos nao podem colidir entre si.
create unique index if not exists perfis_apelido_unico
  on public.perfis (apelido) where apelido is not null;

alter table public.perfis
  drop constraint if exists perfis_mao_valida,
  add constraint perfis_mao_valida
    check (mao is null or mao in ('destro', 'canhoto'));

alter table public.perfis
  drop constraint if exists perfis_empunhadura_valida,
  add constraint perfis_empunhadura_valida
    check (empunhadura is null or empunhadura in ('classica', 'caneta-chinesa', 'caneta-japonesa'));

alter table public.perfis
  drop constraint if exists perfis_uf_valida,
  add constraint perfis_uf_valida
    check (uf is null or char_length(uf) = 2);

-- 120 caracteres: e' uma linha, nao um paragrafo. Quem tem mais que isso pra
-- dizer tem uma discussao pra abrir, nao um campo de perfil pra encher.
alter table public.perfis
  drop constraint if exists perfis_procuro_curto,
  add constraint perfis_procuro_curto
    check (procuro is null or char_length(procuro) <= 120);

comment on column public.perfis.apelido is
  'Endereco publico do perfil (/comunidade/jogador/?p=). Gerado uma vez, nunca muda.';
