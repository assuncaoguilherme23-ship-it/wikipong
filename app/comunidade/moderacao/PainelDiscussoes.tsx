/**
 * WikiPong · Moderação dos tópicos e das respostas
 * ------------------------------------------------------------------------------
 * Sem esta aba, ligar o backend do fórum teria criado um fórum onde nada nunca
 * aparece: tudo entra 'pendente' e só sai de lá por decisão de alguém. Era o
 * mesmo buraco dos pedidos de pauta, e a lição é a mesma — backend novo sem tela
 * de moderação é conteúdo enterrado.
 *
 * TÓPICO E RESPOSTA SÃO DECIDIDOS SEPARADAMENTE, e não em bloco. Um tópico
 * legítimo pode receber uma resposta que não presta, e aprovar os dois juntos
 * obrigaria a escolher entre publicar o lixo ou enterrar a pergunta.
 *
 * Sem estado próprio: quem carrega e grava é a tela de moderação, que precisa da
 * contagem para o rótulo da aba.
 */
'use client';

import Link from 'next/link';
import {
  ultimaAtividade, ROTULO_ASSUNTO, type Topico, type StatusTopico,
} from '@/src/logica/discussoes';
import { materialPorId } from '@/componentes/dados-materiais';
import estilos from './moderacao.module.css';

const ROTULO: Record<StatusTopico, string> = {
  pendente: 'esperando',
  aprovado: 'no ar',
  removido: 'removido',
};

const quando = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

/** Situação ausente = modo local, onde tudo já nasce publicado. */
const sit = (s?: StatusTopico): StatusTopico => s ?? 'aprovado';

export function PainelDiscussoes({
  topicos,
  erro,
  aoModerar,
}: {
  topicos: Topico[] | null;
  erro: string | null;
  aoModerar: (id: string, status: StatusTopico, alvo: 'topico' | 'resposta') => void;
}) {
  if (topicos === null) {
    return (
      <>
        {erro && <p className={estilos.impedidaTitulo}>{erro}</p>}
        <p className={estilos.carregando}>Carregando discussões…</p>
      </>
    );
  }

  if (topicos.length === 0) {
    return (
      <>
        {erro && <p className={estilos.impedidaTitulo}>{erro}</p>}
        <p className={estilos.vazio}>
          <strong>Nenhum tópico ainda.</strong> Quando alguém abrir uma discussão em{' '}
          <Link href="/comunidade/discussoes/">Discussões</Link>, ela cai aqui esperando você.
        </p>
      </>
    );
  }

  const esperandoTopicos = topicos.filter((t) => sit(t.status) === 'pendente').length;
  const esperandoRespostas = topicos
    .flatMap((t) => t.respostas)
    .filter((r) => sit(r.status) === 'pendente').length;

  return (
    <>
      {erro && <p className={estilos.impedidaTitulo}>{erro}</p>}

      <p className={estilos.nota}>
        {esperandoTopicos + esperandoRespostas === 0
          ? 'Nada esperando decisão — o que está abaixo já foi decidido.'
          : `${esperandoTopicos} ${esperandoTopicos === 1 ? 'tópico' : 'tópicos'} e ` +
            `${esperandoRespostas} ${esperandoRespostas === 1 ? 'resposta' : 'respostas'} esperando.`}{' '}
        Tópico e resposta se decidem <strong>separadamente</strong>: aprovar a pergunta não
        aprova o que responderam nela.
      </p>

      <ul className={estilos.lista}>
        {topicos.map((t) => {
          const m = t.materialId ? materialPorId(t.materialId) : undefined;
          return (
            <li key={t.id} className={`${estilos.item} ${estilos[sit(t.status)]}`}>
              <div className={estilos.cabecalho}>
                <p className={estilos.autor}>{t.autor}</p>
                <span className={`mono ${estilos.situacao}`}>{ROTULO[sit(t.status)]}</span>
              </div>

              <p className={estilos.sobre}>
                <span className="mono">{ROTULO_ASSUNTO[t.assunto]}</span>
                {m && (
                  <>
                    {' · '}
                    <Link href={`/materiais/${m.id}/`}>{m.nome}</Link>
                  </>
                )}
                {' · '}
                {quando(t.criadoEm)}
                {t.respostas.length > 0 && ` · última atividade em ${quando(ultimaAtividade(t))}`}
              </p>

              <p className={estilos.temaPedido}>{t.titulo}</p>
              <p className={estilos.texto}>{t.texto}</p>

              <div className={estilos.acoes}>
                {sit(t.status) !== 'aprovado' && (
                  <button
                    type="button"
                    className="botao-primario"
                    onClick={() => aoModerar(t.id, 'aprovado', 'topico')}
                  >
                    Publicar
                  </button>
                )}
                {sit(t.status) !== 'removido' && (
                  <button
                    type="button"
                    className="botao-secundario"
                    onClick={() => aoModerar(t.id, 'removido', 'topico')}
                  >
                    Remover
                  </button>
                )}
                {sit(t.status) !== 'pendente' && (
                  <button
                    type="button"
                    className={estilos.linkAcao}
                    onClick={() => aoModerar(t.id, 'pendente', 'topico')}
                  >
                    voltar pra fila
                  </button>
                )}
              </div>

              {t.respostas.length > 0 && (
                <ul className={estilos.respostasModeracao}>
                  {t.respostas.map((r) => (
                    <li key={r.id} className={estilos[sit(r.status)]}>
                      <p className={estilos.sobre}>
                        <strong>{r.autor}</strong> · {quando(r.criadoEm)}{' '}
                        <span className={`mono ${estilos.situacao}`}>{ROTULO[sit(r.status)]}</span>
                      </p>
                      <p className={estilos.texto}>{r.texto}</p>
                      <div className={estilos.acoes}>
                        {sit(r.status) !== 'aprovado' && (
                          <button
                            type="button"
                            className={estilos.linkAcao}
                            onClick={() => aoModerar(r.id, 'aprovado', 'resposta')}
                          >
                            publicar resposta
                          </button>
                        )}
                        {sit(r.status) !== 'removido' && (
                          <button
                            type="button"
                            className={estilos.linkAcao}
                            onClick={() => aoModerar(r.id, 'removido', 'resposta')}
                          >
                            remover resposta
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
