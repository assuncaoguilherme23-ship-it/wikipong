/**
 * WikiPong · Recomendação material ↔ perfil do quiz (DADO SINCERO)
 * ------------------------------------------------------------------------------
 * "Combina com o perfil X?" NÃO é opinião editorial: é o resultado determinístico
 * de rodar os MESMOS presets de filtro que o quiz gera (quiz.ts, D-12) contra o
 * material, critério por critério — a mesma semântica do motor do catálogo
 * (filtros.ts). Se o CTA do quiz mostraria o material, aqui diz "combina"; se
 * não mostraria, diz "não combina" e mostra exatamente qual critério reprovou
 * (recomendação explicada, nunca imposta — D-02; honestidade — D-16).
 *
 * Módulo puro (sem DOM, sem framework). A coerência com `aplicar` do motor de
 * filtros é garantida por teste (testes/rodar.ts).
 */
import { TELAS, type Perfil, type TelaResultado } from './quiz';
import { parseQuery, slug, type Faixa, type FiltroEstado, type Material } from './filtros';

export interface VereditoCriterio {
  /** ex.: 'Nível', 'Velocidade' */
  rotulo: string;
  atende: boolean;
  /** ex.: '9.0 — faixa pedida: 3–6' */
  detalhe: string;
}

export interface Veredito {
  perfil: Perfil;
  combina: boolean;
  criterios: VereditoCriterio[];
}

/** O preset tem algum critério de filtro? (o Explorador, de propósito, não tem) */
function temCriterios(estado: FiltroEstado): boolean {
  return (
    estado.niveis.length > 0 ||
    estado.tipos.length > 0 ||
    estado.marcas.length > 0 ||
    estado.velocidade !== null ||
    estado.spin !== null ||
    estado.controle !== null ||
    estado.preco !== null
  );
}

/** Perfis do quiz que de fato filtram (exclui o Explorador — combinaria com tudo). */
export const PERFIS_COM_CRITERIO: readonly Perfil[] = Object.values(TELAS)
  .filter((t): t is TelaResultado => t.tipo === 'resultado')
  .map((t) => t.perfil)
  .filter((p) => temCriterios(parseQuery(p.presetURL)));

/** Valor ausente NUNCA atende a uma faixa: material sem perfil de desempenho
 *  não pode alegar estar dentro de um critério de spec. */
const dentro = (f: Faixa, v: number | undefined): boolean =>
  v !== undefined && v >= f.min && v <= f.max;

const detalheFaixa = (v: number, f: Faixa): string =>
  `${v.toFixed(1)} — faixa pedida: ${f.min}–${f.max}`;

/** Veredito de um material contra um perfil: combina? e por quê, critério a critério. */
export function combinaComPerfil(material: Material, perfil: Perfil): Veredito {
  const estado = parseQuery(perfil.presetURL);
  const criterios: VereditoCriterio[] = [];

  if (estado.niveis.length > 0) {
    const atende = estado.niveis.includes(slug(material.nivel));
    criterios.push({
      rotulo: 'Nível',
      atende,
      detalhe: atende ? material.nivel : `${material.nivel} — pedido: ${estado.niveis.join(' ou ')}`,
    });
  }
  /* Material sem perfil de desempenho (ex.: bola) não pode alegar atender a um
     critério de spec — e o veredito diz POR QUE, em vez de reprovar em silêncio. */
  const SEM_PERFIL = 'não tem ficha de desempenho';
  if (estado.velocidade) {
    criterios.push({
      rotulo: 'Velocidade',
      atende: dentro(estado.velocidade, material.specs?.velocidade),
      detalhe: material.specs
        ? detalheFaixa(material.specs.velocidade, estado.velocidade)
        : SEM_PERFIL,
    });
  }
  if (estado.spin) {
    criterios.push({
      rotulo: 'Efeito',
      atende: dentro(estado.spin, material.specs?.spin),
      detalhe: material.specs ? detalheFaixa(material.specs.spin, estado.spin) : SEM_PERFIL,
    });
  }
  if (estado.controle) {
    criterios.push({
      rotulo: 'Controle',
      atende: dentro(estado.controle, material.specs?.controle),
      detalhe: material.specs
        ? detalheFaixa(material.specs.controle, estado.controle)
        : SEM_PERFIL,
    });
  }
  if (estado.preco) {
    criterios.push({
      rotulo: 'Preço',
      atende: dentro(estado.preco, material.preco),
      detalhe: `R$ ${material.preco} — faixa pedida: ${estado.preco.min}–${estado.preco.max}`,
    });
  }
  if (estado.tipos.length > 0) {
    const atende = estado.tipos.includes(slug(material.tipo));
    criterios.push({ rotulo: 'Tipo', atende, detalhe: material.tipo });
  }
  if (estado.marcas.length > 0) {
    const atende = estado.marcas.includes(slug(material.marca));
    criterios.push({ rotulo: 'Marca', atende, detalhe: material.marca });
  }

  return {
    perfil,
    combina: criterios.length > 0 && criterios.every((c) => c.atende),
    criterios,
  };
}

/** Veredito contra TODOS os perfis com critério (ordem estável do grafo). */
export function vereditosDoMaterial(material: Material): Veredito[] {
  return PERFIS_COM_CRITERIO.map((p) => combinaComPerfil(material, p));
}

/** Rótulo PT do estilo de jogo (campo `intencao` da ficha — dado editorial da semente). */
export const ROTULO_INTENCAO: Readonly<Record<string, string>> = {
  atacar: 'Ataque',
  controlar: 'Controle',
  equilibrado: 'Equilibrado',
};
