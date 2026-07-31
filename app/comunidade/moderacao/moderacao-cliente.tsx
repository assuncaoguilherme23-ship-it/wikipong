/**
 * WikiPong · Moderação (D-11, fila de aprovação)
 * ------------------------------------------------------------------------------
 * A tela que faltava: sem ela, tudo que chega fica invisível esperando alguém
 * mexer no banco na mão.
 *
 * O QUE ELA HONESTAMENTE NÃO FAZ, e por quê:
 *
 * Com o Supabase ligado, esta tela NÃO consegue ver o que está pendente. Não é
 * bug e não tem conserto por aqui: a política de leitura só devolve o que está
 * 'aprovado', e a chave que o site carrega é a ANÔNIMA, visível no bundle pra
 * qualquer um que abrir o DevTools. Uma tela que moderasse com essa chave seria
 * uma tela em que qualquer visitante aprova e apaga o que quiser.
 *
 * Moderar de verdade exige saber QUEM está moderando, e isso exige login. Até
 * lá, a tela diz isso e manda pro painel do Supabase — em vez de fingir que
 * funciona e deixar a fila crescer sem ninguém ver.
 *
 * Localmente ela funciona por inteiro, porque ali o dono do navegador é o único
 * que tem acesso ao que está guardado.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ordenar, type Avaliacao } from '@/src/logica/avaliacoes';
import { repositorio } from '@/src/logica/repositorio-avaliacoes';
import { materialPorId } from '@/componentes/dados-materiais';
import { Estrelas } from '@/componentes/Estrelas';
import { TagEstilo, TagNivel } from '@/componentes/TagEstilo';
import estilos from './moderacao.module.css';

const ROTULO_STATUS: Record<Avaliacao['status'], string> = {
  pendente: 'esperando',
  aprovado: 'no ar',
  removido: 'removida',
};

const quando = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export function ModeracaoCliente() {
  const repo = useMemo(() => repositorio(), []);
  const [lista, setLista] = useState<Avaliacao[] | null>(null);
  const [filtro, setFiltro] = useState<Avaliacao['status'] | 'todas'>('todas');

  useEffect(() => {
    if (!repo.podeModerar) {
      setLista([]);
      return;
    }
    repo.listar().then((todas) => setLista(ordenar(todas, 'recentes')));
  }, [repo]);

  async function mudar(id: string, status: Avaliacao['status']) {
    await repo.moderar(id, status);
    setLista(ordenar(await repo.listar(), 'recentes'));
  }

  if (!repo.podeModerar) {
    return (
      <div className={estilos.impedida}>
        <p className={estilos.impedidaTitulo}>
          Esta tela não modera o conteúdo do servidor, e isso é de propósito.
        </p>
        <p>
          O site é estático: a chave que ele carrega é a <strong>anônima</strong>, e ela está
          visível pra qualquer pessoa que abrir as ferramentas do navegador. Se esta tela
          aprovasse avaliações com essa chave, qualquer visitante aprovaria as próprias.
        </p>
        <p>
          Por isso a regra no banco só devolve o que já está aprovado, e nem esta página
          enxerga a fila. Moderar exige saber <em>quem</em> está moderando, e isso exige login
          — que ainda não existe aqui.
        </p>
        <p className={estilos.enquantoIsso}>
          <strong>Enquanto isso:</strong> aprove pelo painel do Supabase, em{' '}
          <span className="mono">Table Editor → avaliacoes</span>, mudando{' '}
          <span className="mono">status</span> de <span className="mono">pendente</span> para{' '}
          <span className="mono">aprovado</span>. A view{' '}
          <span className="mono">fila_moderacao</span> junta tudo que está esperando, mais
          antigo primeiro.
        </p>
      </div>
    );
  }

  if (lista === null) return <p className={estilos.carregando}>Carregando…</p>;

  const visiveis = filtro === 'todas' ? lista : lista.filter((a) => a.status === filtro);
  const contar = (s: Avaliacao['status']) => lista.filter((a) => a.status === s).length;

  if (lista.length === 0) {
    return (
      <p className={estilos.vazio}>
        Nada escrito neste navegador ainda.{' '}
        <Link href="/catalogo/">Avaliar um material →</Link>
      </p>
    );
  }

  return (
    <>
      <div className={estilos.filtros} role="group" aria-label="Filtrar por situação">
        {(['todas', 'pendente', 'aprovado', 'removido'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`${estilos.chip} ${filtro === f ? estilos.chipAtivo : ''}`}
            aria-pressed={filtro === f}
            onClick={() => setFiltro(f)}
          >
            {f === 'todas' ? 'todas' : ROTULO_STATUS[f]}
            <span className={`mono ${estilos.contagem}`}>
              {f === 'todas' ? lista.length : contar(f)}
            </span>
          </button>
        ))}
      </div>

      {repo.somenteLocal && (
        <p className={estilos.nota}>
          Neste navegador a avaliação já entra publicada, porque aqui o segundo par de olhos é
          você mesmo. Por isso a fila de <strong>esperando</strong> nasce vazia. Com o servidor
          ligado é o contrário: tudo chega esperando. Pra ensaiar como vai ser, use{' '}
          <em>voltar pra fila</em> numa avaliação qualquer.
        </p>
      )}

      {visiveis.length === 0 ? (
        <p className={estilos.vazio}>Nenhuma avaliação nessa situação.</p>
      ) : (
        <ul className={estilos.lista}>
          {visiveis.map((a) => {
            const m = materialPorId(a.materialId);
            return (
              <li key={a.id} className={`${estilos.item} ${estilos[a.status]}`}>
                <div className={estilos.cabecalho}>
                  <div className={estilos.quem}>
                    <p className={estilos.autor}>{a.autor}</p>
                    <p className={estilos.tags}>
                      <TagEstilo estilo={a.estilo} comLink={false} />
                      <TagNivel nivel={a.nivel} />
                    </p>
                  </div>
                  <div className={estilos.direita}>
                    <Estrelas nota={a.nota} tamanho="sm" />
                    <span className={`mono ${estilos.situacao}`}>{ROTULO_STATUS[a.status]}</span>
                  </div>
                </div>

                <p className={estilos.sobre}>
                  sobre{' '}
                  {m ? (
                    <Link href={`/materiais/${m.id}/`}>{m.nome}</Link>
                  ) : (
                    <span className={estilos.orfa}>material fora do catálogo ({a.materialId})</span>
                  )}{' '}
                  · usa há {a.tempoDeUso} · {quando(a.criadoEm)}
                </p>

                <p className={estilos.texto}>{a.texto}</p>

                <div className={estilos.acoes}>
                  {a.status !== 'aprovado' && (
                    <button type="button" className="botao-primario" onClick={() => mudar(a.id, 'aprovado')}>
                      Publicar
                    </button>
                  )}
                  {a.status !== 'removido' && (
                    <button type="button" className="botao-secundario" onClick={() => mudar(a.id, 'removido')}>
                      Remover
                    </button>
                  )}
                  {a.status !== 'pendente' && (
                    <button type="button" className={estilos.linkAcao} onClick={() => mudar(a.id, 'pendente')}>
                      voltar pra fila
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className={estilos.nota}>
        Remover não apaga: marca como removida e tira do ar. Apagar de verdade tiraria de você
        a chance de reler o que foi denunciado, e sumiria com o histórico.
      </p>
    </>
  );
}
