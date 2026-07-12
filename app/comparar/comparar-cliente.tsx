'use client';

/**
 * WikiPong · /comparar — o destino do componente Radar (overlay de 2 polígonos, D-15).
 *
 * D-12: os materiais comparados vivem na URL (?ids=a,b) — compartilhável, back-button
 * grátis. Sem ids (ou com ids inválidos), a página diz a verdade (D-16) e oferece o
 * seletor; nunca finge uma comparação.
 *
 * D-09 na tabela: destaque do MAIOR por linha é fato ("maior ≠ melhor"), preço não
 * recebe destaque, e toda derivada leva asterisco + nota A VALIDAR.
 * O radar é aria-hidden; a tabela ao lado é a alternativa acessível.
 */
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { indicesDoMaximo, paraPalavra, perdao } from '@/src/logica/metricas';
import { MATERIAIS, materialPorId, type MaterialCatalogo } from '@/componentes/dados-materiais';
import { brl } from '@/componentes/formato';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { Radar } from '@/componentes/Radar';
import { Glifo } from '@/componentes/Glifo';
import { Bolinhas } from '@/componentes/Bolinhas';
import { SeletorModo } from '@/componentes/SeletorModo';
import { usarModo } from '@/componentes/usarModo';
import estilos from './comparar.module.css';

const EIXOS = ['VEL', 'EFE', 'CTR', 'DUR'] as const;

export function ComparadorCliente() {
  const parametros = useSearchParams();
  const [modo, mudarModo] = usarModo(parametros.get('modo'));

  const idsURL = (parametros.get('ids') ?? '').split(',').filter(Boolean);
  const encontrados = idsURL.map(materialPorId).filter((m): m is MaterialCatalogo => m !== undefined);
  const desconhecidos = idsURL.filter((id) => !materialPorId(id));
  const prontos = encontrados.length === 2 ? (encontrados as [MaterialCatalogo, MaterialCatalogo]) : null;

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <div className={estilos.topo}>
          <h1 className={estilos.titulo}>
            {prontos ? `${prontos[0].nome} × ${prontos[1].nome}` : 'Comparar materiais'}
          </h1>
          {prontos && <SeletorModo modo={modo} aoMudar={mudarModo} />}
        </div>

        {desconhecidos.length > 0 && (
          <p className={estilos.aviso} role="alert">
            Não encontramos no catálogo: <code className="mono">{desconhecidos.join(', ')}</code>.
          </p>
        )}

        {prontos ? <Comparacao par={prontos} modo={modo} /> : <Seletor preSelecionados={encontrados} />}
      </main>

      <Rodape />
    </>
  );
}

