/**
 * WikiPong · As discussões que falam DESTE material, na ficha dele
 * ------------------------------------------------------------------------------
 * Fecha o laço que a amarração tópico→material abriu: sem isto, escolher um
 * material ao abrir o tópico não produzia efeito nenhum, e a ligação era só um
 * campo guardado.
 *
 * Some por inteiro quando não há tópico. Um bloco "nenhuma discussão ainda" em
 * cada uma das 368 fichas seria ruído em 368 páginas pra servir a poucas.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  repositorioDiscussoes, doMaterial, ordenarTopicos, ultimaAtividade, ROTULO_ASSUNTO,
  type Topico,
} from '@/src/logica/discussoes';
import { TagEstilo } from './TagEstilo';
import estilos from './DiscussoesDoMaterial.module.css';

const quando = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

export function DiscussoesDoMaterial({ materialId }: { materialId: string }) {
  const repo = useMemo(() => repositorioDiscussoes(), []);
  const [topicos, setTopicos] = useState<Topico[]>([]);

  useEffect(() => {
    repo.listar().then((todos) => setTopicos(ordenarTopicos(doMaterial(todos, materialId), 'ativos')));
  }, [repo, materialId]);

  if (topicos.length === 0) return null;

  return (
    <div className={estilos.bloco}>
      <h3 className={estilos.titulo}>
        {topicos.length === 1 ? 'Uma discussão' : `${topicos.length} discussões`} sobre este
        material
      </h3>
      <ul className={estilos.lista}>
        {topicos.map((t) => (
          <li key={t.id}>
            <Link href="/comunidade/discussoes/" className={estilos.link}>
              {t.titulo}
            </Link>
            <p className={estilos.meta}>
              <span className={`mono ${estilos.assunto}`}>{ROTULO_ASSUNTO[t.assunto]}</span>
              <span className={estilos.autor}>{t.autor}</span>
              {t.estilo && <TagEstilo estilo={t.estilo} comLink={false} />}
              <span className={`mono ${estilos.contagem}`}>
                {t.respostas.length === 0
                  ? 'sem resposta'
                  : `${t.respostas.length} ${t.respostas.length === 1 ? 'resposta' : 'respostas'} · última em ${quando(ultimaAtividade(t))}`}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
