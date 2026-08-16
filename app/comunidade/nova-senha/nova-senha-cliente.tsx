/**
 * WikiPong · Definir uma senha nova
 * ------------------------------------------------------------------------------
 * Esta tela é o destino do link de recuperação, e ela existe por obrigação: sem
 * ela, senha esquecida vira conta perdida — e o custo de ter senha teria sido
 * pago sem o benefício.
 *
 * COMO A PESSOA CHEGA AQUI COM PERMISSÃO DE TROCAR: o link do e-mail volta com
 * os tokens no fragmento (`#access_token=…`), e `capturarDaURL` — chamada por
 * `usarSessao` — transforma isso em sessão e LIMPA a barra de endereço. Não há
 * "código de recuperação" próprio: a sessão é a permissão.
 *
 * SERVE PRA MAIS DE UM CASO, e todos são o mesmo por dentro:
 *   · esqueci a senha         → veio pelo link
 *   · quero trocar a senha    → já estava logado, entrou pelo perfil
 *   · entro por link e quero  → a conta existe e não tinha senha; isto dá uma
 *     passar a ter senha
 *
 * DOIS CAMPOS, e não um: aqui o navegador não tem senha antiga pra comparar e
 * ninguém relê o que digitou às cegas. Um erro de digitação sem confirmação
 * tranca a pessoa fora da conta que ela acabou de recuperar.
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trocarSenha, SENHA_MINIMA } from '@/src/logica/sessao';
import { repositorioPerfilAtual, temIdentidade } from '@/src/logica/perfil';
import { usarSessao } from '@/componentes/usarSessao';
import estilos from './nova-senha.module.css';

export function NovaSenhaCliente() {
  const router = useRouter();
  const { usuario, carregando, disponivel } = usarSessao();

  const [senha, setSenha] = useState('');
  const [repetida, setRepetida] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [estado, setEstado] = useState<'parado' | 'enviando' | 'erro' | 'pronto'>('parado');
  const [erro, setErro] = useState('');
  const [recusaDoLink, setRecusaDoLink] = useState('');

  /* Link vencido ou já usado volta com `error_description` no fragmento, e sem
     token nenhum. Sem ler isso, a tela diria só "não estou vendo sua sessão" —
     verdade, mas inútil: a pessoa não descobriria que o problema foi o link.
     `capturarDaURL` só limpa a barra quando ACHA token, então o fragmento de
     erro continua aqui pra ser lido. */
  useEffect(() => {
    const p = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const desc = p.get('error_description');
    if (!desc) return;
    setRecusaDoLink(
      /expired/i.test(desc)
        ? 'Este link já venceu. Eles valem por pouco tempo, de propósito — peça outro e use assim que chegar.'
        : 'Este link não vale mais. Links de recuperação funcionam uma vez só; se você já clicou nele antes, peça outro.',
    );
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  if (!disponivel) {
    return (
      <div className={estilos.quadro}>
        <h1 className={estilos.titulo}>Senha</h1>
        <p className={estilos.explica}>
          O login depende do servidor, que ainda não está ligado.
        </p>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className={estilos.quadro}>
        <p className={estilos.carregando}>Conferindo o link…</p>
      </div>
    );
  }

  /* Sem sessão não há o que autorizar a troca. Dizer isso e oferecer a saída
     vale mais que um formulário que vai falhar depois de digitado. */
  if (!usuario) {
    return (
      <div className={estilos.quadro}>
        <h1 className={estilos.titulo}>Este link não abre mais</h1>
        <p className={estilos.explica}>
          {recusaDoLink ||
            'Não encontrei uma sessão válida nesta página. Ou o link já venceu, ou ele já foi usado — em qualquer dos casos, pedir outro resolve.'}
        </p>
        <Link href="/comunidade/entrar/?modo=esqueci" className="botao-primario">
          Pedir outro link
        </Link>
      </div>
    );
  }

  if (estado === 'pronto') {
    return (
      <div className={estilos.quadro}>
        <h1 className={estilos.titulo}>Senha trocada.</h1>
        <p className={estilos.explica}>
          A partir de agora é essa que vale para <strong>{usuario.email}</strong>. Você continua
          entrado neste aparelho — não precisa entrar de novo.
        </p>
        <div className={estilos.acoes}>
          <button
            type="button"
            className="botao-primario"
            onClick={async () => {
              /* A mesma porteira da tela de entrar: quem ainda não tem perfil
                 vai montar o dele, não cair no formulário de oito campos. */
              const perfil = await (await repositorioPerfilAtual()).ler();
              router.replace(
                temIdentidade(perfil) ? '/comunidade/perfil/' : '/comunidade/boas-vindas/',
              );
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.length < SENHA_MINIMA) {
      setErro(`A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`);
      setEstado('erro');
      return;
    }
    if (senha !== repetida) {
      setErro('As duas senhas não são iguais. Confira a segunda.');
      setEstado('erro');
      return;
    }
    setEstado('enviando');
    try {
      await trocarSenha(senha);
      setEstado('pronto');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu pra trocar a senha agora.');
      setEstado('erro');
    }
  };

  return (
    <div className={estilos.quadro}>
      <h1 className={estilos.titulo}>Escolha uma senha nova</h1>
      <p className={estilos.explica}>
        Para a conta de <strong>{usuario.email}</strong>. Depois disto, o link que te trouxe
        aqui deixa de funcionar.
      </p>

      <form className={estilos.form} noValidate onSubmit={enviar}>
        <label className={estilos.campo}>
          <span className={estilos.rotulo}>Senha nova</span>
          <span className={estilos.comBotao}>
            <input
              type={mostrar ? 'text' : 'password'}
              value={senha}
              autoFocus
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
              aria-invalid={estado === 'erro'}
            />
            <button
              type="button"
              className={estilos.verSenha}
              onClick={() => setMostrar((v) => !v)}
              aria-pressed={mostrar}
            >
              {mostrar ? 'ocultar' : 'ver'}
            </button>
          </span>
          <span className={estilos.regra}>
            Pelo menos {SENHA_MINIMA} caracteres. Não há outra exigência — nada de símbolo
            obrigatório nem de letra maiúscula. Se o servidor pedir mais, ele diz quanto.
          </span>
        </label>

        <label className={estilos.campo}>
          <span className={estilos.rotulo}>Repita a senha</span>
          <input
            type={mostrar ? 'text' : 'password'}
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
            autoComplete="new-password"
            aria-invalid={estado === 'erro'}
          />
        </label>

        {estado === 'erro' && (
          <p className={estilos.erro} role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="botao-primario" disabled={estado === 'enviando'}>
          {estado === 'enviando' ? 'Trocando…' : 'Definir esta senha'}
        </button>
      </form>
    </div>
  );
}
