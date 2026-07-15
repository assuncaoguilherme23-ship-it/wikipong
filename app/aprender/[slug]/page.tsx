/**
 * WikiPong · /aprender/[slug] — um guia (SSG, uma página por guia).
 * generateStaticParams + metadata por guia = conteúdo indexável (SEO) e corpus
 * do assistente IA (D-10). "Continue aprendendo" cross-linka os demais guias.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { GUIAS, guiaPorSlug } from '../guias';
import estilos from '../aprender.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIAS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = guiaPorSlug(slug);
  if (!g) return {};
  return { title: g.titulo, description: g.resumo };
}

export default async function PaginaGuia({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guia = guiaPorSlug(slug);
  if (!guia) notFound();

  const outros = GUIAS.filter((g) => g.slug !== guia.slug);

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <article className={estilos.artigo}>
          <p className="trilha">
            <Link href="/aprender/">Aprender</Link> / {guia.titulo}
          </p>
          <h1 className={estilos.artigoTitulo}>{guia.titulo}</h1>
          <p className={`mono ${estilos.artigoMeta}`}>{guia.minutos} min de leitura</p>

          <div className={estilos.prosa}>{guia.corpo}</div>

          <nav className={estilos.continuar} aria-label="Continue aprendendo">
            <p className={estilos.continuarTitulo}>Continue aprendendo</p>
            <ul className={estilos.continuarLista}>
              {outros.map((g) => (
                <li key={g.slug}>
                  <Link href={`/aprender/${g.slug}/`}>{g.titulo}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </article>
      </main>

      <Rodape />
    </>
  );
}
