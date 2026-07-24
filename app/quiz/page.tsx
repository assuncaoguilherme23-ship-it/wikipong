'use client';

/**
 * WikiPong · /quiz (Client Component)
 * ------------------------------------------------------------------------------
 * Prova de integração da COLHEITA no cliente: dirige a máquina de estados de
 * `src/logica/quiz` (módulo puro, intocado). O estado é IMUTÁVEL — cada resposta
 * devolve um EstadoQuiz novo via `responder`/`voltar`. A UI é só renderização,
 * como a doc do módulo previu.
 *
 * D-12: a tela de resultado leva ao catálogo com os filtros já na URL. O preset é o
 * `presetFinal(estado)` — o preset-base do perfil REFINADO pelas respostas do
 * caminho (orçamento vira filtro de preço, estilo vira faixa, etc.), para que cada
 * resposta conte de verdade. Compartilhável e reproduzível.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LogoCompleto } from '@/componentes/Logo';
import {
  iniciar,
  responder,
  voltar,
  progresso,
  resultado,
  presetFinal,
  TELAS,
  type EstadoQuiz,
} from '@/src/logica/quiz';
import { etiquetasDoPreset } from '@/src/logica/descrever-filtro';
import styles from './quiz.module.css';

export default function QuizPage() {
  const [estado, setEstado] = useState<EstadoQuiz>(iniciar);

  // A11y: quando a tela muda, o foco vai pro título novo — leitores de tela
  // anunciam a pergunta/resultado sem o usuário precisar procurar. Não rouba
  // o foco no primeiro render.
  const tituloRef = useRef<HTMLHeadingElement | null>(null);
  const primeiraTela = useRef(true);
  useEffect(() => {
    if (primeiraTela.current) {
      primeiraTela.current = false;
      return;
    }
    tituloRef.current?.focus();
  }, [estado.atual]);

  const tela = TELAS[estado.atual];
  const prog = progresso(estado);
  const perfil = resultado(estado);
  // Preset refinado pelas respostas do caminho (não só o base do perfil)
  const preset = presetFinal(estado);
  // Leitura humana do preset: etiquetas em português, não a query string crua
  const etiquetas = etiquetasDoPreset(preset ?? perfil?.presetURL ?? '');

  return (
    <div className={styles.wrap}>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <div className={styles.top}>
        <div className={`container ${styles.topRow}`}>
          <Link href="/" className={styles.brand} aria-label="WikiPong — início">
            <LogoCompleto altura={26} />
          </Link>
          <span className="trilha">o teste</span>
        </div>
      </div>

      <main id="conteudo" className={`container ${styles.palco}`}>
        <div className={styles.cartao}>
          {/* Barra de progresso fora do bloco animado: a largura transiciona
              suavemente entre telas em vez de remontar */}
          {tela.tipo === 'pergunta' && prog && (
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
                <div
                  className={styles.barraFill}
                  style={{ transform: `scaleX(${prog.n / prog.total})` }}
                />
              </div>
            </div>
          )}

          {/* key remonta o bloco a cada tela → animação de entrada (reduced-motion ok) */}
          <div key={estado.atual} className={styles.telaAnim}>
            {tela.tipo === 'pergunta' && (
              <>
                <h1 className={styles.pergunta} ref={tituloRef} tabIndex={-1}>
                  {tela.pergunta}
                </h1>

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
                <p className={styles.resultadoLead}>Seu perfil de equipamento:</p>
                <h1 className={styles.perfilNome} ref={tituloRef} tabIndex={-1}>
                  {perfil.nome}
                </h1>
                <p className={styles.perfilDesc}>{perfil.descricao}</p>

                <Link
                  href={preset ?? perfil.presetURL}
                  className={`botao-primario ${styles.ctaResultado}`}
                >
                  Ver materiais deste perfil →
                </Link>

                <div className={styles.preset}>
                  {etiquetas.length > 0 ? (
                    <>
                      <span className={styles.presetRotulo}>
                        O que suas respostas filtraram
                      </span>
                      <ul className={styles.etiquetas}>
                        {etiquetas.map((e) => (
                          <li key={e.rotulo} className={styles.etiqueta}>
                            <span className={styles.etiquetaRotulo}>{e.rotulo}</span>
                            <span className={styles.etiquetaValor}>{e.valor}</span>
                          </li>
                        ))}
                      </ul>
                      <p className={styles.presetNota}>
                        Cada resposta virou um filtro de verdade — o botão acima abre o
                        catálogo já assim.
                      </p>
                    </>
                  ) : (
                    <p className={styles.presetNota}>
                      Sem filtro nenhum: o botão acima abre o <strong>catálogo inteiro</strong>,
                      com o modo Simples ligado pra tudo fazer sentido.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className={`botao-secundario ${styles.refazer}`}
                  onClick={() => setEstado(iniciar)}
                >
                  Refazer o teste
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
