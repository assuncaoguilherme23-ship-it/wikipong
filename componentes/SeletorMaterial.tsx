'use client';

/**
 * WikiPong · Seletor de material com busca
 * ==============================================================================
 * POR QUE O `<select>` NATIVO NÃO SERVIA AQUI
 *
 * O montador oferecia as peças num `<select>`. Com 393 lâminas isso falha em
 * três frentes ao mesmo tempo:
 *
 *   1. NÃO TEM BUSCA. O select nativo só pula para a primeira letra digitada,
 *      então achar a "Timo Boll Spirit" é rolar centenas de linhas.
 *   2. NÃO TEM IMAGEM. Todo material do catálogo tem foto oficial, e o select
 *      só aceita texto.
 *   3. NÃO MOSTRA O QUE IMPORTA JUNTO. Nome, marca, tipo e preço numa linha só
 *      viram uma frase longa que o navegador corta na largura do campo.
 *
 * Um combobox resolve os três — mas só vale a pena se não regredir o que o
 * select dava de graça: teclado e leitor de tela. Por isso este componente
 * implementa o padrão ARIA de combobox por inteiro (setas, Enter, Escape, Home,
 * End, `aria-activedescendant`), e não um `<div>` com clique.
 *
 * ── A LISTA NÃO É VIRTUALIZADA, E ISSO É PROPOSITAL ──────────────────────────
 *
 * 393 opções renderizadas de uma vez seriam pesadas; a busca corta a lista antes
 * disso, e há um teto de itens visíveis. Virtualização traria dependência e
 * quebraria o `aria-activedescendant`, que precisa do elemento existir no DOM.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FotoProduto } from './FotoProduto';
import { dinheiro } from './formato';
import { filtrarPorTexto } from '@/src/logica/busca-material';
import estilos from './SeletorMaterial.module.css';

export interface OpcaoMaterial {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  nivel: string;
  preco: number;
  moeda?: string;
}

/** Quantos itens a lista mostra por vez. Acima disso, a busca é o caminho. */
const TETO_VISIVEL = 40;

export function SeletorMaterial({
  rotulo,
  opcoes,
  valor,
  aoEscolher,
  placeholder = 'Buscar por nome, marca ou nível…',
}: {
  rotulo: string;
  opcoes: readonly OpcaoMaterial[];
  valor?: OpcaoMaterial;
  aoEscolher: (id: string) => void;
  placeholder?: string;
}) {
  const idBase = useId();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [destacado, setDestacado] = useState(0);
  const caixaRef = useRef<HTMLDivElement | null>(null);
  const listaRef = useRef<HTMLUListElement | null>(null);

  const filtradas = useMemo(() => filtrarPorTexto(opcoes, busca), [opcoes, busca]);
  const visiveis = filtradas.slice(0, TETO_VISIVEL);

  // Clique fora fecha e devolve o campo ao estado de leitura.
  useEffect(() => {
    if (!aberto) return;
    const aoClicar = (e: PointerEvent) => {
      if (caixaRef.current && !caixaRef.current.contains(e.target as Node)) {
        setAberto(false);
        setBusca('');
      }
    };
    document.addEventListener('pointerdown', aoClicar);
    return () => document.removeEventListener('pointerdown', aoClicar);
  }, [aberto]);

  /* O item destacado precisa estar VISÍVEL na rolagem, senão a navegação por
     seta some da tela — é o defeito clássico de combobox feito à mão. */
  useEffect(() => {
    if (!aberto) return;
    const el = listaRef.current?.children[destacado] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [destacado, aberto]);

  const escolher = (o: OpcaoMaterial) => {
    aoEscolher(o.id);
    setAberto(false);
    setBusca('');
  };

  const aoTeclar = (e: React.KeyboardEvent) => {
    if (!aberto && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setAberto(true);
      setDestacado(0);
      return;
    }
    if (!aberto) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDestacado((d) => Math.min(d + 1, visiveis.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDestacado((d) => Math.max(d - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setDestacado(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setDestacado(visiveis.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const alvo = visiveis[destacado];
      if (alvo) escolher(alvo);
    } else if (e.key === 'Escape') {
      setAberto(false);
      setBusca('');
    }
  };

  return (
    <div className={estilos.caixa} ref={caixaRef}>
      <label className={estilos.rotulo} htmlFor={`${idBase}-campo`}>
        {rotulo}
      </label>

      <div className={estilos.campo}>
        <input
          id={`${idBase}-campo`}
          className={estilos.entrada}
          type="text"
          role="combobox"
          aria-expanded={aberto}
          aria-controls={`${idBase}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={
            aberto && visiveis[destacado] ? `${idBase}-op-${visiveis[destacado].id}` : undefined
          }
          value={aberto ? busca : valor ? `${valor.nome} · ${valor.marca}` : ''}
          placeholder={valor ? valor.nome : placeholder}
          onFocus={() => setAberto(true)}
          onChange={(e) => {
            setBusca(e.target.value);
            setDestacado(0);
            if (!aberto) setAberto(true);
          }}
          onKeyDown={aoTeclar}
        />
        {valor && !aberto && (
          <button
            type="button"
            className={estilos.limpar}
            onClick={() => aoEscolher('')}
            aria-label={`Tirar ${valor.nome} da montagem`}
          >
            ×
          </button>
        )}
      </div>

      {aberto && (
        <div className={estilos.painel}>
          <p className={`mono ${estilos.contagem}`} aria-live="polite">
            {filtradas.length === 0
              ? 'nada com esse termo'
              : `${filtradas.length} ${filtradas.length === 1 ? 'opção' : 'opções'}${
                  filtradas.length > TETO_VISIVEL ? ` · mostrando ${TETO_VISIVEL}, refine a busca` : ''
                }`}
          </p>
          <ul className={estilos.lista} role="listbox" id={`${idBase}-lista`} ref={listaRef}>
            {visiveis.map((o, i) => (
              <li
                key={o.id}
                id={`${idBase}-op-${o.id}`}
                role="option"
                aria-selected={o.id === valor?.id}
                className={`${estilos.opcao} ${i === destacado ? estilos.destacada : ''}`}
                onPointerDown={(e) => {
                  // pointerdown e não click: o blur do input fecharia antes.
                  e.preventDefault();
                  escolher(o);
                }}
                onPointerEnter={() => setDestacado(i)}
              >
                <FotoProduto id={o.id} nome={o.nome} tipo={o.tipo} tamanho={38} />
                <span className={estilos.textoOpcao}>
                  <span className={estilos.nomeOpcao}>{o.nome}</span>
                  <span className={`mono ${estilos.metaOpcao}`}>
                    {o.marca} · {o.nivel}
                  </span>
                </span>
                <span className={`mono ${estilos.precoOpcao}`}>{dinheiro(o.preco, o.moeda as 'USD' | 'EUR' | undefined)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
