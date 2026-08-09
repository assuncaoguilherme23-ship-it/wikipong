-- WikiPong · Migração 011 — endurece marcar_resposta_util
-- ---------------------------------------------------------------------------
-- Rodar depois da 010. Idempotente.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- O AVISO "Signed-In Users Can Execute SECURITY DEFINER Function" FICA ACESO
-- ═══════════════════════════════════════════════════════════════════════════
--
-- E fica de propósito. O painel sugere três saídas, e nenhuma serve:
--
--   · "Revoke EXECUTE" — quem precisa chamar é exatamente o usuário logado. É
--     ele quem marca qual resposta resolveu a dúvida que ele mesmo abriu.
--   · "Switch to SECURITY INVOKER" — o objetivo da função é passar por cima do
--     RLS de forma estreita. Como INVOKER ela não escreve nada, e o recurso some.
--   · "Move it out of your exposed API schema" — o site a chama por
--     /rest/v1/rpc/marcar_resposta_util. Fora do schema exposto, não há chamada.
--
-- O aviso é uma heurística que pergunta "você quis isso mesmo?". A resposta é
-- sim, e a razão é que O RLS FILTRA LINHAS, NÃO COLUNAS. A alternativa seria dar
-- ao dono do tópico o direito de atualizar a própria linha — e aí ele trocaria o
-- `status` para 'aprovado' na mesma requisição, publicando sem moderação. A
-- chave anônima está no bundle: montar essa requisição na mão é trivial.
--
-- A outra alternativa considerada foi RLS de dono + um GATILHO que barra a troca
-- de `status`. Foi recusada por ser lista-de-proibições em vez de
-- lista-de-permissões: dá ao dono UPDATE na linha inteira e depende de o gatilho
-- lembrar de cada coluna que ele não pode tocar. Esquecer uma é um buraco. A
-- função faz o contrário — ela só sabe escrever UMA coluna, e não há como pedir
-- outra coisa a ela.
--
-- ── O QUE ESTA MIGRAÇÃO MUDA DE VERDADE ───────────────────────────────────
--
-- `search_path` de 'public' para '' (vazio). A 010 já fixava o caminho, o que
-- resolve o lint de search_path mutável; vazio é a forma forte. Com 'public', um
-- objeto criado nesse schema ainda pode ser resolvido por nome curto dentro de
-- uma função que roda como dono do banco. Com vazio, só nome qualificado resolve
-- — e todo nome aqui dentro já é qualificado, então a troca não muda
-- comportamento nenhum, só fecha a porta.
--
-- (`pg_catalog` continua sendo consultado mesmo com search_path vazio, então
-- `uuid` e o resto dos tipos seguem resolvendo.)

create or replace function public.marcar_resposta_util(p_topico uuid, p_resposta uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  dono uuid;
begin
  select usuario_id into dono from public.topicos where id = p_topico;

  if not found then
    raise exception 'tópico não encontrado';
  end if;

  -- Tópico aberto sem conta não tem dono: aí só moderador marca. É o preço de
  -- deixar escrever sem login, e é o mesmo que as avaliações já pagam.
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

-- `create or replace` PRESERVA as permissões, mas repetir é barato e deixa este
-- arquivo sozinho suficiente para auditar quem pode chamar.
revoke all on function public.marcar_resposta_util(uuid, uuid) from public;
revoke all on function public.marcar_resposta_util(uuid, uuid) from anon;
grant execute on function public.marcar_resposta_util(uuid, uuid) to authenticated;

comment on function public.marcar_resposta_util(uuid, uuid) is
  'SECURITY DEFINER de propósito: escreve APENAS topicos.resposta_util, e só '
  'para o dono do tópico ou um moderador. Existe porque o RLS filtra linhas e '
  'não colunas — sem ela, marcar a resposta exigiria dar UPDATE na linha, o que '
  'deixaria o dono trocar o status e publicar sem moderação. O aviso do painel '
  'sobre função SECURITY DEFINER chamável por usuário logado fica aceso de '
  'propósito; ver supabase/011-endurece-a-funcao.sql.';

-- ═══════════════════════════════════════════════════════════════════════════
-- COMO CONFERIR
-- ═══════════════════════════════════════════════════════════════════════════
--
-- A prova que importa é pela chave ANÔNIMA, e ela tem de RECUSAR:
--
--   POST /rest/v1/rpc/marcar_resposta_util  -> 401/403, nunca 200
--
-- Se responder 200 sem sessão, o `revoke` acima não pegou.
