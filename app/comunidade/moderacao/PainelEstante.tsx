/**
 * WikiPong · Moderação dos motivos da estante
 * ------------------------------------------------------------------------------
 * "Saí da Mark V pra Rakza 7 porque queria mais giro" é texto de terceiro sobre
 * um material, a mesma régua de uma avaliação (D-14) — nasce pendente e só fica
 * público depois de alguém ler. Material e período não passam por aqui: esses
 * são fato e já estão no ar assim que a pessoa cadastra (`EstanteEditor.tsx`).
 *
 * Sem estado próprio, como as outras abas: quem carrega e grava é a tela de
 * moderação, que precisa da contagem para o rótulo da aba.
 */
'use client';

import Link from 'next/link';
import { type MotivoParaModerar } from '@/src/logica/estante';
import { materialPorId } from '@/componentes/dados-materiais';
import { nomeComMarca } from '@/componentes/formato';
import estilos from './moderacao.module.css';

const ROTULO: Record<MotivoParaModerar['status'], string> = {
  pendente: 'esperando',
  aprovada: 'no ar',
  descartada: 'descartada',
};

const quando = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export function PainelEstante({
  motivos,
  erro,
  semServidor,
  aoAprovar,
  aoDescartar,
}: {
  motivos: MotivoParaModerar[] | null;
  erro: string | null;
  semServidor: boolean;
  aoAprovar: (id: string) => void;
  aoDescartar: (id: string) => void;
}) {
  if (semServidor) {
    return (
      <p className={estilos.vazio}>
        A estante vive no servidor da comunidade, e ele não está ligado nesta versão do site.
      </p>
    );
  }
  if (motivos === null) {
    return (
      <>
        {erro && <p className={estilos.impedidaTitulo}>{erro}</p>}
        <p className={estilos.carregando}>Carregando a estante…</p>
      </>
    );
  }
  if (motivos.length === 0) {
    return (
      <>
        {erro && <p className={estilos.impedidaTitulo}>{erro}</p>}
        <p className={estilos.vazio}>
          <strong>Nada na fila.</strong> Quando alguém escrever o motivo de uma troca em{' '}
          <Link href="/comunidade/perfil/">O que você já usou</Link>, o texto cai aqui esperando
          você — material e período já estão no ar, só o motivo espera.
        </p>
      </>
    );
  }

  const esperando = motivos.filter((m) => m.status === 'pendente').length;

  return (
    <>
      {erro && <p className={estilos.impedidaTitulo}>{erro}</p>}

      <p className={estilos.nota}>
        {esperando === 0
          ? 'Nada esperando você.'
          : `${esperando} ${esperando === 1 ? 'motivo espera' : 'motivos esperam'} sua leitura.`}{' '}
        É texto de terceiro sobre um material — a mesma régua das avaliações.
      </p>

      <ul className={estilos.lista}>
        {motivos.map((m) => {
          const material = materialPorId(m.materialId);
          return (
            <li
              key={m.id}
              className={`${estilos.item} ${m.status === 'descartada' ? estilos.removido : ''}`}
            >
              <div className={estilos.cabecalho}>
                <p className={estilos.autor}>
                  {material ? (
                    <Link href={`/materiais/${material.id}/`}>
                      {nomeComMarca(material.marca, material.nome)}
                    </Link>
                  ) : (
                    <span className={estilos.orfa}>material fora do catálogo ({m.materialId})</span>
                  )}
                </p>
                <span className={`mono ${estilos.situacao}`}>{ROTULO[m.status]}</span>
              </div>

              <p className={estilos.sobre}>
                escrito por <span className="mono">{m.usuarioId}</span> · {quando(m.criadoEm)}
              </p>

              <p className={estilos.texto}>{m.texto}</p>

              <div className={estilos.acoes}>
                {m.status !== 'aprovada' && (
                  <button type="button" className="botao-primario" onClick={() => aoAprovar(m.id)}>
                    Publicar
                  </button>
                )}
                {m.status !== 'descartada' && (
                  <button
                    type="button"
                    className="botao-secundario"
                    onClick={() => aoDescartar(m.id)}
                  >
                    Descartar
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
