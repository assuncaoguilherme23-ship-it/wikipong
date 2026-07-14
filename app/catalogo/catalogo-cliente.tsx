'use client';

/**
 * WikiPong · /catalogo — consome o motor colhido (src/logica/filtros.ts) sem tocá-lo.
 *
 * Arquitetura D-12: a URL é a FONTE ÚNICA DE VERDADE do filtro. Não há useState de
 * filtros — o estado é derivado de useSearchParams via parseQuery; toda mudança vira
 * pushState (back-button navega entre estados de filtro de graça) e o Next ressincroniza
 * useSearchParams com a History API nativa. Sidebar, chips, contagem e grid são todos
 * views derivadas do MESMO estado.
 *
 * D-08: modo Simples/Técnico é exibição (usarModo), nunca filtro.
 * D-16: empty state diz a verdade e oferece saída; nada de sugestão fabricada.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  aplicar,
  alternarFaceta,
  comFaixa,
  comOrdenacao,
  facetas,
  filtroVazio,
  parseQuery,
  serializeQuery,
  slug,
  type Faixa,
  type FiltroEstado,
  type Ordenacao,
} from '@/src/logica/filtros';
import { PALAVRAS, paraPalavra, perdao } from '@/src/logica/metricas';
import { MATERIAIS, type MaterialCatalogo } from '@/componentes/dados-materiais';
import { Bolinhas } from '@/componentes/Bolinhas';
import { brl } from '@/componentes/formato';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { Glifo } from '@/componentes/Glifo';
import { SeletorModo } from '@/componentes/SeletorModo';
import { usarModo } from '@/componentes/usarModo';
import estilos from './catalogo.module.css';

// ── Faixas de atalho derivadas dos limiares do especialista (PALAVRAS, D-07/D-09):
//    a UI não inventa cortes próprios — reusa a tabela validável.
function faixasDe(tabela: readonly { min: number; palavra: string }[]): { rotulo: string; faixa: Faixa }[] {
  return tabela
    .map((f, i) => ({ rotulo: f.palavra, faixa: { min: f.min, max: i === 0 ? 10 : tabela[i - 1].min } }))
    .reverse(); // exibe da mais tranquila pra mais extrema
}
const FAIXAS_VELOCIDADE = faixasDe(PALAVRAS.velocidade);
const FAIXAS_CONTROLE = faixasDe(PALAVRAS.controle);
const FAIXAS_PRECO: { rotulo: string; faixa: Faixa }[] = [
  { rotulo: 'Até R$ 200', faixa: { min: 0, max: 200 } },
  { rotulo: 'Até R$ 500', faixa: { min: 0, max: 500 } },
  { rotulo: 'Até R$ 1.000', faixa: { min: 0, max: 1000 } },
];

const ROTULOS_ORDENACAO: Record<Ordenacao, string> = {
  relevancia: 'Destaques',
  velocidade: 'Mais velocidade',
  spin: 'Mais efeito',
  controle: 'Mais controle',
  perdao: 'Mais perdão*',
  'preco-asc': 'Menor preço',
  'preco-desc': 'Maior preço',
};

const mesmaFaixa = (a: Faixa | null, b: Faixa): boolean => a !== null && a.min === b.min && a.max === b.max;

export function CatalogoCliente() {
  const parametros = useSearchParams();
  const estado = useMemo(() => parseQuery(parametros.toString()), [parametros]);
  const [modo, mudarModo] = usarModo(parametros.get('modo'));
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const resultados = useMemo(() => aplicar(MATERIAIS, estado), [estado]);
  const grupos = useMemo(() => facetas(MATERIAIS), []);

  // D-12: pushState (entra no histórico) preservando o modo de exibição da URL.
  function navegar(novo: FiltroEstado) {
    const p = new URLSearchParams(serializeQuery(novo));
    const modoURL = parametros.get('modo');
    if (modoURL) p.set('modo', modoURL);
    const qs = p.toString();
    window.history.pushState(null, '', qs ? `?${qs}` : window.location.pathname);
  }

  // Contagem anunciada a leitores de tela quando o filtro muda.
  const contagemRef = useRef<HTMLParagraphElement | null>(null);

  const chips: { rotulo: string; aoRemover: () => void }[] = [];
  for (const [campo, ativos, grupo] of [
    ['niveis', estado.niveis, grupos.niveis],
    ['marcas', estado.marcas, grupos.marcas],
    ['tipos', estado.tipos, grupos.tipos],
  ] as const) {
    for (const s of ativos) {
      chips.push({
        rotulo: grupo.find((g) => g.slug === s)?.rotulo ?? s,
        aoRemover: () => navegar(alternarFaceta(estado, campo, s)),
      });
    }
  }
  if (estado.velocidade)
    chips.push({
      rotulo: `Velocidade ${estado.velocidade.min}–${estado.velocidade.max}`,
      aoRemover: () => navegar(comFaixa(estado, 'velocidade', null)),
    });
  if (estado.spin)
    chips.push({
      rotulo: `Efeito ${estado.spin.min}–${estado.spin.max}`,
      aoRemover: () => navegar(comFaixa(estado, 'spin', null)),
    });
  if (estado.controle)
    chips.push({
      rotulo: `Controle ${estado.controle.min}–${estado.controle.max}`,
      aoRemover: () => navegar(comFaixa(estado, 'controle', null)),
    });
  if (estado.preco)
    chips.push({
      rotulo: `Até ${brl(estado.preco.max)}`,
      aoRemover: () => navegar(comFaixa(estado, 'preco', null)),
    });

  const temFiltro = chips.length > 0;

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <div className={estilos.topo}>
          <h1 className={estilos.titulo}>Materiais</h1>
          <SeletorModo modo={modo} aoMudar={mudarModo} />
        </div>

        <div className={estilos.corpo}>
          <button
            type="button"
            className={estilos.alternarFiltros}
            aria-expanded={filtrosAbertos}
            aria-controls="painel-filtros"
            onClick={() => setFiltrosAbertos((v) => !v)}
          >
            Filtros{temFiltro ? ` (${chips.length})` : ''} {filtrosAbertos ? '▴' : '▾'}
          </button>

          <aside
            id="painel-filtros"
            className={`${estilos.filtros} ${filtrosAbertos ? estilos.filtrosAbertos : ''}`}
            aria-label="Filtros"
          >
            {(
              [
                ['Nível', 'niveis', grupos.niveis, estado.niveis],
                ['Marca', 'marcas', grupos.marcas, estado.marcas],
                ['Tipo', 'tipos', grupos.tipos, estado.tipos],
              ] as const
            ).map(([rotulo, campo, opcoes, ativos]) => (
              <fieldset key={campo} className={estilos.grupoFiltro}>
                <legend>{rotulo}</legend>
                {opcoes.map((o) => (
                  <label key={o.slug} className={estilos.opcaoFiltro}>
                    <input
                      type="checkbox"
                      checked={ativos.includes(o.slug)}
                      onChange={() => navegar(alternarFaceta(estado, campo, o.slug))}
                    />
                    <span>{o.rotulo}</span>
                    <span className={`mono ${estilos.contagemFaceta}`}>{o.contagem}</span>
                  </label>
                ))}
              </fieldset>
            ))}

            {(
              [
                ['Velocidade', 'velocidade', FAIXAS_VELOCIDADE, estado.velocidade],
                ['Controle', 'controle', FAIXAS_CONTROLE, estado.controle],
                ['Preço', 'preco', FAIXAS_PRECO, estado.preco],
              ] as const
            ).map(([rotulo, campo, faixasOpcoes, ativa]) => (
              <fieldset key={campo} className={estilos.grupoFiltro}>
                <legend>{rotulo}</legend>
                <div className={estilos.faixaChips}>
                  {faixasOpcoes.map((op) => {
                    const ligada = mesmaFaixa(ativa, op.faixa);
                    return (
                      <button
                        key={op.rotulo}
                        type="button"
                        className={estilos.faixaChip}
                        aria-pressed={ligada}
                        onClick={() => navegar(comFaixa(estado, campo, ligada ? null : op.faixa))}
                      >
                        {op.rotulo}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </aside>

          <section aria-label="Resultados">
            <div className={estilos.barraResultados}>
              <p ref={contagemRef} className={estilos.contagem} aria-live="polite">
                <b className="mono">{resultados.length}</b>{' '}
                {resultados.length === 1 ? 'material encontrado' : 'materiais encontrados'}
              </p>
              <label className={estilos.ordenacao}>
                <span>Ordenar:</span>
                <select
                  value={estado.ordenar}
                  onChange={(e) => navegar(comOrdenacao(estado, e.target.value as Ordenacao))}
                >
                  {Object.entries(ROTULOS_ORDENACAO).map(([valor, rotulo]) => (
                    <option key={valor} value={valor}>
                      {rotulo}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {temFiltro && (
              <div className={estilos.chips}>
                {chips.map((c) => (
                  <button
                    key={c.rotulo}
                    type="button"
                    className={estilos.chip}
                    onClick={c.aoRemover}
                    aria-label={`Remover filtro: ${c.rotulo}`}
                  >
                    {c.rotulo} <span aria-hidden="true">×</span>
                  </button>
                ))}
                <button type="button" className={estilos.limparTudo} onClick={() => navegar(filtroVazio())}>
                  Limpar tudo
                </button>
              </div>
            )}

            {resultados.length === 0 ? (
              /* Empty state honesto (D-16): diz o que houve e oferece a saída real. */
              <div className={estilos.vazio}>
                <p className={estilos.vazioTitulo}>Nenhum material passa por esses filtros.</p>
                <p>
                  Nada está escondido: o catálogo tem {MATERIAIS.length} itens e essa combinação
                  de filtros não deixa nenhum passar.
                </p>
                <button type="button" className="botao-secundario" onClick={() => navegar(filtroVazio())}>
                  Limpar os filtros
                </button>
              </div>
            ) : (
              <ul className={estilos.grade}>
                {resultados.map((m) => (
                  <CartaoMaterial key={m.id} material={m as MaterialCatalogo} modo={modo} />
                ))}
              </ul>
            )}

            <p className={estilos.notaDerivada}>
              * Perdão é métrica derivada com fórmula aberta (proposta v1, pendente de validação
              do especialista — D-09).
            </p>
          </section>
        </div>
      </main>

      <Rodape />
    </>
  );
}

