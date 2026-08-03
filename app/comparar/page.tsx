import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ComparadorCliente } from './comparar-cliente';
import { CascaFerramenta } from '@/componentes/CascaFerramenta';

/**
 * Casca SSG + Suspense (useSearchParams lê ?ids= no cliente — D-12).
 *
 * O fallback NÃO é decorativo: no export estático é ele que vira o HTML do
 * build. Enquanto era uma linha de "Carregando comparação…", esta página saía
 * com 9,6 KB e NENHUM <h1> — sem título para leitor de tela e sem assunto para
 * quem indexa. Ver componentes/CascaFerramenta.
 */
export const metadata: Metadata = {
  title: 'Comparar materiais',
  description:
    'Dois materiais do mesmo tipo lado a lado: radar sobreposto, tabela de números e a ficha do fabricante traduzida em português claro. Sem vencedor decretado — maior não quer dizer melhor.',
};

export default function PaginaComparar() {
  return (
    <Suspense
      fallback={
        <CascaFerramenta
          titulo="Comparar materiais"
          descricao="Escolha dois materiais do mesmo tipo — borracha com borracha, lâmina com lâmina — e veja os números lado a lado, com a ficha do fabricante traduzida. O comparador precisa de JavaScript para montar; enquanto ele carrega, o catálogo já responde."
          saidaHref="/catalogo/"
          saidaTexto="Ver o catálogo completo →"
        />
      }
    >
      <ComparadorCliente />
    </Suspense>
  );
}
