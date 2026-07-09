import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catálogo de materiais',
  description:
    'Borrachas, lâminas, raquetes e bolas de tênis de mesa com specs comparáveis, ' +
    'filtros compartilháveis por URL e tradução pra português claro.',
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