function CartaoMaterial({ material: m, modo }: { material: MaterialCatalogo; modo: 'simples' | 'tecnico' }) {
  const perdaoValor = perdao(m.specs, m.durezaUnificada);
  const linhas = [
    ['Velocidade', 'velocidade', m.specs.velocidade],
    ['Efeito', 'spin', m.specs.spin],
    ['Controle', 'controle', m.specs.controle],
  ] as const;

  return (
    <li>
    <Link href={`/materiais/${m.id}/`} className={estilos.cartao}>
      <div className={estilos.cartaoTopo}>
        <Glifo tipo={m.tipo} tamanho={56} />
        <div>
          <h3 className={estilos.cartaoNome}>{m.nome}</h3>
          <p className={`mono ${estilos.cartaoMeta}`}>
            {m.marca} · {m.tipo} · {m.nivel}
          </p>
        </div>
      </div>

      {modo === 'tecnico' ? (
        <dl className={estilos.specsTecnico}>
          {linhas.map(([rotulo, , valor]) => (
            <div key={rotulo}>
              <dt>{rotulo === 'Efeito' ? 'Spin' : rotulo}</dt>
              <dd className="mono">{valor.toFixed(1)}</dd>
            </div>
          ))}
          <div>
            <dt>Perdão*</dt>
            <dd className="mono">{perdaoValor.toFixed(1)}</dd>
          </div>
        </dl>
      ) : (
        <div className={estilos.specsSimples}>
          {linhas.map(([rotulo, atributo, valor]) => (
            <p key={rotulo} className={estilos.linhaSimples}>
              <span className={estilos.rotuloSimples}>{rotulo}</span>
              <Bolinhas valor={valor} />
              <span className={estilos.palavraSimples}>{paraPalavra(atributo, valor)}</span>
            </p>
          ))}
          <p className={estilos.praQuemE}>
            <b>{m.simples.tag}.</b> {m.simples.frase}
          </p>
          <p className={estilos.seloPerdao}>{paraPalavra('perdao', perdaoValor)}*</p>
        </div>
      )}

      <p className={`mono ${estilos.preco}`}>{brl(m.preco)}</p>
    </Link>
    </li>
  );
}
