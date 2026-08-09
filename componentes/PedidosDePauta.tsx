/**
 * WikiPong · "O que falta aqui?" — pedidos de pauta no fim do /aprender
 * ------------------------------------------------------------------------------
 * Fica DEPOIS da lista de guias, e isso é regra do D-14, não gosto: em cima, o
 * que a WikiPong afirma; embaixo, o que os leitores pedem. Misturar pedido com
 * guia publicado seria vender vontade como conteúdo.
 *
 * A tela é fechada por padrão. Um formulário aberto no fim de toda visita ao
 * /aprender é ruído para quem só veio ler; quem quer pedir aperta um botão.
 *
 * O que a tela promete, ela cumpre:
 *  · diz onde o pedido vai ANTES de a pessoa digitar (lê `somenteLocal`, não
 *    tem a frase escrita na mão);
 *  · mostra os pedidos parecidos enquanto se escreve o tema, para quem quiser
 *    somar voz a um pedido existente em vez de abrir o décimo igual;
 *  · quando o pedido virou guia, aponta para o guia. É a prova de que pedir
 *    adianta, e sem ela a seção é uma caixa de sugestões que ninguém lê.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  validarPedido, parecidos, ordenarPedidos, atendidos, aprovados,
  repositorioPedidos, novoIdPedido,
  TEMA_MAXIMO, DETALHE_MAXIMO,
  type PedidoDePauta, type ProblemaPedido, type OrdemPedido,
} from '@/src/logica/pedidos-pauta';
import { GUIAS } from '@/app/aprender/guias';
import estilos from './PedidosDePauta.module.css';

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

const tituloDoGuia = (slug: string) => GUIAS.find((g) => g.slug === slug)?.titulo;

export function PedidosDePauta() {
  const repo = useMemo(() => repositorioPedidos(), []);
  /* null = ainda carregando. Lista vazia e lista não-carregada dizem coisas
     diferentes, e a tela mostra coisas diferentes para cada uma. */
  const [lista, setLista] = useState<PedidoDePauta[] | null>(null);
  const [ordem, setOrdem] = useState<OrdemPedido>('recentes');
  const [aberto, setAberto] = useState(false);

  const [tema, setTema] = useState('');
  const [detalhe, setDetalhe] = useState('');
  const [autor, setAutor] = useState('');
  const [problemas, setProblemas] = useState<ProblemaPedido[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    /* `aprovados` aqui e não só no banco, de propósito. A RLS já filtra para o
       visitante, mas devolve o pendente para quem está logado como moderador —
       e o moderador abrindo /aprender veria, na lista pública, pedido que o
       público não vê. A tela pública mostra o que é público, em qualquer papel. */
    repo.listar().then((todos) => setLista(aprovados(todos))).catch(() => setLista([]));
  }, [repo]);

  const semelhantes = useMemo(
    () => (lista ? parecidos(lista, tema) : []),
    [lista, tema],
  );
  const quantosAtendidos = lista ? atendidos(lista).length : 0;

  const erroDe = (campo: ProblemaPedido['campo']) =>
    problemas.find((p) => p.campo === campo)?.mensagem;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const rascunho = { tema: tema.trim(), detalhe: detalhe.trim(), autor: autor.trim() };
    const achados = validarPedido(rascunho);
    setProblemas(achados);
    if (achados.length > 0) return;

    setEnviando(true);
    setAviso(null);
    try {
      await repo.gravar({
        id: novoIdPedido(),
        ...rascunho,
        detalhe: rascunho.detalhe || undefined,
        criadoEm: new Date().toISOString(),
        status: 'pendente',
      });
      setTema('');
      setDetalhe('');
      setAviso({
        tipo: 'ok',
        texto: repo.somenteLocal
          ? 'Pedido guardado neste navegador. Como o site ainda não está ligado ao servidor, ele não saiu daqui.'
          : 'Pedido recebido. Ele aparece na lista depois de lido — e se virar guia, o link volta pra cá.',
      });
      /* Recarrega em vez de inserir na mão: o pedido nasce pendente e NÃO deve
         aparecer na lista pública. Fingir que apareceu seria a tela mentindo
         sobre a própria moderação. */
      repo.listar().then((todos) => setLista(aprovados(todos))).catch(() => undefined);
    } catch {
      setAviso({
        tipo: 'erro',
        texto: 'Não consegui enviar seu pedido agora. Tente de novo em alguns minutos.',
      });
    } finally {
      setEnviando(false);
    }
  }

  const visiveis = lista ? ordenarPedidos(lista, ordem) : [];

  return (
    <section className={estilos.secao} aria-labelledby="pedidos-titulo">
      <div className={estilos.cabeca}>
        <h2 id="pedidos-titulo" className={estilos.titulo}>
          Falta um guia sobre o quê?
        </h2>
        <p className={estilos.lede}>
          Os guias daqui nascem de dúvida real. Diga o tema que você queria ver explicado — em
          português, do jeito que você perguntaria pra um amigo.
        </p>
      </div>

      {repo.somenteLocal && (
        <p className={estilos.avisoLocal}>
          <strong>Isto ainda não sai do seu navegador.</strong> O servidor da comunidade não está
          ligado nesta versão do site, então seu pedido fica guardado só aqui, pra você.
        </p>
      )}

      {/* Aberto vira secundário: o botão deixa de ser a ação principal da seção
          no instante em que o formulário aparece. Mesmo par do /materiais. */}
      <button
        type="button"
        className={`${aberto ? 'botao-secundario' : 'botao-primario'} ${estilos.botaoAbrir}`}
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      >
        {aberto ? 'Fechar' : 'Pedir um guia'}
      </button>

      {aviso && (
        <p
          className={aviso.tipo === 'ok' ? estilos.avisoOk : estilos.avisoErro}
          role={aviso.tipo === 'ok' ? 'status' : 'alert'}
        >
          {aviso.texto}
        </p>
      )}

      {aberto && (
        <form className={estilos.form} onSubmit={enviar} noValidate>
          <label className={estilos.campo}>
            <span className={estilos.rotulo}>O que você quer aprender?</span>
            <input
              className={estilos.entrada}
              value={tema}
              maxLength={TEMA_MAXIMO + 40}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex.: como saber a hora de trocar a borracha"
              aria-invalid={Boolean(erroDe('tema'))}
              aria-describedby={erroDe('tema') ? 'erro-tema' : undefined}
            />
            {erroDe('tema') && (
              <span id="erro-tema" className={estilos.erro} role="alert">
                {erroDe('tema')}
              </span>
            )}
          </label>

          {semelhantes.length > 0 && (
            <div className={estilos.parecidos} role="status">
              <p className={estilos.parecidosTitulo}>Já pediram algo parecido:</p>
              <ul className={estilos.parecidosLista}>
                {semelhantes.map((p) => (
                  <li key={p.id}>
                    {p.tema}
                    {p.guiaSlug && tituloDoGuia(p.guiaSlug) && (
                      <>
                        {' — '}
                        <Link href={`/aprender/${p.guiaSlug}/`}>já virou guia</Link>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <p className={estilos.parecidosNota}>
                Pode pedir mesmo assim. Tema repetido não é problema: é o sinal de que muita gente
                quer o mesmo.
              </p>
            </div>
          )}

          <label className={estilos.campo}>
            <span className={estilos.rotulo}>
              Quer detalhar? <span className={estilos.opcional}>opcional</span>
            </span>
            <textarea
              className={estilos.area}
              value={detalhe}
              rows={3}
              maxLength={DETALHE_MAXIMO}
              onChange={(e) => setDetalhe(e.target.value)}
              placeholder="O que te confunde hoje, ou onde você travou. Ajuda a escrever o guia certo."
              aria-invalid={Boolean(erroDe('detalhe'))}
            />
            {erroDe('detalhe') && (
              <span className={estilos.erro} role="alert">
                {erroDe('detalhe')}
              </span>
            )}
          </label>

          <label className={estilos.campo}>
            <span className={estilos.rotulo}>Como quer assinar?</span>
            <input
              className={estilos.entrada}
              value={autor}
              maxLength={60}
              onChange={(e) => setAutor(e.target.value)}
              placeholder="Seu nome ou apelido"
              aria-invalid={Boolean(erroDe('autor'))}
              aria-describedby={erroDe('autor') ? 'erro-autor' : undefined}
            />
            {erroDe('autor') && (
              <span id="erro-autor" className={estilos.erro} role="alert">
                {erroDe('autor')}
              </span>
            )}
          </label>

          <div className={estilos.acoes}>
            <button type="submit" className="botao-primario" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar pedido'}
            </button>
            <p className={estilos.notaModeracao}>
              Todo pedido é lido antes de aparecer na lista.
            </p>
          </div>
        </form>
      )}

      {lista !== null && lista.length > 0 && (
        <>
          <div className={estilos.barraLista}>
            <h3 className={estilos.subtitulo}>
              {lista.length === 1 ? '1 pedido' : `${lista.length} pedidos`}
              {quantosAtendidos > 0 && (
                <span className={`mono ${estilos.contagemAtendidos}`}>
                  {quantosAtendidos} já {quantosAtendidos === 1 ? 'virou guia' : 'viraram guia'}
                </span>
              )}
            </h3>
            <label className={estilos.ordem}>
              <span className="apenas-leitor">Ordenar pedidos</span>
              <select value={ordem} onChange={(e) => setOrdem(e.target.value as OrdemPedido)}>
                <option value="recentes">Mais recentes</option>
                <option value="atendidos">Atendidos primeiro</option>
              </select>
            </label>
          </div>

          <ul className={estilos.lista}>
            {visiveis.map((p) => {
              const titulo = p.guiaSlug ? tituloDoGuia(p.guiaSlug) : undefined;
              return (
                <li key={p.id} className={p.guiaSlug ? estilos.itemAtendido : estilos.item}>
                  <p className={estilos.tema}>{p.tema}</p>
                  {p.detalhe && <p className={estilos.detalhe}>{p.detalhe}</p>}
                  <p className={estilos.meta}>
                    <span className={estilos.autorLinha}>{p.autor}</span>
                    <span className={`mono ${estilos.data}`}>{dataCurta(p.criadoEm)}</span>
                  </p>
                  {p.guiaSlug && titulo && (
                    <Link href={`/aprender/${p.guiaSlug}/`} className={estilos.virouGuia}>
                      Virou guia: {titulo}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {lista !== null && lista.length === 0 && !aberto && (
        <p className={estilos.vazio}>
          Nenhum pedido ainda. O seu pode ser o primeiro.
        </p>
      )}
    </section>
  );
}
