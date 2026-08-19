/**
 * WikiPong · /comunidade/nova-senha — destino do link de recuperação.
 *
 * Este endereço precisa estar na lista de URLs permitidas do projeto
 * (Authentication → URL Configuration) e ser o `redirect_to` do template de
 * "Reset password". Se ele não estiver lá, o Supabase manda o e-mail e o link
 * devolve a pessoa na home — sem nada explicando por quê.
 *
 * `noindex`: é uma tela de uma vez só, que não existe sem o link que leva a
 * ela. Indexá-la só produziria resultado de busca que leva a "este link não
 * abre mais".
 */
import type { Metadata } from 'next';
import { NovaSenhaCliente } from './nova-senha-cliente';
import { Pagina } from '@/componentes/Pagina';

export const metadata: Metadata = {
  title: 'Definir uma senha nova · WikiPong',
  description: 'Escolha uma senha nova para a sua conta na WikiPong.',
  robots: { index: false, follow: false },
};

export default function PaginaNovaSenha() {
  return (
    <Pagina semRodape>
      <NovaSenhaCliente />
    </Pagina>
  );
}
