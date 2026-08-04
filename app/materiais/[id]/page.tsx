/**
 * WikiPong · Tela de Detalhe (/materiais/[id]) — SSG, uma página por material
 * ------------------------------------------------------------------------------
 * A ordem das seções é DECLARAÇÃO EDITORIAL (D-14, inviolável):
 *   ficha técnica (fato) → "Em português claro" (tradução) → Onde comprar (ação)
 *   → Comunidade (opinião, rotulada, por último).
 *
 * Ajustes de honestidade (D-16):
 *  · "Onde comprar" está OMITIDA: a entidade `ofertas` (D-13) ainda não existe —
 *    nada de loja fake, preço sem timestamp ou tag PARCEIRO de mentira. A ordem
 *    D-14 reserva o lugar dela entre a tradução e a comunidade quando existir.
 *  · Comunidade renderiza o empty state que ensina (sem estrelas nem reviews
 *    fabricadas — D-11 exige avaliações estruturadas e moderadas).
 *  · Custo/mês não aparece: exige a classe da borracha (tensor/clássica), que o
 *    dado-semente ainda não tem. Perdão* e dureza unificada levam A VALIDAR.
 *
 * Nota D-18: o frame "Tela · Detalhe" (955:9003) do Figma v2 estava inacessível
 * (MCP fora do ar) nesta implementação — estrutura segue D-14 + design system;
 * reconciliar visual quando o MCP voltar.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { Radar } from '@/componentes/Radar';
import { FotoProduto } from '@/componentes/FotoProduto';
import { Bolinhas } from '@/componentes/Bolinhas';
import { FaixaCatalogo } from '@/componentes/FaixaCatalogo';
import { ComparativoSimilares } from '@/componentes/ComparativoSimilares';
import { similares, type Similar } from '@/src/logica/similares';
import { familiaDaLamina, familiaDaBorracha } from '@/src/logica/traduzir';
import { MATERIAIS, materialPorId } from '@/componentes/dados-materiais';
import { brl, dinheiro } from '@/componentes/formato';
import { paraPalavra } from '@/src/logica/metricas';
import { traduzirFicha } from '@/src/logica/traduzir';
import { vereditosDoMaterial, ROTULO_INTENCAO } from '@/src/logica/recomendacao';
import {
  fabricantePorId,
  ROTULO_CONFIANCA,
  dominioDaFonte,
} from '@/componentes/dados-fabricante';
import {
  ofertasDoMaterial,
  precoMedio,
  idDaOferta,
  dataLegivel,
  LOJAS,
  urlDeBusca,
} from '@/componentes/dados-ofertas';
import { profissionaisQueUsam } from '@/componentes/dados-profissionais';
import { sinalDaComunidade, ehFavoritoDaComunidade } from '@/componentes/dados-comunidade';
import { AvaliacoesMaterial } from '@/componentes/AvaliacoesMaterial';
import { DiscussoesDoMaterial } from '@/componentes/DiscussoesDoMaterial';
import { imagemDoMaterial } from '@/componentes/dados-imagens';
import {
  escalaDoTexto,
  primeiroGrau,
  paraESN,
  faixaLegivel,
  sensacao,
} from '@/src/logica/escalas';
import { slug, temDesempenho } from '@/src/logica/filtros';
import { variacao, dataCurta } from '@/componentes/dados-historico';
import estilos from './detalhe.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return MATERIAIS.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const m = materialPorId(id);
  if (!m) return {};
  return {
    title: `${m.nome}: ficha técnica`,
    description: `${m.nome} (${m.marca}, ${m.tipo.toLowerCase()}): ${m.simples.frase}`,
  };
}

/* Não há mais lista fixa de eixos: eles saem de `indices`, que só inclui o que
   o material realmente tem. Uma constante de quatro rótulos aqui foi o que fez o
   radar plotar zero no eixo de efeito das lâminas. */

/**
 * O QUE CADA ÍNDICE MEDE, em uma frase.
 *
 * A ficha mostrava número e palavra e nunca dizia o que o índice É. Quem já sabe
 * não precisa; quem chegou para aprender ficava com "Controle 7,8" e nenhuma
 * pista do que isso governa na mão.
 *
 * As definições vêm do levantamento do fundador (2026-08-03) sobre como as
 * marcas classificam borracha, conferido contra o que o site já publica nos
 * guias — não são invenção desta tela, e por isso não contradizem o Aprender.
 */
const O_QUE_MEDE: Record<'velocidade' | 'spin' | 'controle' | 'durabilidade', string> = {
  velocidade:
    'Quanto a peça devolve a bola por conta própria. Mais velocidade pede gesto mais curto e preciso — sobra menos tempo para corrigir.',
  spin:
    'Quanta rotação a superfície consegue imprimir. É o que faz o topspin curvar e o saque enganar; quem tem muito efeito também sofre mais para devolver o efeito do outro.',
  controle:
    'Facilidade de mandar a bola onde você quer. Anda ao contrário da velocidade: quanto mais rápida a peça, menos ela avisa e menos tempo dá para consertar o gesto.',
  durabilidade:
    'Quanto tempo a peça mantém o que tinha de fábrica antes de gastar. Muda a conta de qual é cara: borracha é consumível, e uma que dura o dobro custa metade por ano.',
};

