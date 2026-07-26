import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MontarCliente } from './montar-cliente';

/**
 * Casca SSG + cliente em Suspense: useSearchParams (a montagem vive na URL, D-12)
 * exige boundary no export estático.
 */
export const metadata: Metadata = {
  title: 'Monte a sua raquete',
  description:
    'Escolha lâmina e as duas borrachas e veja o preço real somando ao vivo, as specs lado a lado e o que a combinação tem de atenção. Sem nota inventada.',
};

export default function PaginaMontar() {
  return (
    <Suspense
      fallback={<p className="container" style={{ paddingBlock: '3rem' }}>Carregando…</p>}
    >
      <MontarCliente />
    </Suspense>
  );
}
