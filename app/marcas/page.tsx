/**
 * WikiPong · /marcas — índice das marcas do catálogo (SSG).
 * A lista é derivada dos materiais: marca sem material não aparece (D-16).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { MARCAS } from '@/componentes/dados-marcas';
import { MonogramaMarca } from '@/componentes/MonogramaMarca';
import { brl } from '@/componentes/formato';
import estilos from './marcas.module.css';

export const metadata: Metadata = {
  title: 'Marcas de tênis de mesa',
  description:
    'As 15 marcas do catálogo: o que cada uma faz, de que país vem, quantos materiais tem aqui e a régua de dureza que usa.',
};

export default function PaginaMarcas() {
  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <p className="trilha">
          <Link href="/catalogo/">Materiais</Link> / Marcas
        </p>
        <h1 className={estilos.titulo}>Marcas</h1>
        <p className={estilos.lede}>
          Cada marca mede as coisas na régua dela. Por isso o WikiPong padroniza. Aqui está o
          que cada uma faz e o que ela tem no nosso catálogo.
        </p>

        <ul className={estilos.lista}>
          {MARCAS.map((m) => (
            <li key={m.slug}>
              {/* ── O CARTÃO ────────────────────────────────────────────────
                  Sete das quinze marcas não tinham texto, e o cartão delas ficava
                  com um vão no meio: nome em cima, contagem embaixo e nada entre
                  os dois. As sete foram escritas; o que mudou aqui é a estrutura,
                  para o cartão não depender do texto para ter forma.

                  O monograma dá âncora visual igual em todas — logo real não
                  daria, porque os quinze têm proporções incompatíveis e numa
                  grade uniforme isso vira desalinhamento.

                  O país saiu do canto solto e entrou no monograma como bandeira:
                  em tênis de mesa a origem diz muito, porque borracha alemã e
                  chinesa são escolas diferentes de jogar. */}
              <Link href={`/marcas/${m.slug}/`} className={estilos.cartao}>
                <div className={estilos.cartaoTopo}>
                  <MonogramaMarca nome={m.nome} pais={m.editorial?.pais} />
                  <span className={estilos.identidade}>
                    <h2 className={estilos.nome}>{m.nome}</h2>
                    {m.editorial && (
                      <span className={`mono ${estilos.pais}`}>{m.editorial.pais}</span>
                    )}
                  </span>
                </div>
                {m.editorial && <p className={estilos.descricao}>{m.editorial.descricao}</p>}
                <p className={`mono ${estilos.meta}`}>
                  {m.materiais.length}{' '}
                  {m.materiais.length === 1 ? 'material' : 'materiais'} · a partir de{' '}
                  {brl(m.precoMin)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <Rodape />
    </>
  );
}
