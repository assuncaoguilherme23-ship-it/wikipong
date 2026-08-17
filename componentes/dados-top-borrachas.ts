/**
 * Ponte do top 5 por família. O JSON é curado; a ORDEM é derivada aqui, pela
 * régua de `popularidade.ts` — assim ninguém consegue "arrumar" um ranking
 * reordenando linha de arquivo.
 */
import dados from '@/dados/top-borrachas.json';
import { MATERIAIS, MEDIA_DO_CATALOGO, type MaterialCatalogo } from './dados-materiais';
import { usoDoMaterial, type UsoAtual } from './dados-uso-atual';
import { chaveDeRelevancia, compararRelevancia, type Familia } from '@/src/logica/popularidade';

export interface EscolhaDoTop {
  material: MaterialCatalogo;
  familia: Familia;
  /** Qual sinal colocou esta borracha na lista — a tela mostra isso. */
  porQueEntrou: 'uso' | 'nota';
  /** Em que evidência a classificação de família se apoia. */
  familiaPorque: string;
  uso?: UsoAtual;
}

const porId = new Map(MATERIAIS.map((m) => [m.id, m]));

const TODAS: EscolhaDoTop[] = (dados.itens as {
  materialId: string; familia: string; porQueEntrou: string; familiaPorque: string;
}[])
  .map((i): EscolhaDoTop | null => {
    const material = porId.get(i.materialId);
    /* Item apontando pra id que não existe é erro de colheita, não estado
       normal — some da lista em vez de virar cartão vazio na tela. */
    if (!material) return null;
    return {
      material,
      familia: i.familia as Familia,
      porQueEntrou: i.porQueEntrou as 'uso' | 'nota',
      familiaPorque: i.familiaPorque,
      uso: usoDoMaterial(i.materialId),
    };
  })
  .filter((x): x is EscolhaDoTop => x !== null);

/** As escolhas de uma família, já na ordem da régua. */
export const topDaFamilia = (f: Familia): EscolhaDoTop[] =>
  TODAS.filter((x) => x.familia === f).sort((a, b) =>
    compararRelevancia(
      chaveDeRelevancia(a.material, MEDIA_DO_CATALOGO),
      chaveDeRelevancia(b.material, MEDIA_DO_CATALOGO),
    ),
  );

export const CONSULTADO_EM_TOP = dados.consultadoEm;
export const QUANTAS_NO_TOP = TODAS.length;
