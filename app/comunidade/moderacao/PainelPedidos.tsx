/**
 * WikiPong · Moderação dos pedidos de pauta
 * ------------------------------------------------------------------------------
 * Tira o fundador do painel do Supabase para aprovar um pedido. Antes disto,
 * liberar um pedido era abrir o Table Editor e trocar uma palavra numa célula.
 *
 * O QUE ESTA TELA FAZ QUE A DO SUPABASE NÃO FAZ: amarrar o guia por uma LISTA,
 * não por texto livre. O `guia_slug` digitado à mão é a única forma de este
 * recurso quebrar em silêncio — um slug com typo grava sem reclamar, e o pedido
 * fica marcado como atendido apontando para lugar nenhum. Aqui os guias vêm de
 * `guias.tsx`, então o que não existe não aparece pra escolher.
 *
 * Sem estado próprio: quem carrega e grava é a tela de moderação. É ela que
 * precisa da contagem para pôr no rótulo da aba, e uma lista carregada duas
 * vezes daria duas contagens que podem discordar.
 */
'use client';

import Link from 'next/link';
import { type PedidoDePauta } from '@/src/logica/pedidos-pauta';
import { GUIAS } from '@/app/aprender/guias';
import estilos from './moderacao.module.css';

const ROTULO: Record<PedidoDePauta['status'], string> = {
  pendente: 'esperando',
  aprovado: 'no ar',
  removido: 'removido',
};

const quando = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export function PainelPedidos({
  pedidos,
  erro,
  aoModerar,
  aoAmarrarGuia,
}: {
  pedidos: PedidoDePauta[] | null;
  erro: string | null;
  aoModerar: (id: string, status: PedidoDePauta['status']) => void;
  aoAmarrarGuia: (id: string, guiaSlug: string | null) => void;
}) {
  if (pedidos === null) {
    return (
      <>
        {erro && <p className={estilos.impedidaTitulo}>{erro}</p>}
        <p className={estilos.carregando}>Carregando pedidos…</p>
      </>
    );
  }

  if (pedidos.length === 0) {
    return (
      <>
        {erro && <p className={estilos.impedidaTitulo}>{erro}</p>}
        <p className={estilos.vazio}>
          <strong>Nenhum pedido ainda.</strong> Quando alguém pedir um guia em{' '}
          <Link href="/aprender/">Aprender</Link>, ele cai aqui esperando você.
        </p>
      </>
    );
  }

  const esperando = pedidos.filter((p) => p.status === 'pendente').length;

  return (
    <>
      {erro && <p className={estilos.impedidaTitulo}>{erro}</p>}

      <p className={estilos.nota}>
        {esperando === 0
          ? 'Nenhum pedido esperando — os de baixo já foram decididos.'
          : `${esperando} ${esperando === 1 ? 'pedido espera' : 'pedidos esperam'} sua decisão.`}{' '}
        <strong>Publicar</strong> faz o pedido aparecer no fim da página Aprender. Escolher o guia
        é o que avisa quem pediu que foi atendido.
      </p>

      <ul className={estilos.lista}>
        {pedidos.map((p) => (
          <li key={p.id} className={`${estilos.item} ${estilos[p.status]}`}>
            <div className={estilos.cabecalho}>
              <p className={estilos.autor}>{p.autor}</p>
              <span className={`mono ${estilos.situacao}`}>{ROTULO[p.status]}</span>
            </div>

            <p className={estilos.temaPedido}>{p.tema}</p>
            {p.detalhe && <p className={estilos.texto}>{p.detalhe}</p>}
            <p className={estilos.sobre}>{quando(p.criadoEm)}</p>

            <label className={estilos.amarrar}>
              <span className={estilos.amarrarRotulo}>Já virou guia?</span>
              <select
                value={p.guiaSlug ?? ''}
                onChange={(e) => aoAmarrarGuia(p.id, e.target.value || null)}
              >
                <option value="">ainda não</option>
                {GUIAS.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.titulo}
                  </option>
                ))}
              </select>
            </label>

            <div className={estilos.acoes}>
              {p.status !== 'aprovado' && (
                <button
                  type="button"
                  className="botao-primario"
                  onClick={() => aoModerar(p.id, 'aprovado')}
                >
                  Publicar
                </button>
              )}
              {p.status !== 'removido' && (
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={() => aoModerar(p.id, 'removido')}
                >
                  Remover
                </button>
              )}
              {p.status !== 'pendente' && (
                <button
                  type="button"
                  className={estilos.linkAcao}
                  onClick={() => aoModerar(p.id, 'pendente')}
                >
                  voltar pra fila
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
