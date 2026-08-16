/**
 * WikiPong · O cartão mesa de um jogador
 * ------------------------------------------------------------------------------
 * POR QUE ISTO É UM COMPONENTE, e não dois blocos parecidos em duas telas: as
 * páginas `/comunidade/perfil/` e `/comunidade/jogador/` são a MESMA COISA vista
 * de dois lados — o bastidor e a frente. Enquanto eram dois CSS separados, uma
 * ia divergir da outra na primeira mexida, e "é assim que você aparece" viraria
 * mentira sem ninguém notar.
 *
 * Agora a prévia da tela de edição não é uma imitação do perfil público: é o
 * mesmo componente, com os mesmos dados, pintando ao vivo enquanto se digita.
 *
 * A REGRA DA MESA, aplicada a uma pessoa em vez de a uma seção: a cor da
 * identidade carrega superfícies inteiras. E a mesa é INVARIANTE ENTRE TEMAS —
 * o bloco mais carregado das duas páginas tem contraste fixo (medidos: 10.8:1 e
 * 6.7:1) e não precisa ser reconferido no escuro.
 */
'use client';

import type { ReactNode } from 'react';
import { RaqueteRetrato } from './RaqueteRetrato';
import estilos from './CartaoMesaJogador.module.css';

export function CartaoMesaJogador({
  nome,
  nomeVazio,
  tracos = [],
  contexto = [],
  procuro,
  equipamento,
  rodape,
}: {
  nome: string;
  /** O que mostrar quando ainda não há nome — só a tela de edição usa. */
  nomeVazio?: string;
  /** Estilo · nível · mão · empunhadura. A voz mono, porque é dado. */
  tracos?: readonly string[];
  /** Anos de raquete · frequência · clube · cidade. */
  contexto?: readonly string[];
  procuro?: string;
  equipamento: { lamina?: string; fh?: string; bh?: string };
  /** Barra de conta na edição; "este é o seu perfil" no público. */
  rodape?: ReactNode;
}) {
  const semNome = !nome.trim();

  return (
    <div className={estilos.mesa}>
      <div className={estilos.texto}>
        <h1 className={semNome ? estilos.tituloVazio : estilos.titulo}>
          {semNome ? (nomeVazio ?? 'Sem nome ainda') : nome}
        </h1>
        {tracos.length > 0 && <p className={`mono ${estilos.tracos}`}>{tracos.join(' · ')}</p>}
        {contexto.length > 0 && <p className={estilos.contexto}>{contexto.join(' · ')}</p>}
        {procuro && (
          <p className={estilos.procuro}>
            <span className={estilos.procuroRotulo}>procura</span> {procuro}
          </p>
        )}
      </div>

      {/* Devolve null sozinho quando não há peça nenhuma. */}
      <RaqueteRetrato equipamento={equipamento} sobreMesa />

      {rodape && <div className={estilos.rodape}>{rodape}</div>}
    </div>
  );
}
