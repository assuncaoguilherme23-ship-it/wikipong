/**
 * WikiPong · A tela pública do jogador
 * ------------------------------------------------------------------------------
 * Só leitura. Quem edita é a `/comunidade/perfil/`; esta aqui é o que os outros
 * veem, e é ela que faz o crachá daquela tela deixar de ser promessa.
 *
 * DUAS REGRAS QUE NÃO PODEM ESCAPAR DAQUI:
 *
 * 1. O motivo da estante passa SEMPRE por `motivoVisivel`, nunca por `.motivo`
 *    direto. É essa função que aplica o D-14: prosa espera gente, e o dono vê
 *    o próprio texto mesmo pendente.
 * 2. Bloco sem dado DESAPARECE inteiro, em vez de dizer "nenhum item". Perfil
 *    novo mostra o pouco que tem, não uma lista das próprias ausências.
 *
 * Falha de rede não vira tela branca: o que carregou fica, o que falhou some.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RaqueteRetrato } from '@/componentes/RaqueteRetrato';
import { materialPorId } from '@/componentes/dados-materiais';
import { nomeComMarca } from '@/componentes/formato';
import { usarSessao } from '@/componentes/usarSessao';
import { repositorio } from '@/src/logica/repositorio-avaliacoes';
import { repositorioDiscussoes, resolveuQuantas } from '@/src/logica/discussoes';
import {
  repositorioEstante, ordenarEstante, motivoVisivel, emUsoHoje,
  type EntradaDeEstante,
} from '@/src/logica/estante';
import { linhaDoTempo, ROTULO_ATIVIDADE, type Atividade } from '@/src/logica/atividade';
import { procedenciaDe, type ProcedenciaDoAvaliador } from '@/src/logica/procedencia-do-avaliador';
import { ROTULO_ESTILO } from '@/src/logica/avaliacoes';
import { ROTULO_MAO, ROTULO_EMPUNHADURA, type Perfil } from '@/src/logica/perfil';
import estilos from './jogador.module.css';

/** O que a tela precisa do perfil, mais o dono — que não está no tipo `Perfil`. */
type PerfilPublico = Perfil & { usuarioId: string };

const ano = (iso?: string) => (iso ? iso.slice(0, 4) : null);

/** "2023 – 2024", "desde 2024", ou nada quando a pessoa não disse. */
function periodo(e: EntradaDeEstante): string | null {
  const de = ano(e.de);
  const ate = ano(e.ate);
  if (de && ate) return `${de} – ${ate}`;
  if (de && emUsoHoje(e)) return `desde ${de}`;
  if (ate) return `até ${ate}`;
  return null;
}

async function buscarPerfil(apelido: string): Promise<PerfilPublico | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return null;

  const res = await fetch(
    `${url.replace(/\/$/, '')}/rest/v1/perfis?apelido=eq.${encodeURIComponent(apelido)}&select=*`,
    { headers: { apikey: chave, Authorization: `Bearer ${chave}` } },
  );
  if (!res.ok) throw new Error(`Supabase respondeu ${res.status}`);
  const linhas = (await res.json()) as Record<string, string | null>[];
  const l = linhas[0];
  if (!l) return null;

  return {
    usuarioId: l.usuario_id as string,
    nome: l.nome as string,
    apelido: l.apelido ?? undefined,
    estilo: (l.estilo ?? undefined) as Perfil['estilo'],
    nivel: (l.nivel ?? undefined) as Perfil['nivel'],
    mao: (l.mao ?? undefined) as Perfil['mao'],
    empunhadura: (l.empunhadura ?? undefined) as Perfil['empunhadura'],
    cidade: l.cidade ?? undefined,
    uf: l.uf ?? undefined,
    procuro: l.procuro ?? undefined,
    equipamento: {
      lamina: l.equip_lamina ?? undefined,
      fh: l.equip_fh ?? undefined,
      bh: l.equip_bh ?? undefined,
    },
    atualizadoEm: (l.atualizado_em as string) ?? new Date().toISOString(),
  };
}

