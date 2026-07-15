import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aprender · Guias de tênis de mesa',
  description:
    'Guias em português claro pra escolher e montar seu equipamento de tênis de mesa: ' +
    'borracha, lâmina, estilos de jogo, regras e manutenção.',
};

export default function AprenderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
