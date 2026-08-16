/**
 * WikiPong · /comunidade/entrar — casca SSG.
 *
 * O modo (entrar · criar · link · esqueci) vive na query (D-12), e
 * `useSearchParams` exige boundary de Suspense no export estático.
 *
 * O FALLBACK NÃO É DECORATIVO: é ele que vira o HTML congelado no build, e é o
 * que um buscador lê. Por isso ele traz o título e a explicação de verdade —
 * uma linha de "Carregando…" faria esta página existir vazia pro Google.
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EntrarCliente } from './entrar-cliente';

export const metadata: Metadata = {
  title: 'Entrar ou criar conta · WikiPong',
  description:
    'Crie sua conta na WikiPong com e-mail e senha, ou entre por link no e-mail. A conta guarda seu perfil de jogador, sua estante e suas avaliações.',
};

export default function Pagina() {
  return (
    <main className="conteudo">
      <Suspense
        fallback={
          <div style={{ maxWidth: '34rem', margin: '2rem auto' }}>
            <h1>Sua conta no WikiPong</h1>
            <p>
              A conta guarda o seu perfil, a sua estante e as suas avaliações — e leva tudo pra
              qualquer aparelho. Não é obrigatória: o site inteiro funciona sem entrar.
            </p>
          </div>
        }
      >
        <EntrarCliente />
      </Suspense>
    </main>
  );
}
