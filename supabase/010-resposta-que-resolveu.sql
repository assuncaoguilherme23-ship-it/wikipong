-- WikiPong · Migração 010 — a resposta que resolveu a dúvida
-- ---------------------------------------------------------------------------
-- Rodar depois da 009, no SQL Editor. Idempotente.
--
-- É a ideia mais valiosa que se colhe de um fórum grande como o TableTennisDaily:
-- lá a maior parte dos tópicos é alguém pedindo ajuda para escolher equipamento,
-- e o que separa um arquivo útil de um monte de conversa velha é conseguir ver,
-- meses depois, QUAL das quinze respostas resolveu.
--
-- Sem isto, quem chega pela busca lê o tópico inteiro e sai sem saber no que
-- acreditar. Com isto, a resposta certa sobe para o topo e leva a etiqueta.
--
-- ── POR QUE UMA FUNÇÃO, E NÃO UMA POLÍTICA DE UPDATE ──────────────────────
--
-- O caminho óbvio seria dar ao dono do tópico o direito de atualizar o próprio
-- tópico. Isso abre um buraco: a RLS filtra LINHAS, não COLUNAS. Quem pudesse
-- atualizar a linha para marcar `resposta_util` poderia, na mesma requisição,
-- trocar o `status` para 'aprovado' — e publicar o próprio tópico sem passar
-- pela moderação. A chave anônima está no bundle; montar essa requisição na mão
-- é trivial.
--
-- Então a marcação passa por uma função `security definer` que só mexe naquela
-- coluna, e confere duas coisas que a RLS não conferiria: que quem pede é o dono
-- do tópico (ou um moderador), e que a resposta marcada é DAQUELE tópico.

alter table public.topicos
  add column if not exists resposta_util uuid
  references public.respostas (id) on delete set null;

comment on column public.topicos.resposta_util is
  'Resposta que o autor (ou um moderador) marcou como a que resolveu. Só muda pela função marcar_resposta_util.';

create or replace function public.marcar_resposta_util(p_topico uuid, p_resposta uuid)
returns void
language plpgsql
security definer
-- `search_path` fixo: sem isto, um schema plantado no caminho poderia sequestrar
-- o nome de uma tabela dentro de uma função que roda como dono do banco. Foi um
-- dos apontamentos do verificador do Supabase na 004.
set search_path = public
as $$
declare
  dono uuid;
begin
  select usuario_id into dono from public.topicos where id = p_topico;

  if not found then
    raise exception 'tópico não encontrado';
  end if;

  -- Tópico aberto sem conta não tem dono: aí só moderador marca. É o preço de
  -- deixar escrever sem login, e é o mesmo preço que as avaliações já pagam.
  if dono is null or dono <> (select auth.uid()) then
    if not public.eh_admin() then
      raise exception 'só quem abriu o tópico, ou um moderador, marca a resposta que resolveu';
    end if;
  end if;

  -- Marcar como "resolveu" uma resposta de OUTRO tópico exibiria, no tópico A,
  -- um texto escrito no tópico B.
  if p_resposta is not null and not exists (
    select 1 from public.respostas where id = p_resposta and topico_id = p_topico
  ) then
    raise exception 'essa resposta não é deste tópico';
  end if;

  update public.topicos set resposta_util = p_resposta where id = p_topico;
end;
$$;

-- Quem não está logado não marca nada. Nenhuma POLÍTICA chama esta função, então
-- tirar o `anon` daqui não repete o erro da 004 — lá o problema foi uma política
-- de leitura que chamava `eh_admin()` para um papel proibido de executá-la.
revoke all on function public.marcar_resposta_util(uuid, uuid) from public;
revoke all on function public.marcar_resposta_util(uuid, uuid) from anon;
grant execute on function public.marcar_resposta_util(uuid, uuid) to authenticated;

-- A consulta que a lista de discussões faz: tópico aprovado, mais recente
-- primeiro, com as respostas embutidas.
create index if not exists topicos_publicos
  on public.topicos (status, criado_em desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- COMO CONFERIR
-- ═══════════════════════════════════════════════════════════════════════════
--
--   select public.marcar_resposta_util('<id do topico>', '<id da resposta>');
--
-- Rodando pelo SQL Editor você é o dono do banco e passa. O teste que importa é
-- pela chave anônima: deve recusar, porque `anon` não pode executar a função.
