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
 *   no build   sai a lista INTEIRA, agrupada por mês, sem rótulo de tempo. Está
 *              completa e correta — é o que o buscador lê e o que aparece se o
 *              script não carregar.
 *   no browser `hoje` chega de verdade e a lista se parte em acontecendo agora ·
 *              o que vem · o que já passou.
 *
 * Por isso `hoje` começa `null` e só é preenchido depois da montagem: a primeira
 * pintura do cliente é IGUAL à do servidor, e não há divergência de hidratação.
 *
 * ── POR QUE AGRUPADO POR MÊS ─────────────────────────────────────────────────
 * Porque é assim que se pergunta ("o que tem em setembro?"). A primeira versão
 * era uma lista corrida de 23 linhas: pra descobrir onde um mês acabava e outro
 * começava, era preciso ler data por data.
 */
'use client';

import { useEffect, useState } from 'react';
import {
  partirCalendario, ordenarCompeticoes, porMes, periodo, diasAte, contarPorTipo,
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

const chaveDe = (c: Competicao) => `${c.inicio}-${c.nome}`;

function Linha({
  c,
  hoje,
  proxima = false,
}: {
  c: Competicao;
  hoje: string | null;
  /** A primeira que ainda vem. Ganha peso porque é a pergunta da página. */
  proxima?: boolean;
}) {
  const faltam = hoje ? diasAte(c, hoje) : null;

  return (
    <li className={proxima ? `${estilos.item} ${estilos.itemProxima}` : estilos.item}>
      <div className={estilos.quando}>
        <span className={`mono ${estilos.periodo}`}>{periodo(c)}</span>
        {faltam !== null && faltam > 0 && (
          <span className={estilos.contagem}>
            {faltam === 1 ? 'amanhã' : `em ${faltam} dias`}
          </span>
        )}
      </div>

      <div className={estilos.corpo}>
        {proxima && <span className={`mono ${estilos.seloProxima}`}>a próxima</span>}
        <h3 className={estilos.nome}>{c.nome}</h3>
        <p className={estilos.lugar}>
          {c.cidade}
          <span className={`mono ${estilos.uf}`}>{c.uf}</span>
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

/** Um bloco de meses. `destaque` marca a primeira competição da primeira lista. */
function Meses({
  competicoes,
  hoje,
  destaque = false,
}: {
  competicoes: Competicao[];
  hoje: string | null;
  destaque?: boolean;
}) {
  const primeira = destaque ? competicoes[0] : undefined;
  return (
    <>
      {porMes(competicoes).map((mes) => (
        <div key={mes.chave} className={estilos.mes}>
          <h3 className={estilos.mesRotulo}>{mes.rotulo}</h3>
          <ol className={estilos.lista}>
            {mes.competicoes.map((c) => (
              <Linha key={chaveDe(c)} c={c} hoje={hoje} proxima={c === primeira} />
            ))}
          </ol>
        </div>
      ))}
    </>
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
      {/* A legenda dos tipos. Não é tira de métricas: a contagem é pequena e
          serve de âncora; o que ocupa a linha é o que cada série SIGNIFICA —
          que é a dúvida real de quem nunca disputou uma Copa Brasil. */}
      <section className={estilos.legenda} aria-labelledby="l-tipos">
        <h2 id="l-tipos" className="apenas-leitor">
          Os tipos de competição
        </h2>
        <dl className={estilos.legendaLista}>
          {TIPOS.filter((t) => conta[t] > 0).map((t) => (
            <div key={t} className={estilos.legendaItem}>
              <dt className={estilos.legendaTermo}>
                <span className={`mono ${estilos.selo} ${estilos[t] ?? ''}`}>
                  {ROTULO_TIPO[t]}
                </span>
                <span className={`mono ${estilos.legendaConta}`}>
                  {conta[t]} {conta[t] === 1 ? 'etapa' : 'etapas'}
                </span>
              </dt>
              <dd className={estilos.legendaTexto}>{EXPLICA_TIPO[t]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {faltando.length > 0 && (
        <p className={estilos.contaNaoFecha} role="note">
          <strong>Uma conta não fecha, e preferimos dizer:</strong> a CBTM anunciou{' '}
          {faltando.map((t) => `${anunciadas[t]} etapas da ${ROTULO_TIPO[t]}`).join(' e ')}, mas o
          calendário oficial lista {faltando.map((t) => `${conta[t]}`).join(' e ')}. Se a etapa que
          falta ainda não foi definida ou se saiu do calendário, a fonte não diz — e nós não vamos
          adivinhar.
        </p>
      )}

      {partes === null ? (
        /* O que o build congela: o ano inteiro, por mês, sem rótulo de tempo. */
        <section className={estilos.grupo}>
          <Meses competicoes={ordenarCompeticoes(COMPETICOES)} hoje={null} />
        </section>
      ) : (
        <>
          {partes.agora.length > 0 && (
            <section className={estilos.grupo} aria-labelledby="g-agora">
              <h2 id="g-agora" className={estilos.grupoTitulo}>
                Acontecendo agora
              </h2>
              <Meses competicoes={partes.agora} hoje={hoje} />
            </section>
          )}

          <section className={estilos.grupo} aria-labelledby="g-vem">
            <h2 id="g-vem" className={estilos.grupoTitulo}>
              O que ainda vem
            </h2>
            {partes.vem.length === 0 ? (
              <p className={estilos.vazio}>
                Acabou o calendário deste ano. A CBTM costuma publicar o do ano seguinte entre
                dezembro e janeiro — quando sair, esta página é atualizada.
              </p>
            ) : (
              <Meses competicoes={partes.vem} hoje={hoje} destaque />
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
              <Meses competicoes={partes.passou} hoje={hoje} />
            </section>
          )}
        </>
      )}
    </>
  );
}
