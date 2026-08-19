/**
 * WikiPong · O calendário nacional na tela
 * ==============================================================================
 * ── POR QUE ESTA TELA TEM CLIENTE, se os dados são estáticos ─────────────────
 *
 * O site é export estático (D-17): o HTML é gerado no build e congela. "Hoje"
 * congelaria junto — uma etapa marcada como "próxima" no dia do build continuaria
 * "próxima" em dezembro, e o calendário mentiria com cara de certeza.
 *
 * A solução tem duas camadas, e a de baixo funciona sem JavaScript nenhum:
 *
 *   no build   sai a lista INTEIRA, em ordem cronológica, sem rótulo de tempo.
 *              Está completa e correta — é o que o buscador lê e o que aparece
 *              se o script não carregar.
 *   no browser `hoje` chega de verdade e a lista se parte em acontecendo agora ·
 *              o que vem · o que já passou.
 *
 * Por isso `hoje` começa `null` e só é preenchido depois da montagem: a primeira
 * pintura do cliente é IGUAL à do servidor, e não há divergência de hidratação.
 */
'use client';

import { useEffect, useState } from 'react';
import {
  partirCalendario, ordenarCompeticoes, periodo, diasAte, contarPorTipo,
  ROTULO_TIPO, EXPLICA_TIPO, TIPOS,
  type Competicao,
} from '@/src/logica/competicoes';
import { COMPETICOES, ETAPAS_ANUNCIADAS } from '@/componentes/dados-competicoes';
import estilos from './competicoes.module.css';

const hojeISO = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

function Linha({ c, hoje }: { c: Competicao; hoje: string | null }) {
  const faltam = hoje ? diasAte(c, hoje) : null;

  return (
    <li className={estilos.item}>
      <div className={estilos.quando}>
        <span className={`mono ${estilos.periodo}`}>{periodo(c)}</span>
        {faltam !== null && faltam > 0 && (
          <span className={estilos.contagem}>
            {faltam === 1 ? 'amanhã' : `em ${faltam} dias`}
          </span>
        )}
      </div>

      <div className={estilos.corpo}>
        <h3 className={estilos.nome}>{c.nome}</h3>
        <p className={estilos.lugar}>
          {c.cidade} · <span className="mono">{c.uf}</span>
        </p>
        {/* A ressalva da linha fica JUNTO dela, não num rodapé: quem lê esta
            competição é quem precisa saber que a fonte se contradiz nela. */}
        {c.nota && <p className={estilos.nota}>{c.nota}</p>}
      </div>

      <span className={`mono ${estilos.selo} ${estilos[c.tipo] ?? ''}`}>
        {ROTULO_TIPO[c.tipo]}
      </span>
    </li>
  );
}

export function CompeticoesCliente() {
  const [hoje, setHoje] = useState<string | null>(null);
  useEffect(() => setHoje(hojeISO()), []);

  const conta = contarPorTipo(COMPETICOES);
  const anunciadas = ETAPAS_ANUNCIADAS as { ouro: number; prata: number; nota: string };
  const faltando = (['ouro', 'prata'] as const).filter((t) => conta[t] < anunciadas[t]);

  const partes = hoje ? partirCalendario(COMPETICOES, hoje) : null;

  return (
    <>
      {/* Quantas de cada tipo. Não é enfeite: é o que deixa a conta que não
          fecha ficar visível em vez de escondida numa lista de 23 linhas. */}
      <ul className={estilos.resumo}>
        {TIPOS.filter((t) => conta[t] > 0).map((t) => (
          <li key={t} className={estilos.resumoItem}>
            <span className={`mono ${estilos.resumoNumero}`}>{conta[t]}</span>
            <span className={estilos.resumoRotulo}>{ROTULO_TIPO[t]}</span>
            <span className={estilos.resumoExplica}>{EXPLICA_TIPO[t]}</span>
          </li>
        ))}
      </ul>

      {faltando.length > 0 && (
        <p className={estilos.contaNaoFecha} role="note">
          <strong>Uma conta não fecha, e preferimos dizer:</strong> a CBTM anunciou{' '}
          {faltando.map((t) => `${anunciadas[t]} etapas da ${ROTULO_TIPO[t]}`).join(' e ')}, mas o
          calendário oficial lista{' '}
          {faltando.map((t) => `${conta[t]}`).join(' e ')}. Se a etapa que falta ainda não foi
          definida ou se saiu do calendário, a fonte não diz — e nós não vamos adivinhar.
        </p>
      )}

      {partes === null ? (
        /* O que o build congela: a lista inteira, correta e sem rótulo de tempo. */
        <section className={estilos.grupo}>
          <ol className={estilos.lista}>
            {ordenarCompeticoes(COMPETICOES).map((c) => (
              <Linha key={`${c.nome}-${c.inicio}`} c={c} hoje={null} />
            ))}
          </ol>
        </section>
      ) : (
        <>
          {partes.agora.length > 0 && (
            <section className={estilos.grupo} aria-labelledby="g-agora">
              <h2 id="g-agora" className={estilos.grupoTitulo}>
                Acontecendo agora
              </h2>
              <ol className={estilos.lista}>
                {partes.agora.map((c) => (
                  <Linha key={`${c.nome}-${c.inicio}`} c={c} hoje={hoje} />
                ))}
              </ol>
            </section>
          )}

          <section className={estilos.grupo} aria-labelledby="g-vem">
            <h2 id="g-vem" className={estilos.grupoTitulo}>
              O que ainda vem em {new Date().getFullYear()}
            </h2>
            {partes.vem.length === 0 ? (
              <p className={estilos.vazio}>
                Acabou o calendário deste ano. A CBTM costuma publicar o do ano seguinte entre
                dezembro e janeiro — quando sair, esta página é atualizada.
              </p>
            ) : (
              <ol className={estilos.lista}>
                {partes.vem.map((c) => (
                  <Linha key={`${c.nome}-${c.inicio}`} c={c} hoje={hoje} />
                ))}
              </ol>
            )}
          </section>

          {partes.passou.length > 0 && (
            <section className={`${estilos.grupo} ${estilos.arquivo}`} aria-labelledby="g-passou">
              <h2 id="g-passou" className={estilos.grupoTitulo}>
                O que já aconteceu
              </h2>
              <p className={estilos.grupoNota}>
                Da mais recente para a mais antiga — arquivo se lê de trás pra frente.
              </p>
              <ol className={estilos.lista}>
                {partes.passou.map((c) => (
                  <Linha key={`${c.nome}-${c.inicio}`} c={c} hoje={hoje} />
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </>
  );
}
