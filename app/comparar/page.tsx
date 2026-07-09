import { Suspense } from 'react';
import { ComparadorCliente } from './comparar-cliente';

/** Casca SSG + Suspense (useSearchParams lê ?ids= no cliente — D-12). */
export default function PaginaComparar() {
  return (
    <Suspense fallback={<p className="container" style={{ paddingBlock: '3rem' }}>Carregando comparação…</p>}>
      <ComparadorCliente />
    </Suspense>
  );
}
