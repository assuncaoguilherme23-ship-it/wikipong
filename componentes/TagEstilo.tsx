/**
 * WikiPong · Tag de estilo de jogo
 * ------------------------------------------------------------------------------
 * A etiqueta que aparece embaixo do nome de quem comentou. Não é enfeite de
 * perfil: é o contexto que faz a nota significar alguma coisa.
 *
 * O D-11 já dizia por que, sobre o NÍVEL — "uma Tenergy vale 5★ pro avançado e
 * 2★ pro iniciante; sem contexto, a média mente". O estilo faz o mesmo pelo
 * outro eixo: um defensor dando 2★ numa borracha de ataque não está reprovando
 * a borracha, está dizendo que ela não é pra ele. Sem a tag, essa nota vira
 * ruído; com ela, vira informação.
 *
 * Os três nomes são os do guia /aprender/estilos-de-jogo — a tag LINKA pra lá,
 * porque quem não sabe o que é "all-round" merece descobrir num clique.
 */
import Link from 'next/link';
import { ROTULO_ESTILO, type EstiloJogador } from '@/src/logica/avaliacoes';
import estilos from './TagEstilo.module.css';

/* Um glifo por estilo, desenhado como trajetória de bola sobre a mesa: o ataque
   sobe e desce fechado, o all-round faz o arco médio, a defesa devolve longo e
   baixo. Decorativo (aria-hidden) — quem lê o rótulo já tem a informação. */
const TRACO: Readonly<Record<EstiloJogador, string>> = {
  atacante: 'M1 9 C4 1, 8 1, 11 8',
  allround: 'M1 8 C4 3, 8 3, 11 8',
  defensor: 'M1 7 C4 5, 8 5, 11 7',
};

export function TagEstilo({
  estilo,
  comLink = true,
}: {
  estilo: EstiloJogador;
  comLink?: boolean;
}) {
  const conteudo = (
    <>
      <svg viewBox="0 0 12 10" className={estilos.glifo} aria-hidden="true" focusable="false">
        <path d={TRACO[estilo]} fill="none" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      {ROTULO_ESTILO[estilo]}
    </>
  );

  if (!comLink) {
    return <span className={`mono ${estilos.tag} ${estilos[estilo]}`}>{conteudo}</span>;
  }

  return (
    <Link
      href="/aprender/estilos-de-jogo/"
      className={`mono ${estilos.tag} ${estilos.link} ${estilos[estilo]}`}
      title={`${ROTULO_ESTILO[estilo]} — ver o que significa`}
    >
      {conteudo}
    </Link>
  );
}

/** Nível do jogador. Mesma família visual, peso menor: o estilo é a tag principal. */
export function TagNivel({ nivel }: { nivel: string }) {
  return <span className={`mono ${estilos.tag} ${estilos.nivel}`}>{nivel}</span>;
}
