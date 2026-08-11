/**
 * WikiPong · As notícias que chegaram sozinhas e você aprovou
 * ------------------------------------------------------------------------------
 * Fecha o laço da automação: o robô deposita na fila, você escreve o resumo e
 * aprova, e é aqui que o resultado aparece — sem republicar o site.
 *
 * Fica ACIMA da lista estática porque estas são as mais recentes: a lista do
 * repositório é o acervo curado à mão, e ela envelhece por natureza.
 *
 * Some por inteiro quando não há nada aprovado. Um bloco "nenhuma notícia nova"
 * numa página que já tem notícias seria ruído puro — a página não está vazia.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  repositorioNoticias, publicavel, type NoticiaRecebida,
} from '@/src/logica/noticias-fila';
import { dataLegivel, dominioDaFonte } from './dados-noticias';
import estilos from '@/app/noticias/noticias.module.css';

export function NoticiasAprovadas() {
  const repo = useMemo(() => repositorioNoticias(), []);
  const [lista, setLista] = useState<NoticiaRecebida[]>([]);

  useEffect(() => {
    if (!repo.disponivel) return;
    /* Falha de rede não pode virar erro na cara de quem só queria ler notícia:
       a lista curada continua ali embaixo, inteira. */
    repo.listar().then((ns) => setLista(ns.filter(publicavel))).catch(() => setLista([]));
  }, [repo]);

  if (lista.length === 0) return null;

  return (
    <ul className={estilos.lista}>
      {lista.map((n) => (
        <li key={n.id}>
          <a
            href={n.url}
            className={estilos.item}
            target="_blank"
            rel="nofollow noopener noreferrer"
          >
            <p className={`mono ${estilos.meta}`}>
              <time dateTime={n.publicadoEm}>{dataLegivel(n.publicadoEm)}</time>
              {n.tag && <span className={estilos.tag}>{n.tag}</span>}
            </p>
            <h2 className={estilos.itemTitulo}>{n.titulo}</h2>
            <p className={estilos.resumo}>{n.resumo}</p>
            <p className={`mono ${estilos.fonte}`}>
              {n.fonte} · {dominioDaFonte(n.url)} ↗
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
