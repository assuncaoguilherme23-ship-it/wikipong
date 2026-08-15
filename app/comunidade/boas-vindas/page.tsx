import type { Metadata } from 'next';
import { BoasVindasCliente } from './boas-vindas-cliente';

export const metadata: Metadata = {
  title: 'Boas-vindas · WikiPong',
  description: 'Monte seu perfil de jogador em quatro passos.',
};

export default function Pagina() {
  return (
    <main className="conteudo">
      <BoasVindasCliente />
    </main>
  );
}
