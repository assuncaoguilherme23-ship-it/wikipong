/**
 * WikiPong · /marcas — índice das marcas do catálogo (SSG).
 * A lista é derivada dos materiais: marca sem material não aparece (D-16).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { MARCAS } from '@/componentes/dados-marcas';
import { brl } from '@/componentes/formato';
import estilos from './marcas.module.css';

export const metadata: Metadata = {
  title: 'Marcas de tênis de mesa',
  description:
    'Butterfly, Stiga, DHS, Tibhar, Xiom, Yasaka, Donic e Palio. O que cada marca faz, os materiais no catálogo e a régua de dureza que cada uma usa.',
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
              <Link href={`/marcas/${m.slug}/`} className={estilos.cartao}>
                <div className={estilos.cartaoTopo}>
                  <h2 className={estilos.nome}>{m.nome}</h2>
                  {m.editorial && <span className={`mono ${estilos.pais}`}>{m.editorial.pais}</span>}
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
