/**
 * WikiPong · De id de usuário para apelido, em lote
 * ------------------------------------------------------------------------------
 * As listagens (avaliações, discussões) trazem `usuario_id`, e o link do perfil
 * precisa do apelido. Uma consulta por linha seria uma consulta por avaliação na
 * tela — isto resolve todas de uma vez.
 *
 * Falha vira mapa vazio, nunca erro: sem apelido o nome fica texto simples, que
 * é exatamente como o site está hoje. Perder o link não pode derrubar a lista.
 */

/** Quantos ids cabem numa consulta. Acima disso, a URL fica grande demais. */
const LOTE = 100;

export async function apelidosDe(
  ids: readonly (string | undefined)[],
): Promise<Map<string, string>> {
  const unicos = [...new Set(ids.filter((x): x is string => Boolean(x)))].slice(0, LOTE);
  if (unicos.length === 0) return new Map();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return new Map();

  try {
    const res = await fetch(
      `${url.replace(/\/$/, '')}/rest/v1/perfis` +
        `?usuario_id=in.(${unicos.join(',')})&select=usuario_id,apelido`,
      { headers: { apikey: chave, Authorization: `Bearer ${chave}` } },
    );
    if (!res.ok) return new Map();
    const linhas = (await res.json()) as { usuario_id: string; apelido: string | null }[];
    return new Map(
      linhas.filter((l) => l.apelido).map((l) => [l.usuario_id, l.apelido as string]),
    );
  } catch {
    return new Map();
  }
}

/** O endereço do perfil de alguém. Um lugar só, para não escrever a query à mão. */
export const caminhoDoPerfil = (apelido: string): string =>
  `/comunidade/jogador/?p=${encodeURIComponent(apelido)}`;
