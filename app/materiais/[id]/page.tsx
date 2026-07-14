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
import { Glifo } from '@/componentes/Glifo';
import { Bolinhas } from '@/componentes/Bolinhas';
import { MATERIAIS, materialPorId } from '@/componentes/dados-materiais';
import { brl } from '@/componentes/formato';
import { perdao, paraPalavra } from '@/src/logica/metricas';
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
    title: `${m.nome} — ficha técnica`,
    description: `${m.nome} (${m.marca}, ${m.tipo.toLowerCase()}): ${m.simples.frase}`,
  };
}

const EIXOS = ['VEL', 'EFE', 'CTR', 'PER*'] as const;

export default async function PaginaDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = materialPorId(id);
  if (!m) notFound();

  const perdaoValor = perdao(m.specs, m.durezaUnificada);

  // Ficha técnica (fato): número + tradução lado a lado (D-08, mesmo dado canônico)
  const ficha = [
    { rotulo: 'Velocidade', valor: m.specs.velocidade, palavra: paraPalavra('velocidade', m.specs.velocidade) },
    { rotulo: 'Spin (efeito)', valor: m.specs.spin, palavra: paraPalavra('spin', m.specs.spin) },
    { rotulo: 'Controle', valor: m.specs.controle, palavra: paraPalavra('controle', m.specs.controle) },
    { rotulo: 'Durabilidade', valor: m.durabilidade, palavra: null },
  ];

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
          <Glifo tipo={m.tipo} tamanho={72} />
          <div>
            <h1 className={estilos.nome}>{m.nome}</h1>
            <p className={`mono ${estilos.meta}`}>
              {m.marca} · {m.tipo} · nível {m.nivel}
            </p>
          </div>
          <p className={`mono ${estilos.preco}`}>
            {brl(m.preco)}
            <span className={estilos.precoNota}>preço médio</span>
          </p>
        </header>

        {/* ── 1. Ficha técnica (FATO — D-14) ── */}
        <section className={estilos.ficha} aria-labelledby="titulo-ficha">
          <div className={estilos.fichaTexto}>
            <h2 id="titulo-ficha">Ficha técnica</h2>
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
                <tr>
                  <th scope="row">Dureza unificada*</th>
                  <td>
                    <span className={`mono ${estilos.valor}`}>{m.durezaUnificada}°</span>
                    <span className={estilos.palavra}>escala unificada entre marcas</span>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Perdão*</th>
                  <td>
                    <span className={`mono ${estilos.valor} ${estilos.derivada}`}>
                      {perdaoValor.toFixed(1)}
                    </span>
                    <span className={estilos.palavra}>{paraPalavra('perdao', perdaoValor)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p className={estilos.nota}>
              <span className={estilos.selo}>A validar</span> &nbsp;* Dureza unificada e Perdão são
              propostas v1 com fórmula aberta, pendentes de validação do especialista (D-07/D-09).
            </p>
          </div>

          <figure className={estilos.radarCaixa}>
            <Radar
              eixos={EIXOS}
              series={[
                {
                  nome: m.nome,
                  valores: [m.specs.velocidade, m.specs.spin, m.specs.controle, perdaoValor],
                  variante: 'solida',
                },
              ]}
              animado
              legenda={false}
            />
            <figcaption className={`mono ${estilos.radarLegenda}`}>
              a impressão digital deste material
            </figcaption>
            <Link href={`/comparar/?ids=${m.id}`} className="botao-secundario">
              Comparar com outro material →
            </Link>
          </figure>
        </section>

        {/* ── 2. Em português claro (TRADUÇÃO — D-14/D-08) ── */}
        <section className={estilos.portuguesClaro} aria-labelledby="titulo-claro">
          <h2 id="titulo-claro">Em português claro</h2>
          <p className={estilos.tag}>
            <b>{m.simples.tag}.</b> {m.simples.frase}
          </p>
          <ul className={estilos.resumoSimples}>
            <li>
              <span>Velocidade</span> <Bolinhas valor={m.specs.velocidade} />{' '}
              {paraPalavra('velocidade', m.specs.velocidade)}
            </li>
            <li>
              <span>Efeito</span> <Bolinhas valor={m.specs.spin} /> {paraPalavra('spin', m.specs.spin)}
            </li>
            <li>
              <span>Controle</span> <Bolinhas valor={m.specs.controle} />{' '}
              {paraPalavra('controle', m.specs.controle)}
            </li>
          </ul>
        </section>

        {/* ── (Onde comprar — D-13/D-14 — entra aqui quando a entidade ofertas existir) ── */}

        {/* ── 3. Comunidade (OPINIÃO, rotulada, por último — D-14) ── */}
        <section className={estilos.comunidade} aria-labelledby="titulo-comunidade">
          <h2 id="titulo-comunidade">Avaliações da comunidade</h2>
          <p className={estilos.comunidadeVazia}>
            Ainda não há avaliações deste material. Quando abrirem, serão estruturadas — nível do
            jogador, tempo de uso e nota — e ficarão sempre nesta seção,{' '}
            <em>separada da ficha técnica, que é independente</em>.
          </p>
        </section>
      </main>

      <Rodape />
    </>
  );
}
