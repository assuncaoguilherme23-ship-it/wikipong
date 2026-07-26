'use client';

/**
 * CarrosselHero — vitrine giratória 3D dos produtos, no hero da home.
 *
 * Por que carrossel aqui é legítimo (e normalmente não é): carrossel vira
 * anti-padrão quando esconde CONTEÚDO que o usuário precisa ler. Aqui ele mostra
 * PRODUTO — prova visual de que isto é uma enciclopédia de equipamento — e cada
 * peça é um link real pra ficha. Ninguém "perde" texto girando.
 *
 * Geometria: um anel em `preserve-3d`; cada item fica em `rotateY(i·passo)
 * translateZ(raio)`, então o da frente vem reto e os laterais chegam angulados
 * (coverflow). A rotação é DISCRETA por índice (não animação infinita), o que dá
 * controle: setas, pausa no hover/foco, e nada gira sem o usuário poder parar.
 *
 * Honestidade de a11y: item fora da frente não fica focável invisível — recebe
 * `aria-hidden` e sai da ordem de tabulação. Quem navega por teclado alcança
 * todos pelas setas. `prefers-reduced-motion` desliga o giro automático (o
 * usuário ainda controla), e o override global mata a duração da transição.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { materialPorId } from './dados-materiais';
import { imagemDoMaterial, caminhoImagem } from './dados-imagens';
import estilos from './CarrosselHero.module.css';

/** Curadoria: mistura borracha, lâmina e raquete pra variedade visual no anel. */
const VITRINE = ['tenergy05', 'viscaria', 'dignics05', 'fzd', 'evolution', 'mxp', 'hurricane'];

/** Resolve id → material + imagem. Item sem foto simplesmente não entra (D-16). */
const ITENS = VITRINE.flatMap((id) => {
  const material = materialPorId(id);
  const imagem = imagemDoMaterial(id);
  return material && imagem ? [{ material, src: caminhoImagem(imagem) }] : [];
});

/* Fluxo quase contínuo: a transição ocupa quase todo o intervalo, então o anel
   está praticamente sempre em movimento — sobra só um respiro de ~300ms em que a
   peça assenta de frente. Clique de seta usa duração curta: transição longa em
   ação manual lê como travamento. */
const INTERVALO_MS = 2400;
const DUR_AUTO = 2100;
const DUR_MANUAL = 600;

export function CarrosselHero() {
  const total = ITENS.length;
  const [indice, setIndice] = useState(0);
  /** A legenda segue quem JÁ chegou à frente (atualiza no fim da transição),
   *  não quem está a caminho — senão o nome troca com a peça ainda saindo. */
  const [indiceLegenda, setIndiceLegenda] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [manual, setManual] = useState(false);
  const [reduzir, setReduzir] = useState(false);
  const timerManual = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const aplicar = () => setReduzir(mq.matches);
    aplicar();
    mq.addEventListener('change', aplicar);
    return () => mq.removeEventListener('change', aplicar);
  }, []);

  // Giro automático: só quando ninguém está interagindo e quem pediu menos
  // movimento não é ignorado. Depende de `indice` de propósito — assim o relógio
  // reinicia a cada avanço (inclusive manual) e a seta nunca é atropelada.
  useEffect(() => {
    if (pausado || reduzir || total < 2) return;
    const t = setTimeout(() => setIndice((i) => i + 1), INTERVALO_MS);
    return () => clearTimeout(t);
  }, [pausado, reduzir, total, indice]);

  useEffect(() => () => {
    if (timerManual.current) clearTimeout(timerManual.current);
  }, []);

  const girar = useCallback((delta: number) => {
    setManual(true);
    setIndice((i) => i + delta);
    if (timerManual.current) clearTimeout(timerManual.current);
    timerManual.current = setTimeout(() => setManual(false), DUR_MANUAL);
  }, []);

  if (total === 0) return null;

  const passo = 360 / total;
  // Distância circular até a frente — decide o que é visível e clicável.
  const distancia = (i: number) => {
    const bruto = Math.abs(((i - indice) % total + total) % total);
    return Math.min(bruto, total - bruto);
  };
  const frente = ITENS[((indiceLegenda % total) + total) % total];

  return (
    /* A pausa mora no BLOCO inteiro (não só no palco): assim passar o mouse pras
       setas já segura o giro, e o clique não é atropelado pelo avanço automático. */
    <div
      className={estilos.bloco}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
    >
      <div className={estilos.palco}>
        <div
          className={estilos.anel}
          onTransitionEnd={() => setIndiceLegenda(indice)}
          style={
            {
              transform: `translateZ(calc(var(--raio) * -1)) rotateY(${-indice * passo}deg)`,
              // Duração e curva viajam como custom properties: o giro do anel e o
              // brilho dos itens andam no MESMO ritmo (senão a peça acende antes
              // de chegar à frente).
              '--dur': `${manual ? DUR_MANUAL : DUR_AUTO}ms`,
              '--curva': manual
                ? 'cubic-bezier(0.22, 1, 0.36, 1)' /* saída rápida: resposta ao clique */
                : 'cubic-bezier(0.45, 0, 0.55, 1)' /* senoidal suave: fluxo sem tranco */,
            } as CSSProperties
          }
        >
          {ITENS.map((item, i) => {
            const d = distancia(i);
            const visivel = d <= 1;
            return (
              <Link
                key={item.material.id}
                href={`/materiais/${item.material.id}/`}
                className={`${estilos.item} ${d === 0 ? estilos.itemFrente : ''}`}
                style={{ transform: `rotateY(${i * passo}deg) translateZ(var(--raio))` }}
                aria-hidden={!visivel}
                tabIndex={visivel ? undefined : -1}
              >
                <img
                  src={item.src}
                  alt={item.material.nome}
                  width={200}
                  height={200}
                  loading={i < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                  className={estilos.foto}
                />
              </Link>
            );
          })}
        </div>
      </div>

      <div className={estilos.controles}>
        <button
          type="button"
          className={estilos.seta}
          onClick={() => girar(-1)}
          aria-label="Material anterior"
        >
          ←
        </button>

        <p className={estilos.legenda}>
          <span className={estilos.legendaNome}>{frente.material.nome}</span>
          <span className={`mono ${estilos.legendaMarca}`}>
            {frente.material.marca} · {frente.material.tipo}
          </span>
        </p>

        <button
          type="button"
          className={estilos.seta}
          onClick={() => girar(1)}
          aria-label="Próximo material"
        >
          →
        </button>
      </div>
    </div>
  );
}
