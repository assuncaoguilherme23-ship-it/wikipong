/**
 * WikiPong · A casca de uma página
 * ==============================================================================
 * POR QUE ISTO EXISTE: porque a casca era copiada à mão em toda página, e copiar
 * à mão falha em silêncio. Seis rotas — /competicoes, /top-borrachas e as quatro
 * telas de conta — foram ao ar sem NADA disto, e o defeito só apareceu quando o
 * fundador olhou e perguntou "que layout feio é esse?".
 *
 * Elas escreviam `<main className="conteudo">`. Parece certo e não é: `conteudo`
 * não é classe nenhuma — é o **id** que o link de pular procura. O nome da
 * classe é `container`. O resultado foi uma página sem largura máxima, sem
 * respiro lateral (texto colado na borda da tela), sem cabeçalho, sem rodapé, e
 * com o link de acessibilidade apontando para um alvo que não existia.
 *
 * Quatro coisas que toda página do site tem, e que agora chegam juntas ou não
 * chegam:
 *
 *   1. o link "pular para o conteúdo", primeiro foco do teclado;
 *   2. o cabeçalho;
 *   3. o `<main id="conteudo">` — o id é o alvo do link acima, não decoração;
 *   4. o `container`, que é quem dá largura máxima e respiro lateral.
 *
 * DUAS ROTAS NÃO USAM ISTO, e é de propósito: `/quiz` tem barra própria
 * minimalista (fluxo de conversão) e `/ir` é interstitial de saída. As duas
 * estão na lista de exceções da asserção que guarda esta regra.
 */
import type { ReactNode } from 'react';
import { Cabecalho } from './Cabecalho';
import { Rodape } from './Rodape';

export function Pagina({
  children,
  className,
  /** Rodapé some só onde ele atrapalharia o fluxo (telas de conta, passo a passo). */
  semRodape = false,
}: {
  children: ReactNode;
  className?: string;
  semRodape?: boolean;
}) {
  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={className ? `container ${className}` : 'container'}>
        {children}
      </main>

      {!semRodape && <Rodape />}
    </>
  );
}
