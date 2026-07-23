/**
 * WikiPong · /noticias — digest de notícias do tênis de mesa (SSG).
 *
 * Modelo honesto (D-19 f3): NÃO republicamos artigo de terceiros. Cada item é um
 * resumo curto na voz da WikiPong + crédito à fonte + link pro original + data
 * real (D-14/D-16). A lista É o produto e leva pra fonte. Instagram e afins, que
 * não conseguimos ler automaticamente, entram por curadoria do fundador.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { NOTICIAS, dataLegivel, dominioDaFonte } from '@/componentes/dados-noticias';
import estilos from './noticias.module.css';

export const metadata: Metadata = {
  title: 'Notícias — WikiPong',
  description:
    'O que está acontecendo no tênis de mesa, com foco no Brasil — resumos com a fonte, a data e o link para o original.',
};

export default function PaginaNoticias() {
  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <p className="trilha">
          <Link href="/">Início</Link> / Notícias
        </p>
        <h1 className={estilos.titulo}>Notícias</h1>
        <p className={estilos.lede}>
          O que está acontecendo no tênis de mesa, com um olho no Brasil. Resumimos cada nota e
          linkamos pro original — a notícia inteira mora na fonte, com a data à mostra.
        </p>

        <ul className={estilos.lista}>
          {NOTICIAS.map((n) => (
            <li key={n.id}>
              <a
                href={n.url}
                className={estilos.item}
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                <p className={`mono ${estilos.meta}`}>
                  <time dateTime={n.publicadoEm}>{dataLegivel(n.publicadoEm)}</time>
                  {n.tag && <span className={estilos.tag}>{n.tag}</span>}
                </p>
                <h2 className={estilos.itemTitulo}>{n.titulo}</h2>
                <p className={estilos.resumo}>{n.resumo}</p>
                <p className={`mono ${estilos.fonte}`}>
                  {n.fonte} · {dominioDaFonte(n.url)} ↗
                </p>
              </a>
            </li>
          ))}
        </ul>

        {/* Honestidade explícita — modelo digest, atribuição, fontes que não lemos (D-14/D-16) */}
        <section className={estilos.nota} aria-labelledby="titulo-nota">
          <h2 id="titulo-nota" className={estilos.notaTitulo}>
            Como esta página funciona
          </h2>
          <p>
            A WikiPong não é um jornal — é uma enciclopédia. Aqui a gente faz um{' '}
            <strong>resumo curto</strong> de cada notícia e <strong>credita e linka</strong> a fonte
            que apurou. Não copiamos o texto nem as imagens de ninguém: quem quiser a matéria
            inteira, clica e vai pra origem.
          </p>
          <p>
            A base inicial vem da <strong>CBTM</strong> (Confederação Brasileira de Tênis de Mesa).
            Notícias de perfis do tênis de mesa brasileiro (inclusive do Instagram) entram por
            curadoria — sempre com crédito, link e a <strong>data real</strong> da publicação. Se
            uma nota está velha, ela aparece velha.
          </p>
          <p className={estilos.notaLinks}>
            <Link href="/profissionais/">O que os profissionais usam →</Link>
            <Link href="/catalogo/">Ver o catálogo →</Link>
          </p>
        </section>
      </main>

      <Rodape />
    </>
  );
}