export default async function PaginaDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = materialPorId(id);
  if (!m) notFound();

  /* Perfil de desempenho é opcional: uma bola não tem velocidade/efeito/controle.
     Sem ele, a ficha pula a tabela de specs, o radar e o Perdão — em vez de
     mostrar zeros ou números inventados (D-16). O resto da página (foto, preço,
     onde comprar, comunidade) continua igual. */
  const comSpecs = temDesempenho(m);

  /* ── OS ÍNDICES QUE ESTE MATERIAL TEM, RÓTULO E VALOR JUNTOS ────────────────
     Duas correções moram aqui.

     A primeira: o eixo de EFEITO recebia `m.specs.spin ?? 0`. Lâmina não tem
     efeito publicado por fonte nenhuma, e um zero no radar não lê como "não se
     aplica" — lê como "efeito nenhum", que é afirmação falsa sobre a peça. Era
     o mesmo defeito que a comparação tinha, e a regra agora é a mesma: eixo só
     existe quando o número existe.

     A segunda: o PERDÃO saiu (2026-08-03). Ele era o quarto eixo e dependia da
     dureza unificada, que existe em 10 materiais de 678. No lugar entrou a
     DURABILIDADE, que já estava no dado.

     Rótulo e valor nascem no mesmo objeto — nunca mais duas listas paralelas. */
  const indices = !comSpecs
    ? []
    : [
        { eixo: 'VEL', rotulo: 'Velocidade', atributo: 'velocidade' as const, valor: m.specs.velocidade },
        ...(m.specs.spin !== undefined
          ? [{ eixo: 'EFE', rotulo: 'Efeito', atributo: 'spin' as const, valor: m.specs.spin }]
          : []),
        { eixo: 'CTR', rotulo: 'Controle', atributo: 'controle' as const, valor: m.specs.controle },
        ...(m.durabilidade !== undefined
          ? [{ eixo: 'DUR', rotulo: 'Durabilidade', atributo: 'durabilidade' as const, valor: m.durabilidade }]
          : []),
      ];
  const eixosFicha = indices.map((i) => i.eixo);
  const valoresFicha = indices.map((i) => i.valor);
  /* Polígono precisa de três vértices para ser forma (mesma regra do /comparar). */
  const temRadarFicha = indices.length >= 3;

  /* ── A RÉGUA DO CATÁLOGO ────────────────────────────────────────────────────
     O radar precisa de três eixos e por isso atende 114 dos 678 materiais e
     NENHUMA das 393 lâminas. Esta régua funciona com um índice só.

     O universo é sempre do MESMO TIPO — comparar velocidade de borracha com a de
     lâmina é o erro que o /comparar já proíbe. O preço entra porque existe em
     678 de 678, e é o que dá gráfico a todo material, inclusive aos que não têm
     spec nenhuma. Moeda estrangeira fica fora da régua de preço pelo mesmo
     motivo de sempre: dólar não se compara com real sem câmbio. */
  const doTipo = MATERIAIS.filter((x) => x.tipo === m.tipo);

  /* ── A MEDIANA DO CATÁLOGO, DESENHADA ATRÁS ─────────────────────────────────
     Um polígono sozinho é forma sem régua: dá para ver que um lado é maior que o
     outro e não dá para saber se o material é rápido ou lento PARA O QUE EXISTE.
     Radar é bom em comparar duas formas — era isso que ele fazia no /comparar e
     não fazia aqui.

     Agora a segunda série é a mediana dos materiais do mesmo tipo. O desenho
     passa a responder "8,2 é muito?" sem texto nenhum: onde o sólido ultrapassa
     o tracejado, este material está acima do comum.

     MEDIANA e não média, de propósito: preço e specs têm cauda longa (uma
     Hurricane National de US$ 800 puxaria a média de um jeito que não descreve
     o catálogo). Mediana é o material do meio da fila. */
  const medianaDe = (valores: number[]): number | null => {
    if (valores.length < 8) return null;
    const ord = [...valores].sort((a, b) => a - b);
    const meio = Math.floor(ord.length / 2);
    return ord.length % 2 ? ord[meio] : (ord[meio - 1] + ord[meio]) / 2;
  };
  const valoresMedianos = indices.map((i) =>
    medianaDe(
      doTipo
        .map((x) => (i.atributo === 'durabilidade' ? x.durabilidade : x.specs?.[i.atributo]))
        .filter((v): v is number => v !== undefined),
    ),
  );
  /* Só desenha a referência se TODOS os eixos tiverem mediana: um polígono com
     um vértice caído no zero mentiria sobre aquele eixo. */
  const temMediana = valoresMedianos.every((v) => v !== null);

  /* ── PARECIDOS COM ESTE ─────────────────────────────────────────────────────
     A mediana e a régua respondem "8,2 é muito?". Nenhuma responde a seguinte,
     que é a que faz alguém abrir a ficha: E O QUE MAIS EXISTE PARECIDO? Mediana
     não tem nome, não tem preço e não se compra.

     A família da construção entra no cálculo porque, para os 470 sem índice
     nenhum, é o único sinal real que sobra além do preço — madeira pura e fibra
     externa jogam diferente mesmo com o mesmo nível na etiqueta. */
  const paraSimilar = (x: (typeof MATERIAIS)[number]): Similar => {
    const f = fabricantePorId(x.id)?.ficha;
    const familia = !f
      ? null
      : /mina/i.test(x.tipo)
        ? familiaDaLamina(f)
        : x.tipo === 'Borracha'
          ? familiaDaBorracha(f)
          : null;
    return {
      id: x.id, nome: x.nome, tipo: x.tipo, nivel: x.nivel,
      preco: x.preco, moeda: x.moeda, specs: x.specs,
      durabilidade: x.durabilidade, familia,
    };
  };
  const alvoSimilar = paraSimilar(m);
  const parecidos = similares(alvoSimilar, MATERIAIS.map(paraSimilar), 3);
  const linhasFaixa = [
    ...indices.map((i) => ({
      rotulo: i.rotulo,
      rotuloFrase: i.rotulo.toLowerCase(),
      valor: i.valor,
      universo: doTipo
        .map((x) => (i.atributo === 'durabilidade' ? x.durabilidade : x.specs?.[i.atributo]))
        .filter((v): v is number => v !== undefined),
      formato: (v: number) => v.toFixed(1),
    })),
    ...(m.moeda === undefined
      ? [{
          rotulo: 'Preço',
          rotuloFrase: 'preço',
          valor: m.preco,
          universo: doTipo.filter((x) => x.moeda === undefined).map((x) => x.preco),
          formato: (v: number) => brl(v),
        }]
      : []),
  ];

  // Dado sincero: os presets do quiz rodados contra ESTE material (recomendacao.ts)
  const vereditos = vereditosDoMaterial(m);

  // Fato de fonte externa (dados/fabricantes.json) — separado da nossa derivação
  const fab = fabricantePorId(m.id);

  /* A ficha do fabricante traduzida para linguagem de gente. É o que dá conteúdo
     real à seção "Em português claro" nos 470 materiais sem perfil de
     desempenho — antes ela repetia a prosa de colheita. Ver src/logica/traduzir. */
  const leitura = traduzirFicha(m.tipo, fab?.ficha);

  // Ofertas reais (D-13). Preço médio é DERIVADO delas; sem oferta, o valor da
  // semente é exibido como estimativa — nunca como preço apurado (D-16).
  const ofertas = ofertasDoMaterial(m.id);
  const medio = precoMedio(m.id);

  // Uso reverso (D-18/TTD): quais profissionais usam este material — link p/ /profissionais
  const usos = profissionaisQueUsam(m.id);

  // Sinal da comunidade externa (Revspin) — opinião rotulada, seção Comunidade (D-19 f2)
  const sinal = sinalDaComunidade(m.id);

  // Imagem oficial do produto (com crédito) — hero da ficha; sem ela, o Glifo
  const imagem = imagemDoMaterial(m.id);

  /* Tradução de dureza (D-09): só existe quando a ficha do FABRICANTE declara o
     grau E a régua, e a régua não é a de referência. Sem os dois, não traduzimos
     — seria chute com cara de conversão. */
  const linhaDureza = fab?.ficha?.find((l) => /dureza/i.test(l.rotulo));
  const grauFab = linhaDureza ? primeiroGrau(linhaDureza.valor) : null;
  const escalaFab = linhaDureza ? escalaDoTexto(linhaDureza.valor) : null;
  const traducao =
    grauFab !== null && escalaFab !== null && escalaFab !== 'esn'
      ? { faixa: paraESN(grauFab, escalaFab), grau: grauFab, escala: escalaFab }
      : null;

  // Ficha técnica (fato): número + tradução lado a lado (D-08, mesmo dado canônico)
  const ficha = comSpecs
    ? [
        { rotulo: 'Velocidade', valor: m.specs.velocidade, palavra: paraPalavra('velocidade', m.specs.velocidade) },
        ...(m.specs.spin !== undefined
          ? [{ rotulo: 'Spin (efeito)', valor: m.specs.spin, palavra: paraPalavra('spin', m.specs.spin) }]
          : []),
        { rotulo: 'Controle', valor: m.specs.controle, palavra: paraPalavra('controle', m.specs.controle) },
        // Durabilidade só entra quando há fonte: lâmina não tem número publicado.
        ...(m.durabilidade !== undefined
          ? [{ rotulo: 'Durabilidade', valor: m.durabilidade,
               palavra: paraPalavra('durabilidade', m.durabilidade) }]
          : []),
      ]
    : [];

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <p className="trilha">
          <Link href="/">Início</Link> / <Link href="/catalogo/">Materiais</Link> / {m.nome}
        </p>

        {/* ── Cabeçalho do material ── */}
        <header className={estilos.topo}>
          <span className={estilos.topoMidia}>
            <FotoProduto id={m.id} nome={m.nome} tipo={m.tipo} tamanho={88} />
            {imagem && <span className={estilos.imagemCredito}>imagem: {imagem.fonte}</span>}
          </span>
          <div>
            <h1 className={estilos.nome}>{m.nome}</h1>
            <p className={`mono ${estilos.meta}`}>
              <Link href={`/marcas/${slug(m.marca)}/`} className={estilos.metaMarca}>
                {m.marca}
              </Link>{' '}
              · {m.tipo} · nível {m.nivel}
            </p>
          </div>
          {/* Três casos, e a etiqueta diz qual é (D-16): média de ofertas reais em
              reais; preço conferido lá fora, na moeda de lá; ou estimativa da
              semente. Havia só dois — o do meio entrou com o D-13 emendado. */}
          <p className={`mono ${estilos.preco}`}>
            {medio !== null ? brl(medio) : dinheiro(m.preco, m.moeda)}
            <span className={estilos.precoNota}>
              {medio !== null
                ? `preço médio · ${ofertas.length} ${ofertas.length === 1 ? 'oferta' : 'ofertas'}`
                : m.moeda
                  ? 'conferido fora do Brasil · não se vende aqui'
                  : 'estimativa, sem oferta verificada'}
            </span>
          </p>
        </header>

        {/* ── 1. Ficha técnica (FATO — D-14) ── */}
        {/* Sem perfil de desempenho (ex.: bola), a seção inteira some — tabela de
            zeros e radar vazio seriam pior que ausência (D-16). */}
        {comSpecs && (
        <section className={estilos.ficha} aria-labelledby="titulo-ficha">
          <div className={estilos.fichaTexto}>
            <h2 id="titulo-ficha">Ficha unificada do WikiPong</h2>
            {/* A procedência muda o que a frase pode prometer: número vindo de
                centenas de avaliações não é a mesma coisa que estimativa nossa. */}
            {m.origemSpecs === 'comunidade' && sinal ? (
              <p className={estilos.subtituloFicha}>
                Escala 0 a 10 <strong>nossa</strong>, para permitir comparar marcas diferentes. Estes
                números são a <strong>média de {sinal.avaliacoes} avaliações</strong> da comunidade do {sinal.fonte}, não chute nosso nem o número que a marca usa pra vender (que está logo abaixo, com a fonte).
              </p>
            ) : (
              <p className={estilos.subtituloFicha}>
                Escala 0 a 10 <strong>nossa</strong>, para permitir comparar marcas diferentes. os
                números abaixo são <strong>estimativa</strong>, não o dado oficial do fabricante
                (que está logo abaixo, com a fonte).
              </p>
            )}
            <table className={estilos.tabela}>
              <tbody>
                {ficha.map((linha) => (
                  <tr key={linha.rotulo}>
                    <th scope="row">{linha.rotulo}</th>
                    <td>
                      <span className={`mono ${estilos.valor}`}>{linha.valor.toFixed(1)}</span>
                      {linha.palavra && <span className={estilos.palavra}>{linha.palavra}</span>}
                    </td>
                  </tr>
                ))}
                {m.durezaUnificada !== undefined && (
                <tr>
                  <th scope="row">Dureza unificada*</th>
                  <td>
                    <span className={`mono ${estilos.valor}`}>{m.durezaUnificada}°</span>
                    {/* Procedência à vista: convertida da ficha do fabricante ou
                        estimativa nossa. As duas coisas não valem o mesmo (D-16). */}
                    <span className={estilos.palavra}>
                      {m.origemDureza === 'fabricante' && m.durezaFabricante
                        ? `convertida de ${m.durezaFabricante.grau}° ${m.durezaFabricante.escala.toUpperCase()}`
                        : 'estimativa, o fabricante não publica a régua'}
                    </span>
                  </td>
                </tr>
                )}
              </tbody>
            </table>
            {/* ── O QUE CADA NÚMERO MEDE ────────────────────────────────────
                A tabela mostrava número e palavra, e nunca dizia o que o índice
                é. Quem já sabe não precisa; quem chegou aqui pra aprender ficava
                sem. Só entram os índices que ESTE material tem — a lista sai de
                `indices`, a mesma que alimenta a tabela e o radar. */}
            <dl className={estilos.oQueMede}>
              {indices.map((i) => (
                <div key={i.eixo}>
                  <dt>{i.rotulo}</dt>
                  <dd>{O_QUE_MEDE[i.atributo]}</dd>
                </div>
              ))}
            </dl>

            {/* O selo "A validar" saiu daqui (decisão do fundador, 2026-08-04).
                O que ele prometia — o aval de um especialista — não tinha data
                nem responsável, e um aviso permanente de "isto ainda não vale"
                em cima de todo número acaba ensinando o leitor a não confiar em
                nada da página, inclusive no que é fato de fonte.

                O que NÃO sai é a procedência: continua dito que a escala é nossa
                e que o número do fabricante está logo abaixo, com a fonte. Sair
                do hedge não é virar categórico — é parar de pedir desculpa por
                um dado que já se explica. */}
            <p className={estilos.nota}>
              * A escala 0 a 10 é <strong>do WikiPong</strong>, construída para deixar marcas
              diferentes lado a lado. O número que cada fabricante publica, na régua dele, está
              logo abaixo com a fonte e a data da consulta.
            </p>
          </div>

          {temRadarFicha && (
          <figure className={estilos.radarCaixa}>
            <Radar
              id={m.id}
              eixos={eixosFicha}
              series={[
                ...(temMediana
                  ? [{
                      nome: `mediana das ${m.tipo.toLowerCase()}s`,
                      valores: valoresMedianos as number[],
                      variante: 'tracejada' as const,
                    }]
                  : []),
                { nome: m.nome, valores: valoresFicha, variante: 'solida' as const },
              ]}
              animado
              mostrarValores
              legenda={temMediana}
            />
            <figcaption className={`mono ${estilos.radarLegenda}`}>
              {temMediana
                ? `este material contra a mediana das ${doTipo.length} ${m.tipo.toLowerCase()}s do catálogo`
                : 'a impressão digital deste material'}
            </figcaption>
            <Link href={`/comparar/?ids=${m.id}`} className="botao-secundario">
              Comparar com outro material →
            </Link>
          </figure>
          )}
        </section>
        )}

        {/* ── 1b. O que o FABRICANTE publica (fato de fonte externa, D-14) ──
               Valor não confirmado nunca é inventado: mostra "pendente" + a fonte. */}
        {fab && (
          <section className={estilos.fabricante} aria-labelledby="titulo-fabricante">
            <div className={estilos.fabricanteTopo}>
              <h2 id="titulo-fabricante">O que a {m.marca} publica</h2>
              <span
                className={`mono ${estilos.selo} ${
                  fab.confianca === 'pendente' ? estilos.seloPendente : ''
                }`}
              >
                {ROTULO_CONFIANCA[fab.confianca]}
              </span>
            </div>

            {fab.ficha && fab.ficha.length > 0 ? (
              <>
                <dl className={estilos.fabricanteFicha}>
                  {fab.ficha.map((linha) => (
                    <div key={linha.rotulo}>
                      <dt>{linha.rotulo}</dt>
                      <dd>{linha.valor}</dd>
                    </div>
                  ))}
                </dl>
                {/* Tradução da régua: o argumento do site aplicado a ESTE material.
                    "39° DHS" não diz nada a quem só conhece a escala europeia. */}
                {traducao && (
                  <div className={estilos.traducao}>
                    <p className={estilos.traducaoLinha}>
                      <span className={`mono ${estilos.traducaoDe}`}>
                        {traducao.grau}° {traducao.escala.toUpperCase()}
                      </span>
                      <span className={estilos.traducaoSeta} aria-hidden="true">
                        →
                      </span>
                      <span className={`mono ${estilos.traducaoPara}`}>
                        {faixaLegivel(traducao.faixa)} ESN
                      </span>
                    </p>
                    <p className={estilos.traducaoTexto}>
                      Escalas diferentes medem diferente:{' '}
                      <strong>
                        {traducao.grau}° na régua {traducao.escala.toUpperCase()} é{' '}
                        {sensacao((traducao.faixa.min + traducao.faixa.max) / 2).rotulo.toLowerCase()}
                      </strong>
                      , não o que esse número sugere para quem conhece a escala europeia.{' '}
                      <Link href="/escalas/">Traduzir outra dureza →</Link>
                    </p>
                  </div>
                )}
                {fab.ficha.some((l) => l.rotulo.toLowerCase().includes('dureza')) && (
                  <p className={estilos.linkDureza}>
                    <Link href="/aprender/dureza-da-esponja/">
                      O que a dureza muda no seu jogo? →
                    </Link>
                  </p>
                )}
              </>
            ) : (
              <p className={estilos.fabricantePendente}>
                Ainda não confirmamos os números oficiais deste material numa fonte confiável, e preferimos deixar em branco a publicar número que não podemos garantir. Consulte
                a fonte do fabricante abaixo.
              </p>
            )}

            {fab.indices && (
              <div className={estilos.indices}>
                <p className={`mono ${estilos.indicesEscala}`}>{fab.indices.escala}</p>
                <ul className={estilos.indicesLista}>
                  {fab.indices.valores.map((v) => (
                    <li key={v.rotulo}>
                      <span className={`mono ${estilos.indiceValor}`}>{v.valor}</span>
                      <span className={estilos.indiceRotulo}>{v.rotulo}</span>
                    </li>
                  ))}
                </ul>
                <p className={estilos.indicesAviso}>
                  Régua interna da marca. <strong>Não dá pra comparar</strong> com a de outra. É por isso que a ficha unificada acima existe.
                </p>
              </div>
            )}

            {fab.nota && <p className={estilos.fabricanteNota}>{fab.nota}</p>}

            <p className={estilos.fonte}>
              Fonte:{' '}
              <a href={fab.fonte} target="_blank" rel="noopener noreferrer">
                {dominioDaFonte(fab.fonte)} ↗
              </a>{' '}
              <span className={estilos.consultadoEm}>· consultado em {fab.consultadoEm}</span>
            </p>
          </section>
        )}

        {/* ── 2. Em português claro (TRADUÇÃO — D-14/D-08) ────────────────────
            Esta seção é DECLARADA pelo D-14 como a tradução — e para 470 dos
            678 materiais ela não traduzia nada: mostrava a mesma prosa de
            colheita da ficha ("17 avaliações", "R$ 905, a mais cara da Andro"),
            que responde o quanto A GENTE sabe, não o que a peça faz.

            Aqui NÃO entra seletor Simples/Técnico. A página já mostra os dois:
            a ficha acima é o fato, esta seção é a tradução, e o D-14 chama essa
            ordem de inviolável. Um botão que escondesse metade brigaria com ela
            — o modo alternado é feature de CARTÃO, onde não cabem os dois. */}
        <section className={estilos.portuguesClaro} aria-labelledby="titulo-claro">
          <h2 id="titulo-claro">Em português claro</h2>
          <p className={estilos.tag}>
            <b>{m.simples.tag}.</b> {leitura?.resumo || m.simples.frase}
          </p>
          {leitura && leitura.tracos.length > 0 && (
            <ul className={estilos.tracos}>
              {leitura.tracos.map((t) => (
                <li key={t.rotulo}>
                  <b>{t.rotulo}</b> — {t.significa}
                </li>
              ))}
            </ul>
          )}
          {comSpecs && (
            <ul className={estilos.resumoSimples}>
              <li>
                <span>Velocidade</span> <Bolinhas valor={m.specs.velocidade} />{' '}
                {paraPalavra('velocidade', m.specs.velocidade)}
              </li>
              {m.specs.spin !== undefined && (
                <li>
                  <span>Efeito</span> <Bolinhas valor={m.specs.spin} />{' '}
                  {paraPalavra('spin', m.specs.spin)}
                </li>
              )}
              <li>
                <span>Controle</span> <Bolinhas valor={m.specs.controle} />{' '}
                {paraPalavra('controle', m.specs.controle)}
              </li>
            </ul>
          )}
          {/* A procedência fica, mas embaixo e como nota: ela é contexto da
              nossa apuração, não a resposta que o leitor veio buscar. Só
              aparece quando o resumo traduzido assumiu o lugar dela acima. */}
          {leitura?.resumo && (
            <p className={estilos.procedenciaNota}>{m.simples.frase}</p>
          )}
        </section>

        {/* ── 2c. Onde este material cai no catálogo ─────────────────────────
            Depois da tradução e antes de "pra quem é": primeiro o que a peça é,
            depois onde ela cai entre as outras, depois a quem ela serve. */}
        <FaixaCatalogo
          linhas={linhasFaixa}
          universoRotulo={`as ${doTipo.length} ${m.tipo.toLowerCase()}s do catálogo`}
        />

        {/* ── 2d. Parecidos com este (comparação COM NOME) ──────────────────── */}
        <ComparativoSimilares
          alvo={alvoSimilar}
          similares={parecidos}
          indices={[
            { rotulo: 'Velocidade', ler: (x) => x.specs?.velocidade },
            { rotulo: 'Efeito', ler: (x) => x.specs?.spin },
            { rotulo: 'Controle', ler: (x) => x.specs?.controle },
            { rotulo: 'Durabilidade', ler: (x) => x.durabilidade },
          ]}
        />

        {/* ── 2b. Pra quem é — DADO SINCERO: os mesmos presets que o quiz gera,
               rodados contra este material pelo motor de filtros (recomendacao.ts).
               Combina E não-combina aparecem, com o critério aberto (D-02/D-16). ── */}
        <section className={estilos.praQuemE} aria-labelledby="titulo-pra-quem">
          <h2 id="titulo-pra-quem">Pra quem é</h2>
          <dl className={estilos.fichaJogo}>
            <div>
              <dt className={`mono ${estilos.fichaJogoRotulo}`}>Estilo de jogo</dt>
              <dd>{ROTULO_INTENCAO[m.intencao] ?? m.intencao}</dd>
            </div>
            <div>
              <dt className={`mono ${estilos.fichaJogoRotulo}`}>Nível recomendado</dt>
              <dd>{m.nivel}</dd>
            </div>
          </dl>

          <h3 className={estilos.vereditosTitulo}>Combina com o seu perfil do teste?</h3>
          <ul className={estilos.vereditos}>
            {vereditos.map((v) => (
              <li
                key={v.perfil.id}
                className={`${estilos.veredito} ${v.combina ? estilos.combina : ''}`}
              >
                <p className={estilos.vereditoTopo}>
                  <span aria-hidden="true">{v.combina ? '✓' : '✗'}</span>
                  <b>{v.perfil.nome}</b>
                  <span className={estilos.vereditoRotulo}>
                    {v.combina ? 'combina' : 'não combina'}
                  </span>
                </p>
                <ul className={`mono ${estilos.criterios}`}>
                  {v.criterios.map((c) => (
                    <li key={c.rotulo} className={c.atende ? estilos.criterioOk : estilos.criterioFalha}>
                      {c.atende ? '✓' : '✗'} {c.rotulo}: {c.detalhe}
                    </li>
                  ))}
                </ul>
                {v.combina && (
                  <Link href={v.perfil.presetURL} className={estilos.vereditoLink}>
                    Ver todos os materiais deste perfil →
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <p className={estilos.vereditoNota}>
            Calculado pelos mesmos filtros que o teste de perfil gera: critério aberto, não opinião. Não sabe seu perfil? <Link href="/quiz/">Faça o teste</Link> (leva 1 minuto).
          </p>
        </section>

        {/* ── 2c. Quem usa nos profissionais (FATO com fonte — link p/ /profissionais) ──
               Só aparece quando algum pro do nosso dado usa este material (D-16). */}
        {usos.length > 0 && (
          <section className={estilos.quemUsa} aria-labelledby="titulo-quem-usa">
            <h2 id="titulo-quem-usa">Quem usa nos profissionais</h2>
            <ul className={estilos.quemUsaLista}>
              {usos.map((u) => (
                <li key={u.profissional.id}>
                  <Link href={`/profissionais/#${u.profissional.id}`} className={estilos.quemUsaItem}>
                    <span className={estilos.quemUsaBandeira} aria-hidden="true">
                      {u.profissional.bandeira}
                    </span>
                    <span className={estilos.quemUsaNome}>{u.profissional.nome}</span>
                    <span className={`mono ${estilos.quemUsaPapel}`}>{u.papeis.join(' + ')}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className={estilos.quemUsaNota}>
              Lembrando: o profissional usa a versão feita sob medida, não a de loja.{' '}
              <Link href="/profissionais/">Ver todos os setups →</Link>
            </p>
          </section>
        )}

        {/* ── 3. Onde comprar (AÇÃO — D-14) — ordenado por PREÇO, nunca por parceiro ── */}
        <section className={estilos.ondeComprar} aria-labelledby="titulo-comprar">
          <h2 id="titulo-comprar">Onde comprar</h2>

          {ofertas.length > 0 ? (
            <>
              <ol className={estilos.ofertas}>
                {ofertas.map((o) => (
                  <li key={idDaOferta(o)} className={estilos.oferta}>
                    <span className={estilos.ofertaLoja}>
                      {o.loja}
                      {o.parceiro && <span className={`mono ${estilos.tagParceiro}`}>Parceiro</span>}
                    </span>
                    <span className={`mono ${estilos.ofertaPreco}`}>
                      {o.preco !== undefined ? brl(o.preco) : '—'}
                    </span>
                    <span className={`mono ${estilos.ofertaData}`}>
                      {o.preco !== undefined
                        ? `checado em ${dataLegivel(o.atualizadoEm)}`
                        : 'preço na loja'}
                    </span>
                    {/* Histórico do git (D-13): uma checagem NÃO é acompanhamento,
                        e a copy distingue os dois casos em vez de insinuar série. */}
                    {(() => {
                      const v = variacao(m.id, o.loja);
                      if (!v) return null;
                      if (v.observacoes === 1)
                        return (
                          <span className={estilos.historicoUnico}>
                            primeira checagem, ainda sem variação registrada
                          </span>
                        );
                      const subiu = v.delta > 0;
                      return (
                        <span className={estilos.historico}>
                          <span className={subiu ? estilos.historicoAlta : estilos.historicoBaixa}>
                            {subiu ? '▲' : '▼'} {Math.abs(v.percentual)}%
                          </span>{' '}
                          desde {dataCurta(v.primeiro.data)} (era {brl(v.primeiro.preco)}) ·{' '}
                          {v.observacoes} checagens
                        </span>
                      );
                    })()}
                    <a
                      href={`/ir/?o=${idDaOferta(o)}`}
                      className={`botao-secundario ${estilos.ofertaBotao}`}
                      rel="nofollow sponsored"
                    >
                      Ver na loja ↗
                    </a>
                    {o.nota && <span className={estilos.ofertaNota}>{o.nota}</span>}
                  </li>
                ))}
              </ol>
              <p className={estilos.ofertasNota}>
                Ordenado <strong>pelo preço</strong>, sempre. Nunca por quem é parceiro. As lojas
                marcadas como <em>Parceiro</em> nos pagam comissão se você comprar, e isso{' '}
                <strong>não muda a ordem desta lista</strong> nem o que escrevemos na ficha
                técnica, que é independente. As datas são reais: se um preço está velho, ele
                aparece velho.
              </p>
            </>
          ) : (
            <p className={estilos.semOferta}>
              Ainda não conferimos preço deste material em nenhuma loja. Quando conferirmos, cada
              preço aparecerá aqui com a loja e a <strong>data real</strong> da checagem, ordenado pelo preço, não por quem paga. Até lá, o valor no topo desta página é uma{' '}
              <strong>estimativa</strong>, não um preço conferido.
            </p>
          )}

          {/* Diretório: onde PROCURAR. Não afirma estoque nem preço deste item. */}
          <div className={estilos.lojas}>
            <p className={`mono ${estilos.lojasTitulo}`}>Lojas de tênis de mesa no Brasil</p>
            <ul className={estilos.lojasLista}>
              {LOJAS.map((loja) => (
                <li key={loja.id}>
                  <a
                    href={urlDeBusca(loja, `${m.marca} ${m.nome}`)}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className={estilos.loja}
                  >
                    <span className={estilos.lojaNome}>{loja.nome} ↗</span>
                    {loja.nota && <span className={estilos.lojaNota}>{loja.nota}</span>}
                  </a>
                </li>
              ))}
            </ul>
            <p className={estilos.lojasAviso}>
              Este é um <strong>diretório de onde procurar</strong>, não uma lista de ofertas
              conferidas: não verificamos se estas lojas têm este material em estoque nem por
              quanto. Nenhuma delas nos paga. Quando alguma for parceira, isso estará escrito
              aqui, com a tag <em>Parceiro</em>.
            </p>
          </div>
        </section>


        {/* ── 3. Comunidade (OPINIÃO, rotulada, por último — D-14) ──
               Duas vozes DIFERENTES, e a tela nunca as soma:
                 3a. sinal AGREGADO de fora (Revspin), sempre atribuído;
                 3b. as avaliações estruturadas daqui (D-11), com nível, tempo
                     de uso e estilo de quem escreveu.
               Misturar as duas daria uma média sem dono — exatamente a "opinião
               por aí" que o produto existe pra não ser. */}
        <section className={estilos.comunidade} aria-labelledby="titulo-comunidade">
          <h2 id="titulo-comunidade">O que a comunidade acha</h2>

          <h3 className={estilos.subComunidade}>Nota de fora, do {sinal?.fonte ?? 'Revspin'}</h3>
          {sinal ? (
            <>
              {ehFavoritoDaComunidade(m.id) && (
                <p className={`mono ${estilos.seloFavorito}`}>★ Favorito da comunidade</p>
              )}
              <div className={estilos.notaComunidade}>
                <p className={estilos.notaValor}>
                  <span className={`mono ${estilos.notaGrande}`}>
                    {sinal.nota.toFixed(1).replace('.', ',')}
                  </span>
                  <span className={estilos.notaEscala}>/ {sinal.escala}</span>
                </p>
                <p className={estilos.notaMeta}>
                  nota média de <strong>{sinal.avaliacoes.toLocaleString('pt-BR')}</strong>{' '}
                  avaliações no {sinal.fonte}
                </p>
              </div>
              <p className={estilos.comunidadeFonte}>
                Fonte:{' '}
                <a href={sinal.url} target="_blank" rel="nofollow noopener noreferrer">
                  {dominioDaFonte(sinal.url)} ↗
                </a>{' '}
                · consultado em {dataLegivel(sinal.consultadoEm)}
              </p>
              <p className={estilos.comunidadeVazia}>
                Isto é a opinião <strong>somada de gente de fora</strong>, não uma avaliação da
                WikiPong, e fica <em>separada da ficha técnica, que é independente</em>.
              </p>
            </>
          ) : (
            <p className={estilos.comunidadeVazia}>
              Este material não tem nota reunida em fonte de fora. Isso não diz nada sobre ele:
              quer dizer que ninguém agregou avaliações num lugar que a gente possa citar.
            </p>
          )}

          {/* 3b. As nossas (D-11): estruturadas, com o contexto de quem escreveu. */}
          <h3 className={estilos.subComunidade}>Avaliações aqui do WikiPong</h3>
          <AvaliacoesMaterial materialId={m.id} nomeMaterial={m.nome} />

          {/* Fecha o laco topico->material: quem amarrou a discussao a esta ficha
              ve a conversa aqui. Some por inteiro quando nao ha' topico. */}
          <DiscussoesDoMaterial materialId={m.id} />
        </section>
      </main>

      <Rodape />
    </>
  );
}
