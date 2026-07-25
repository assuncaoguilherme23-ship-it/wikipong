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
import { useCallback, useEffect, useRef, useState } from 'react';
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

const INTERVALO_MS = 3600;

export function CarrosselHero() {
  const total = ITENS.length;
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [reduzir, setReduzir] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const aplicar = () => setReduzir(mq.matches);
    aplicar();
    mq.addEventListener('change', aplicar);
    return () => mq.removeEventListener('change', aplicar);
  }, []);

  // Giro automático: só quando ninguém está interagindo e quem pediu menos
  // movimento não é ignorado.
  useEffect(() => {
    if (pausado || reduzir || total < 2) return;
    const t = setInterval(() => setIndice((i) => i + 1), INTERVALO_MS);
    return () => clearInterval(t);
  }, [pausado, reduzir, total]);

  const girar = useCallback((delta: number) => setIndice((i) => i + delta), []);

  if (total === 0) return null;

  const passo = 360 / total;
  // Distância circular até a frente — decide o que é visível e clicável.
  const distancia = (i: number) => {
    const bruto = Math.abs(((i - indice) % total + total) % total);
    return Math.min(bruto, total - bruto);
  };
  const frente = ITENS[((indice % total) + total) % total];

  return (
    <div className={estilos.bloco}>
      <div
        className={estilos.palco}
        ref={containerRef}
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onFocusCapture={() => setPausado(true)}
        onBlurCapture={() => setPausado(false)}
      >
        <div
          className={estilos.anel}
          style={{ transform: `translateZ(calc(var(--raio) * -1)) rotateY(${-indice * passo}deg)` }}
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
