import { Suspense } from 'react';
import { CatalogoCliente } from './catalogo-cliente';
import { CatalogoEstatico } from './catalogo-estatico';

/**
 * Casca SSG + cliente em Suspense: useSearchParams (estado na URL, D-12) exige
 * boundary no export estático. Os filtros são aplicados no cliente a partir da
 * query string.
 *
 * O FALLBACK NÃO É DECORATIVO. No export estático é ele que vira o HTML do
 * build — e enquanto era `<p>Carregando catálogo…</p>`, o `out/catalogo/
 * index.html` saía com 9,6 KB e zero materiais. A página que reúne os 678
 * produtos entregava tela em branco para quem indexa, contra o motivo declarado
 * de ter escolhido Next em vez de SPA (D-17: "SSG por rota, SEO desde o dia 1").
 *
 * Agora o fallback é o catálogo inteiro, renderizado no build. Ver
 * catalogo-estatico.tsx.
 */
export default function PaginaCatalogo() {
  return (
    <Suspense fallback={<CatalogoEstatico />}>
      <CatalogoCliente />
    </Suspense>
  );
}