/** Estado vazio/parcial honesto (D-16): explica e resolve, sem comparação fingida. */
function Seletor({ preSelecionados }: { preSelecionados: MaterialCatalogo[] }) {
  const [escolhidos, setEscolhidos] = useState<string[]>(preSelecionados.map((m) => m.id));

  const alternar = (id: string) =>
    setEscolhidos((atual) =>
      atual.includes(id) ? atual.filter((e) => e !== id) : atual.length < 2 ? [...atual, id] : atual,
    );

  const comparar = () => {
    window.history.pushState(null, '', `?ids=${escolhidos.join(',')}`);
  };

  return (
    <section aria-label="Escolher materiais">
      <p className={estilos.instrucao}>
        Escolha <b>dois</b> materiais do catálogo — a comparação abre com radar sobreposto e
        tabela de métricas ({escolhidos.length}/2 selecionados).
      </p>
      <ul className={estilos.listaEscolha}>
        {MATERIAIS.map((m) => {
          const marcado = escolhidos.includes(m.id);
          const bloqueado = !marcado && escolhidos.length >= 2;
          return (
            <li key={m.id}>
              <label className={`${estilos.itemEscolha} ${marcado ? estilos.itemMarcado : ''}`}>
                <input
                  type="checkbox"
                  checked={marcado}
                  disabled={bloqueado}
                  onChange={() => alternar(m.id)}
                />
                <Glifo tipo={m.tipo} tamanho={40} />
                <span>
                  <b>{m.nome}</b>
                  <span className={`mono ${estilos.metaEscolha}`}>
                    {m.marca} · {m.tipo}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className={estilos.ctaComparar}
        disabled={escolhidos.length !== 2}
        onClick={comparar}
      >
        Comparar selecionados →
      </button>
    </section>
  );
}

function Comparacao({ par, modo }: { par: [MaterialCatalogo, MaterialCatalogo]; modo: 'simples' | 'tecnico' }) {
  const [a, b] = par;
  const perdoes = [perdao(a.specs, a.durezaUnificada), perdao(b.specs, b.durezaUnificada)];

  const linhas: {
    rotulo: string;
    valores: [number, number];
    atributo: 'velocidade' | 'spin' | 'controle' | 'perdao' | null;
    destacar: boolean;
    formato: (v: number) => string;
  }[] = [
    { rotulo: 'Velocidade', valores: [a.specs.velocidade, b.specs.velocidade], atributo: 'velocidade', destacar: true, formato: (v) => v.toFixed(1) },
    { rotulo: modo === 'simples' ? 'Efeito' : 'Spin', valores: [a.specs.spin, b.specs.spin], atributo: 'spin', destacar: true, formato: (v) => v.toFixed(1) },
    { rotulo: 'Controle', valores: [a.specs.controle, b.specs.controle], atributo: 'controle', destacar: true, formato: (v) => v.toFixed(1) },
    { rotulo: 'Durabilidade', valores: [a.durabilidade, b.durabilidade], atributo: null, destacar: true, formato: (v) => v.toFixed(1) },
    { rotulo: 'Perdão*', valores: [perdoes[0], perdoes[1]] as [number, number], atributo: 'perdao', destacar: true, formato: (v) => v.toFixed(1) },
    // D-09: preço sem destaque (a convenção marca o maior; no preço, maior é pior).
    { rotulo: 'Preço médio', valores: [a.preco, b.preco], atributo: null, destacar: false, formato: brl },
  ];

  const trocar = () => window.history.pushState(null, '', window.location.pathname);

  return (
    <>
      <div className={estilos.palcoComparacao}>
        <div className={estilos.radarCaixa}>
          <Radar
            eixos={EIXOS}
            series={[
              { nome: a.nome, valores: [a.specs.velocidade, a.specs.spin, a.specs.controle, a.durabilidade], variante: 'tracejada' },
              { nome: b.nome, valores: [b.specs.velocidade, b.specs.spin, b.specs.controle, b.durabilidade], variante: 'solida' },
            ]}
            animado
          />
        </div>

        <div className={estilos.tabelaWrap}>
          <table className={estilos.tabela}>
            <thead>
              <tr>
                <th scope="col">Métrica</th>
                {[a, b].map((m) => (
                  <th scope="col" key={m.id}>
                    {m.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => {
                const maximos = linha.destacar ? indicesDoMaximo([...linha.valores]) : [];
                return (
                  <tr key={linha.rotulo}>
                    <th scope="row" className={estilos.atributo}>
                      {linha.rotulo}
                    </th>
                    {linha.valores.map((valor, i) => {
                      const ehMaximo = maximos.includes(i);
                      return (
                        <td key={i}>
                          {modo === 'tecnico' || !linha.atributo ? (
                            <span className={`mono ${estilos.valor} ${ehMaximo ? estilos.maximo : ''}`}>
                              {linha.formato(valor)}
                              {ehMaximo && <span className={estilos.tagMaior}>maior</span>}
                            </span>
                          ) : (
                            <span className={`${estilos.valorSimples} ${ehMaximo ? estilos.maximo : ''}`}>
                              <Bolinhas valor={valor} />
                              <span>{paraPalavra(linha.atributo, valor)}</span>
                              {ehMaximo && <span className={estilos.tagMaior}>maior</span>}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className={estilos.nota}>
        * Perdão é métrica derivada com fórmula aberta (proposta v1, pendente de validação do
        especialista — D-09). Destaque de “maior” é <strong>fato, não veredito</strong>: maior ≠
        melhor, depende do seu jogo.
      </p>

      <button type="button" className={estilos.trocar} onClick={trocar}>
        ← Escolher outros materiais
      </button>
    </>
  );
}
