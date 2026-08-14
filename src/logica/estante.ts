/**
 * WikiPong · A estante — o que a pessoa usou antes, e por que trocou
 * ------------------------------------------------------------------------------
 * É a coisa mais valiosa que existe em fórum de tênis de mesa e que ninguém
 * guarda direito: "saí da Mark V pra Rakza 7 porque queria mais giro no saque".
 * Sem isto, o perfil mostra só o presente.
 *
 * FATO E PROSA MORAM SEPARADOS (D-14). Material e período são verificáveis e
 * aparecem na hora; o motivo é texto livre num lugar público, nasce pendente e
 * só aparece pra terceiro depois de aprovado. O dono vê o próprio motivo
 * sempre — ninguém precisa sentir que o que escreveu sumiu.
 *
 * No banco isso são duas tabelas (`estante` e `estante_motivos`), porque a RLS
 * do Postgres filtra LINHAS e não colunas. Aqui em cima elas viram um objeto só.
 */
import { materialPorId } from '../../componentes/dados-materiais';

export type StatusMotivo = 'pendente' | 'aprovada' | 'descartada';

export interface EntradaDeEstante {
  id: string;
  materialId: string;
  /** ISO `aaaa-mm-dd`. Ausente = a pessoa não lembra, e tudo bem. */
  de?: string;
  /** Ausente = usa até hoje. */
  ate?: string;
  motivo?: string;
  motivoStatus?: StatusMotivo;
}

export const MOTIVO_MINIMO = 10;
export const MOTIVO_MAXIMO = 280;

/**
 * "Em uso hoje" exige pelo menos o início declarado (`de`) e nenhum fim (`ate`).
 * Uma entrada sem `de` NEM `ate` não é "em uso hoje" — é uma entrada sem data
 * nenhuma, e essa é outra categoria (vai pro fim da estante, não pro topo).
 */
export const emUsoHoje = (e: EntradaDeEstante): boolean => e.de !== undefined && !e.ate;

/**
 * Em uso primeiro; depois o mais recente. Sem data nenhuma vai pro fim: colocar
 * no meio seria afirmar uma cronologia que a pessoa não deu.
 */
export function ordenarEstante(es: readonly EntradaDeEstante[]): EntradaDeEstante[] {
  return [...es].sort((a, b) => {
    if (emUsoHoje(a) !== emUsoHoje(b)) return emUsoHoje(a) ? -1 : 1;
    const da = a.ate ?? a.de ?? '';
    const db = b.ate ?? b.de ?? '';
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return db.localeCompare(da);
  });
}

/** Lista de problemas em PT-BR, pronta pra tela. Vazia = pode gravar. */
export function problemasDaEntrada(e: EntradaDeEstante): string[] {
  const problemas: string[] = [];

  if (!materialPorId(e.materialId)) {
    problemas.push('Esse material não está no catálogo.');
  }
  if (e.de && e.ate && e.de > e.ate) {
    problemas.push('A data de início vem depois da de fim.');
  }
  if (e.motivo !== undefined) {
    const t = e.motivo.trim();
    if (t.length > 0 && t.length < MOTIVO_MINIMO) {
      problemas.push(`O motivo precisa de pelo menos ${MOTIVO_MINIMO} caracteres.`);
    }
    if (t.length > MOTIVO_MAXIMO) {
      problemas.push(`O motivo passa de ${MOTIVO_MAXIMO} caracteres — isso já é uma avaliação.`);
    }
  }
  return problemas;
}

/**
 * O que terceiro pode ler. TODA tela pública tem que passar por aqui em vez de
 * ler `.motivo` direto — é esta função que aplica a regra do D-14.
 */
export const motivoVisivel = (e: EntradaDeEstante, souODono: boolean): string | undefined =>
  souODono || e.motivoStatus === 'aprovada' ? e.motivo : undefined;
