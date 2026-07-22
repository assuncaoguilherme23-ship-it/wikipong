/**
 * WikiPong · /ir?o=<id> — saída rastreável para a loja (D-13, adaptado à D-17).
 *
 * DIVERGÊNCIA REGISTRADA (nota sob D-13): a decisão pede "clique passa pelo
 * próprio servidor → loga → 302". Sob export estático não existe servidor, e uma
 * rota /ir/[id] pré-gerada também não serve — ela exigiria rebuild a cada oferta
 * nova (e nem compila com zero ofertas). Esta é a versão que funciona: UMA página
 * estática que lê a oferta da query string.
 *
 * O que se preserva do espírito da D-13: o link é do NOSSO domínio (o destino
 * pode mudar sem reescrever fichas), a visita é o evento de clique (contável por
 * analytics client-side) e o destino fica VISÍVEL antes de sair (D-16).
 * O que se perde: log próprio no servidor — volta se houver runtime.
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { IrCliente } from './ir-cliente';

/** Rota de saída, não conteúdo: fora do índice. */
export const metadata: Metadata = {
  title: 'Indo para a loja',
  robots: { index: false, follow: false },
};

export default function PaginaIr() {
  return (
    <Suspense fallback={<p className="container" style={{ paddingBlock: '4rem' }}>Carregando…</p>}>
      <IrCliente />
    </Suspense>
  );
}
