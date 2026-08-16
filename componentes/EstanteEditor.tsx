/**
 * WikiPong · Cadastrar a própria estante
 * ------------------------------------------------------------------------------
 * O buraco que faltava: a seção "Já usou" do perfil público (`jogador-cliente.tsx`)
 * já sabia MOSTRAR uma estante, mas ninguém tinha como ESCREVER uma. Este
 * componente é o formulário — vive na tela de edição do perfil, não na pública.
 *
 * SEM BOTÃO EDITAR, DE PROPÓSITO. A política do banco (migração 015) não dá
 * `update` ao dono em `estante_motivos` — só `insert` e `delete`. Reescrever é
 * apagar e cadastrar de novo, e é assim que tem que ser: texto novo passa pela
 * moderação outra vez, em vez de herdar a aprovação do texto velho.
 *
 * Material e período aparecem na hora (são fato, D-14); o motivo, quando
 * escrito, nasce pendente e só fica público depois de aprovado — mas o dono
 * sempre vê o próprio texto, via `motivoVisivel`.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  repositorioEstante, ordenarEstante, motivoVisivel, emUsoHoje, problemasDaEntrada,
  MOTIVO_MAXIMO, type EntradaDeEstante,
} from '@/src/logica/estante';
import { MATERIAIS, materialPorId } from '@/componentes/dados-materiais';
import { nomeComMarca } from '@/componentes/formato';
import { FotoProduto } from '@/componentes/FotoProduto';
import { SeletorMaterial } from '@/componentes/SeletorMaterial';
import estilos from './EstanteEditor.module.css';

const formatarData = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

function periodoTexto(e: EntradaDeEstante): string {
  if (e.de && e.ate) return `${formatarData(e.de)} – ${formatarData(e.ate)}`;
  if (e.de) return `desde ${formatarData(e.de)}`;
  if (e.ate) return `até ${formatarData(e.ate)}`;
  return 'sem período informado';
}

export function EstanteEditor({
  token,
  usuarioId,
}: {
  token: string | null;
  usuarioId: string | null;
}) {
  const repo = useMemo(() => repositorioEstante(token, usuarioId), [token, usuarioId]);
  const [entradas, setEntradas] = useState<EntradaDeEstante[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [materialId, setMaterialId] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [motivo, setMotivo] = useState('');
  const [gravando, setGravando] = useState(false);

  const carregar = useCallback(
    () =>
      repo
        .listar()
        .then((es) => {
          setEntradas(ordenarEstante(es));
          setErro(null);
        })
        .catch(() => {
          setEntradas([]);
          setErro('Não consegui carregar a sua estante agora.');
        }),
    [repo],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  /* Precisa de conta pra gravar sempre que há servidor: ao contrário do
     perfil, a estante não tem fallback local quando alguém edita deslogado
     com o Supabase ligado (a RLS de `estante` exige usuário autenticado). */
  const precisaEntrar = !repo.somenteLocal && !usuarioId;

  const rascunho: EntradaDeEstante = {
    id: '',
    materialId,
    de: de || undefined,
    ate: ate || undefined,
    motivo: motivo.trim() ? motivo : undefined,
  };
  const problemas = materialId ? problemasDaEntrada(rascunho) : [];
  const podeGravar = materialId !== '' && problemas.length === 0 && !gravando && !precisaEntrar;

  async function adicionar() {
    if (!podeGravar) return;
    setGravando(true);
    setErro(null);
    try {
      await repo.adicionar({
        materialId,
        de: de || undefined,
        ate: ate || undefined,
        motivo: motivo.trim() ? motivo.trim() : undefined,
      });
      setMaterialId('');
      setDe('');
      setAte('');
      setMotivo('');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui gravar essa entrada.');
    } finally {
      setGravando(false);
    }
  }

  async function remover(id: string) {
    setErro(null);
    try {
      await repo.remover(id);
      setEntradas((atual) => (atual ?? []).filter((e) => e.id !== id));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui remover essa entrada.');
    }
  }

  const materialEscolhido = materialId ? materialPorId(materialId) : undefined;

  return (
    <div className={estilos.bloco}>
      {erro && (
        <p className={estilos.erro} role="alert">
          {erro}
        </p>
      )}

      {entradas === null ? (
        <p className={estilos.carregando}>Carregando…</p>
      ) : entradas.length === 0 ? (
        <p className={estilos.faltando}>Você ainda não registrou nada aqui.</p>
      ) : (
        <>
          <ul className={estilos.lista}>
            {entradas.map((e) => {
              const m = materialPorId(e.materialId);
              const motivoTexto = motivoVisivel(e, true);
              return (
                <li key={e.id} className={estilos.item}>
                  <div className={estilos.itemTopo}>
                    {m ? (
                      <Link href={`/materiais/${m.id}/`} className={estilos.itemMaterial}>
                        <FotoProduto id={m.id} nome={m.nome} tipo={m.tipo} tamanho={40} />
                        <span>{nomeComMarca(m.marca, m.nome)}</span>
                      </Link>
                    ) : (
                      <span className={estilos.orfa}>material fora do catálogo ({e.materialId})</span>
                    )}
                    {emUsoHoje(e) && <span className={estilos.emUso}>em uso</span>}
                  </div>
                  <p className={`mono ${estilos.periodo}`}>{periodoTexto(e)}</p>
                  {motivoTexto && (
                    <p className={estilos.motivo}>
                      {motivoTexto}
                      {e.motivoStatus === 'pendente' && (
                        <span className={`mono ${estilos.esperando}`}> · esperando revisão</span>
                      )}
                    </p>
                  )}
                  <button
                    type="button"
                    className="botao-secundario"
                    onClick={() => remover(e.id)}
                  >
                    Remover
                  </button>
                </li>
              );
            })}
          </ul>
          <p className={estilos.aviso}>
            Não existe botão editar de propósito: pra mudar o motivo, remova e escreva de novo —
            texto novo passa pela moderação outra vez.
          </p>
        </>
      )}

      <div className={estilos.form}>
        <p className={estilos.explica}>
          Material e período aparecem na hora. O motivo, se você escrever, passa por revisão antes
          de ficar público pra outras pessoas — você continua vendo o que escreveu enquanto isso
          espera.
        </p>

        {precisaEntrar && (
          <p className={estilos.avisoConta}>
            Sem conta não há onde gravar isto: entre lá em cima pra guardar a sua estante.
          </p>
        )}

        <div className={estilos.campos}>
          <div className={estilos.campo}>
            {/* Era um `<select>` com o catálogo inteiro dentro — 952 opções sem
                busca, e com `${marca} ${nome}` cru, que produzia "Xiom Xiom
                Feel ZX3" nos 73 materiais cujo nome já começa pela marca.
                O `SeletorMaterial` é o padrão do site pra escolher material:
                busca, foto, preço e combobox ARIA completo. Aqui a lista é o
                catálogo TODO de propósito — a estante registra o que a pessoa
                já usou, e isso inclui bola e raquete montada. */}
            <SeletorMaterial
              rotulo="Material"
              opcoes={MATERIAIS}
              valor={materialEscolhido}
              aoEscolher={setMaterialId}
            />
            {materialEscolhido && (
              <span className={estilos.pecaEscolhida}>
                <FotoProduto
                  id={materialEscolhido.id}
                  nome={materialEscolhido.nome}
                  tipo={materialEscolhido.tipo}
                  tamanho={36}
                />
                <Link href={`/materiais/${materialEscolhido.id}/`} className={estilos.pecaLink}>
                  ver ficha →
                </Link>
              </span>
            )}
          </div>

          <label className={estilos.campo}>
            <span className={estilos.rotulo}>De (opcional)</span>
            <input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          </label>

          <label className={estilos.campo}>
            <span className={estilos.rotulo}>Até (opcional)</span>
            <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </label>
        </div>

        <label className={estilos.campo}>
          <span className={estilos.rotulo}>
            Por que trocou (opcional){' '}
            <span className={`mono ${estilos.contador}`}>
              {motivo.length}/{MOTIVO_MAXIMO}
            </span>
          </span>
          <textarea
            rows={3}
            maxLength={MOTIVO_MAXIMO}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="queria mais giro no saque"
          />
        </label>

        {problemas.length > 0 && (
          <ul className={estilos.problemas}>
            {problemas.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}

        <button type="button" className="botao-primario" disabled={!podeGravar} onClick={adicionar}>
          {gravando ? 'Gravando…' : 'Adicionar à estante'}
        </button>
      </div>
    </div>
  );
}
