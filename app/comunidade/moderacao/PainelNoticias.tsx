/**
 * WikiPong · Moderação das notícias que chegaram sozinhas
 * ------------------------------------------------------------------------------
 * O robô traz título, endereço, data e fonte, e o resumo já vem escrito a partir
 * do texto da notícia. Aqui se faz a parte que ele não faz: ler e decidir.
 *
 * O botão de publicar fica DESLIGADO enquanto o resumo não tem corpo — vale
 * também quando o robô não conseguiu escrever e o campo chega vazio. Não é
 * capricho de formulário: é a regra que separa esta seção de um agregador de
 * manchetes, e ela também está no repositório, para quem chamar a função por
 * fora continuar impedido.
 */
'use client';

import { useState } from 'react';
import { RESUMO_MINIMO, type NoticiaRecebida } from '@/src/logica/noticias-fila';
import estilos from './moderacao.module.css';

const quando = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

const ROTULO: Record<NoticiaRecebida['status'], string> = {
  pendente: 'esperando você',
  aprovada: 'no ar',
  descartada: 'descartada',
};

export function PainelNoticias({
  noticias,
  erro,
  semServidor,
  aoAprovar,
  aoDescartar,
  aoDevolver,
}: {
  noticias: NoticiaRecebida[] | null;
  erro: string | null;
  semServidor: boolean;
  aoAprovar: (id: string, resumo: string) => void;
  aoDescartar: (id: string) => void;
  aoDevolver: (id: string) => void;
}) {
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});

  if (semServidor) {
    return (
      <p className={estilos.vazio}>
        A fila de notícias vive no servidor da comunidade, e ele não está ligado nesta versão do
        site.
      </p>
    );
  }
  if (noticias === null) {
    return (
      <>
        {erro && <p className={estilos.impedidaTitulo}>{erro}</p>}
        <p className={estilos.carregando}>Carregando notícias…</p>
      </>
    );
  }
  if (noticias.length === 0) {
    return (
      <>
        {erro && <p className={estilos.impedidaTitulo}>{erro}</p>}
        <p className={estilos.vazio}>
          <strong>Nada na fila.</strong> A rotina busca a CBTM três vezes por dia e deposita aqui o
          que encontrar. Se a migração 012 ainda não rodou, a tabela não existe.
        </p>
      </>
    );
  }

  const aguardando = noticias.filter((n) => n.status === 'pendente').length;

  return (
    <>
      {erro && <p className={estilos.impedidaTitulo}>{erro}</p>}
      <p className={estilos.nota}>
        {aguardando === 0
          ? 'Nada esperando você.'
          : `${aguardando} ${aguardando === 1 ? 'notícia espera' : 'notícias esperam'} sua leitura.`}{' '}
        O resumo já vem escrito a partir do texto da notícia. <strong>Leia antes de publicar</strong> —
        o clique é seu, e é ele que faz o texto virar voz do site. Corrija à vontade: o campo é editável.
      </p>

      <ul className={estilos.lista}>
        {noticias.map((n) => {
          const rascunho = rascunhos[n.id] ?? n.resumo ?? '';
          const curto = rascunho.trim().length < RESUMO_MINIMO;
          return (
            <li key={n.id} className={`${estilos.item} ${n.status === 'descartada' ? estilos.removido : ''}`}>
              <div className={estilos.cabecalho}>
                <p className={estilos.autor}>{n.fonte}</p>
                <span className={`mono ${estilos.situacao}`}>{ROTULO[n.status]}</span>
              </div>

              <p className={estilos.temaPedido}>{n.titulo}</p>
              <p className={estilos.sobre}>
                {quando(n.publicadoEm)} ·{' '}
                <a href={n.url} target="_blank" rel="noopener noreferrer">
                  ler na fonte →
                </a>
              </p>

              <label className={estilos.amarrar}>
                <span className={estilos.amarrarRotulo}>
                  {n.resumo ? 'Resumo escrito automaticamente — revise' : 'Resumo em português'}
                  {` (mínimo ${RESUMO_MINIMO} caracteres)`}
                </span>
              </label>
              <textarea
                className={estilos.resumoEntrada}
                rows={3}
                value={rascunho}
                placeholder="O que essa notícia diz. É isto que a pessoa vai ler no site."
                onChange={(e) => setRascunhos({ ...rascunhos, [n.id]: e.target.value })}
              />

              <div className={estilos.acoes}>
                <button
                  type="button"
                  className="botao-primario"
                  disabled={curto}
                  title={curto ? `Faltam ${RESUMO_MINIMO - rascunho.trim().length} caracteres` : undefined}
                  onClick={() => aoAprovar(n.id, rascunho)}
                >
                  {n.status === 'aprovada' ? 'Salvar e manter no ar' : 'Publicar'}
                </button>
                {n.status !== 'descartada' && (
                  <button type="button" className="botao-secundario" onClick={() => aoDescartar(n.id)}>
                    Descartar
                  </button>
                )}
                {n.status !== 'pendente' && (
                  <button type="button" className={estilos.linkAcao} onClick={() => aoDevolver(n.id)}>
                    voltar pra fila
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
