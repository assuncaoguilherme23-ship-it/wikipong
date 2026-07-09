'use client';

/**
 * Modo Simples ↔ Técnico (D-08): estado de EXIBIÇÃO, não de filtro — por isso o
 * parseQuery de filtros.ts o ignora de propósito e ele vive aqui.
 *
 * Persistência site-wide (D-08): localStorage. Prioridade na chegada:
 *   1. `?modo=` na URL (ex.: preset do explorador, D-12) — vence e é compartilhável;
 *   2. escolha salva no localStorage;
 *   3. default 'tecnico' (o preset do quiz é quem liga o Simples explicitamente).
 * Ao alternar: salva no localStorage E reflete na URL via replaceState (exibição
 * não gera entrada de histórico; filtros sim — lá é pushState).
 */
import { useEffect, useState } from 'react';

export type Modo = 'simples' | 'tecnico';

const CHAVE = 'wikipong:modo';

const valido = (v: string | null): v is Modo => v === 'simples' || v === 'tecnico';

export function usarModo(modoURL: string | null): [Modo, (m: Modo) => void] {
  const [modo, setModo] = useState<Modo>(valido(modoURL) ? modoURL : 'tecnico');

  // Sem parâmetro na URL, a escolha salva do usuário assume (pós-hidratação,
  // para o HTML estático do build ser determinístico).
  useEffect(() => {
    if (!valido(modoURL)) {
      try {
        const salvo = localStorage.getItem(CHAVE);
        if (valido(salvo)) setModo(salvo);
      } catch {
        /* localStorage indisponível: fica no default */
      }
    } else {
      setModo(modoURL);
    }
  }, [modoURL]);

  const mudar = (novo: Modo) => {
    setModo(novo);
    try {
      localStorage.setItem(CHAVE, novo);
    } catch {
      /* sem persistência, o estado da sessão ainda vale */
    }
    const p = new URLSearchParams(window.location.search);
    p.set('modo', novo);
    window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`);
  };

  return [modo, mudar];
}
