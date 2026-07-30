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
  buscar,
  comFaixa,
  comOrdenacao,
  facetas,
  filtroVazio,
  parseQuery,
  serializeQuery,
  slug,
  temDesempenho,
  type Faixa,
  type FiltroEstado,
  type Ordenacao,
} from '@/src/logica/filtros';
import { PALAVRAS, paraPalavra, perdao } from '@/src/logica/metricas';
import { MATERIAIS, type MaterialCatalogo } from '@/componentes/dados-materiais';
import { ehFavoritoDaComunidade } from '@/componentes/dados-comunidade';
import { Bolinhas } from '@/componentes/Bolinhas';
import { brl } from '@/componentes/formato';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { FotoProduto } from '@/componentes/FotoProduto';
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

  /* Busca e seleção-de-comparação são estado de INTERAÇÃO, não de navegação: moram
     em React (resposta imediata a cada tecla/clique) e são ESPELHADOS na URL via
     replaceState — assim continuam compartilháveis e sobrevivem ao refresh (D-12)
     sem encher o histórico de uma entrada por letra digitada. Filtro segue o
     contrário: URL é a fonte, pushState, back-button navega entre filtros. */
  const [termo, setTermo] = useState(() => parametros.get('q') ?? '');
  const [paraComparar, setParaComparar] = useState<string[]>(() =>
    (parametros.get('comparar') ?? '').split(',').filter(Boolean).slice(0, 2),
  );

  // Busca primeiro (reduz o conjunto), facetas e ordenação por cima.
  const resultados = useMemo(() => aplicar(buscar(MATERIAIS, termo), estado), [estado, termo]);
  const grupos = useMemo(() => facetas(MATERIAIS), []);

  /** Monta a URL preservando o que não pertence ao motor de filtros. */
  function montarURL(novo: FiltroEstado, q: string, comparar: string[]) {
    const p = new URLSearchParams(serializeQuery(novo));
    const modoURL = parametros.get('modo');
    if (modoURL) p.set('modo', modoURL);
    if (q.trim()) p.set('q', q.trim());
    if (comparar.length) p.set('comparar', comparar.join(','));
    const qs = p.toString();
    return qs ? `?${qs}` : window.location.pathname;
  }

  // D-12: pushState (entra no histórico) preservando modo, busca e seleção.
  function navegar(novo: FiltroEstado) {
    window.history.pushState(null, '', montarURL(novo, termo, paraComparar));
  }

  function mudarBusca(valor: string) {
    setTermo(valor);
    window.history.replaceState(null, '', montarURL(estado, valor, paraComparar));
  }

  /* Comparar só vale entre o MESMO TIPO (borracha com borracha, lâmina com
     lâmina) e entre materiais que tenham perfil de desempenho. A regra é
     aplicada aqui, na origem, e não só em /comparar — descobrir o erro depois de
     escolher seria pior. `tipoTravado` é o tipo do primeiro selecionado. */
  const tipoTravado =
    paraComparar.length > 0 ? MATERIAIS.find((m) => m.id === paraComparar[0])?.tipo ?? null : null;

  /** Pode entrar na comparação? Diz também POR QUE não, para a UI explicar. */
  function bloqueioDeComparacao(m: MaterialCatalogo): string | null {
    if (paraComparar.includes(m.id)) return null;
    if (!temDesempenho(m)) return 'Sem ficha de desempenho para comparar';
    if (paraComparar.length >= 2) return 'A comparação é de dois materiais';
    if (tipoTravado !== null && m.tipo !== tipoTravado)
      return `Só comparamos ${tipoTravado.toLowerCase()} com ${tipoTravado.toLowerCase()}`;
    return null;
  }

  /** Comparação é de DOIS (é o que /comparar aceita) — o terceiro clique não
   *  some com a seleção em silêncio: os checkboxes livres ficam desabilitados. */
  function alternarComparacao(id: string) {
    const novo = paraComparar.includes(id)
      ? paraComparar.filter((s) => s !== id)
      : paraComparar.length < 2
        ? [...paraComparar, id]
        : paraComparar;
    setParaComparar(novo);
    window.history.replaceState(null, '', montarURL(estado, termo, novo));
  }

  function limparComparacao() {
    setParaComparar([]);
    window.history.replaceState(null, '', montarURL(estado, termo, []));
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
      rotulo: `Velocidade ${estado.velocidade.min} a ${estado.velocidade.max}`,
      aoRemover: () => navegar(comFaixa(estado, 'velocidade', null)),
    });
  if (estado.spin)
    chips.push({
      rotulo: `Efeito ${estado.spin.min} a ${estado.spin.max}`,
      aoRemover: () => navegar(comFaixa(estado, 'spin', null)),
    });
  if (estado.controle)
    chips.push({
      rotulo: `Controle ${estado.controle.min} a ${estado.controle.max}`,
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

        {/* Busca: o caminho de quem JÁ sabe o nome do produto e não quer filtrar. */}
        <div className={estilos.busca}>
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" className={estilos.buscaIcone}>
            <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            className={estilos.buscaCampo}
            value={termo}
            onChange={(e) => mudarBusca(e.target.value)}
            placeholder="Buscar por nome, marca ou tipo…"
            aria-label="Buscar material por nome, marca ou tipo"
          />
          {termo && (
            <button
              type="button"
              className={estilos.buscaLimpar}
              onClick={() => mudarBusca('')}
              aria-label="Limpar busca"
            >
              ×
            </button>
          )}
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
              /* Empty state honesto (D-16): diz o que houve e oferece a saída real —
                 e distingue "sua busca não achou" de "seus filtros não deixam passar". */
              <div className={estilos.vazio}>
                <p className={estilos.vazioTitulo}>
                  {termo
                    ? `Nada encontrado para “${termo}”.`
                    : 'Nenhum material passa por esses filtros.'}
                </p>
                <p>
                  Nada está escondido: o catálogo tem {MATERIAIS.length} itens
                  {termo
                    ? ' e nenhum deles casa com esse termo. Vale tentar só a marca (ex.: Butterfly) ou o tipo (ex.: borracha).'
                    : ' e essa combinação de filtros não deixa nenhum passar.'}
                </p>
                {termo && (
                  <button type="button" className="botao-secundario" onClick={() => mudarBusca('')}>
                    Limpar a busca
                  </button>
                )}
                {temFiltro && (
                  <button type="button" className="botao-secundario" onClick={() => navegar(filtroVazio())}>
                    Limpar os filtros
                  </button>
                )}
              </div>
            ) : (
              <ul className={estilos.grade}>
                {resultados.map((m) => (
                  <CartaoMaterial
                    key={m.id}
                    material={m as MaterialCatalogo}
                    modo={modo}
                    selecionado={paraComparar.includes(m.id)}
                    motivoBloqueio={bloqueioDeComparacao(m as MaterialCatalogo)}
                    aoAlternar={() => alternarComparacao(m.id)}
                  />
                ))}
              </ul>
            )}

            <p className={estilos.notaDerivada}>
              * O Perdão é uma conta nossa, feita a partir dos outros números, e a fórmula fica à vista (versão 1, ainda esperando um especialista conferir; D-09).
            </p>
          </section>
        </div>
      </main>

      {/* Barra de comparação: aparece só com seleção, e diz o que falta pra
          funcionar em vez de oferecer um botão morto (D-16). */}
      {paraComparar.length > 0 && (
        <div className={estilos.barraComparar} role="region" aria-label="Comparação">
          <p className={estilos.barraTexto}>
            <b className="mono">{paraComparar.length}</b> de 2 selecionados
            {paraComparar.length === 1 && (
              <span className={estilos.barraDica}>, escolha mais um pra comparar</span>
            )}
          </p>
          <div className={estilos.barraAcoes}>
            <button type="button" className="botao-secundario" onClick={limparComparacao}>
              Limpar
            </button>
            {paraComparar.length === 2 ? (
              <Link href={`/comparar/?ids=${paraComparar.join(',')}`} className="botao-primario">
                Comparar →
              </Link>
            ) : (
              <button type="button" className="botao-primario" disabled>
                Comparar →
              </button>
            )}
          </div>
        </div>
      )}

      <Rodape />
    </>
  );
}

