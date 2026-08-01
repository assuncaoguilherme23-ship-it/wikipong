/**
 * WikiPong · O link da moderação, só para quem modera
 * ------------------------------------------------------------------------------
 * Some para todo mundo que não é administrador — inclusive para quem está
 * logado como usuário comum.
 *
 * O QUE ISTO É E O QUE NÃO É. Isto é ARRUMAÇÃO, não segurança. O site é export
 * estático: a página `/comunidade/moderacao/` continua existindo e qualquer um
 * que digite o endereço chega nela. O que impede um estranho de moderar não é
 * este componente — é o RLS do banco, que só devolve a fila para quem está na
 * tabela `admins` (migração 002). Quem entrar sem ser admin vê a tela dizendo
 * exatamente isso, e nenhum dado vaza.
 *
 * Esconder o link resolve outra coisa, que é real: ferramenta de quem cuida do
 * site não é conteúdo, e não tem por que ocupar espaço na navegação de quem veio
 * ler sobre borracha.
 *
 * Quem responde "você é admin?" é sempre o BANCO, nunca o navegador.
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { sessaoAtual, souAdmin } from '@/src/logica/sessao';

export function LinkModeracao({ className }: { className?: string }) {
  /* undefined = ainda perguntando. Sem isso, o link pisca na tela de todo
     visitante por um instante antes de sumir — o oposto do que se quer. */
  const [admin, setAdmin] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let vivo = true;
    sessaoAtual()
      .then((s) => (s ? souAdmin(s) : false))
      .then((ok) => {
        if (vivo) setAdmin(ok);
      })
      .catch(() => {
        if (vivo) setAdmin(false);
      });
    return () => {
      vivo = false;
    };
  }, []);

  if (admin !== true) return null;

  return (
    <Link href="/comunidade/moderacao/" className={className}>
      Moderação
    </Link>
  );
}
