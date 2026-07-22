import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conjuntos · Montagens recomendadas',
  description:
    'Montagens completas de tênis de mesa: lâmina + duas borrachas, com o porquê de cada ' +
    'combinação e o preço total. Recomendação explicada, nunca imposta.',
};

export default function ConjuntosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
