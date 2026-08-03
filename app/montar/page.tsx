import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MontarCliente } from './montar-cliente';
import { CascaFerramenta } from '@/componentes/CascaFerramenta';

/**
 * Casca SSG + cliente em Suspense: useSearchParams (a montagem vive na URL, D-12)
 * exige boundary no export estático.
 */
export const metadata: Metadata = {
  title: 'Monte a sua raquete',
  description:
    'Escolha lâmina e as duas borrachas e veja o preço real somando ao vivo, as specs lado a lado e o que a combinação tem de atenção. Sem nota inventada.',
};

/* O fallback vira o HTML do build no export estático. Enquanto era uma linha de
   "Carregando…", esta página saía com 9,6 KB e NENHUM <h1>. Ver
   componentes/CascaFerramenta. */
export default function PaginaMontar() {
  return (
    <Suspense
      fallback={
        <CascaFerramenta
          titulo="Monte a sua raquete"
          descricao="Raquete de verdade não vem pronta: é uma lâmina e duas borrachas, montadas para você. Aqui você escolhe as três peças e vê o preço real somando ao vivo, as specs lado a lado e o que a combinação tem de atenção. O configurador precisa de JavaScript; enquanto ele carrega, o guia explica como a montagem funciona."
          saidaHref="/aprender/montando-raquete/"
          saidaTexto="Ler o guia de montagem →"
        />
      }
    >
      <MontarCliente />
    </Suspense>
  );
}