export function JogadorCliente() {
  const apelido = useSearchParams().get('p') ?? '';
  const { usuario } = usarSessao();

  const [perfil, setPerfil] = useState<PerfilPublico | null | undefined>(undefined);
  const [estante, setEstante] = useState<EntradaDeEstante[]>([]);
  const [atividade, setAtividade] = useState<Atividade[]>([]);
  const [procedencia, setProcedencia] = useState<ProcedenciaDoAvaliador | null>(null);
  const [resolveu, setResolveu] = useState(0);

  const repoEstante = useMemo(() => repositorioEstante(), []);

  useEffect(() => {
    if (!apelido) { setPerfil(null); return; }
    let vivo = true;
    buscarPerfil(apelido)
      .then((p) => { if (vivo) setPerfil(p); })
      .catch(() => { if (vivo) setPerfil(null); });
    return () => { vivo = false; };
  }, [apelido]);

  useEffect(() => {
    if (!perfil) return;
    let vivo = true;
    const dono = perfil.usuarioId;

    /* Cada bloco falha sozinho: rede ruim tira uma seção, não a página. */
    repoEstante.listar(dono)
      .then((es) => { if (vivo) setEstante(es); })
      .catch(() => { if (vivo) setEstante([]); });

    repositorio().listar()
      .then((avs) => {
        if (!vivo) return;
        const minhas = avs.filter((a) => a.usuarioId === dono);
        setProcedencia(minhas.length > 0 ? procedenciaDe(minhas) : null);
        return minhas;
      })
      .then(async (minhas) => {
        const topicos = await repositorioDiscussoes().listar();
        if (!vivo) return;
        const respostas = topicos.flatMap((t) =>
          t.respostas.map((r) => ({ ...r, topicoId: t.id })));
        setAtividade(linhaDoTempo(minhas ?? [], topicos, respostas, dono));
        setResolveu(resolveuQuantas(topicos, dono));
      })
      .catch(() => { if (vivo) { setAtividade([]); setResolveu(0); } });

    return () => { vivo = false; };
  }, [perfil, repoEstante]);

  if (perfil === undefined) return <p className={estilos.carregando}>Carregando…</p>;

  if (perfil === null) {
    return (
      <div className={estilos.vazio}>
        <h1 className={estilos.titulo}>Esse jogador não existe</h1>
        <p>
          O endereço pode estar errado, ou o perfil pode ter sido apagado.{' '}
          <Link href="/comunidade/">Voltar para a comunidade →</Link>
        </p>
      </div>
    );
  }

  const souODono = usuario?.id === perfil.usuarioId;
  const naEstante = ordenarEstante(estante);
  const lugar = [perfil.cidade, perfil.uf].filter(Boolean).join(' · ');
  const tracos = [
    perfil.estilo ? ROTULO_ESTILO[perfil.estilo] : null,
    perfil.nivel,
    perfil.mao ? ROTULO_MAO[perfil.mao] : null,
    perfil.empunhadura ? ROTULO_EMPUNHADURA[perfil.empunhadura] : null,
  ].filter(Boolean);

  return (
    <article className={estilos.perfil}>
      <header className={estilos.cabecalho}>
        <h1 className={estilos.titulo}>{perfil.nome}</h1>
        {tracos.length > 0 && (
          <p className={`mono ${estilos.tracos}`}>{tracos.join(' · ')}</p>
        )}
        {lugar && <p className={estilos.lugar}>{lugar}</p>}
        {perfil.procuro && (
          <p className={estilos.procuro}>
            <span className={`mono ${estilos.procuroRotulo}`}>procura</span> {perfil.procuro}
          </p>
        )}
        {souODono && (
          <p className={estilos.souEu}>
            Este é o seu perfil, como os outros veem.{' '}
            <Link href="/comunidade/perfil/">Editar →</Link>
          </p>
        )}
      </header>

      <RaqueteRetrato equipamento={perfil.equipamento} />

      {/* Os números, sem selo. Quem lê julga — é a Regra da Voz de Dados
          aplicada a gente em vez de a material. */}
      {(procedencia || resolveu > 0) && (
        <section className={estilos.secao} aria-labelledby="t-numeros">
          <h2 id="t-numeros" className={estilos.tituloSecao}>Na comunidade</h2>
          <ul className={estilos.numeros}>
            {procedencia && (
              <>
                <li>
                  <span className={`mono ${estilos.numero}`}>{procedencia.quantas}</span>
                  <span className={estilos.numeroRotulo}>
                    {procedencia.quantas === 1 ? 'avaliação escrita' : 'avaliações escritas'}
                  </span>
                </li>
                <li>
                  <span className={`mono ${estilos.numero}`}>{procedencia.materiaisDistintos}</span>
                  <span className={estilos.numeroRotulo}>
                    {procedencia.borrachas > 0 && procedencia.laminas > 0
                      ? `materiais (${procedencia.borrachas} borracha${procedencia.borrachas > 1 ? 's' : ''}, ${procedencia.laminas} lâmina${procedencia.laminas > 1 ? 's' : ''})`
                      : 'materiais diferentes'}
                  </span>
                </li>
                {procedencia.faixaTipica && (
                  <li>
                    <span className={`mono ${estilos.numero}`}>{procedencia.faixaTipica}</span>
                    <span className={estilos.numeroRotulo}>de uso, tipicamente, antes de avaliar</span>
                  </li>
                )}
              </>
            )}
            {resolveu > 0 && (
              <li>
                <span className={`mono ${estilos.numero}`}>{resolveu}</span>
                <span className={estilos.numeroRotulo}>
                  {resolveu === 1 ? 'dúvida que resolveu' : 'dúvidas que resolveu'}
                </span>
              </li>
            )}
          </ul>
        </section>
      )}

      {naEstante.length > 0 && (
        <section className={estilos.secao} aria-labelledby="t-estante">
          <h2 id="t-estante" className={estilos.tituloSecao}>Já usou</h2>
          <ul className={estilos.estante}>
            {naEstante.map((e) => {
              const m = materialPorId(e.materialId);
              if (!m) return null;
              /* SEMPRE por aqui. Ler `e.motivo` direto vazaria texto pendente. */
              const motivo = motivoVisivel(e, souODono);
              const quando = periodo(e);
              return (
                <li key={e.id} className={estilos.entrada}>
                  <div className={estilos.entradaTopo}>
                    <Link href={`/materiais/${m.id}/`}>{nomeComMarca(m.marca, m.nome)}</Link>
                    {quando && <span className={`mono ${estilos.periodo}`}>{quando}</span>}
                    {emUsoHoje(e) && <span className={estilos.emUso}>em uso</span>}
                  </div>
                  {motivo && (
                    <p className={estilos.motivo}>
                      {motivo}
                      {souODono && e.motivoStatus === 'pendente' && (
                        <span className={`mono ${estilos.esperando}`}> · esperando revisão</span>
                      )}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {atividade.length > 0 && (
        <section className={estilos.secao} aria-labelledby="t-atividade">
          <h2 id="t-atividade" className={estilos.tituloSecao}>O que já escreveu</h2>
          <ul className={estilos.atividade}>
            {atividade.slice(0, 20).map((a) => (
              <li key={`${a.tipo}-${a.id}`} className={estilos.item}>
                <span className={`mono ${estilos.acao}`}>{ROTULO_ATIVIDADE[a.tipo]}</span>
                <Link href={a.para} className={estilos.itemTexto}>{a.titulo}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
