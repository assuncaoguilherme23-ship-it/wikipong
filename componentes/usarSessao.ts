/**
 * WikiPong · Quem está logado, para as telas
 * ------------------------------------------------------------------------------
 * Um gancho só, para nenhuma tela ter que repetir a dança de perguntar a sessão,
 * renovar o token e buscar o usuário.
 *
 * O estado tem TRÊS valores, e a diferença importa:
 *   undefined  ainda perguntando — não pinte nem "entre" nem "olá, fulano"
 *   null       ninguém logado
 *   Usuario    logado
 *
 * Sem o `undefined`, toda tela pisca "entrar" por um instante para quem já está
 * logado. É pequeno e é feio, e some com uma linha.
 */
'use client';

import { useEffect, useState } from 'react';
import { sessaoAtual, usuarioAtual, loginDisponivel, type Usuario } from '@/src/logica/sessao';

export function usarSessao() {
  const [usuario, setUsuario] = useState<Usuario | null | undefined>(undefined);

  useEffect(() => {
    if (!loginDisponivel()) {
      setUsuario(null);
      return;
    }
    let vivo = true;
    sessaoAtual()
      .then((s) => (s ? usuarioAtual(s) : null))
      .then((u) => {
        /* A tela pode ter sido trocada enquanto a rede respondia. */
        if (vivo) setUsuario(u);
      });
    return () => {
      vivo = false;
    };
  }, []);

  return {
    usuario,
    carregando: usuario === undefined,
    logado: Boolean(usuario),
    /* Login só faz sentido quando há servidor. Sem Supabase, a tela nem oferece. */
    disponivel: loginDisponivel(),
  };
}
