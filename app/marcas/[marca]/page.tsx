/**
 * WikiPong · /marcas/[marca] — página por marca (SSG).
 *
 * Existe por distribuição: "borracha butterfly" é busca real, e hoje o site não
 * tinha onde receber essa visita. Mas não é página de SEO vazia — quase tudo
 * aqui é DERIVADO do que já foi colhido (materiais, faixa de preço real, régua
 * de dureza declarada, quais pros usam). O editorial é curto e restrito a fato
 * amplamente documentado (D-02/D-16).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { FotoProduto } from '@/componentes/FotoProduto';
import { MARCAS, marcaPorSlug } from '@/componentes/dados-marcas';
import { brl } from '@/componentes/formato';
import { ESCALAS } from '@/src/logica/escalas';
import estilos from './marca.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return MARCAS.map((m) => ({ marca: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ marca: string }>;
}): Promise<Metadata> {
  const { marca } = await params;
  const m = marcaPorSlug(marca);
  if (!m) return {};
  return {
    title: `${m.nome} — materiais, preços e fichas técnicas`,
    description:
      `Todos os materiais ${m.nome} do catálogo do WikiPong: ficha padronizada, preço real conferido ` +
      `e tradução em português claro. ${m.editorial?.descricao ?? ''}`.trim(),
  };
}

export default async function PaginaMarca({ params }: { params: Promise<{ marca: string }> }) {
  const { marca } = await params;
  const m = marcaPorSlug(marca);
  if (!m) notFound();

  const tipos = [...new Set(m.materiais.map((x) => x.tipo))];

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <p className="trilha">
          <Link href="/catalogo/">Materiais</Link> / <Link href="/marcas/">Marcas</Link> / {m.nome}
        </p>
        <h1 className={estilos.titulo}>{m.nome}</h1>

        {m.editorial && (
          <>
            <p className={`mono ${estilos.pais}`}>{m.editorial.pais}</p>
            <p className={estilos.lede}>{m.editorial.descricao}</p>
          </>
        )}

        {/* Números DERIVADOS — nenhum digitado à mão */}
        <dl className={estilos.numeros}>
          <div className={estilos.numero}>
            <dd className="mono">{m.materiais.length}</dd>
            <dt>{m.materiais.length === 1 ? 'material no catálogo' : 'materiais no catálogo'}</dt>
          </div>
          <div className={estilos.numero}>
            <dd className="mono">{brl(m.precoMin)}</dd>
            <dt>a partir de</dt>
          </div>
          <div className={estilos.numero}>
            <dd className="mono">{tipos.length}</dd>
            <dt>{tipos.length === 1 ? 'tipo' : 'tipos'}: {tipos.join(', ').toLowerCase()}</dt>
          </div>
        </dl>

        {/* Materiais da marca */}
        <section className={estilos.secao} aria-labelledby="titulo-materiais">
          <h2 id="titulo-materiais" className={estilos.tituloSecao}>
            Materiais {m.nome}
          </h2>
          <ul className={estilos.grade}>
            {m.materiais.map((mat) => (
              <li key={mat.id}>
                <Link href={`/materiais/${mat.id}/`} className={estilos.cartao}>
                  <FotoProduto id={mat.id} nome={mat.nome} tipo={mat.tipo} tamanho={56} />
                  <span className={estilos.cartaoTexto}>
                    <span className={estilos.cartaoNome}>{mat.nome}</span>
                    <span className={`mono ${estilos.cartaoMeta}`}>
                      {mat.tipo} · {mat.nivel}
                    </span>
                  </span>
                  <span className={`mono ${estilos.cartaoPreco}`}>{brl(mat.preco)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className={estilos.verTodos}>
            <Link href={`/catalogo/?marca=${m.slug}`}>
              Ver no catálogo com filtros e comparação →
            </Link>
          </p>
        </section>

        {/* A régua de dureza que a marca usa — o gancho para o tradutor */}
        {m.escalas.length > 0 && (
          <section className={estilos.secao} aria-labelledby="titulo-escala">
            <h2 id="titulo-escala" className={estilos.tituloSecao}>
              Como a {m.nome} mede dureza
            </h2>
            <p className={estilos.texto}>
              As fichas da {m.nome} no catálogo declaram dureza na régua{' '}
              <strong>
                {m.escalas
                  .map((e) => ESCALAS.find((x) => x.id === e)?.nome ?? e.toUpperCase())
                  .join(' e ')}
              </strong>
              . Isso importa: o mesmo número em réguas diferentes é dureza diferente.{' '}
              <Link href="/escalas/">Traduzir uma dureza →</Link>
            </p>
          </section>
        )}

        {/* Quem usa nos profissionais (derivado do dado de setups) */}
        {m.profissionais.length > 0 && (
          <section className={estilos.secao} aria-labelledby="titulo-pros">
            <h2 id="titulo-pros" className={estilos.tituloSecao}>
              Profissionais que usam {m.nome}
            </h2>
            <ul className={estilos.pros}>
              {m.profissionais.map((p) => (
                <li key={p.id}>
                  <Link href={`/profissionais/#${p.id}`} className={estilos.pro}>
                    <span aria-hidden="true">{p.bandeira}</span>
                    <span>{p.nome}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {m.editorial && (
          <p className={estilos.oficial}>
            Site oficial:{' '}
            <a href={m.editorial.site} target="_blank" rel="nofollow noopener">
              {new URL(m.editorial.site).hostname.replace(/^www\./, '')} ↗
            </a>
            <span className={estilos.oficialNota}>
              O WikiPong não é ligado à {m.nome} nem a nenhuma marca — as fichas são
              independentes.
            </span>
          </p>
        )}
      </main>

      <Rodape />
    </>
  );
}
