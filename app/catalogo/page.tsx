import { Suspense } from 'react';
import { CatalogoCliente } from './catalogo-cliente';

/**
 * Casca SSG + cliente em Suspense: useSearchParams (estado na URL, D-12) exige
 * boundary no export estático. O shell estático sai no build; os filtros são
 * aplicados no cliente a partir da query string.
 */
export default function PaginaCatalogo() {
  return (
    <Suspense fallback={<p className="container" style={{ paddingBlock: '3rem' }}>Carregando catálogo…</p>}>
      <CatalogoCliente />
    </Suspense>
  );
}
