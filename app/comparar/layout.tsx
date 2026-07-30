import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comparar materiais',
  description:
    'Compare dois materiais de tênis de mesa lado a lado: radar sobreposto, specs e ' +
    'contas que a gente mostra por inteiro.',
};

export default function CompararLayout({ children }: { children: React.ReactNode }) {
  return children;
}
