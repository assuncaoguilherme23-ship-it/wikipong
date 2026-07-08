'use client';

/**
 * WikiPong · /quiz (Client Component)
 * ------------------------------------------------------------------------------
 * Prova de integração da COLHEITA no cliente: dirige a máquina de estados de
 * `src/logica/quiz` (módulo puro, intocado). O estado é IMUTÁVEL — cada resposta
 * devolve um EstadoQuiz novo via `responder`/`voltar`. A UI é só renderização,
 * como a doc do módulo previu.
 *
 * D-12: a tela de resultado expõe o `presetURL` do perfil (o preset de filtros do
 * catálogo). O catálogo ainda não existe (próxima colheita), então — D-16
 * (lançamento honesto) — mostramos o preset sem fingir um link vivo para /catalogo.
 */
import { useState } from 'react';
import Link from 'next/link';
import {
  iniciar,
  responder,
  voltar,
  progresso,
  resultado,
  TELAS,
  type EstadoQuiz,
} from '@/src/logica/quiz';
import styles from './quiz.module.css';

export default function QuizPage() {
  const [estado, setEstado] = useState<EstadoQuiz>(iniciar);

  const tela = TELAS[estado.atual];
  const prog = progresso(estado);
  const perfil = resultado(estado);

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div className={`container ${styles.topRow}`}>
          <Link href="/" className={styles.brand}>
            Wiki<span>Pong</span>
          </Link>
          <span className="eyebrow">O teste</span>
        </div>
      </div>

      <div className={`container ${styles.palco}`}>
        <div className={styles.cartao}>
          {tela.tipo === 'pergunta' && prog && (
            <>
              <div className={styles.progresso}>
                <span className={styles.progressoRotulo}>{prog.rotulo}</span>
                <div
                  className={styles.barra}
                  role="progressbar"
                  aria-valuenow={prog.n}
                  aria-valuemin={1}
                  aria-valuemax={prog.total}
                  aria-label={prog.rotulo}
                >
                  <div className={styles.barraFill} style={{ width: `${(prog.n / prog.total) * 100}%` }} />
                </div>
              </div>

              <h1 className={styles.pergunta}>{tela.pergunta}</h1>

              <div className={styles.opcoes}>
                {tela.opcoes.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    className={styles.opcao}
                    onClick={() => setEstado((e) => responder(e, op.id))}
                  >
                    <span className={styles.opcaoTitulo}>{op.titulo}</span>
                    {op.sub && <span className={styles.opcaoSub}>{op.sub}</span>}
                  </button>
                ))}
              </div>

              {estado.historico.length > 0 && (
                <button type="button" className={styles.voltar} onClick={() => setEstado(voltar)}>
                  ← Voltar
                </button>
              )}
            </>
          )}

          {tela.tipo === 'resultado' && perfil && (
            <>
              <p className="eyebrow">Seu perfil</p>
              <h1 className={styles.perfilNome}>{perfil.nome}</h1>
              <p className={styles.perfilDesc}>{perfil.descricao}</p>

              <div className={styles.preset}>
                <span className={styles.presetRotulo}>Preset de filtros (D-12)</span>
                <code className={styles.presetURL}>{perfil.presetURL}</code>
                <p className={styles.presetNota}>
                  O catálogo entra na próxima colheita — quando existir, este perfil abre o
                  catálogo já filtrado por este preset.
                </p>
              </div>

              <button type="button" className={styles.refazer} onClick={() => setEstado(iniciar)}>
                Refazer o teste
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
