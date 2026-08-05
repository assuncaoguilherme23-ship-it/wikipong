/**
 * WikiPong · Busca de material por texto livre
 * ==============================================================================
 * Extraído do `SeletorMaterial` para poder ser testado: dentro do componente ele
 * vinha acompanhado de CSS e de `FotoProduto`, e o runner de testes não carrega
 * CSS Modules.
 *
 * A REGRA: casa TODOS os termos digitados, em QUALQUER ordem. "boll timo" acha a
 * Timo Boll, e "butterfly alc" acha as ALC da Butterfly sem precisar acertar a
 * sequência exata do nome. Busca que exige ordem obriga a pessoa a saber como o
 * catálogo escreve, que é justamente o que ela não sabe.
 *
 * Acentos são ignorados dos dois lados: quem digita "lamina" acha "Lâmina".
 */

export interface MaterialBuscavel {
  nome: string;
  marca: string;
  tipo: string;
  nivel: string;
}

const DIACRITICOS = /[̀-ͯ]/g;

const semAcento = (s: string): string =>
  s.normalize('NFD').replace(DIACRITICOS, '').toLowerCase();

/** Todos os termos precisam aparecer, em qualquer ordem. Busca vazia devolve tudo. */
export function filtrarPorTexto<T extends MaterialBuscavel>(
  opcoes: readonly T[],
  busca: string,
): T[] {
  const termos = semAcento(busca).split(/\s+/).filter(Boolean);
  if (termos.length === 0) return [...opcoes];
  return opcoes.filter((o) => {
    const alvo = semAcento(`${o.nome} ${o.marca} ${o.tipo} ${o.nivel}`);
    return termos.every((t) => alvo.includes(t));
  });
}
