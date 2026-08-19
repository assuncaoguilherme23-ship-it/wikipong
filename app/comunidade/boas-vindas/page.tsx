import type { Metadata } from 'next';
import { BoasVindasCliente } from './boas-vindas-cliente';
import { Pagina } from '@/componentes/Pagina';

export const metadata: Metadata = {
  title: 'Boas-vindas · WikiPong',
  description: 'Monte seu perfil de jogador em quatro passos.',
};

export default function PaginaBoasVindas() {
  return (
    <Pagina semRodape>
      <BoasVindasCliente />
    </Pagina>
  );
}
