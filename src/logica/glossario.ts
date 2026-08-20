/**
 * WikiPong · Marcar os termos do glossário dentro de um texto
 * ==============================================================================
 * O produto combate o "jargão que exclui" (PRODUCT.md): o site é técnico, e
 * quem está começando trava em "tensor", "aderente", "carbono externo". O
 * glossário existe desde cedo, mas obriga a SAIR da página pra consultar — e
 * ninguém sai de uma página pra procurar uma palavra.
 *
 * Este módulo é a metade pura: recebe um texto e a lista de termos, devolve os
 * pedaços já classificados. Não sabe o que é tooltip, hover nem HTML.
 *
 * ── AS QUATRO REGRAS, e cada uma existe por um defeito concreto ──────────────
 *
 * 1. SÓ A PRIMEIRA OCORRÊNCIA de cada termo. Um guia que diga "esponja" doze
 *    vezes ficaria com doze sublinhados — e sublinhado em toda linha deixa de
 *    ser sinal e vira textura. É a regra que a Wikipédia usa, pelo mesmo motivo.
 *
 * 2. PALAVRA INTEIRA. Sem isso, "flick" casaria dentro de "flicker" e "ALC"
 *    dentro de "CALCULAR". O `\b` do JavaScript não serve aqui: ele não
 *    conhece "ã" nem "ç", então "Tensão" seguido de vírgula quebraria. A
 *    fronteira é testada à mão, contra letra ou número Unicode.
 *
 * 3. O MAIOR VENCE. "Esponja" e "Ponto de fundo (bottoming out)" podem começar
 *    na mesma frase; se o menor casar primeiro, o maior nunca aparece. Ordenar
 *    por comprimento resolve, e é o mesmo motivo pelo qual "Bola 40+" precisa
 *    vencer "Bola".
 *
 * 4. AS DUAS FORMAS DO TERMO. Metade do glossário nomeia o termo com o
 *    equivalente em inglês entre parênteses — "Esponja (sponge)", "ALC
 *    (Arylate-Carbon)". As duas aparecem em texto corrido, e marcar só a
 *    primeira deixaria "sponge" sem explicação justamente pra quem não sabe o
 *    que é.
 */

export interface TermoDoGlossario {
  termo: string;
  definicao: string;
  categoria: string;
}

/**
 * As formas pelas quais um termo pode aparecer escrito.
 *
 *   "Esponja (sponge)"      → ["Esponja", "sponge"]
 *   "ALC (Arylate-Carbon)"  → ["ALC", "Arylate-Carbon"]
 *   "Topspin"               → ["Topspin"]
 */
export function formasDoTermo(termo: string): string[] {
  const comParenteses = termo.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!comParenteses) return [termo.trim()];
  return [comParenteses[1].trim(), comParenteses[2].trim()].filter(Boolean);
}

/** Sem acento e em minúscula — quem digita "tensao" tem que achar "Tensão". */
const chave = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const EH_LETRA = /[\p{L}\p{N}]/u;

/** A posição é fronteira de palavra? Testado à mão porque `\b` ignora acento. */
const fronteira = (texto: string, i: number): boolean =>
  i < 0 || i >= texto.length || !EH_LETRA.test(texto[i]);

export type Pedaco =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'termo'; texto: string; termo: TermoDoGlossario };

/**
 * Corta o texto em pedaços, marcando a primeira aparição de cada termo.
 *
 * O texto devolvido em cada pedaço é o ORIGINAL, com a caixa e os acentos que a
 * pessoa escreveu — a normalização serve só para achar, nunca para substituir.
 */
export function marcarTermos(
  texto: string,
  termos: readonly TermoDoGlossario[],
): Pedaco[] {
  if (!texto) return [];

  const alvo = chave(texto);

  /* Todas as formas, da mais longa para a mais curta: o maior vence (regra 3). */
  const formas = termos
    .flatMap((t) => formasDoTermo(t.termo).map((f) => ({ forma: chave(f), termo: t })))
    .filter((f) => f.forma.length >= 2)
    .sort((a, b) => b.forma.length - a.forma.length);

  const achados: { inicio: number; fim: number; termo: TermoDoGlossario }[] = [];
  const jaMarcado = new Set<string>();

  for (const { forma, termo } of formas) {
    if (jaMarcado.has(termo.termo)) continue; // regra 1: uma vez por termo

    let de = 0;
    while (de <= alvo.length - forma.length) {
      const i = alvo.indexOf(forma, de);
      if (i === -1) break;
      const fim = i + forma.length;

      const inteira = fronteira(alvo, i - 1) && fronteira(alvo, fim);
      const livre = !achados.some((a) => i < a.fim && fim > a.inicio);

      if (inteira && livre) {
        achados.push({ inicio: i, fim, termo });
        jaMarcado.add(termo.termo);
        break;
      }
      de = i + 1;
    }
  }

  if (achados.length === 0) return [{ tipo: 'texto', texto }];

  achados.sort((a, b) => a.inicio - b.inicio);

  const pedacos: Pedaco[] = [];
  let cursor = 0;
  for (const a of achados) {
    if (a.inicio > cursor) {
      pedacos.push({ tipo: 'texto', texto: texto.slice(cursor, a.inicio) });
    }
    pedacos.push({ tipo: 'termo', texto: texto.slice(a.inicio, a.fim), termo: a.termo });
    cursor = a.fim;
  }
  if (cursor < texto.length) pedacos.push({ tipo: 'texto', texto: texto.slice(cursor) });

  return pedacos;
}

/** Quantos termos distintos este texto explica. Útil pra decidir se vale marcar. */
export const quantosTermos = (pedacos: readonly Pedaco[]): number =>
  new Set(pedacos.filter((p) => p.tipo === 'termo').map((p) => (p as { termo: TermoDoGlossario }).termo.termo)).size;
