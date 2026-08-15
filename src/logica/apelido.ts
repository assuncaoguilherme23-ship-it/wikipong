/**
 * WikiPong · O endereço do perfil de cada pessoa
 * ------------------------------------------------------------------------------
 * O apelido é gerado UMA VEZ, no primeiro salvamento do perfil, e nunca mais
 * muda. É por isso que o sufixo vem do id do usuário e não do nome: trocar de
 * nome não pode mover o endereço, senão todo link já colado por aí morre.
 *
 * A página mostra sempre o nome atual. Só a URL é congelada.
 */

/** Quantos dígitos do id entram no sufixo, por tentativa. */
const DIGITOS_DO_SUFIXO: readonly number[] = [4, 6, 8];

/** Sem letra nenhuma no nome, o endereço ainda precisa existir. */
const SEM_NOME = 'jogador';

const TAMANHO_MAXIMO_DO_NOME = 32;

/** Minúsculas, sem acento, só letra/número/hífen. */
export function pedaco(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, TAMANHO_MAXIMO_DO_NOME)
    .replace(/-+$/g, '');
}

/**
 * `tentativa` só sobe quando o banco recusa por apelido repetido — o que exige
 * mesmo nome E mesmos dígitos do id. Três tentativas e o erro sobe: laço infinito
 * escondendo um problema de banco é pior que o problema.
 */
export function apelidoDe(nome: string, usuarioId: string, tentativa = 0): string {
  const digitos = DIGITOS_DO_SUFIXO[tentativa] ?? DIGITOS_DO_SUFIXO[DIGITOS_DO_SUFIXO.length - 1];
  const sufixo = usuarioId.replace(/-/g, '').slice(0, digitos);
  const base = pedaco(nome) || SEM_NOME;
  return `${base}-${sufixo}`;
}

export const TENTATIVAS_DE_APELIDO = DIGITOS_DO_SUFIXO.length;
