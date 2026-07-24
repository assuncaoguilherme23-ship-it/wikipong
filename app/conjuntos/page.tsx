/**
 * WikiPong · /conjuntos — montagens recomendadas (SSG).
 *
 * Encarna a tese da landing ("raquete de verdade não vem pronta"): cada conjunto
 * é lâmina + 2 borrachas, com as peças linkando pras fichas reais. Mostra o
 * preço total (soma derivada) e o "por quê" (D-02: recomendação explicada).
 * NÃO publica nota de desempenho combinada — não existe fórmula defensável, e
 * o site não inventa número (D-16). Isso está dito na própria página.
 */
import Link from 'next/link';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { FotoProduto } from '@/componentes/FotoProduto';
import { CONJUNTOS } from '@/componentes/dados-conjuntos';
import { brl } from '@/componentes/formato';
import estilos from './conjuntos.module.css';

export default function PaginaConjuntos() {
  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <p className="trilha">
          <Link href="/catalogo/">Materiais</Link> / Conjuntos
        </p>
        <h1 className={estilos.titulo}>Conjuntos</h1>
        <p className={estilos.lede}>
          Raquete de verdade não vem pronta: é uma lâmina e duas borrachas, escolhidas para o seu
          jogo. Estas são montagens que fazem sentido juntas — com o porquê de cada escolha e o
          preço real de somar as três peças.
        </p>

        <ul className={estilos.lista}>
          {CONJUNTOS.map((c) => (
            <li key={c.id} className={estilos.conjunto}>
              <div className={estilos.cabecalhoConjunto}>
                <div>
                  <h2 className={estilos.nome}>{c.nome}</h2>
                  <p className={estilos.resumo}>{c.resumo}</p>
                </div>
                <p className={estilos.preco}>
                  <span className={`mono ${estilos.precoValor}`}>{brl(c.precoTotal)}</span>
                  <span className={estilos.precoNota}>somando as 3 peças</span>
                </p>
              </div>

              <p className={`mono ${estilos.etiquetas}`}>
                <span className={estilos.etiqueta}>{c.nivel}</span>
                <span className={estilos.etiqueta}>{c.intencao}</span>
              </p>

              <ol className={estilos.pecas}>
                {c.pecas.map((p) => (
                  <li key={p.papel}>
                    <Link href={`/materiais/${p.material.id}/`} className={estilos.peca}>
                      <span className={estilos.pecaGlifo}>
                        <FotoProduto id={p.material.id} nome={p.material.nome} tipo={p.material.tipo} tamanho={40} />
                      </span>
                      <span className={estilos.pecaTexto}>
                        <span className={`mono ${estilos.pecaPapel}`}>{p.papel}</span>
                        <span className={estilos.pecaNome}>{p.material.nome}</span>
                        <span className={estilos.pecaMarca}>{p.material.marca}</span>
                      </span>
                      <span className={`mono ${estilos.pecaPreco}`}>{brl(p.material.preco)}</span>
                    </Link>
                  </li>
                ))}
              </ol>

              <div className={estilos.porque}>
                <p className={`mono ${estilos.porqueTitulo}`}>Por que essa combinação</p>
                <p className={estilos.porqueTexto}>{c.porque}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Honestidade explícita: por que não há nota do conjunto (D-16) */}
        <section className={estilos.nota} aria-labelledby="titulo-nota">
          <h2 id="titulo-nota" className={estilos.notaTitulo}>
            Por que não damos uma nota ao conjunto
          </h2>
          <p>
            Seria fácil publicar uma “velocidade da montagem”. Não publicamos porque não
            saberíamos defendê-la: a lâmina e as duas borrachas <strong>interagem</strong>, cada
            lado faz um trabalho diferente, e o resultado não é soma nem média. Qualquer número aí
            seria invenção com cara de medição.
          </p>
          <p>
            O que dá pra afirmar com honestidade é o que está acima: as specs reais de cada peça
            (com a fonte do fabricante na ficha), a soma dos preços, e o raciocínio da combinação —
            que é opinião editorial, e está rotulada como tal.
          </p>
          <p className={estilos.notaLinks}>
            <Link href="/aprender/montando-raquete/">Guia: montando sua raquete →</Link>
            <Link href="/quiz/">Descobrir meu perfil →</Link>
          </p>
        </section>
      </main>

      <Rodape />
    </>
  );
}
