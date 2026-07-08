/**
 * SEO por rota (SSG): o /quiz é interativo (client), mas o título/descrição são
 * gerados no build por este layout de servidor. Outro ganho concreto do Next (D-17).
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fazer o teste',
  description:
    'Responda três perguntas e descubra o perfil de equipamento que combina com o seu jogo.',
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children;
}
