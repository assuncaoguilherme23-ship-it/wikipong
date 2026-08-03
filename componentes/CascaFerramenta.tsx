/**
 * WikiPong · Casca estática das ferramentas (/comparar, /montar)
 * ==============================================================================
 * POR QUE ESTE ARQUIVO EXISTE
 *
 * As duas páginas são componentes de cliente: leem o estado da URL com
 * `useSearchParams` (D-12), o que obriga um boundary de Suspense no export
 * estático. E o que o build congela no HTML é o FALLBACK desse boundary.
 *
 * Enquanto ele era `<p>Carregando…</p>`, as duas saíam assim:
 *
 *     out/comparar/index.html ... 9.603 bytes, nenhum <h1>
 *     out/montar/index.html   ... 9.661 bytes, nenhum <h1>
 *
 * Página sem `<h1>` é problema em duas frentes de uma vez: quem navega por
 * leitor de tela perde o título da página, e quem indexa recebe um documento sem
 * assunto. Foi o mesmo defeito do `/catalogo`, achado pela varredura do HTML
 * gerado — lá a correção foi renderizar o catálogo de verdade no fallback.
 *
 * ── POR QUE AQUI A RESPOSTA É OUTRA ──────────────────────────────────────────
 *
 * O catálogo é uma LISTA: dava para renderizar 60 materiais reais e resolver
 * conteúdo e SEO juntos. Estas duas são FERRAMENTAS — um comparador e um
 * configurador. Não existe versão estática útil delas: sem JS não há o que
 * comparar nem o que montar.
 *
 * Então o fallback entrega o que é verdade sem JS: o título, o que a ferramenta
 * faz, e um caminho de saída para uma página que funciona. Nada de esqueleto
 * cinza fingindo carregamento de conteúdo que não vem.
 */
import Link from 'next/link';
import { Cabecalho } from './Cabecalho';
import { Rodape } from './Rodape';

export function CascaFerramenta({
  titulo,
  descricao,
  saidaHref,
  saidaTexto,
}: {
  titulo: string;
  descricao: string;
  /** Para onde ir se o JS não carregar — precisa ser página que funcione sem ele. */
  saidaHref: string;
  saidaTexto: string;
}) {
  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className="container" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
        <h1>{titulo}</h1>
        <p style={{ maxWidth: '58ch', textWrap: 'pretty' }}>{descricao}</p>
        <p style={{ marginTop: '1.5rem' }}>
          <Link href={saidaHref}>{saidaTexto}</Link>
        </p>
      </main>

      <Rodape />
    </>
  );
}