function CartaoMaterial({
  material: m,
  modo,
  selecionado,
  motivoBloqueio,
  aoAlternar,
}: {
  material: MaterialCatalogo;
  modo: 'simples' | 'tecnico';
  selecionado: boolean;
  /** null = pode selecionar. String = o porquê, mostrado no title do controle. */
  motivoBloqueio: string | null;
  aoAlternar: () => void;
}) {
  /* Nem todo material tem perfil de desempenho (uma bola não tem "controle 9.0").
     Sem ele, o cartão mostra o que É verdade — foto, marca, preço e a frase em
     português claro — em vez de inventar números pra preencher a coluna (D-16). */
  const comSpecs = temDesempenho(m);
  const perdaoValor =
    comSpecs && m.durezaUnificada !== undefined ? perdao(m.specs, m.durezaUnificada) : null;
  const linhas = comSpecs
    ? ([
        ['Velocidade', 'velocidade', m.specs.velocidade],
        // Lâmina não tem efeito: a linha some em vez de mostrar zero.
        ...(m.specs.spin !== undefined
          ? ([['Efeito', 'spin', m.specs.spin]] as const)
          : []),
        ['Controle', 'controle', m.specs.controle],
      ] as const)
    : ([] as const);

  return (
    <li className={`${estilos.itemGrade} ${selecionado ? estilos.itemSelecionado : ''}`}>
    {/* Fora do <Link> de propósito: checkbox dentro de link disputa o clique. */}
    <label
      className={`${estilos.marcarComparar} ${motivoBloqueio ? estilos.marcarBloqueado : ''}`}
      title={motivoBloqueio ?? 'Selecionar para comparar'}
    >
      <input
        type="checkbox"
        checked={selecionado}
        disabled={Boolean(motivoBloqueio)}
        onChange={aoAlternar}
        aria-label={`Comparar ${m.nome}`}
      />
      <span aria-hidden="true">Comparar</span>
    </label>
    <Link href={`/materiais/${m.id}/`} className={estilos.cartao}>
      <div className={estilos.cartaoTopo}>
        <FotoProduto id={m.id} nome={m.nome} tipo={m.tipo} tamanho={56} />
        <div>
          <h3 className={estilos.cartaoNome}>{m.nome}</h3>
          <p className={`mono ${estilos.cartaoMeta}`}>
            {m.marca} · {m.tipo} · {m.nivel}
          </p>
        </div>
      </div>

      {ehFavoritoDaComunidade(m.id) && (
        <p className={`mono ${estilos.seloFavorito}`}>★ Favorito da comunidade</p>
      )}

      {!comSpecs ? (
        /* Sem perfil: só a tradução honesta, sem tabela vazia nem zeros. */
        <p className={estilos.praQuemE}>
          <b>{m.simples.tag}.</b> {m.simples.frase}
        </p>
      ) : modo === 'tecnico' ? (
        <dl className={estilos.specsTecnico}>
          {linhas.map(([rotulo, , valor]) => (
            <div key={rotulo}>
              <dt>{rotulo === 'Efeito' ? 'Spin' : rotulo}</dt>
              <dd className="mono">{valor.toFixed(1)}</dd>
            </div>
          ))}
          {perdaoValor !== null && (
            <div>
              <dt>Perdão*</dt>
              <dd className="mono">{perdaoValor.toFixed(1)}</dd>
            </div>
          )}
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
          {perdaoValor !== null && (
            <p className={estilos.seloPerdao}>{paraPalavra('perdao', perdaoValor)}*</p>
          )}
        </div>
      )}

      <p className={`mono ${estilos.preco}`}>{brl(m.preco)}</p>
    </Link>
    </li>
  );
}
